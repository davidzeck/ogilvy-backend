/**
 * Insights Service
 * Business logic for generating actionable insights and recommendations
 */

import { getCallingPatternAnalysis, getLeads } from '../repositories/data.repository';
import { DashboardFilters, ActionableInsight } from '../types/dashboard.types';
import logger from '../utils/logger';

/**
 * Generate actionable insights based on data patterns
 */
export const generateActionableInsights = (filters: DashboardFilters): ActionableInsight[] => {
  const insights: ActionableInsight[] = [];

  try {
    // Get calling pattern analysis
    const callingPatterns = getCallingPatternAnalysis(filters);
    const { bestCallingHour, hourlyStats } = callingPatterns;

    // Get leads data for TAT calculation
    const leads = getLeads(filters);
    const contactedLeads = leads.filter(lead => lead.contacted_at);

    // Calculate current TAT
    let currentTAT = 0;
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
      currentTAT = totalDays / contactedLeads.length;
    }

    // Calculate current conversion rate
    const totalLeads = leads.length;
    const convertedLeads = leads.filter(lead => lead.status === 'Product/Service Sold');
    const currentConversionRate = totalLeads > 0 ? (convertedLeads.length / totalLeads) * 100 : 0;

    // Insight 1: Improve Turn Around Time
    if (bestCallingHour.hour >= 8 && bestCallingHour.hour <= 12 && hourlyStats.length > 0) {
      // Calculate potential improvement
      const avgSuccessRate = hourlyStats.reduce((sum, stat) => sum + stat.successRate, 0) / hourlyStats.length;
      const potentialImprovement = bestCallingHour.successRate > avgSuccessRate
        ? ((bestCallingHour.successRate - avgSuccessRate) / avgSuccessRate) * 100
        : 2;

      const startHour = Math.max(8, bestCallingHour.hour - 1);
      const endHour = Math.min(12, bestCallingHour.hour + 3);

      insights.push({
        id: 'improve-tat',
        title: 'Improve Your Turn Around Time',
        description: `Increase your turn around time by ${potentialImprovement.toFixed(0)}% by calling your clients between ${startHour}:30 am - ${endHour}:00 pm.`,
        improvement: Number(potentialImprovement.toFixed(0)),
        metric: 'turnAroundTime',
        priority: 'high',
      });
    } else {
      // Default recommendation
      insights.push({
        id: 'improve-tat',
        title: 'Improve Your Turn Around Time',
        description: 'Increase your turn around time by 2% by calling your clients between 8:30 am - 12:00 pm.',
        improvement: 2,
        metric: 'turnAroundTime',
        priority: 'high',
      });
    }

    // Insight 2: Increase Conversion Rate
    if (bestCallingHour.successRate > 0) {
      const potentialConversionImprovement = bestCallingHour.successRate > currentConversionRate
        ? ((bestCallingHour.successRate - currentConversionRate) / currentConversionRate) * 100
        : 2;

      const startHour = Math.max(8, bestCallingHour.hour - 1);
      const endHour = Math.min(12, bestCallingHour.hour + 3);

      insights.push({
        id: 'improve-conversion',
        title: 'Increase Conversion Rate',
        description: `Increase your conversion rate by ${potentialConversionImprovement.toFixed(0)}% by calling your clients between ${startHour}:30 am - ${endHour}:00 pm.`,
        improvement: Number(potentialConversionImprovement.toFixed(0)),
        metric: 'conversionRate',
        priority: 'high',
      });
    } else {
      // Default recommendation
      insights.push({
        id: 'improve-conversion',
        title: 'Increase Conversion Rate',
        description: 'Increase your conversion rate by 2% by calling your clients between 8:30 am - 12:00 pm.',
        improvement: 2,
        metric: 'conversionRate',
        priority: 'high',
      });
    }

    // Insight 3: Additional insights based on data patterns
    if (currentTAT > 7) {
      insights.push({
        id: 'reduce-response-time',
        title: 'Reduce Response Time',
        description: `Your average turn around time is ${currentTAT.toFixed(1)} days. Consider setting up automated follow-ups to reduce response time by 20%.`,
        improvement: 20,
        metric: 'turnAroundTime',
        priority: 'medium',
      });
    }

    if (currentConversionRate < 5) {
      insights.push({
        id: 'boost-conversions',
        title: 'Boost Conversion Performance',
        description: 'Focus on high-value leads during peak hours to potentially increase conversions by 15%.',
        improvement: 15,
        metric: 'conversionRate',
        priority: 'medium',
      });
    }

    logger.info(`Generated ${insights.length} actionable insights`);
    return insights;
  } catch (error) {
    logger.error('Error generating actionable insights:', error);
    // Return default insights on error
    return [
      {
        id: 'improve-tat',
        title: 'Improve Your Turn Around Time',
        description: 'Increase your turn around time by 2% by calling your clients between 8:30 am - 12:00 pm.',
        improvement: 2,
        metric: 'turnAroundTime',
        priority: 'high',
      },
      {
        id: 'improve-conversion',
        title: 'Increase Conversion Rate',
        description: 'Increase your conversion rate by 2% by calling your clients between 8:30 am - 12:00 pm.',
        improvement: 2,
        metric: 'conversionRate',
        priority: 'high',
      },
    ];
  }
};
