import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  GeographyPipelineService,
  type OchaCodAbDatasetInput,
} from '../src/domain/geography/geography-pipeline.service.js';
import {
  GeographyImportService,
  GeographyDriftError,
} from '../src/domain/geography/geography-import.service.js';

describe('WAYNAH — Multi-Phase Chunked Geography Pipeline & Drift Detection Tests', () => {
  it('1. 335 Districts are chunked into exactly 7 sequential batches with last batch containing 35 items', () => {
    const districts = Array.from({ length: 335 }, (_, i) => ({
      ADM2_PCODE: `YE17${String(i + 1).padStart(2, '0')}`,
      ADM1_PCODE: 'YE17',
      ADM2_AR: `مديرية ${i + 1}`,
      ADM2_EN: `District ${i + 1}`,
    }));

    const BATCH_SIZE = 50;
    const chunks = [];
    for (let i = 0; i < districts.length; i += BATCH_SIZE) {
      chunks.push(districts.slice(i, i + BATCH_SIZE));
    }

    expect(chunks.length).toBe(7);
    expect(chunks[0]?.length).toBe(50);
    expect(chunks[1]?.length).toBe(50);
    expect(chunks[2]?.length).toBe(50);
    expect(chunks[3]?.length).toBe(50);
    expect(chunks[4]?.length).toBe(50);
    expect(chunks[5]?.length).toBe(50);
    expect(chunks[6]?.length).toBe(35);
  });

  it('2. Duplicate P-code in source halts pipeline during Dry-Run before opening any transaction', async () => {
    const mockPrisma: any = {};
    const pipeline = new GeographyPipelineService(mockPrisma);

    const inputWithDuplicatePcode: OchaCodAbDatasetInput = {
      governorates: [
        { ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' },
        { ADM1_PCODE: 'YE17', ADM1_AR: 'حجة مكررة' },
      ],
      districts: [],
    };

    const dryRun = await pipeline.executeDryRun(inputWithDuplicatePcode);
    expect(dryRun.status).toBe('FAILED');
    expect(dryRun.errors.some(e => e.message.includes('Duplicate governorate P-code'))).toBe(true);

    await expect(pipeline.executeUpsert(inputWithDuplicatePcode)).rejects.toThrow(
      'Geography import pipeline upsert rejected'
    );
  });

  it('3. Missing Governorate P-code in District halts pipeline during Dry-Run', async () => {
    const mockPrisma: any = {};
    const pipeline = new GeographyPipelineService(mockPrisma);

    const inputWithOrphanDistrict: OchaCodAbDatasetInput = {
      governorates: [{ ADM1_PCODE: 'YE17', ADM1_AR: 'حجة' }],
      districts: [
        {
          ADM2_PCODE: 'YE9901',
          ADM1_PCODE: 'YE99', // Unknown parent
          ADM2_AR: 'مديرية مجهولة',
        },
      ],
    };

    const dryRun = await pipeline.executeDryRun(inputWithOrphanDistrict);
    expect(dryRun.status).toBe('FAILED');
    expect(dryRun.summary.districts.missingParent).toBe(1);
  });

  it('4. Existing identical record returns UNCHANGED without updating or deleting', async () => {
    const mockDb: any = {
      governorate: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'gov-uuid-1',
          externalId: 'YE17',
          nameAr: 'حجة',
          nameEn: 'Hajjah',
        }),
      },
    };

    const importService = new GeographyImportService(mockDb as any);
    const result = await importService.importGovernorate(
      { externalId: 'YE17', nameAr: 'حجة', nameEn: 'Hajjah' },
      mockDb
    );

    expect(result.action).toBe('UNCHANGED');
    expect(result.id).toBe('gov-uuid-1');
  });

  it('5. Existing record with different fields throws GeographyDriftError (DRIFT DETECTED) and halts', async () => {
    const mockDb: any = {
      governorate: {
        findUnique: vi.fn().mockResolvedValue({
          id: 'gov-uuid-1',
          externalId: 'YE17',
          nameAr: 'حجة القديمة', // Differs from input
          nameEn: 'Hajjah',
        }),
      },
    };

    const importService = new GeographyImportService(mockDb as any);

    await expect(
      importService.importGovernorate(
        { externalId: 'YE17', nameAr: 'حجة الجديدة', nameEn: 'Hajjah' },
        mockDb
      )
    ).rejects.toThrow(GeographyDriftError);
  });

  it('6. District import verifies governorateId and creates district record', async () => {
    const mockDb: any = {
      district: {
        findUnique: vi.fn().mockResolvedValue(null),
        create: vi.fn().mockResolvedValue({
          id: 'dist-uuid-1',
          externalId: 'YE1701',
          governorateId: 'gov-memory-uuid',
          nameAr: 'حرض',
        }),
      },
      governorate: {
        findUnique: vi.fn().mockResolvedValue({ id: 'gov-memory-uuid', externalId: 'YE17', nameAr: 'حجة' }),
      },
    };

    const importService = new GeographyImportService(mockDb as any);
    const result = await importService.importDistrict(
      {
        externalId: 'YE1701',
        governorateId: 'gov-memory-uuid',
        nameAr: 'حرض',
      },
      mockDb
    );

    expect(result.action).toBe('CREATED');
    expect(mockDb.governorate.findUnique).toHaveBeenCalledWith({ where: { id: 'gov-memory-uuid' } });
  });
});
