/**
 * Performance Monitoring Middleware
 * Tracks query performance and logs slow queries
 */

import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';

/**
 * Performance thresholds (in milliseconds)
 */
const PERFORMANCE_THRESHOLDS = {
  FAST: 100,
  NORMAL: 500,
  SLOW: 1000,
  CRITICAL: 3000,
};

/**
 * Performance monitoring middleware
 * Logs request duration and warns on slow queries
 */
export const performanceMonitor = (req: Request, res: Response, next: NextFunction) => {
  const startTime = Date.now();
  const startMemory = process.memoryUsage();

  // Store original end function
  const originalEnd = res.end.bind(res);

  // Override end function to capture response time
  res.end = function (this: Response, ...args: any[]): any {
    const duration = Date.now() - startTime;
    const endMemory = process.memoryUsage();
    const memoryDelta = {
      heapUsed: ((endMemory.heapUsed - startMemory.heapUsed) / 1024 / 1024).toFixed(2),
      external: ((endMemory.external - startMemory.external) / 1024 / 1024).toFixed(2),
    };

    // Add performance headers
    res.setHeader('X-Response-Time', `${duration}ms`);
    res.setHeader('X-Memory-Delta', `${memoryDelta.heapUsed}MB`);

    // Log performance metrics
    const logData = {
      method: req.method,
      path: req.path,
      query: req.query,
      duration: `${duration}ms`,
      status: res.statusCode,
      memoryDelta: `${memoryDelta.heapUsed}MB heap, ${memoryDelta.external}MB external`,
      userAgent: req.get('user-agent'),
    };

    // Categorize and log based on performance
    if (duration < PERFORMANCE_THRESHOLDS.FAST) {
      logger.debug('Fast request', logData);
    } else if (duration < PERFORMANCE_THRESHOLDS.NORMAL) {
      logger.info('Normal request', logData);
    } else if (duration < PERFORMANCE_THRESHOLDS.SLOW) {
      logger.warn('Slow request detected', logData);
    } else if (duration < PERFORMANCE_THRESHOLDS.CRITICAL) {
      logger.error('Very slow request detected', logData);
    } else {
      logger.error('CRITICAL: Extremely slow request', logData);
    }

    // Call original end function
    return originalEnd(...args);
  };

  next();
};

/**
 * Database query performance tracker
 * Wraps database queries to track execution time
 */
export class QueryPerformanceTracker {
  private queryTimes: Map<string, number[]> = new Map();

  /**
   * Track a query execution
   */
  track(queryName: string, duration: number): void {
    if (!this.queryTimes.has(queryName)) {
      this.queryTimes.set(queryName, []);
    }
    this.queryTimes.get(queryName)!.push(duration);

    // Log slow queries
    if (duration > PERFORMANCE_THRESHOLDS.SLOW) {
      logger.warn('Slow database query', {
        query: queryName,
        duration: `${duration}ms`,
      });
    }
  }

  /**
   * Get statistics for a specific query
   */
  getStats(queryName: string): { avg: number; min: number; max: number; count: number } | null {
    const times = this.queryTimes.get(queryName);
    if (!times || times.length === 0) {
      return null;
    }

    return {
      avg: times.reduce((a, b) => a + b, 0) / times.length,
      min: Math.min(...times),
      max: Math.max(...times),
      count: times.length,
    };
  }

  /**
   * Get all query statistics
   */
  getAllStats(): Record<string, { avg: number; min: number; max: number; count: number }> {
    const stats: Record<string, { avg: number; min: number; max: number; count: number }> = {};

    for (const [queryName, times] of this.queryTimes.entries()) {
      if (times.length > 0) {
        stats[queryName] = {
          avg: times.reduce((a, b) => a + b, 0) / times.length,
          min: Math.min(...times),
          max: Math.max(...times),
          count: times.length,
        };
      }
    }

    return stats;
  }

  /**
   * Clear all tracked queries
   */
  clear(): void {
    this.queryTimes.clear();
  }

  /**
   * Log summary of all queries
   */
  logSummary(): void {
    const stats = this.getAllStats();
    logger.info('Query Performance Summary', stats);
  }
}

// Export singleton instance
export const queryTracker = new QueryPerformanceTracker();

/**
 * Measure async function execution time
 */
export async function measurePerformance<T>(
  name: string,
  fn: () => Promise<T>
): Promise<T> {
  const start = Date.now();
  try {
    const result = await fn();
    const duration = Date.now() - start;
    queryTracker.track(name, duration);
    return result;
  } catch (error) {
    const duration = Date.now() - start;
    queryTracker.track(name, duration);
    throw error;
  }
}
