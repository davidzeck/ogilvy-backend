/**
 * Dashboard Types
 * Type definitions for the Branch Manager Dashboard API
 */

export type DateRange = 'last7days' | 'last30days' | 'last90days' | 'lastYear' | 'all';

export interface DashboardFilters {
  dateRange?: DateRange;
  branch?: string;
  agent?: string;
  product?: string;
  segment?: string;
  campaign?: string;
}

export interface KPI {
  id: string;
  label: string;
  value: number | string;
  change?: number;
  changeType?: 'increase' | 'decrease' | 'neutral';
  changePeriod?: string;
  meta?: Record<string, any>;
}

export interface LeadStatus {
  status: string;
  count: number;
  percentage?: number;
}

export interface BranchMetric {
  branchId: string;
  branchName: string;
  leads: number;
  revenue: number;
  conversionRate?: number;
}

export interface AgentPerformance {
  agentId: string;
  agentName: string;
  leads: number;
  revenue: number;
  conversionRate: number;
  turnAroundTime: number; // in days
}

export interface TopPerformingAgent {
  id: string;
  name: string;
  turnAroundTime: number; // in days
  conversionRate: number;
  branch: string;
}

export interface BranchAgentRanking {
  agentName: string;
  target: number;
  realised: number;
  currency?: string;
}

export interface LeadsByBranchData {
  period: string;
  leads: number;
  conversionRate: number;
}

export interface RevenueByBranchData {
  period: string;
  revenue: number;
  target?: number;
}

export interface DashboardData {
  kpis: KPI[];
  leadsByBranch: LeadsByBranchData[];
  revenueByBranch: RevenueByBranchData[];
  leadStatus: LeadStatus[];
  agentPerformance: AgentPerformance[];
  topPerformingAgents: TopPerformingAgent[];
  branchAgentRanking: BranchAgentRanking[];
  filters: DashboardFilters;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message: string;
  timestamp: string;
  error?: string;
}

