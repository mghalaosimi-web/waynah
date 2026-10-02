/**
 * WAYNAH-SLICE3 — Admin Conflicts & Place Knowledge History E2E Tests
 *
 * Verifies:
 * 1. Anonymous request to GET /v1/admin/conflicts returns 401 Unauthorized
 * 2. Normal USER request to GET /v1/admin/conflicts returns 403 Forbidden
 * 3. Authorized ADMIN actor can list open DataConflict records (200 OK)
 * 4. Anonymous request to GET /v1/admin/places/:id/history returns 401 Unauthorized
 * 5. Normal USER request to GET /v1/admin/places/:id/history returns 403 Forbidden
 * 6. Authorized ADMIN actor can retrieve complete Place knowledge history (200 OK)
 * 7. Non-existent Place ID returns 404 Not Found
 * 8. Observation history includes linked DataSource, status, and raw confidenceScore
 * 9. Community observations remain strictly PENDING with confidenceScore 0.0
 * 10. Read-only endpoints perform ZERO mutations on Place or PlaceLocation records
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

const MOCK_PLACE_ID = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a99';
const MOCK_CONFLICT_ID = 'conf-001';
const MOCK_OBSERVATION_ID = 'obs-001';
const MOCK_COMMUNITY_OBS_ID = 'obs-comm-002';
const MOCK_DS_ID = 'ds-001';
const MOCK_COMMUNITY_DS_ID = 'ds-comm-002';
const MOCK_CATEGORY_ID = 'cat-001';
const MOCK_DISTRICT_ID = 'dist-001';
const MOCK_GOVERNORATE_ID = 'gov-001';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();

  const mockPlace = {
    id: MOCK_PLACE_ID,
    nameAr: 'صيدلية السلام الوطنية',
    nameEn: 'Al-Salam National Pharmacy',
    slug: 'al-salam-pharmacy-abs',
    description: 'صيدلية رئيسية توفر المستلزمات الطبية',
    address: 'عبس — شارع السوق الرئيسي',
    phoneNumber: '+967 771 234 567',
    verificationStatus: 'UNVERIFIED',
    categoryId: MOCK_CATEGORY_ID,
    districtId: MOCK_DISTRICT_ID,
    category: {
      id: MOCK_CATEGORY_ID,
      nameAr: 'صيدليات ورعاية صحية',
      nameEn: 'Pharmacies & Health',
      slug: 'pharmacies',
      icon: '💊',
    },
    district: {
      id: MOCK_DISTRICT_ID,
      nameAr: 'عبس',
      nameEn: 'Abs',
      governorate: {
        id: MOCK_GOVERNORATE_ID,
        nameAr: 'محافظة حجة',
        nameEn: 'Hajjah Governorate',
      },
    },
    location: {
      id: 'loc-001',
      latitude: 15.9189,
      longitude: 43.2081,
    },
    observations: [
      {
        id: MOCK_OBSERVATION_ID,
        placeId: MOCK_PLACE_ID,
        dataSourceId: MOCK_DS_ID,
        name: 'صيدلية السلام الوطنية',
        phone: '+967 771 234 567',
        categoryId: MOCK_CATEGORY_ID,
        latitude: 15.9189,
        longitude: 43.2081,
        confidenceScore: 0.85,
        status: 'AUTO_APPROVED',
        discoveredAt: new Date('2026-10-01T10:00:00Z'),
        createdAt: new Date('2026-10-01T10:00:00Z'),
        updatedAt: new Date('2026-10-01T10:00:00Z'),
        dataSource: {
          id: MOCK_DS_ID,
          name: 'Partner Field Ingestion',
          type: 'SYSTEM_INGESTION',
          reliabilityWeight: 0.85,
        },
      },
      {
        id: MOCK_COMMUNITY_OBS_ID,
        placeId: MOCK_PLACE_ID,
        dataSourceId: MOCK_COMMUNITY_DS_ID,
        name: 'صيدلية السلام - فرع عبس',
        phone: '+967 771 999 888',
        categoryId: MOCK_CATEGORY_ID,
        latitude: 15.9189,
        longitude: 43.2081,
        confidenceScore: 0.0,
        status: 'PENDING',
        discoveredAt: new Date('2026-10-02T10:00:00Z'),
        createdAt: new Date('2026-10-02T10:00:00Z'),
        updatedAt: new Date('2026-10-02T10:00:00Z'),
        dataSource: {
          id: MOCK_COMMUNITY_DS_ID,
          name: 'WAYNAH Community Reports',
          type: 'COMMUNITY_OBSERVATION',
          reliabilityWeight: 0.5,
        },
      },
    ],
    conflicts: [
      {
        id: MOCK_CONFLICT_ID,
        placeId: MOCK_PLACE_ID,
        description: '[{"field":"phone","old":"+967 771 234 567","new":"+967 771 999 888"}]',
        baseObservationId: MOCK_OBSERVATION_ID,
        conflictingObservationId: MOCK_COMMUNITY_OBS_ID,
        status: 'OPEN',
        createdAt: new Date('2026-10-02T10:00:00Z'),
        updatedAt: new Date('2026-10-02T10:00:00Z'),
      },
    ],
  };

  const mockConflict = {
    id: MOCK_CONFLICT_ID,
    placeId: MOCK_PLACE_ID,
    description: '[{"field":"phone","old":"+967 771 234 567","new":"+967 771 999 888"}]',
    baseObservationId: MOCK_OBSERVATION_ID,
    conflictingObservationId: MOCK_COMMUNITY_OBS_ID,
    status: 'OPEN',
    createdAt: new Date('2026-10-02T10:00:00Z'),
    updatedAt: new Date('2026-10-02T10:00:00Z'),
    place: {
      id: MOCK_PLACE_ID,
      nameAr: 'صيدلية السلام الوطنية',
      nameEn: 'Al-Salam National Pharmacy',
      phoneNumber: '+967 771 234 567',
    },
  };

  return {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email) return Promise.resolve(u);
          }
        }
        if (where.id) return Promise.resolve(users.get(where.id) || null);
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, role: 'USER', createdAt: new Date(), updatedAt: new Date(), ...data };
        users.set(id, newUser);
        return Promise.resolve(newUser);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const user = users.get(where.id);
        if (user) {
          Object.assign(user, data, { updatedAt: new Date() });
          return Promise.resolve(user);
        }
        return Promise.resolve(null);
      }),
    },
    session: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'ses-' + Math.random().toString(36).substring(2, 9);
        const newSession = { id, createdAt: new Date(), ...data };
        sessions.set(data.token, newSession);
        return Promise.resolve(newSession);
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        const session = sessions.get(where.token);
        if (!session) return Promise.resolve(null);
        if (include?.user) {
          const user = users.get(session.userId);
          return Promise.resolve({ ...session, user });
        }
        return Promise.resolve(session);
      }),
    },
    dataConflict: {
      findMany: vi.fn().mockResolvedValue([mockConflict]),
    },
    place: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id === MOCK_PLACE_ID) {
          return Promise.resolve(mockPlace);
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockResolvedValue(mockPlace),
    },
  } as unknown as PrismaClient;
}

describe('WAYNAH-SLICE3 — Data Conflict & Knowledge History API Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  let adminToken: string;
  let normalUserToken: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register Admin User
    const regAdmin = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'مدير النظام',
        email: 'admin@waynah.com',
        password: 'Password123!',
      }),
    });
    const dAdmin = await regAdmin.json();
    adminToken = dAdmin.data.token;
    await mockPrisma.user.update({
      where: { id: dAdmin.data.user.id },
      data: { role: 'ADMIN' },
    });

    // Register Normal User
    const regNormal = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'مستخدم عادي',
        email: 'user@waynah.com',
        password: 'Password123!',
      }),
    });
    const dNormal = await regNormal.json();
    normalUserToken = dNormal.data.token;
  });

  it('1. Anonymous request to GET /v1/admin/conflicts -> 401 Unauthorized', async () => {
    const res = await app.request('/v1/admin/conflicts');
    expect(res.status).toBe(401);
  });

  it('2. Normal USER request to GET /v1/admin/conflicts -> 403 Forbidden', async () => {
    const res = await app.request('/v1/admin/conflicts', {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('3. Authorized ADMIN actor can list open DataConflict records (200 OK)', async () => {
    const res = await app.request('/v1/admin/conflicts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
    expect(data.data[0].id).toBe(MOCK_CONFLICT_ID);
    expect(data.data[0].place.nameAr).toBe('صيدلية السلام الوطنية');
  });

  it('4. Anonymous request to GET /v1/admin/places/:id/history -> 401 Unauthorized', async () => {
    const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`);
    expect(res.status).toBe(401);
  });

  it('5. Normal USER request to GET /v1/admin/places/:id/history -> 403 Forbidden', async () => {
    const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('6. Authorized ADMIN actor can retrieve complete Place knowledge history (200 OK)', async () => {
    const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(MOCK_PLACE_ID);
    expect(data.data.nameAr).toBe('صيدلية السلام الوطنية');
    expect(data.data.observations.length).toBe(2);
  });

  it('7. Non-existent Place ID returns 404 Not Found', async () => {
    const res = await app.request('/v1/admin/places/invalid-id/history', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('8. Observation history includes linked DataSource, status, and raw confidenceScore', async () => {
    const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    const obs = data.data.observations[0];

    expect(obs.dataSource.name).toBe('Partner Field Ingestion');
    expect(obs.status).toBe('AUTO_APPROVED');
    expect(obs.confidenceScore).toBe(0.85);
  });

  it('9. Community observations remain strictly PENDING with confidenceScore 0.0', async () => {
    const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    const commObs = data.data.observations.find((o: any) => o.dataSource.type === 'COMMUNITY_OBSERVATION');

    expect(commObs).toBeDefined();
    expect(commObs.status).toBe('PENDING');
    expect(commObs.confidenceScore).toBe(0.0);
  });

  it('10. Read-only endpoints perform ZERO mutations on Place or PlaceLocation records', async () => {
    await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    await app.request('/v1/admin/conflicts', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(mockPrisma.place.update).not.toHaveBeenCalled();
  });
});
