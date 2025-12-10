/**
 * Filter Service
 * Business logic for filtering dashboard data
 */

import { DashboardFilters, DateRange } from '../types/dashboard.types';

/**
 * Parse and validate filters from query parameters
 */
export const parseFilters = (query: Record<string, any>): DashboardFilters => {
  const filters: DashboardFilters = {};

  if (query.dateRange) {
    const validDateRanges: DateRange[] = ['last7days', 'last30days', 'last90days', 'lastYear', 'all'];
    if (validDateRanges.includes(query.dateRange as DateRange)) {
      filters.dateRange = query.dateRange as DateRange;
    }
  }

  if (query.branch && typeof query.branch === 'string') {
    filters.branch = query.branch.trim();
  }

  if (query.agent && typeof query.agent === 'string') {
    filters.agent = query.agent.trim();
  }

  if (query.product && typeof query.product === 'string') {
    filters.product = query.product.trim();
  }

  if (query.segment && typeof query.segment === 'string') {
    filters.segment = query.segment.trim();
  }

  if (query.campaign && typeof query.campaign === 'string') {
    filters.campaign = query.campaign.trim();
  }

  return filters;
};

/**
 * Get default filters
 */
export const getDefaultFilters = (): DashboardFilters => {
  return {
    dateRange: 'last30days',
  };
};

