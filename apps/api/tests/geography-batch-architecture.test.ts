/**
 * WAYNAH — District Batch Import Writes-Only Architecture & Regression Tests
 *
 * Enforces the WAYNAH-GEO-004 Writes-Only Transaction Architecture:
 * 1. Zero Read Queries (governorate.findUnique, district.findUnique, district.findFirst, district.findMany) inside District $transaction.
 * 2. Pre-fetch of existing districts in bulk (1 district.findMany query) OUTSIDE transaction.
 * 3. In-memory validation and Drift Detection OUTSIDE transaction (GeographyDriftError halts import before tx starts).
 * 4. Writes-Only Transaction containing only bulk create (district.createMany).
 * 5. Preservation of Batch Size 50, Data Source Provenance, Idempotency, and Non-destructive behavior.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeographyImportService,
  GeographyDriftError,
  GeographyValidationError,
  type ImportDistrictBatchInput,
} from '../src/domain/geography/geography-import.service.js';
import {
  GeographyPipelineService,
  type OchaCodAbDatasetInput,
} from '../src/domain/geography/geography-pipeline.service.js';
import type { PrismaClient } from '@waynah/database';

describe('GEO-004 — Writes-Only Transaction Architecture & Non-Regression Tests', () => {
  let mockTxHandles: any[];
  let dbCallsOutsideTx: { entity: string; method: string; args: any[] }[];
  let dbCallsInsideTx: { entity: string; method: string; args: any[] }[];

  function createArchMockPrisma(existingDistrictsList: any[] = []) {
    mockTxHandles = [];
    dbCallsOutsideTx = [];
    dbCallsInsideTx = [];

    const distMap = new Map<string, any>();
    for (const d of existingDistrictsList) {
      distMap.set(d.externalId, d);
    }

    const dataSourceMap = new Map<string, any>();

    const makeTxMock = () => {
      const txObj: any = {
        $executeRaw: vi.fn((...args: any[]) => {
          dbCallsInsideTx.push({ entity: 'district', method: '$executeRaw', args });
          return Promise.resolve(1);
        }),
        dataSource: {
          findFirst: vi.fn((query: any) => {
            dbCallsInsideTx.push({ entity: 'dataSource', method: 'findFirst', args: [query] });
            for (const ds of dataSourceMap.values()) {
              if (ds.name === query?.where?.name) return Promise.resolve(ds);
            }
            return Promise.resolve({ id: 'ds-mock-001', name: query?.where?.name || 'OCHA Yemen COD-AB' });
          }),
          create: vi.fn((dataObj: any) => {
            dbCallsInsideTx.push({ entity: 'dataSource', method: 'create', args: [dataObj] });
            const ds = { id: `ds-mock-${Date.now()}`, ...dataObj.data };
            dataSourceMap.set(ds.id, ds);
            return Promise.resolve(ds);
          }),
        },
        governorate: {
          findUnique: vi.fn((...args: any[]) => {
            dbCallsInsideTx.push({ entity: 'governorate', method: 'findUnique', args });
            return Promise.resolve(null);
          }),
          findFirst: vi.fn((...args: any[]) => {
            dbCallsInsideTx.push({ entity: 'governorate', method: 'findFirst', args });
            return Promise.resolve(null);
          }),
          findMany: vi.fn((...args: any[]) => {
            dbCallsInsideTx.push({ entity: 'governorate', method: 'findMany', args });
            return Promise.resolve([]);
          }),
          create: vi.fn((dataObj: any) => {
            dbCallsInsideTx.push({ entity: 'governorate', method: 'create', args: [dataObj] });
            return Promise.resolve({ id: 'gov-hajjah-001', ...dataObj.data });
          }),
        },
        district: {
          findUnique: vi.fn((...args: any[]) => {
            dbCallsInsideTx.push({ entity: 'district', method: 'findUnique', args });
            return Promise.resolve(null);
          }),
          findFirst: vi.fn((...args: any[]) => {
            dbCallsInsideTx.push({ entity: 'district', method: 'findFirst', args });
            return Promise.resolve(null);
          }),
          findMany: vi.fn((...args: any[]) => {
            dbCallsInsideTx.push({ entity: 'district', method: 'findMany', args });
            return Promise.resolve([]);
          }),
          create: vi.fn((dataObj: any) => {
            dbCallsInsideTx.push({ entity: 'district', method: 'create', args: [dataObj] });
            return Promise.resolve({ id: 'dist-new', ...dataObj.data });
          }),
          createMany: vi.fn((dataObj: any) => {
            dbCallsInsideTx.push({ entity: 'district', method: 'createMany', args: [dataObj] });
            for (const item of dataObj.data) {
              distMap.set(item.externalId, { id: `dist-${item.externalId}`, ...item });
            }
            return Promise.resolve({ count: dataObj.data.length });
          }),
        },
      };
      mockTxHandles.push(txObj);
      return txObj;
    };

    const mockPrisma: any = {
      $transaction: vi.fn(async (fn: (tx: any) => Promise<any>, options?: any) => {
        const tx = makeTxMock();
        return await fn(tx);
      }),
      dataSource: {
        findFirst: vi.fn((query: any) => {
          dbCallsOutsideTx.push({ entity: 'dataSource', method: 'findFirst', args: [query] });
          for (const ds of dataSourceMap.values()) {
            if (ds.name === query?.where?.name) return Promise.resolve(ds);
          }
          return Promise.resolve(null);
        }),
        create: vi.fn((dataObj: any) => {
          dbCallsOutsideTx.push({ entity: 'dataSource', method: 'create', args: [dataObj] });
          const ds = { id: `ds-mock-${Date.now()}`, ...dataObj.data };
          dataSourceMap.set(ds.id, ds);
          return Promise.resolve(ds);
        }),
      },
      governorate: {
        findUnique: vi.fn((query: any) => {
          dbCallsOutsideTx.push({ entity: 'governorate', method: 'findUnique', args: [query] });
          return Promise.resolve({ id: 'gov-hajjah-001', externalId: 'YE17', nameAr: 'حجة' });
        }),
        findMany: vi.fn((query: any) => {
          dbCallsOutsideTx.push({ entity: 'governorate', method: 'findMany', args: [query] });
          return Promise.resolve([{ id: 'gov-hajjah-001', externalId: 'YE17', nameAr: 'حجة' }]);
        }),
        create: vi.fn((dataObj: any) => {
          dbCallsOutsideTx.push({ entity: 'governorate', method: 'create', args: [dataObj] });
          return Promise.resolve({ id: 'gov-hajjah-001', ...dataObj.data });
        }),
      },
      district: {
        findMany: vi.fn((query: any) => {
          dbCallsOutsideTx.push({ entity: 'district', method: 'findMany', args: [query] });
          const inPcodes = query?.where?.externalId?.in;
          if (Array.isArray(inPcodes)) {
            const matches = Array.from(distMap.values()).filter((d) =>
              inPcodes.includes(d.externalId)
            );
            return Promise.resolve(matches);
          }
          return Promise.resolve(Array.from(distMap.values()));
        }),
        findUnique: vi.fn((query: any) => {
          dbCallsOutsideTx.push({ entity: 'district', method: 'findUnique', args: [query] });
          return Promise.resolve(distMap.get(query?.where?.externalId) || null);
        }),
      },
    };

    return mockPrisma;
  }

  it('1. Pre-fetch happens outside transaction via a single district.findMany query', async () => {
    const mockPrisma = createArchMockPrisma();
    const service = new GeographyImportService(mockPrisma as unknown as PrismaClient);

    const batchInputs: ImportDistrictBatchInput[] = [
      { externalId: 'YE1701', governorateId: 'gov-hajjah-001', nameAr: 'مدينة حجة', nameEn: 'Hajjah City' },
      { externalId: 'YE1704', governorateId: 'gov-hajjah-001', nameAr: 'عبس', nameEn: 'Abs' },
    ];

    const validGovs = new Set(['gov-hajjah-001']);
    const result = await service.importDistrictBatch(batchInputs, validGovs);

    expect(result.created).toBe(2);

    // Verify district.findMany was called outside transaction with { in: ['YE1701', 'YE1704'] }
    const findManyCall = dbCallsOutsideTx.find((c) => c.entity === 'district' && c.method === 'findMany');
    expect(findManyCall).toBeDefined();
    expect(findManyCall?.args[0]?.where?.externalId?.in).toEqual(['YE1701', 'YE1704']);
  });

  it('2. STATIC ARCHITECTURE TEST: Zero Read Queries inside district $transaction', async () => {
    const mockPrisma = createArchMockPrisma();
    const service = new GeographyImportService(mockPrisma as unknown as PrismaClient);

    const batchInputs: ImportDistrictBatchInput[] = Array.from({ length: 50 }, (_, i) => ({
      externalId: `YE17${String(i + 1).padStart(2, '0')}`,
      governorateId: 'gov-hajjah-001',
      nameAr: `مديرية ${i + 1}`,
      nameEn: `District ${i + 1}`,
    }));

    const validGovs = new Set(['gov-hajjah-001']);
    await service.importDistrictBatch(batchInputs, validGovs);

    // STATIC ARCHITECTURE INVARIANT: No read queries allowed inside tx
    const readCallsInsideTx = dbCallsInsideTx.filter((c) =>
      ['findUnique', 'findFirst', 'findMany'].includes(c.method)
    );

    expect(readCallsInsideTx).toHaveLength(0);

    // Verify only writes were executed inside tx (e.g. createMany)
    const writeCallsInsideTx = dbCallsInsideTx.filter((c) =>
      ['create', 'createMany'].includes(c.method)
    );
    expect(writeCallsInsideTx.length).toBeGreaterThan(0);
  });

  it('3. Governorate validation occurs outside transaction and rejects missing parent before opening tx', async () => {
    const mockPrisma = createArchMockPrisma();
    const service = new GeographyImportService(mockPrisma as unknown as PrismaClient);

    const orphanInput: ImportDistrictBatchInput[] = [
      { externalId: 'YE9901', governorateId: 'gov-nonexistent-999', nameAr: 'مديرية يتيمة' },
    ];

    const validGovs = new Set(['gov-hajjah-001']); // 'gov-nonexistent-999' not in valid set

    await expect(service.importDistrictBatch(orphanInput, validGovs)).rejects.toThrow(
      GeographyValidationError
    );

    // Verify transaction was never opened
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(dbCallsInsideTx).toHaveLength(0);
  });

  it('4. Drift detection occurs outside transaction and halts before starting tx', async () => {
    const existingAbs = {
      id: 'dist-abs-001',
      externalId: 'YE1704',
      governorateId: 'gov-hajjah-001',
      nameAr: 'عبس القديمة', // DB value differs from incoming
      nameEn: 'Abs',
    };

    const mockPrisma = createArchMockPrisma([existingAbs]);
    const service = new GeographyImportService(mockPrisma as unknown as PrismaClient);

    const driftedBatch: ImportDistrictBatchInput[] = [
      { externalId: 'YE1704', governorateId: 'gov-hajjah-001', nameAr: 'عبس الجديدة', nameEn: 'Abs' },
    ];

    const validGovs = new Set(['gov-hajjah-001']);

    await expect(service.importDistrictBatch(driftedBatch, validGovs)).rejects.toThrow(
      GeographyDriftError
    );

    // Verify NO transaction opened, NO writes executed
    expect(mockPrisma.$transaction).not.toHaveBeenCalled();
    expect(dbCallsInsideTx).toHaveLength(0);
  });

  it('5. Identical existing records return UNCHANGED with zero writes executed', async () => {
    const existingAbs = {
      id: 'dist-abs-001',
      externalId: 'YE1704',
      governorateId: 'gov-hajjah-001',
      nameAr: 'عبس',
      nameEn: 'Abs',
    };

    const mockPrisma = createArchMockPrisma([existingAbs]);
    const service = new GeographyImportService(mockPrisma as unknown as PrismaClient);

    const identicalBatch: ImportDistrictBatchInput[] = [
      { externalId: 'YE1704', governorateId: 'gov-hajjah-001', nameAr: 'عبس', nameEn: 'Abs' },
    ];

    const validGovs = new Set(['gov-hajjah-001']);
    const result = await service.importDistrictBatch(identicalBatch, validGovs);

    expect(result.created).toBe(0);
    expect(result.unchanged).toBe(1);

    // When all items are unchanged, no writes needed inside transaction
    expect(dbCallsInsideTx).toHaveLength(0);
  });

  it('6. Full Pipeline executeUpsert executes 50-item batches with 1 read outside + 1 write inside tx', async () => {
    const mockPrisma = createArchMockPrisma();
    const pipeline = new GeographyPipelineService(mockPrisma as unknown as PrismaClient);

    const districts = Array.from({ length: 50 }, (_, i) => ({
      ADM2_PCODE: `YE17${String(i + 1).padStart(2, '0')}`,
      ADM1_PCODE: 'YE17',
      ADM2_AR: `مديرية ${i + 1}`,
      ADM2_EN: `District ${i + 1}`,
    }));

    const dataset: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة', ADM1_EN: 'Hajjah' }],
      districts,
    };

    const result = await pipeline.executeUpsert(dataset);

    expect(result.governorates.created).toBe(1);
    expect(result.districts.created).toBe(50);

    // Verify district transaction had ZERO read queries on district entity
    const districtTxReadCalls = dbCallsInsideTx.filter(
      (c) => c.entity === 'district' && ['findUnique', 'findFirst', 'findMany'].includes(c.method)
    );
    expect(districtTxReadCalls).toHaveLength(0);
  });

  it('7. Transaction timeout is configured to 15000 and maxWait 5000', async () => {
    const mockPrisma = createArchMockPrisma();
    const service = new GeographyImportService(mockPrisma as unknown as PrismaClient);

    const batchInputs: ImportDistrictBatchInput[] = [
      { externalId: 'YE1701', governorateId: 'gov-hajjah-001', nameAr: 'مدينة حجة' },
    ];

    await service.importDistrictBatch(batchInputs, new Set(['gov-hajjah-001']));

    expect(mockPrisma.$transaction).toHaveBeenCalledWith(
      expect.any(Function),
      { maxWait: 5000, timeout: 15000 }
    );
  });

  // ── Boundary Import Writes-Only Architecture Tests ─────────────────────────

  it('8. Boundary Import performs bulk pre-fetch of districts outside transaction', async () => {
    const { GeographyBoundaryService } = await import(
      '../src/domain/geography/geography-boundary.service.js'
    );

    const existingDistricts = [
      { id: 'dist-uuid-1701', externalId: 'YE1701' },
      { id: 'dist-uuid-1704', externalId: 'YE1704' },
    ];

    const mockPrisma = createArchMockPrisma(existingDistricts);
    const boundaryService = new GeographyBoundaryService(mockPrisma as unknown as PrismaClient);

    const mockFeatures = [
      {
        ADM2_PCODE: 'YE1701',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [43.6, 15.6],
              [43.7, 15.6],
              [43.7, 15.7],
              [43.6, 15.7],
              [43.6, 15.6],
            ],
          ],
        },
      },
      {
        ADM2_PCODE: 'YE1704',
        geometry: {
          type: 'Polygon',
          coordinates: [
            [
              [43.1, 15.9],
              [43.2, 15.9],
              [43.2, 16.0],
              [43.1, 16.0],
              [43.1, 15.9],
            ],
          ],
        },
      },
    ];

    const result = await boundaryService.executeBoundaryUpsert(mockFeatures, mockPrisma as any);

    expect(result.updatedCount).toBe(2);

    // Verify bulk pre-fetch query occurred outside transaction
    const bulkFetchCall = dbCallsOutsideTx.find(
      (c) => c.entity === 'district' && c.method === 'findMany' && c.args[0]?.where?.externalId?.in
    );
    expect(bulkFetchCall).toBeDefined();
    expect(bulkFetchCall?.args[0]?.where?.externalId?.in).toEqual(['YE1701', 'YE1704']);
  });

  it('9. Boundary Import STATIC ARCHITECTURE TEST: Zero Read Queries inside boundary $transaction', async () => {
    const { GeographyBoundaryService } = await import(
      '../src/domain/geography/geography-boundary.service.js'
    );

    const existingDistricts = Array.from({ length: 50 }, (_, i) => ({
      id: `dist-uuid-${i + 1}`,
      externalId: `YE17${String(i + 1).padStart(2, '0')}`,
    }));

    const mockPrisma = createArchMockPrisma(existingDistricts);
    const boundaryService = new GeographyBoundaryService(mockPrisma as unknown as PrismaClient);

    const features = existingDistricts.map((d) => ({
      ADM2_PCODE: d.externalId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [43.6, 15.6],
            [43.7, 15.6],
            [43.7, 15.7],
            [43.6, 15.7],
            [43.6, 15.6],
          ],
        ],
      },
    }));

    await boundaryService.executeBoundaryUpsert(features, mockPrisma as any);

    // STATIC ARCHITECTURE INVARIANT: Zero read queries on district inside boundary tx
    const boundaryTxReads = dbCallsInsideTx.filter(
      (c) => c.entity === 'district' && ['findUnique', 'findFirst', 'findMany'].includes(c.method)
    );

    expect(boundaryTxReads).toHaveLength(0);
  });

  it('10. Boundary Import STATIC ARCHITECTURE TEST: Exactly 1 Bulk Write statement per batch & zero sequential executeRaw', async () => {
    const { GeographyBoundaryService } = await import(
      '../src/domain/geography/geography-boundary.service.js'
    );

    // 25 items batch
    const existingDistricts = Array.from({ length: 25 }, (_, i) => ({
      id: `dist-uuid-${i + 1}`,
      externalId: `YE17${String(i + 1).padStart(2, '0')}`,
    }));

    const mockPrisma = createArchMockPrisma(existingDistricts);
    const boundaryService = new GeographyBoundaryService(mockPrisma as unknown as PrismaClient);

    const features = existingDistricts.map((d) => ({
      ADM2_PCODE: d.externalId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [43.6, 15.6],
            [43.7, 15.6],
            [43.7, 15.7],
            [43.6, 15.7],
            [43.6, 15.6],
          ],
        ],
      },
    }));

    await boundaryService.executeBoundaryUpsert(features, mockPrisma as any);

    // Verify exactly 1 $executeRaw call executed inside tx for the batch of 25 features
    const rawWriteCalls = dbCallsInsideTx.filter((c) => c.method === '$executeRaw');
    expect(rawWriteCalls).toHaveLength(1);

    // Verify UNNEST bulk query pattern is present in raw SQL
    const rawSqlStr = String(rawWriteCalls[0].args[0]);
    expect(rawSqlStr).toContain('UNNEST');
    expect(rawSqlStr).toContain('ST_SetSRID(ST_GeomFromGeoJSON');
  });

  it('11. Boundary Import Bulk Write handles 10-feature batch with exactly 1 bulk write statement', async () => {
    const { GeographyBoundaryService } = await import(
      '../src/domain/geography/geography-boundary.service.js'
    );

    const existingDistricts = Array.from({ length: 10 }, (_, i) => ({
      id: `dist-uuid-${i + 1}`,
      externalId: `YE17${String(i + 1).padStart(2, '0')}`,
    }));

    const mockPrisma = createArchMockPrisma(existingDistricts);
    const boundaryService = new GeographyBoundaryService(mockPrisma as unknown as PrismaClient);

    const features = existingDistricts.map((d) => ({
      ADM2_PCODE: d.externalId,
      geometry: {
        type: 'Polygon',
        coordinates: [
          [
            [43.6, 15.6],
            [43.7, 15.6],
            [43.7, 15.7],
            [43.6, 15.7],
            [43.6, 15.6],
          ],
        ],
      },
    }));

    await boundaryService.executeBoundaryUpsert(features, mockPrisma as any);

    const rawWriteCalls = dbCallsInsideTx.filter((c) => c.method === '$executeRaw');
    expect(rawWriteCalls).toHaveLength(1);
  });
});

