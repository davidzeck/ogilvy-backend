/**
 * Dashboard Service
 * Business logic for dashboard data aggregation and KPI calculation
 */

import {
  getLeads,
  getLeadsByStatus,
  getLeadsByBranchOverTime,
  getRevenueByBranchOverTime,
  getAgentPerformance,
  getTopPerformingAgents,
  getBranchAgentRanking,
} from '../repositories/data.repository';
import { DashboardFilters, DashboardData, KPI } from '../types/dashboard.types';
import { cache } from '../utils/cache';
import logger from '../utils/logger';

/**
 * Calculate KPIs from leads data
 */
const calculateKPIs = (filters: DashboardFilters): KPI[] => {
  const leads = getLeads(filters);
  const totalLeads = leads.length;
  
  // Calculate Turn Around Time (TAT) - average days from creation to contact
  const contactedLeads = leads.filter(lead => lead.contacted_at);
  let avgTAT = 0;
  
  if (contactedLeads.length > 0) {
    const totalDays = contactedLeads.reduce((sum, lead) => {
      if (lead.contacted_at && lead.created_at) {
        const created = new Date(lead.created_at);
        const contacted = new Date(lead.contacted_at);
        const days = (contacted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    avgTAT = totalDays / contactedLeads.length;
  }

  // Calculate Conversion Rate
  const convertedLeads = leads.filter(lead => lead.status === 'Product/Service Sold');
  const conversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;

  // Total Contacted Leads
  const totalContacted = contactedLeads.length;

  // Get previous period data for comparison (30 days ago)
  const previousFilters: DashboardFilters = {
    ...filters,
    dateRange: 'last30days',
  };
  const previousLeads = getLeads(previousFilters);
  const previousContactedLeads = previousLeads.filter(lead => lead.contacted_at);
  
  let previousAvgTAT = 0;
  if (previousContactedLeads.length > 0) {
    const previousTotalDays = previousContactedLeads.reduce((sum, lead) => {
      if (lead.contacted_at && lead.created_at) {
        const created = new Date(lead.created_at);
        const contacted = new Date(lead.contacted_at);
        const days = (contacted.getTime() - created.getTime()) / (1000 * 60 * 60 * 24);
        return sum + days;
      }
      return sum;
    }, 0);
    previousAvgTAT = previousTotalDays / previousContactedLeads.length;
  }

  const previousConversionRate = previousLeads.length > 0 
    ? (previousLeads.filter(lead => lead.status === 'Product/Service Sold').length / previousLeads.length) * 100 
    : 0;

  // Calculate changes
  const tatChange = previousAvgTAT > 0 ? ((avgTAT - previousAvgTAT) / previousAvgTAT) * 100 : 0;
  const conversionChange = previousConversionRate > 0 
    ? ((conversionRate - previousConversionRate) / previousConversionRate) * 100 
    : 0;

  return [
    {
      id: 'tat',
      label: 'Turn Around Time',
      value: `${avgTAT.toFixed(2)} (days)`,
      change: Math.abs(tatChange),
      changeType: tatChange < 0 ? 'decrease' : tatChange > 0 ? 'increase' : 'neutral',
      changePeriod: '31 days ago',
    },
    {
      id: 'conversion',
      label: 'Conversion Rate',
      value: `${conversionRate.toFixed(2)}%`,
      change: Math.abs(conversionChange),
      changeType: conversionChange > 0 ? 'increase' : conversionChange < 0 ? 'decrease' : 'neutral',
      changePeriod: '31 days ago',
    },
    {
      id: 'contacted',
      label: 'Total Contacted Leads',
      value: totalContacted,
      change: 0,
      changeType: 'neutral',
      changePeriod: '31 days ago',
    },
    {
      id: 'total',
      label: 'Total Leads',
      value: totalLeads,
      change: 0,
      changeType: 'neutral',
      changePeriod: '31 days ago',
    },
  ];
};

/**
 * Get dashboard data with caching
 */
export const getDashboardData = async (filters: DashboardFilters): Promise<DashboardData> => {
  // Generate cache key
  const cacheKey = `dashboard:${JSON.stringify(filters)}`;
  
  // Check cache first
  const cached = cache.get<DashboardData>(cacheKey);
  if (cached) {
    logger.info('Returning cached dashboard data');
    return cached;
  }

  logger.info('Fetching fresh dashboard data', { filters });

  // Calculate KPIs
  const kpis = calculateKPIs(filters);

  // Get leads by status
  const leadStatus = getLeadsByStatus(filters);
  const totalLeads = leadStatus.reduce((sum, item) => sum + item.count, 0);
  const leadStatusWithPercentage = leadStatus.map(item => ({
    ...item,
    percentage: totalLeads > 0 ? Number(((item.count / totalLeads) * 100).toFixed(2)) : 0,
  }));

  // Get leads by branch over time
  const leadsByBranch = getLeadsByBranchOverTime(filters, 7);

  // Get revenue by branch over time
  const revenueByBranch = getRevenueByBranchOverTime(filters, 7);

  // Get agent performance
  const agentPerformance = getAgentPerformance(filters);

  // Get top performing agents
  const topPerformingAgents = getTopPerformingAgents(filters, 10);

  // Get branch agent ranking
  const branchAgentRanking = getBranchAgentRanking(filters);

  const dashboardData: DashboardData = {
    kpis,
    leadsByBranch,
    revenueByBranch,
    leadStatus: leadStatusWithPercentage,
    agentPerformance,
    topPerformingAgents,
    branchAgentRanking,
    filters,
  };

  // Cache the result (5 minutes)
  cache.set(cacheKey, dashboardData, 300);

  return dashboardData;
};

