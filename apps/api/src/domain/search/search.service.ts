import {
  prisma as defaultPrisma,
  Prisma,
  PrismaClient,
} from '@waynah/database';
import { searchParamsSchema, type SearchParams } from '@waynah/shared';
import {
  normalizeArabicText,
  normalizeSearchQueryParams,
  sortSearchResultsByRelevancy,
  type SearchEntityType,
  type SearchMatchResult,
  type UnifiedDiscoveryResultData,
} from '@waynah/search';

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
   * Performs high-performance geospatial (PostGIS) and text similarity (pg_trgm & Arabic FTS) search on canonical Places.
   * Preserves backward compatibility for GET /v1/search clients.
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

    // 1b. Administrative Geography Filters (Geo-C)
    if (validated.districtId) {
      conditions.push(Prisma.sql`p.district_id = ${validated.districtId}`);
    }

    if (validated.governorateId) {
      conditions.push(Prisma.sql`d.governorate_id = ${validated.governorateId}`);
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

    // 3. Text Similarity & FTS Filter
    const rawQuery = validated.query?.trim();
    const queryStr = rawQuery ? normalizeArabicText(rawQuery) : undefined;
    const hasQuery = Boolean(queryStr && queryStr.length > 0);

    if (hasQuery && queryStr) {
      const ilikePattern = `%${queryStr}%`;
      conditions.push(
        Prisma.sql`(
          to_tsvector('arabic', p.name_ar) @@ plainto_tsquery('arabic', ${queryStr}) OR
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

    const ftsRankSql =
      hasQuery && queryStr
        ? Prisma.sql`ts_rank(to_tsvector('arabic', p.name_ar), plainto_tsquery('arabic', ${queryStr}))`
        : Prisma.sql`0`;

    const textScoreSql =
      hasQuery && queryStr
        ? Prisma.sql`GREATEST(${ftsRankSql}, similarity(p.name_ar, ${queryStr}), similarity(COALESCE(p.name_en, ''), ${queryStr}))`
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
   * Unified Discovery across canonical Places, Businesses, Products, and ServiceItems.
   * Performs multi-entity search with Arabic FTS, pg_trgm similarity, PostGIS spatial queries, and strict Trust Isolation.
   *
   * @param params Query parameters including query text, geo coordinates, radius, admin filters, category, entityTypes, limit, offset
   * @param prismaClient Optional PrismaClient instance
   * @returns UnifiedDiscoveryResultData container with structured multi-entity search results
   */
  async searchMultiEntity(
    params: SearchParams & { entityTypes?: SearchEntityType[] },
    prismaClient?: PrismaClient
  ): Promise<UnifiedDiscoveryResultData> {
    const db = prismaClient ?? this.prisma;
    const normalizedParams = normalizeSearchQueryParams(params);
    const { query, lat, lng, radiusMeters, categoryId, districtId, governorateId, limit, offset } = normalizedParams;
    const requestedTypes: SearchEntityType[] = params.entityTypes && params.entityTypes.length > 0
      ? params.entityTypes
      : ['PLACE', 'BUSINESS', 'PRODUCT', 'SERVICE_ITEM'];

    const normalizedQuery = query ? normalizeArabicText(query) : undefined;
    const hasQuery = Boolean(normalizedQuery && normalizedQuery.length > 0);
    const hasGeo = lat !== undefined && lng !== undefined;

    const userGeom = hasGeo
      ? Prisma.sql`ST_SetSRID(ST_MakePoint(${lng!}, ${lat!}), 4326)::geography`
      : null;

    const allMatchResults: SearchMatchResult[] = [];
    let placesCount = 0;
    let businessesCount = 0;
    let productsCount = 0;
    let servicesCount = 0;

    // ── 1. Search Places ──────────────────────────────────────────────────────
    if (requestedTypes.includes('PLACE')) {
      const pConditions: Prisma.Sql[] = [];
      if (categoryId) pConditions.push(Prisma.sql`p.category_id = ${categoryId}`);
      if (districtId) pConditions.push(Prisma.sql`p.district_id = ${districtId}`);
      if (governorateId) pConditions.push(Prisma.sql`d.governorate_id = ${governorateId}`);
      if (hasGeo && userGeom) {
        pConditions.push(Prisma.sql`pl.geom IS NOT NULL AND ST_DWithin(pl.geom, ${userGeom}, ${radiusMeters})`);
      }
      if (hasQuery && normalizedQuery) {
        const pattern = `%${normalizedQuery}%`;
        pConditions.push(Prisma.sql`(
          to_tsvector('arabic', p.name_ar) @@ plainto_tsquery('arabic', ${normalizedQuery}) OR
          similarity(p.name_ar, ${normalizedQuery}) > 0.1 OR
          (p.name_en IS NOT NULL AND similarity(p.name_en, ${normalizedQuery}) > 0.1) OR
          p.name_ar ILIKE ${pattern} OR (p.name_en IS NOT NULL AND p.name_en ILIKE ${pattern})
        )`);
      }
      const pWhere = pConditions.length > 0 ? Prisma.sql`WHERE ${Prisma.join(pConditions, ' AND ')}` : Prisma.empty;
      const pDist = userGeom ? Prisma.sql`ST_Distance(pl.geom, ${userGeom})` : Prisma.sql`NULL`;
      const pTextScore = hasQuery && normalizedQuery
        ? Prisma.sql`GREATEST(ts_rank(to_tsvector('arabic', p.name_ar), plainto_tsquery('arabic', ${normalizedQuery})), similarity(p.name_ar, ${normalizedQuery}))`
        : Prisma.sql`1.0`;

      const placesRaw = await db.$queryRaw<any[]>`
        SELECT p.id, p.name_ar, p.name_en, p.description, p.category_id, p.district_id, d.governorate_id, p.verification_status,
               ${pDist}::float as distance_meters, ${pTextScore}::float as text_score
        FROM places p
        LEFT JOIN place_locations pl ON p.id = pl.place_id
        LEFT JOIN districts d ON p.district_id = d.id
        ${pWhere}
        LIMIT 100
      `;
      placesCount = placesRaw.length;
      for (const item of placesRaw) {
        const textScore = item.text_score || 0;
        const distMeters = item.distance_meters !== null ? Number(item.distance_meters) : null;
        const distScore = distMeters !== null ? 1.0 / (1.0 + distMeters / 1000.0) : 0;
        const relevancyScore = hasQuery && hasGeo ? textScore * 0.7 + distScore * 0.3 : (hasQuery ? textScore : (hasGeo ? distScore : 1.0));

        allMatchResults.push({
          id: item.id,
          entityType: 'PLACE',
          nameAr: item.name_ar,
          nameEn: item.name_en,
          description: item.description,
          categoryId: item.category_id,
          districtId: item.district_id,
          governorateId: item.governorate_id,
          distanceMeters: distMeters,
          textScore,
          distanceScore: distScore,
          relevancyScore,
          trustMetadata: {
            verificationStatus: item.verification_status,
            isVerified: item.verification_status === 'VERIFIED',
          },
        });
      }
    }

    // ── 2. Search Businesses ──────────────────────────────────────────────────
    if (requestedTypes.includes('BUSINESS')) {
      const bConditions: Prisma.Sql[] = [Prisma.sql`b.status = 'ACTIVE'`];
      if (hasQuery && normalizedQuery) {
        const pattern = `%${normalizedQuery}%`;
        bConditions.push(Prisma.sql`(
          to_tsvector('arabic', b.name) @@ plainto_tsquery('arabic', ${normalizedQuery}) OR
          similarity(b.name, ${normalizedQuery}) > 0.1 OR
          b.name ILIKE ${pattern} OR (b.description IS NOT NULL AND b.description ILIKE ${pattern})
        )`);
      }
      const bWhere = Prisma.sql`WHERE ${Prisma.join(bConditions, ' AND ')}`;
      const bTextScore = hasQuery && normalizedQuery
        ? Prisma.sql`GREATEST(ts_rank(to_tsvector('arabic', b.name), plainto_tsquery('arabic', ${normalizedQuery})), similarity(b.name, ${normalizedQuery}))`
        : Prisma.sql`1.0`;

      const bizRaw = await db.$queryRaw<any[]>`
        SELECT b.id, b.name, b.description, bv.status as verification_status,
               ${bTextScore}::float as text_score
        FROM businesses b
        LEFT JOIN business_verifications bv ON b.id = bv.business_id
        ${bWhere}
        LIMIT 100
      `;
      businessesCount = bizRaw.length;
      for (const item of bizRaw) {
        const textScore = item.text_score || 0;
        const relevancyScore = hasQuery ? textScore : 1.0;
        allMatchResults.push({
          id: item.id,
          entityType: 'BUSINESS',
          nameAr: item.name,
          description: item.description,
          textScore,
          distanceScore: 0,
          relevancyScore,
          trustMetadata: {
            verificationStatus: item.verification_status || 'UNVERIFIED',
            isVerified: item.verification_status === 'VERIFIED',
          },
        });
      }
    }

    // ── 3. Search Products ────────────────────────────────────────────────────
    if (requestedTypes.includes('PRODUCT')) {
      const prodConditions: Prisma.Sql[] = [Prisma.sql`pr.is_available = true`];
      if (categoryId) prodConditions.push(Prisma.sql`pr.category_id = ${categoryId}`);
      if (hasQuery && normalizedQuery) {
        const pattern = `%${normalizedQuery}%`;
        prodConditions.push(Prisma.sql`(
          to_tsvector('arabic', pr.name_ar) @@ plainto_tsquery('arabic', ${normalizedQuery}) OR
          similarity(pr.name_ar, ${normalizedQuery}) > 0.1 OR
          (pr.name_en IS NOT NULL AND similarity(pr.name_en, ${normalizedQuery}) > 0.1) OR
          pr.name_ar ILIKE ${pattern} OR (pr.name_en IS NOT NULL AND pr.name_en ILIKE ${pattern}) OR
          (pr.description IS NOT NULL AND pr.description ILIKE ${pattern})
        )`);
      }
      const prodWhere = Prisma.sql`WHERE ${Prisma.join(prodConditions, ' AND ')}`;
      const prodTextScore = hasQuery && normalizedQuery
        ? Prisma.sql`GREATEST(ts_rank(to_tsvector('arabic', pr.name_ar), plainto_tsquery('arabic', ${normalizedQuery})), similarity(pr.name_ar, ${normalizedQuery}))`
        : Prisma.sql`1.0`;

      const prodRaw = await db.$queryRaw<any[]>`
        SELECT pr.id, pr.name_ar, pr.name_en, pr.description, pr.category_id, pr.business_id, pr.price, pr.currency,
               ${prodTextScore}::float as text_score
        FROM products pr
        ${prodWhere}
        LIMIT 100
      `;
      productsCount = prodRaw.length;
      for (const item of prodRaw) {
        const textScore = item.text_score || 0;
        const relevancyScore = hasQuery ? textScore : 1.0;
        allMatchResults.push({
          id: item.id,
          entityType: 'PRODUCT',
          nameAr: item.name_ar,
          nameEn: item.name_en,
          description: item.description,
          categoryId: item.category_id,
          textScore,
          distanceScore: 0,
          relevancyScore,
          rawItem: { price: item.price, currency: item.currency, businessId: item.business_id },
        });
      }
    }

    // ── 4. Search Services ────────────────────────────────────────────────────
    if (requestedTypes.includes('SERVICE_ITEM')) {
      const sConditions: Prisma.Sql[] = [Prisma.sql`s.is_available = true`];
      if (categoryId) sConditions.push(Prisma.sql`s.category_id = ${categoryId}`);
      if (hasQuery && normalizedQuery) {
        const pattern = `%${normalizedQuery}%`;
        sConditions.push(Prisma.sql`(
          to_tsvector('arabic', s.name_ar) @@ plainto_tsquery('arabic', ${normalizedQuery}) OR
          similarity(s.name_ar, ${normalizedQuery}) > 0.1 OR
          (s.name_en IS NOT NULL AND similarity(s.name_en, ${normalizedQuery}) > 0.1) OR
          s.name_ar ILIKE ${pattern} OR (s.name_en IS NOT NULL AND s.name_en ILIKE ${pattern}) OR
          (s.description IS NOT NULL AND s.description ILIKE ${pattern})
        )`);
      }
      const sWhere = Prisma.sql`WHERE ${Prisma.join(sConditions, ' AND ')}`;
      const sTextScore = hasQuery && normalizedQuery
        ? Prisma.sql`GREATEST(ts_rank(to_tsvector('arabic', s.name_ar), plainto_tsquery('arabic', ${normalizedQuery})), similarity(s.name_ar, ${normalizedQuery}))`
        : Prisma.sql`1.0`;

      const sRaw = await db.$queryRaw<any[]>`
        SELECT s.id, s.name_ar, s.name_en, s.description, s.category_id, s.business_id, s.price, s.currency, s.duration_minutes,
               ${sTextScore}::float as text_score
        FROM service_items s
        ${sWhere}
        LIMIT 100
      `;
      servicesCount = sRaw.length;
      for (const item of sRaw) {
        const textScore = item.text_score || 0;
        const relevancyScore = hasQuery ? textScore : 1.0;
        allMatchResults.push({
          id: item.id,
          entityType: 'SERVICE_ITEM',
          nameAr: item.name_ar,
          nameEn: item.name_en,
          description: item.description,
          categoryId: item.category_id,
          textScore,
          distanceScore: 0,
          relevancyScore,
          rawItem: { price: item.price, currency: item.currency, durationMinutes: item.duration_minutes, businessId: item.business_id },
        });
      }
    }

    // Sort all results deterministically by Relevancy Score DESC, distance ASC, nameAr ASC
    const sorted = sortSearchResultsByRelevancy(allMatchResults);
    const safeOffset = offset ?? 0;
    const safeLimit = limit ?? 20;
    const paginated = sorted.slice(safeOffset, safeOffset + safeLimit);

    return {
      query: query || undefined,
      total: allMatchResults.length,
      placesCount,
      businessesCount,
      productsCount,
      servicesCount,
      results: paginated,
    };
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
