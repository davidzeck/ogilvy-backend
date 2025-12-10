/**
 * CORS Configuration
 * Cross-Origin Resource Sharing configuration
 */

import { CorsOptions } from 'cors';
import { appConfig } from './app.config';

export const corsOptions: CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) {
      return callback(null, true);
    }

    const allowedOrigins = appConfig.corsOrigin.split(',').map((o) => o.trim());

    if (allowedOrigins.includes(origin) || appConfig.isDevelopment) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['Content-Range', 'X-Content-Range'],
  maxAge: 86400, // 24 hours
};

export default corsOptions;

