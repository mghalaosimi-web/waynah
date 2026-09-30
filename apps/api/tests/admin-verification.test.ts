import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const businessMembers = new Map<string, any>();
  const verifications = new Map<string, any>();

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
    business: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'biz-' + Math.random().toString(36).substring(2, 9);
        const newBiz = {
          id,
          status: 'ACTIVE',
          createdAt: new Date(),
          updatedAt: new Date(),
          members: [],
          places: [],
          ...data,
        };
        businesses.set(id, newBiz);
        return Promise.resolve(newBiz);
      }),
      count: vi.fn().mockImplementation(() => Promise.resolve(businesses.size)),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        const biz = businesses.get(where.id);
        if (!biz) return Promise.resolve(null);
        const verification = verifications.get(biz.id) || null;
        return Promise.resolve({ ...biz, members: [], places: [], verification });
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        for (const biz of businesses.values()) {
          if (where.OR) {
            for (const cond of where.OR) {
              if ((cond.id && biz.id === cond.id) || (cond.slug && biz.slug === cond.slug)) {
                const verification = verifications.get(biz.id) || null;
                return Promise.resolve({
                  ...biz,
                  places: [],
                  verification,
                  _count: { places: 0, members: 1 },
                });
              }
            }
          }
        }
        return Promise.resolve(null);
      }),
    },
    businessMember: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'bm-' + Math.random().toString(36).substring(2, 9);
        const key = `${data.businessId}:${data.userId}`;
        const newBm = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        businessMembers.set(key, newBm);

        const user = users.get(data.userId);
        return Promise.resolve({ ...newBm, user });
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.businessId_userId) {
          const key = `${where.businessId_userId.businessId}:${where.businessId_userId.userId}`;
          return Promise.resolve(businessMembers.get(key) || null);
        }
        return Promise.resolve(null);
      }),
    },
    businessVerification: {
      count: vi.fn().mockImplementation(({ where }) => {
        let cnt = 0;
        for (const v of verifications.values()) {
          if (!where?.status || v.status === where.status) cnt++;
        }
        return Promise.resolve(cnt);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const res: any[] = [];
        for (const v of verifications.values()) {
          if (!where?.status || v.status === where.status) {
            const biz = businesses.get(v.businessId);
            res.push({ ...v, business: { ...biz, places: [], _count: { places: 0, members: 1 } } });
          }
        }
        return Promise.resolve(res);
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        if (where?.OR) {
          for (const v of verifications.values()) {
            for (const cond of where.OR) {
              if ((cond.id && v.id === cond.id) || (cond.businessId && v.businessId === cond.businessId)) {
                const biz = businesses.get(v.businessId);
                return Promise.resolve({ ...v, business: { ...biz, places: [], members: [] } });
              }
            }
          }
        }
        return Promise.resolve(null);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(verifications.get(where.businessId) || null);
      }),
      upsert: vi.fn().mockImplementation(({ where, create, update }) => {
        const existing = verifications.get(where.businessId);
        let record;
        if (existing) {
          record = {
            ...existing,
            ...update,
            updatedAt: new Date(),
          };
        } else {
          record = {
            id: 'bv-' + Math.random().toString(36).substring(2, 9),
            createdAt: new Date(),
            updatedAt: new Date(),
            ...create,
          };
        }
        verifications.set(where.businessId, record);
        return Promise.resolve(record);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        let targetId = where.id;
        let targetRecord: any = null;
        for (const v of verifications.values()) {
          if (v.id === targetId || v.businessId === where.businessId) {
            targetRecord = v;
            break;
          }
        }
        if (targetRecord) {
          Object.assign(targetRecord, data, { updatedAt: new Date() });
          const biz = businesses.get(targetRecord.businessId);
          return Promise.resolve({ ...targetRecord, business: biz });
        }
        return Promise.resolve(null);
      }),
    },
    $transaction: vi.fn().mockImplementation((cb) =>
      cb({
        business: {
          create: vi.fn().mockImplementation(({ data }) => {
            const id = 'biz-' + Math.random().toString(36).substring(2, 9);
            const newBiz = {
              id,
              status: 'ACTIVE',
              createdAt: new Date(),
              updatedAt: new Date(),
              members: [],
              places: [],
              ...data,
            };
            businesses.set(id, newBiz);
            return Promise.resolve(newBiz);
          }),
        },
        businessMember: {
          create: vi.fn().mockImplementation(({ data }) => {
            const id = 'bm-' + Math.random().toString(36).substring(2, 9);
            const key = `${data.businessId}:${data.userId}`;
            const newBm = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
            businessMembers.set(key, newBm);

            const user = users.get(data.userId);
            return Promise.resolve({ ...newBm, user });
          }),
        },
        user: {
          findUnique: vi.fn().mockImplementation(({ where }) => Promise.resolve(users.get(where.id) || null)),
          update: vi.fn().mockImplementation(({ where, data }) => {
            const u = users.get(where.id);
            if (u) Object.assign(u, data);
            return Promise.resolve(u);
          }),
        },
      })
    ),
    $queryRaw: vi.fn().mockResolvedValue([]),
  } as unknown as PrismaClient;
}

describe('WAYNAH-ADMIN-001 — Admin Foundation & Verification Review Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  let adminToken: string;
  let adminId: string;
  let ownerToken: string;
  let ownerId: string;
  let normalUserToken: string;
  let normalUserId: string;

  let businessId: string;
  let verificationId: string;

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
    adminId = dAdmin.data.user.id;
    // Set user role to ADMIN in mock DB
    await mockPrisma.user.update({
      where: { id: adminId },
      data: { role: 'ADMIN' },
    });

    // Register Business Owner User
    const regOwner = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'مالك النشاط',
        email: 'owner@waynah.com',
        password: 'Password123!',
      }),
    });
    const dOwner = await regOwner.json();
    ownerToken = dOwner.data.token;
    ownerId = dOwner.data.user.id;

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
    normalUserId = dNormal.data.user.id;

    // Owner creates a business
    const bRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        name: 'مجموعة المجد التجارية',
      }),
    });
    const bData = await bRes.json();
    businessId = bData.data.id;

    // Owner submits verification request (creating PENDING record)
    const vRes = await app.request(`/v1/businesses/${businessId}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ notes: 'طلب توثيق رسمي من المالك' }),
    });
    const vData = await vRes.json();
    verificationId = vData.data.id;
  });

  // --- AUTHENTICATION & AUTHORIZATION TESTS ---

  it('1. Anonymous request to Admin endpoint -> 401 Unauthorized', async () => {
    const res = await app.request('/v1/admin/verifications');
    expect(res.status).toBe(401);
  });

  it('2. Normal USER -> 403 Forbidden on Admin verifications', async () => {
    const res = await app.request('/v1/admin/verifications', {
      headers: { Authorization: `Bearer ${normalUserToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('3. BUSINESS_MEMBER / OWNER -> 403 Forbidden on Admin review endpoints', async () => {
    const res = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });
    expect(res.status).toBe(403);
  });

  // --- ADMIN QUEUE & DETAILS TESTS ---

  it('4. Admin can list verification requests in queue', async () => {
    const res = await app.request('/v1/admin/verifications', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
    expect(data.data[0].status).toBe('PENDING');
  });

  it('5. Admin can retrieve single verification details', async () => {
    const res = await app.request(`/v1/admin/verifications/${verificationId}`, {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(verificationId);
    expect(data.data.business.name).toBe('مجموعة المجد التجارية');
  });

  // --- REVIEW ACTION & TRANSITION TESTS ---

  it('6. Admin can approve PENDING verification request (PENDING -> VERIFIED)', async () => {
    const res = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('VERIFIED');
    expect(data.data.reviewedAt).toBeDefined();
    expect(data.data.reviewerId).toBe(adminId);
  });

  it('7. Admin can reject PENDING verification request with valid reason (PENDING -> REJECTED)', async () => {
    const res = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'السجل التجاري المرفق منتهي الصلاحية',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('REJECTED');
    expect(data.data.rejectionReason).toBe('السجل التجاري المرفق منتهي الصلاحية');
  });

  it('8. Rejection without valid reason (empty string) is rejected with 400 Bad Request', async () => {
    const res = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: '   ',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('REJECTION_REASON_REQUIRED');
  });

  it('9. Timestamps (reviewedAt) and reviewerId are strictly server-controlled', async () => {
    const fakeClientDate = '2000-01-01T00:00:00.000Z';
    const res = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'VERIFIED',
        reviewedAt: fakeClientDate,
        reviewerId: 'hacker-id',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.reviewerId).toBe(adminId);
    expect(data.data.reviewedAt).not.toBe(fakeClientDate);
  });

  it('10. Invalid state transition (attempting to review an already VERIFIED request) fails (400)', async () => {
    // Approve once
    await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });

    // Attempt to re-review an already VERIFIED request
    const res2 = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({
        status: 'REJECTED',
        rejectionReason: 'محاولة تعديل قرار سابق',
      }),
    });

    expect(res2.status).toBe(400);
    const data2 = await res2.json();
    expect(data2.error.code).toBe('INVALID_STATE_TRANSITION');
  });

  it('11. Client cannot force VERIFIED state without Admin authorization', async () => {
    const res = await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });

    expect(res.status).toBe(403);
  });

  it('12. Admin review updates public business profile to verified: true', async () => {
    // Admin approves
    await app.request(`/v1/admin/verifications/${verificationId}/review`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ status: 'VERIFIED' }),
    });

    // Public fetch
    const pubRes = await app.request(`/v1/businesses/public/${businessId}`);
    expect(pubRes.status).toBe(200);
    const pubData = await pubRes.json();

    expect(pubData.data.verified).toBe(true);
    expect(pubData.data.verificationStatus).toBe('VERIFIED');
    expect(pubData.data.rejectionReason).toBeUndefined();
  });
});
