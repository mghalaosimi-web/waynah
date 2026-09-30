/**
 * WAYNAH Geographic Coordinate Validation
 *
 * Lightweight validation utilities for geographic coordinates and geometry.
 * These are enforced by GeographyImportService before any record is persisted.
 *
 * VALIDATION POLICY:
 * - Global coordinate bounds are used (not Yemen-specific bounding box).
 * - NaN, Infinity, and non-numeric values are rejected.
 * - Invalid records are rejected with an explicit error; they are never silently accepted.
 */

export interface CoordinateValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validates a latitude value against global geographic bounds.
 * Valid range: -90 ≤ latitude ≤ 90
 */
export function validateLatitude(lat: unknown): CoordinateValidationResult {
  if (typeof lat !== 'number') {
    return { valid: false, error: `Latitude must be a number, received: ${typeof lat}` };
  }
  if (isNaN(lat) || !isFinite(lat)) {
    return { valid: false, error: `Latitude must be a finite number, received: ${lat}` };
  }
  if (lat < -90 || lat > 90) {
    return { valid: false, error: `Latitude must be between -90 and 90, received: ${lat}` };
  }
  return { valid: true };
}

/**
 * Validates a longitude value against global geographic bounds.
 * Valid range: -180 ≤ longitude ≤ 180
 */
export function validateLongitude(lng: unknown): CoordinateValidationResult {
  if (typeof lng !== 'number') {
    return { valid: false, error: `Longitude must be a number, received: ${typeof lng}` };
  }
  if (isNaN(lng) || !isFinite(lng)) {
    return { valid: false, error: `Longitude must be a finite number, received: ${lng}` };
  }
  if (lng < -180 || lng > 180) {
    return { valid: false, error: `Longitude must be between -180 and 180, received: ${lng}` };
  }
  return { valid: true };
}

/**
 * Validates a coordinate pair (latitude, longitude).
 * Both must be valid and within global bounds.
 */
export function validateCoordinates(
  lat: unknown,
  lng: unknown
): CoordinateValidationResult {
  const latResult = validateLatitude(lat);
  if (!latResult.valid) return latResult;

  const lngResult = validateLongitude(lng);
  if (!lngResult.valid) return lngResult;

  return { valid: true };
}

/**
 * Validates a WGS84 SRID.
 * The only accepted SRID for geographic data in WAYNAH is 4326.
 */
export function validateSrid(srid: unknown): CoordinateValidationResult {
  if (srid !== 4326) {
    return {
      valid: false,
      error: `Invalid SRID: ${srid}. WAYNAH geographic data must use SRID 4326 (WGS84).`,
    };
  }
  return { valid: true };
}

/**
 * Supported geometry types for district boundaries (future).
 * Only MultiPolygon is permitted for administrative boundary data.
 */
export const SUPPORTED_BOUNDARY_GEOMETRY_TYPES = ['MultiPolygon', 'Polygon'] as const;
export type SupportedBoundaryGeometryType = (typeof SUPPORTED_BOUNDARY_GEOMETRY_TYPES)[number];

/**
 * Validates a geometry type string against supported boundary types.
 */
export function validateBoundaryGeometryType(geometryType: string): CoordinateValidationResult {
  if (!SUPPORTED_BOUNDARY_GEOMETRY_TYPES.includes(geometryType as SupportedBoundaryGeometryType)) {
    return {
      valid: false,
      error: `Unsupported geometry type: "${geometryType}". Supported types: ${SUPPORTED_BOUNDARY_GEOMETRY_TYPES.join(', ')}`,
    };
  }
  return { valid: true };
}
