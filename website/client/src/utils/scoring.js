import { clamp } from './geo.js';

/**
 * Score weights: cost 40%, timeline 20%, experience 20%, sustainability 20%
 */
export function scoreBid(bid, plan) {
  const planCost = plan?.costBreakdown?.total ?? plan?.costEstimate ?? 1;
  const planTime = plan?.timelineMonths ?? 1;

  const costScore = 40 * clamp(planCost / Math.max(1, bid.cost), 0, 1);
  const timeScore = 20 * clamp(planTime / Math.max(1, bid.timelineMonths), 0, 1);
  const expScore = clamp((bid.experienceCount ?? 0) * 2, 0, 20);
  const sustScore = 20 * clamp((bid.recycledPercent ?? 0) / 100, 0, 1);

  return Math.round(costScore + timeScore + expScore + sustScore);
}
