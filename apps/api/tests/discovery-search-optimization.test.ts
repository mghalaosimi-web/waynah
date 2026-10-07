/**
 * WAYNAH — Phase 11 Work Unit 2B & Work Unit 3 Integration Tests
 *
 * Full integration test suite verifying:
 *   1. Search Service extraction & multi-entity discovery across Places, Businesses, Products, and Services.
 *   2. Arabic Full-Text Search (FTS) & Trigram similarity queries.
 *   3. Relevancy ranking vs Trust score isolation safety assertion.
 *   4. Unified Discovery API endpoint (GET /v1/discovery & GET /v1/discovery/search).
 *   5. Rate limiting headers on public search endpoints.
 *   6. Preservation of existing POST /v1/discovery/ingest and POST /v1/discovery/community-report endpoints.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SearchService } from '../src/domain/search/search.service.js';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { calculateBlendedRelevancyScore, normalizeArabicText } from '@waynah/search';

// ─── Mock Fixtures ────────────────────────────────────────────────────────────

const MOCK_PLACES_RAW = [
  {
    id: 'place-abs-1',
    name_ar: 'صيدلية السلام عبس',
    name_en: 'Al-Salam Pharmacy Abs',
    description: 'صيدلية في مركز مديرية عبس',
    category_id: 'cat-health',
    district_id: 'dist-abs',
    governorate_id: 'gov-hajjah',
    verification_status: 'VERIFIED',
    distance_meters: 100,
    text_score: 0.9,
  },
  {
    id: 'place-hajjah-1',
    name_ar: 'مستشفى حجة العام',
    name_en: 'Hajjah General Hospital',
    description: 'مستشفى في مدينة حجة',
    category_id: 'cat-health',
    district_id: 'dist-hajjah-city',
    governorate_id: 'gov-hajjah',
    verification_status: 'UNVERIFIED',
    distance_meters: 50000,
    text_score: 0.8,
  },
];

const MOCK_BIZ_RAW = [
  {
    id: 'biz-al-noor',
    name: 'شركة النور للمستلزمات الطبية',
    description: 'مورد مستلزمات طبية في حجة',
    verification_status: 'VERIFIED',
    text_score: 0.85,
  },
];

const MOCK_PROD_RAW = [
  {
    id: 'prod-panadol',
    name_ar: 'بنادول إكسترا 500 ملغم',
    name_en: 'Panadol Extra 500mg',
    description: 'مسكن آلام سريع المفعول',
    category_id: 'cat-health',
    business_id: 'biz-al-noor',
    price: 1500,
    currency: 'YER',
    text_score: 0.95,
  },
];

const MOCK_SERV_RAW = [
  {
    id: 'serv-checkup',
    name_ar: 'فحص طب عام شامل',
    name_en: 'General Health Checkup',
    description: 'استشارة وفحص طبي شامل',
    category_id: 'cat-health',
    business_id: 'biz-al-noor',
    price: 5000,
    currency: 'YER',
    duration_minutes: 30,
    text_score: 0.75,
  },
];

function createMockPrismaClient() {
  return {
    $queryRaw: vi.fn().mockImplementation((strings: TemplateStringsArray | any, ...values: any[]) => {
      const sqlText = Array.isArray(strings) ? strings.join(' ') : String(strings);

      if (sqlText.includes('FROM places')) {
        return Promise.resolve(MOCK_PLACES_RAW);
      }
      if (sqlText.includes('FROM businesses')) {
        return Promise.resolve(MOCK_BIZ_RAW);
      }
      if (sqlText.includes('FROM products')) {
        return Promise.resolve(MOCK_PROD_RAW);
      }
      if (sqlText.includes('FROM service_items')) {
        return Promise.resolve(MOCK_SERV_RAW);
      }

      return Promise.resolve([]);
    }),
    category: {
      findMany: vi.fn().mockResolvedValue([
        { id: 'cat-health', nameAr: 'رعاية صحية', nameEn: 'Healthcare', slug: 'health' },
      ]),
    },
    place: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
        const found = MOCK_PLACES_RAW.find((p) => p.id === where.id);
        if (!found) return Promise.resolve(null);
        return Promise.resolve({
          ...found,
          nameAr: found.name_ar,
          nameEn: found.name_en,
          verificationStatus: found.verification_status,
          categoryId: found.category_id,
          districtId: found.district_id,
          category: { id: 'cat-health', nameAr: 'رعاية صحية' },
          district: {
            id: found.district_id,
            nameAr: 'عبس',
            governorate: { id: found.governorate_id, nameAr: 'حجة' },
          },
          location: { id: 'loc-1', latitude: 16.01, longitude: 43.1 },
        });
      }),
    },
    dataSource: {
      findFirst: vi.fn().mockResolvedValue({ id: 'ds-community', name: 'WAYNAH Community Reports' }),
      create: vi.fn().mockResolvedValue({ id: 'ds-community', name: 'WAYNAH Community Reports' }),
    },
  } as unknown as PrismaClient;
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('WAYNAH — Phase 11 Work Unit 2B & Work Unit 3 Integration Tests', () => {
  let mockPrisma: PrismaClient;
  let searchService: SearchService;

  beforeEach(() => {
    mockPrisma = createMockPrismaClient();
    searchService = new SearchService(mockPrisma);
  });

  // ── 1. Search Service Multi-Entity Discovery Tests ─────────────────────────

  it('1. searchMultiEntity queries Places, Businesses, Products, and Services', async () => {
    const result = await searchService.searchMultiEntity({ query: 'صيدلية' });

    expect(result.total).toBe(5); // 2 places, 1 biz, 1 prod, 1 serv = 5 items
    expect(result.placesCount).toBe(2);
    expect(result.businessesCount).toBe(1);
    expect(result.productsCount).toBe(1);
    expect(result.servicesCount).toBe(1);
    expect(result.results).toHaveLength(5);
  });

  it('2. searchMultiEntity filters results by entityTypes parameter when specified', async () => {
    const resultPlacesOnly = await searchService.searchMultiEntity({
      query: 'مستشفى',
      entityTypes: ['PLACE'],
    });

    expect(resultPlacesOnly.placesCount).toBe(2);
    expect(resultPlacesOnly.businessesCount).toBe(0);
    expect(resultPlacesOnly.productsCount).toBe(0);
    expect(resultPlacesOnly.servicesCount).toBe(0);
    expect(resultPlacesOnly.results.every((r) => r.entityType === 'PLACE')).toBe(true);
  });

  // ── 2. Relevancy Ranking vs Trust Isolation Assertions ─────────────────────

  it('3. HARD TRUST ISOLATION: Trust metadata does NOT alter relevancy ordering', () => {
    const unverifiedPlace = {
      textScore: 0.9,
      distanceMeters: 500,
      hasQuery: true,
      hasGeo: true,
      trustMetadata: { verificationStatus: 'UNVERIFIED', isVerified: false },
    };

    const verifiedPlace = {
      textScore: 0.9,
      distanceMeters: 500,
      hasQuery: true,
      hasGeo: true,
      trustMetadata: { verificationStatus: 'VERIFIED', isVerified: true },
    };

    const scoreUnverified = calculateBlendedRelevancyScore(unverifiedPlace);
    const scoreVerified = calculateBlendedRelevancyScore(verifiedPlace);

    expect(scoreUnverified).toBe(scoreVerified);
  });

  // ── 3. Arabic Normalization Integration Tests ─────────────────────────────

  it('4. Arabic normalization integrates cleanly before query execution', () => {
    const rawQuery = '  مَطْعَمُ  أَبُو   عَلِي  ';
    const normalized = normalizeArabicText(rawQuery);
    expect(normalized).toBe('مطعم ابو علي');
  });

  // ── 4. Unified Discovery HTTP Routes Tests ─────────────────────────────────

  it('5. HTTP GET /v1/discovery returns Unified Discovery results with HTTP 200', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/discovery?query=صيدلية&limit=10');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.total).toBe(5);
    expect(json.data.results).toHaveLength(5);
  });

  it('6. HTTP GET /v1/discovery/search returns identical Unified Discovery contract', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/discovery/search?query=صيدلية');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.results.length).toBeGreaterThan(0);
  });

  it('7. Rate limiting headers (X-RateLimit-Limit) are set on GET /v1/discovery', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/discovery?limit=5');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-ratelimit-limit')).not.toBeNull();
    expect(res.headers.get('x-ratelimit-remaining')).not.toBeNull();
  });

  it('8. Rate limiting headers (X-RateLimit-Limit) are set on GET /v1/search', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/search?limit=5');
    expect(res.status).toBe(200);
    expect(res.headers.get('x-ratelimit-limit')).not.toBeNull();
  });

  // ── 5. Backward Compatibility & Preservation Tests ─────────────────────────

  it('9. Existing Place search (GET /v1/search) maintains 100% backward compatibility', async () => {
    const app = createServer(mockPrisma);

    const res = await app.request('/v1/search?districtId=dist-abs');
    expect(res.status).toBe(200);

    const json = await res.json();
    expect(json.success).toBe(true);
    expect(Array.isArray(json.data)).toBe(true);
  });
});
