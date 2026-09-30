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

// ─── Service ─────────────────────────────────────────────────────────────────

export class GeographyImportService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Idempotently imports (or updates) a single Governorate record.
   *
   * Lookup key: externalId
   * - If a Governorate with this externalId already exists → update it (UPDATED / UNCHANGED).
   * - If no record with this externalId exists → create it (CREATED).
   *
   * Validation:
   * - nameAr is required and must not be blank.
   * - externalId is required and must not be blank.
   * - If coordinates are provided, both lat and lng must be valid finite numbers within global bounds.
   * - Invalid records throw GeographyValidationError and are not persisted.
   *
   * @throws GeographyValidationError if input fails validation
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

    // ── Idempotent upsert ─────────────────────────────────────────────────────
    // Lookup by externalId. If found, update. If not, check by name within
    // the Yemen-wide namespace (no parent; governorates are top-level).
    const existing = await db.governorate.findUnique({
      where: { externalId },
    });

    if (existing) {
      // Check whether any field actually changed before issuing an UPDATE.
      const changed =
        existing.nameAr !== nameAr ||
        existing.nameEn !== nameEn;

      if (!changed) {
        return {
          action: 'UNCHANGED',
          id: existing.id,
          externalId,
          nameAr: existing.nameAr,
        };
      }

      const updated = await db.governorate.update({
        where: { id: existing.id },
        data: { nameAr, nameEn },
      });

      return {
        action: 'UPDATED',
        id: updated.id,
        externalId,
        nameAr: updated.nameAr,
      };
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
   * Idempotently imports (or updates) a single District record.
   *
   * Lookup key: externalId
   * - If a District with this externalId already exists → update it (UPDATED / UNCHANGED).
   * - If no record with this externalId exists → create it (CREATED).
   *
   * Validation:
   * - externalId is required and must not be blank.
   * - nameAr is required and must not be blank.
   * - governorateId must be provided and must reference a real Governorate record.
   * - District names must be unique within the same governorate (enforced by DB constraint).
   *
   * @throws GeographyValidationError if input fails validation
   * @throws Error if the parent governorateId does not exist
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

    // ── Validate parent governorate ────────────────────────────────────────────
    const governorate = await db.governorate.findUnique({
      where: { id: governorateId },
    });
    if (!governorate) {
      throw new Error(
        `Cannot import district: Governorate with ID "${governorateId}" does not exist. ` +
        'Import the parent governorate before importing its districts.'
      );
    }

    // ── Idempotent upsert ─────────────────────────────────────────────────────
    const existing = await db.district.findUnique({
      where: { externalId },
    });

    if (existing) {
      const changed =
        existing.nameAr !== nameAr ||
        existing.nameEn !== nameEn ||
        existing.governorateId !== governorateId;

      if (!changed) {
        return {
          action: 'UNCHANGED',
          id: existing.id,
          externalId,
          governorateId: existing.governorateId,
          nameAr: existing.nameAr,
        };
      }

      const updated = await db.district.update({
        where: { id: existing.id },
        data: { nameAr, nameEn, governorateId },
      });

      return {
        action: 'UPDATED',
        id: updated.id,
        externalId,
        governorateId: updated.governorateId,
        nameAr: updated.nameAr,
      };
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
