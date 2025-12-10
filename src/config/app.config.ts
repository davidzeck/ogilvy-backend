/**
 * Application Configuration
 * Centralized configuration management
 */

import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

export const appConfig = {
  // Environment
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',

  // Server
  port: parseInt(process.env.PORT || '5000', 10),
  apiPrefix: process.env.API_PREFIX || '/api',

  // CORS
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',

  // Logging
  logLevel: process.env.LOG_LEVEL || 'info',

  // Caching
  cacheTTL: parseInt(process.env.CACHE_TTL || '300', 10), // 5 minutes default
};

// Validate required configuration
if (!appConfig.port) {
  throw new Error('PORT is required in environment variables');
}

export default appConfig;

