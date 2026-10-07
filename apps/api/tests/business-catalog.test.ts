import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const businessMembers = new Map<string, any>();
  const products = new Map<string, any>();
  const services = new Map<string, any>();

  const mockClient: any = {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.email) {
          const canonical = where.email.trim().toLowerCase();
          for (const u of users.values()) {
            if (u.email.trim().toLowerCase() === canonical) return Promise.resolve(u);
          }
        }
        if (where.id) return Promise.resolve(users.get(where.id) || null);
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, role: 'USER', emailVerified: false, emailVerifiedAt: null, createdAt: new Date(), updatedAt: new Date(), ...data };
        users.set(id, newUser);
        return Promise.resolve(newUser);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const u = users.get(where.id);
        if (u) {
          Object.assign(u, data, { updatedAt: new Date() });
          return Promise.resolve(u);
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
        if (where.id) {
          const biz = businesses.get(where.id);
          if (!biz) return Promise.resolve(null);
          return Promise.resolve({ ...biz });
        }
        return Promise.resolve(null);
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        const idOrSlug = where?.OR?.[0]?.id || where?.OR?.[1]?.slug;
        for (const b of businesses.values()) {
          if (b.id === idOrSlug || b.slug === idOrSlug) {
            return Promise.resolve({ ...b });
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
        return Promise.resolve({ ...newBm });
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.businessId_userId) {
          const key = `${where.businessId_userId.businessId}:${where.businessId_userId.userId}`;
          const bm = businessMembers.get(key);
          if (!bm) return Promise.resolve(null);
          return Promise.resolve({ ...bm });
        }
        return Promise.resolve(null);
      }),
    },
    product: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'prod-' + Math.random().toString(36).substring(2, 9);
        const newProd = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: null,
          ...data,
        };
        products.set(id, newProd);
        return Promise.resolve(newProd);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id) {
          const p = products.get(where.id);
          return Promise.resolve(p ? { ...p } : null);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const result: any[] = [];
        for (const p of products.values()) {
          if (p.businessId === where.businessId) {
            if (where.isAvailable !== undefined && p.isAvailable !== where.isAvailable) {
              continue;
            }
            result.push({ ...p });
          }
        }
        return Promise.resolve(result);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const p = products.get(where.id);
        if (p) {
          Object.assign(p, data, { updatedAt: new Date() });
          return Promise.resolve({ ...p });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const p = products.get(where.id);
        if (p) {
          products.delete(where.id);
          return Promise.resolve({ ...p });
        }
        return Promise.resolve(null);
      }),
    },
    serviceItem: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'srv-' + Math.random().toString(36).substring(2, 9);
        const newSrv = {
          id,
          createdAt: new Date(),
          updatedAt: new Date(),
          category: null,
          ...data,
        };
        services.set(id, newSrv);
        return Promise.resolve(newSrv);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id) {
          const s = services.get(where.id);
          return Promise.resolve(s ? { ...s } : null);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const result: any[] = [];
        for (const s of services.values()) {
          if (s.businessId === where.businessId) {
            if (where.isAvailable !== undefined && s.isAvailable !== where.isAvailable) {
              continue;
            }
            result.push({ ...s });
          }
        }
        return Promise.resolve(result);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const s = services.get(where.id);
        if (s) {
          Object.assign(s, data, { updatedAt: new Date() });
          return Promise.resolve({ ...s });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const s = services.get(where.id);
        if (s) {
          services.delete(where.id);
          return Promise.resolve({ ...s });
        }
        return Promise.resolve(null);
      }),
    },
    $transaction: vi.fn().mockImplementation((cb) => cb(mockClient)),
  };

  return mockClient as PrismaClient;
}

describe('WAYNAH-SLICE-PHASE-5 — Service, Product & Catalog Engine Domain & API Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  let ownerToken: string;
  let ownerId: string;
  let managerToken: string;
  let managerId: string;
  let memberToken: string;
  let memberId: string;
  let strangerToken: string;

  let businessId: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register Owner User
    const reg1 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مالك المتجر', email: 'merchant-owner@waynah.com', password: 'Password123!' }),
    });
    const d1 = await reg1.json();
    ownerToken = d1.data.token;
    ownerId = d1.data.user.id;

    // Create Business
    const bizRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ name: 'شركة البركة لقطع الغيار والصيانة', slug: 'al-baraka-store' }),
    });
    const bizData = await bizRes.json();
    businessId = bizData.data.id;

    // Register Manager
    const reg2 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير المتجر', email: 'merchant-mgr@waynah.com', password: 'Password123!' }),
    });
    const d2 = await reg2.json();
    managerToken = d2.data.token;
    managerId = d2.data.user.id;

    await mockPrisma.businessMember.create({
      data: { businessId, userId: managerId, role: 'MANAGER' },
    });

    // Register Member
    const reg3 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'موظف مبيعات', email: 'merchant-staff@waynah.com', password: 'Password123!' }),
    });
    const d3 = await reg3.json();
    memberToken = d3.data.token;
    memberId = d3.data.user.id;

    await mockPrisma.businessMember.create({
      data: { businessId, userId: memberId, role: 'MEMBER' },
    });

    // Register Stranger
    const reg4 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مستخدم خارجي', email: 'stranger@waynah.com', password: 'Password123!' }),
    });
    const d4 = await reg4.json();
    strangerToken = d4.data.token;
  });

  describe('1. Product CRUD Operations & Role Access Controls', () => {
    it('1. Owner can create product (201 Created)', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          nameAr: 'بطارية تويوتا 60 أمبير',
          nameEn: 'Toyota Battery 60Ah',
          description: 'بطارية جافة ذات جودة عالية ضمان سنة',
          price: 45000,
          currency: 'YER',
          sku: 'BAT-TOY-60',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.nameAr).toBe('بطارية تويوتا 60 أمبير');
      expect(data.data.price).toBe(45000);
      expect(data.data.isAvailable).toBe(true);
    });

    it('2. Manager can create product (201 Created)', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
        body: JSON.stringify({
          nameAr: 'زيت محرك تويوتا 5W-30',
          price: 18000,
        }),
      });

      expect(res.status).toBe(201);
    });

    it('3. MEMBER role cannot create product (403 Forbidden)', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({
          nameAr: 'فلتر زيت اصلي',
          price: 5000,
        }),
      });

      expect(res.status).toBe(403);
    });

    it('4. Creation with invalid input returns 400', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          nameAr: 'أ', // Too short name
          price: -100, // Negative price
        }),
      });

      expect(res.status).toBe(400);
    });

    it('5. Owner/Manager can update product details & availability', async () => {
      const createRes = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'شمعة احتراق هيونداي', price: 3500 }),
      });
      const prodId = (await createRes.json()).data.id;

      const patchRes = await app.request(`/v1/businesses/${businessId}/products/${prodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
        body: JSON.stringify({ price: 4000, isAvailable: false }),
      });

      expect(patchRes.status).toBe(200);
      const data = await patchRes.json();
      expect(data.data.price).toBe(4000);
      expect(data.data.isAvailable).toBe(false);
    });

    it('6. Owner/Manager can delete product', async () => {
      const createRes = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'إطار سيارة مقاس 16', price: 32000 }),
      });
      const prodId = (await createRes.json()).data.id;

      const delRes = await app.request(`/v1/businesses/${businessId}/products/${prodId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${ownerToken}` },
      });

      expect(delRes.status).toBe(200);
    });
  });

  describe('2. Service CRUD Operations & Price Variations', () => {
    it('7. Owner/Manager can create service with fixed price', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({
          nameAr: 'فحص كمبيوتر وشامل للسيارات',
          nameEn: 'Full Computer Diagnostics',
          description: 'فحص الحساسات والمحرك والأعطال المخفية',
          price: 10000,
          durationMinutes: 30,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.nameAr).toBe('فحص كمبيوتر وشامل للسيارات');
      expect(data.data.price).toBe(10000);
      expect(data.data.durationMinutes).toBe(30);
    });

    it('8. Owner/Manager can create service with NULL price (RFQ / Price on Request)', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
        body: JSON.stringify({
          nameAr: 'توضيب كامل للمحرك (مقاولة)',
          description: 'السعر يتحدد حسب نتائج الفحص وحالة المحرك',
          price: null,
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.data.price).toBeNull();
    });

    it('9. MEMBER role cannot create service (403)', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
        body: JSON.stringify({ nameAr: 'تغيير زيت وفلتر', price: 2000 }),
      });

      expect(res.status).toBe(403);
    });

    it('10. Owner/Manager can update and delete services', async () => {
      const createRes = await app.request(`/v1/businesses/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'ترصيص إطارات', price: 4000 }),
      });
      const srvId = (await createRes.json()).data.id;

      const patchRes = await app.request(`/v1/businesses/${businessId}/services/${srvId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ price: 5000 }),
      });
      expect(patchRes.status).toBe(200);

      const delRes = await app.request(`/v1/businesses/${businessId}/services/${srvId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${managerToken}` },
      });
      expect(delRes.status).toBe(200);
    });
  });

  describe('3. Public Catalog & Merchant Aggregation Contracts', () => {
    it('11. Anonymous public user can fetch business catalog (200 OK)', async () => {
      // Create available product & unavailable product
      await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'منتج توفر', price: 1000, isAvailable: true }),
      });
      await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'منتج غير متوفر', price: 2000, isAvailable: false }),
      });

      // Create available service
      await app.request(`/v1/businesses/${businessId}/services`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'خدمة متاحة', price: 5000, isAvailable: true }),
      });

      const res = await app.request(`/v1/businesses/public/al-baraka-store/catalog`);

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.products.length).toBe(1); // Only available products shown publicly
      expect(data.data.services.length).toBe(1);
      expect(data.data.products[0].nameAr).toBe('منتج توفر');
    });

    it('12. Merchant member can fetch full catalog including unavailable items', async () => {
      await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'منتج توفر 1', price: 1000, isAvailable: true }),
      });
      await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'منتج غير متوفر 2', price: 2000, isAvailable: false }),
      });

      const res = await app.request(`/v1/businesses/${businessId}/catalog`, {
        headers: { Authorization: `Bearer ${memberToken}` },
      });

      expect(res.status).toBe(200);
      const data = await res.json();
      expect(data.data.products.length).toBe(2); // Full list for merchant (available + unavailable)
    });

    it('13. Stranger non-member cannot access merchant catalog endpoint (403)', async () => {
      const res = await app.request(`/v1/businesses/${businessId}/catalog`, {
        headers: { Authorization: `Bearer ${strangerToken}` },
      });

      expect(res.status).toBe(403);
    });

    it('14. Public catalog for non-existent business returns 404', async () => {
      const res = await app.request(`/v1/businesses/public/non-existent-biz/catalog`);
      expect(res.status).toBe(404);
    });
  });

  describe('4. IDOR Protection & Boundary Violations', () => {
    it('15. Cannot mutate product of Business A via Business B (404)', async () => {
      // Create Product in Business 1
      const pRes = await app.request(`/v1/businesses/${businessId}/products`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
        body: JSON.stringify({ nameAr: 'منتج خاص بالنشاط 1', price: 15000 }),
      });
      const prodId = (await pRes.json()).data.id;

      // Create Business 2 by Stranger
      const b2Res = await app.request('/v1/businesses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${strangerToken}` },
        body: JSON.stringify({ name: 'متجر آخر منفصل' }),
      });
      const biz2Id = (await b2Res.json()).data.id;

      // Stranger tries to mutate Business 1's product using Business 2 route
      const patchRes = await app.request(`/v1/businesses/${biz2Id}/products/${prodId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${strangerToken}` },
        body: JSON.stringify({ price: 1 }),
      });

      expect(patchRes.status).toBe(404);
    });
  });
});
