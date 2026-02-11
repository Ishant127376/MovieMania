import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import geminiService from '../services/geminiService.js';

const getPreferredKeyIndex = (req) => {
    const raw = req.get('X-AI-Key-Index');
    const parsed = parseInt(raw, 10);
    return Number.isFinite(parsed) ? parsed : undefined;
};

/**
 * @desc    Generate a review draft
 * @route   POST /api/ai/review/generate
 * @access  Private
 */
export const generateReviewDraft = asyncHandler(async (req, res) => {
    const { movieTitle, rating, genres } = req.body;
    const preferredKeyIndex = getPreferredKeyIndex(req);

    if (!movieTitle || !rating) {
        return ApiResponse.error(res, 'Movie title and rating are required', 400);
    }

    try {
        const draft = await geminiService.generateReviewDraft(movieTitle, rating, genres || [], preferredKeyIndex);
        ApiResponse.success(res, { draft });
    } catch (error) {
        console.error('AI Generation Error:', error);
        const status = error?.status || 503;
        const message = error?.userMessage || 'Failed to generate review draft';
        ApiResponse.error(res, message, status);
    }
});

/**
 * @desc    Expand bullet points into a review
 * @route   POST /api/ai/review/expand
 * @access  Private
 */
export const expandThoughts = asyncHandler(async (req, res) => {
    const { bulletPoints } = req.body;
    const preferredKeyIndex = getPreferredKeyIndex(req);

    if (!bulletPoints) {
        return ApiResponse.error(res, 'Bullet points are required', 400);
    }

    try {
        const review = await geminiService.expandThoughts(bulletPoints, preferredKeyIndex);
        ApiResponse.success(res, { review });
    } catch (error) {
        console.error('AI Expansion Error:', error);
        const status = error?.status || 503;
        const message = error?.userMessage || 'Failed to expand thoughts';
        ApiResponse.error(res, message, status);
    }
});

/**
 * @desc    Remove spoilers from review
 * @route   POST /api/ai/review/spoiler-free
 * @access  Private
 */
export const removeSpoilers = asyncHandler(async (req, res) => {
    const { reviewText } = req.body;
    const preferredKeyIndex = getPreferredKeyIndex(req);

    if (!reviewText) {
        return ApiResponse.error(res, 'Review text is required', 400);
    }

    try {
        const cleanText = await geminiService.removeSpoilers(reviewText, preferredKeyIndex);
        ApiResponse.success(res, { cleanText });
    } catch (error) {
        console.error('AI Spoiler Removal Error:', error);
        const status = error?.status || 503;
        const message = error?.userMessage || 'Failed to remove spoilers';
        ApiResponse.error(res, message, status);
    }
});

/**
 * @desc    Analyze sentiment
 * @route   POST /api/ai/review/analyze
 * @access  Private
 */
export const analyzeSentiment = asyncHandler(async (req, res) => {
    const { text } = req.body;
    const preferredKeyIndex = getPreferredKeyIndex(req);

    if (!text) {
        return ApiResponse.error(res, 'Text is required', 400);
    }

    try {
        const analysis = await geminiService.analyzeSentiment(text, preferredKeyIndex);
        ApiResponse.success(res, analysis);
    } catch (error) {
        console.error('AI Analysis Error:', error);
        const status = error?.status || 503;
        const message = error?.userMessage || 'Failed to analyze sentiment';
        ApiResponse.error(res, message, status);
    }
});

/**
 * @desc    Suggest tags for review
 * @route   POST /api/ai/review/suggest-tags
 * @access  Private
 */
export const suggestTags = asyncHandler(async (req, res) => {
    const { reviewText } = req.body;
    const preferredKeyIndex = getPreferredKeyIndex(req);

    if (!reviewText) {
        return ApiResponse.error(res, 'Review text is required', 400);
    }

    try {
        const tags = await geminiService.suggestTags(reviewText, preferredKeyIndex);
        ApiResponse.success(res, { tags });
    } catch (error) {
        console.error('AI Tag Suggestion Error:', error);
        const status = error?.status || 503;
        const message = error?.userMessage || 'Failed to suggest tags';
        ApiResponse.error(res, message, status);
    }
});
