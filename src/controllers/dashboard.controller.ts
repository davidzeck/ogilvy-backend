/**
 * Dashboard Controller
 * HTTP request handlers for dashboard endpoints
 */

import { Request, Response } from 'express';
import { getDashboardData } from '../services/dashboard.service';
import { parseFilters, getDefaultFilters, validateFilters } from '../services/filter.service';
import { getFilterOptions } from '../repositories/data.repository';
import { sendSuccess, sendError } from '../utils/apiResponse';
import { asyncHandler } from '../middleware/error.middleware';
import logger from '../utils/logger';
import { cache } from '../utils/cache';

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

    // Validate filters
    const validation = validateFilters(filters);
    if (!validation.valid) {
      return sendError(
        res,
        'Invalid filter parameters',
        400,
        validation.errors.join(', ')
      );
    }

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

/**
 * Get filter options
 * GET /api/dashboard/filters
 */
export const getFilters = asyncHandler(async (_req: Request, res: Response) => {
  try {
    // Check cache first
    const cacheKey = 'filter:options';
    const cached = cache.get(cacheKey);

    if (cached) {
      logger.info('Returning cached filter options');
      return sendSuccess(
        res,
        cached,
        'Filter options retrieved successfully (cached)'
      );
    }

    logger.info('Fetching fresh filter options');

    // Get filter options from database
    const options = await getFilterOptions();

    // Add "All" option to each filter
    const optionsWithAll = {
      branches: [{ value: '', label: 'All Branches' }, ...options.branches],
      agents: [{ value: '', label: 'All Agents' }, ...options.agents],
      products: [{ value: '', label: 'All Products' }, ...options.products],
      segments: [{ value: '', label: 'All Segments' }, ...options.segments],
      campaigns: [{ value: '', label: 'All Campaigns' }, ...options.campaigns],
    };

    // Cache for 10 minutes (filter options don't change frequently)
    cache.set(cacheKey, optionsWithAll, 600);

    return sendSuccess(
      res,
      optionsWithAll,
      'Filter options retrieved successfully'
    );
  } catch (error: any) {
    logger.error('Error fetching filter options:', error);
    return sendError(
      res,
      'Failed to retrieve filter options',
      500,
      error.message
    );
  }
});

