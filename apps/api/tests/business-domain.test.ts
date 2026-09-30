import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const businessMembers = new Map<string, any>();
  const places = new Map<string, any>();

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
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        const biz = businesses.get(where.id);
        if (!biz) return Promise.resolve(null);

        let members: any[] = [];
        for (const bm of businessMembers.values()) {
          if (bm.businessId === biz.id) {
            const user = users.get(bm.userId);
            members.push({ ...bm, user });
          }
        }

        return Promise.resolve({ ...biz, members, places: [] });
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        for (const biz of businesses.values()) {
          if (where.OR) {
            for (const cond of where.OR) {
              if (cond.id && biz.id === cond.id) return Promise.resolve({ ...biz, places: [], _count: { places: 0, members: 1 } });
              if (cond.slug && biz.slug === cond.slug) return Promise.resolve({ ...biz, places: [], _count: { places: 0, members: 1 } });
            }
          }
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const biz = businesses.get(where.id);
        if (biz) {
          Object.assign(biz, data, { updatedAt: new Date() });
          return Promise.resolve(biz);
        }
        return Promise.resolve(null);
      }),
    },
    businessMember: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'bm-' + Math.random().toString(36).substring(2, 9);
        const key = `${data.businessId}:${data.userId}`;
        if (businessMembers.has(key)) {
          throw new Error('Unique constraint failed on the fields: (`business_id`,`user_id`)');
        }
        const newBm = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        businessMembers.set(key, newBm);

        const user = users.get(data.userId);
        return Promise.resolve({ ...newBm, user });
      }),
      findMany: vi.fn().mockImplementation(({ where, include }) => {
        const result: any[] = [];
        for (const bm of businessMembers.values()) {
          if (bm.userId === where.userId) {
            const biz = businesses.get(bm.businessId);
            result.push({
              ...bm,
              business: {
                ...biz,
                members: [{ ...bm, user: users.get(bm.userId) }],
                places: [],
              },
            });
          }
        }
        return Promise.resolve(result);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.businessId_userId) {
          const key = `${where.businessId_userId.businessId}:${where.businessId_userId.userId}`;
          return Promise.resolve(businessMembers.get(key) || null);
        }
        return Promise.resolve(null);
      }),
    },
    $transaction: vi.fn().mockImplementation((cb) => cb({
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
          if (businessMembers.has(key)) {
            throw new Error('Unique constraint failed on the fields: (`business_id`,`user_id`)');
          }
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
    })),
    $queryRaw: vi.fn().mockResolvedValue([]),
  } as unknown as PrismaClient;
}

describe('WAYNAH-BUSINESS-001 — Business Domain Foundation & UX Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register User 1 (Business Owner)
    const reg1 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'أحمد المالكي',
        email: 'ahmed@waynah.com',
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
        name: 'خالد عبد الله',
        email: 'khaled@waynah.com',
        password: 'Password123!',
      }),
    });
    const d2 = await reg2.json();
    user2Token = d2.data.token;
    user2Id = d2.data.user.id;
  });

  // --- BUSINESS CREATION & AUTH TESTS ---

  it('1. Authenticated user can create a business', async () => {
    const res = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: 'مجموعة الشفاء الطبية',
        description: 'شبكة صيدليات ومراكز صحية متخصصة',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.name).toBe('مجموعة الشفاء الطبية');
    expect(data.data.status).toBe('ACTIVE');
  });

  it('2. Unauthenticated user cannot create a business (401)', async () => {
    const res = await app.request('/v1/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'مؤسسة وهمية',
      }),
    });

    expect(res.status).toBe(401);
  });

  it('3. Business creator becomes OWNER of the created business', async () => {
    const res = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: 'شركة الأمل للتوزيع',
      }),
    });

    const data = await res.json();
    expect(data.data.membershipRole).toBe('OWNER');
  });

  it('4. Owner can access their own business details', async () => {
    const createRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ name: 'مستشفى السلام' }),
    });
    const createData = await createRes.json();
    const businessId = createData.data.id;

    const res = await app.request(`/v1/businesses/${businessId}`, {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe(businessId);
    expect(data.data.membershipRole).toBe('OWNER');
  });

  it('5. Unauthorized user (User 2) cannot access/manage User 1 business (IDOR Protection 403)', async () => {
    // User 1 creates business
    const createRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ name: 'مركز الرعاية الفائقة' }),
    });
    const createData = await createRes.json();
    const businessId = createData.data.id;

    // User 2 attempts to GET User 1 business
    const getRes = await app.request(`/v1/businesses/${businessId}`, {
      headers: { Authorization: `Bearer ${user2Token}` },
    });
    expect(getRes.status).toBe(403);

    // User 2 attempts to PATCH User 1 business
    const patchRes = await app.request(`/v1/businesses/${businessId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user2Token}`,
      },
      body: JSON.stringify({ name: 'اختراق اسم النشاط' }),
    });
    expect(patchRes.status).toBe(403);
  });

  // --- VALIDATION & MUTATION TESTS ---

  it('8. Validation rejects invalid business name (short length)', async () => {
    const res = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ name: 'أ' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('9. Owner can update business details successfully', async () => {
    const createRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ name: 'صيدلية الهلال' }),
    });
    const createData = await createRes.json();
    const businessId = createData.data.id;

    const patchRes = await app.request(`/v1/businesses/${businessId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        name: 'مجموعة صيدليات الهلال الدولية',
        description: 'الوصف الجديد بعد التعديل',
      }),
    });

    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.success).toBe(true);
    expect(patchData.data.name).toBe('مجموعة صيدليات الهلال الدولية');
  });

  it('10. Listing user businesses returns owned business list', async () => {
    await app.request('/v1/businesses', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ name: 'النشاط الأول' }),
    });

    const res = await app.request('/v1/businesses/my', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
    expect(data.data[0].name).toBe('النشاط الأول');
  });
});
