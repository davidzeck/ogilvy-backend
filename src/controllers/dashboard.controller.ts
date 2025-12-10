/**
 * Dashboard Controller
 * HTTP request handlers for dashboard endpoints
 */

import { Request, Response } from 'express';
import { getDashboardData } from '../services/dashboard.service';
import { parseFilters, getDefaultFilters } from '../services/filter.service';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';

/**
 * Get dashboard data
 * GET /api/dashboard
 */
export const getDashboard = asyncHandler(async (req: Request, res: Response) => {
  try {
    // Parse filters from query parameters
    const filters = Object.keys(req.query).length > 0 
      ? parseFilters(req.query as Record<string, any>)
      : getDefaultFilters();

    logger.info('Fetching dashboard data', { filters });

    // Get dashboard data
    const data = await getDashboardData(filters);

    return sendSuccess(
      res,
      data,
      'Dashboard data retrieved successfully'
    );
  } catch (error: any) {
    logger.error('Error fetching dashboard data:', error);
    return sendError(
      res,
      'Failed to retrieve dashboard data',
      500,
      error.message
    );
  }
});

