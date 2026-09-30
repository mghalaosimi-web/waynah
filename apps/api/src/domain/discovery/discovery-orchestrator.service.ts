import {
  prisma as defaultPrisma,
  PrismaClient,
  type PlaceObservation,
} from '@waynah/database';
import { type CreateObservationInput } from '@waynah/shared';
import { IngestionService } from './ingestion.service.js';
import { EntityResolutionService } from './entity-resolution.service.js';
import { ChangeDetectionService, type ConflictItem } from './change-detection.service.js';
import { ConfidenceScoringService } from '../intelligence/confidence-scoring.service.js';
import { GeographySpatialResolutionService } from '../geography/geography-spatial-resolution.service.js';

export type OrchestratorAction = 'NEW_ENTITY_CREATED' | 'CONFLICT_LOGGED' | 'AUTO_APPROVED_UPDATE';

export interface OrchestrationResult {
  action: OrchestratorAction;
  observationId: string;
  placeId: string;
  observation: PlaceObservation;
  conflicts?: ConflictItem[];
}

export class DiscoveryOrchestratorService {
  private readonly prisma: PrismaClient;
  private readonly ingestionService: IngestionService;
  private readonly entityResolutionService: EntityResolutionService;
  private readonly changeDetectionService: ChangeDetectionService;
  private readonly confidenceScoringService: ConfidenceScoringService;

  constructor(
    prismaClient: PrismaClient = defaultPrisma,
    ingestionService?: IngestionService,
    entityResolutionService?: EntityResolutionService,
    changeDetectionService?: ChangeDetectionService,
    confidenceScoringService?: ConfidenceScoringService
  ) {
    this.prisma = prismaClient;
    this.ingestionService = ingestionService ?? new IngestionService(this.prisma);
    this.entityResolutionService = entityResolutionService ?? new EntityResolutionService(this.prisma);
    this.changeDetectionService = changeDetectionService ?? new ChangeDetectionService(this.prisma);
    this.confidenceScoringService = confidenceScoringService ?? new ConfidenceScoringService(this.prisma);
  }

  /**
   * Processes an incoming raw observation through the complete Discovery Ingestion Pipeline:
   *
   * 1. Ingest & validate observation (status=PENDING, confidenceScore=0.0 — domain-owned).
   * 2. Entity Resolution: PostGIS spatial + pg_trgm text matching against canonical Places.
   * 3a. Matched → ChangeDetection → status set to AUTO_APPROVED or CONFLICTED.
   * 3b. Unmatched → Create new canonical Place + PlaceLocation with PostGIS geom (NEW_ENTITY_CREATED).
   * 4. ConfidenceScoring: computed from source.reliabilityWeight + consensus, persisted to DB.
   *
   * DETERMINISM RULES (CORE-002):
   * - A new Place is NEVER assigned a Category or District by random DB lookup.
   * - `categoryId` MUST be present on the observation to create a Place.
   * - `districtId` is resolved spatially from the observation coordinates. If it cannot
   *   be resolved, the pipeline throws an explicit domain error rather than silently
   *   choosing arbitrary rows from the database.
   *
   * GEOGRAPHIC INTEGRITY (CORE-003):
   * - All PostGIS inserts use ST_MakePoint(longitude, latitude) — correct geographic order.
   * - lat/lng scalars on the row are always consistent with the stored geom column.
   *
   * The confidence score is ALWAYS computed by the domain pipeline from authoritative sources.
   * It is NEVER sourced from caller input.
   *
   * @param input Validated CreateObservationInput payload (no confidenceScore/status accepted)
   * @returns Structured orchestration result with final observation state
   */
  async processObservation(
    input: CreateObservationInput,
    prismaClient?: PrismaClient
  ): Promise<OrchestrationResult> {
    const db = prismaClient ?? this.prisma;

    const ingestion = prismaClient ? new IngestionService(db) : this.ingestionService;
    const resolution = prismaClient ? new EntityResolutionService(db) : this.entityResolutionService;
    const changeDetection = prismaClient ? new ChangeDetectionService(db) : this.changeDetectionService;
    const confidenceScoring = prismaClient
      ? new ConfidenceScoringService(db)
      : this.confidenceScoringService;

    // ─── Stage 1: Ingest ──────────────────────────────────────────────────────
    // Creates PlaceObservation with status=PENDING and confidenceScore=0.0.
    // No caller-supplied confidence or status values are accepted at this stage.
    const observation = await ingestion.ingestObservation(input);

    // ─── Stage 2: Entity Resolution ───────────────────────────────────────────
    const matchedPlaceId = await resolution.resolve(observation);

    // ─── Stage 3a: Matched Place → Change Detection ───────────────────────────
    if (matchedPlaceId) {
      const detectionResult = await changeDetection.detectConflicts(observation.id, matchedPlaceId, db);

      // ─── Stage 4: Confidence Scoring (matched path) ───────────────────────
      // At this point the observation has a placeId and a final status. Score
      // is computed from source reliability weight + consensus with sibling observations.
      const scoredObs = await confidenceScoring.updateObservationConfidence(observation.id, db);

      if (detectionResult.status === 'CONFLICTED') {
        return {
          action: 'CONFLICT_LOGGED',
          observationId: observation.id,
          placeId: matchedPlaceId,
          observation: scoredObs,
          conflicts: detectionResult.conflicts,
        };
      }

      return {
        action: 'AUTO_APPROVED_UPDATE',
        observationId: observation.id,
        placeId: matchedPlaceId,
        observation: scoredObs,
      };
    }

    // ─── Stage 3b: Unmatched → Create New Canonical Entity ────────────────────
    return await db.$transaction(async (tx) => {
      // ── CORE-002: Deterministic Category resolution ────────────────────────
      // categoryId MUST come from the observation itself.
      // We do NOT fall back to `category.findFirst()` — that would silently assign
      // an arbitrary Category from the database to an unrelated Place.
      const categoryId = observation.categoryId;
      if (!categoryId) {
        throw new Error(
          'Cannot create Place: observation does not specify a categoryId. ' +
            'A valid categoryId is required to create a new canonical Place. ' +
            'Submit the observation with a categoryId, or match it to an existing Place.'
        );
      }

      // Verify the Category actually exists — prevent FK violation and ensure
      // the caller-supplied ID refers to a real Category, not an invented one.
      const categoryExists = await tx.category.findUnique({ where: { id: categoryId } });
      if (!categoryExists) {
        throw new Error(
          `Cannot create Place: Category with ID "${categoryId}" does not exist. ` +
            'Provide a valid categoryId from the platform category catalogue.'
        );
      }

      // ── GEO-004: Authoritative PostGIS District Polygon resolution ───────────
      // Primary: PostGIS ST_Covers on District.boundary MultiPolygon.
      // Fallback: Nearest-Place spatial heuristic via ST_DWithin within 500 m.
      let districtId: string | null = null;

      if (
        observation.latitude !== null &&
        observation.longitude !== null &&
        observation.latitude !== undefined &&
        observation.longitude !== undefined
      ) {
        const spatialResolver = new GeographySpatialResolutionService(tx as unknown as PrismaClient);
        const resolvedDistrict = await spatialResolver.resolveDistrictFromPoint(
          observation.latitude,
          observation.longitude,
          { fallbackRadiusMeters: 500 },
          tx as unknown as PrismaClient
        );

        if (resolvedDistrict) {
          districtId = resolvedDistrict.id;
        }
      }

      if (!districtId) {
        throw new Error(
          'Cannot create Place: district could not be determined from the observation data. ' +
            'Provide spatial coordinates (latitude + longitude) that fall within a known district, ' +
            'or ensure the observation matches an existing Place via entity resolution.'
        );
      }

      const placeNameAr = observation.name?.trim() || 'Unmapped Place';

      const newPlace = await tx.place.create({
        data: {
          nameAr: placeNameAr,
          phoneNumber: observation.phone,
          categoryId,
          districtId,
          verificationStatus: 'UNVERIFIED',
        },
      });

      // ── CORE-003: Geographic consistency ──────────────────────────────────
      // ST_MakePoint(longitude, latitude) — correct geographic axis order.
      // The scalar lat/lng columns are always kept in sync with the geom column,
      // both set from the same source values in the same INSERT statement.
      if (
        observation.latitude !== null &&
        observation.longitude !== null &&
        observation.latitude !== undefined &&
        observation.longitude !== undefined
      ) {
        const locationId = crypto.randomUUID();
        await tx.$executeRaw`
          INSERT INTO "place_locations" ("id", "place_id", "latitude", "longitude", "geom", "created_at", "updated_at")
          VALUES (
            ${locationId},
            ${newPlace.id},
            ${observation.latitude},
            ${observation.longitude},
            ST_SetSRID(ST_MakePoint(${observation.longitude}, ${observation.latitude}), 4326)::geography,
            NOW(),
            NOW()
          )
        `;
      }

      // Link observation to the new Place and set status BEFORE confidence scoring.
      await tx.placeObservation.update({
        where: { id: observation.id },
        data: {
          placeId: newPlace.id,
          status: 'AUTO_APPROVED',
        },
      });

      // ─── Stage 4: Confidence Scoring (new-entity path) ──────────────────────
      // placeId is now set on the observation. The scoring service will find the
      // source's reliabilityWeight and check for sibling observations (none yet
      // for a brand-new entity, so score = source.reliabilityWeight).
      const scoredObs = await confidenceScoring.updateObservationConfidence(
        observation.id,
        tx as unknown as PrismaClient
      );

      return {
        action: 'NEW_ENTITY_CREATED',
        observationId: observation.id,
        placeId: newPlace.id,
        observation: scoredObs,
      };
    });
  }
}
