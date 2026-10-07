/**
 * Query and filter helpers for WAYNAH Search Engine.
 * Provides validation and parameter parsing without direct database dependencies.
 */

import type {
  AdministrativeFilterCriteria,
  CategoryFilterCriteria,
  GeographicBounds,
  PaginationCriteria,
  SearchQueryParams,
} from '../types/index.js';

export const DEFAULT_SEARCH_LIMIT = 20;
export const MAX_SEARCH_LIMIT = 50;
export const DEFAULT_SEARCH_RADIUS_METERS = 5000;

/**
 * Validates and normalizes search query parameters.
 */
export function normalizeSearchQueryParams(params: Partial<SearchQueryParams>): SearchQueryParams {
  const query = params.query?.trim() || undefined;
  const lat = typeof params.lat === 'number' && !isNaN(params.lat) ? params.lat : undefined;
  const lng = typeof params.lng === 'number' && !isNaN(params.lng) ? params.lng : undefined;

  let radiusMeters = typeof params.radiusMeters === 'number' && !isNaN(params.radiusMeters)
    ? params.radiusMeters
    : DEFAULT_SEARCH_RADIUS_METERS;
  if (radiusMeters <= 0) radiusMeters = DEFAULT_SEARCH_RADIUS_METERS;

  const governorateId = params.governorateId?.trim() || undefined;
  const districtId = params.districtId?.trim() || undefined;
  const categoryId = params.categoryId?.trim() || undefined;

  let limit = typeof params.limit === 'number' && !isNaN(params.limit) && params.limit > 0
    ? params.limit
    : DEFAULT_SEARCH_LIMIT;
  limit = Math.min(limit, MAX_SEARCH_LIMIT);

  const offset = Math.max(
    0,
    typeof params.offset === 'number' && !isNaN(params.offset) ? params.offset : 0
  );

  return {
    query,
    lat,
    lng,
    radiusMeters,
    governorateId,
    districtId,
    categoryId,
    entityTypes: params.entityTypes,
    limit,
    offset,
  };
}

/**
 * Extracts geographic bounds if valid latitude and longitude coordinates are provided.
 */
export function extractGeographicBounds(params: SearchQueryParams): GeographicBounds | null {
  if (params.lat !== undefined && params.lng !== undefined) {
    if (params.lat >= -90 && params.lat <= 90 && params.lng >= -180 && params.lng <= 180) {
      return {
        latitude: params.lat,
        longitude: params.lng,
        radiusMeters: params.radiusMeters ?? DEFAULT_SEARCH_RADIUS_METERS,
      };
    }
  }
  return null;
}

/**
 * Extracts administrative filter criteria.
 */
export function extractAdministrativeFilters(params: SearchQueryParams): AdministrativeFilterCriteria {
  return {
    governorateId: params.governorateId,
    districtId: params.districtId,
  };
}

/**
 * Extracts category filter criteria.
 */
export function extractCategoryFilters(params: SearchQueryParams): CategoryFilterCriteria {
  return {
    categoryId: params.categoryId,
  };
}

/**
 * Calculates limit and offset pagination parameters.
 */
export function extractPaginationCriteria(params: SearchQueryParams): PaginationCriteria {
  return {
    limit: params.limit ?? DEFAULT_SEARCH_LIMIT,
    offset: params.offset ?? 0,
  };
}
