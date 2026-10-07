import {
  prisma as defaultPrisma,
  type PrismaClient,
  type PlaceObservation,
  type DataSource,
} from '@waynah/database';
import { ConfidenceScoringService } from '../intelligence/confidence-scoring.service.js';

export interface FreshnessDecayOptions {
  effectiveNow?: Date;
  batchSize?: number;
}

export interface FreshnessDecayResult {
  totalProcessed: number;
  totalUpdated: number;
  totalUnchanged: number;
  batchesExecuted: number;
}

/**
 * Calculates the deterministic decayed confidence score S(t) for a given observation
 * baseline S0 and discoveredAt anchor timestamp.
 *
 * Formula (Locked OQ-34 Contract):
 * S(t) = S0 * MAX(0.20, 1 - 0.10 * MAX(0, (daysElapsed - 90) / 30))
 *
 * Parameters:
 * - Fresh Period: 90 days
 * - Decay Rate: 10% per 30 days
 * - Minimum Floor: 0.20 * S0
 * - Floor reached: Day 330
 */
export function calculateDecayedConfidence(
  S0: number,
  discoveredAt: Date | string,
  effectiveNow: Date = new Date()
): number {
  const discoveredMs = new Date(discoveredAt).getTime();
  const nowMs = effectiveNow.getTime();
  const diffMs = Math.max(0, nowMs - discoveredMs);
  const daysElapsed = diffMs / (1000 * 60 * 60 * 24);

  const decayTerm = Math.max(0, (daysElapsed - 90) / 30);
  const decayFactor = Math.max(0.20, 1 - 0.10 * decayTerm);

  const rawSt = S0 * decayFactor;
  return Math.round(rawSt * 100) / 100;
}

export class DataFreshnessService {
  private readonly prisma: PrismaClient;
  private readonly confidenceScoringService: ConfidenceScoringService;

  constructor(
    prismaClient: PrismaClient = defaultPrisma,
    confidenceScoringService?: ConfidenceScoringService
  ) {
    this.prisma = prismaClient;
    this.confidenceScoringService =
      confidenceScoringService ?? new ConfidenceScoringService(this.prisma);
  }

  /**
   * Reconstructs the non-decayed baseline score S0 independently from source weight and consensus.
   * Does NOT depend on current decayed confidenceScore directly or indirectly.
   */
  public async reconstructBaselineS0(
    observation: PlaceObservation & { dataSource: DataSource },
    prismaClient?: PrismaClient
  ): Promise<number> {
    const db = prismaClient ?? this.prisma;
    let relatedObservations: PlaceObservation[] = [];

    if (observation.placeId) {
      relatedObservations = await db.placeObservation.findMany({
        where: {
          placeId: observation.placeId,
          id: { not: observation.id },
        },
      });
    }

    return this.confidenceScoringService.calculateScore(
      observation,
      observation.dataSource,
      relatedObservations
    );
  }

  /**
   * Identifies eligible observations and applies deterministic stale decay S(t).
   *
   * Rules:
   * - Uses cursor strategy (id > lastProcessedId) in bounded batches (default: 500).
   * - Fresh observations (daysElapsed <= 90) retain S0 baseline.
   * - Observations already at target score receive zero DB writes.
   * - Never mutates historical observation attributes or discoveredAt timestamp.
   * - Never deletes observations.
   * - Never compounds decay.
   */
  public async processStaleDecay(
    options: FreshnessDecayOptions = {},
    prismaClient?: PrismaClient
  ): Promise<FreshnessDecayResult> {
    const db = prismaClient ?? this.prisma;
    const effectiveNow = options.effectiveNow ?? new Date();
    const batchSize = options.batchSize ?? 500;

    let lastProcessedId = '';
    let totalProcessed = 0;
    let totalUpdated = 0;
    let totalUnchanged = 0;
    let batchesExecuted = 0;

    while (true) {
      const batch: (PlaceObservation & { dataSource: DataSource })[] =
        (await db.placeObservation.findMany({
          where: {
            id: { gt: lastProcessedId },
          },
          include: {
            dataSource: true,
          },
          orderBy: {
            id: 'asc',
          },
          take: batchSize,
        })) ?? [];

      if (!batch || batch.length === 0) {
        break;
      }

      batchesExecuted++;

      for (const obs of batch) {
        totalProcessed++;
        lastProcessedId = obs.id;

        // Reconstruct baseline S0
        const S0 = await this.reconstructBaselineS0(obs, db);

        // Calculate deterministic target decayed score S(t)
        const targetScore = calculateDecayedConfidence(S0, obs.discoveredAt, effectiveNow);

        // Persist only if the derived score changed (prevents unnecessary writes)
        if (Math.abs(obs.confidenceScore - targetScore) >= 0.001) {
          await db.placeObservation.update({
            where: { id: obs.id },
            data: { confidenceScore: targetScore },
          });
          totalUpdated++;
        } else {
          totalUnchanged++;
        }
      }
    }

    return {
      totalProcessed,
      totalUpdated,
      totalUnchanged,
      batchesExecuted,
    };
  }
}
