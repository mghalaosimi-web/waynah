import { describe, it, expect } from 'vitest';
import {
  calculateDistanceFactor,
  calculateBlendedRelevancyScore,
  sortSearchResultsByRelevancy,
} from '../src/ranking/relevancy.js';

describe('@waynah/search — Relevancy Ranking Engine', () => {
  it('1. Calculates distance factor with inverse decay', () => {
    expect(calculateDistanceFactor(0)).toBe(1.0); // 0m distance = 1.0 factor
    expect(calculateDistanceFactor(1000)).toBe(0.5); // 1000m (1km) distance = 0.5 factor
    expect(calculateDistanceFactor(9000)).toBe(0.1); // 9000m (9km) distance = 0.1 factor
    expect(calculateDistanceFactor(null)).toBe(0.0);
    expect(calculateDistanceFactor(undefined)).toBe(0.0);
  });

  it('2. Calculates blended relevancy score (Query + Location)', () => {
    // textScore = 0.8, distance = 1000m (distanceFactor = 0.5)
    // score = 0.8 * 0.7 + 0.5 * 0.3 = 0.56 + 0.15 = 0.71
    const score = calculateBlendedRelevancyScore({
      textScore: 0.8,
      distanceMeters: 1000,
      hasQuery: true,
      hasGeo: true,
    });
    expect(score).toBeCloseTo(0.71, 4);
  });

  it('3. Calculates relevancy score (Query only)', () => {
    const score = calculateBlendedRelevancyScore({
      textScore: 0.9,
      distanceMeters: 500,
      hasQuery: true,
      hasGeo: false,
    });
    expect(score).toBe(0.9);
  });

  it('4. Calculates relevancy score (Location only)', () => {
    const score = calculateBlendedRelevancyScore({
      textScore: 0,
      distanceMeters: 1000,
      hasQuery: false,
      hasGeo: true,
    });
    expect(score).toBe(0.5);
  });

  it('5. Deterministically sorts search results by relevancy score DESC and distance ASC', () => {
    const results = [
      { id: '1', nameAr: 'باء', relevancyScore: 0.5, distanceMeters: 2000 },
      { id: '2', nameAr: 'ألف', relevancyScore: 0.8, distanceMeters: 5000 },
      { id: '3', nameAr: 'جيم', relevancyScore: 0.5, distanceMeters: 500 },
      { id: '4', nameAr: 'أحمد', relevancyScore: 0.5, distanceMeters: 500 },
    ];

    const sorted = sortSearchResultsByRelevancy(results);

    expect(sorted[0].id).toBe('2'); // Highest relevancyScore (0.8)
    expect(sorted[1].id).toBe('4'); // Relevancy 0.5, distance 500m, nameAr 'أحمد' (alphabetical before 'جيم')
    expect(sorted[2].id).toBe('3'); // Relevancy 0.5, distance 500m, nameAr 'جيم'
    expect(sorted[3].id).toBe('1'); // Relevancy 0.5, distance 2000m
  });

  it('6. HARD ISOLATION SAFETY ASSERTION: Trust score metadata does not alter relevancy output', () => {
    const itemA = {
      textScore: 0.75,
      distanceMeters: 2000,
      hasQuery: true,
      hasGeo: true,
      trustMetadata: { verificationStatus: 'UNVERIFIED', trustScore: 0.1 },
    };

    const itemB = {
      textScore: 0.75,
      distanceMeters: 2000,
      hasQuery: true,
      hasGeo: true,
      trustMetadata: { verificationStatus: 'VERIFIED', trustScore: 0.99 },
    };

    const scoreA = calculateBlendedRelevancyScore(itemA);
    const scoreB = calculateBlendedRelevancyScore(itemB);

    // Relevancy score MUST be strictly identical regardless of trust metadata
    expect(scoreA).toBe(scoreB);
  });
});
