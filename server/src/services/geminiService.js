import { GoogleGenAI } from '@google/genai';

class GeminiService {
    constructor() {
        const parseKeyList = (value) => {
            if (!value || typeof value !== 'string') return [];
            return value
                .split(',')
                .map((k) => k.trim())
                .filter(Boolean);
        };

        // Prefer GEMINI_API_KEYS (comma-separated) but keep backward compatibility with GEMINI_API_KEY.
        this.apiKeys = parseKeyList(process.env.GEMINI_API_KEYS);
        if (this.apiKeys.length === 0 && process.env.GEMINI_API_KEY) {
            this.apiKeys = [String(process.env.GEMINI_API_KEY).trim()].filter(Boolean);
        }

        this.clients = this.apiKeys.map((apiKey) => new GoogleGenAI({ apiKey }));
        this._nextClientIndex = 0;
        this.model = 'gemini-2.5-flash';

        if (this.clients.length === 0) {
            console.warn('GEMINI_API_KEY(S) not set. AI features will be disabled.');
        }
    }

    get hasAI() {
        return this.clients.length > 0;
    }

    normalizePreferredKeyIndex(value) {
        if (value === undefined || value === null) return null;
        const parsed = typeof value === 'number' ? value : parseInt(String(value), 10);
        if (!Number.isFinite(parsed)) return null;
        if (!this.hasAI) return null;
        const count = this.clients.length;
        // Proper modulo for negative values
        const normalized = ((parsed % count) + count) % count;
        return normalized;
    }

    getClientOrder(preferredKeyIndex) {
        const count = this.clients.length;
        if (count === 0) return [];

        const preferred = this.normalizePreferredKeyIndex(preferredKeyIndex);
        const start = preferred !== null ? preferred : (this._nextClientIndex % count);

        // Round-robin for calls that don't specify a preferred index
        if (preferred === null) {
            this._nextClientIndex = (start + 1) % count;
        }

        const order = [];
        for (let i = 0; i < count; i++) {
            order.push((start + i) % count);
        }
        return order;
    }

    async makeRequestWithRetry(operation, { maxRetries = 3, preferredKeyIndex } = {}) {
        const getStatus = (err) => err?.status ?? err?.response?.status;
        const getMessage = (err) => String(err?.message ?? '');
        const isQuotaExceeded429 = (err) => {
            const status = getStatus(err);
            if (status !== 429) return false;
            const msg = getMessage(err);
            return (
                msg.includes('Quota exceeded') ||
                msg.includes('RESOURCE_EXHAUSTED') ||
                msg.includes('RATE_LIMIT_EXCEEDED')
            );
        };

        if (!this.hasAI) {
            const e = new Error('AI service not initialized');
            e.status = 503;
            e.userMessage = 'AI features are disabled on the server.';
            throw e;
        }

        const isAuthError = (status) => status === 401 || status === 403;
        const isRetryableStatus = (status) => {
            if (!status) return false;
            return [408, 429, 500, 502, 503, 504].includes(status);
        };

        let lastError;

        for (let attempt = 0; attempt < maxRetries; attempt++) {
            const order = this.getClientOrder(preferredKeyIndex);
            for (const clientIndex of order) {
                const ai = this.clients[clientIndex];
                try {
                    return await operation(ai);
                } catch (error) {
                    lastError = error;

                    // If Gemini quota is exceeded, rotating keys won't help (often shows quota_limit_value 0)
                    if (isQuotaExceeded429(error)) {
                        const e = new Error('Gemini quota exceeded');
                        e.status = 429;
                        e.userMessage = 'AI is temporarily unavailable (Gemini quota exceeded). Try again later or increase your Gemini quota.';
                        throw e;
                    }

                    const status = getStatus(error);

                    // Auth/key issues: immediately try next key
                    if (isAuthError(status)) {
                        continue;
                    }

                    // Rate limit: try next key; if all keys are rate-limited, we backoff in the outer loop
                    if (status === 429) {
                        continue;
                    }

                    // Transient server/network-ish errors: backoff + retry (outer loop)
                    if (isRetryableStatus(status) && attempt < maxRetries - 1) {
                        break;
                    }

                    throw error;
                }
            }

            // Backoff between retry rounds (helps when all keys hit 429 temporarily)
            if (attempt < maxRetries - 1) {
                const delay = Math.min(8000, Math.pow(2, attempt) * 1000 + (Math.random() * 500));
                console.warn(`Gemini request retrying in ${Math.round(delay)}ms...`);
                await new Promise((resolve) => setTimeout(resolve, delay));
            }
        }

        throw lastError;
    }

    cleanJson(text) {
        try {
            // First try simple markdown cleanup
            const simple = text.replace(/```json/g, '').replace(/```/g, '').trim();
            return JSON.parse(simple);
        } catch (e) {
            // If that fails, try to find the first '{' and last '}' or '[' and ']'
            const firstBrace = text.indexOf('{');
            const lastBrace = text.lastIndexOf('}');
            const firstBracket = text.indexOf('[');
            const lastBracket = text.lastIndexOf(']');

            let start = -1;
            let end = -1;

            if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
                start = firstBrace;
                end = lastBrace;
            } else if (firstBracket !== -1) {
                start = firstBracket;
                end = lastBracket;
            }

            if (start !== -1 && end !== -1) {
                const substring = text.substring(start, end + 1);
                return JSON.parse(substring);
            }
            throw new Error(`Failed to parse JSON from AI response: ${text.substring(0, 100)}...`);
        }
    }

    async generateReviewDraft(movieTitle, rating, genres, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Write a short, engaging movie review for "${movieTitle}" (Genres: ${genres.join(', ')}). 
            The rating is ${rating}/5. 
            Keep it under 100 words. 
            Focus on why someone might give this rating.
            Do not include spoilers.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return response.text;
        }, { preferredKeyIndex });
    }

    async expandThoughts(bulletPoints, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Expand these bullet points into a cohesive movie review paragraph. 
            Maintain the original tone.
            
            Bullet points:
            ${bulletPoints}
            
            Output only the paragraph.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return response.text;
        }, { preferredKeyIndex });
    }

    async removeSpoilers(reviewText, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Rewrite the following movie review to remove any major plot spoilers while keeping the sentiment and opinion intact.
            If there are no spoilers, return the text as is.
            
            Review:
            "${reviewText}"`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return response.text;
        }, { preferredKeyIndex });
    }

    async analyzeSentiment(text, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Analyze the sentiment of this movie review.
            Return a JSON object with:
            - sentiment: "positive", "negative", or "neutral"
            - score: number between 0 (negative) and 100 (positive)
            - keyPhrases: array of strings (top 3 phrases)
            
            Review:
            "${text}"
            
            Return ONLY the JSON.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }

    async suggestTags(reviewText, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Suggest 5 relevant tags for this movie review. 
            Tags should be single words or short phrases (max 2 words).
            Return purely a JSON array of strings.
            
            Review:
            "${reviewText}"`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }

    async parseNaturalQuery(query, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Parse this natural language movie/TV search query into structured search parameters.
            Query: "${query}"
            
            Return a JSON object with:
            - type: "movie", "tv", or "mixed"
            - genres: array of genre strings (e.g. "Action", "Comedy")
            - yearRange: { start: number, end: number } or null
            - rating: { min: number } or null
            - keywords: array of strings
            - sortBy: "popularity.desc", "vote_average.desc", "primary_release_date.desc"
            - mood: string (inferred mood if any)
            
            Return ONLY the JSON.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }

    async findSimilarMovies(movieTitle, modifier, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Suggest 5 movies that are similar to "${movieTitle}" but are specifically "${modifier}".
            Return a JSON array of objects with:
            - title: string
            - reason: short explanation (max 1 sentence)
            
            Return ONLY the JSON.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }

    async predictRating(userTaste, movieData, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Predict a rating (0-5 stars) for the movie "${movieData.title}" based on this user's taste profile.
            
            User Taste:
            - Favorite Genres: ${userTaste.favoriteGenres.join(', ')}
            - Average Rating: ${userTaste.avgRating}
            - Top Keywords: ${userTaste.keywords.join(', ')}
            
            Movie Data:
            - Genres: ${movieData.genres.join(', ')}
            - Overview: ${movieData.overview}
            - Vote Average: ${movieData.voteAverage}
            
            Return a JSON object with:
            - predictedRating: number (0.0 to 5.0)
            - confidence: number (0.0 to 1.0)
            - reasoning: short explanation (max 1 sentence)
            
            Return ONLY the JSON.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }

    async calculateTasteMatch(userTaste, movieData, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Calculate a "Taste Match" percentage for this user and movie.
            
            User Taste: ${JSON.stringify(userTaste)}
            Movie: "${movieData.title}" (Genres: ${movieData.genres.join(', ')})
            
            Return a JSON object with:
            - matchPercentage: number (0 to 100)
            - factors: array of strings (top 3 matching factors)
            
            Return ONLY the JSON.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }

    async generateInsights(userProfile, preferredKeyIndex) {
        return this.makeRequestWithRetry(async (ai) => {
            const prompt = `Generate 4 fun, personalized insights about this user's movie taste.
            
            User Statistics:
            - Total Movies: ${userProfile.totalMovies}
            - Favorite Genres: ${userProfile.favoriteGenres.join(', ')}
            - Top Directors: ${userProfile.topDirectors.join(', ')}
            - Top Actors: ${userProfile.topActors.join(', ')}
            - Average Rating: ${userProfile.avgRating}
            - Watch Patterns: ${userProfile.watchPatterns}
            
            Return a JSON array of objects with:
            - title: Catchy title (e.g. "Nolan Superfan", "Weekend Warrior")
            - description: One sentence explanation
            - icon: Suggested icon name (one of: "Trophy", "Flame", "Clock", "Heart", "Zap", "Brain")
            - type: "stat" or "fun-fact"
            
            Return ONLY the JSON.`;

            const response = await ai.models.generateContent({
                model: this.model,
                contents: prompt
            });
            return this.cleanJson(response.text);
        }, { preferredKeyIndex });
    }
}

export default new GeminiService();
