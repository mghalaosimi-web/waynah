/**
 * WAYNAH Geospatial Map Domain Contracts & Validation
 *
 * Enforces clean abstraction between UI DTOs and Leaflet / Map Provider.
 * Web UI NEVER passes Prisma DB entities directly to Map Provider.
 */

export interface GeoPoint {
  latitude: number;
  longitude: number;
}

/**
 * WAYNAH's initial map focus follows the first approved pilot region.
 * Coordinates identify Hajjah city (GeoNames feature 75337), not a user location.
 */
export const WAYNAH_DEFAULT_MAP_CENTER: GeoPoint = {
  latitude: 15.69425,
  longitude: 43.60582,
};

/** Country-pilot overview zoom; explicit coordinates use a closer zoom. */
export const WAYNAH_DEFAULT_MAP_ZOOM = 8;

export interface MapMarkerData {
  id: string;
  latitude: number;
  longitude: number;
  nameAr: string;
  nameEn?: string | null;
  categoryNameAr?: string;
  districtNameAr?: string;
  address?: string | null;
  confidenceScore?: number;
  verificationStatus?: string;
  distance_meters?: number;
}

/**
 * Validates latitude and longitude values strictly within valid geographic bounds.
 */
export function isValidCoordinate(lat?: number | null, lng?: number | null): boolean {
  if (lat === undefined || lat === null || lng === undefined || lng === null) return false;
  if (typeof lat !== 'number' || typeof lng !== 'number') return false;
  if (isNaN(lat) || isNaN(lng)) return false;
  return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
}

/**
 * Filters array of marker items, discarding any item with invalid or missing coordinates.
 */
export function filterValidMarkers(markers: MapMarkerData[]): MapMarkerData[] {
  return markers.filter((m) => isValidCoordinate(m.latitude, m.longitude));
}
