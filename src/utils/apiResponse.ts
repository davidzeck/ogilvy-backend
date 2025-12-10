/**
 * API Response Utility
 * Standardized API response helpers
 */

import { Response } from 'express';
import { ApiResponse } from '../types/dashboard.types';

/**
 * Send success response
 */
export const sendSuccess = <T>(
  res: Response,
  data: T,
  message: string = 'Request successful',
  statusCode: number = 200
): Response => {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
    timestamp: new Date().toISOString(),
  };

  return res.status(statusCode).json(response);
};

/**
 * Send error response
 */
export const sendError = (
  res: Response,
  message: string = 'An error occurred',
  statusCode: number = 500,
  error?: string
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    error: error || message,
  };

  return res.status(statusCode).json(response);
};

/**
 * Send validation error response
 */
export const sendValidationError = (
  res: Response,
  message: string = 'Validation failed',
  errors?: any
): Response => {
  const response: ApiResponse = {
    success: false,
    message,
    timestamp: new Date().toISOString(),
    error: message,
    data: errors,
  };

  return res.status(400).json(response);
};

/**
 * Send not found response
 */
export const sendNotFound = (
  res: Response,
  message: string = 'Resource not found'
): Response => {
  return sendError(res, message, 404);
};

/**
 * Send unauthorized response
 */
export const sendUnauthorized = (
  res: Response,
  message: string = 'Unauthorized'
): Response => {
  return sendError(res, message, 401);
};

