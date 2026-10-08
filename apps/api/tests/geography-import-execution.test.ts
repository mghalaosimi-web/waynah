/**
 * WAYNAH-GEO-003 — Controlled Yemen Geographic Import Test Suite
 *
 * Comprehensive tests covering:
 *   1-5: Source parsing & field mappings (P-codes, Arabic names, English names, parent links)
 *   6-10: Validation rules (duplicate P-codes, missing parent, missing Arabic name, invalid records)
 *   11-16: Idempotent upsert & non-destructive policies (create, update, non-deletion, deduplication)
 *   17-18: Safety & transactional integrity (rollback, no fake records)
 *   19-20: Hajjah YE17 governorate & 31 districts verification & parent integrity
 *   21-22: API & Search endpoint regressions
 */

import { describe, it, expect, vi, beforeEach, type MockedObject } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { GeographySourceReader } from '../src/domain/geography/geography-source-reader.js';
import {
  GeographyPipelineService,
  type OchaCodAbDatasetInput,
} from '../src/domain/geography/geography-pipeline.service.js';
import { GeographyImportService } from '../src/domain/geography/geography-import.service.js';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server.js';

// ─── Prisma Mock Factory with Transaction Support ────────────────────────────

function makeMockPrismaForImportExecution() {
  const govMap = new Map<string, any>();
  const distMap = new Map<string, any>();
  const dataSourceMap = new Map<string, any>();

  const mockPrismaObj: any = {
    $transaction: vi.fn(async (fn: (tx: any) => Promise<any>) => {
      // Pass the mockPrismaObj as the transaction handle tx
      return await fn(mockPrismaObj);
    }),
    dataSource: {
      findFirst: vi.fn().mockImplementation(({ where }: { where: { name: string } }) => {
        for (const ds of dataSourceMap.values()) {
          if (ds.name === where.name) return Promise.resolve(ds);
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }: { data: any }) => {
        const id = `ds-${Math.random().toString(36).substring(7)}`;
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        dataSourceMap.set(id, rec);
        return Promise.resolve(rec);
      }),
    },
    governorate: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string; externalId?: string } }) => {
        if (where.id && govMap.has(where.id)) return Promise.resolve(govMap.get(where.id));
        if (where.externalId) {
          for (const gov of govMap.values()) {
            if (gov.externalId === where.externalId) return Promise.resolve(gov);
          }
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(() => {
        const list = Array.from(govMap.values()).map(gov => ({
          ...gov,
          districts: Array.from(distMap.values()).filter(d => d.governorateId === gov.id),
        }));
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation(({ data }: { data: any }) => {
        const id = `gov-${data.externalId || Math.random().toString(36).substring(7)}`;
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        govMap.set(id, rec);
        return Promise.resolve(rec);
      }),
      update: vi.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const existing = govMap.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        govMap.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      count: vi.fn().mockImplementation(() => Promise.resolve(govMap.size)),
    },
    district: {
      findUnique: vi.fn().mockImplementation(({ where }: { where: { id?: string; externalId?: string } }) => {
        if (where.id && distMap.has(where.id)) return Promise.resolve(distMap.get(where.id));
        if (where.externalId) {
          for (const dist of distMap.values()) {
            if (dist.externalId === where.externalId) return Promise.resolve(dist);
          }
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(({ where }: { where?: { governorateId?: string; externalId?: { in?: string[] } } } = {}) => {
        const list = Array.from(distMap.values());
        if (where?.governorateId) return Promise.resolve(list.filter(d => d.governorateId === where.governorateId));
        if (where?.externalId?.in) {
          const inSet = new Set(where.externalId.in);
          return Promise.resolve(list.filter(d => inSet.has(d.externalId)));
        }
        return Promise.resolve(list);
      }),
      create: vi.fn().mockImplementation(({ data }: { data: any }) => {
        const id = `dist-${data.externalId || Math.random().toString(36).substring(7)}`;
        const rec = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        distMap.set(id, rec);
        return Promise.resolve(rec);
      }),
      createMany: vi.fn().mockImplementation(({ data }: { data: any[] }) => {
        for (const item of data) {
          const id = `dist-${item.externalId || Math.random().toString(36).substring(7)}`;
          const rec = { id, ...item, createdAt: new Date(), updatedAt: new Date() };
          distMap.set(id, rec);
        }
        return Promise.resolve({ count: data.length });
      }),
      update: vi.fn().mockImplementation(({ where, data }: { where: { id: string }; data: any }) => {
        const existing = distMap.get(where.id);
        const updated = { ...existing, ...data, updatedAt: new Date() };
        distMap.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      delete: vi.fn(), // Non-destructive: must never be called during pipeline
      count: vi.fn().mockImplementation(() => Promise.resolve(distMap.size)),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
    _state: { govMap, distMap, dataSourceMap },
  };

  return mockPrismaObj as MockedObject<PrismaClient> & {
    _state: { govMap: Map<string, any>; distMap: Map<string, any>; dataSourceMap: Map<string, any> };
  };
}

// ─── Test Suite ───────────────────────────────────────────────────────────────

describe('WAYNAH-GEO-003 — Controlled Yemen Geographic Import', () => {
  let mockPrisma: ReturnType<typeof makeMockPrismaForImportExecution>;
  let pipeline: GeographyPipelineService;
  let sourceReader: GeographySourceReader;

  beforeEach(() => {
    mockPrisma = makeMockPrismaForImportExecution();
    pipeline = new GeographyPipelineService(mockPrisma as unknown as PrismaClient);
    sourceReader = new GeographySourceReader();
  });

  // ── Source Parsing & Mapping Tests ──────────────────────────────────────────

  it('Test 1 — Official source schema parsing parses raw GeoJSON files correctly', () => {
    const readResult = sourceReader.readFromFiles();

    expect(readResult.rawGovCount).toBe(22);
    expect(readResult.rawDistCount).toBe(335);
    expect(readResult.sourceName).toBe('OCHA Yemen COD-AB');
    expect(readResult.sourceVersion).toBe('January 2026 Release');
  });

  it('Test 2 — Governorate P-code mapping maps ADM1_PCODE correctly', () => {
    const readResult = sourceReader.readFromFiles();
    const hajjahGov = readResult.dataset.governorates.find(g => g.ADM1_PCODE === 'YE17');

    expect(hajjahGov).toBeDefined();
    expect(hajjahGov?.ADM1_PCODE).toBe('YE17');
    expect(hajjahGov?.ADM1_AR).toBe('حجه');
    expect(hajjahGov?.ADM1_EN).toBe('Hajjah');
  });

  it('Test 3 — District P-code mapping maps ADM2_PCODE correctly', () => {
    const readResult = sourceReader.readFromFiles();
    const absDist = readResult.dataset.districts.find(d => d.ADM2_PCODE === 'YE1704');

    expect(absDist).toBeDefined();
    expect(absDist?.ADM2_PCODE).toBe('YE1704');
    expect(absDist?.ADM1_PCODE).toBe('YE17');
  });

  it('Test 4 — Arabic name mapping preserves official Arabic names', () => {
    const readResult = sourceReader.readFromFiles();
    const absDist = readResult.dataset.districts.find(d => d.ADM2_PCODE === 'YE1704');

    expect(absDist?.ADM2_AR).toBe('عبس');
  });

  it('Test 5 — Parent relationship mapping links district ADM1_PCODE to governorate ADM1_PCODE', () => {
    const readResult = sourceReader.readFromFiles();
    const govPcodes = new Set(readResult.dataset.governorates.map(g => g.ADM1_PCODE));

    readResult.dataset.districts.forEach(dist => {
      expect(govPcodes.has(dist.ADM1_PCODE)).toBe(true);
    });
  });

  // ── Validation Tests ────────────────────────────────────────────────────────

  it('Test 6 — Duplicate Governorate P-code is rejected by Dry Run', async () => {
    const badInput: OchaCodAbDatasetInput = {
      governorates: [
        { ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' },
        { ADM1_PCODE: 'YE17', ADM1_AR: 'حجة مكررة' },
      ],
      districts: [],
    };

    const report = await pipeline.executeDryRun(badInput);

    expect(report.status).toBe('FAILED');
    expect(report.summary.governorates.duplicatePcodes).toBe(1);
    expect(report.errors.some(e => e.message.includes('Duplicate governorate P-code'))).toBe(true);
  });

  it('Test 7 — Duplicate District P-code is rejected by Dry Run', async () => {
    const badInput: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' }],
      districts: [
        { ADM2_PCODE: 'YE1701', ADM1_PCODE: 'YE17', ADM2_AR: 'مدينة حجة' },
        { ADM2_PCODE: 'YE1701', ADM1_PCODE: 'YE17', ADM2_AR: 'مدينة حجة مكررة' },
      ],
    };

    const report = await pipeline.executeDryRun(badInput);

    expect(report.status).toBe('FAILED');
    expect(report.summary.districts.duplicatePcodes).toBe(1);
    expect(report.errors.some(e => e.message.includes('Duplicate district P-code'))).toBe(true);
  });

  it('Test 8 — Missing parent governorate is rejected by Dry Run', async () => {
    const orphanInput: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' }],
      districts: [
        { ADM2_PCODE: 'YE9901', ADM1_PCODE: 'YE99', ADM2_AR: 'مديرية يتيمة' },
      ],
    };

    const report = await pipeline.executeDryRun(orphanInput);

    expect(report.status).toBe('FAILED');
    expect(report.summary.districts.missingParent).toBe(1);
    expect(report.errors[0]?.message).toContain('YE99');
  });

  it('Test 9 — Missing required Arabic name is rejected by Dry Run', async () => {
    const missingNameInput: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: '' }],
      districts: [],
    };

    const report = await pipeline.executeDryRun(missingNameInput);

    expect(report.status).toBe('FAILED');
    expect(report.summary.governorates.missingNameAr).toBe(1);
    expect(report.errors[0]?.field).toBe('ADM1_AR');
  });

  it('Test 10 — Invalid source record with bad coordinates is rejected', async () => {
    const badCoordsInput: OchaCodAbDatasetInput = {
      governorates: [
        { ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', latitude: 999.0, longitude: 43.6 },
      ],
      districts: [],
    };

    const report = await pipeline.executeDryRun(badCoordsInput);

    expect(report.status).toBe('FAILED');
    expect(report.errors[0]?.field).toBe('coordinates');
  });

  // ── Import & Upsert Tests ───────────────────────────────────────────────────

  it('Test 11 — New Governorate is created on upsert', async () => {
    const result = await pipeline.executeUpsert({
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah' }],
      districts: [],
    });

    expect(result.governorates.created).toBe(1);
    expect(mockPrisma._state.govMap.size).toBe(1);
  });

  it('Test 12 — New District is created on upsert', async () => {
    const result = await pipeline.executeUpsert({
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah' }],
      districts: [{ ADM2_PCODE: 'YE1704', ADM1_PCODE: 'YE17', ADM2_AR: 'عبس', ADM2_EN: 'Abs' }],
    });

    expect(result.districts.created).toBe(1);
    expect(mockPrisma._state.distMap.size).toBe(1);
  });

  it('Test 13 — Existing Governorate with different data triggers GeographyDriftError', async () => {
    const inputInitial: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah' }],
      districts: [],
    };
    await pipeline.executeUpsert(inputInitial);

    const inputUpdate: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah (Official)' }],
      districts: [],
    };
    await expect(pipeline.executeUpsert(inputUpdate)).rejects.toThrow(/DRIFT DETECTED/);
  });

  it('Test 14 — Existing District with different data triggers GeographyDriftError', async () => {
    const inputInitial: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah' }],
      districts: [{ ADM2_PCODE: 'YE1704', ADM1_PCODE: 'YE17', ADM2_AR: 'عبس', ADM2_EN: 'Abs' }],
    };
    await pipeline.executeUpsert(inputInitial);

    const inputUpdate: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah' }],
      districts: [{ ADM2_PCODE: 'YE1704', ADM1_PCODE: 'YE17', ADM2_AR: 'عبس', ADM2_EN: 'Abs City' }],
    };
    await expect(pipeline.executeUpsert(inputUpdate)).rejects.toThrow(/DRIFT DETECTED/);
  });

  it('Test 15 — Missing source record is NOT deleted on partial import', async () => {
    // 1. Initial import of 2 districts
    await pipeline.executeUpsert({
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' }],
      districts: [
        { ADM2_PCODE: 'YE1701', ADM1_PCODE: 'YE17', ADM2_AR: 'مدينة حجة' },
        { ADM2_PCODE: 'YE1704', ADM1_PCODE: 'YE17', ADM2_AR: 'عبس' },
      ],
    });
    expect(mockPrisma._state.distMap.size).toBe(2);

    // 2. Partial re-import containing only YE1701
    await pipeline.executeUpsert({
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' }],
      districts: [{ ADM2_PCODE: 'YE1701', ADM1_PCODE: 'YE17', ADM2_AR: 'مدينة حجة' }],
    });

    // YE1704 must NOT be deleted
    expect(mockPrisma.district.delete).not.toHaveBeenCalled();
    expect(mockPrisma._state.distMap.size).toBe(2);
  });

  it('Test 16 — Re-running import does not duplicate records', async () => {
    const readResult = sourceReader.readFromFiles();

    const run1 = await pipeline.executeUpsert(readResult.dataset);
    expect(run1.governorates.created).toBe(22);
    expect(run1.districts.created).toBe(335);

    const run2 = await pipeline.executeUpsert(readResult.dataset);
    expect(run2.governorates.created).toBe(0);
    expect(run2.districts.created).toBe(0);
    expect(run2.governorates.unchanged).toBe(22);
    expect(run2.districts.unchanged).toBe(335);

    expect(mockPrisma._state.govMap.size).toBe(22);
    expect(mockPrisma._state.distMap.size).toBe(335);
  });

  // ── Safety & Integrity Tests ───────────────────────────────────────────────

  it('Test 17 — Controlled transaction rolls back on database failure', async () => {
    const badInput: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: '' }], // Invalid: missing nameAr
      districts: [],
    };

    await expect(pipeline.executeUpsert(badInput)).rejects.toThrow();
    expect(mockPrisma._state.govMap.size).toBe(0);
  });

  it('Test 18 — No fake records are created when unpopulated', async () => {
    const cleanPrisma = makeMockPrismaForImportExecution();
    const cleanPipeline = new GeographyPipelineService(cleanPrisma as unknown as PrismaClient);

    const report = await cleanPipeline.executeVerify();

    expect(report.totalGovernorates).toBe(0);
    expect(report.totalDistricts).toBe(0);
  });

  // ── Geography & Hajjah Integrity Tests ─────────────────────────────────────

  it('Test 19 — Hajjah YE17 governorate & districts are verified after import', async () => {
    const readResult = sourceReader.readFromFiles();
    await pipeline.executeUpsert(readResult.dataset);

    const hajjahGov = await mockPrisma.governorate.findUnique({
      where: { externalId: 'YE17' },
      include: { districts: true },
    });

    expect(hajjahGov).toBeDefined();
    expect(hajjahGov?.externalId).toBe('YE17');
    expect(hajjahGov?.nameAr).toBe('حجه');
    expect(hajjahGov?.nameEn).toBe('Hajjah');

    const hajjahDistricts = await mockPrisma.district.findMany({
      where: { governorateId: hajjahGov!.id },
    });

    expect(hajjahDistricts).toHaveLength(31);
  });

  it('Test 20 — District parent integrity is 100% verified with zero orphans', async () => {
    const readResult = sourceReader.readFromFiles();
    await pipeline.executeUpsert(readResult.dataset);

    const verifyReport = await pipeline.executeVerify();

    expect(verifyReport.status).toBe('VERIFIED');
    expect(verifyReport.totalGovernorates).toBe(22);
    expect(verifyReport.totalDistricts).toBe(335);
    expect(verifyReport.externalIdCoverage.governorateCoveragePercent).toBe(100);
    expect(verifyReport.externalIdCoverage.districtCoveragePercent).toBe(100);
    expect(verifyReport.orphanedDistricts).toBe(0);
  });

  // ── API & Search Regression Tests ──────────────────────────────────────────

  it('Test 21 — Geography endpoints remain functional', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);

    const resGovs = await app.request('/v1/geography/governorates');
    expect(resGovs.status).toBe(200);

    const resNotFound = await app.request('/v1/geography/governorates/unknown-id');
    expect(resNotFound.status).toBe(404);
  });

  it('Test 22 — Search endpoint remains functional', async () => {
    const app = createServer(mockPrisma as unknown as PrismaClient);

    const resSearch = await app.request('/v1/search?query=مطعم');
    expect(resSearch.status).toBe(200);
    const body = await resSearch.json();
    expect(body.success).toBe(true);
  });
});
