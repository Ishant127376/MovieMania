import api from './api';

const KEY_INDEX_STORAGE_KEY = 'moviemania:aiKeyIndex';

const getNextKeyIndexForRequest = () => {
    if (typeof window === 'undefined' || !window.localStorage) return null;

    const raw = window.localStorage.getItem(KEY_INDEX_STORAGE_KEY);
    let current = parseInt(raw, 10);

    // Starting index must be random (user-specific via localStorage)
    if (!Number.isFinite(current)) {
        current = Math.floor(Math.random() * 1_000_000_000);
    }

    // Increment for the next prompt
    window.localStorage.setItem(KEY_INDEX_STORAGE_KEY, String(current + 1));
    return current;
};

const withKeyIndexHeader = () => {
    const keyIndex = getNextKeyIndexForRequest();
    if (keyIndex === null) return {};
    return {
        headers: {
            'X-AI-Key-Index': String(keyIndex),
        },
    };
};

const aiService = {
    // Generate a review draft based on rating and title
    generateReviewDraft: async (movieTitle, rating, genres) => {
        const response = await api.post('/ai/review/generate', {
            movieTitle,
            rating,
            genres
        }, withKeyIndexHeader());
        return response.data.draft;
    },

    // Expand bullet points into a full review
    expandThoughts: async (bulletPoints) => {
        const response = await api.post('/ai/review/expand', {
            bulletPoints
        }, withKeyIndexHeader());
        return response.data.review;
    },

    // Remove spoilers from review text
    removeSpoilers: async (reviewText) => {
        const response = await api.post('/ai/review/spoiler-free', {
            reviewText
        }, withKeyIndexHeader());
        return response.data.cleanText;
    },

    // Analyze sentiment of review text
    analyzeSentiment: async (text) => {
        const response = await api.post('/ai/review/analyze', {
            text
        }, withKeyIndexHeader());
        return response.data;
    },

    // Suggest tags based on review content
    suggestTags: async (reviewText) => {
        const response = await api.post('/ai/review/suggest-tags', {
            reviewText
        }, withKeyIndexHeader());
        return response.data;
    },

    // Natural language search
    smartSearch: async (query) => {
        const response = await api.post('/ai/search', {
            query
        }, withKeyIndexHeader());
        return response.data;
    },

    // Predict rating for a movie
    predictRating: async (tmdbId, type = 'movie') => {
        const response = await api.get(`/ai/predict/rating/${tmdbId}/${type}`, withKeyIndexHeader());
        return response.data;
    },

    // Calculate taste match percentage
    getTasteMatch: async (tmdbId, type = 'movie') => {
        const response = await api.get(`/ai/predict/match/${tmdbId}/${type}`, withKeyIndexHeader());
        return response.data;
    },

    // Get auto-generated insights
    getAutoInsights: async () => {
        const response = await api.get('/ai/insights/dashboard', withKeyIndexHeader());
        return response.data;
    }
};

export default aiService;
