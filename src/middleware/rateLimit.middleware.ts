/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse and DDoS attacks
 */

import { Request, Response, NextFunction } from 'express';
import { sendError } from '../utils/apiResponse';
import logger from '../utils/logger';

interface RateLimitStore {
  [key: string]: {
    count: number;
    resetTime: number;
  };
}

// In-memory store for rate limiting (for production, use Redis)
const store: RateLimitStore = {};

// Cleanup old entries every 10 minutes
setInterval(() => {
  const now = Date.now();
  Object.keys(store).forEach((key) => {
    if (store[key].resetTime < now) {
      delete store[key];
    }
  });
}, 10 * 60 * 1000);

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  windowMs: number; // Time window in milliseconds
  maxRequests: number; // Maximum requests per window
  message?: string;
  skipSuccessfulRequests?: boolean;
}

/**
 * Default rate limit config
 */
const defaultConfig: RateLimitConfig = {
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 60, // 60 requests per minute
  message: 'Too many requests, please try again later',
  skipSuccessfulRequests: false,
};

/**
 * Create rate limiter middleware
 */
export const rateLimit = (config: Partial<RateLimitConfig> = {}) => {
  const options = { ...defaultConfig, ...config };

  return (req: Request, res: Response, next: NextFunction) => {
    // Get client identifier (IP address or user ID if authenticated)
    const clientId = req.ip || req.socket.remoteAddress || 'unknown';
    const key = `rateLimit:${req.path}:${clientId}`;

    const now = Date.now();
    const record = store[key];

    // Initialize or reset if window expired
    if (!record || record.resetTime < now) {
      store[key] = {
        count: 1,
        resetTime: now + options.windowMs,
      };
      return next();
    }

    // Increment count
    record.count++;

    // Check if limit exceeded
    if (record.count > options.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000);

      logger.warn('Rate limit exceeded', {
        clientId,
        path: req.path,
        count: record.count,
        limit: options.maxRequests,
      });

      res.setHeader('Retry-After', retryAfter);
      res.setHeader('X-RateLimit-Limit', options.maxRequests);
      res.setHeader('X-RateLimit-Remaining', 0);
      res.setHeader('X-RateLimit-Reset', record.resetTime);

      return sendError(
        res,
        options.message || 'Too many requests',
        429,
        `Rate limit exceeded. Please retry after ${retryAfter} seconds`
      );
    }

    // Set rate limit headers
    res.setHeader('X-RateLimit-Limit', options.maxRequests);
    res.setHeader('X-RateLimit-Remaining', options.maxRequests - record.count);
    res.setHeader('X-RateLimit-Reset', record.resetTime);

    next();
  };
};

/**
 * Strict rate limiter for sensitive endpoints
 */
export const strictRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 5, // 5 requests per 15 minutes
  message: 'Too many requests to this endpoint',
});

/**
 * Standard rate limiter for API endpoints
 */
export const apiRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 100, // 100 requests per minute
});

/**
 * Lenient rate limiter for public endpoints
 */
export const publicRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  maxRequests: 300, // 300 requests per minute
});
