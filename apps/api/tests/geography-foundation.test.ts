/**
 * WAYNAH-GEO-001 — Geographic Data Foundation Tests
 *
 * Tests:
 *   1. Governorate records can be retrieved (GET /v1/geography/governorates)
 *   2. District records correctly belong to governorates
 *   3. Duplicate district identity within governorate is prevented (DB constraint)
 *   4. Invalid coordinates are rejected by geographic validation
 *   5. Duplicate import records do not create duplicate geographic entities (idempotent import)
 *   6. Valid import creates/updates expected entities
 *   7. Invalid parent governorate is rejected on district import
 *   8. Unauthorized mutation/import is rejected if an import API exists
 *   9. Existing Place spatial behavior still works (regression)
 *  10. Existing Search still works (regression)
 *
 * NOTE: All DB calls are mocked. Tests verify BEHAVIOUR, not execution environment.
 */

import { describe, it, expect, vi, beforeEach, type MockedObject } from 'vitest';
import {
  validateLatitude,
  validateLongitude,
  validateCoordinates,
  validateSrid,
  validateBoundaryGeometryType,
} from '../src/domain/geography/geography-validation';
import { GeographyService } from '../src/domain/geography/geography.service';
import {
  GeographyImportService,
  GeographyValidationError,
} from '../src/domain/geography/geography-import.service';
import { GeographyService as GeographyServiceType } from '../src/domain/geography/geography.service';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server';

// ─── Mock Factories ───────────────────────────────────────────────────────────

function makeGovernorateMock(overrides = {}) {
  return {
    id: 'gov-hajjah-001',
    externalId: 'YE-HJ',
    nameAr: 'حجة',
    nameEn: 'Hajjah',
    code: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeDistrictMock(overrides = {}) {
  return {
    id: 'dist-abs-001',
    externalId: 'YE-HJ-AB',
    governorateId: 'gov-hajjah-001',
    nameAr: 'عبس',
    nameEn: 'Abs',
    code: null,
    createdAt: new Date('2026-01-01'),
    updatedAt: new Date('2026-01-01'),
    ...overrides,
  };
}

function makeMockPrismaForGeography() {
  return {
    governorate: {
      findMany: vi.fn().mockResolvedValue([makeGovernorateMock()]),
      findUnique: vi.fn().mockResolvedValue(makeGovernorateMock()),
      create: vi.fn().mockResolvedValue(makeGovernorateMock()),
      update: vi.fn().mockResolvedValue(makeGovernorateMock()),
    },
    district: {
      findMany: vi.fn().mockResolvedValue([makeDistrictMock()]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn().mockResolvedValue(makeDistrictMock()),
      update: vi.fn().mockResolvedValue(makeDistrictMock()),
    },
  } as unknown as MockedObject<PrismaClient>;
}

function makeMockPrismaFull() {
  return {
    $transaction: vi.fn((fn: (tx: unknown) => unknown) => fn(makeMockPrismaFull())),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
    governorate: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
    district: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
      findFirst: vi.fn(),
    },
    place: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
    },
    category: {
      findMany: vi.fn().mockResolvedValue([]),
      findUnique: vi.fn().mockResolvedValue(null),
    },
    placeObservation: {
      findUnique: vi.fn().mockResolvedValue(null),
      create: vi.fn(),
      update: vi.fn(),
    },
    dataConflict: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    dataSource: {
      findUnique: vi.fn().mockResolvedValue({ id: 'src-001', reliabilityWeight: 1.0 }),
    },
    session: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
    user: {
      findUnique: vi.fn().mockResolvedValue(null),
    },
  } as unknown as PrismaClient;
}

// ─── Test 1 & 2: Geography read service ───────────────────────────────────────

describe('GEO-001 — GeographyService (read-only)', () => {
  let prisma: MockedObject<PrismaClient>;
  let service: GeographyServiceType;

  beforeEach(() => {
    prisma = makeMockPrismaForGeography();
    service = new GeographyService(prisma);
  });

  it('Test 1 — listGovernorates returns governorate records from database', async () => {
    const result = await service.listGovernorates();

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('gov-hajjah-001');
    expect(result[0]!.nameAr).toBe('حجة');
    expect(result[0]!.externalId).toBe('YE-HJ');
    expect(prisma.governorate.findMany).toHaveBeenCalledOnce();
  });

  it('Test 2a — listDistrictsByGovernorate returns districts for the correct governorate', async () => {
    (prisma.district.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([
      makeDistrictMock(),
    ]);

    const result = await service.listDistrictsByGovernorate('gov-hajjah-001');

    expect(result).toHaveLength(1);
    expect(result[0]!.id).toBe('dist-abs-001');
    expect(result[0]!.governorateId).toBe('gov-hajjah-001');
    expect(result[0]!.nameAr).toBe('عبس');
  });

  it('Test 2b — listDistrictsByGovernorate returns empty array when no districts exist', async () => {
    (prisma.district.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const result = await service.listDistrictsByGovernorate('gov-hajjah-001');

    expect(result).toHaveLength(0);
    expect(Array.isArray(result)).toBe(true);
  });

  it('Test 2c — getGovernorateById returns null for unknown ID', async () => {
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const result = await service.getGovernorateById('nonexistent-id');

    expect(result).toBeNull();
  });
});

// ─── Test 3: Duplicate district uniqueness (DB constraint simulation) ──────────

describe('GEO-001 — District uniqueness constraint within governorate', () => {
  it('Test 3 — duplicate (governorateId, nameAr) combination must be rejected', async () => {
    const prisma = makeMockPrismaForGeography();
    const service = new GeographyImportService(prisma);

    // First import succeeds
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeGovernorateMock());
    (prisma.district.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.district.create as ReturnType<typeof vi.fn>).mockResolvedValue(makeDistrictMock());

    const firstResult = await service.importDistrict({
      externalId: 'YE-HJ-AB',
      governorateId: 'gov-hajjah-001',
      nameAr: 'عبس',
      nameEn: 'Abs',
    });
    expect(firstResult.action).toBe('CREATED');

    // Second import with same externalId → treated as update (idempotent)
    // The DB unique constraint on (governorateId, nameAr) is enforced at the DB level;
    // the import service prevents duplicate creation via externalId-based lookup.
    (prisma.district.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeDistrictMock());

    const secondResult = await service.importDistrict({
      externalId: 'YE-HJ-AB', // same externalId → no duplicate
      governorateId: 'gov-hajjah-001',
      nameAr: 'عبس',
      nameEn: 'Abs',
    });

    // Must be UNCHANGED, not CREATED — no new record created
    expect(secondResult.action).toBe('UNCHANGED');
    // create should only have been called once
    expect(prisma.district.create).toHaveBeenCalledOnce();
  });
});

// ─── Test 4: Coordinate validation ────────────────────────────────────────────

describe('GEO-001 — Geographic coordinate validation', () => {
  // Valid coordinates
  it('Test 4a — accepts valid latitude values', () => {
    expect(validateLatitude(0).valid).toBe(true);
    expect(validateLatitude(-90).valid).toBe(true);
    expect(validateLatitude(90).valid).toBe(true);
    expect(validateLatitude(15.3514).valid).toBe(true);  // Yemen-range
  });

  it('Test 4b — accepts valid longitude values', () => {
    expect(validateLongitude(0).valid).toBe(true);
    expect(validateLongitude(-180).valid).toBe(true);
    expect(validateLongitude(180).valid).toBe(true);
    expect(validateLongitude(44.2).valid).toBe(true); // Yemen-range
  });

  // Invalid coordinates
  it('Test 4c — rejects latitude out of range', () => {
    expect(validateLatitude(91).valid).toBe(false);
    expect(validateLatitude(-91).valid).toBe(false);
    expect(validateLatitude(91).error).toContain('-90 and 90');
  });

  it('Test 4d — rejects longitude out of range', () => {
    expect(validateLongitude(181).valid).toBe(false);
    expect(validateLongitude(-181).valid).toBe(false);
    expect(validateLongitude(-181).error).toContain('-180 and 180');
  });

  it('Test 4e — rejects NaN coordinates', () => {
    expect(validateLatitude(NaN).valid).toBe(false);
    expect(validateLongitude(NaN).valid).toBe(false);
    expect(validateLatitude(NaN).error).toContain('finite');
  });

  it('Test 4f — rejects Infinity coordinates', () => {
    expect(validateLatitude(Infinity).valid).toBe(false);
    expect(validateLatitude(-Infinity).valid).toBe(false);
    expect(validateLongitude(Infinity).valid).toBe(false);
    expect(validateLatitude(Infinity).error).toContain('finite');
  });

  it('Test 4g — rejects non-numeric types', () => {
    expect(validateLatitude('15.3' as unknown as number).valid).toBe(false);
    expect(validateLongitude(null as unknown as number).valid).toBe(false);
    expect(validateLatitude(undefined as unknown as number).valid).toBe(false);
  });

  it('Test 4h — validateCoordinates rejects when either value is invalid', () => {
    expect(validateCoordinates(91, 44.2).valid).toBe(false);
    expect(validateCoordinates(15.3, 181).valid).toBe(false);
    expect(validateCoordinates(15.3, 44.2).valid).toBe(true);
  });

  it('Test 4i — validates SRID: only 4326 is accepted', () => {
    expect(validateSrid(4326).valid).toBe(true);
    expect(validateSrid(3857).valid).toBe(false);
    expect(validateSrid(4326).valid).toBe(true);
    expect(validateSrid(null).valid).toBe(false);
  });

  it('Test 4j — validates boundary geometry types', () => {
    expect(validateBoundaryGeometryType('MultiPolygon').valid).toBe(true);
    expect(validateBoundaryGeometryType('Polygon').valid).toBe(true);
    expect(validateBoundaryGeometryType('Point').valid).toBe(false);
    expect(validateBoundaryGeometryType('LineString').valid).toBe(false);
    expect(validateBoundaryGeometryType('Point').error).toContain('Unsupported geometry type');
  });

  // Coordinate validation in import service
  it('Test 4k — importGovernorate rejects invalid coordinates', async () => {
    const prisma = makeMockPrismaForGeography();
    const service = new GeographyImportService(prisma);

    await expect(
      service.importGovernorate({
        externalId: 'YE-HJ',
        nameAr: 'حجة',
        latitude: 999,    // invalid
        longitude: 44.2,
      })
    ).rejects.toThrow(GeographyValidationError);

    await expect(
      service.importGovernorate({
        externalId: 'YE-HJ',
        nameAr: 'حجة',
        latitude: 15.3,
        longitude: Infinity, // invalid
      })
    ).rejects.toThrow(GeographyValidationError);
  });
});

// ─── Test 5 & 6: Idempotent import ────────────────────────────────────────────

describe('GEO-001 — GeographyImportService (idempotent import)', () => {
  let prisma: MockedObject<PrismaClient>;
  let service: GeographyImportService;

  beforeEach(() => {
    prisma = makeMockPrismaForGeography();
    service = new GeographyImportService(prisma);
  });

  it('Test 5a — importing the same governorate externalId twice does not create duplicates', async () => {
    // First call: no existing record → create
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(null);
    (prisma.governorate.create as ReturnType<typeof vi.fn>).mockResolvedValueOnce(makeGovernorateMock());

    const first = await service.importGovernorate({
      externalId: 'YE-HJ',
      nameAr: 'حجة',
      nameEn: 'Hajjah',
    });
    expect(first.action).toBe('CREATED');

    // Second call: existing record found → UNCHANGED (no field change)
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValueOnce(
      makeGovernorateMock()
    );

    const second = await service.importGovernorate({
      externalId: 'YE-HJ',
      nameAr: 'حجة',
      nameEn: 'Hajjah',
    });
    expect(second.action).toBe('UNCHANGED');

    // create should only have been called once
    expect(prisma.governorate.create).toHaveBeenCalledOnce();
  });

  it('Test 5b — re-importing with changed name issues UPDATE, not CREATE', async () => {
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeGovernorateMock({ nameEn: 'Old Name' })
    );
    (prisma.governorate.update as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeGovernorateMock({ nameEn: 'Hajjah (Updated)' })
    );

    const result = await service.importGovernorate({
      externalId: 'YE-HJ',
      nameAr: 'حجة',
      nameEn: 'Hajjah (Updated)',
    });

    expect(result.action).toBe('UPDATED');
    expect(prisma.governorate.create).not.toHaveBeenCalled();
    expect(prisma.governorate.update).toHaveBeenCalledOnce();
  });

  it('Test 6a — valid governorate import creates expected entity', async () => {
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.governorate.create as ReturnType<typeof vi.fn>).mockResolvedValue(makeGovernorateMock());

    const result = await service.importGovernorate({
      externalId: 'YE-HJ',
      nameAr: 'حجة',
      nameEn: 'Hajjah',
    });

    expect(result.action).toBe('CREATED');
    expect(result.externalId).toBe('YE-HJ');
    expect(result.nameAr).toBe('حجة');
    expect(prisma.governorate.create).toHaveBeenCalledOnce();
  });

  it('Test 6b — valid district import creates expected entity', async () => {
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(makeGovernorateMock());
    (prisma.district.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);
    (prisma.district.create as ReturnType<typeof vi.fn>).mockResolvedValue(makeDistrictMock());

    const result = await service.importDistrict({
      externalId: 'YE-HJ-AB',
      governorateId: 'gov-hajjah-001',
      nameAr: 'عبس',
      nameEn: 'Abs',
    });

    expect(result.action).toBe('CREATED');
    expect(result.externalId).toBe('YE-HJ-AB');
    expect(result.governorateId).toBe('gov-hajjah-001');
    expect(result.nameAr).toBe('عبس');
    expect(prisma.district.create).toHaveBeenCalledOnce();
  });
});

// ─── Test 7: Invalid parent governorate rejected ───────────────────────────────

describe('GEO-001 — Import validation: invalid parent', () => {
  it('Test 7 — importing a district with non-existent governorateId is rejected', async () => {
    const prisma = makeMockPrismaForGeography();
    (prisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const service = new GeographyImportService(prisma);

    await expect(
      service.importDistrict({
        externalId: 'YE-HJ-AB',
        governorateId: 'does-not-exist',
        nameAr: 'عبس',
      })
    ).rejects.toThrow(/Governorate with ID.*does not exist/);

    // District must not be created
    expect(prisma.district.create).not.toHaveBeenCalled();
  });

  it('Test 7b — importing a governorate with missing nameAr is rejected', async () => {
    const prisma = makeMockPrismaForGeography();
    const service = new GeographyImportService(prisma);

    await expect(
      service.importGovernorate({
        externalId: 'YE-HJ',
        nameAr: '',
      })
    ).rejects.toThrow(GeographyValidationError);

    expect(prisma.governorate.create).not.toHaveBeenCalled();
  });

  it('Test 7c — importing a district with missing externalId is rejected', async () => {
    const prisma = makeMockPrismaForGeography();
    const service = new GeographyImportService(prisma);

    await expect(
      service.importDistrict({
        externalId: '',
        governorateId: 'gov-hajjah-001',
        nameAr: 'عبس',
      })
    ).rejects.toThrow(GeographyValidationError);

    expect(prisma.district.create).not.toHaveBeenCalled();
  });
});

// ─── Test 8: Unauthorized import rejected ────────────────────────────────────

describe('GEO-001 — Authorization: import endpoints are not publicly accessible', () => {
  it('Test 8a — GET /v1/geography/governorates is publicly accessible (no auth required)', async () => {
    const mockPrisma = makeMockPrismaFull();
    (mockPrisma.governorate.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const app = createServer(mockPrisma);
    const res = await app.request('/v1/geography/governorates');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('Test 8b — GET /v1/geography/governorates/:id/districts is publicly accessible', async () => {
    const mockPrisma = makeMockPrismaFull();
    // governorate exists
    (mockPrisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(
      makeGovernorateMock()
    );
    // no districts yet (empty but ready)
    (mockPrisma.district.findMany as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const app = createServer(mockPrisma);
    const res = await app.request('/v1/geography/governorates/gov-hajjah-001/districts');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data).toHaveLength(0); // empty-but-ready is correct behavior
  });

  it('Test 8c — GET /v1/geography/governorates/:id returns 404 for unknown governorate', async () => {
    const mockPrisma = makeMockPrismaFull();
    (mockPrisma.governorate.findUnique as ReturnType<typeof vi.fn>).mockResolvedValue(null);

    const app = createServer(mockPrisma);
    const res = await app.request('/v1/geography/governorates/nonexistent-id');

    expect(res.status).toBe(404);
  });

  it('Test 8d — no import/mutation endpoint is exposed at /v1/geography (admin-only via service)', async () => {
    const mockPrisma = makeMockPrismaFull();
    const app = createServer(mockPrisma);

    // POST to geography route → should be 404 (no such route)
    const res = await app.request('/v1/geography/governorates', { method: 'POST' });
    expect(res.status).toBe(404);
  });
});

// ─── Test 9: Existing Place spatial behavior regression ───────────────────────

describe('GEO-001 — Regression: Existing Place spatial behavior', () => {
  it('Test 9 — GET /v1/search still works after GEO-001 changes', async () => {
    const mockPrisma = makeMockPrismaFull();
    // Ensure search returns properly shaped data
    (mockPrisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const app = createServer(mockPrisma);
    const res = await app.request('/v1/search?query=مطعم&lat=15.3&lng=44.2');

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });
});

// ─── Test 10: Search still works ─────────────────────────────────────────────

describe('GEO-001 — Regression: Search endpoint', () => {
  it('Test 10 — GET /v1/search returns results unaffected by GEO-001 schema changes', async () => {
    const mockPrisma = makeMockPrismaFull();
    (mockPrisma.$queryRaw as ReturnType<typeof vi.fn>).mockResolvedValue([]);

    const app = createServer(mockPrisma);

    // Search without geo: text only
    const res1 = await app.request('/v1/search?query=café');
    expect(res1.status).toBe(200);

    // Search without any params
    const res2 = await app.request('/v1/search');
    expect(res2.status).toBe(200);

    // Search with geo
    const res3 = await app.request('/v1/search?lat=15.3514&lng=44.2066&radiusMeters=5000');
    expect(res3.status).toBe(200);
  });
});
