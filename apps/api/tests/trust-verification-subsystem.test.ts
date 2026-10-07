import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createServer } from '../src/server.js';

function makeMockPrisma() {
  const store = {
    users: new Map<string, any>(),
    sessions: new Map<string, any>(),
    businesses: new Map<string, any>(),
    businessVerifications: new Map<string, any>(),
    verificationLogs: new Map<string, any>(),
    places: new Map<string, any>(),
    placeLocations: new Map<string, any>(),
    dataSources: new Map<string, any>(),
    placeObservations: new Map<string, any>(),
    reviews: new Map<string, any>(),
    products: new Map<string, any>(),
    services: new Map<string, any>(),
    members: new Map<string, any>(),
    orders: new Map<string, any>(),
    bookings: new Map<string, any>(),
  };

  return {
    store,
    $queryRaw: vi.fn().mockResolvedValue([{ ok: true }]),
    user: {
      findUnique: vi.fn(async ({ where }) => store.users.get(where.id) || null),
      create: vi.fn(async ({ data }) => {
        const id = 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, role: 'USER', emailVerified: false, createdAt: new Date(), updatedAt: new Date(), ...data };
        store.users.set(id, newUser);
        return newUser;
      }),
    },
    session: {
      findUnique: vi.fn(async ({ where, include }) => {
        const session = store.sessions.get(where.token);
        if (!session) return null;
        if (include?.user) {
          const u = store.users.get(session.userId);
          return { ...session, user: u };
        }
        return session;
      }),
      update: vi.fn(async ({ where, data }) => {
        const s = store.sessions.get(where.token);
        if (s) Object.assign(s, data);
        return s;
      }),
      delete: vi.fn(async () => true),
    },
    business: {
      findUnique: vi.fn(async ({ where, include }) => {
        const b = store.businesses.get(where.id);
        if (!b) return null;

        if (include) {
          const result = { ...b };
          if (include.verification) {
            result.verification = store.businessVerifications.get(b.id) || null;
          }
          if (include.places) {
            result.places = Array.from(store.places.values()).filter((p) => p.businessId === b.id);
          }
          if (include.products) {
            result.products = Array.from(store.products.values()).filter((p) => p.businessId === b.id);
          }
          if (include.services) {
            result.services = Array.from(store.services.values()).filter((s) => s.businessId === b.id);
          }
          if (include.members) {
            result.members = Array.from(store.members.values()).filter((m) => m.businessId === b.id);
          }
          if (include.reviews) {
            result.reviews = Array.from(store.reviews.values()).filter((r) => r.businessId === b.id && r.status === 'PUBLISHED');
          }
          return result;
        }
        return b;
      }),
    },
    businessVerification: {
      findFirst: vi.fn(async ({ where }) => {
        for (const v of store.businessVerifications.values()) {
          if (where.OR) {
            const match = where.OR.some((cond: any) => cond.id === v.id || cond.businessId === v.businessId);
            if (match) return v;
          }
        }
        return null;
      }),
      update: vi.fn(async ({ where, data }) => {
        let v = store.businessVerifications.get(where.id);
        if (!v) {
          for (const item of store.businessVerifications.values()) {
            if (item.id === where.id || item.businessId === where.id) {
              v = item;
              break;
            }
          }
        }
        if (v) Object.assign(v, data, { updatedAt: new Date() });
        return v;
      }),
    },
    verificationLog: {
      create: vi.fn(async ({ data }) => {
        const id = 'vlog-' + Math.random().toString(36).substring(2, 9);
        const logItem = { id, createdAt: new Date(), ...data };
        store.verificationLogs.set(id, logItem);
        return logItem;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.verificationLogs.values()).filter((vl) => vl.businessId === where.businessId);
      }),
    },
    place: {
      findUnique: vi.fn(async ({ where, include }) => {
        const p = store.places.get(where.id);
        if (!p) return null;
        if (include) {
          const result = { ...p };
          if (include.location) {
            result.location = store.placeLocations.get(p.id) || null;
          }
          if (include.observations) {
            result.observations = Array.from(store.placeObservations.values()).filter((o) => o.placeId === p.id);
          }
          if (include.reviews) {
            result.reviews = Array.from(store.reviews.values()).filter((r) => r.placeId === p.id && r.status === 'PUBLISHED');
          }
          return result;
        }
        return p;
      }),
    },
    dataSource: {
      findUnique: vi.fn(async ({ where }) => store.dataSources.get(where.id) || null),
    },
    placeObservation: {
      create: vi.fn(async ({ data }) => {
        const id = 'obs-' + Math.random().toString(36).substring(2, 9);
        const item = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        store.placeObservations.set(id, item);
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        let list = Array.from(store.placeObservations.values());
        if (where?.placeId) list = list.filter((o) => o.placeId === where.placeId);
        if (where?.status) list = list.filter((o) => o.status === where.status);
        return list;
      }),
      count: vi.fn(async ({ where }) => {
        let list = Array.from(store.placeObservations.values());
        if (where?.placeId) {
          if (where.placeId.in) list = list.filter((o) => where.placeId.in.includes(o.placeId));
          else list = list.filter((o) => o.placeId === where.placeId);
        }
        return list.length;
      }),
      findUnique: vi.fn(async ({ where }) => store.placeObservations.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.placeObservations.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
    },
    review: {
      create: vi.fn(async ({ data }) => {
        const id = 'rev-' + Math.random().toString(36).substring(2, 9);
        const item = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        store.reviews.set(id, item);
        return item;
      }),
      findFirst: vi.fn(async ({ where }) => {
        for (const r of store.reviews.values()) {
          let match = true;
          if (where.userId && r.userId !== where.userId) match = false;
          if (where.orderId && r.orderId !== where.orderId) match = false;
          if (where.bookingId && r.bookingId !== where.bookingId) match = false;
          if (match) return r;
        }
        return null;
      }),
      findMany: vi.fn(async ({ where }) => {
        let list = Array.from(store.reviews.values());
        if (where?.businessId) list = list.filter((r) => r.businessId === where.businessId);
        if (where?.placeId) list = list.filter((r) => r.placeId === where.placeId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list;
      }),
      count: vi.fn(async ({ where }) => {
        let list = Array.from(store.reviews.values());
        if (where?.businessId) list = list.filter((r) => r.businessId === where.businessId);
        if (where?.status) list = list.filter((r) => r.status === where.status);
        return list.length;
      }),
      findUnique: vi.fn(async ({ where }) => store.reviews.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const r = store.reviews.get(where.id);
        if (r) Object.assign(r, data, { updatedAt: new Date() });
        return r;
      }),
      delete: vi.fn(async ({ where }) => {
        const r = store.reviews.get(where.id);
        if (r) store.reviews.delete(where.id);
        return r;
      }),
    },
  };
}

describe('WAYNAH-PHASE-8 — Trust, Verification & Review Subsystem Tests', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let app: ReturnType<typeof createServer>;

  let userToken: string;
  let userId: string;

  let adminToken: string;
  let adminId: string;

  let testBusinessId: string;
  let testPlaceId: string;
  let testDataSourceId: string;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma as any);

    const validExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Setup Customer User
    userId = 'usr-cust-101';
    userToken = 'token-cust-101';
    mockPrisma.store.users.set(userId, { id: userId, role: 'USER', email: 'cust@waynah.local', name: 'Customer User' });
    mockPrisma.store.sessions.set(userToken, { id: 'ses-101', userId, token: userToken, expiresAt: validExpiry });

    // Setup Admin User
    adminId = 'usr-admin-202';
    adminToken = 'token-admin-202';
    mockPrisma.store.users.set(adminId, { id: adminId, role: 'ADMIN', email: 'admin@waynah.local', name: 'System Admin' });
    mockPrisma.store.sessions.set(adminToken, { id: 'ses-202', userId: adminId, token: adminToken, expiresAt: validExpiry });

    // Setup Business & Verification
    testBusinessId = 'biz-trust-888';
    mockPrisma.store.businesses.set(testBusinessId, {
      id: testBusinessId,
      name: 'مؤسسة حجة للخدمات الطبية',
      slug: 'hajjah-med-services',
      description: 'مؤسسة متخصصة بتقديم الرعاية الصحية الأولية في محافظة حجة',
    });
    mockPrisma.store.businessVerifications.set(testBusinessId, {
      id: 'ver-888',
      businessId: testBusinessId,
      status: 'VERIFIED',
      submittedAt: new Date(),
      reviewedAt: new Date(),
    });

    // Setup Place & Location
    testPlaceId = 'plc-trust-999';
    mockPrisma.store.places.set(testPlaceId, {
      id: testPlaceId,
      nameAr: 'مركز حجة الطبي الرئيسي',
      businessId: testBusinessId,
      verificationStatus: 'VERIFIED',
    });
    mockPrisma.store.placeLocations.set(testPlaceId, {
      id: 'loc-999',
      placeId: testPlaceId,
      latitude: 15.69,
      longitude: 43.60,
    });

    // Setup DataSource
    testDataSourceId = 'src-field-01';
    mockPrisma.store.dataSources.set(testDataSourceId, {
      id: testDataSourceId,
      name: 'مسح الجودة الميداني - حجة',
      reliabilityWeight: 0.9,
    });
  });

  it('1. GET /v1/trust/businesses/:id returns calculated trust score and breakdown', async () => {
    const res = await app.request(`/v1/trust/businesses/${testBusinessId}`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.score).toBeGreaterThan(0);
    expect(data.data.verificationBonus).toBe(40);
    expect(data.data.dataCompletenessScore).toBeGreaterThanOrEqual(10);
  });

  it('2. Admin reviewing verification updates verification status and logs historical event (GAP-DB-02)', async () => {
    // Setup pending verification
    const pendingBizId = 'biz-pending-555';
    mockPrisma.store.businesses.set(pendingBizId, { id: pendingBizId, name: 'Pending Merchant' });
    mockPrisma.store.businessVerifications.set(pendingBizId, {
      id: 'ver-555',
      businessId: pendingBizId,
      status: 'PENDING',
      submittedAt: new Date(),
    });

    const res = await app.request(`/v1/admin/verifications/${pendingBizId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
      }),
    });

    expect(res.status).toBe(200);

    // Verify historical audit log entry (GAP-DB-02)
    const historyRes = await app.request(`/v1/trust/businesses/${pendingBizId}/verification/history`, {
      method: 'GET',
    });

    expect(historyRes.status).toBe(200);
    const historyData = await historyRes.json();
    expect(historyData.success).toBe(true);
    expect(historyData.data.length).toBeGreaterThanOrEqual(1);
    expect(historyData.data[0].action).toBe('APPROVE');
    expect(historyData.data[0].actorRole).toBe('ADMIN');
  });

  it('3. GET /v1/trust/places/:id returns place trust score and spatial breakdown', async () => {
    const res = await app.request(`/v1/trust/places/${testPlaceId}`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.verificationBonus).toBe(30);
    expect(data.data.locationScore).toBe(30);
  });

  it('4. POST /v1/reviews creates user review with rating validation (1-5 range)', async () => {
    // Valid review creation
    const res = await app.request('/v1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        businessId: testBusinessId,
        rating: 5,
        comment: 'خدمة فائقة السرعة وتعامل ممتاز جداً',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.rating).toBe(5);
    expect(data.data.status).toBe('PUBLISHED');

    // Invalid rating (6 out of bounds)
    const invalidRes = await app.request('/v1/reviews', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({
        businessId: testBusinessId,
        rating: 6,
      }),
    });

    expect(invalidRes.status).toBe(400);
  });

  it('5. GET /v1/reviews returns list and rating summary breakdown', async () => {
    // Insert 2 reviews
    mockPrisma.store.reviews.set('rev-1', {
      id: 'rev-1',
      businessId: testBusinessId,
      rating: 5,
      status: 'PUBLISHED',
      createdAt: new Date(),
    });
    mockPrisma.store.reviews.set('rev-2', {
      id: 'rev-2',
      businessId: testBusinessId,
      rating: 4,
      status: 'PUBLISHED',
      createdAt: new Date(),
    });

    const res = await app.request(`/v1/reviews?businessId=${testBusinessId}`, {
      method: 'GET',
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.summary.totalReviews).toBe(2);
    expect(data.data.summary.averageRating).toBe(4.5);
  });

  it('6. Only review owner can update review (403 FORBIDDEN for non-owner)', async () => {
    const revId = 'rev-owner-check';
    mockPrisma.store.reviews.set(revId, {
      id: revId,
      userId,
      businessId: testBusinessId,
      rating: 3,
      comment: 'عادي',
      status: 'PUBLISHED',
    });

    // Other user attempts edit
    const otherToken = 'token-other-999';
    mockPrisma.store.users.set('usr-other-999', { id: 'usr-other-999', role: 'USER', email: 'other@waynah.local', name: 'Other User' });
    mockPrisma.store.sessions.set(otherToken, { id: 'ses-other', userId: 'usr-other-999', token: otherToken, expiresAt: new Date(Date.now() + 100000) });

    const forbiddenRes = await app.request(`/v1/reviews/${revId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${otherToken}`,
      },
      body: JSON.stringify({ rating: 1 }),
    });

    expect(forbiddenRes.status).toBe(403);

    // Owner edits
    const ownerRes = await app.request(`/v1/reviews/${revId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${userToken}`,
      },
      body: JSON.stringify({ rating: 4, comment: 'تم التعديل للأفضل' }),
    });

    expect(ownerRes.status).toBe(200);
  });

  it('7. Admin can moderate review status (PUBLISHED -> FLAGGED)', async () => {
    const revId = 'rev-mod-001';
    mockPrisma.store.reviews.set(revId, {
      id: revId,
      userId,
      businessId: testBusinessId,
      rating: 1,
      comment: 'محتوى مخالف',
      status: 'PUBLISHED',
    });

    const res = await app.request(`/v1/reviews/admin/${revId}/moderate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'FLAGGED',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('FLAGGED');
  });

  it('8. POST /v1/observations submits observation and calculates confidence score', async () => {
    const res = await app.request('/v1/observations', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        placeId: testPlaceId,
        dataSourceId: testDataSourceId,
        name: 'مركز حجة الطبي الرئيسي',
        phone: '+96777000000',
        latitude: 15.69,
        longitude: 43.60,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.confidenceScore).toBeGreaterThan(0);
    expect(data.data.status).toBe('PENDING');
  });

  it('9. Admin can approve or reject observations', async () => {
    const obsId = 'obs-to-moderate';
    mockPrisma.store.placeObservations.set(obsId, {
      id: obsId,
      placeId: testPlaceId,
      dataSourceId: testDataSourceId,
      status: 'PENDING',
    });

    const res = await app.request(`/v1/observations/admin/${obsId}/status`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'APPROVED',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('APPROVED');
  });
});
