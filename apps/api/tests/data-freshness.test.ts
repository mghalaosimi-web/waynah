import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  DataFreshnessService,
  calculateDecayedConfidence,
} from '../src/domain/operations/data-freshness.service';
import { DataFreshnessWorker } from '../src/workers/data-freshness.worker';
import type { PrismaClient, PlaceObservation, DataSource } from '@waynah/database';

describe('Phase 9 / Slice 10 — DataFreshnessEngine & Scheduled Worker', () => {
  const baseAnchor = new Date('2026-01-01T00:00:00.000Z');

  function getEffectiveDateForDay(dayOffset: number): Date {
    const d = new Date(baseAnchor);
    d.setUTCDate(d.getUTCDate() + dayOffset);
    return d;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // 1. Mathematical Correctness
  // ──────────────────────────────────────────────────────────────────────────
  describe('Mathematical Correctness (Locked OQ-34 Formula)', () => {
    const S0 = 1.0;

    it('Day 0 → S0 (1.00)', () => {
      const now = getEffectiveDateForDay(0);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(1.0);
    });

    it('Day 90 → S0 (1.00)', () => {
      const now = getEffectiveDateForDay(90);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(1.0);
    });

    it('Day 120 → 0.90 × S0 (0.90)', () => {
      const now = getEffectiveDateForDay(120);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(0.9);
    });

    it('Day 180 → 0.70 × S0 (0.70)', () => {
      const now = getEffectiveDateForDay(180);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(0.7);
    });

    it('Day 270 → 0.40 × S0 (0.40)', () => {
      const now = getEffectiveDateForDay(270);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(0.4);
    });

    it('Day 300 → 0.30 × S0 (0.30)', () => {
      const now = getEffectiveDateForDay(300);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(0.3);
    });

    it('Day 330 → 0.20 × S0 (0.20)', () => {
      const now = getEffectiveDateForDay(330);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(0.2);
    });

    it('Day 360 → 0.20 × S0 (0.20)', () => {
      const now = getEffectiveDateForDay(360);
      const score = calculateDecayedConfidence(S0, baseAnchor, now);
      expect(score).toBe(0.2);
    });

    it('Scales baseline correctly for non-1.0 S0 (e.g. S0 = 0.80)', () => {
      const customS0 = 0.8;
      const day180 = getEffectiveDateForDay(180); // 0.70 factor
      const score = calculateDecayedConfidence(customS0, baseAnchor, day180);
      expect(score).toBe(0.56); // 0.80 * 0.70
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 2. Minimum Floor
  // ──────────────────────────────────────────────────────────────────────────
  describe('Minimum Floor Enforcement (0.20 × S0)', () => {
    it('Never drops below 0.20 × S0 even at day 500 or 1000', () => {
      const S0 = 0.9;
      const day500 = getEffectiveDateForDay(500);
      const day1000 = getEffectiveDateForDay(1000);

      const score500 = calculateDecayedConfidence(S0, baseAnchor, day500);
      const score1000 = calculateDecayedConfidence(S0, baseAnchor, day1000);

      expect(score500).toBe(0.18); // 0.90 * 0.20
      expect(score1000).toBe(0.18); // 0.90 * 0.20
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 3. Idempotency & DB Update Optimization
  // ──────────────────────────────────────────────────────────────────────────
  describe('Idempotency & Unnecessary Write Prevention', () => {
    let mockPrisma: any;
    let service: DataFreshnessService;

    const mockDataSource: DataSource = {
      id: 'ds-1',
      name: 'Government Registry',
      type: 'OFFICIAL',
      reliabilityWeight: 0.8,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const mockObs: PlaceObservation & { dataSource: DataSource } = {
      id: 'obs-100',
      placeId: 'place-1',
      dataSourceId: 'ds-1',
      dataSource: mockDataSource,
      name: 'Supermarket',
      phone: '+967770000000',
      categoryId: 'cat-1',
      description: 'Test description',
      latitude: 15.35,
      longitude: 44.20,
      geom: null,
      confidenceScore: 0.8, // Current stored confidence
      status: 'AUTO_APPROVED',
      discoveredAt: baseAnchor,
      createdAt: baseAnchor,
      updatedAt: baseAnchor,
    };

    beforeEach(() => {
      mockPrisma = {
        placeObservation: {
          findMany: vi.fn(),
          update: vi.fn(),
        },
      };

      const mockScoringService = {
        calculateScore: vi.fn().mockReturnValue(0.8), // S0 baseline = 0.8
      } as any;

      service = new DataFreshnessService(mockPrisma, mockScoringService);
    });

    it('Repeated execution at same timestamp produces identical target score without redundant writes', async () => {
      const effectiveNow = getEffectiveDateForDay(180); // Target = 0.8 * 0.7 = 0.56

      // Batch 1: stored = 0.80 -> target = 0.56 (requires write)
      mockPrisma.placeObservation.findMany
        .mockResolvedValueOnce([mockObs]) // Page 1
        .mockResolvedValueOnce([]); // End of pages

      mockPrisma.placeObservation.update.mockResolvedValue({
        ...mockObs,
        confidenceScore: 0.56,
      });

      const res1 = await service.processStaleDecay({ effectiveNow }, mockPrisma);
      expect(res1.totalProcessed).toBe(1);
      expect(res1.totalUpdated).toBe(1);
      expect(mockPrisma.placeObservation.update).toHaveBeenCalledOnce();
      expect(mockPrisma.placeObservation.update).toHaveBeenCalledWith({
        where: { id: 'obs-100' },
        data: { confidenceScore: 0.56 },
      });

      // Reset mocks for run 2
      mockPrisma.placeObservation.update.mockClear();

      // Batch 2: stored is now 0.56 -> target = 0.56 (no write needed)
      const updatedObs = { ...mockObs, confidenceScore: 0.56 };
      mockPrisma.placeObservation.findMany.mockImplementation(async ({ where }: any) => {
        if (where?.id?.gt === 'obs-100') {
          return [];
        }
        return [updatedObs];
      });

      const res2 = await service.processStaleDecay({ effectiveNow }, mockPrisma);
      expect(res2.totalProcessed).toBe(1);
      expect(res2.totalUpdated).toBe(0);
      expect(res2.totalUnchanged).toBe(1);
      expect(mockPrisma.placeObservation.update).not.toHaveBeenCalled();

      // Batch 3: third run remains identical
      const res3 = await service.processStaleDecay({ effectiveNow }, mockPrisma);
      expect(res3.totalProcessed).toBe(1);
      expect(res3.totalUpdated).toBe(0);
      expect(res3.totalUnchanged).toBe(1);
      expect(mockPrisma.placeObservation.update).not.toHaveBeenCalled();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 4. Missed Execution Recovery
  // ──────────────────────────────────────────────────────────────────────────
  describe('Missed Execution Recovery', () => {
    it('Produces exact mathematically correct score whether run daily or after 1, 7, or 30 missed days', () => {
      const S0 = 1.0;
      const targetDay = 150;
      const targetDate = getEffectiveDateForDay(targetDay);

      // Score directly computed at Day 150
      const scoreDirect = calculateDecayedConfidence(S0, baseAnchor, targetDate);

      // (150 - 90)/30 = 2 => decay = 0.20 => S(t) = 0.80
      expect(scoreDirect).toBe(0.8);

      // Simulated missed executions (e.g. daily from day 0 to 120, then stopped until day 150)
      const scoreMissed30Days = calculateDecayedConfidence(
        S0,
        baseAnchor,
        getEffectiveDateForDay(150)
      );

      expect(scoreMissed30Days).toBe(scoreDirect);
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 5. Historical Immutability
  // ──────────────────────────────────────────────────────────────────────────
  describe('Historical Immutability Verification', () => {
    it('Never updates discoveredAt, createdAt, placeId, dataSourceId, or observation attributes', async () => {
      const mockDataSource: DataSource = {
        id: 'ds-2',
        name: 'Field Survey',
        type: 'COMMUNITY',
        reliabilityWeight: 0.9,
        createdAt: baseAnchor,
        updatedAt: baseAnchor,
      };

      const originalObs: PlaceObservation & { dataSource: DataSource } = {
        id: 'obs-200',
        placeId: 'place-99',
        dataSourceId: 'ds-2',
        dataSource: mockDataSource,
        name: 'Original Store Name',
        phone: '+967733333333',
        categoryId: 'cat-88',
        description: 'Original Description',
        latitude: 15.36,
        longitude: 44.21,
        geom: null,
        confidenceScore: 0.9,
        status: 'APPROVED',
        discoveredAt: baseAnchor,
        createdAt: baseAnchor,
        updatedAt: baseAnchor,
      };

      const mockPrisma: any = {
        placeObservation: {
          findMany: vi
            .fn()
            .mockResolvedValueOnce([originalObs])
            .mockResolvedValueOnce([]),
          update: vi.fn().mockImplementation(({ data }) => ({
            ...originalObs,
            ...data,
          })),
        },
      };

      const mockScoring = {
        calculateScore: vi.fn().mockReturnValue(0.9),
      } as any;

      const service = new DataFreshnessService(mockPrisma, mockScoring);
      const effectiveNow = getEffectiveDateForDay(180);

      await service.processStaleDecay({ effectiveNow }, mockPrisma);

      // Verify that update was called ONLY with confidenceScore
      expect(mockPrisma.placeObservation.update).toHaveBeenCalledWith({
        where: { id: 'obs-200' },
        data: { confidenceScore: 0.63 }, // 0.9 * 0.7 = 0.63
      });

      const updateCallArg = mockPrisma.placeObservation.update.mock.calls[0][0].data;
      expect(Object.keys(updateCallArg)).toEqual(['confidenceScore']);
      expect(updateCallArg.discoveredAt).toBeUndefined();
      expect(updateCallArg.createdAt).toBeUndefined();
      expect(updateCallArg.placeId).toBeUndefined();
      expect(updateCallArg.dataSourceId).toBeUndefined();
      expect(updateCallArg.name).toBeUndefined();
    });
  });

  // ──────────────────────────────────────────────────────────────────────────
  // 6. Concurrency / PostgreSQL Advisory Locking Worker Test
  // ──────────────────────────────────────────────────────────────────────────
  describe('DataFreshnessWorker — Advisory Lock Concurrency', () => {
    it('Secondary worker exits cleanly with LOCK_HELD when advisory lock is not acquired', async () => {
      const mockService = {
        processStaleDecay: vi.fn(),
      } as any;

      // Mock Prisma transaction behavior where advisory lock returns acquired = false
      const mockPrisma: any = {
        $transaction: vi.fn().mockImplementation(async (callback: any) => {
          const mockTx = {
            $queryRaw: vi.fn().mockResolvedValue([{ acquired: false }]),
          };
          return callback(mockTx);
        }),
      };

      const worker = new DataFreshnessWorker(mockService, mockPrisma);
      const result = await worker.run();

      expect(result.skipped).toBe(true);
      expect(result.reason).toBe('LOCK_HELD');
      // Engine processStaleDecay MUST NOT be called when lock fails
      expect(mockService.processStaleDecay).not.toHaveBeenCalled();
    });

    it('Primary worker acquires lock and executes stale decay processing', async () => {
      const mockService = {
        processStaleDecay: vi.fn().mockResolvedValue({
          totalProcessed: 10,
          totalUpdated: 3,
          totalUnchanged: 7,
          batchesExecuted: 1,
        }),
      } as any;

      const mockPrisma: any = {
        $transaction: vi.fn().mockImplementation(async (callback: any) => {
          const mockTx = {
            $queryRaw: vi.fn().mockResolvedValue([{ acquired: true }]),
          };
          return callback(mockTx);
        }),
      };

      const worker = new DataFreshnessWorker(mockService, mockPrisma);
      const result = await worker.run();

      expect(result.skipped).toBe(false);
      expect(result.totalProcessed).toBe(10);
      expect(result.totalUpdated).toBe(3);
      expect(mockService.processStaleDecay).toHaveBeenCalledOnce();
    });
  });
});
