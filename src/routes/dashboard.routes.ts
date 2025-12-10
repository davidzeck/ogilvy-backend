/**
 * Dashboard Routes
 * Route definitions for dashboard endpoints
 */

import { Router } from 'express';
import { getDashboard } from '../controllers/dashboard.controller';
import { validateDashboardQuery, validate } from '../middleware/validation.middleware';

const router = Router();

/**
 * GET /api/dashboard
 * Get dashboard data with optional filters
 */
router.get(
  '/',
  validate(validateDashboardQuery),
  getDashboard
);

export default router;

