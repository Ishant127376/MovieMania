import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import mongoSanitize from 'express-mongo-sanitize';
import routes from './routes/index.js';
import versionRoutes from './routes/versionRoutes.js';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { apiLimiter } from './middleware/rateLimiter.js';
import { usageTracker, logUsageSnapshot } from './middleware/usageTracker.js';
import { getBuildInfo } from './config/buildConfig.js';
import env from './config/environment.js';

const app = express();

// Trust proxy (for rate limiting behind reverse proxy)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (mobile apps, curl, etc.)
        if (!origin) return callback(null, true);

        if (env.allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Client-ID', 'X-AI-Key-Index'],
    exposedHeaders: ['X-MovieMania-Version', 'X-MovieMania-Instance', 'X-MovieMania-Build']
}));

// Body parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Cookie parsing
app.use(cookieParser());

// MongoDB injection prevention
app.use(mongoSanitize());

// Request logging
if (env.nodeEnv === 'development') {
    app.use(morgan('dev'));
} else {
    app.use(morgan('combined'));
}

// Usage tracking middleware (adds watermark headers)
app.use(usageTracker);

// Rate limiting
app.use('/api', apiLimiter);

// Version API routes (before main routes)
app.use('/api/version', versionRoutes);

// API routes
app.use('/api', routes);

// Root route with build info
app.get('/', (req, res) => {
    const buildInfo = getBuildInfo();
    res.json({
        success: true,
        message: '🎬 Welcome to MovieMania API',
        version: buildInfo.versionString,
        instance: buildInfo.instance.id,
        docs: '/api/version/health'
    });
});

// 404 handler
app.use(notFoundHandler);

// Global error handler
app.use(errorHandler);

// Log usage stats every hour (in production)
if (env.nodeEnv === 'production') {
    setInterval(logUsageSnapshot, 60 * 60 * 1000);
}

// Log startup info
const buildInfo = getBuildInfo();
console.log(`\n🎬 MovieMania ${buildInfo.versionString}`);
console.log(`   Instance: ${buildInfo.instance.id}`);
console.log(`   Build: ${buildInfo.build.id}`);
console.log(`   Environment: ${buildInfo.build.environment}\n`);

export default app;

