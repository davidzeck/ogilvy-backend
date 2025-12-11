/**
 * Data Repository
 * Data access layer for dashboard queries using Prisma ORM
 */

import { prisma } from '../utils/prisma';
import { DashboardFilters } from '../types/dashboard.types';
import logger from '../utils/logger';
import type { Prisma } from '@prisma/client';

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
 * Get date range filter for queries
 */
const getDateRangeFilter = (dateRange?: string): Date | undefined => {
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
      return undefined;
  }

  return startDate;
};

/**
 * Build WHERE clause from filters
 */
const buildWhereClause = (filters: DashboardFilters): Prisma.LeadWhereInput => {
  const where: Prisma.LeadWhereInput = {};

  if (filters.branch) {
    where.branch = {
      name: filters.branch,
    };
  }

  if (filters.agent) {
    where.agent = {
      name: filters.agent,
    };
  }

  if (filters.product) {
    where.product = filters.product;
  }

  if (filters.segment) {
    where.segment = filters.segment;
  }

  if (filters.campaign) {
    where.campaign = filters.campaign;
  }

  const dateFilter = getDateRangeFilter(filters.dateRange);
  if (dateFilter) {
    where.createdAt = {
      gte: dateFilter,
    };
  }

  return where;
};

/**
 * Get all leads with filters
 */
export const getLeads = async (filters: DashboardFilters): Promise<LeadRow[]> => {
  try {
    const leads = await prisma.lead.findMany({
      where: buildWhereClause(filters),
      include: {
        branch: true,
        agent: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return leads.map((lead) => ({
      id: lead.id,
      branch_id: lead.branchId,
      agent_id: lead.agentId,
      status: lead.status,
      product: lead.product,
      segment: lead.segment,
      campaign: lead.campaign,
      revenue: lead.revenue,
      created_at: lead.createdAt.toISOString(),
      updated_at: lead.updatedAt.toISOString(),
      contacted_at: lead.contactedAt?.toISOString() || null,
      converted_at: lead.convertedAt?.toISOString() || null,
    }));
  } catch (error) {
    logger.error('Error fetching leads:', error);
    throw error;
  }
};

/**
 * Get leads by status
 */
export const getLeadsByStatus = async (
  filters: DashboardFilters
): Promise<Array<{ status: string; count: number }>> => {
  try {
    const leads = await prisma.lead.groupBy({
      by: ['status'],
      where: buildWhereClause(filters),
      _count: true,
    });

    // Sort by count descending
    const sorted = leads
      .map((group) => ({
        status: group.status,
        count: group._count,
      }))
      .sort((a, b) => b.count - a.count);

    return sorted;
  } catch (error) {
    logger.error('Error fetching leads by status:', error);
    throw error;
  }
};

/**
 * Get leads by branch over time periods
 */
export const getLeadsByBranchOverTime = async (
  filters: DashboardFilters,
  periods: number = 7
): Promise<
  Array<{
    period: string;
    leads: number;
    conversionRate: number;
  }>
> => {
  const now = new Date();
  const periodDays =
    filters.dateRange === 'last7days' ? 1 : filters.dateRange === 'last30days' ? 4 : 7;

  const results: Array<{ period: string; leads: number; conversionRate: number }> = [];

  for (let i = periods - 1; i >= 0; i--) {
    const periodStart = new Date(now.getTime() - (i + 1) * periodDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);

    const where = buildWhereClause(filters);
    where.createdAt = {
      gte: periodStart,
      lt: periodEnd,
    };

    const [totalLeads, convertedLeads] = await Promise.all([
      prisma.lead.count({ where }),
      prisma.lead.count({
        where: {
          ...where,
          status: 'Product/Service Sold',
        },
      }),
    ]);

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
export const getRevenueByBranchOverTime = async (
  filters: DashboardFilters,
  periods: number = 7
): Promise<
  Array<{
    period: string;
    revenue: number;
    target?: number;
  }>
> => {
  const now = new Date();
  const periodDays =
    filters.dateRange === 'last7days' ? 1 : filters.dateRange === 'last30days' ? 4 : 7;

  const results: Array<{ period: string; revenue: number; target?: number }> = [];

  for (let i = periods - 1; i >= 0; i--) {
    const periodStart = new Date(now.getTime() - (i + 1) * periodDays * 24 * 60 * 60 * 1000);
    const periodEnd = new Date(now.getTime() - i * periodDays * 24 * 60 * 60 * 1000);

    const where = buildWhereClause(filters);
    where.createdAt = {
      gte: periodStart,
      lt: periodEnd,
    };
    where.status = 'Product/Service Sold';

    const result = await prisma.lead.aggregate({
      where,
      _sum: {
        revenue: true,
      },
    });

    const revenue = result._sum.revenue || 0;

    results.push({
      period: `${i + 1}${i === 0 ? 'st' : i === 1 ? 'nd' : i === 2 ? 'rd' : 'th'}`,
      revenue: Number(revenue.toFixed(2)),
      target: Number((revenue * 1.1).toFixed(2)), // 10% above revenue as target
    });
  }

  return results;
};

/**
 * Get agent performance data
 */
export const getAgentPerformance = async (
  filters: DashboardFilters
): Promise<
  Array<{
    agentId: string;
    agentName: string;
    leads: number;
    revenue: number;
    conversionRate: number;
    turnAroundTime: number;
  }>
> => {
  try {
    const where = buildWhereClause(filters);

    const agents = await prisma.agent.findMany({
      where: filters.branch
        ? {
            branch: {
              name: filters.branch,
            },
            leads: {
              some: where,
            },
          }
        : {
            leads: {
              some: where,
            },
          },
      include: {
        leads: {
          where,
        },
      },
    });

    const results = agents
      .map((agent) => {
        const totalLeads = agent.leads.length;
        const convertedLeads = agent.leads.filter((l) => l.status === 'Product/Service Sold').length;
        const totalRevenue = agent.leads
          .filter((l) => l.status === 'Product/Service Sold')
          .reduce((sum, l) => sum + l.revenue, 0);

        // Calculate turn around time
        const contactedLeads = agent.leads.filter((l) => l.contactedAt);
        let avgTAT = 0;
        if (contactedLeads.length > 0) {
          const totalDays = contactedLeads.reduce((sum, l) => {
            if (l.contactedAt && l.createdAt) {
              const days =
                (l.contactedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }
            return sum;
          }, 0);
          avgTAT = totalDays / contactedLeads.length;
        }

        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        return {
          agentId: String(agent.id),
          agentName: agent.name,
          leads: totalLeads,
          revenue: Number(totalRevenue.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
          turnAroundTime: Number(avgTAT.toFixed(2)),
        };
      })
      .filter((agent) => agent.leads > 0)
      .sort((a, b) => b.revenue - a.revenue);

    return results;
  } catch (error) {
    logger.error('Error fetching agent performance:', error);
    throw error;
  }
};

/**
 * Get top performing agents
 */
export const getTopPerformingAgents = async (
  filters: DashboardFilters,
  limit: number = 10
): Promise<
  Array<{
    id: string;
    name: string;
    turnAroundTime: number;
    conversionRate: number;
    branch: string;
  }>
> => {
  try {
    const where = buildWhereClause(filters);

    const agents = await prisma.agent.findMany({
      where: filters.branch
        ? {
            branch: {
              name: filters.branch,
            },
            leads: {
              some: where,
            },
          }
        : {
            leads: {
              some: where,
            },
          },
      include: {
        branch: true,
        leads: {
          where,
        },
      },
    });

    const results = agents
      .map((agent) => {
        const totalLeads = agent.leads.length;
        const convertedLeads = agent.leads.filter((l) => l.status === 'Product/Service Sold').length;

        // Calculate turn around time
        const contactedLeads = agent.leads.filter((l) => l.contactedAt);
        let avgTAT = 0;
        if (contactedLeads.length > 0) {
          const totalDays = contactedLeads.reduce((sum, l) => {
            if (l.contactedAt && l.createdAt) {
              const days =
                (l.contactedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
              return sum + days;
            }
            return sum;
          }, 0);
          avgTAT = totalDays / contactedLeads.length;
        }

        const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

        return {
          id: String(agent.id),
          name: agent.name,
          turnAroundTime: Number(avgTAT.toFixed(2)),
          conversionRate: Number(conversionRate.toFixed(2)),
          branch: agent.branch.name,
          convertedLeads,
        };
      })
      .filter((agent) => agent.convertedLeads > 0)
      .sort((a, b) => {
        if (b.convertedLeads !== a.convertedLeads) {
          return b.convertedLeads - a.convertedLeads;
        }
        return a.turnAroundTime - b.turnAroundTime;
      })
      .slice(0, limit)
      .map(({ convertedLeads, ...rest }) => rest);

    return results;
  } catch (error) {
    logger.error('Error fetching top performing agents:', error);
    throw error;
  }
};

/**
 * Get branch agent ranking
 */
export const getBranchAgentRanking = async (
  filters: DashboardFilters
): Promise<
  Array<{
    agentName: string;
    target: number;
    realised: number;
    currency?: string;
  }>
> => {
  try {
    const where = buildWhereClause(filters);

    const agents = await prisma.agent.findMany({
      where: filters.branch
        ? {
            branch: {
              name: filters.branch,
            },
            leads: {
              some: where,
            },
          }
        : {
            leads: {
              some: where,
            },
          },
      include: {
        leads: {
          where,
        },
      },
    });

    const results = agents.map((agent) => {
      const totalRevenue = agent.leads.reduce((sum, l) => sum + l.revenue, 0);
      const realisedRevenue = agent.leads
        .filter((l) => l.status === 'Product/Service Sold')
        .reduce((sum, l) => sum + l.revenue, 0);

      return {
        agentName: agent.name,
        target: Number((totalRevenue * 1.1).toFixed(2)),
        realised: Number(realisedRevenue.toFixed(2)),
        currency: 'KES',
      };
    });

    return results.sort((a, b) => b.realised - a.realised);
  } catch (error) {
    logger.error('Error fetching branch agent ranking:', error);
    throw error;
  }
};

/**
 * Get all branches with their performance metrics
 */
export const getAllBranchesPerformance = async (
  filters: DashboardFilters
): Promise<
  Array<{
    branchId: number;
    branchName: string;
    totalLeads: number;
    totalRevenue: number;
    conversionRate: number;
    avgTurnAroundTime: number;
  }>
> => {
  try {
    const where = buildWhereClause(filters);
    delete where.branch; // Remove branch filter to get all branches

    const branches = await prisma.branch.findMany({
      include: {
        leads: {
          where,
        },
      },
    });

    return branches.map((branch) => {
      const totalLeads = branch.leads.length;
      const convertedLeads = branch.leads.filter((l) => l.status === 'Product/Service Sold').length;
      const totalRevenue = branch.leads
        .filter((l) => l.status === 'Product/Service Sold')
        .reduce((sum, l) => sum + l.revenue, 0);

      // Calculate turn around time
      const contactedLeads = branch.leads.filter((l) => l.contactedAt);
      let avgTAT = 0;
      if (contactedLeads.length > 0) {
        const totalDays = contactedLeads.reduce((sum, l) => {
          if (l.contactedAt && l.createdAt) {
            const days = (l.contactedAt.getTime() - l.createdAt.getTime()) / (1000 * 60 * 60 * 24);
            return sum + days;
          }
          return sum;
        }, 0);
        avgTAT = totalDays / contactedLeads.length;
      }

      const conversionRate = totalLeads > 0 ? (convertedLeads / totalLeads) * 100 : 0;

      return {
        branchId: branch.id,
        branchName: branch.name,
        totalLeads,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        conversionRate: Number(conversionRate.toFixed(2)),
        avgTurnAroundTime: Number(avgTAT.toFixed(2)),
      };
    });
  } catch (error) {
    logger.error('Error fetching all branches performance:', error);
    throw error;
  }
};

/**
 * Get calling pattern analysis for insights
 */
export const getCallingPatternAnalysis = async (
  filters: DashboardFilters
): Promise<{
  bestCallingHour: { hour: number; successRate: number };
  hourlyStats: Array<{
    hour: number;
    totalCalls: number;
    successfulCalls: number;
    successRate: number;
  }>;
}> => {
  try {
    const where = buildWhereClause(filters);
    where.contactedAt = {
      not: null,
    };

    const leads = await prisma.lead.findMany({
      where,
      select: {
        contactedAt: true,
        status: true,
      },
    });

    // Group by hour
    const hourlyData: Record<
      number,
      { totalCalls: number; successfulCalls: number }
    > = {};

    leads.forEach((lead) => {
      if (!lead.contactedAt) return;
      const hour = lead.contactedAt.getHours();
      if (!hourlyData[hour]) {
        hourlyData[hour] = { totalCalls: 0, successfulCalls: 0 };
      }
      hourlyData[hour].totalCalls++;
      if (lead.status === 'Product/Service Sold') {
        hourlyData[hour].successfulCalls++;
      }
    });

    const hourlyStats = Object.entries(hourlyData)
      .map(([hour, data]) => {
        const successRate =
          data.totalCalls > 0 ? (data.successfulCalls / data.totalCalls) * 100 : 0;
        return {
          hour: Number(hour),
          totalCalls: data.totalCalls,
          successfulCalls: data.successfulCalls,
          successRate: Number(successRate.toFixed(2)),
        };
      })
      .sort((a, b) => a.hour - b.hour);

    // Find the best calling hour
    let bestCallingHour = { hour: 9, successRate: 0 };
    if (hourlyStats.length > 0) {
      const best = hourlyStats.reduce((max, current) =>
        current.successRate > max.successRate ? current : max
      );
      bestCallingHour = { hour: best.hour, successRate: best.successRate };
    }

    return {
      bestCallingHour,
      hourlyStats,
    };
  } catch (error) {
    logger.error('Error fetching calling pattern analysis:', error);
    throw error;
  }
};
