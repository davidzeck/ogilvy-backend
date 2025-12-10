/**
 * Error Middleware
 * Global error handling middleware
 */

import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/AppError';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): Response | void => {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle AppError (operational errors)
  if (err instanceof AppError) {
    return sendError(res, err.message, err.statusCode);
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    return sendError(res, 'Validation failed', 400, err.message);
  }

  // Handle unknown errors
  const message = process.env.NODE_ENV === 'production'
    ? 'Internal server error'
    : err.message;

  return sendError(res, message, 500);
};

/**
 * Async error wrapper
 * Wraps async route handlers to catch errors
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * 404 Not Found handler
 */
export const notFoundHandler = (
  req: Request,
  _res: Response,
  next: NextFunction
): void => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

