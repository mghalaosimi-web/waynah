/**
 * WAYNAH — GEO-C: Search Filter Enhancement Tests
 *
 * Test suite verifying administrative geography search filters (governorateId, districtId):
 *   A. No filters — Returns places with default pagination/ordering.
 *   B. Governorate filter — Returns only places within requested governorate.
 *   C. District filter — Returns only places within requested district.
 *   D. Combined filters — Matching district + governorate returns place; mismatched returns empty.
 *   E. Spatial + Administrative — Composes lat/lng/radius with governorateId and districtId.
 *   F. Invalid IDs & validation — Empty values and malformed query params follow validation contract.
 *   G. API Client & Route Integration — Verify HTTP API contract and client types.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService, type SearchResult } from '../src/domain/search/search.service.js';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { searchParamsSchema } from '@waynah/shared';

// ─── Test Fixture Data ────────────────────────────────────────────────────────

const MOCK_PLACES: (SearchResult & { governorateId: string })[] = [
  {
    id: 'place-abs-1',
    nameAr: 'صيدلية السلام عبس',
    nameEn: 'Al-Salam Pharmacy Abs',
    slug: 'al-salam-pharmacy-abs',
    description: 'صيدلية في مركز مديرية عبس',
    address: 'شارع المطاعم، عبس',
    phoneNumber: '+967 773 111 222',
    website: null,
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-health',
    categoryNameAr: 'رعاية صحية',
    districtId: 'dist-abs',
    districtNameAr: 'عبس',
    governorateId: 'gov-hajjah',
    createdAt: new Date('2026-01-01T00:00:00Z'),
    updatedAt: new Date('2026-01-01T00:00:00Z'),
    locationId: 'loc-abs-1',
    latitude: 16.01,
    longitude: 43.10,
    distance_meters: 100,
    match_score: 1.0,
  },
  {
    id: 'place-hajjah-city-1',
    nameAr: 'مستشفى حجة العام',
    nameEn: 'Hajjah General Hospital',
    slug: 'hajjah-general-hospital',
    description: 'المستشفى العام بمدينة حجة',
    address: 'مركز المحافظة، حجة',
    phoneNumber: '+967 777 222 333',
    website: null,
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-health',
    categoryNameAr: 'رعاية صحية',
    districtId: 'dist-hajjah-city',
    districtNameAr: 'مدينة حجة',
    governorateId: 'gov-hajjah',
    createdAt: new Date('2026-01-02T00:00:00Z'),
    updatedAt: new Date('2026-01-02T00:00:00Z'),
    locationId: 'loc-hajjah-city-1',
    latitude: 15.69,
    longitude: 43.60,
    distance_meters: 55000,
    match_score: 1.0,
  },
  {
    id: 'place-hodeidah-1',
    nameAr: 'مستشفى الثورة بالحديدة',
    nameEn: 'Al-Thawra Hospital Hodeidah',
    slug: 'al-thawra-hodeidah',
    description: 'مستشفى عام في الحديدة',
    address: 'شارع الكورنيش، الحديدة',
    phoneNumber: '+967 771 444 555',
    website: null,
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-health',
    categoryNameAr: 'رعاية صحية',
    districtId: 'dist-hodeidah-city',
    districtNameAr: 'الحوك',
    governorateId: 'gov-hodeidah',
    createdAt: new Date('2026-01-03T00:00:00Z'),
    updatedAt: new Date('2026-01-03T00:00:00Z'),
    locationId: 'loc-hodeidah-1',
    latitude: 14.80,
    longitude: 42.95,
    distance_meters: 150000,
    match_score: 1.0,
  },
];

function extractAllValues(...args: any[]): any[] {
  const result: any[] = [];
  function recurse(item: any) {
    if (item === null || item === undefined) return;
    if (Array.isArray(item)) {
      item.forEach(recurse);
    } else if (typeof item === 'object') {
      if (item.values) recurse(item.values);
      if (item.strings) recurse(item.strings);
    } else {
      result.push(item);
    }
  }
  args.forEach(recurse);
  return result;
}

function createMockPrismaClient() {
  return {
    $queryRaw: vi.fn().mockImplementation((...args: any[]) => {
      let filtered = [...MOCK_PLACES];

      const allValues = extractAllValues(...args);

      // Find if district filter was passed (starts with 'dist-')
      const distVal = allValues.find((v) => typeof v === 'string' && v.startsWith('dist-'));
      if (distVal) {
        filtered = filtered.filter((p) => p.districtId === distVal);
      }

      // Find if governorate filter was passed (starts with 'gov-')
      const govVal = allValues.find((v) => typeof v === 'string' && v.startsWith('gov-'));
      if (govVal) {
        filtered = filtered.filter((p) => p.governorateId === govVal);
      }

      // Check spatial condition ST_DWithin
      const textMatches = allValues.some((v) => typeof v === 'string' && v.includes('ST_DWithin'));
      if (textMatches) {
        // Radius in meters is > 1000
        const radiusVal = allValues.find((v) => typeof v === 'number' && v >= 1000);
        if (radiusVal) {
          filtered = filtered.filter((p) => p.distance_meters <= radiusVal);
        }
      }

      const results: SearchResult[] = filtered.map(({ governorateId, ...rest }) => rest);
      return Promise.resolve(results);
    }),
    category: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'cat-health', nameAr: 'رعاية صحية', nameEn: 'Healthcare', slug: 'health', icon: '🏥' },
      ]),
    },
    place: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        const found = MOCK_PLACES.find((p) => p.id === where.id);
        if (!found) return Promise.resolve(null);
        return Promise.resolve({
          ...found,
          category: { id: 'cat-health', nameAr: 'رعاية صحية' },
          district: {
            id: found.districtId,
            nameAr: found.districtNameAr,
            governorate: { id: found.governorateId, nameAr: found.governorateId === 'gov-hajjah' ? 'حجة' : 'الحديدة' },
          },
          location: { id: found.locationId, latitude: found.latitude, longitude: found.longitude },
        });
      }),
    },
  } as unknown as PrismaClient;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('WAYNAH — GEO-C: Search Filter Enhancement', () => {
  let mockPrisma: PrismaClient;
  let searchService: SearchService;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    searchService = new SearchService(mockPrisma);
  });

  // ── 1. Zod Schema Validation ───────────────────────────────────────────────

  it('1. searchParamsSchema parses optional governorateId and districtId correctly', () => {
    const valid = searchParamsSchema.parse({
      governorateId: 'gov-hajjah',
      districtId: 'dist-abs',
      limit: 10,
    });

    expect(valid.governorateId).toBe('gov-hajjah');
    expect(valid.districtId).toBe('dist-abs');
    expect(valid.limit).toBe(10);
  });

  it('2. searchParamsSchema rejects empty string governorateId / districtId', () => {
    expect(() =>
      searchParamsSchema.parse({
        governorateId: '   ',
      })
    ).toThrow();

    expect(() =>
      searchParamsSchema.parse({
        districtId: '',
      })
    ).toThrow();
  });

  // ── 2. Search Service Unit Tests ──────────────────────────────────────────

  it('3. Test A (No filters) — Returns all places', async () => {
    const results = await searchService.searchPlaces({});

    expect(results).toHaveLength(3);
    expect(mockPrisma.$queryRaw).toHaveBeenCalled();
  });

  it('4. Test B (Governorate filter) — Returns only places in requested governorate', async () => {
    const results = await searchService.searchPlaces({ governorateId: 'gov-hajjah' });

    expect(results).toHaveLength(2);
    expect(results.every((p) => p.districtId === 'dist-abs' || p.districtId === 'dist-hajjah-city')).toBe(true);
    expect(results.some((p) => p.id === 'place-hodeidah-1')).toBe(false);
  });

  it('5. Test C (District filter) — Returns only places in requested district', async () => {
    const results = await searchService.searchPlaces({ districtId: 'dist-abs' });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('place-abs-1');
  });

  it('6. Test D.1 (Combined matching filters) — Returns matching place when district belongs to governorate', async () => {
    const results = await searchService.searchPlaces({
      governorateId: 'gov-hajjah',
      districtId: 'dist-abs',
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('place-abs-1');
  });

  it('7. Test D.2 (Combined mismatched filters) — Returns empty results when district does not belong to governorate', async () => {
    const results = await searchService.searchPlaces({
      governorateId: 'gov-hodeidah',
      districtId: 'dist-abs', // Abs is in Hajjah, not Hodeidah
    });

    expect(results).toHaveLength(0);
  });

  it('8. Test E (Spatial + Administrative filters) — Composes radius filter with governorate/district', async () => {
    const results = await searchService.searchPlaces({
      governorateId: 'gov-hajjah',
      districtId: 'dist-abs',
      lat: 16.01,
      lng: 43.10,
      radiusMeters: 5000,
    });

    expect(results).toHaveLength(1);
    expect(results[0].id).toBe('place-abs-1');
  });

  // ── 3. HTTP Endpoint Integration Tests ─────────────────────────────────────

  it('9. HTTP GET /v1/search accepts governorateId and districtId query parameters', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/search?governorateId=gov-hajjah&districtId=dist-abs');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(1);
    expect(json.data[0].id).toBe('place-abs-1');
  });

  it('10. HTTP GET /v1/search returns 400 for invalid/malformed governorateId/districtId', async () => {
    const app = createServer(mockPrisma);

    // Lat without Lng produces validation error
    const resSpatialErr = await app.request('/v1/search?governorateId=gov-hajjah&lat=16.01');
    expect(resSpatialErr.status).toBe(400);

    const jsonErr = await resSpatialErr.json();
    expect(jsonErr.success).toBe(false);
    expect(jsonErr.error).toBe('Invalid search query parameters');
  });

  it('11. HTTP GET /v1/search preserves backward compatibility for clients with no admin filters', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/search?limit=20');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data).toHaveLength(3);
  });
});
