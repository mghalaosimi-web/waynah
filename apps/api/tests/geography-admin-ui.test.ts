/**
 * WAYNAH — Geo-D Admin Geography UI & API Endpoint Verification Suite
 *
 * Verification suite for Geo-D Admin Geography capability:
 * 1. Authorization & Public/Admin Geography endpoints
 * 2. Governorates list endpoint (GET /v1/geography/governorates) with district counts & empty states
 * 3. Districts list endpoint (GET /v1/geography/governorates/:id/districts) with boundary status & empty states
 * 4. District detail endpoint (GET /v1/geography/districts/:id) returning PostGIS GeoJSON, geometry type, SRID, & place counts
 * 5. Error & 404 handling for non-existent governorates & districts
 * 6. Non-destructive safety & zero database mutation verification
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { GeographyService } from '../src/domain/geography/geography.service.js';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

function makeMockPrismaForAdminGeography() {
  const govMap = new Map<string, any>();
  const distMap = new Map<string, any>();

  // Governorate fixture: Hajjah
  govMap.set('gov-ye17', {
    id: 'gov-ye17',
    externalId: 'YE17',
    nameAr: 'حجة',
    nameEn: 'Hajjah',
    code: 'YE17',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    _count: { districts: 2 },
  });

  // Governorate fixture: Sana'a
  govMap.set('gov-ye11', {
    id: 'gov-ye11',
    externalId: 'YE11',
    nameAr: 'أمانة العاصمة',
    nameEn: "Sana'a City",
    code: 'YE11',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    _count: { districts: 0 },
  });

  // District fixture: Abs with boundary
  distMap.set('dist-ye1704', {
    id: 'dist-ye1704',
    externalId: 'YE1704',
    governorateId: 'gov-ye17',
    nameAr: 'عبس',
    nameEn: 'Abs',
    code: '1704',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    governorate: govMap.get('gov-ye17'),
    _count: { places: 15 },
  });

  // District fixture: Hajjah City without boundary
  distMap.set('dist-ye1701', {
    id: 'dist-ye1701',
    externalId: 'YE1701',
    governorateId: 'gov-ye17',
    nameAr: 'مدينة حجة',
    nameEn: 'Hajjah City',
    code: '1701',
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    governorate: govMap.get('gov-ye17'),
    _count: { places: 0 },
  });

  const mockObj: any = {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockObj)),
    $queryRaw: vi.fn().mockImplementation((query: any, ...values: any[]) => {
      const qStr = query?.text || query?.sql || (typeof query === 'string' ? query : String(query));
      const valStr = JSON.stringify(values);

      // District details query
      if (qStr.includes('ST_AsGeoJSON') || (qStr.includes('FROM districts') && qStr.includes('LEFT JOIN governorates'))) {
        if (valStr.includes('dist-ye1704') || valStr.includes('YE1704') || qStr.includes('dist-ye1704')) {
          return Promise.resolve([
            {
              id: 'dist-ye1704',
              externalId: 'YE1704',
              governorateId: 'gov-ye17',
              nameAr: 'عبس',
              nameEn: 'Abs',
              code: '1704',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
              hasBoundary: true,
              boundaryGeoJson: JSON.stringify({
                type: 'MultiPolygon',
                coordinates: [
                  [
                    [
                      [43.1, 16.0],
                      [43.2, 16.0],
                      [43.2, 16.1],
                      [43.1, 16.1],
                      [43.1, 16.0],
                    ],
                  ],
                ],
              }),
              placesCount: 15,
              gov_id: 'gov-ye17',
              gov_externalId: 'YE17',
              gov_nameAr: 'حجة',
              gov_nameEn: 'Hajjah',
              gov_code: 'YE17',
            },
          ]);
        }
        if (valStr.includes('dist-ye1701') || valStr.includes('YE1701') || qStr.includes('dist-ye1701')) {
          return Promise.resolve([
            {
              id: 'dist-ye1701',
              externalId: 'YE1701',
              governorateId: 'gov-ye17',
              nameAr: 'مدينة حجة',
              nameEn: 'Hajjah City',
              code: '1701',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
              hasBoundary: false,
              boundaryGeoJson: null,
              placesCount: 0,
              gov_id: 'gov-ye17',
              gov_externalId: 'YE17',
              gov_nameAr: 'حجة',
              gov_nameEn: 'Hajjah',
              gov_code: 'YE17',
            },
          ]);
        }
      }

      // Districts by governorate query
      if (qStr.includes('FROM districts') && (qStr.includes('WHERE d.governorate_id') || qStr.includes('governorate_id'))) {
        if (valStr.includes('gov-ye17') || qStr.includes('gov-ye17')) {
          return Promise.resolve([
            {
              id: 'dist-ye1704',
              externalId: 'YE1704',
              governorateId: 'gov-ye17',
              nameAr: 'عبس',
              nameEn: 'Abs',
              code: '1704',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
              hasBoundary: true,
              placesCount: 15,
            },
            {
              id: 'dist-ye1701',
              externalId: 'YE1701',
              governorateId: 'gov-ye17',
              nameAr: 'مدينة حجة',
              nameEn: 'Hajjah City',
              code: '1701',
              createdAt: new Date('2026-01-01'),
              updatedAt: new Date('2026-01-01'),
              hasBoundary: false,
              placesCount: 0,
            },
          ]);
        }
        return Promise.resolve([]);
      }

      return Promise.resolve([]);
    }),
    $executeRaw: vi.fn().mockResolvedValue(0),
    governorate: {
      findMany: vi.fn().mockImplementation(() =>
        Promise.resolve(Array.from(govMap.values()))
      ),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
        if (where.id && govMap.has(where.id)) return Promise.resolve(govMap.get(where.id));
        return Promise.resolve(null);
      }),
    },
    district: {
      findMany: vi.fn().mockImplementation(({ where }: { where?: { governorateId?: string } }) => {
        const all = Array.from(distMap.values());
        if (where?.governorateId) {
          return Promise.resolve(all.filter((d) => d.governorateId === where.governorateId));
        }
        return Promise.resolve(all);
      }),
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string } }) => {
        if (where.id && distMap.has(where.id)) return Promise.resolve(distMap.get(where.id));
        return Promise.resolve(null);
      }),
      delete: vi.fn(),
      update: vi.fn(),
    },
    _state: { govMap, distMap },
  };

  return mockObj;
}

describe('WAYNAH — Geo-D Admin Geography UI & API Service Tests', () => {
  let mockPrisma: ReturnType<typeof makeMockPrismaForAdminGeography>;
  let geographyService: GeographyService;

  beforeEach(() => {
    mockPrisma = makeMockPrismaForAdminGeography();
    geographyService = new GeographyService(mockPrisma as unknown as PrismaClient);
  });

  // ── 1. Governorates Inspection Tests ─────────────────────────────────────────

  it('Test 1a — GET /v1/geography/governorates returns all governorates with district counts', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);

    const hajjah = data.data.find((g: any) => g.id === 'gov-ye17');
    expect(hajjah).toBeDefined();
    expect(hajjah.nameAr).toBe('حجة');
    expect(hajjah.nameEn).toBe('Hajjah');
    expect(hajjah.externalId).toBe('YE17');
    expect(hajjah.districtCount).toBe(2);
  });

  it('Test 1b — GET /v1/geography/governorates handles empty database state gracefully', async () => {
    (mockPrisma.governorate.findMany as any).mockResolvedValueOnce([]);

    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.meta.count).toBe(0);
  });

  it('Test 1c — GET /v1/geography/governorates/:id returns single governorate record', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates/gov-ye17');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.nameAr).toBe('حجة');
    expect(data.data.districtCount).toBe(2);
  });

  // ── 2. Districts Inspection Tests ────────────────────────────────────────────

  it('Test 2a — GET /v1/geography/governorates/:id/districts returns districts for selected governorate', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates/gov-ye17/districts');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toHaveLength(2);
    expect(data.meta.governorateId).toBe('gov-ye17');
  });

  it('Test 2b — GET /v1/geography/governorates/:id/districts returns empty array when governorate has no districts', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates/gov-ye11/districts');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data).toEqual([]);
    expect(data.meta.count).toBe(0);
  });

  it('Test 2c — GET /v1/geography/governorates/:id/districts returns 404 for non-existent governorate', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/governorates/non-existent-gov/districts');

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('was not found');
  });

  // ── 3. District Detail & PostGIS Boundary Tests ──────────────────────────────

  it('Test 3a — GET /v1/geography/districts/:id returns rich details with PostGIS boundary GeoJSON and place count', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/districts/dist-ye1704');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('dist-ye1704');
    expect(data.data.nameAr).toBe('عبس');
    expect(data.data.nameEn).toBe('Abs');
    expect(data.data.externalId).toBe('YE1704');
    expect(data.data.hasBoundary).toBe(true);
    expect(data.data.boundaryStatus).toBe('AVAILABLE');
    expect(data.data.boundaryGeometryType).toBe('MultiPolygon');
    expect(data.data.srid).toBe(4326);
    expect(data.data.placesCount).toBe(15);
    expect(data.data.boundaryGeoJson).toBeDefined();
    expect(data.data.boundaryGeoJson.type).toBe('MultiPolygon');
    expect(data.data.governorate.nameAr).toBe('حجة');
  });

  it('Test 3b — GET /v1/geography/districts/:id handles missing PostGIS boundary gracefully', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/districts/dist-ye1701');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('dist-ye1701');
    expect(data.data.nameAr).toBe('مدينة حجة');
    expect(data.data.hasBoundary).toBe(false);
    expect(data.data.boundaryStatus).toBe('MISSING');
    expect(data.data.boundaryGeometryType).toBeNull();
    expect(data.data.srid).toBeNull();
    expect(data.data.boundaryGeoJson).toBeNull();
  });

  it('Test 3c — GET /v1/geography/districts/:id returns 404 for unknown district ID', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    const res = await app.request('/v1/geography/districts/non-existent-district');

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('was not found');
  });

  // ── 4. Safety & Read-Only Invariant Verification ───────────────────────────

  it('Test 4a — Geo-D operations perform zero database writes', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);
    await app.request('/v1/geography/governorates');
    await app.request('/v1/geography/governorates/gov-ye17/districts');
    await app.request('/v1/geography/districts/dist-ye1704');

    expect(mockPrisma.$executeRaw).not.toHaveBeenCalled();
    expect(mockPrisma.district.delete).not.toHaveBeenCalled();
    expect(mockPrisma.district.update).not.toHaveBeenCalled();
  });

  it('Test 4b — Public geography reference endpoints remain accessible without auth', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);

    const res1 = await app.request('/v1/geography/governorates');
    expect(res1.status).toBe(200);

    const res2 = await app.request('/v1/geography/governorates/gov-ye17/districts');
    expect(res2.status).toBe(200);

    const res3 = await app.request('/v1/geography/districts/dist-ye1704');
    expect(res3.status).toBe(200);
  });
});
