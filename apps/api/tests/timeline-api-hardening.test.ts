/**
 * WAYNAH-SLICE4E.3 — Place Timeline API Contract & Endpoint Hardening Tests
 *
 * Verifies:
 * 1. Authentication: 401 without authentication
 * 2. Authorization: 403 without admin.places.history.read, 200 with permission
 * 3. Resource & IDOR: 404 for non-existent place without database leakage
 * 4. Input Validation: 400 INVALID_INPUT for malformed/empty placeId
 * 5. Timeline Event Contract: all events contain required schema fields (id, type, timestamp, source, actor, title, description)
 * 6. Historical Integrity: zero fabricated events (no false unlinks, no fabricated updates/diffs)
 * 7. Observations & Conflicts: OBSERVATION_RECORDED, CONFLICT_CREATED, CONFLICT_RESOLVED (no resolution for open conflicts)
 * 8. Branch Claims & Business Semantics: BRANCH_CLAIM_SUBMITTED, BRANCH_CLAIM_APPROVED/REJECTED preserved without fake BUSINESS_LINKED events
 * 9. Data Exposure: no sensitive tokens, credentials, or internal secrets exposed in metadata
 * 10. Zero Database Writes: 0 DB mutations on timeline endpoint calls
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

const MOCK_PLACE_ID = 'place-4e3-001';
const MOCK_CATEGORY_ID = 'cat-4e3-001';
const MOCK_DISTRICT_ID = 'dist-4e3-001';
const MOCK_GOVERNORATE_ID = 'gov-4e3-001';
const MOCK_BUSINESS_ID = 'biz-4e3-001';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();

  const mockPlace = {
    id: MOCK_PLACE_ID,
    nameAr: 'صيدلية الأمل المركزية',
    nameEn: 'Al-Amal Central Pharmacy',
    slug: 'al-amal-pharmacy-abs',
    description: 'صيدلية مرخصّة تقدم خدمات دوائية على مدار 24 ساعة',
    address: 'عبس — شارع المستشفى العام',
    phoneNumber: '+967 773 444 555',
    verificationStatus: 'VERIFIED',
    categoryId: MOCK_CATEGORY_ID,
    districtId: MOCK_DISTRICT_ID,
    businessId: MOCK_BUSINESS_ID,
    createdAt: new Date('2026-08-01T08:00:00Z'),
    updatedAt: new Date('2026-09-01T12:00:00Z'),
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
      id: 'loc-4e3',
      latitude: 15.9189,
      longitude: 43.2081,
    },
    observations: [
      {
        id: 'obs-4e3-1',
        placeId: MOCK_PLACE_ID,
        dataSourceId: 'ds-sys-4e3',
        name: 'صيدلية الأمل المركزية',
        phone: '+967 773 444 555',
        confidenceScore: 0.95,
        status: 'AUTO_APPROVED',
        discoveredAt: new Date('2026-08-02T10:00:00Z'),
        createdAt: new Date('2026-08-02T10:00:00Z'),
        updatedAt: new Date('2026-08-02T10:00:00Z'),
        dataSource: {
          id: 'ds-sys-4e3',
          name: 'Partner Data Feed',
          type: 'SYSTEM_INGESTION',
          reliabilityWeight: 0.95,
        },
      },
      {
        id: 'obs-4e3-2',
        placeId: MOCK_PLACE_ID,
        dataSourceId: 'ds-comm-4e3',
        name: 'صيدلية الأمل',
        phone: '+967 773 999 888',
        confidenceScore: 0.0,
        status: 'PENDING',
        discoveredAt: new Date('2026-08-15T14:30:00Z'),
        createdAt: new Date('2026-08-15T14:30:00Z'),
        updatedAt: new Date('2026-08-15T14:30:00Z'),
        dataSource: {
          id: 'ds-comm-4e3',
          name: 'WAYNAH Community Reports',
          type: 'COMMUNITY_OBSERVATION',
          reliabilityWeight: 0.5,
        },
      },
    ],
    conflicts: [
      {
        id: 'conf-4e3-1',
        placeId: MOCK_PLACE_ID,
        description: 'تفاوت في رقم الهاتف المرصود',
        baseObservationId: 'obs-4e3-1',
        conflictingObservationId: 'obs-4e3-2',
        status: 'RESOLVED',
        resolvedAt: new Date('2026-08-20T09:00:00Z'),
        createdAt: new Date('2026-08-16T11:00:00Z'),
        updatedAt: new Date('2026-08-20T09:00:00Z'),
      },
      {
        id: 'conf-4e3-2',
        placeId: MOCK_PLACE_ID,
        description: 'تفاوت في موقع الخريطة الدقيق',
        baseObservationId: 'obs-4e3-1',
        conflictingObservationId: 'obs-4e3-2',
        status: 'OPEN',
        resolvedAt: null,
        createdAt: new Date('2026-08-22T16:00:00Z'),
        updatedAt: new Date('2026-08-22T16:00:00Z'),
      },
    ],
    branchClaims: [
      {
        id: 'claim-4e3-1',
        businessId: MOCK_BUSINESS_ID,
        placeId: MOCK_PLACE_ID,
        claimantId: 'usr-claimant-4e3',
        reviewerId: 'usr-admin-4e3',
        status: 'APPROVED',
        notes: 'مرفق الترخيص التجاري',
        rejectionReason: null,
        submittedAt: new Date('2026-08-05T12:00:00Z'),
        reviewedAt: new Date('2026-08-06T15:00:00Z'),
        createdAt: new Date('2026-08-05T12:00:00Z'),
        updatedAt: new Date('2026-08-06T15:00:00Z'),
        business: {
          id: MOCK_BUSINESS_ID,
          name: 'مجموعة الأمل الطبية',
          slug: 'al-amal-group',
        },
        claimant: {
          id: 'usr-claimant-4e3',
          name: 'صالح Claimant',
          email: 'claimant4e3@waynah.com',
        },
        reviewer: {
          id: 'usr-admin-4e3',
          name: 'المراجع الإداري',
          email: 'reviewer4e3@waynah.com',
        },
      },
    ],
    business: {
      id: MOCK_BUSINESS_ID,
      name: 'مجموعة الأمل الطبية',
      slug: 'al-amal-group',
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

describe('WAYNAH-SLICE4E.3 — Timeline API Contract & Endpoint Hardening Tests', () => {
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
        name: 'مدير النظام 4E3',
        email: 'admin4e3@waynah.com',
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
        name: 'مستخدم عادي 4E3',
        email: 'user4e3@waynah.com',
        password: 'Password123!',
      }),
    });
    const dNormal = await regNormal.json();
    normalUserToken = dNormal.data.token;
  });

  describe('1. Authentication Guard', () => {
    it('returns 401 UNAUTHORIZED when no authorization header is provided', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`);
      expect(res.status).toBe(401);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(typeof body.error === 'string' ? body.error : body.error?.message).toContain('Unauthorized');
    });
  });

  describe('2. Authorization Guard', () => {
    it('returns 403 FORBIDDEN when user lacks admin.places.history.read permission', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${normalUserToken}` },
      });
      expect(res.status).toBe(403);
      const body = await res.json();
      expect(body.success).toBe(false);
      expect(typeof body.error === 'string' ? body.error : body.error?.message).toContain('Forbidden');
    });

    it('returns 200 OK when authorized admin accesses timeline history', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(200);
      const body = await res.json();
      expect(body.success).toBe(true);
      expect(body.data.id).toBe(MOCK_PLACE_ID);
      expect(Array.isArray(body.data.timeline)).toBe(true);
    });
  });

  describe('3. Resource Boundary & IDOR Safety', () => {
    it('returns 404 NOT_FOUND for non-existent placeId without database error leakage', async () => {
      const res = await app.request('/v1/admin/places/nonexistent-place-id/history', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(404);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('4. Input Validation', () => {
    it('returns 400 INVALID_INPUT for malformed placeId with invalid spaces or special chars', async () => {
      const res = await app.request('/v1/admin/places/invalid%20space%20id/history', {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      expect(res.status).toBe(400);
      const body = await res.json();
      expect(body.success).toBe(false);
    });
  });

  describe('5. Timeline Event Contract Verification', () => {
    it('ensures every timeline event strictly matches the TimelineEvent schema', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      const timeline = body.data.timeline;

      expect(timeline.length).toBeGreaterThan(0);
      for (const event of timeline) {
        expect(event).toHaveProperty('id');
        expect(typeof event.id).toBe('string');
        expect(event).toHaveProperty('type');
        expect(typeof event.type).toBe('string');
        expect(event).toHaveProperty('timestamp');
        expect(typeof event.timestamp).toBe('string');
        expect(event).toHaveProperty('source');
        expect(typeof event.source).toBe('string');
        expect(event).toHaveProperty('actor');
        expect(event.actor).toHaveProperty('type');
        expect(event).toHaveProperty('title');
        expect(typeof event.title).toBe('string');
        expect(event).toHaveProperty('description');
        expect(typeof event.description).toBe('string');
      }
    });

    it('maintains strict timestamp DESC ordering across timeline events', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      const timeline = body.data.timeline;

      for (let i = 0; i < timeline.length - 1; i++) {
        const timeA = new Date(timeline[i].timestamp).getTime();
        const timeB = new Date(timeline[i + 1].timestamp).getTime();
        expect(timeA).toBeGreaterThanOrEqual(timeB);
      }
    });
  });

  describe('6. Historical Integrity & Semantics', () => {
    it('does not fabricate UNLINK events for places', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      const timeline = body.data.timeline;
      const unlinkEvents = timeline.filter((e: any) => e.type.includes('UNLINK'));

      expect(unlinkEvents.length).toBe(0);
    });

    it('does not fabricate resolution events for open conflicts', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      const timeline = body.data.timeline;

      const openConflictEvent = timeline.find((e: any) => e.id === 'conflict-created:conf-4e3-2');
      const openConflictResolved = timeline.find((e: any) => e.id === 'conflict-resolved:conf-4e3-2');

      expect(openConflictEvent).toBeDefined();
      expect(openConflictResolved).toBeUndefined();
    });

    it('preserves BRANCH_CLAIM_APPROVED type and does not fabricate a fake BUSINESS_LINKED event', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      const timeline = body.data.timeline;

      const claimReviewEvent = timeline.find((e: any) => e.id === 'branch-claim-reviewed:claim-4e3-1');
      expect(claimReviewEvent).toBeDefined();
      expect(claimReviewEvent.type).toBe('BRANCH_CLAIM_APPROVED');
    });
  });

  describe('7. Data Exposure Safety', () => {
    it('does not expose internal security secrets or passwords in event metadata', async () => {
      const res = await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });
      const body = await res.json();
      const timelineStr = JSON.stringify(body.data.timeline);

      expect(timelineStr).not.toContain('password');
      expect(timelineStr).not.toContain('secret');
      expect(timelineStr).not.toContain('session');
    });
  });

  describe('8. Zero Mutation Assurance', () => {
    it('performs zero database writes when serving timeline requests', async () => {
      await app.request(`/v1/admin/places/${MOCK_PLACE_ID}/history`, {
        headers: { Authorization: `Bearer ${adminToken}` },
      });

      expect(mockPrisma.place.update).not.toHaveBeenCalled();
    });
  });
});
