import rateLimit from 'express-rate-limit';
import env from '../config/environment.js';

const parseLimit = (value, fallback) => {
    const parsed = parseInt(value, 10);
    return Number.isNaN(parsed) ? fallback : parsed;
};

export const apiLimiter = rateLimit({
    windowMs: env.rateLimitWindowMs,
    max: parseLimit(process.env.RATE_LIMIT_MAX, 1000),
    message: {
        success: false,
        message: 'Too many requests, please try again later.'
    },
    standardHeaders: true,
    legacyHeaders: false
});

export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    message: {
        success: false,
        message: 'Too many authentication attempts, please try again after 15 minutes.'
    },
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true
});

export const tmdbLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: parseLimit(process.env.TMDB_RATE_LIMIT_MAX, 100),
    message: {
        success: false,
        message: 'Too many TMDB requests, please slow down.'
    },
    standardHeaders: true,
    legacyHeaders: false
});
