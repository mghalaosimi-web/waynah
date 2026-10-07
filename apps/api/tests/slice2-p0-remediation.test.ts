/**
 * Slice 2 P0 Remediation & Verification Suite
 *
 * Verifies:
 * 1. Default System DataSource & Community DataSource are idempotently generated without duplicates.
 * 2. Description field flows through Zod validation, API endpoints, IngestionService, and database persistence.
 * 3. Hours, Closed, and Relocation correction types retain semantic meaning without converting to `name`.
 * 4. Anonymous users can submit corrections via POST /v1/discovery/community-report (201 Created).
 * 5. System ingestion route POST /v1/discovery/ingest remains protected (401 Unauthorized).
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import {
  getOrCreateSystemDataSource,
  getOrCreateCommunityDataSource,
  SYSTEM_DATA_SOURCE_NAME,
  COMMUNITY_DATA_SOURCE_NAME,
} from '../src/routes/v1/discovery.routes.js';
import { seedDefaultDataSources } from '../src/domain/discovery/seed-data-sources.js';
import type { PrismaClient } from '@waynah/database';

const MOCK_SYSTEM_DS_ID = 'b0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MOCK_COMMUNITY_DS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MOCK_OBSERVATION_ID = 'obs-slice2-001';
const MOCK_PLACE_ID = 'c0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';

function makeMockPrisma() {
  const dataSources = new Map<string, any>();

  const mock: any = {
    $transaction: vi.fn((fn) => fn(mock)),
    $queryRaw: vi.fn().mockResolvedValue([]),
    $executeRaw: vi.fn().mockResolvedValue(1),
    placeObservation: {
      findUnique: vi.fn().mockResolvedValue({
        id: MOCK_OBSERVATION_ID,
        dataSourceId: MOCK_COMMUNITY_DS_ID,
        placeId: MOCK_PLACE_ID,
        description: 'ساعات العمل: 8:00am - 8:00pm',
        confidenceScore: 0.0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      create: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: MOCK_OBSERVATION_ID,
          confidenceScore: 0.0,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        })
      ),
      update: vi.fn().mockImplementation(({ data }) =>
        Promise.resolve({
          id: MOCK_OBSERVATION_ID,
          status: 'PENDING',
          confidenceScore: 0.0,
          ...data,
        })
      ),
    },
    dataConflict: {
      findMany: vi.fn().mockResolvedValue([]),
      create: vi.fn(),
    },
    category: {
      findUnique: vi.fn().mockImplementation(({ where }) => Promise.resolve({ id: where.id, nameAr: 'صيدلية' })),
    },
    district: { findFirst: vi.fn() },
    governorate: { findFirst: vi.fn() },
    place: {
      create: vi.fn().mockResolvedValue({ id: MOCK_PLACE_ID, nameAr: 'صيدلية السلام' }),
      update: vi.fn().mockResolvedValue({ id: MOCK_PLACE_ID, nameAr: 'صيدلية السلام' }),
      findUnique: vi.fn().mockResolvedValue({ id: MOCK_PLACE_ID, nameAr: 'صيدلية السلام', category: { nameAr: 'صيدلية' }, observations: [] }),
      findMany: vi.fn().mockResolvedValue([{ id: MOCK_PLACE_ID, nameAr: 'صيدلية السلام' }]),
    },
    dataSource: {
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.name === SYSTEM_DATA_SOURCE_NAME) {
          return Promise.resolve(dataSources.get(SYSTEM_DATA_SOURCE_NAME) || null);
        }
        if (where?.name === COMMUNITY_DATA_SOURCE_NAME) {
          return Promise.resolve(dataSources.get(COMMUNITY_DATA_SOURCE_NAME) || null);
        }
        return Promise.resolve(null);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where?.id === MOCK_SYSTEM_DS_ID || where?.id === MOCK_COMMUNITY_DS_ID) {
          return Promise.resolve({ id: where.id, name: 'Valid DataSource', reliabilityWeight: 1.0 });
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const created = { id: data.name.includes('System') ? MOCK_SYSTEM_DS_ID : MOCK_COMMUNITY_DS_ID, ...data };
        dataSources.set(data.name, created);
        return Promise.resolve(created);
      }),
    },
    _dataSourcesMap: dataSources,
  };
  return mock as PrismaClient;
}

describe('Slice 2 — P0 Blockers Remediation Suite', () => {
  let mockPrisma: any;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // P0-1: Default DataSource Verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('P0-1 — Default DataSource', () => {
    it('creates System Default DataSource if missing and reuses existing without duplicates', async () => {
      // First invocation -> creates DataSource
      const ds1 = await getOrCreateSystemDataSource(mockPrisma);
      expect(ds1.name).toBe(SYSTEM_DATA_SOURCE_NAME);
      expect(mockPrisma.dataSource.create).toHaveBeenCalledTimes(1);

      // Second invocation -> returns existing DataSource, no duplicates created
      const ds2 = await getOrCreateSystemDataSource(mockPrisma);
      expect(ds2.name).toBe(SYSTEM_DATA_SOURCE_NAME);
      expect(ds2.id).toBe(ds1.id);
      expect(mockPrisma.dataSource.create).toHaveBeenCalledTimes(1);
    });

    it('seedDefaultDataSources script runs idempotently without resetting DB or duplicating', async () => {
      const res1 = await seedDefaultDataSources(mockPrisma);
      expect(res1.systemSource.name).toBe(SYSTEM_DATA_SOURCE_NAME);
      expect(res1.communitySource.name).toBe(COMMUNITY_DATA_SOURCE_NAME);

      const res2 = await seedDefaultDataSources(mockPrisma);
      expect(res2.systemSource.id).toBe(res1.systemSource.id);
      expect(res2.communitySource.id).toBe(res1.communitySource.id);
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // P0-2: Description & Correction Mapping Verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('P0-2 — Description & Correction Mapping', () => {
    it('accepts and persists description field in community report payload', async () => {
      const descText = 'تحديث ساعات العمل: السبت-الخميس 8:00 ص - 8:00 م';
      const res = await app.request('/v1/discovery/community-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: MOCK_PLACE_ID,
          description: descText,
        }),
      });

      expect(res.status).toBe(201);
      expect(mockPrisma.placeObservation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            description: descText,
          }),
        })
      );
    });

    it('Hours correction retains description and does NOT mutate or set name', async () => {
      const hoursText = 'تحديث ساعات العمل: 24 ساعة يومياً';
      const res = await app.request('/v1/discovery/community-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: MOCK_PLACE_ID,
          description: hoursText,
        }),
      });

      expect(res.status).toBe(201);
      const callData = mockPrisma.placeObservation.create.mock.calls[0][0].data;
      expect(callData.description).toBe(hoursText);
      expect(callData.name).toBeUndefined();
    });

    it('Closed correction retains description and does NOT mutate or set name', async () => {
      const closureText = 'بلاغ إغلاق المكان: مغلق مؤقتاً للتجديد';
      const res = await app.request('/v1/discovery/community-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: MOCK_PLACE_ID,
          description: closureText,
        }),
      });

      expect(res.status).toBe(201);
      const callData = mockPrisma.placeObservation.create.mock.calls[0][0].data;
      expect(callData.description).toBe(closureText);
      expect(callData.name).toBeUndefined();
    });

    it('Relocation correction preserves latitude, longitude and description without setting name', async () => {
      const relocText = 'تصحيح موقع جغرافي: 15.9189, 43.2081';
      const res = await app.request('/v1/discovery/community-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: MOCK_PLACE_ID,
          latitude: 15.9189,
          longitude: 43.2081,
          description: relocText,
        }),
      });

      expect(res.status).toBe(201);
      const callData = mockPrisma.placeObservation.create.mock.calls[0][0].data;
      expect(callData.latitude).toBe(15.9189);
      expect(callData.longitude).toBe(43.2081);
      expect(callData.description).toBe(relocText);
      expect(callData.name).toBeUndefined();
    });
  });

  // ─────────────────────────────────────────────────────────────────────────────
  // P0-3: Anonymous Correction & Route Security Verification
  // ─────────────────────────────────────────────────────────────────────────────
  describe('P0-3 — Anonymous Correction & Security Boundaries', () => {
    it('allows anonymous access to POST /v1/discovery/community-report (201 Created)', async () => {
      const res = await app.request('/v1/discovery/community-report', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          placeId: MOCK_PLACE_ID,
          phone: '+967 771 999 000',
        }),
      });

      expect(res.status).toBe(201);
    });

    it('strictly blocks unauthenticated access to system route POST /v1/discovery/ingest (401 Unauthorized)', async () => {
      const res = await app.request('/v1/discovery/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          dataSourceId: MOCK_SYSTEM_DS_ID,
          name: 'Unauthorized Ingest Attempt',
        }),
      });

      expect(res.status).toBe(401);
    });
  });
});
