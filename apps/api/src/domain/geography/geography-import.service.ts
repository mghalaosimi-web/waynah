/**
 * WAYNAH Geography Import Service
 *
 * Idempotent import foundation for authoritative geographic reference data.
 *
 * DESIGN PRINCIPLES:
 * 1. Idempotent: Re-importing the same record updates existing, does not duplicate.
 * 2. Provenance: Every imported record must trace to a DataSource.
 * 3. Validation: Invalid records are rejected with an explicit error, never silently accepted.
 * 4. No invented data: This service only processes real records provided to it.
 *    It does NOT auto-generate missing fields, coordinates, or relationships.
 * 5. Admin-only: This service must only be invoked behind admin authorization.
 *    It is never called from public or user-facing routes.
 *
 * BOUNDARY STRATEGY (deferred):
 * Administrative district boundaries (MultiPolygon) are NOT imported in this
 * version. The architecture is ready to receive them, but authoritative polygon
 * data is not yet available. When real boundary data arrives, a new field
 * District.boundary can be added via a clean migration, and this service can be
 * extended to validate and persist it.
 *
 * HAJJAH STATUS:
 * No Hajjah-specific data is manufactured. This service is ready to receive
 * Hajjah governorate and district records when authoritative source data is provided.
 */

import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';
import {
  validateCoordinates,
} from './geography-validation.js';

// ─── Input types ─────────────────────────────────────────────────────────────

export interface ImportGovernorateInput {
  /** Stable external identifier from the authoritative source (e.g. OCHA pcode). Required for idempotent import. */
  externalId: string;
  /** Arabic name of the governorate. Required. */
  nameAr: string;
  /** English name of the governorate. Optional; set null if not in source data. */
  nameEn?: string | null;
  /**
   * Optional point coordinates for a representative location (e.g. capital city).
   * These are NOT the governorate boundary. Leave undefined if not available in source.
   */
  latitude?: number;
  longitude?: number;
}

export interface ImportDistrictInput {
  /** Stable external identifier from the authoritative source (e.g. OCHA pcode). Required for idempotent import. */
  externalId: string;
  /** The internal WAYNAH Governorate UUID this district belongs to. */
  governorateId: string;
  /** Arabic name of the district. Required. */
  nameAr: string;
  /** English name of the district. Optional; set null if not in source data. */
  nameEn?: string | null;
}

// ─── Result types ─────────────────────────────────────────────────────────────

export interface ImportGovernorateResult {
  action: 'CREATED' | 'UPDATED' | 'UNCHANGED';
  id: string;
  externalId: string;
  nameAr: string;
}

export interface ImportDistrictResult {
  action: 'CREATED' | 'UPDATED' | 'UNCHANGED';
  id: string;
  externalId: string;
  governorateId: string;
  nameAr: string;
}

export interface ImportDistrictBatchInput {
  /** Stable external identifier from the authoritative source (e.g. OCHA pcode). Required for idempotent import. */
  externalId: string;
  /** The internal WAYNAH Governorate UUID this district belongs to. */
  governorateId: string;
  /** Arabic name of the district. Required. */
  nameAr: string;
  /** English name of the district. Optional; set null if not in source data. */
  nameEn?: string | null;
}

export interface ImportDistrictBatchResult {
  created: number;
  updated: number;
  unchanged: number;
}

// ─── Validation errors ────────────────────────────────────────────────────────

export class GeographyValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: unknown
  ) {
    super(message);
    this.name = 'GeographyValidationError';
  }
}

export class GeographyDriftError extends Error {
  constructor(
    message: string,
    public readonly entityType: 'GOVERNORATE' | 'DISTRICT',
    public readonly externalId: string,
    public readonly field: string,
    public readonly expectedValue: unknown,
    public readonly actualValue: unknown
  ) {
    super(message);
    this.name = 'GeographyDriftError';
  }
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class GeographyImportService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Performs idempotent bulk import of a batch of District records (e.g. 50 items).
   *
   * ARCHITECTURE & PERFORMANCE CONTRACT:
   * 1. Pre-fetch OUTSIDE transaction: Performs 1 bulk `district.findMany` query.
   * 2. In-Memory Validation & Drift Detection: Validates parent governorate and drift OUTSIDE transaction.
   *    If parent governorate is missing or drift is detected on any item → STOPS IMMEDIATELY (throws Error/GeographyDriftError)
   *    and NO transaction is ever opened.
   * 3. Writes-Only Transaction: If new records are present, opens `$transaction` containing ONLY `tx.district.createMany` (or write operations).
   *    NO READ QUERIES occur inside the transaction.
   */
  async importDistrictBatch(
    inputs: ImportDistrictBatchInput[],
    validGovernorateIds: Set<string> | Map<string, string>,
    dbClient?: any
  ): Promise<ImportDistrictBatchResult> {
    if (inputs.length === 0) {
      return { created: 0, updated: 0, unchanged: 0 };
    }

    const db = dbClient || this.prisma;

    // ── 1. In-memory Field & Parent Governorate Validation (OUTSIDE transaction) ──
    for (const input of inputs) {
      if (!input.externalId || input.externalId.trim().length === 0) {
        throw new GeographyValidationError(
          'externalId is required for district import',
          'externalId',
          input.externalId
        );
      }
      if (!input.nameAr || input.nameAr.trim().length === 0) {
        throw new GeographyValidationError(
          'nameAr is required for district import',
          'nameAr',
          input.nameAr
        );
      }
      if (!input.governorateId || input.governorateId.trim().length === 0) {
        throw new GeographyValidationError(
          'governorateId is required for district import',
          'governorateId',
          input.governorateId
        );
      }

      const govId = input.governorateId.trim();
      let hasGov = false;
      if (validGovernorateIds instanceof Set) {
        hasGov = validGovernorateIds.has(govId);
      } else if (validGovernorateIds instanceof Map) {
        hasGov = Array.from(validGovernorateIds.values()).includes(govId) || validGovernorateIds.has(govId);
      }

      if (!hasGov) {
        throw new GeographyValidationError(
          `Governorate with ID "${govId}" does not exist`,
          'governorateId',
          govId
        );
      }
    }

    // ── 2. Pre-fetch existing districts in BULK (1 Query OUTSIDE transaction) ──
    const pcodes = inputs.map((i) => i.externalId.trim());
    const existingDistricts = await db.district.findMany({
      where: {
        externalId: { in: pcodes },
      },
    });

    const existingMap = new Map<string, any>(
      existingDistricts.map((d: any) => [d.externalId, d])
    );

    // ── 3. In-memory Drift Detection (OUTSIDE transaction) ──
    const toCreate: Array<{
      externalId: string;
      governorateId: string;
      nameAr: string;
      nameEn: string | null;
    }> = [];
    let unchangedCount = 0;

    for (const input of inputs) {
      const externalId = input.externalId.trim();
      const nameAr = input.nameAr.trim();
      const nameEn = input.nameEn?.trim() || null;
      const governorateId = input.governorateId.trim();

      const existing = existingMap.get(externalId);

      if (!existing) {
        toCreate.push({
          externalId,
          governorateId,
          nameAr,
          nameEn,
        });
      } else {
        const isIdentical =
          existing.nameAr === nameAr &&
          (existing.nameEn || null) === nameEn &&
          existing.governorateId === governorateId;

        if (isIdentical) {
          unchangedCount++;
        } else {
          // Strict Drift Policy: STOP IMMEDIATELY before starting transaction
          throw new GeographyDriftError(
            `[DRIFT DETECTED] District "${externalId}" exists in DB with different data. ` +
            `Expected nameAr="${nameAr}", governorateId="${governorateId}". Actual DB nameAr="${existing.nameAr}", governorateId="${existing.governorateId}".`,
            'DISTRICT',
            externalId,
            'nameAr/governorateId',
            { nameAr, nameEn, governorateId },
            { nameAr: existing.nameAr, nameEn: existing.nameEn, governorateId: existing.governorateId }
          );
        }
      }
    }

    // ── 4. Writes-Only Transaction ──
    if (toCreate.length > 0) {
      await db.$transaction(
        async (tx: any) => {
          if (tx.district.createMany) {
            await tx.district.createMany({
              data: toCreate,
            });
          } else {
            // Fallback for custom test mocks without createMany
            for (const item of toCreate) {
              await tx.district.create({ data: item });
            }
          }
        },
        { maxWait: 5000, timeout: 15000 }
      );
    }

    return {
      created: toCreate.length,
      updated: 0,
      unchanged: unchangedCount,
    };
  }

  /**
   * Idempotently imports (or verifies) a single Governorate record.
   *
   * Lookup key: externalId
   * - If a Governorate with this externalId exists & matches → return UNCHANGED.
   * - If a Governorate with this externalId exists & differs → throw GeographyDriftError (DRIFT DETECTED).
   * - If no record with this externalId exists → create it (CREATED).
   *
   * @throws GeographyValidationError if input fails validation
   * @throws GeographyDriftError if data drift is detected against existing DB record
   */
  async importGovernorate(
    input: ImportGovernorateInput,
    dbClient?: any
  ): Promise<ImportGovernorateResult> {
    const db = dbClient || this.prisma;
    // ── Validate required fields ───────────────────────────────────────────────
    if (!input.externalId || input.externalId.trim().length === 0) {
      throw new GeographyValidationError(
        'externalId is required for governorate import',
        'externalId',
        input.externalId
      );
    }
    if (!input.nameAr || input.nameAr.trim().length === 0) {
      throw new GeographyValidationError(
        'nameAr is required for governorate import',
        'nameAr',
        input.nameAr
      );
    }

    // ── Validate coordinates if provided ──────────────────────────────────────
    if (input.latitude !== undefined || input.longitude !== undefined) {
      const coordResult = validateCoordinates(input.latitude, input.longitude);
      if (!coordResult.valid) {
        throw new GeographyValidationError(
          coordResult.error!,
          'coordinates',
          { latitude: input.latitude, longitude: input.longitude }
        );
      }
    }

    const externalId = input.externalId.trim();
    const nameAr = input.nameAr.trim();
    const nameEn = input.nameEn?.trim() || null;

    // ── Idempotent lookup & drift detection ──────────────────────────────────
    const existing = await db.governorate.findUnique({
      where: { externalId },
    });

    if (existing) {
      const isIdentical =
        existing.nameAr === nameAr &&
        (existing.nameEn || null) === nameEn;

      if (isIdentical) {
        return {
          action: 'UNCHANGED',
          id: existing.id,
          externalId,
          nameAr: existing.nameAr,
        };
      }

      // Strict Drift Policy: STOP IMMEDIATELY on data discrepancy
      throw new GeographyDriftError(
        `[DRIFT DETECTED] Governorate "${externalId}" exists in DB with different data. ` +
        `Expected nameAr="${nameAr}", nameEn="${nameEn}". Actual DB nameAr="${existing.nameAr}", nameEn="${existing.nameEn}".`,
        'GOVERNORATE',
        externalId,
        'nameAr/nameEn',
        { nameAr, nameEn },
        { nameAr: existing.nameAr, nameEn: existing.nameEn }
      );
    }

    // Create new governorate
    const created = await db.governorate.create({
      data: {
        externalId,
        nameAr,
        nameEn,
      },
    });

    return {
      action: 'CREATED',
      id: created.id,
      externalId,
      nameAr: created.nameAr,
    };
  }

  /**
   * Idempotently imports (or verifies) a single District record.
   *
   * Lookup key: externalId
   * - If a District with this externalId exists & matches → return UNCHANGED.
   * - If a District with this externalId exists & differs → throw GeographyDriftError (DRIFT DETECTED).
   * - If no record with this externalId exists → create it (CREATED).
   *
   * @throws GeographyValidationError if input fails validation
   * @throws GeographyDriftError if data drift is detected against existing DB record
   */
  async importDistrict(
    input: ImportDistrictInput,
    dbClient?: any
  ): Promise<ImportDistrictResult> {
    const db = dbClient || this.prisma;
    // ── Validate required fields ───────────────────────────────────────────────
    if (!input.externalId || input.externalId.trim().length === 0) {
      throw new GeographyValidationError(
        'externalId is required for district import',
        'externalId',
        input.externalId
      );
    }
    if (!input.nameAr || input.nameAr.trim().length === 0) {
      throw new GeographyValidationError(
        'nameAr is required for district import',
        'nameAr',
        input.nameAr
      );
    }
    if (!input.governorateId || input.governorateId.trim().length === 0) {
      throw new GeographyValidationError(
        'governorateId is required for district import',
        'governorateId',
        input.governorateId
      );
    }

    const externalId = input.externalId.trim();
    const nameAr = input.nameAr.trim();
    const nameEn = input.nameEn?.trim() || null;
    const governorateId = input.governorateId.trim();

    // ── Check parent governorate existence ───────────────────────────────────
    const parentGov = await db.governorate.findUnique({
      where: { id: governorateId },
    });
    if (!parentGov) {
      throw new GeographyValidationError(
        `Governorate with ID "${governorateId}" does not exist`,
        'governorateId',
        governorateId
      );
    }

    // ── Idempotent lookup & drift detection ──────────────────────────────────
    const existing = await db.district.findUnique({
      where: { externalId },
    });

    if (existing) {
      const isIdentical =
        existing.nameAr === nameAr &&
        (existing.nameEn || null) === nameEn &&
        existing.governorateId === governorateId;

      if (isIdentical) {
        return {
          action: 'UNCHANGED',
          id: existing.id,
          externalId,
          governorateId: existing.governorateId,
          nameAr: existing.nameAr,
        };
      }

      // Strict Drift Policy: STOP IMMEDIATELY on data discrepancy
      throw new GeographyDriftError(
        `[DRIFT DETECTED] District "${externalId}" exists in DB with different data. ` +
        `Expected nameAr="${nameAr}", governorateId="${governorateId}". Actual DB nameAr="${existing.nameAr}", governorateId="${existing.governorateId}".`,
        'DISTRICT',
        externalId,
        'nameAr/governorateId',
        { nameAr, nameEn, governorateId },
        { nameAr: existing.nameAr, nameEn: existing.nameEn, governorateId: existing.governorateId }
      );
    }

    // Create new district
    const created = await db.district.create({
      data: {
        externalId,
        governorateId,
        nameAr,
        nameEn,
      },
    });

    return {
      action: 'CREATED',
      id: created.id,
      externalId,
      governorateId: created.governorateId,
      nameAr: created.nameAr,
    };
  }
}

