import {
  prisma as defaultPrisma,
  type PrismaClient,
  type Place,
  type PlaceLocation,
  type DuplicateCandidate,
  DuplicateCandidateStatus,
} from '@waynah/database';
import {
  normalizeSafeText,
  normalizeArabicHeuristics,
  normalizePhoneNumber,
  calculateTrigramSimilarity,
} from './text-normalization.js';

export interface PlaceWithLocation extends Place {
  location?: PlaceLocation | null;
}

export interface MatchReasonsDetail {
  spatial: {
    score: number;
    distanceMeters: number | null;
  };
  name: {
    score: number;
    trigramSimilarity: number;
    normalizedSourceAr: string;
    normalizedTargetAr: string;
  };
  phone: {
    score: number;
    matched: boolean;
    sourcePhoneNormalized: string | null;
    targetPhoneNormalized: string | null;
  };
  category: {
    score: number;
    matched: boolean;
    categoryId: string;
  };
  compositeScore: number;
  passedThreshold: boolean;
  rejectionReason?: string | null;
}

export interface DuplicateEvaluationResult {
  sourcePlaceId: string;
  targetPlaceId: string;
  candidateScore: number;
  passedThreshold: boolean;
  matchReasons: MatchReasonsDetail;
}

export function calculateHaversineDistanceMeters(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371000;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
}

export class DuplicateDetectionService {
  private readonly prisma: PrismaClient;

  // Locked parameters according to Phase 9 Contract Gate
  public static readonly SPATIAL_RADIUS_METERS = 100;
  public static readonly NAME_SIMILARITY_THRESHOLD = 0.75;
  public static readonly CANDIDATE_CREATION_THRESHOLD = 0.70;

  public static readonly WEIGHT_SPATIAL = 0.35;
  public static readonly WEIGHT_NAME = 0.40;
  public static readonly WEIGHT_PHONE = 0.15;
  public static readonly WEIGHT_CATEGORY = 0.10;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Evaluates a potential candidate pair between two places.
   * Guarantees canonical sourcePlaceId < targetPlaceId ordering.
   *
   * Formula:
   * S_candidate = (0.35 * S_spatial) + (0.40 * S_name) + (0.15 * S_phone) + (0.10 * S_category)
   */
  public evaluatePair(
    placeA: PlaceWithLocation,
    placeB: PlaceWithLocation
  ): DuplicateEvaluationResult {
    // 1. Canonical pair ordering invariant: sourcePlaceId < targetPlaceId
    const isAFirst = placeA.id < placeB.id;
    const sourcePlace = isAFirst ? placeA : placeB;
    const targetPlace = isAFirst ? placeB : placeA;

    const sourcePlaceId = sourcePlace.id;
    const targetPlaceId = targetPlace.id;

    // 2. Merged / Closed Place Exclusion Guard
    if (
      sourcePlace.verificationStatus === 'CLOSED' ||
      targetPlace.verificationStatus === 'CLOSED'
    ) {
      return {
        sourcePlaceId,
        targetPlaceId,
        candidateScore: 0.0,
        passedThreshold: false,
        matchReasons: {
          spatial: { score: 0.0, distanceMeters: null },
          name: { score: 0.0, trigramSimilarity: 0.0, normalizedSourceAr: '', normalizedTargetAr: '' },
          phone: { score: 0.0, matched: false, sourcePhoneNormalized: null, targetPhoneNormalized: null },
          category: { score: 0.0, matched: false, categoryId: sourcePlace.categoryId },
          compositeScore: 0.0,
          passedThreshold: false,
          rejectionReason: 'CLOSED_PLACE_EXCLUDED',
        },
      };
    }

    // 3. District Hard Filter Guard: Different district -> Reject candidate pair immediately
    if (sourcePlace.districtId !== targetPlace.districtId) {
      return {
        sourcePlaceId,
        targetPlaceId,
        candidateScore: 0.0,
        passedThreshold: false,
        matchReasons: {
          spatial: { score: 0.0, distanceMeters: null },
          name: { score: 0.0, trigramSimilarity: 0.0, normalizedSourceAr: '', normalizedTargetAr: '' },
          phone: { score: 0.0, matched: false, sourcePhoneNormalized: null, targetPhoneNormalized: null },
          category: { score: 0.0, matched: false, categoryId: sourcePlace.categoryId },
          compositeScore: 0.0,
          passedThreshold: false,
          rejectionReason: 'DIFFERENT_DISTRICT',
        },
      };
    }

    // 4. Spatial Distance & Score (S_spatial)
    let distanceMeters: number | null = null;
    let S_spatial = 0.0;

    const sourceLoc = sourcePlace.location;
    const targetLoc = targetPlace.location;

    if (
      sourceLoc &&
      targetLoc &&
      typeof sourceLoc.latitude === 'number' &&
      typeof sourceLoc.longitude === 'number' &&
      typeof targetLoc.latitude === 'number' &&
      typeof targetLoc.longitude === 'number'
    ) {
      distanceMeters = calculateHaversineDistanceMeters(
        sourceLoc.latitude,
        sourceLoc.longitude,
        targetLoc.latitude,
        targetLoc.longitude
      );

      if (distanceMeters <= DuplicateDetectionService.SPATIAL_RADIUS_METERS) {
        S_spatial = 1.0 - distanceMeters / DuplicateDetectionService.SPATIAL_RADIUS_METERS;
      } else {
        S_spatial = 0.0;
      }
    }

    // 5. Name Similarity & Score (S_name)
    const normSourceAr = normalizeArabicHeuristics(sourcePlace.nameAr);
    const normTargetAr = normalizeArabicHeuristics(targetPlace.nameAr);
    const trigramSimAr = calculateTrigramSimilarity(normSourceAr, normTargetAr);

    let maxTrigramSim = trigramSimAr;
    if (sourcePlace.nameEn && targetPlace.nameEn) {
      const normSourceEn = normalizeSafeText(sourcePlace.nameEn);
      const normTargetEn = normalizeSafeText(targetPlace.nameEn);
      const trigramSimEn = calculateTrigramSimilarity(normSourceEn, normTargetEn);
      if (trigramSimEn > maxTrigramSim) {
        maxTrigramSim = trigramSimEn;
      }
    }

    let S_name = 0.0;
    if (maxTrigramSim >= DuplicateDetectionService.NAME_SIMILARITY_THRESHOLD) {
      S_name = maxTrigramSim;
    }

    // 6. Exact Phone Matching & Score (S_phone)
    const sourcePhoneNorm = normalizePhoneNumber(sourcePlace.phoneNumber);
    const targetPhoneNorm = normalizePhoneNumber(targetPlace.phoneNumber);
    let S_phone = 0.0;
    let phoneMatched = false;

    if (sourcePhoneNorm && targetPhoneNorm && sourcePhoneNorm === targetPhoneNorm) {
      S_phone = 1.0;
      phoneMatched = true;
    }

    // 7. Exact Category Matching & Score (S_category)
    let S_category = 0.0;
    let categoryMatched = false;
    if (sourcePlace.categoryId === targetPlace.categoryId) {
      S_category = 1.0;
      categoryMatched = true;
    }

    // 8. Composite Candidate Score Calculation
    const rawCompositeScore =
      DuplicateDetectionService.WEIGHT_SPATIAL * S_spatial +
      DuplicateDetectionService.WEIGHT_NAME * S_name +
      DuplicateDetectionService.WEIGHT_PHONE * S_phone +
      DuplicateDetectionService.WEIGHT_CATEGORY * S_category;

    const candidateScore = Math.round(rawCompositeScore * 1000) / 1000;
    const passedThreshold = candidateScore >= DuplicateDetectionService.CANDIDATE_CREATION_THRESHOLD;

    return {
      sourcePlaceId,
      targetPlaceId,
      candidateScore,
      passedThreshold,
      matchReasons: {
        spatial: {
          score: Math.round(S_spatial * 1000) / 1000,
          distanceMeters,
        },
        name: {
          score: Math.round(S_name * 1000) / 1000,
          trigramSimilarity: Math.round(maxTrigramSim * 1000) / 1000,
          normalizedSourceAr: normSourceAr,
          normalizedTargetAr: normTargetAr,
        },
        phone: {
          score: S_phone,
          matched: phoneMatched,
          sourcePhoneNormalized: sourcePhoneNorm,
          targetPhoneNormalized: targetPhoneNorm,
        },
        category: {
          score: S_category,
          matched: categoryMatched,
          categoryId: sourcePlace.categoryId,
        },
        compositeScore: candidateScore,
        passedThreshold,
        rejectionReason: passedThreshold ? null : 'SCORE_BELOW_THRESHOLD',
      },
    };
  }

  /**
   * Persists or updates a duplicate candidate pair in the database.
   * Invariants:
   * - Canonical ordering sourcePlaceId < targetPlaceId
   * - Unique constraint (sourcePlaceId, targetPlaceId)
   * - Preserves status for existing MERGED / IGNORED candidates
   * - No physical deletion
   */
  public async upsertCandidate(
    evalResult: DuplicateEvaluationResult,
    prismaClient?: PrismaClient
  ): Promise<DuplicateCandidate | null> {
    const db = prismaClient ?? this.prisma;

    if (!evalResult.passedThreshold) {
      return null;
    }

    const { sourcePlaceId, targetPlaceId, candidateScore, matchReasons } = evalResult;

    const existing = await db.duplicateCandidate.findUnique({
      where: {
        sourcePlaceId_targetPlaceId: {
          sourcePlaceId,
          targetPlaceId,
        },
      },
    });

    if (existing) {
      // Re-evaluate / update score and match reasons without resetting MERGED or IGNORED statuses
      return await db.duplicateCandidate.update({
        where: { id: existing.id },
        data: {
          candidateScore,
          matchReasons: matchReasons as any,
          // Retain status if already MERGED or IGNORED, keep as-is
        },
      });
    }

    return await db.duplicateCandidate.create({
      data: {
        sourcePlaceId,
        targetPlaceId,
        candidateScore,
        matchReasons: matchReasons as any,
        status: DuplicateCandidateStatus.PENDING,
      },
    });
  }

  /**
   * Scans candidate matches for a single place against database places in the same district.
   */
  public async detectCandidatesForPlace(
    placeId: string,
    prismaClient?: PrismaClient
  ): Promise<DuplicateCandidate[]> {
    const db = prismaClient ?? this.prisma;

    const place = await db.place.findUnique({
      where: { id: placeId },
      include: { location: true },
    });

    if (!place || place.verificationStatus === 'CLOSED') {
      return [];
    }

    // Find candidate targets in the same district excluding CLOSED places and itself
    const peers = await db.place.findMany({
      where: {
        districtId: place.districtId,
        id: { not: placeId },
        verificationStatus: { not: 'CLOSED' },
      },
      include: { location: true },
    });

    const candidates: DuplicateCandidate[] = [];

    for (const peer of peers) {
      const evaluation = this.evaluatePair(place, peer);
      if (evaluation.passedThreshold) {
        const candidate = await this.upsertCandidate(evaluation, db);
        if (candidate) {
          candidates.push(candidate);
        }
      }
    }

    return candidates;
  }

  /**
   * Scans full database places within a district or globally for candidate duplicates.
   */
  public async scanDistrictForDuplicates(
    districtId: string,
    prismaClient?: PrismaClient
  ): Promise<{ placesEvaluated: number; candidatesDetected: number }> {
    const db = prismaClient ?? this.prisma;

    const places = await db.place.findMany({
      where: {
        districtId,
        verificationStatus: { not: 'CLOSED' },
      },
      include: { location: true },
      orderBy: { id: 'asc' },
    });

    let candidatesDetected = 0;

    for (let i = 0; i < places.length; i++) {
      for (let j = i + 1; j < places.length; j++) {
        const placeI = places[i];
        const placeJ = places[j];
        if (!placeI || !placeJ) continue;

        const evaluation = this.evaluatePair(placeI, placeJ);
        if (evaluation.passedThreshold) {
          const candidate = await this.upsertCandidate(evaluation, db);
          if (candidate) {
            candidatesDetected++;
          }
        }
      }
    }

    return {
      placesEvaluated: places.length,
      candidatesDetected,
    };
  }
}
