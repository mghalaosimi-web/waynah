import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import { BusinessVerificationService } from '../src/domain/business/business-verification.service.js';
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
      findUnique: vi.fn().mockImplementation(({ where }) => {
        const biz = businesses.get(where.id);
        if (!biz) return Promise.resolve(null);

        let members: any[] = [];
        for (const bm of businessMembers.values()) {
          if (bm.businessId === biz.id) {
            const user = users.get(bm.userId);
            members.push({ ...bm, user });
          }
        }

        const verification = verifications.get(biz.id) || null;

        return Promise.resolve({ ...biz, members, places: [], verification });
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

describe('WAYNAH-BUSINESS-002 — Business Verification Foundation Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;
  let business1Id: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register User 1 (Owner)
    const reg1 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'سارة الأحمد',
        email: 'sara@waynah.com',
        password: 'Password123!',
      }),
    });
    const d1 = await reg1.json();
    user1Token = d1.data.token;
    user1Id = d1.data.user.id;

    // Register User 2 (Unrelated User)
    const reg2 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'فيصل العتيبي',
        email: 'faisal@waynah.com',
        password: 'Password123!',
      }),
    });
    const d2 = await reg2.json();
    user2Token = d2.data.token;
    user2Id = d2.data.user.id;

    // Create Business 1 for User 1
    const bRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: 'شركة النور للخدمات العامة',
      }),
    });
    const bData = await bRes.json();
    business1Id = bData.data.id;
  });

  it('1. Authenticated owner can view verification state', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('UNVERIFIED');
    expect(data.data.businessId).toBe(business1Id);
  });

  it('2. Anonymous user cannot submit verification (401)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ notes: 'طلب توثيق زائر' }),
    });

    expect(res.status).toBe(401);
  });

  it('3. Owner can submit verification request', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: 'بيانات السجل التجاري المعتمدة' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('PENDING');
    expect(data.data.notes).toBe('بيانات السجل التجاري المعتمدة');
  });

  it('4. Submission creates PENDING state in database', async () => {
    await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: 'اختبار الحالة' }),
    });

    const getRes = await app.request(`/v1/businesses/${business1Id}/verification`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    const data = await getRes.json();
    expect(data.data.status).toBe('PENDING');
  });

  it('5. Duplicate pending submission is rejected (400 Bad Request)', async () => {
    // First submission
    await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: 'الطلب الأول' }),
    });

    // Second submission (Duplicate)
    const res2 = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: 'الطلب الثاني المكرر' }),
    });

    expect(res2.status).toBe(400);
    const data = await res2.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('DUPLICATE_REQUEST');
  });

  it('6. User A (User 2) cannot submit verification for User B business (IDOR Protection 403)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ notes: 'محاولة اختراق التوثيق' }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('7. User A (User 2) cannot read private verification details of User B business (403)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    expect(res.status).toBe(403);
  });

  it('8. Business MEMBER (non-owner) cannot submit verification if OWNER-only rule is enforced (403)', async () => {
    // Add User 2 as MEMBER role to Business 1
    await mockPrisma.businessMember.create({
      data: {
        businessId: business1Id,
        userId: user2Id,
        role: 'MEMBER',
      },
    });

    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ notes: 'تقديم بواسطة عضو' }),
    });

    expect(res.status).toBe(403);
  });

  it('9. Invalid request body (excessive string length) is rejected (400)', async () => {
    const longNotes = 'a'.repeat(1001);
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: longNotes }),
    });

    expect(res.status).toBe(400);
  });

  it('10. Client cannot control verification status via request body', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        notes: 'محاولة فرض التوثيق',
        status: 'VERIFIED',
        rejectionReason: null,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    // Status MUST be PENDING, client status payload is ignored
    expect(data.data.status).toBe('PENDING');
  });

  it('11. Public business profile does not expose private verification details', async () => {
    // Owner submits verification
    await app.request(`/v1/businesses/${business1Id}/verification`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ notes: 'سرية للغاية للمراجعة الإدارية' }),
    });

    // Public call (unauthenticated)
    const pubRes = await app.request(`/v1/businesses/public/${business1Id}`);
    expect(pubRes.status).toBe(200);
    const pubData = await pubRes.json();

    expect(pubData.data.verified).toBe(false);
    expect(pubData.data.verificationStatus).toBe('PENDING');

    // Ensure NO private fields (notes, reviewerId, rejectionReason, etc.) exist on public object
    expect(pubData.data.notes).toBeUndefined();
    expect(pubData.data.reviewerId).toBeUndefined();
    expect(pubData.data.rejectionReason).toBeUndefined();
  });

  it('12. VERIFIED / REJECTED states are represented correctly via service-level fixtures', async () => {
    const service = new BusinessVerificationService(mockPrisma);

    // Review to VERIFIED
    await service.reviewVerificationRequest(business1Id, 'VERIFIED');
    const vState = await service.getVerificationStatus(user1Id, business1Id);
    expect(vState.status).toBe('VERIFIED');

    const pubVerified = await service.getPublicVerificationState(business1Id);
    expect(pubVerified.verified).toBe(true);
    expect(pubVerified.verificationStatus).toBe('VERIFIED');

    // Review to REJECTED
    await service.reviewVerificationRequest(business1Id, 'REJECTED', 'سجل تجاري غير مطابق');
    const rState = await service.getVerificationStatus(user1Id, business1Id);
    expect(rState.status).toBe('REJECTED');
    expect(rState.rejectionReason).toBe('سجل تجاري غير مطابق');

    const pubRejected = await service.getPublicVerificationState(business1Id);
    expect(pubRejected.verified).toBe(false);
    expect(pubRejected.verificationStatus).toBe('REJECTED');
  });
});
