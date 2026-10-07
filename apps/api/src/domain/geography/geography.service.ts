/**
 * WAYNAH Geography Service
 *
 * Read-only service for retrieving canonical geographic reference data
 * (Governorates and Districts) from the database.
 *
 * This service does NOT perform mutations. Geographic data import is handled
 * exclusively by GeographyImportService and is protected behind admin authorization.
 */

import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';

export interface GovernorateRecord {
  id: string;
  externalId: string | null;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  districtCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistrictRecord {
  id: string;
  externalId: string | null;
  governorateId: string;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  hasBoundary?: boolean;
  boundaryStatus?: 'AVAILABLE' | 'MISSING';
  placesCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistrictDetailRecord extends DistrictRecord {
  governorate?: {
    id: string;
    externalId: string | null;
    nameAr: string;
    nameEn: string | null;
    code: string | null;
  } | null;
  boundaryGeometryType?: 'MultiPolygon' | 'Polygon' | null;
  srid?: number | null;
  boundaryGeoJson?: any | null;
}

export class GeographyService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Returns all governorates ordered alphabetically by Arabic name.
   */
  async listGovernorates(): Promise<GovernorateRecord[]> {
    const rows = await this.prisma.governorate.findMany({
      orderBy: { nameAr: 'asc' },
      select: {
        id: true,
        externalId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { districts: true },
        },
      },
    });

    return rows.map((r: any) => ({
      id: r.id,
      externalId: r.externalId,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      code: r.code,
      districtCount: r._count?.districts ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Returns a single governorate by ID, or null if not found.
   */
  async getGovernorateById(id: string): Promise<GovernorateRecord | null> {
    const row = await this.prisma.governorate.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { districts: true },
        },
      },
    });

    if (!row) return null;

    return {
      id: row.id,
      externalId: row.externalId,
      nameAr: row.nameAr,
      nameEn: row.nameEn,
      code: row.code,
      districtCount: (row as any)._count?.districts ?? 0,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  }

  /**
   * Returns all districts belonging to a specific governorate,
   * ordered alphabetically by Arabic name.
   */
  async listDistrictsByGovernorate(governorateId: string): Promise<DistrictRecord[]> {
    try {
      const rawRows = await this.prisma.$queryRaw<any[]>`
        SELECT 
          d.id,
          d.external_id AS "externalId",
          d.governorate_id AS "governorateId",
          d.name_ar AS "nameAr",
          d.name_en AS "nameEn",
          d.code,
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt",
          (d.boundary IS NOT NULL) AS "hasBoundary",
          (SELECT COUNT(*)::int FROM places p WHERE p.district_id = d.id) AS "placesCount"
        FROM districts d
        WHERE d.governorate_id = ${governorateId}
        ORDER BY d.name_ar ASC;
      `;

      if (rawRows && Array.isArray(rawRows)) {
        return rawRows.map((r) => {
          const hasBoundary = Boolean(r.hasBoundary);
          return {
            id: r.id,
            externalId: r.externalId,
            governorateId: r.governorateId,
            nameAr: r.nameAr,
            nameEn: r.nameEn,
            code: r.code,
            hasBoundary,
            boundaryStatus: hasBoundary ? 'AVAILABLE' : 'MISSING',
            placesCount: Number(r.placesCount || 0),
            createdAt: r.createdAt,
            updatedAt: r.updatedAt,
          };
        });
      }
    } catch (_err) {
      // Fallback if raw query fails or in mock test environment
    }

    const rows = await this.prisma.district.findMany({
      where: { governorateId },
      orderBy: { nameAr: 'asc' },
      select: {
        id: true,
        externalId: true,
        governorateId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: { places: true },
        },
      },
    });

    return rows.map((r: any) => ({
      id: r.id,
      externalId: r.externalId,
      governorateId: r.governorateId,
      nameAr: r.nameAr,
      nameEn: r.nameEn,
      code: r.code,
      hasBoundary: false,
      boundaryStatus: 'MISSING',
      placesCount: r._count?.places ?? 0,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
    }));
  }

  /**
   * Returns a single district by ID, or null if not found.
   */
  async getDistrictById(id: string): Promise<DistrictRecord | null> {
    return this.prisma.district.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        governorateId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Returns rich district detail with PostGIS boundary GeoJSON, SRID, geometry type,
   * governorate metadata, and place counts.
   */
  async getDistrictDetailsById(id: string): Promise<DistrictDetailRecord | null> {
    try {
      const rows = await this.prisma.$queryRaw<any[]>`
        SELECT 
          d.id,
          d.external_id AS "externalId",
          d.governorate_id AS "governorateId",
          d.name_ar AS "nameAr",
          d.name_en AS "nameEn",
          d.code,
          d.created_at AS "createdAt",
          d.updated_at AS "updatedAt",
          (d.boundary IS NOT NULL) AS "hasBoundary",
          CASE WHEN d.boundary IS NOT NULL THEN ST_AsGeoJSON(d.boundary) ELSE NULL END AS "boundaryGeoJson",
          (SELECT COUNT(*)::int FROM places p WHERE p.district_id = d.id) AS "placesCount",
          g.id AS "gov_id",
          g.external_id AS "gov_externalId",
          g.name_ar AS "gov_nameAr",
          g.name_en AS "gov_nameEn",
          g.code AS "gov_code"
        FROM districts d
        LEFT JOIN governorates g ON g.id = d.governorate_id
        WHERE d.id = ${id} OR d.external_id = ${id};
      `;

      if (rows && rows.length > 0) {
        const r = rows[0];
        let geoJson = null;
        if (r.boundaryGeoJson) {
          try {
            geoJson = typeof r.boundaryGeoJson === 'string' ? JSON.parse(r.boundaryGeoJson) : r.boundaryGeoJson;
          } catch (_e) {}
        }
        const hasBoundary = Boolean(r.hasBoundary);
        return {
          id: r.id,
          externalId: r.externalId,
          governorateId: r.governorateId,
          nameAr: r.nameAr,
          nameEn: r.nameEn,
          code: r.code,
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          hasBoundary,
          boundaryStatus: hasBoundary ? 'AVAILABLE' : 'MISSING',
          boundaryGeometryType: hasBoundary ? (geoJson?.type || 'MultiPolygon') : null,
          srid: hasBoundary ? 4326 : null,
          boundaryGeoJson: geoJson,
          placesCount: Number(r.placesCount || 0),
          governorate: r.gov_id
            ? {
                id: r.gov_id,
                externalId: r.gov_externalId,
                nameAr: r.gov_nameAr,
                nameEn: r.gov_nameEn,
                code: r.gov_code,
              }
            : null,
        };
      }
    } catch (_err) {
      // Fallback to Prisma query if raw PostGIS query fails or in mock test environment
    }

    const district = await this.prisma.district.findUnique({
      where: { id },
      include: {
        governorate: true,
        _count: { select: { places: true } },
      },
    });

    if (!district) return null;

    return {
      id: district.id,
      externalId: district.externalId,
      governorateId: district.governorateId,
      nameAr: district.nameAr,
      nameEn: district.nameEn,
      code: district.code,
      createdAt: district.createdAt,
      updatedAt: district.updatedAt,
      hasBoundary: false,
      boundaryStatus: 'MISSING',
      boundaryGeometryType: null,
      srid: null,
      boundaryGeoJson: null,
      placesCount: district._count?.places ?? 0,
      governorate: district.governorate
        ? {
            id: district.governorate.id,
            externalId: district.governorate.externalId,
            nameAr: district.governorate.nameAr,
            nameEn: district.governorate.nameEn,
            code: district.governorate.code,
          }
        : null,
    };
  }
}

