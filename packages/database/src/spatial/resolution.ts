import { PrismaClient } from '../client.js';

export interface CandidateMatchInput {
  latitude: number;
  longitude: number;
  name?: string | null;
  radiusMeters?: number;
}

export interface PlaceMatchResult {
  id: string;
  nameAr: string;
  nameEn: string | null;
  distance: number;
  similarity: number;
}

/**
 * Queries the database for candidate Place matches near a spatial coordinate,
 * calculating PostGIS distance in meters and pg_trgm text similarity on place names.
 */
export async function findCandidateMatches(
  prisma: PrismaClient,
  input: CandidateMatchInput
): Promise<PlaceMatchResult[]> {
  const radius = input.radiusMeters ?? 100;
  const searchName = input.name && input.name.trim().length > 0 ? input.name.trim() : null;

  if (searchName) {
    return await prisma.$queryRaw<PlaceMatchResult[]>`
      SELECT 
        p.id AS "id",
        p.name_ar AS "nameAr",
        p.name_en AS "nameEn",
        ST_Distance(pl.geom, ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography) AS "distance",
        GREATEST(
          similarity(p.name_ar, ${searchName}),
          COALESCE(similarity(p.name_en, ${searchName}), 0)
        ) AS "similarity"
      FROM "places" p
      JOIN "place_locations" pl ON pl.place_id = p.id
      WHERE pl.geom IS NOT NULL
        AND ST_DWithin(pl.geom, ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography, ${radius})
      ORDER BY "distance" ASC, "similarity" DESC;
    `;
  }

  return await prisma.$queryRaw<PlaceMatchResult[]>`
    SELECT 
      p.id AS "id",
      p.name_ar AS "nameAr",
      p.name_en AS "nameEn",
      ST_Distance(pl.geom, ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography) AS "distance",
      0.0 AS "similarity"
    FROM "places" p
    JOIN "place_locations" pl ON pl.place_id = p.id
    WHERE pl.geom IS NOT NULL
      AND ST_DWithin(pl.geom, ST_SetSRID(ST_MakePoint(${input.longitude}, ${input.latitude}), 4326)::geography, ${radius})
    ORDER BY "distance" ASC;
  `;
}
