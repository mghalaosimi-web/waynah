/**
 * WAYNAH Yemen Geography Boundary Integration Service
 *
 * Implements GEO-004 specification for:
 * 1. Geometry parsing, normalization (Polygon → MultiPolygon), & coordinate validation (EPSG:4326).
 * 2. Boundary Dry Run validation (zero database writes).
 * 3. Transactional boundary upsert using PostGIS (ST_SetSRID, ST_GeomFromGeoJSON).
 * 4. Non-destructive policy (never deletes districts without boundaries).
 */

import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';
import { validateCoordinates } from './geography-validation.js';

export interface RawFeatureBoundaryInput {
  ADM2_PCODE: string;
  geometry: {
    type: string;
    coordinates: any;
  };
}

export interface BoundaryDryRunReport {
  status: 'PASSED' | 'FAILED';
  summary: {
    totalSourceFeatures: number;
    matchedDistricts: number;
    unmatchedSourcePcodes: number;
    polygonTypes: {
      Polygon: number;
      MultiPolygon: number;
    };
    invalidGeometries: number;
    emptyGeometries: number;
    crs: string;
  };
  errors: Array<{ externalId?: string; field: string; message: string }>;
}

export interface BoundaryUpsertResult {
  updatedCount: number;
  unmatchedCount: number;
  dataSourceName: string;
}

/**
 * Normalizes Polygon or MultiPolygon GeoJSON geometry into a MultiPolygon GeoJSON object.
 * Geometry-preserving and deterministic.
 */
export function ensureMultiPolygonGeoJSON(geometry: { type: string; coordinates: any }): {
  type: 'MultiPolygon';
  coordinates: number[][][][];
} {
  if (!geometry || !geometry.type || !geometry.coordinates) {
    throw new Error('Invalid geometry object: missing type or coordinates');
  }

  if (geometry.type === 'MultiPolygon') {
    return geometry as { type: 'MultiPolygon'; coordinates: number[][][][] };
  }

  if (geometry.type === 'Polygon') {
    return {
      type: 'MultiPolygon',
      coordinates: [geometry.coordinates],
    };
  }

  throw new Error(`Unsupported geometry type: "${geometry.type}". Only Polygon and MultiPolygon are supported.`);
}

/**
 * Validates coordinates in a ring structure to ensure all points are valid WGS84 coordinates.
 */
export function validateRingCoordinates(ring: number[][]): { valid: boolean; error?: string } {
  if (!Array.isArray(ring) || ring.length < 4) {
    return { valid: false, error: 'Polygon linear ring must contain at least 4 coordinate points' };
  }

  for (const pt of ring) {
    if (!Array.isArray(pt) || pt.length < 2) {
      return { valid: false, error: 'Invalid coordinate point structure' };
    }
    const [lng, lat] = pt;
    const res = validateCoordinates(lat, lng);
    if (!res.valid) {
      return { valid: false, error: `Invalid boundary coordinate point [${lng}, ${lat}]: ${res.error}` };
    }
  }

  return { valid: true };
}

export class GeographyBoundaryService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * DRY RUN MODE — Validates boundary geometries against existing district records.
   * Zero database writes.
   */
  async executeBoundaryDryRun(features: RawFeatureBoundaryInput[]): Promise<BoundaryDryRunReport> {
    const errors: Array<{ externalId?: string; field: string; message: string }> = [];
    const dbDistricts = await this.prisma.district.findMany({ select: { externalId: true } });
    const existingPcodes = new Set(dbDistricts.map(d => d.externalId).filter(Boolean));

    let polygonCount = 0;
    let multiPolygonCount = 0;
    let emptyCount = 0;
    let invalidCount = 0;
    let matchedCount = 0;
    let unmatchedCount = 0;

    const seenPcodes = new Set<string>();

    for (const feat of features) {
      const pcode = feat.ADM2_PCODE?.trim();
      if (!pcode) {
        errors.push({ field: 'ADM2_PCODE', message: 'Missing ADM2_PCODE in boundary feature' });
        invalidCount++;
        continue;
      }

      if (seenPcodes.has(pcode)) {
        errors.push({ externalId: pcode, field: 'ADM2_PCODE', message: `Duplicate boundary feature P-code: "${pcode}"` });
        invalidCount++;
        continue;
      }
      seenPcodes.add(pcode);

      if (existingPcodes.has(pcode)) {
        matchedCount++;
      } else {
        unmatchedCount++;
      }

      const geom = feat.geometry;
      if (!geom || !geom.coordinates || (Array.isArray(geom.coordinates) && geom.coordinates.length === 0)) {
        emptyCount++;
        invalidCount++;
        errors.push({ externalId: pcode, field: 'geometry', message: `Empty geometry for district P-code "${pcode}"` });
        continue;
      }

      if (geom.type === 'Polygon') polygonCount++;
      else if (geom.type === 'MultiPolygon') multiPolygonCount++;
      else {
        invalidCount++;
        errors.push({ externalId: pcode, field: 'geometryType', message: `Unsupported geometry type "${geom.type}" for district "${pcode}"` });
        continue;
      }

      try {
        const multiGeom = ensureMultiPolygonGeoJSON(geom);
        for (const poly of multiGeom.coordinates) {
          for (const ring of poly) {
            const ringRes = validateRingCoordinates(ring);
            if (!ringRes.valid) {
              invalidCount++;
              errors.push({ externalId: pcode, field: 'coordinates', message: ringRes.error! });
              break;
            }
          }
        }
      } catch (err: any) {
        invalidCount++;
        errors.push({ externalId: pcode, field: 'geometry', message: err.message || 'Geometry normalization failed' });
      }
    }

    const status: 'PASSED' | 'FAILED' = errors.length === 0 ? 'PASSED' : 'FAILED';

    return {
      status,
      summary: {
        totalSourceFeatures: features.length,
        matchedDistricts: matchedCount,
        unmatchedSourcePcodes: unmatchedCount,
        polygonTypes: {
          Polygon: polygonCount,
          MultiPolygon: multiPolygonCount,
        },
        invalidGeometries: invalidCount,
        emptyGeometries: emptyCount,
        crs: 'EPSG:4326',
      },
      errors,
    };
  }

  /**
   * UPSERT MODE — Transactional upsert of validated MultiPolygon boundaries into District.boundary.
   */
  async executeBoundaryUpsert(
    features: RawFeatureBoundaryInput[],
    prismaClient?: PrismaClient
  ): Promise<BoundaryUpsertResult> {
    const db = prismaClient || this.prisma;

    // 1. Dry run validation check
    const dryRun = await this.executeBoundaryDryRun(features);
    if (dryRun.status === 'FAILED') {
      throw new Error(
        `Boundary import rejected: ${dryRun.errors.length} validation errors found. ` +
        `First error: [${dryRun.errors[0]?.field}] ${dryRun.errors[0]?.message}`
      );
    }

    let updatedCount = 0;
    let unmatchedCount = 0;

    await db.$transaction(async (tx) => {
      for (const feat of features) {
        const pcode = feat.ADM2_PCODE.trim();
        const multiGeom = ensureMultiPolygonGeoJSON(feat.geometry);
        const geoJsonStr = JSON.stringify(multiGeom);

        const district = await tx.district.findUnique({
          where: { externalId: pcode },
        });

        if (!district) {
          unmatchedCount++;
          continue;
        }

        // PostGIS update using ST_SetSRID(ST_GeomFromGeoJSON(...), 4326)
        await tx.$executeRaw`
          UPDATE "districts"
          SET "boundary" = ST_SetSRID(ST_GeomFromGeoJSON(${geoJsonStr}), 4326)::geography,
              "updated_at" = NOW()
          WHERE "id" = ${district.id};
        `;

        updatedCount++;
      }
    });

    return {
      updatedCount,
      unmatchedCount,
      dataSourceName: 'OCHA Yemen COD-AB',
    };
  }
}
