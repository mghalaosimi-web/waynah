import {
  prisma as defaultPrisma,
  PrismaClient,
  findCandidateMatches,
  type PlaceObservation,
} from '@waynah/database';

export class EntityResolutionService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Resolves whether an incoming PlaceObservation matches an existing canonical Place.
   * Utilizes PostGIS distance filtering (ST_DWithin, ST_Distance) and trigram text similarity (pg_trgm).
   *
   * @param observation The PlaceObservation to evaluate
   * @returns Matched Place ID or null if no matching place is found
   */
  async resolve(
    observation: Pick<PlaceObservation, 'latitude' | 'longitude' | 'name'>
  ): Promise<string | null> {
    if (
      observation.latitude === null ||
      observation.longitude === null ||
      observation.latitude === undefined ||
      observation.longitude === undefined
    ) {
      return null;
    }

    const candidates = await findCandidateMatches(this.prisma, {
      latitude: observation.latitude,
      longitude: observation.longitude,
      name: observation.name,
      radiusMeters: 100,
    });

    if (candidates.length === 0) {
      return null;
    }

    for (const candidate of candidates) {
      // 1. Strict spatial proximity match (<= 20 meters distance)
      if (candidate.distance <= 20) {
        return candidate.id;
      }

      // 2. Moderate proximity (<= 50 meters distance) with high name similarity (>= 0.6)
      if (candidate.distance <= 50 && candidate.similarity >= 0.6) {
        return candidate.id;
      }
    }

    return null;
  }
}
