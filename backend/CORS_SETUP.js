/**
 * CORS Configuration for Express Backend
 * 
 * This file provides a reusable CORS configuration
 * that works for both development and production environments.
 */

const cors = require('cors');

/**
 * CORS Options Configuration
 * Customize based on your environment
 */
const getCorsOptions = () => {
    const nodeEnv = process.env.NODE_ENV || 'development';
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5000';

    // Allowed origins
    const allowedOrigins = [
        'http://localhost:3000',      // Local development
        'http://localhost:5000',      // Local frontend dev server
        'http://127.0.0.1:3000',
        'http://127.0.0.1:5000',
        frontendUrl,                  // Production frontend URL
    ];

    // Add Vercel deployments in production
    if (nodeEnv === 'production' && process.env.VERCEL_URL) {
        allowedOrigins.push(`https://${process.env.VERCEL_URL}`);
    }

    return {
        // Allow requests from these origins
        origin: (origin, callback) => {
            // Allow requests with no origin (like mobile apps, Postman, curl)
            if (!origin) return callback(null, true);

            if (allowedOrigins.includes(origin)) {
                callback(null, true);
            } else {
                console.warn(`CORS blocked request from: ${origin}`);
                callback(new Error('CORS not allowed from this origin'));
            }
        },

        // Allow credentials (cookies, authorization headers)
        credentials: true,

        // Allowed HTTP methods
        methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],

        // Allowed request headers
        allowedHeaders: [
            'Content-Type',
            'Authorization',
            'X-Requested-With',
            'Accept',
            'Origin',
        ],

        // Expose these headers to the client
        exposedHeaders: ['Content-Length', 'X-JSON-Response-Header'],

        // Cache preflight request for 1 hour
        maxAge: 3600,
    };
};

/**
 * Express middleware function
 * Usage in Express app:
 * 
 *   const express = require('express');
 *   const { setupCORS } = require('./CORS_SETUP');
 *   
 *   const app = express();
 *   setupCORS(app);
 *   
 *   // ... rest of your app
 */
const setupCORS = (app) => {
    const corsOptions = getCorsOptions();
    app.use(cors(corsOptions));

    // Log CORS setup in development
    if (process.env.NODE_ENV !== 'production') {
        console.log('✅ CORS enabled with options:', {
            credentials: corsOptions.credentials,
            methods: corsOptions.methods,
            allowedHeaders: corsOptions.allowedHeaders,
        });
    }
};

/**
 * Manually handle preflight requests (optional)
 * Use if you need more control
 */
const handlePreflightRequests = (app) => {
    // Handle preflight requests
    app.options('*', cors(getCorsOptions()));
};

module.exports = {
    getCorsOptions,
    setupCORS,
    handlePreflightRequests,
};
