/**
 * Data Repository
 * Data access layer for dashboard queries
 */

import { getDatabase } from '../utils/database';
import { DashboardFilters } from '../types/dashboard.types';
import logger from '../utils/logger';

export interface LeadRow {
  id: number;
  branch_id: number;
  agent_id: number;
  status: string;
  product: string | null;
  segment: string | null;
  campaign: string | null;
  revenue: number;
  created_at: string;
  updated_at: string;
  contacted_at: string | null;
  converted_at: string | null;
}

export interface AgentRow {
  id: number;
  name: string;
  branch_id: number;
  email: string | null;
}

export interface BranchRow {
  id: number;
  name: string;
}

/**
 * Get date range filter for SQL queries
 */
const getDateRangeFilter = (dateRange?: string): string => {
  const now = new Date();
  let startDate: Date;

  switch (dateRange) {
    case 'last7days':
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case 'last30days':
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case 'last90days':
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case 'lastYear':
      startDate = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000);
      break;
    case 'all':
    default:
      return '';
  }

  return `AND leads.created_at >= '${startDate.toISOString()}'`;
};

/**
 * Build WHERE clause from filters
 */
const buildWhereClause = (filters: DashboardFilters, includeJoins: boolean = true): { where: string; params: any[] } => {
  const conditions: string[] = [];
  const params: any[] = [];

  if (filters.branch) {
    conditions.push(`${includeJoins ? 'branches' : 'leads.branch_id IN (SELECT id FROM branches WHERE name = ?)'}.name = ?`);
    params.push(filters.branch);
  }

  if (filters.agent) {
    conditions.push(`${includeJoins ? 'agents' : 'leads.agent_id IN (SELECT id FROM agents WHERE name = ?)'}.name = ?`);
    params.push(filters.agent);
  }

  if (filters.product) {
    conditions.push('leads.product = ?');
    params.push(filters.product);
  }

  if (filters.segment) {
    conditions.push('leads.segment = ?');
    params.push(filters.segment);
  }

  if (filters.campaign) {
    conditions.push('leads.campaign = ?');
    params.push(filters.campaign);
  }

  const dateFilter = getDateRangeFilter(filters.dateRange);
  const whereClause = conditions.length > 0 
    ? `WHERE ${conditions.join(' AND ')} ${dateFilter}`
    : dateFilter ? `WHERE 1=1 ${dateFilter}` : '';

  return { where: whereClause, params };
};

/**
 * Get all leads with filters
 */
export const getLeads = (filters: DashboardFilters): LeadRow[] => {
  const db = getDatabase();
  const { where, params } = buildWhereClause(filters);

  const query = `
    SELECT 
      leads.*,
      branches.name as branch_name,
      agents.name as agent_name
    FROM leads
    LEFT JOIN branches ON leads.branch_id = branches.id
    LEFT JOIN agents ON leads.agent_id = agents.id
    ${where}
    ORDER BY leads.created_at DESC
  `;

  try {
    const stmt = db.prepare(query);
    return stmt.all(...params) as LeadRow[];
  } catch (error) {
    logger.error('Error fetching leads:', error);
    throw error;
  }
};

/**
 * Get leads by status
 */
export const getLeadsByStatus = (filters: DashboardFilters): Array<{ status: string; count: number }> => {
  const db = getDatabase();
  const { where, params } = buildWhereClause(filters);

  const query = `
    SELECT 
      leads.status,
      COUNT(*) as count
    FROM leads
    LEFT JOIN branches ON leads.branch_id = branches.id
    LEFT JOIN agents ON leads.agent_id = agents.id
    ${where}
    GROUP BY leads.status
    ORDER BY count DESC
  `;

  try {
    const stmt = db.prepare(query);
    const results = stmt.all(...params) as Array<{ status: string; count: number }>;
    return results;
  } catch (error) {
    logger.error('Error fetching leads by status:', error);
    throw error;
  }
};

/**
 * Get leads by branch over time periods
 */
export const getLeadsByBranchOverTime = (filters: DashboardFilters, periods: number = 7): Array<{
  period: string;
  leads: number;
  conversionRate: number;
}> => {
  const db = getDatabase();
  const { where, params } = buildWhereClause(filters);

  // Get date range
  const dateFilter = getDateRangeFilter(filters.dateRange);
  const now = new Date();
  const periodDays = dateFilter.includes('last7days') ? 1 : dateFilter.includes('last30days') ? 4 : 7;
  
  const results: Array<{ period: string; leads: number; conversionRate: number }> = [];

  for (let i = periods - 1; i >= 0; i--) {
    const periodStart = new Date(now.getTime() - (i + 1) * periodDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);

    const periodQuery = `
      SELECT 
        COUNT(*) as total_leads,
        SUM(CASE WHEN leads.status = 'Product/Service Sold' THEN 1 ELSE 0 END) as converted_leads
      FROM leads
      LEFT JOIN branches ON leads.branch_id = branches.id
      LEFT JOIN agents ON leads.agent_id = agents.id
      ${where}
      AND leads.created_at >= ? AND leads.created_at < ?
    `;

    const periodParams = [...params, periodStart.toISOString(), periodEnd.toISOString()];
    const stmt = db.prepare(periodQuery);
    const result = stmt.get(...periodParams) as { total_leads: number; converted_leads: number };

    const totalLeads = result.total_leads || 0;
    const convertedLeads = result.converted_leads || 0;
    const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

    results.push({
      period: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
      leads: totalLeads,
      conversionRate: Number(conversionRate.toFixed(2)),
    });
  }

  return results;
};

/**
 * Get revenue by branch over time
 */
export const getRevenueByBranchOverTime = (filters: DashboardFilters, periods: number = 7): Array<{
  period: string;
  revenue: number;
  target?: number;
}> => {
  const db = getDatabase();
  const { where, params } = buildWhereClause(filters);

  const dateFilter = getDateRangeFilter(filters.dateRange);
  const now = new Date();
  const periodDays = dateFilter.includes('last7days') ? 1 : dateFilter.includes('last30days') ? 4 : 7;

  const results: Array<{ period: string; revenue: number; target?: number }> = [];

  for (let i = periods - 1; i >= 0; i--) {
    const periodStart = new Date(now.getTime() - (i + 1) * periodDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);

    const periodQuery = `
      SELECT 
        COALESCE(SUM(leads.revenue), 0) as revenue
      FROM leads
      LEFT JOIN branches ON leads.branch_id = branches.id
      LEFT JOIN agents ON leads.agent_id = agents.id
      ${where}
      AND leads.created_at >= ? AND leads.created_at < ?
      AND leads.status = 'Product/Service Sold'
    `;

    const periodParams = [...params, periodStart.toISOString(), periodEnd.toISOString()];
    const stmt = db.prepare(periodQuery);
    const result = stmt.get(...periodParams) as { revenue: number };

    results.push({
      period: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
      revenue: Number((result.revenue || 0).toFixed(2)),
      target: Number(((result.revenue || 0) * 1.1).toFixed(2)), // 10% above revenue as target
    });
  }

  return results;
};

/**
 * Get agent performance data
 */
export const getAgentPerformance = (filters: DashboardFilters): Array<{
  agentId: string;
  agentName: string;
  leads: number;
  revenue: number;
  conversionRate: number;
  turnAroundTime: number;
}> => {
  const db = getDatabase();

  // Build a more complex query that handles filters properly
  let query = `
    SELECT 
      agents.id as agent_id,
      agents.name as agent_name,
      COUNT(leads.id) as total_leads,
      SUM(CASE WHEN leads.status = 'Product/Service Sold' THEN 1 ELSE 0 END) as converted_leads,
      COALESCE(SUM(CASE WHEN leads.status = 'Product/Service Sold' THEN leads.revenue ELSE 0 END), 0) as revenue,
      AVG(CASE 
        WHEN leads.contacted_at IS NOT NULL AND leads.created_at IS NOT NULL 
        THEN (julianday(leads.contacted_at) - julianday(leads.created_at))
        ELSE NULL 
      END) as avg_tat
    FROM agents
    LEFT JOIN leads ON agents.id = leads.agent_id
    LEFT JOIN branches ON leads.branch_id = branches.id
  `;

  // Build filter conditions
  const filterConditions: string[] = [];
  const filterParams: any[] = [];

  if (filters.branch) {
    filterConditions.push('branches.name = ?');
    filterParams.push(filters.branch);
  }

  if (filters.agent) {
    filterConditions.push('agents.name = ?');
    filterParams.push(filters.agent);
  }

  if (filters.product) {
    filterConditions.push('leads.product = ?');
    filterParams.push(filters.product);
  }

  if (filters.segment) {
    filterConditions.push('leads.segment = ?');
    filterParams.push(filters.segment);
  }

  if (filters.campaign) {
    filterConditions.push('leads.campaign = ?');
    filterParams.push(filters.campaign);
  }

  const dateFilter = getDateRangeFilter(filters.dateRange);
  if (dateFilter) {
    // Extract the date value from the dateFilter string
    const dateMatch = dateFilter.match(/'([^']+)'/);
    if (dateMatch) {
      filterConditions.push('leads.created_at >= ?');
      filterParams.push(dateMatch[1]);
    }
  }

  if (filterConditions.length > 0) {
    query += ` WHERE ${filterConditions.join(' AND ')}`;
  }

  query += `
    GROUP BY agents.id, agents.name
    HAVING total_leads > 0
    ORDER BY revenue DESC
  `;

  try {
    const stmt = db.prepare(query);
    const results = stmt.all(...filterParams) as Array<{
      agent_id: number;
      agent_name: string;
      total_leads: number;
      converted_leads: number;
      revenue: number;
      avg_tat: number | null;
    }>;

    return results.map((row) => {
      const totalLeads = row.total_leads || 0;
      const convertedLeads = row.converted_leads || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;
      const turnAroundTime = row.avg_tat || 0;

      return {
        agentId: String(row.agent_id),
        agentName: row.agent_name,
        leads: totalLeads,
        revenue: Number((row.revenue || 0).toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        turnAroundTime: Number(turnAroundTime.toFixed(2)),
      };
    });
  } catch (error) {
    logger.error('Error fetching agent performance:', error);
    throw error;
  }
};

/**
 * Get top performing agents
 */
export const getTopPerformingAgents = (filters: DashboardFilters, limit: number = 10): Array<{
  id: string;
  name: string;
  turnAroundTime: number;
  conversionRate: number;
  branch: string;
}> => {
  const db = getDatabase();

  // Build query with proper filters
  let query = `
    SELECT 
      agents.id,
      agents.name,
      branches.name as branch_name,
      COUNT(leads.id) as total_leads,
      SUM(CASE WHEN leads.status = 'Product/Service Sold' THEN 1 ELSE 0 END) as converted_leads,
      AVG(CASE 
        WHEN leads.contacted_at IS NOT NULL AND leads.created_at IS NOT NULL 
        THEN (julianday(leads.contacted_at) - julianday(leads.created_at))
        ELSE NULL 
      END) as avg_tat
    FROM agents
    LEFT JOIN leads ON agents.id = leads.agent_id
    LEFT JOIN branches ON agents.branch_id = branches.id
  `;

  const filterConditions: string[] = [];
  const filterParams: any[] = [];

  if (filters.branch) {
    filterConditions.push('branches.name = ?');
    filterParams.push(filters.branch);
  }

  if (filters.agent) {
    filterConditions.push('agents.name = ?');
    filterParams.push(filters.agent);
  }

  if (filters.product) {
    filterConditions.push('leads.product = ?');
    filterParams.push(filters.product);
  }

  if (filters.segment) {
    filterConditions.push('leads.segment = ?');
    filterParams.push(filters.segment);
  }

  if (filters.campaign) {
    filterConditions.push('leads.campaign = ?');
    filterParams.push(filters.campaign);
  }

  const dateFilter = getDateRangeFilter(filters.dateRange);
  if (dateFilter) {
    // Extract the date value from the dateFilter string
    const dateMatch = dateFilter.match(/'([^']+)'/);
    if (dateMatch) {
      filterConditions.push('leads.created_at >= ?');
      filterParams.push(dateMatch[1]);
    }
  }

  if (filterConditions.length > 0) {
    query += ` WHERE ${filterConditions.join(' AND ')}`;
  }

  query += `
    GROUP BY agents.id, agents.name, branches.name
    HAVING total_leads > 0
    ORDER BY converted_leads DESC, avg_tat ASC
    LIMIT ?
  `;

  try {
    const stmt = db.prepare(query);
    const results = stmt.all(...filterParams, limit) as Array<{
      id: number;
      name: string;
      branch_name: string;
      total_leads: number;
      converted_leads: number;
      avg_tat: number | null;
    }>;

    return results.map((row) => {
      const totalLeads = row.total_leads || 0;
      const convertedLeads = row.converted_leads || 0;
      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        id: String(row.id),
        name: row.name,
        turnAroundTime: Number((row.avg_tat || 0).toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        branch: row.branch_name || 'Unknown',
      };
    });
  } catch (error) {
    logger.error('Error fetching top performing agents:', error);
    throw error;
  }
};

/**
 * Get branch agent ranking
 */
export const getBranchAgentRanking = (filters: DashboardFilters): Array<{
  agentName: string;
  target: number;
  realised: number;
  currency?: string;
}> => {
  const db = getDatabase();

  // Build query with proper filters
  let query = `
    SELECT 
      agents.name as agent_name,
      COALESCE(SUM(leads.revenue), 0) * 1.1 as target,
      COALESCE(SUM(CASE WHEN leads.status = 'Product/Service Sold' THEN leads.revenue ELSE 0 END), 0) as realised
    FROM agents
    LEFT JOIN leads ON agents.id = leads.agent_id
    LEFT JOIN branches ON leads.branch_id = branches.id
  `;

  const filterConditions: string[] = [];
  const filterParams: any[] = [];

  if (filters.branch) {
    filterConditions.push('branches.name = ?');
    filterParams.push(filters.branch);
  }

  if (filters.agent) {
    filterConditions.push('agents.name = ?');
    filterParams.push(filters.agent);
  }

  if (filters.product) {
    filterConditions.push('leads.product = ?');
    filterParams.push(filters.product);
  }

  if (filters.segment) {
    filterConditions.push('leads.segment = ?');
    filterParams.push(filters.segment);
  }

  if (filters.campaign) {
    filterConditions.push('leads.campaign = ?');
    filterParams.push(filters.campaign);
  }

  const dateFilter = getDateRangeFilter(filters.dateRange);
  if (dateFilter) {
    // Extract the date value from the dateFilter string
    const dateMatch = dateFilter.match(/'([^']+)'/);
    if (dateMatch) {
      filterConditions.push('leads.created_at >= ?');
      filterParams.push(dateMatch[1]);
    }
  }

  if (filterConditions.length > 0) {
    query += ` WHERE ${filterConditions.join(' AND ')}`;
  }

  query += `
    GROUP BY agents.id, agents.name
    ORDER BY realised DESC
  `;

  try {
    const stmt = db.prepare(query);
    const results = stmt.all(...filterParams) as Array<{
      agent_name: string;
      target: number;
      realised: number;
    }>;

    return results.map((row) => ({
      agentName: row.agent_name,
      target: Number((row.target || 0).toFixed(2)),
      realised: Number((row.realised || 0).toFixed(2)),
      currency: 'KES',
    }));
  } catch (error) {
    logger.error('Error fetching branch agent ranking:', error);
    throw error;
  }
};

