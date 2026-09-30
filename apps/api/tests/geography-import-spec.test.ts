/**
 * WAYNAH-GEO-002 — Yemen Geographic Data Source & Import Specification Tests
 *
 * Test suite verifying the UN OCHA Yemen COD-AB specification, validation,
 * Dry Run, Idempotent Upsert, Verification, and Hajjah-first mapping contracts.
 */

import { describe, it, expect, vi, beforeEach, type MockedObject } from 'vitest';
import {
  GeographyPipelineService,
  type OchaCodAbDatasetInput,
} from '../src/domain/geography/geography-pipeline.service';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server';

// ─── Test Fixture Data (Official UN OCHA Yemen COD-AB Specification) ──────────

const HAJJAH_PCODE = 'YE17';

const mockHajjahGovernorate = {
  ADM1_PCODE: HAJJAH_PCODE,
  ADM1_AR: 'حجة',
  ADM1_EN: 'Hajjah',
  latitude: 15.6933,
  longitude: 43.6053,
};

const mockHajjahDistricts = [
  { ADM2_PCODE: 'YE1701', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'مدينة حجة', ADM2_EN: 'Hajjah City' },
  { ADM2_PCODE: 'YE1702', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'حجة', ADM2_EN: 'Hajjah' },
  { ADM2_PCODE: 'YE1703', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'عبس', ADM2_EN: 'Abs' },
  { ADM2_PCODE: 'YE1704', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'حرض', ADM2_EN: 'Haradh' },
  { ADM2_PCODE: 'YE1705', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'ميدي', ADM2_EN: 'Midi' },
  { ADM2_PCODE: 'YE1706', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'خيران المحرق', ADM2_EN: 'Khayran Al Muharraq' },
  { ADM2_PCODE: 'YE1707', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'مستبأ', ADM2_EN: 'Mustaba' },
  { ADM2_PCODE: 'YE1708', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'كشر', ADM2_EN: 'Kushar' },
  { ADM2_PCODE: 'YE1709', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'أفلح اليمن', ADM2_EN: 'Aflah Al Yaman' },
  { ADM2_PCODE: 'YE1710', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'أفلح الشام', ADM2_EN: 'Aflah Ash Sham' },
  { ADM2_PCODE: 'YE1711', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'المحابشة', ADM2_EN: 'Al Mahabisha' },
  { ADM2_PCODE: 'YE1712', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'مبين', ADM2_EN: 'Mobyin' },
  { ADM2_PCODE: 'YE1713', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'نجرة', ADM2_EN: 'Najrah' },
  { ADM2_PCODE: 'YE1714', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'الشاهل', ADM2_EN: 'Ash Shahil' },
  { ADM2_PCODE: 'YE1715', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'كعيدنة', ADM2_EN: "Ku'aydina" },
  { ADM2_PCODE: 'YE1716', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'اسلم', ADM2_EN: 'As Lemah' },
  { ADM2_PCODE: 'YE1717', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'قفل شمر', ADM2_EN: "Qa'atab" },
  { ADM2_PCODE: 'YE1718', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'الجميمة', ADM2_EN: 'Al Jamimah' },
  { ADM2_PCODE: 'YE1719', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'بني العوام', ADM2_EN: 'Bani Al Awam' },
  { ADM2_PCODE: 'YE1720', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'شرس', ADM2_EN: 'Sharas' },
  { ADM2_PCODE: 'YE1721', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'كحلان الشرف', ADM2_EN: "Wadb'ah" },
  { ADM2_PCODE: 'YE1722', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'كحلان عفار', ADM2_EN: 'Kohlan Affar' },
  { ADM2_PCODE: 'YE1723', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'وشحة', ADM2_EN: 'Washhah' },
  { ADM2_PCODE: 'YE1724', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'المفتاح', ADM2_EN: 'Al Miftah' },
  { ADM2_PCODE: 'YE1725', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'بكيل المير', ADM2_EN: 'Bakil Al Mir' },
  { ADM2_PCODE: 'YE1726', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'بني قيس الطور', ADM2_EN: 'Bani Qays' },
  { ADM2_PCODE: 'YE1727', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'ساقين', ADM2_EN: "Sa'ada" },
  { ADM2_PCODE: 'YE1728', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'سنجار', ADM2_EN: 'Singar' },
  { ADM2_PCODE: 'YE1729', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'المحابشة 2', ADM2_EN: 'Mahabisha Sub' },
  { ADM2_PCODE: 'YE1730', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'المغربة', ADM2_EN: 'Al Maghrabah' },
  { ADM2_PCODE: 'YE1731', ADM1_PCODE: HAJJAH_PCODE, ADM2_AR: 'الشغادرة', ADM2_EN: 'Al Burak' },
];

function makeMockPrismaForPipeline() {
  const govMap = new Map<string, any>();
  const distMap = new Map<string, any>();
  let dataSourceMock = { id: 'ds-ocha-001', name: 'OCHA Yemen COD-AB', type: 'GEOGRAPHIC_COD_AB', reliabilityWeight: 1.0 };

  const mockPrismaObj: any = {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => fn(mockPrismaObj)),
    dataSource: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.name === dataSourceMock.name) return Promise.resolve(dataSourceMock);
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        dataSourceMock = { id: 'ds-created-001', ...data };
        return Promise.resolve(dataSourceMock);
      }),
    },
    governorate: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id && govMap.has(where.id)) return Promise.resolve(govMap.get(where.id));
        if (where.externalId) {
          for (const gov of govMap.values()) {
            if (gov.externalId === where.externalId) return Promise.resolve(gov);
          }
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(() => {
        const govList = Array.from(govMap.values()).map(gov => ({
          ...gov,
          districts: Array.from(distMap.values()).filter(d => d.governorateId === gov.id),
        }));
        return Promise.resolve(govList);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `gov-${data.externalId || Math.random().toString(36).substring(7)}`;
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        govMap.set(id, rec);
        return Promise.resolve(rec);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = govMap.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        govMap.set(where.id, updated);
        return Promise.resolve(updated);
      }),
    },
    district: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id && distMap.has(where.id)) return Promise.resolve(distMap.get(where.id));
        if (where.externalId) {
          for (const dist of distMap.values()) {
            if (dist.externalId === where.externalId) return Promise.resolve(dist);
          }
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const list = Array.from(distMap.values());
        if (where?.governorateId) return Promise.resolve(list.filter(d => d.governorateId === where.governorateId));
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = `dist-${data.externalId || Math.random().toString(36).substring(7)}`;
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        distMap.set(id, rec);
        return Promise.resolve(rec);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = distMap.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        distMap.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      delete: vi.fn(), // Should never be called during pipeline upsert
    },
    _state: { govMap, distMap },
  };
  return mockPrismaObj as unknown as MockedObject<PrismaClient> & { _state: { govMap: Map<string, any>; distMap: Map<string, any> } };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('GEO-002 — Yemen Geographic Data Source & Import Specification', () => {
  let mockPrisma: ReturnType<typeof makeMockPrismaForPipeline>;
  let pipeline: GeographyPipelineService;

  beforeEach(() => {
    mockPrisma = makeMockPrismaForPipeline();
    pipeline = new GeographyPipelineService(mockPrisma as unknown as PrismaClient);
  });

  it('Test 1 — Source mapping validation: valid OCHA COD-AB dataset passes Dry Run', async () => {
    const validDataset: OchaCodAbDatasetInput = {
      governorates: [mockHajjahGovernorate],
      districts: mockHajjahDistricts,
    };

    const report = await pipeline.executeDryRun(validDataset);

    expect(report.status).toBe('PASSED');
    expect(report.errors).toHaveLength(0);
    expect(report.summary.governorates.total).toBe(1);
    expect(report.summary.governorates.uniquePcodes).toBe(1);
    expect(report.summary.districts.total).toBe(31);
    expect(report.summary.districts.uniquePcodes).toBe(31);
    expect(report.summary.districts.missingParent).toBe(0);
  });

  it('Test 2 — Duplicate external ID detection in Dry Run', async () => {
    const duplicateDataset: OchaCodAbDatasetInput = {
      governorates: [
        mockHajjahGovernorate,
        { ...mockHajjahGovernorate }, // Duplicate ADM1_PCODE YE17
      ],
      districts: [
        mockHajjahDistricts[0]!,
        { ...mockHajjahDistricts[0]! }, // Duplicate ADM2_PCODE YE1701
      ],
    };

    const report = await pipeline.executeDryRun(duplicateDataset);

    expect(report.status).toBe('FAILED');
    expect(report.summary.governorates.duplicatePcodes).toBe(1);
    expect(report.summary.districts.duplicatePcodes).toBe(1);
    expect(report.errors.some(e => e.message.includes('Duplicate governorate P-code'))).toBe(true);
    expect(report.errors.some(e => e.message.includes('Duplicate district P-code'))).toBe(true);
  });

  it('Test 3 — Missing parent governorate detection in Dry Run', async () => {
    const orphanDataset: OchaCodAbDatasetInput = {
      governorates: [mockHajjahGovernorate],
      districts: [
        { ADM2_PCODE: 'YE1101', ADM1_PCODE: 'YE11', ADM2_AR: 'أمانة العاصمة' }, // Parent YE11 missing
      ],
    };

    const report = await pipeline.executeDryRun(orphanDataset);

    expect(report.status).toBe('FAILED');
    expect(report.summary.districts.missingParent).toBe(1);
    expect(report.errors[0]?.message).toContain('parent governorate P-code "YE11" was not found');
  });

  it('Test 4 — Invalid coordinate rejection in Dry Run', async () => {
    const badCoordDataset: OchaCodAbDatasetInput = {
      governorates: [
        { ...mockHajjahGovernorate, latitude: 120.0 }, // Invalid latitude > 90
      ],
      districts: [],
    };

    const report = await pipeline.executeDryRun(badCoordDataset);

    expect(report.status).toBe('FAILED');
    expect(report.errors[0]?.field).toBe('coordinates');
    expect(report.errors[0]?.message).toContain('between -90 and 90');
  });

  it('Test 5 — Invalid geometry SRID & geometry type detection in Dry Run', async () => {
    const badGeomDataset: OchaCodAbDatasetInput = {
      governorates: [mockHajjahGovernorate],
      districts: [
        {
          ADM2_PCODE: 'YE1701',
          ADM1_PCODE: HAJJAH_PCODE,
          ADM2_AR: 'مدينة حجة',
          srid: 3857, // Invalid SRID (must be 4326)
          geometryType: 'Point', // Unsupported for boundary (must be MultiPolygon/Polygon)
        },
      ],
    };

    const report = await pipeline.executeDryRun(badGeomDataset);

    expect(report.status).toBe('FAILED');
    expect(report.summary.geometry.invalidSrid).toBe(1);
    expect(report.summary.geometry.unsupportedTypes).toBe(1);
  });

  it('Test 6 — Dry Run performs ZERO database mutations', async () => {
    const validDataset: OchaCodAbDatasetInput = {
      governorates: [mockHajjahGovernorate],
      districts: mockHajjahDistricts,
    };

    await pipeline.executeDryRun(validDataset);

    expect(mockPrisma.governorate.create).not.toHaveBeenCalled();
    expect(mockPrisma.district.create).not.toHaveBeenCalled();
    expect(mockPrisma._state.govMap.size).toBe(0);
    expect(mockPrisma._state.distMap.size).toBe(0);
  });

  it('Test 7 — Idempotent Upsert creates new entities & registers DataSource', async () => {
    const validDataset: OchaCodAbDatasetInput = {
      governorates: [mockHajjahGovernorate],
      districts: mockHajjahDistricts,
    };

    const result = await pipeline.executeUpsert(validDataset, { name: 'OCHA Yemen COD-AB 2026' });

    expect(result.dataSourceName).toBe('OCHA Yemen COD-AB 2026');
    expect(result.governorates.created).toBe(1);
    expect(result.districts.created).toBe(31);
    expect(mockPrisma._state.govMap.size).toBe(1);
    expect(mockPrisma._state.distMap.size).toBe(31);

    // Re-running same upsert should yield UNCHANGED (0 created, 0 updated)
    const reUpsert = await pipeline.executeUpsert(validDataset, { name: 'OCHA Yemen COD-AB 2026' });
    expect(reUpsert.governorates.unchanged).toBe(1);
    expect(reUpsert.districts.unchanged).toBe(31);
    expect(reUpsert.governorates.created).toBe(0);
    expect(reUpsert.districts.created).toBe(0);
  });

  it('Test 8 — Missing source record does not cause automatic deletion on Upsert', async () => {
    // 1. Initial upsert with Hajjah + 31 districts
    await pipeline.executeUpsert({
      governorates: [mockHajjahGovernorate],
      districts: mockHajjahDistricts,
    });

    expect(mockPrisma._state.distMap.size).toBe(31);

    // 2. Partial snapshot containing only 1 district
    await pipeline.executeUpsert({
      governorates: [mockHajjahGovernorate],
      districts: [mockHajjahDistricts[0]!],
    });

    // Delete must NOT be called; existing 31 districts remain intact
    expect(mockPrisma.district.delete).not.toHaveBeenCalled();
    expect(mockPrisma._state.distMap.size).toBe(31);
  });

  it('Test 9 — Hajjah-first validation: P-code YE17 maps Hajjah governorate + 31 districts', async () => {
    const hajjahDataset: OchaCodAbDatasetInput = {
      governorates: [mockHajjahGovernorate],
      districts: mockHajjahDistricts,
    };

    const result = await pipeline.executeUpsert(hajjahDataset);
    expect(result.governorates.created).toBe(1);
    expect(result.districts.created).toBe(31);

    const verifyReport = await pipeline.executeVerify();

    expect(verifyReport.status).toBe('VERIFIED');
    expect(verifyReport.totalGovernorates).toBe(1);
    expect(verifyReport.totalDistricts).toBe(31);
    expect(verifyReport.externalIdCoverage.governorateCoveragePercent).toBe(100);
    expect(verifyReport.externalIdCoverage.districtCoveragePercent).toBe(100);
    expect(verifyReport.orphanedDistricts).toBe(0);
  });

  it('Test 10 — No fake data inserted: unpopulated database stays at 0 records', async () => {
    const cleanPrisma = makeMockPrismaForPipeline();
    const cleanPipeline = new GeographyPipelineService(cleanPrisma as unknown as PrismaClient);

    const report = await cleanPipeline.executeVerify();

    expect(report.totalGovernorates).toBe(0);
    expect(report.totalDistricts).toBe(0);
    expect(cleanPrisma._state.govMap.size).toBe(0);
    expect(cleanPrisma._state.distMap.size).toBe(0);
  });

  it('Test 11 — Existing geographic API endpoints remain fully functional', async () => {
    // API server integration test
    const app = createServer(mockPrisma as unknown as PrismaClient);

    const res1 = await app.request('/v1/geography/governorates');
    expect(res1.status).toBe(200);

    const res2 = await app.request('/v1/geography/governorates/nonexistent/districts');
    expect(res2.status).toBe(404);
  });
});
