/**
 * Relevancy ranking primitives for WAYNAH Search Engine.
 * Pure mathematical functions for calculating text match scores, distance decay, and blended relevance.
 *
 * HARD ISOLATION RULE:
 * Relevancy calculations depend strictly on text similarity and spatial proximity.
 * Trust Score, Verification Status, and Provider authority metrics MUST remain strictly isolated
 * and must NEVER alter the relevancy score calculation.
 */

/**
 * Calculates a normalized distance factor between 0.0 and 1.0 using standard inverse decay:
 * distanceFactor = 1.0 / (1.0 + (distanceMeters / 1000.0))
 *
 * @param distanceMeters Distance in meters from search origin point
 * @returns Normalized distance factor (0.0 to 1.0)
 */
export function calculateDistanceFactor(distanceMeters?: number | null): number {
  if (distanceMeters === null || distanceMeters === undefined || isNaN(distanceMeters) || distanceMeters < 0) {
    return 0.0;
  }
  return 1.0 / (1.0 + distanceMeters / 1000.0);
}

export interface RelevancyScoreInput {
  textScore: number;
  distanceMeters?: number | null;
  hasQuery: boolean;
  hasGeo: boolean;
}

/**
 * Calculates the blended relevancy score based on baseline formula:
 * - Query + Location: textScore * 0.7 + distanceFactor * 0.3
 * - Query only: textScore
 * - Location only: distanceFactor
 * - Neither: 1.0 (default sorting by creation date)
 *
 * @param input Text score, distance in meters, and query flags
 * @returns Blended relevancy score
 */
export function calculateBlendedRelevancyScore(input: RelevancyScoreInput): number {
  const { textScore, distanceMeters, hasQuery, hasGeo } = input;
  const clampedTextScore = Math.max(0, Math.min(1, textScore || 0));
  const distanceFactor = calculateDistanceFactor(distanceMeters);

  if (hasQuery && hasGeo) {
    return clampedTextScore * 0.7 + distanceFactor * 0.3;
  }
  if (hasQuery) {
    return clampedTextScore;
  }
  if (hasGeo) {
    return distanceFactor;
  }
  return 1.0;
}

export interface SortableSearchResult {
  nameAr: string;
  relevancyScore: number;
  distanceMeters?: number | null;
}

/**
 * Deterministically sorts search results by relevancyScore (DESC), distanceMeters (ASC), and nameAr (ASC).
 */
export function sortSearchResultsByRelevancy<T extends SortableSearchResult>(
  results: T[]
): T[] {
  return [...results].sort((a, b) => {
    // Primary: Relevancy score descending
    if (Math.abs(b.relevancyScore - a.relevancyScore) > 0.0001) {
      return b.relevancyScore - a.relevancyScore;
    }

    // Secondary: Distance meters ascending (if present)
    const distA = a.distanceMeters ?? Number.MAX_SAFE_INTEGER;
    const distB = b.distanceMeters ?? Number.MAX_SAFE_INTEGER;
    if (distA !== distB) {
      return distA - distB;
    }

    // Tertiary: Arabic name alphabetical ascending
    return a.nameAr.localeCompare(b.nameAr, 'ar');
  });
}
