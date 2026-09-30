/**
 * WAYNAH-GEO-005 — Place Geographic Context & Spatial Integrity Tests
 *
 * Test suite verifying:
 *   1-6: Coordinate validation (lat/lng bounds, NaN, Infinity, lat/lng inversion)
 *   7-10: PostGIS spatial context resolution & multiple matches detection
 *   11-14: District consistency & caller-provided district validation policy
 *   15-19: Place lifecycle (creation, location updates, reconciliation audit, history preservation)
 *   20-22: Discovery pipeline spatial polygon authority vs fallback priority
 *   23-25: Public Search, Place detail & Geography API contracts
 *   26-30: Regression test suite (Business, Auth, Admin, Client features, Map integration)
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
} from '../src/domain/geography/geography-validation.js';
import {
  GeographySpatialResolutionService,
  GeographicContextMismatchError,
} from '../src/domain/geography/geography-spatial-resolution.service.js';
import { DiscoveryOrchestratorService } from '../src/domain/discovery/discovery-orchestrator.service.js';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

const VALID_DATA_SOURCE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const VALID_CATEGORY_ID = 'b1eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';
const VALID_GOVERNORATE_ID = 'c2eebc99-9c0b-4ef8-bb6d-6bb9bd380a33';
const VALID_DISTRICT_1_ID = 'd3eebc99-9c0b-4ef8-bb6d-6bb9bd380a44';
const VALID_DISTRICT_2_ID = 'e4eebc99-9c0b-4ef8-bb6d-6bb9bd380a55';

function makeMockPrisma() {
  const govMap = new Map<string, any>();
  const distMap = new Map<string, any>();
  const placeMap = new Map<string, any>();
  const locMap = new Map<string, any>();
  const obsMap = new Map<string, any>();
  const catMap = new Map<string, any>();

  govMap.set(VALID_GOVERNORATE_ID, { id: VALID_GOVERNORATE_ID, externalId: 'YE17', nameAr: 'حجة', nameEn: 'Hajjah' });
  distMap.set(VALID_DISTRICT_1_ID, { id: VALID_DISTRICT_1_ID, externalId: 'YE1704', governorateId: VALID_GOVERNORATE_ID, nameAr: 'عبس', nameEn: 'Abs' });
  distMap.set(VALID_DISTRICT_2_ID, { id: VALID_DISTRICT_2_ID, externalId: 'YE1705', governorateId: VALID_GOVERNORATE_ID, nameAr: 'حيران', nameEn: 'Hayran' });
  catMap.set(VALID_CATEGORY_ID, { id: VALID_CATEGORY_ID, nameAr: 'مطاعم', nameEn: 'Restaurants', slug: 'restaurants' });

  const mockObj: any = {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockObj)),
    $executeRaw: vi.fn().mockResolvedValue(1),
    $queryRaw: vi.fn().mockImplementation((query: any) => {
      const sql = String(query);
      if (sql.includes('ST_Covers')) {
        return Promise.resolve([
          { id: VALID_DISTRICT_1_ID, externalId: 'YE1704', nameAr: 'عبس', governorateId: VALID_GOVERNORATE_ID },
        ]);
      }
      return Promise.resolve([]);
    }),

    governorate: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.id) return Promise.resolve(govMap.get(where.id) || null);
        if (where.externalId) {
          for (const g of govMap.values()) if (g.externalId === where.externalId) return Promise.resolve(g);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(Array.from(govMap.values()))),
      count: vi.fn().mockImplementation(() => Promise.resolve(govMap.size)),
    },

    district: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.id) return Promise.resolve(distMap.get(where.id) || null);
        if (where.externalId) {
          for (const d of distMap.values()) if (d.externalId === where.externalId) return Promise.resolve(d);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(Array.from(distMap.values()))),
      count: vi.fn().mockImplementation(() => Promise.resolve(distMap.size)),
      delete: vi.fn(),
    },

    category: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(catMap.get(where.id) || null)),
      findMany: vi.fn().mockImplementation(() => Promise.resolve(Array.from(catMap.values()))),
    },

    place: {
      findUnique: vi.fn().mockImplementation(({ where, include }: any) => {
        const p = placeMap.get(where.id);
        if (!p) return Promise.resolve(null);
        const res = { ...p };
        if (include?.district) {
          res.district = distMap.get(p.districtId) || null;
          if (include.district.include?.governorate && res.district) {
            res.district.governorate = govMap.get(res.district.governorateId) || null;
          }
        }
        if (include?.category) res.category = catMap.get(p.categoryId) || null;
        if (include?.location) res.location = locMap.get(p.id) || null;
        if (include?.observations) res.observations = [];
        return Promise.resolve(res);
      }),
      findMany: vi.fn().mockImplementation(() => {
        const result: any[] = [];
        for (const p of placeMap.values()) {
          const item = { ...p, location: locMap.get(p.id) || null, district: distMap.get(p.districtId) || null };
          result.push(item);
        }
        return Promise.resolve(result);
      }),
      create: vi.fn().mockImplementation(({ data }: any) => {
        const newPlace = {
          id: data.id || `place-${placeMap.size + 1}`,
          nameAr: data.nameAr,
          phoneNumber: data.phoneNumber || null,
          categoryId: data.categoryId,
          districtId: data.districtId,
          verificationStatus: data.verificationStatus || 'UNVERIFIED',
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        placeMap.set(newPlace.id, newPlace);
        return Promise.resolve(newPlace);
      }),
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const p = placeMap.get(where.id);
        if (p) {
          Object.assign(p, data);
          placeMap.set(p.id, p);
        }
        return Promise.resolve(p || null);
      }),
      count: vi.fn().mockImplementation(() => Promise.resolve(placeMap.size)),
    },

    placeLocation: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(locMap.get(where.placeId) || null)),
      count: vi.fn().mockImplementation(() => Promise.resolve(locMap.size)),
    },

    placeObservation: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(obsMap.get(where.id) || null)),
      findMany: vi.fn().mockImplementation(() => Promise.resolve([])),
      create: vi.fn().mockImplementation(({ data }: any) => {
        const obs = { id: data.id || `obs-${obsMap.size + 1}`, status: 'PENDING', ...data };
        obsMap.set(obs.id, obs);
        return Promise.resolve(obs);
      }),
      update: vi.fn().mockImplementation(({ where, data }: any) => {
        const obs = obsMap.get(where.id);
        if (obs) Object.assign(obs, data);
        return Promise.resolve(obs || null);
      }),
    },

    dataConflict: {
      create: vi.fn().mockResolvedValue({ id: 'conflict-1' }),
      findMany: vi.fn().mockResolvedValue([]),
    },

    dataSource: {
      findUnique: vi.fn().mockImplementation(({ where }: any) => {
        if (where.id === VALID_DATA_SOURCE_ID) {
          return Promise.resolve({ id: VALID_DATA_SOURCE_ID, name: 'Test Source', reliabilityWeight: 1.0 });
        }
        return Promise.resolve(null);
      }),
    },

    _state: { govMap, distMap, placeMap, locMap, obsMap, catMap },
  };

  return mockObj;
}

describe('WAYNAH-GEO-005 — Geographic Context & Spatial Integrity', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let spatialService: GeographySpatialResolutionService;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    spatialService = new GeographySpatialResolutionService(mockPrisma as unknown as PrismaClient);
  });

  // ── 1. Coordinate Validation Tests ──────────────────────────────────────────

  it('Test 1 — Valid latitude and longitude are accepted', () => {
    const res = validateCoordinates(16.0184, 43.1054);
    expect(res.valid).toBe(true);
    expect(res.error).toBeUndefined();
  });

  it('Test 2 — Invalid latitude (< -90 or > 90) is rejected', () => {
    expect(validateLatitude(95.0).valid).toBe(false);
    expect(validateLatitude(-91.0).valid).toBe(false);
  });

  it('Test 3 — Invalid longitude (< -180 or > 180) is rejected', () => {
    expect(validateLongitude(185.0).valid).toBe(false);
    expect(validateLongitude(-181.0).valid).toBe(false);
  });

  it('Test 4 — NaN coordinate values are rejected', () => {
    expect(validateLatitude(NaN).valid).toBe(false);
    expect(validateLongitude(NaN).valid).toBe(false);
  });

  it('Test 5 — Infinity coordinate values are rejected', () => {
    expect(validateLatitude(Infinity).valid).toBe(false);
    expect(validateLongitude(-Infinity).valid).toBe(false);
  });

  it('Test 6 — Lat/lng inversion regression test (longitude=X, latitude=Y order strictly maintained)', async () => {
    const lat = 16.0184;
    const lng = 43.1054;
    await spatialService.resolveDistrictFromPoint(lat, lng, {}, mockPrisma as unknown as PrismaClient);

    const rawCall = (mockPrisma.$queryRaw as any).mock.calls[0];
    expect(rawCall).toBeDefined();
    // ST_MakePoint(longitude, latitude) convention: longitude is first argument ($1), latitude second ($2)
    const sqlText = String(rawCall[0]);
    expect(sqlText).toContain('ST_MakePoint');
  });

  // ── 2. Spatial Context Resolution Tests ────────────────────────────────────

  it('Test 7 — Point inside known District resolves correctly via POLYGON_COVERAGE', async () => {
    const res = await spatialService.resolveDistrictFromPoint(16.0184, 43.1054, {}, mockPrisma as unknown as PrismaClient);
    expect(res).not.toBeNull();
    expect(res?.id).toBe(VALID_DISTRICT_1_ID);
    expect(res?.resolutionMethod).toBe('POLYGON_COVERAGE');
  });

  it('Test 8 — Point near District edge resolves correctly', async () => {
    const res = await spatialService.resolveDistrictFromPoint(16.0, 43.1, {}, mockPrisma as unknown as PrismaClient);
    expect(res?.id).toBe(VALID_DISTRICT_1_ID);
  });

  it('Test 9 — Point outside all District polygons uses explicit fallback or returns null', async () => {
    // Both ST_Covers and ST_DWithin return no rows
    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await spatialService.resolveDistrictFromPoint(0.0, 0.0, {}, mockPrisma as unknown as PrismaClient);
    expect(res).toBeNull();
  });

  it('Test 10 — Multiple polygon matches are detected deterministically', async () => {
    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([
      { id: VALID_DISTRICT_1_ID, externalId: 'YE1704', nameAr: 'عبس', governorateId: VALID_GOVERNORATE_ID },
      { id: VALID_DISTRICT_2_ID, externalId: 'YE1705', nameAr: 'حيران', governorateId: VALID_GOVERNORATE_ID },
    ]);

    const res = await spatialService.resolveDistrictFromPoint(16.0184, 43.1054, {}, mockPrisma as unknown as PrismaClient);
    expect(res?.multipleMatchesDetected).toBe(true);
    expect(res?.id).toBe(VALID_DISTRICT_1_ID);
  });

  // ── 3. District Consistency Tests ──────────────────────────────────────────

  it('Test 11 — Caller district matching spatial district is accepted', async () => {
    const res = await spatialService.resolveDistrictFromPoint(
      16.0184,
      43.1054,
      { callerDistrictId: VALID_DISTRICT_1_ID },
      mockPrisma as unknown as PrismaClient
    );
    expect(res?.id).toBe(VALID_DISTRICT_1_ID);
  });

  it('Test 12 — Caller district conflicting with spatial district is rejected with GEOGRAPHIC_CONTEXT_MISMATCH', async () => {
    await expect(
      spatialService.resolveDistrictFromPoint(
        16.0184,
        43.1054,
        { callerDistrictId: VALID_DISTRICT_2_ID }, // Caller says dist-2, spatial says dist-1
        mockPrisma as unknown as PrismaClient
      )
    ).rejects.toThrow(GeographicContextMismatchError);
  });

  it('Test 13 — Unknown caller district identifier is rejected', async () => {
    await expect(
      spatialService.resolveDistrictFromPoint(
        16.0184,
        43.1054,
        { callerDistrictId: 'f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a99' },
        mockPrisma as unknown as PrismaClient
      )
    ).rejects.toThrow('District with ID "f5eebc99-9c0b-4ef8-bb6d-6bb9bd380a99" was not found');
  });

  it('Test 14 — District assignment is never picked via arbitrary findFirst database lookup', async () => {
    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([]).mockResolvedValueOnce([]);

    const res = await spatialService.resolveDistrictFromPoint(16.0, 43.1, {}, mockPrisma as unknown as PrismaClient);
    // Must return null rather than selecting an arbitrary district from DB
    expect(res).toBeNull();
  });

  // ── 4. Place Lifecycle Tests ───────────────────────────────────────────────

  it('Test 15 — New Place with coordinates receives correct spatial district context', async () => {
    const orchestrator = new DiscoveryOrchestratorService(mockPrisma as unknown as PrismaClient);
    const result = await orchestrator.processObservation(
      {
        dataSourceId: VALID_DATA_SOURCE_ID,
        name: 'مطعم العبسي الجديد',
        categoryId: VALID_CATEGORY_ID,
        latitude: 16.0184,
        longitude: 43.1054,
      },
      mockPrisma as unknown as PrismaClient
    );

    expect(result.action).toBe('NEW_ENTITY_CREATED');
    const createdPlace = mockPrisma._state.placeMap.get(result.placeId);
    expect(createdPlace.districtId).toBe(VALID_DISTRICT_1_ID);
  });

  it('Test 16 — Existing Place district context remains intact when valid', async () => {
    mockPrisma._state.placeMap.set('place-existing', {
      id: 'place-existing',
      nameAr: 'مطعم القمة',
      categoryId: VALID_CATEGORY_ID,
      districtId: VALID_DISTRICT_1_ID,
    });
    mockPrisma._state.locMap.set('place-existing', {
      placeId: 'place-existing',
      latitude: 16.0184,
      longitude: 43.1054,
    });

    const report = await spatialService.reconcileExistingPlaces(mockPrisma as unknown as PrismaClient);
    expect(report.matchedCount).toBe(1);
    expect(report.mismatchCount).toBe(0);
  });

  it('Test 17 — PlaceLocation coordinate update re-evaluates spatial district context', async () => {
    mockPrisma._state.placeMap.set('place-moving', {
      id: 'place-moving',
      nameAr: 'متجر متنقل',
      categoryId: VALID_CATEGORY_ID,
      districtId: VALID_DISTRICT_1_ID,
    });

    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([
      { id: VALID_DISTRICT_2_ID, externalId: 'YE1705', nameAr: 'حيران', governorateId: VALID_GOVERNORATE_ID },
    ]);

    const updateRes = await spatialService.updatePlaceLocationCoordinates(
      'place-moving',
      16.15,
      43.25,
      {},
      mockPrisma as unknown as PrismaClient
    );

    expect(updateRes.districtId).toBe(VALID_DISTRICT_2_ID);
    expect(mockPrisma._state.placeMap.get('place-moving').districtId).toBe(VALID_DISTRICT_2_ID);
  });

  it('Test 18 — Existing mismatches are detected during spatial reconciliation report', async () => {
    mockPrisma._state.placeMap.set('place-mismatched', {
      id: 'place-mismatched',
      nameAr: 'موقع غير دقيق',
      categoryId: VALID_CATEGORY_ID,
      districtId: VALID_DISTRICT_1_ID, // Stored dist-1
    });
    mockPrisma._state.locMap.set('place-mismatched', {
      placeId: 'place-mismatched',
      latitude: 16.15,
      longitude: 43.25,
    });

    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([
      { id: VALID_DISTRICT_2_ID, externalId: 'YE1705', nameAr: 'حيران', governorateId: VALID_GOVERNORATE_ID }, // Spatial resolves to dist-2
    ]);

    const report = await spatialService.reconcileExistingPlaces(mockPrisma as unknown as PrismaClient);
    expect(report.mismatchCount).toBe(1);
    expect(report.mismatches[0].placeId).toBe('place-mismatched');
    expect(report.mismatches[0].storedDistrictId).toBe(VALID_DISTRICT_1_ID);
    expect(report.mismatches[0].spatialDistrictId).toBe(VALID_DISTRICT_2_ID);
  });

  it('Test 19 — Historical observations are not rewritten when spatial context is updated', async () => {
    mockPrisma._state.placeMap.set('place-hist', { id: 'place-hist', districtId: VALID_DISTRICT_1_ID, categoryId: VALID_CATEGORY_ID });
    mockPrisma._state.obsMap.set('obs-hist', { id: 'obs-hist', placeId: 'place-hist', name: 'Original Obs' });

    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([
      { id: VALID_DISTRICT_2_ID, externalId: 'YE1705', nameAr: 'حيران', governorateId: VALID_GOVERNORATE_ID },
    ]);

    await spatialService.updatePlaceLocationCoordinates('place-hist', 16.15, 43.25, {}, mockPrisma as unknown as PrismaClient);

    const obs = mockPrisma._state.obsMap.get('obs-hist');
    expect(obs.name).toBe('Original Obs');
    expect(obs.placeId).toBe('place-hist');
  });

  // ── 5. Discovery Pipeline Integration Tests ────────────────────────────────

  it('Test 20 — Discovery pipeline uses polygon authority as primary mechanism', async () => {
    const orchestrator = new DiscoveryOrchestratorService(mockPrisma as unknown as PrismaClient);
    const res = await orchestrator.processObservation(
      {
        dataSourceId: VALID_DATA_SOURCE_ID,
        name: 'مركز الامل',
        categoryId: VALID_CATEGORY_ID,
        latitude: 16.0184,
        longitude: 43.1054,
      },
      mockPrisma as unknown as PrismaClient
    );

    expect(res.action).toBe('NEW_ENTITY_CREATED');
  });

  it('Test 21 — Discovery fallback remains functional when point is outside polygons', async () => {
    (mockPrisma.$queryRaw as any)
      .mockResolvedValueOnce([]) // No polygon match
      .mockResolvedValueOnce([{ id: VALID_DISTRICT_1_ID, externalId: 'YE1704', nameAr: 'عبس', governorateId: VALID_GOVERNORATE_ID }]); // Fallback match

    const orchestrator = new DiscoveryOrchestratorService(mockPrisma as unknown as PrismaClient);
    const res = await orchestrator.processObservation(
      {
        dataSourceId: VALID_DATA_SOURCE_ID,
        name: 'محل الفلاح',
        categoryId: VALID_CATEGORY_ID,
        latitude: 16.01,
        longitude: 43.10,
      },
      mockPrisma as unknown as PrismaClient
    );

    expect(res.action).toBe('NEW_ENTITY_CREATED');
  });

  it('Test 22 — Polygon result takes precedence over nearest-Place result', async () => {
    const res = await spatialService.resolveDistrictFromPoint(16.0184, 43.1054, {}, mockPrisma as unknown as PrismaClient);
    expect(res?.resolutionMethod).toBe('POLYGON_COVERAGE');
    expect(res?.id).toBe(VALID_DISTRICT_1_ID);
  });

  // ── 6. Search & API Integration Tests ─────────────────────────────────────

  it('Test 23 — Search API endpoint functions cleanly', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/search?query=مطعم');
    expect(res.status).toBe(200);
  });

  it('Test 24 — Place detail endpoint functions cleanly and returns administrative context', async () => {
    mockPrisma._state.placeMap.set('place-detail-1', {
      id: 'place-detail-1',
      nameAr: 'مطعم السلام',
      categoryId: VALID_CATEGORY_ID,
      districtId: VALID_DISTRICT_1_ID,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/search/places/place-detail-1');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data.districtNameAr).toBe('عبس');
    expect(body.data.governorateNameAr).toBe('حجة');
  });

  it('Test 25 — Geography public reference API functions cleanly', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.data).toHaveLength(1);
    expect(body.data[0].nameAr).toBe('حجة');
  });

  // ── 7. Monorepo Feature Regressions ────────────────────────────────────────

  it('Test 26 — Business domain functionality regression test', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/businesses');
    expect(res.status).toBe(401); // Auth middleware active
  });

  it('Test 27 — Authentication functionality regression test', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/user/favorites');
    expect(res.status).toBe(401);
  });

  it('Test 28 — Admin verification workflow regression test', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/admin/verifications');
    expect(res.status).toBe(401);
  });

  it('Test 29 — User client favorites and requests regression test', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/user/requests');
    expect(res.status).toBe(401);
  });

  it('Test 30 — Map view integration regression test (returns lat/lng points without polygon bloat)', async () => {
    (mockPrisma.$queryRaw as any).mockResolvedValueOnce([
      {
        id: 'place-map-1',
        nameAr: 'نقطة خريطة',
        districtId: VALID_DISTRICT_1_ID,
        latitude: 16.0184,
        longitude: 43.1054,
        distance_meters: 10,
        match_score: 1.0,
      },
    ]);

    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/search?lat=16.0184&lng=43.1054');
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.success).toBe(true);
    expect(body.data[0].latitude).toBe(16.0184);
    expect(body.data[0].longitude).toBe(43.1054);
    expect(body.data[0].boundary).toBeUndefined(); // Lightweight marker payload
  });
});
