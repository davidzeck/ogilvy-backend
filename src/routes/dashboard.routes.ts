/**
 * Dashboard Routes
 * Route definitions for dashboard endpoints
 */

import { Router } from 'express';
import { getDashboard, getFilters } from '../controllers/dashboard.controller';
import { validateDashboardQuery, validate } from '../middleware/validation.middleware';
import { apiRateLimit } from '../middleware/rateLimit.middleware';
import { performanceMonitor } from '../middleware/performance.middleware';

const router = Router();

// Apply performance monitoring to all routes
router.use(performanceMonitor);

/**
 * GET /api/dashboard/filters
 * Get available filter options
 */
router.get('/filters', apiRateLimit, getFilters);

/**
 * GET /api/dashboard
 * Get dashboard data with optional filters
 */
router.get(
  '/',
  apiRateLimit,
  validate(validateDashboardQuery),
  getDashboard
);

export default router;

