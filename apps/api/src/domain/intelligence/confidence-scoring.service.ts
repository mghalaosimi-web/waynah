import {
  prisma as defaultPrisma,
  PrismaClient,
  type DataSource,
  type PlaceObservation,
} from '@waynah/database';

export class ConfidenceScoringService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Calculates the confidence score of a PlaceObservation based on source reliability weight
   * and consensus among other approved observations matching core attributes.
   *
   * Scoring Logic:
   * 1. Base score = source.reliabilityWeight (e.g. 0.1 to 1.0)
   * 2. Consensus bonus = +0.1 for every other approved observation ('AUTO_APPROVED' or 'APPROVED')
   *    matching core attributes (phone, categoryId, or name).
   * 3. Max score capped at 1.0.
   *
   * @param observation Target PlaceObservation
   * @param source Originating DataSource for the observation
   * @param relatedObservations Array of related PlaceObservations
   * @returns Calculated confidence score (capped at 1.0)
   */
  calculateScore(
    observation: PlaceObservation,
    source: DataSource,
    relatedObservations: PlaceObservation[]
  ): number {
    const baseScore = source?.reliabilityWeight ?? 1.0;
    let consensusBonus = 0;

    const normPhone = observation.phone ? observation.phone.trim().replace(/\s+/g, '') : null;
    const normName = observation.name ? observation.name.trim().toLowerCase() : null;
    const catId = observation.categoryId ? observation.categoryId.trim() : null;

    for (const other of relatedObservations) {
      if (other.id === observation.id) {
        continue;
      }

      const isApproved = other.status === 'AUTO_APPROVED' || other.status === 'APPROVED';
      if (!isApproved) {
        continue;
      }

      let isMatch = false;

      // Phone match
      if (normPhone && other.phone) {
        const otherPhone = other.phone.trim().replace(/\s+/g, '');
        if (otherPhone === normPhone) {
          isMatch = true;
        }
      }

      // Category match
      if (!isMatch && catId && other.categoryId) {
        if (other.categoryId.trim() === catId) {
          isMatch = true;
        }
      }

      // Name match
      if (!isMatch && normName && other.name) {
        const otherName = other.name.trim().toLowerCase();
        if (otherName === normName) {
          isMatch = true;
        }
      }

      if (isMatch) {
        consensusBonus += 0.1;
      }
    }

    const rawScore = baseScore + consensusBonus;
    return Math.min(1.0, Math.max(0.0, Math.round(rawScore * 100) / 100));
  }

  /**
   * Calculates and updates the confidence score of a specific PlaceObservation in the database.
   *
   * @param observationId ID of the PlaceObservation to update
   * @param prismaClient Optional custom PrismaClient instance
   * @returns Updated PlaceObservation record
   */
  async updateObservationConfidence(
    observationId: string,
    prismaClient?: PrismaClient
  ): Promise<PlaceObservation> {
    const db = prismaClient ?? this.prisma;

    const observation = await db.placeObservation.findUnique({
      where: { id: observationId },
      include: { dataSource: true },
    });

    if (!observation) {
      throw new Error(`PlaceObservation with ID "${observationId}" not found`);
    }

    let relatedObservations: PlaceObservation[] = [];
    if (observation.placeId) {
      relatedObservations = await db.placeObservation.findMany({
        where: {
          placeId: observation.placeId,
          id: { not: observationId },
        },
      });
    }

    const newScore = this.calculateScore(
      observation,
      observation.dataSource,
      relatedObservations
    );

    return await db.placeObservation.update({
      where: { id: observationId },
      data: { confidenceScore: newScore },
    });
  }
}
