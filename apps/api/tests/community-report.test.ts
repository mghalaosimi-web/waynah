/**
 * WAYNAH-SLICE2 — Community Observation Public Endpoint & Provenance Tests
 *
 * Verifies:
 * 1. Public anonymous callers can submit POST /v1/discovery/community-report without API keys (201 Created)
 * 2. Persisted observation status remains strictly PENDING
 * 3. Persisted observation confidenceScore remains strictly 0.0 (unverified baseline)
 * 4. Master Place records are NEVER created or updated during community report ingestion
 * 5. Community DataSource ("WAYNAH Community Reports") is bound server-side with reliabilityWeight = 0.5
 * 6. Public callers CANNOT spoof provenance or specify dataSourceId
 * 7. Server returns actual server-generated observation receipt ID
 * 8. Invalid community payloads are rejected with 400 Bad Request
 * 9. Protected system ingestion route (POST /v1/discovery/ingest) remains strictly protected (401 Unauthorized)
 * 10. Public endpoint attaches rate limiting headers
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server';
import type { PrismaClient } from '@waynah/database';

const MOCK_COMMUNITY_DS_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';
const MOCK_OBSERVATION_ID = 'obs-comm-123';
const MOCK_PLACE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
const MOCK_CATEGORY_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22';

function makeMockPrisma() {
  const mock: any = {
    $transaction: vi.fn((fn) => fn(mock)),
    $queryRaw: vi.fn().mockResolvedValue([{ district_id: 'dist-001' }]),
    $executeRaw: vi.fn().mockResolvedValue(1),
    placeObservation: {
      findUnique: vi.fn().mockResolvedValue({
        id: MOCK_OBSERVATION_ID,
        dataSourceId: MOCK_COMMUNITY_DS_ID,
        placeId: MOCK_PLACE_ID,
        name: 'Community Corrected Name',
        confidenceScore: 0.0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      create: vi.fn().mockResolvedValue({
        id: MOCK_OBSERVATION_ID,
        dataSourceId: MOCK_COMMUNITY_DS_ID,
        placeId: MOCK_PLACE_ID,
        name: 'Community Corrected Name',
        phone: '+967 771 234 567',
        categoryId: MOCK_CATEGORY_ID,
        latitude: 15.9189,
        longitude: 43.2081,
        confidenceScore: 0.0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: MOCK_OBSERVATION_ID,
        status: 'PENDING',
        confidenceScore: 0.0,
      }),
    },
    dataConflict: {
      findMany: vi.fn().mockResolvedValue([]),
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
      findMany: vi.fn().mockResolvedValue([{ id: MOCK_PLACE_ID, nameAr: 'صيدلية السلام', phoneNumber: '+967 771 234 567' }]),
    },
    dataSource: {
      findFirst: vi.fn().mockResolvedValue({ id: MOCK_COMMUNITY_DS_ID, name: 'WAYNAH Community Reports', reliabilityWeight: 0.5 }),
      findUnique: vi.fn().mockResolvedValue({ id: MOCK_COMMUNITY_DS_ID, name: 'WAYNAH Community Reports', reliabilityWeight: 0.5 }),
      create: vi.fn().mockResolvedValue({ id: MOCK_COMMUNITY_DS_ID, name: 'WAYNAH Community Reports', reliabilityWeight: 0.5 }),
    },
  };
  return mock as PrismaClient;
}

describe('Slice 2 — Public Community Report Endpoint', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  it('1. allows anonymous public access to POST /v1/discovery/community-report (201 Created)', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        phone: '+967 771 234 567',
        latitude: 15.9189,
        longitude: 43.2081,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.observation.id).toBe(MOCK_OBSERVATION_ID);
  });

  it('2. persists observation in PENDING status', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        phone: '+967 771 234 567',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.observation.status).toBe('PENDING');
  });

  it('3. persists observation with unverified baseline confidenceScore === 0.0', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        name: 'اسم المكان المقترح',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.observation.confidenceScore).toBe(0.0);
  });

  it('4. does NOT mutate Place master record (no place creation or place update)', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        name: 'تحديث اسم غير معتمد تلقائياً',
        phone: '+967 770 000 111',
      }),
    });

    expect(res.status).toBe(201);
    expect(mockPrisma.place.create).not.toHaveBeenCalled();
    expect(mockPrisma.place.update).not.toHaveBeenCalled();
  });

  it('5. binds Community DataSource server-side and queries data_sources', async () => {
    await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        name: 'اسم الصيدلية المعدل',
        latitude: 15.9189,
        longitude: 43.2081,
      }),
    });

    expect(mockPrisma.dataSource.findFirst).toHaveBeenCalledWith({
      where: { name: 'WAYNAH Community Reports' },
    });
  });

  it('6. prevents provenance spoofing when caller attempts to supply arbitrary dataSourceId', async () => {
    const spoofedDsId = 'b1ffbc99-9c0b-4ef8-bb6d-6bb9bd380bbb';
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataSourceId: spoofedDsId,
        placeId: MOCK_PLACE_ID,
        phone: '+967 771 999 888',
      }),
    });

    expect(res.status).toBe(201);
    expect(mockPrisma.placeObservation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          dataSourceId: MOCK_COMMUNITY_DS_ID,
        }),
      })
    );
  });

  it('7. returns server-generated observation receipt ID', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        phone: '+967 771 234 567',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.observationId).toBe(MOCK_OBSERVATION_ID);
    expect(data.data.observation.id).toBe(MOCK_OBSERVATION_ID);
  });

  it('8. rejects invalid community report payloads with 400 Bad Request', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        // Empty object: fails communityReportSchema refine rule requiring at least one attribute
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('9. preserves 401 Unauthorized requirement on system POST /v1/discovery/ingest', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataSourceId: MOCK_COMMUNITY_DS_ID,
        name: 'System Observation',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('10. attaches rate limiting headers on public community report endpoint', async () => {
    const res = await app.request('/v1/discovery/community-report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: MOCK_PLACE_ID,
        phone: '+967 771 234 567',
      }),
    });

    expect(res.headers.get('x-ratelimit-limit')).not.toBeNull();
    expect(res.headers.get('x-ratelimit-remaining')).not.toBeNull();
  });
});

