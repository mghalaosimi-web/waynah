import {
  prisma as defaultPrisma,
  Prisma,
  PrismaClient,
} from '@waynah/database';
import { searchParamsSchema, type SearchParams } from '@waynah/shared';

export interface SearchResult {
  id: string;
  nameAr: string;
  nameEn: string | null;
  slug: string | null;
  description: string | null;
  address: string | null;
  phoneNumber: string | null;
  website: string | null;
  verificationStatus: string;
  categoryId: string;
  districtId: string;
  categoryNameAr?: string | null;
  districtNameAr?: string | null;
  createdAt: Date | string;
  updatedAt: Date | string;
  locationId: string | null;
  latitude: number | null;
  longitude: number | null;
  distance_meters: number;
  match_score: number;
}

export class SearchService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Performs high-performance geospatial (PostGIS) and text similarity (pg_trgm) search on canonical Places.
   *
   * @param params Search query, location coordinates, radius, category, limit, and offset parameters
   * @param prismaClient Optional PrismaClient instance for custom dependency injection
   * @returns Array of SearchResult items ordered by blended relevance rank or proximity
   */
  async searchPlaces(
    params: SearchParams,
    prismaClient?: PrismaClient
  ): Promise<SearchResult[]> {
    const db = prismaClient ?? this.prisma;
    const validated = searchParamsSchema.parse(params);

    const conditions: Prisma.Sql[] = [];

    // 1. Category Filter
    if (validated.categoryId) {
      conditions.push(Prisma.sql`p.category_id = ${validated.categoryId}`);
    }

    // 2. Spatial Filter
    const hasGeo = validated.lat !== undefined && validated.lng !== undefined;
    const radiusMeters = validated.radiusMeters ?? 5000;
    const userGeom = hasGeo
      ? Prisma.sql`ST_SetSRID(ST_MakePoint(${validated.lng!}, ${validated.lat!}), 4326)::geography`
      : null;

    if (hasGeo && userGeom) {
      conditions.push(Prisma.sql`pl.geom IS NOT NULL`);
      conditions.push(Prisma.sql`ST_DWithin(pl.geom, ${userGeom}, ${radiusMeters})`);
    }

    // 3. Text Similarity Filter
    const queryStr = validated.query?.trim();
    const hasQuery = Boolean(queryStr && queryStr.length > 0);

    if (hasQuery && queryStr) {
      const ilikePattern = `%${queryStr}%`;
      conditions.push(
        Prisma.sql`(
          similarity(p.name_ar, ${queryStr}) > 0.1 OR 
          (p.name_en IS NOT NULL AND similarity(p.name_en, ${queryStr}) > 0.1) OR 
          p.name_ar ILIKE ${ilikePattern} OR 
          (p.name_en IS NOT NULL AND p.name_en ILIKE ${ilikePattern})
        )`
      );
    }

    // Construct dynamic WHERE clause safely using Prisma.join and Prisma.empty
    const whereClause =
      conditions.length > 0
        ? Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`
        : Prisma.empty;

    // Expressions for distance and similarity match score
    const distanceSql = userGeom
      ? Prisma.sql`ST_Distance(pl.geom, ${userGeom})`
      : Prisma.sql`0`;

    const textScoreSql =
      hasQuery && queryStr
        ? Prisma.sql`GREATEST(similarity(p.name_ar, ${queryStr}), similarity(COALESCE(p.name_en, ''), ${queryStr}))`
        : Prisma.sql`0`;

    let matchScoreSql: Prisma.Sql;
    let orderBySql: Prisma.Sql;

    if (hasQuery && hasGeo) {
      matchScoreSql = Prisma.sql`(${textScoreSql} * 0.7 + (1.0 / (1.0 + (${distanceSql} / 1000.0))) * 0.3)`;
      orderBySql = Prisma.sql`ORDER BY "match_score" DESC, "distance_meters" ASC`;
    } else if (hasQuery) {
      matchScoreSql = textScoreSql;
      orderBySql = Prisma.sql`ORDER BY "match_score" DESC, p.name_ar ASC`;
    } else if (hasGeo) {
      matchScoreSql = Prisma.sql`(1.0 / (1.0 + (${distanceSql} / 1000.0)))`;
      orderBySql = Prisma.sql`ORDER BY "distance_meters" ASC`;
    } else {
      matchScoreSql = Prisma.sql`1.0`;
      orderBySql = Prisma.sql`ORDER BY p.created_at DESC`;
    }

    const limit = Math.min(validated.limit ?? 20, 50);
    const offset = validated.offset ?? 0;

    const rawResults = await db.$queryRaw<SearchResult[]>`
      SELECT 
        p.id,
        p.name_ar AS "nameAr",
        p.name_en AS "nameEn",
        p.slug,
        p.description,
        p.address,
        p.phone_number AS "phoneNumber",
        p.website,
        p.verification_status AS "verificationStatus",
        p.category_id AS "categoryId",
        p.district_id AS "districtId",
        c.name_ar AS "categoryNameAr",
        d.name_ar AS "districtNameAr",
        p.created_at AS "createdAt",
        p.updated_at AS "updatedAt",
        pl.id AS "locationId",
        pl.latitude AS "latitude",
        pl.longitude AS "longitude",
        COALESCE(${distanceSql}, 0)::float AS "distance_meters",
        COALESCE(${matchScoreSql}, 0)::float AS "match_score"
      FROM places p
      LEFT JOIN place_locations pl ON p.id = pl.place_id
      LEFT JOIN categories c ON p.category_id = c.id
      LEFT JOIN districts d ON p.district_id = d.id
      ${whereClause}
      ${orderBySql}
      LIMIT ${limit} OFFSET ${offset}
    `;

    return rawResults;
  }

  /**
   * Retrieves all canonical categories sorted by Arabic name.
   */
  async getCategories() {
    return this.prisma.category.findMany({
      orderBy: { nameAr: 'asc' },
    });
  }

  /**
   * Retrieves a single Place by ID with category, location, and district details.
   */
  async getPlaceById(id: string) {
    const place = await this.prisma.place.findUnique({
      where: { id },
      include: {
        category: true,
        district: {
          include: {
            governorate: true,
          },
        },
        location: true,
      },
    });

    if (!place) return null;

    return {
      id: place.id,
      nameAr: place.nameAr,
      nameEn: place.nameEn,
      slug: place.slug,
      description: place.description,
      address: place.address,
      phoneNumber: place.phoneNumber,
      website: place.website,
      verificationStatus: place.verificationStatus,
      categoryId: place.categoryId,
      categoryNameAr: place.category?.nameAr ?? null,
      districtId: place.districtId,
      districtNameAr: place.district?.nameAr ?? null,
      governorateNameAr: place.district?.governorate?.nameAr ?? null,
      latitude: place.location?.latitude ?? null,
      longitude: place.location?.longitude ?? null,
      createdAt: place.createdAt,
      updatedAt: place.updatedAt,
    };
  }
}
