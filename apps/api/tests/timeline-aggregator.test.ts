/**
 * WAYNAH-SLICE4E.2 — Place Timeline Aggregator & Service Design E2E Tests
 *
 * Verifies:
 * 1. Authorization: 401 unauthenticated, 403 unauthorized, 200 authorized admin
 * 2. Place: 404 for unknown place, PLACE_CREATED event present
 * 3. Observation: observation events generated with accurate timestamps, sources, and scores
 * 4. Conflict: CONFLICT_CREATED present, CONFLICT_RESOLVED present ONLY if resolvedAt is set
 * 5. BranchClaim: BRANCH_CLAIM_SUBMITTED and BRANCH_CLAIM_APPROVED/REJECTED events with actors and statuses
 * 6. Business relationship: Approved claims reflect linked business; unlinked state does not fabricate unlink history
 * 7. Ordering: Deterministic ordering by timestamp DESC with stable tie-breaker rules
 * 8. Regression safety: Zero DB mutations during timeline reads
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import { aggregatePlaceTimeline } from '../src/domain/admin/timeline-aggregator.js';
import type { PrismaClient } from '@waynah/database';

const MOCK_PLACE_ID = 'place-4e2-001';
const MOCK_CATEGORY_ID = 'cat-4e2-001';
const MOCK_DISTRICT_ID = 'dist-4e2-001';
const MOCK_GOVERNORATE_ID = 'gov-4e2-001';
const MOCK_BUSINESS_ID = 'biz-4e2-001';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();

  const mockPlace = {
    id: MOCK_PLACE_ID,
    nameAr: 'صيدلية النور الممتازة',
    nameEn: 'Al-Noor Premium Pharmacy',
    slug: 'al-noor-pharmacy-abs',
    description: 'صيدلية نموذجية توفر الخدمات الطبية',
    address: 'عبس — الشارع العام',
    phoneNumber: '+967 772 111 222',
    verificationStatus: 'VERIFIED',
    categoryId: MOCK_CATEGORY_ID,
    districtId: MOCK_DISTRICT_ID,
    businessId: MOCK_BUSINESS_ID,
    createdAt: new Date('2026-09-01T08:00:00Z'),
    updatedAt: new Date('2026-10-01T12:00:00Z'),
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
      id: 'loc-4e2',
      latitude: 15.9189,
      longitude: 43.2081,
    },
    observations: [
      {
        id: 'obs-001',
        placeId: MOCK_PLACE_ID,
        dataSourceId: 'ds-sys-1',
        name: 'صيدلية النور الممتازة',
        phone: '+967 772 111 222',
        confidenceScore: 0.9,
        status: 'AUTO_APPROVED',
        discoveredAt: new Date('2026-09-02T10:00:00Z'),
        createdAt: new Date('2026-09-02T10:00:00Z'),
        updatedAt: new Date('2026-09-02T10:00:00Z'),
        dataSource: {
          id: 'ds-sys-1',
          name: 'Partner Ingestion Feed',
          type: 'SYSTEM_INGESTION',
          reliabilityWeight: 0.9,
        },
      },
      {
        id: 'obs-002',
        placeId: MOCK_PLACE_ID,
        dataSourceId: 'ds-comm-1',
        name: 'صيدلية النور - فرع عبس',
        phone: '+967 772 999 000',
        confidenceScore: 0.0,
        status: 'PENDING',
        discoveredAt: new Date('2026-09-10T14:30:00Z'),
        createdAt: new Date('2026-09-10T14:30:00Z'),
        updatedAt: new Date('2026-09-10T14:30:00Z'),
        dataSource: {
          id: 'ds-comm-1',
          name: 'WAYNAH Community Reports',
          type: 'COMMUNITY_OBSERVATION',
          reliabilityWeight: 0.5,
        },
      },
    ],
    conflicts: [
      {
        id: 'conf-001',
        placeId: MOCK_PLACE_ID,
        description: 'اختلاف في رقم التواصل الملاحظ',
        baseObservationId: 'obs-001',
        conflictingObservationId: 'obs-002',
        status: 'RESOLVED',
        resolvedAt: new Date('2026-09-15T09:00:00Z'),
        createdAt: new Date('2026-09-11T11:00:00Z'),
        updatedAt: new Date('2026-09-15T09:00:00Z'),
      },
      {
        id: 'conf-002',
        placeId: MOCK_PLACE_ID,
        description: 'اختلاف في ساعات العمل الميدانية',
        baseObservationId: 'obs-001',
        conflictingObservationId: 'obs-002',
        status: 'OPEN',
        resolvedAt: null,
        createdAt: new Date('2026-09-20T16:00:00Z'),
        updatedAt: new Date('2026-09-20T16:00:00Z'),
      },
    ],
    branchClaims: [
      {
        id: 'claim-001',
        businessId: MOCK_BUSINESS_ID,
        placeId: MOCK_PLACE_ID,
        claimantId: 'user-claimant-1',
        reviewerId: 'admin-reviewer-1',
        status: 'APPROVED',
        notes: 'مرفق السجل التجاري الرسمي',
        rejectionReason: null,
        submittedAt: new Date('2026-09-05T12:00:00Z'),
        reviewedAt: new Date('2026-09-06T15:00:00Z'),
        createdAt: new Date('2026-09-05T12:00:00Z'),
        updatedAt: new Date('2026-09-06T15:00:00Z'),
        business: {
          id: MOCK_BUSINESS_ID,
          name: 'مجموعة النور الطبية',
          slug: 'al-noor-group',
        },
        claimant: {
          id: 'user-claimant-1',
          name: 'أحمد Claimant',
          email: 'claimant@waynah.com',
        },
        reviewer: {
          id: 'admin-reviewer-1',
          name: 'المراجع الإداري',
          email: 'reviewer@waynah.com',
        },
      },
    ],
    business: {
      id: MOCK_BUSINESS_ID,
      name: 'مجموعة النور الطبية',
      slug: 'al-noor-group',
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

describe('WAYNAH-SLICE4E.2 — Timeline Aggregator Unit & Integration Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;
  let adminToken: string;
  let normalUserToken: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register Admin
    const regAdmin = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'مدير النظام',
        email: 'admin-timeline@waynah.com',
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
        email: 'user-timeline@waynah.com',
        password: 'Password123!',
      }),
    });
    const dNormal = await regNormal.json();
    normalUserToken = dNormal.data.token;
  });

  describe('Authorization Rules', () => {
    it('1. Unauthenticated request returns 401 Unauthorized', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`);
      expect(res.status).toBe(401);
    });

    it('2. Unauthorized non-admin user returns 403 Forbidden', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${normalUserToken}` },
      });
      expect(res.status).toBe(403);
    });

    it('3. Authorized admin user retrieves place history with timeline (200 OK)', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.id).toBe(MOCK_PLACE_ID);
      expect(data.data.timeline).toBeDefined();
      expect(Array.isArray(data.data.timeline)).toBe(true);
    });
  });

  describe('Timeline Event Extraction & Aggregation Rules', () => {
    it('4. Returns 404 for non-existent Place ID', async () => {
      const res = await app.request('/v1/admin/places/invalid-id/history', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(res.status).toBe(404);
    });

    it('5. Extracts PLACE_CREATED event with UNKNOWN actor', () => {
      const mockPlace = {
        id: 'place-test',
        nameAr: 'اختبار المكان',
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };
      const timeline = aggregatePlaceTimeline(mockPlace);
      const createdEvent = timeline.find((e) => e.type === 'PLACE_CREATED');

      expect(createdEvent).toBeDefined();
      expect(createdEvent?.id).toBe('place-created:place-test');
      expect(createdEvent?.actor.type).toBe('UNKNOWN');
      expect(createdEvent?.source).toBe('CANONICAL_DATABASE');
    });

    it('6. Extracts OBSERVATION_RECORDED events preserving source and confidence score', () => {
      const mockPlace = {
        id: 'place-test',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        observations: [
          {
            id: 'obs-1',
            status: 'AUTO_APPROVED',
            confidenceScore: 0.85,
            discoveredAt: new Date('2026-01-02T10:00:00Z'),
            dataSource: { name: 'Partner Feed', type: 'SYSTEM_INGESTION' },
          },
        ],
      };
      const timeline = aggregatePlaceTimeline(mockPlace);
      const obsEvent = timeline.find((e) => e.id === 'observation:obs-1');

      expect(obsEvent).toBeDefined();
      expect(obsEvent?.type).toBe('OBSERVATION_RECORDED');
      expect(obsEvent?.source).toBe('Partner Feed');
      expect(obsEvent?.metadata?.confidenceScore).toBe(0.85);
      expect(obsEvent?.metadata?.dataSourceType).toBe('SYSTEM_INGESTION');
    });

    it('7. Extracts CONFLICT_CREATED and CONFLICT_RESOLVED without fabricating resolution for unresolved conflicts', () => {
      const mockPlace = {
        id: 'place-test',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        conflicts: [
          {
            id: 'conf-resolved',
            description: 'تعارض محلول',
            status: 'RESOLVED',
            createdAt: new Date('2026-01-03T10:00:00Z'),
            resolvedAt: new Date('2026-01-04T12:00:00Z'),
          },
          {
            id: 'conf-open',
            description: 'تعارض مفتوح',
            status: 'OPEN',
            createdAt: new Date('2026-01-05T10:00:00Z'),
            resolvedAt: null,
          },
        ],
      };
      const timeline = aggregatePlaceTimeline(mockPlace);

      const resolvedCreated = timeline.find((e) => e.id === 'conflict-created:conf-resolved');
      const resolvedDone = timeline.find((e) => e.id === 'conflict-resolved:conf-resolved');
      const openCreated = timeline.find((e) => e.id === 'conflict-created:conf-open');
      const openDone = timeline.find((e) => e.id === 'conflict-resolved:conf-open');

      expect(resolvedCreated).toBeDefined();
      expect(resolvedDone).toBeDefined();
      expect(openCreated).toBeDefined();
      expect(openDone).toBeUndefined(); // MUST NOT fabricate resolution!
    });

    it('8. Extracts BRANCH_CLAIM_SUBMITTED and BRANCH_CLAIM_APPROVED with actor preservation', () => {
      const mockPlace = {
        id: 'place-test',
        createdAt: new Date('2026-01-01T00:00:00Z'),
        branchClaims: [
          {
            id: 'claim-1',
            businessId: 'biz-1',
            claimantId: 'user-100',
            reviewerId: 'admin-200',
            status: 'APPROVED',
            submittedAt: new Date('2026-01-02T09:00:00Z'),
            reviewedAt: new Date('2026-01-02T15:00:00Z'),
            business: { id: 'biz-1', name: 'الشركة الأهلية' },
          },
        ],
      };

      const timeline = aggregatePlaceTimeline(mockPlace);
      const subEvent = timeline.find((e) => e.id === 'branch-claim-submitted:claim-1');
      const revEvent = timeline.find((e) => e.id === 'branch-claim-reviewed:claim-1');

      expect(subEvent).toBeDefined();
      expect(subEvent?.actor.id).toBe('user-100');
      expect(subEvent?.actor.type).toBe('USER');

      expect(revEvent).toBeDefined();
      expect(revEvent?.type).toBe('BRANCH_CLAIM_APPROVED');
      expect(revEvent?.actor.id).toBe('admin-200');
      expect(revEvent?.actor.type).toBe('ADMIN');
      expect(revEvent?.metadata?.linkedBusinessId).toBe('biz-1');
    });

    it('9. Does not fabricate historical unlink event when businessId is null', () => {
      const mockPlace = {
        id: 'place-unlinked',
        businessId: null,
        createdAt: new Date('2026-01-01T00:00:00Z'),
      };

      const timeline = aggregatePlaceTimeline(mockPlace);
      const unlinkEvents = timeline.filter((e) => e.type.includes('UNLINK'));

      expect(unlinkEvents.length).toBe(0);
    });

    it('10. Orders events chronologically (timestamp DESC) with deterministic tie-breaking', () => {
      const mockPlace = {
        id: 'place-order',
        createdAt: new Date('2026-01-01T10:00:00Z'),
        observations: [
          {
            id: 'obs-order-1',
            status: 'AUTO_APPROVED',
            discoveredAt: new Date('2026-01-02T10:00:00Z'),
          },
        ],
        conflicts: [
          {
            id: 'conf-order-1',
            createdAt: new Date('2026-01-02T10:00:00Z'),
          },
        ],
      };

      const timeline = aggregatePlaceTimeline(mockPlace);
      expect(timeline.length).toBe(3);

      // Verify timestamp DESC order
      for (let i = 0; i < timeline.length - 1; i++) {
        const current = new Date(timeline[i].timestamp).getTime();
        const next = new Date(timeline[i + 1].timestamp).getTime();
        expect(current).toBeGreaterThanOrEqual(next);
      }

      // Verify tie-breaker consistency for same timestamp (obs-order-1 vs conf-order-1)
      const sameTimeEvents = timeline.filter((e) => e.timestamp === new Date('2026-01-02T10:00:00Z').toISOString());
      expect(sameTimeEvents.length).toBe(2);
      expect(sameTimeEvents[0].type.localeCompare(sameTimeEvents[1].type)).toBeLessThanOrEqual(0);
    });
  });

  describe('Zero Database Mutation Assurance', () => {
    it('11. Timeline aggregation endpoints perform zero DB update calls', async () => {
      await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(mockPrisma.place.update).not.toHaveBeenCalled();
    });
  });
});
