/**
 * Ranking Service
 * Business logic for calculating branch and country rankings
 */

import { getAllBranchesPerformance } from '../repositories/data.repository';
import { DashboardFilters, BranchRanking, CountryRanking, CountryRankingTableRow } from '../types/dashboard.types';
import logger from '../utils/logger';

/**
 * Calculate a composite performance score for ranking
 * Weights: Revenue (40%), Conversion Rate (30%), Leads (20%), TAT (10%)
 */
const calculatePerformanceScore = (
  revenue: number,
  conversionRate: number,
  leads: number,
  tat: number
): number => {
  // Normalize metrics (higher is better, except for TAT where lower is better)
  const revenueScore = revenue / 1000; // Scale down revenue
  const conversionScore = conversionRate * 10; // Scale up conversion rate
  const leadsScore = leads / 10; // Scale down leads
  const tatScore = tat > 0 ? 100 / tat : 0; // Inverse TAT (lower TAT = higher score)

  // Weighted composite score
  const score = (
    revenueScore * 0.4 +
    conversionScore * 0.3 +
    leadsScore * 0.2 +
    tatScore * 0.1
  );

  return Number(score.toFixed(2));
};

/**
 * Get branch ranking position
 */
export const getBranchRanking = (filters: DashboardFilters): BranchRanking => {
  try {
    // Get all branches with their performance metrics
    const allBranches = getAllBranchesPerformance({ ...filters, branch: undefined });

    if (allBranches.length === 0) {
      return {
        position: 1,
        totalBranches: 1,
        score: 0,
      };
    }

    // Calculate performance scores for all branches
    const branchesWithScores = allBranches.map((branch) => ({
      ...branch,
      score: calculatePerformanceScore(
        branch.totalRevenue,
        branch.conversionRate,
        branch.totalLeads,
        branch.avgTurnAroundTime
      ),
    }));

    // Sort by score (highest first)
    branchesWithScores.sort((a, b) => b.score - a.score);

    // Find the position of the current branch (if filtered)
    let position = 1;
    let currentBranchScore = 0;

    if (filters.branch) {
      const currentBranchIndex = branchesWithScores.findIndex(
        (b) => b.branchName.toLowerCase() === filters.branch?.toLowerCase()
      );

      if (currentBranchIndex !== -1) {
        position = currentBranchIndex + 1;
        currentBranchScore = branchesWithScores[currentBranchIndex].score;
      }
    } else {
      // If no specific branch filter, return the top branch
      position = 1;
      currentBranchScore = branchesWithScores[0]?.score || 0;
    }

    logger.info(`Branch ranking calculated: Position ${position} out of ${allBranches.length}`);

    return {
      position,
      totalBranches: allBranches.length,
      branch: filters.branch,
      score: currentBranchScore,
    };
  } catch (error) {
    logger.error('Error calculating branch ranking:', error);
    return {
      position: 1,
      totalBranches: 1,
      score: 0,
    };
  }
};

/**
 * Get country ranking position
 * Note: In the current implementation, we assume all branches are in the same country (Kenya)
 * This can be extended when multi-country data is available
 */
export const getCountryRanking = (filters: DashboardFilters): CountryRanking => {
  try {
    // Get all branches performance
    const allBranches = getAllBranchesPerformance({ ...filters, branch: undefined });

    if (allBranches.length === 0) {
      return {
        position: 1,
        totalCountries: 1,
        country: 'Kenya',
        score: 0,
      };
    }

    // Calculate aggregate country performance
    const totalRevenue = allBranches.reduce((sum, b) => sum + b.totalRevenue, 0);
    const totalLeads = allBranches.reduce((sum, b) => sum + b.totalLeads, 0);
    const avgConversionRate = allBranches.reduce((sum, b) => sum + b.conversionRate, 0) / allBranches.length;
    const avgTAT = allBranches.reduce((sum, b) => sum + b.avgTurnAroundTime, 0) / allBranches.length;

    // Calculate country score
    const countryScore = calculatePerformanceScore(totalRevenue, avgConversionRate, totalLeads, avgTAT);

    // In a real multi-country scenario, we would compare against other countries
    // For now, we'll simulate a ranking based on the score
    const simulatedTotalCountries = 500;
    const simulatedPosition = Math.max(
      1,
      Math.min(
        simulatedTotalCountries,
        Math.floor(simulatedTotalCountries * (1 - countryScore / 1000))
      )
    );

    logger.info(`Country ranking calculated: Position ${simulatedPosition} out of ${simulatedTotalCountries}`);

    return {
      position: simulatedPosition,
      totalCountries: simulatedTotalCountries,
      country: 'Kenya',
      score: countryScore,
    };
  } catch (error) {
    logger.error('Error calculating country ranking:', error);
    return {
      position: 493,
      totalCountries: 500,
      country: 'Kenya',
      score: 0,
    };
  }
};

/**
 * Get country ranking table data
 * Note: This is simulated data as we currently only have one country (Kenya)
 * In a real multi-country implementation, this would query actual country-level data
 */
export const getCountryRankingTable = (filters: DashboardFilters): CountryRankingTableRow[] => {
  try {
    const allBranches = getAllBranchesPerformance({ ...filters, branch: undefined });

    if (allBranches.length === 0) {
      return [];
    }

    // Aggregate data for Kenya
    const totalLeads = allBranches.reduce((sum, b) => sum + b.totalLeads, 0);
    const totalRevenue = allBranches.reduce((sum, b) => sum + b.totalRevenue, 0);
    const avgConversionRate = allBranches.reduce((sum, b) => sum + b.conversionRate, 0) / allBranches.length;

    // In a real scenario, this would include multiple countries
    const countryData: CountryRankingTableRow[] = [
      {
        rank: 1,
        country: 'Kenya',
        branches: allBranches.length,
        totalLeads,
        totalRevenue: Number(totalRevenue.toFixed(2)),
        conversionRate: Number(avgConversionRate.toFixed(2)),
      },
    ];

    logger.info(`Country ranking table generated with ${countryData.length} entries`);

    return countryData;
  } catch (error) {
    logger.error('Error generating country ranking table:', error);
    return [];
  }
};
