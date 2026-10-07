import {
  prisma as defaultPrisma,
  type PrismaClient,
} from '@waynah/database';

export interface DomainSplitInput {
  sourcePlaceId: string;
  newPlace: {
    nameAr: string;
    nameEn?: string | null;
    categoryId: string;
    districtId: string;
    phoneNumber?: string | null;
    address?: string | null;
    latitude: number;
    longitude: number;
  };
  observationIdsToMove: string[];
  isUnmerge?: boolean;
}

export interface DomainSplitResult {
  sourcePlaceId: string;
  newPlaceId: string;
  observationsMoved: number;
  createdAt: Date;
}

export class DomainSplitService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Performs an administrative Domain Split, creating a new canonical Place
   * and reassigning designated PlaceObservations from a host Place.
   *
   * Rules:
   * 1. Domain Split ONLY. Unmerge requests are rejected explicitly.
   * 2. Source Place must exist and not be CLOSED.
   * 3. Specified observations must belong to sourcePlace.
   * 4. Preserves historical provenance of observations and original place.
   * 5. No physical deletion.
   */
  public async splitDomain(
    input: DomainSplitInput,
    _actorId: string,
    prismaClient?: PrismaClient
  ): Promise<DomainSplitResult> {
    if (input.isUnmerge) {
      throw new Error('UNMERGE_OUT_OF_SCOPE');
    }

    if (!input.sourcePlaceId || !input.newPlace || !input.observationIdsToMove?.length) {
      throw new Error('INVALID_SPLIT_PARAMETERS');
    }

    const db = prismaClient ?? this.prisma;

    return await db.$transaction(async (tx) => {
      // Lock source place
      await tx.$queryRaw`SELECT id FROM places WHERE id = ${input.sourcePlaceId} FOR UPDATE`;

      const sourcePlace = await tx.place.findUnique({
        where: { id: input.sourcePlaceId },
      });

      if (!sourcePlace) {
        throw new Error('SOURCE_PLACE_NOT_FOUND');
      }

      if (sourcePlace.verificationStatus === 'CLOSED') {
        throw new Error('CANNOT_SPLIT_CLOSED_PLACE');
      }

      // Verify all observations to move belong to sourcePlace
      const observationsToMove = await tx.placeObservation.findMany({
        where: {
          id: { in: input.observationIdsToMove },
          placeId: input.sourcePlaceId,
        },
      });

      if (observationsToMove.length !== input.observationIdsToMove.length) {
        throw new Error('OBSERVATIONS_NOT_FOUND_OR_MISMATCH');
      }

      // Create new Place
      const newPlace = await tx.place.create({
        data: {
          nameAr: input.newPlace.nameAr,
          nameEn: input.newPlace.nameEn,
          categoryId: input.newPlace.categoryId,
          districtId: input.newPlace.districtId,
          phoneNumber: input.newPlace.phoneNumber,
          address: input.newPlace.address,
          verificationStatus: 'UNVERIFIED',
          location: {
            create: {
              latitude: input.newPlace.latitude,
              longitude: input.newPlace.longitude,
            },
          },
        },
      });

      // Move observations to new Place
      const moveResult = await tx.placeObservation.updateMany({
        where: {
          id: { in: input.observationIdsToMove },
        },
        data: {
          placeId: newPlace.id,
        },
      });

      return {
        sourcePlaceId: input.sourcePlaceId,
        newPlaceId: newPlace.id,
        observationsMoved: moveResult.count,
        createdAt: new Date(),
      };
    });
  }
}
