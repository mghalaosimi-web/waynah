import {
  prisma as defaultPrisma,
  PrismaClient,
  type DataConflict,
} from '@waynah/database';

export interface ConflictItem {
  field: string;
  old: string | null;
  new: string;
}

export interface ChangeDetectionResult {
  observationId: string;
  placeId: string;
  status: 'CONFLICTED' | 'AUTO_APPROVED';
  conflicts: ConflictItem[];
  dataConflictRecord?: DataConflict;
}

export class ChangeDetectionService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Compares an ingested PlaceObservation against a matched canonical Place to detect attribute discrepancies.
   * If non-null observation attributes materially differ from master Place data, logs a DataConflict record
   * and sets observation status to CONFLICTED.
   * If data is identical or purely additive, sets observation status to AUTO_APPROVED.
   *
   * @param observationId ID of the target PlaceObservation
   * @param placeId ID of the matched canonical Place
   * @param prismaClient Optional PrismaClient instance for custom dependency injection
   * @returns Resolution status and identified conflicts
   */
  async detectConflicts(
    observationId: string,
    placeId: string,
    prismaClient?: PrismaClient
  ): Promise<ChangeDetectionResult> {
    const db = prismaClient ?? this.prisma;

    const observation = await db.placeObservation.findUnique({
      where: { id: observationId },
    });

    if (!observation) {
      throw new Error(`PlaceObservation with ID "${observationId}" not found`);
    }

    const place = await db.place.findUnique({
      where: { id: placeId },
      include: {
        observations: {
          where: { status: 'AUTO_APPROVED' },
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });

    if (!place) {
      throw new Error(`Place with ID "${placeId}" not found`);
    }

    const conflicts: ConflictItem[] = [];

    // 1. Compare Name (against nameAr and nameEn)
    if (observation.name && observation.name.trim().length > 0) {
      const obsName = observation.name.trim().toLowerCase();
      const placeNameAr = place.nameAr.trim().toLowerCase();
      const placeNameEn = place.nameEn ? place.nameEn.trim().toLowerCase() : null;

      const matchesAr = obsName === placeNameAr;
      const matchesEn = placeNameEn !== null && obsName === placeNameEn;

      if (!matchesAr && !matchesEn) {
        conflicts.push({
          field: 'name',
          old: place.nameAr,
          new: observation.name.trim(),
        });
      }
    }

    // 2. Compare Phone Number
    if (observation.phone && observation.phone.trim().length > 0) {
      const normObsPhone = observation.phone.trim().replace(/\s+/g, '');
      const normPlacePhone = place.phoneNumber ? place.phoneNumber.trim().replace(/\s+/g, '') : null;

      // Conflict occurs only if master place already has a phone number and it differs from observation
      if (normPlacePhone !== null && normObsPhone !== normPlacePhone) {
        conflicts.push({
          field: 'phone',
          old: place.phoneNumber,
          new: observation.phone.trim(),
        });
      }
    }

    // 3. Compare Category ID
    if (observation.categoryId && observation.categoryId.trim().length > 0) {
      if (observation.categoryId !== place.categoryId) {
        conflicts.push({
          field: 'categoryId',
          old: place.categoryId,
          new: observation.categoryId,
        });
      }
    }

    // 4. Compare Spatial District Context
    if (
      observation.latitude !== null &&
      observation.longitude !== null &&
      observation.latitude !== undefined &&
      observation.longitude !== undefined
    ) {
      try {
        const { GeographySpatialResolutionService } = await import(
          '../geography/geography-spatial-resolution.service.js'
        );
        const spatialResolver = new GeographySpatialResolutionService(db);
        const resolved = await spatialResolver.resolveDistrictFromPoint(
          observation.latitude,
          observation.longitude,
          {},
          db
        );
        if (resolved && resolved.id !== place.districtId) {
          conflicts.push({
            field: 'districtId',
            old: place.districtId,
            new: resolved.id,
          });
        }
      } catch (err) {
        // Ignore resolution failures on invalid/mock coordinates in change detection
      }
    }

    const baseObservationId = place.observations[0]?.id ?? observation.id;

    if (conflicts.length > 0) {
      const dataConflictRecord = await db.dataConflict.create({
        data: {
          placeId: place.id,
          baseObservationId,
          conflictingObservationId: observation.id,
          description: JSON.stringify(conflicts),
          status: 'OPEN',
        },
      });

      await db.placeObservation.update({
        where: { id: observation.id },
        data: {
          status: 'CONFLICTED',
          placeId: place.id,
        },
      });

      return {
        observationId: observation.id,
        placeId: place.id,
        status: 'CONFLICTED',
        conflicts,
        dataConflictRecord,
      };
    }

    await db.placeObservation.update({
      where: { id: observation.id },
      data: {
        status: 'AUTO_APPROVED',
        placeId: place.id,
      },
    });

    return {
      observationId: observation.id,
      placeId: place.id,
      status: 'AUTO_APPROVED',
      conflicts: [],
    };
  }
}
