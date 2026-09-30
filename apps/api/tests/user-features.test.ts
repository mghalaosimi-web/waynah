import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const places = new Map<string, any>();
  const favorites = new Map<string, any>();
  const requests = new Map<string, any>();

  // Add default mock place
  const defaultPlace = {
    id: 'place-1',
    nameAr: 'مستشفى حجة العام',
    nameEn: 'Hajjah General Hospital',
    slug: 'hajjah-general-hospital',
    address: 'حي الثورة، حجة',
    verificationStatus: 'VERIFIED',
    categoryId: 'cat-health',
    districtId: 'dist-hajjah',
    category: { nameAr: 'صحة' },
    district: { nameAr: 'حجة', governorate: { nameAr: 'حجة' } },
    location: { latitude: 15.69, longitude: 43.60 },
  };
  places.set(defaultPlace.id, defaultPlace);

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
        const newUser = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        users.set(id, newUser);
        return Promise.resolve(newUser);
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
        return Promise.resolve(places.get(where.id) || null);
      }),
    },
    favorite: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const result: any[] = [];
        for (const fav of favorites.values()) {
          if (fav.userId === where.userId) {
            result.push({
              ...fav,
              place: places.get(fav.placeId) || defaultPlace,
            });
          }
        }
        return Promise.resolve(result);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.userId_placeId) {
          const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
          return Promise.resolve(favorites.get(key) || null);
        }
        return Promise.resolve(null);
      }),
      upsert: vi.fn().mockImplementation(({ where, create }) => {
        const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
        let fav = favorites.get(key);
        if (!fav) {
          fav = {
            id: 'fav-' + Math.random().toString(36).substring(2, 9),
            userId: create.userId,
            placeId: create.placeId,
            createdAt: new Date(),
          };
          favorites.set(key, fav);
        }
        return Promise.resolve({
          ...fav,
          place: places.get(fav.placeId) || defaultPlace,
        });
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        if (where.userId_placeId) {
          const key = `${where.userId_placeId.userId}:${where.userId_placeId.placeId}`;
          if (favorites.has(key)) {
            favorites.delete(key);
            return Promise.resolve({ count: 1 });
          }
        }
        throw new Error('Record to delete does not exist.');
      }),
    },
    serviceRequest: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const result: any[] = [];
        for (const req of requests.values()) {
          if (req.userId === where.userId) {
            result.push({
              ...req,
              place: req.placeId ? (places.get(req.placeId) || defaultPlace) : null,
            });
          }
        }
        return Promise.resolve(result);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'req-' + Math.random().toString(36).substring(2, 9);
        const newReq = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          status: 'PENDING',
          ...data,
          place: data.placeId ? (places.get(data.placeId) || defaultPlace) : null,
        };
        requests.set(id, newReq);
        return Promise.resolve(newReq);
      }),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
  } as unknown as PrismaClient;
}

describe('WAYNAH-CLIENT-002 — User Favorites & Service Requests Integration', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;
  let user1Token: string;
  let user2Token: string;
  let user1Id: string;
  let user2Id: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register User 1
    const reg1 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'المستخدم الأول',
        email: 'user1@waynah.com',
        password: 'Password123!',
      }),
    });
    const d1 = await reg1.json();
    user1Token = d1.data.token;
    user1Id = d1.data.user.id;

    // Register User 2
    const reg2 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'المستخدم الثاني',
        email: 'user2@waynah.com',
        password: 'Password123!',
      }),
    });
    const d2 = await reg2.json();
    user2Token = d2.data.token;
    user2Id = d2.data.user.id;
  });

  // --- FAVORITES TESTS ---

  it('1. Unauthenticated request to /v1/user/favorites is denied with 401', async () => {
    const res = await app.request('/v1/user/favorites');
    expect(res.status).toBe(401);
  });

  it('2. Authenticated user can add a place to favorites', async () => {
    const res = await app.request('/v1/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ placeId: 'place-1' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.placeId).toBe('place-1');
    expect(data.data.place.nameAr).toBe('مستشفى حجة العام');
  });

  it('3. Duplicate favorite is handled cleanly without duplication', async () => {
    // Add once
    await app.request('/v1/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ placeId: 'place-1' }),
    });

    // Add second time
    const res = await app.request('/v1/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ placeId: 'place-1' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);

    // Verify list contains only 1 item
    const listRes = await app.request('/v1/user/favorites', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const listData = await listRes.json();
    expect(listData.data.length).toBe(1);
  });

  it('4. Authenticated user can list their own favorites', async () => {
    await app.request('/v1/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ placeId: 'place-1' }),
    });

    const res = await app.request('/v1/user/favorites', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.length).toBe(1);
  });

  it('5. User cannot access another user favorites (Ownership Enforcement)', async () => {
    // User 1 adds favorite
    await app.request('/v1/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ placeId: 'place-1' }),
    });

    // User 2 fetches favorites -> should receive 0 favorites
    const user2FavsRes = await app.request('/v1/user/favorites', {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    expect(user2FavsRes.status).toBe(200);
    const user2Data = await user2FavsRes.json();
    expect(user2Data.data.length).toBe(0);
  });

  it('6. Authenticated user can remove a favorite place', async () => {
    // Add favorite first
    await app.request('/v1/user/favorites', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({ placeId: 'place-1' }),
    });

    // Remove favorite
    const deleteRes = await app.request('/v1/user/favorites/place-1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${user1Token}` },
    });

    expect(deleteRes.status).toBe(200);
    const deleteData = await deleteRes.json();
    expect(deleteData.success).toBe(true);

    // List should be empty
    const listRes = await app.request('/v1/user/favorites', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const listData = await listRes.json();
    expect(listData.data.length).toBe(0);
  });

  // --- SERVICE REQUESTS TESTS ---

  it('7. Authenticated user can create a service request', async () => {
    const res = await app.request('/v1/user/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'طلب إضافة صيدلية جديدة',
        description: 'يرجى إضافة صيدلية الشفاء بجوار المشفى العام',
        placeId: 'place-1',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.title).toBe('طلب إضافة صيدلية جديدة');
    expect(data.data.status).toBe('PENDING');
    expect(data.data.placeId).toBe('place-1');
  });

  it('8. Validation rejects invalid request data (short title or description)', async () => {
    const res = await app.request('/v1/user/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'أ',
        description: 'ب',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  it('9. Request ownership is strictly enforced between users', async () => {
    // User 1 creates request
    await app.request('/v1/user/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${user1Token}`,
      },
      body: JSON.stringify({
        title: 'طلب تصحيح موقع',
        description: 'الموقع المكاني يتطلب تعديل طفيف',
      }),
    });

    // User 2 lists requests -> gets 0 requests
    const user2ReqRes = await app.request('/v1/user/requests', {
      headers: { Authorization: `Bearer ${user2Token}` },
    });

    expect(user2ReqRes.status).toBe(200);
    const user2Data = await user2ReqRes.json();
    expect(user2Data.data.length).toBe(0);

    // User 1 lists requests -> gets 1 request
    const user1ReqRes = await app.request('/v1/user/requests', {
      headers: { Authorization: `Bearer ${user1Token}` },
    });
    const user1Data = await user1ReqRes.json();
    expect(user1Data.data.length).toBe(1);
    expect(user1Data.data[0].title).toBe('طلب تصحيح موقع');
  });
});
