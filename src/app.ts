/**
 * Application Entry Point
 * Express application setup with middleware and routes
 */

import express, { Express, Request, Response } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import compression from 'compression';
import { appConfig } from './config/app.config';
import { corsOptions } from './config/cors.config';
import { requestLogger } from './middleware/logging.middleware';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import logger from './utils/logger';

// Create Express app
const app: Express = express();

// Security middleware
app.use(helmet());

// CORS
app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Compression middleware
app.use(compression());

// Request logging middleware
app.use(requestLogger);

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({
    success: true,
    message: 'Service is healthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
  });
});

// API routes will be added here
// app.use(appConfig.apiPrefix, routes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const startServer = (): void => {
  const server = app.listen(appConfig.port, () => {
    logger.info(`🚀 Server running on port ${appConfig.port}`);
    logger.info(`📝 Environment: ${appConfig.env}`);
    logger.info(`🔗 API prefix: ${appConfig.apiPrefix}`);
  });

  // Graceful shutdown
  const gracefulShutdown = (signal: string) => {
    logger.info(`${signal} received. Starting graceful shutdown...`);
    server.close(() => {
      logger.info('Server closed successfully');
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
};

export { app, startServer };
export default app;

