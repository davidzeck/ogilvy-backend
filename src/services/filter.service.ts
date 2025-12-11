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
    filters.branch = sanitizeString(query.branch);
  }

  if (query.agent && typeof query.agent === 'string') {
    filters.agent = sanitizeString(query.agent);
  }

  if (query.product && typeof query.product === 'string') {
    filters.product = sanitizeString(query.product);
  }

  if (query.segment && typeof query.segment === 'string') {
    filters.segment = sanitizeString(query.segment);
  }

  if (query.campaign && typeof query.campaign === 'string') {
    filters.campaign = sanitizeString(query.campaign);
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

/**
 * Sanitize string input to prevent XSS
 */
export const sanitizeString = (input: string): string => {
  return input
    .trim()
    .replace(/[<>\"']/g, '') // Remove potentially dangerous characters
    .substring(0, 100); // Limit length
};

/**
 * Validate filter values
 */
export const validateFilters = (filters: DashboardFilters): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  const validDateRanges: DateRange[] = ['last7days', 'last30days', 'last90days', 'lastYear', 'all'];

  if (filters.dateRange && !validDateRanges.includes(filters.dateRange as DateRange)) {
    errors.push('Invalid date range');
  }

  if (filters.branch && filters.branch.length > 100) {
    errors.push('Branch name too long');
  }

  if (filters.agent && filters.agent.length > 100) {
    errors.push('Agent name too long');
  }

  if (filters.product && filters.product.length > 100) {
    errors.push('Product name too long');
  }

  if (filters.segment && filters.segment.length > 100) {
    errors.push('Segment name too long');
  }

  if (filters.campaign && filters.campaign.length > 100) {
    errors.push('Campaign name too long');
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

