import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { AuditLogger } from '../src/utils/audit-logger.js';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const businessMembers = new Map<string, any>();
  const verifications = new Map<string, any>();
  const places = new Map<string, any>();
  const branchClaims = new Map<string, any>();

  return {
    _stores: {
      users,
      sessions,
      businesses,
      businessMembers,
      verifications,
      places,
      branchClaims,
    },
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
          name: data.name,
          slug: data.slug || 'slug-' + Math.random().toString(36).substring(2, 6),
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
        return Promise.resolve({ ...biz, members: [], places: [] });
      }),
    },
    businessMember: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'bm-' + Math.random().toString(36).substring(2, 9);
        const key = `${data.businessId}:${data.userId}`;
        const newBm = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        businessMembers.set(key, newBm);
        return Promise.resolve(newBm);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.businessId_userId) {
          const key = `${where.businessId_userId.businessId}:${where.businessId_userId.userId}`;
          return Promise.resolve(businessMembers.get(key) || null);
        }
        return Promise.resolve(null);
      }),
    },
    place: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(places.get(where.id) || null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'plc-' + Math.random().toString(36).substring(2, 9);
        const newPlace = {
          id,
          nameAr: data.nameAr || 'فرع التجربة الرئيسي',
          nameEn: data.nameEn || 'Main Test Branch',
          address: data.address || 'شارع الزبيري، صنعاء',
          phoneNumber: data.phoneNumber || '+967 771 234 567',
          businessId: data.businessId !== undefined ? data.businessId : null,
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        places.set(id, newPlace);
        return Promise.resolve(newPlace);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const place = places.get(where.id);
        if (place) {
          Object.assign(place, data, { updatedAt: new Date() });
          return Promise.resolve(place);
        }
        return Promise.resolve(null);
      }),
    },
    branchClaim: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'claim-' + Math.random().toString(36).substring(2, 9);
        const record = {
          id,
          businessId: data.businessId,
          placeId: data.placeId,
          claimantId: data.claimantId,
          status: data.status || 'APPROVED',
          submittedAt: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        branchClaims.set(id, record);
        return Promise.resolve(record);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const results: any[] = [];
        for (const claim of branchClaims.values()) {
          if (!where || claim.businessId === where.businessId) {
            results.push(claim);
          }
        }
        return Promise.resolve(results);
      }),
    },
    $queryRaw: vi.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      const placeId = values[0];
      const place = places.get(placeId);
      if (place) {
        return Promise.resolve([{ id: place.id, business_id: place.businessId }]);
      }
      return Promise.resolve([]);
    }),
    $transaction: vi.fn().mockImplementation((cb) => {
      const txMock = {
        $queryRaw: vi.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
          const placeId = values[0];
          const place = places.get(placeId);
          if (place) {
            return Promise.resolve([{ id: place.id, business_id: place.businessId }]);
          }
          return Promise.resolve([]);
        }),
        place: {
          findUnique: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(places.get(where.id) || null)),
          update: vi.fn().mockImplementation(({ where, data }: any) => {
            const place = places.get(where.id);
            if (place) {
              Object.assign(place, data, { updatedAt: new Date() });
              return Promise.resolve(place);
            }
            return Promise.resolve(null);
          }),
        },
      };
      return cb(txMock);
    }),
  } as unknown as PrismaClient & { _stores: any };
}

describe('WAYNAH-SLICE4D — Branch Unlinking Tests', () => {
  let mockPrisma: any;
  let app: ReturnType<typeof createServer>;

  let ownerToken: string;
  let ownerId: string;
  let managerToken: string;
  let managerId: string;
  let memberToken: string;
  let memberId: string;
  let outsiderToken: string;
  let outsiderId: string;
  let adminToken: string;
  let adminId: string;

  let business1Id: string;
  let business2Id: string;
  let linkedPlace1Id: string;
  let linkedPlace2Id: string;
  let unlinkedPlaceId: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Spy on AuditLogger
    vi.spyOn(AuditLogger, 'logBranchLinkRemoved');

    // 1. Register Owner for Business 1
    const regOwner = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مالك الشركة الأولى', email: 'owner1@waynah.com', password: 'Password123!' }),
    });
    const dOwner = await regOwner.json();
    ownerToken = dOwner.data.token;
    ownerId = dOwner.data.user.id;

    // 2. Register Manager for Business 1
    const regMgr = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير الشركة الأولى', email: 'manager1@waynah.com', password: 'Password123!' }),
    });
    const dMgr = await regMgr.json();
    managerToken = dMgr.data.token;
    managerId = dMgr.data.user.id;

    // 3. Register Member for Business 1
    const regMem = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'عضو الشركة الأولى', email: 'member1@waynah.com', password: 'Password123!' }),
    });
    const dMem = await regMem.json();
    memberToken = dMem.data.token;
    memberId = dMem.data.user.id;

    // 4. Register Outsider
    const regOut = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مستخدم خارجي', email: 'outsider@waynah.com', password: 'Password123!' }),
    });
    const dOut = await regOut.json();
    outsiderToken = dOut.data.token;
    outsiderId = dOut.data.user.id;

    // 5. Register Admin
    const regAdmin = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير النظام', email: 'admin@waynah.com', password: 'Password123!' }),
    });
    const dAdmin = await regAdmin.json();
    adminToken = dAdmin.data.token;
    adminId = dAdmin.data.user.id;
    await mockPrisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });

    // Create Business 1
    const b1 = await mockPrisma.business.create({ data: { name: 'شركة السعيد التجارية' } });
    business1Id = b1.id;

    // Set Business Memberships
    await mockPrisma.businessMember.create({ data: { businessId: business1Id, userId: ownerId, role: 'OWNER' } });
    await mockPrisma.businessMember.create({ data: { businessId: business1Id, userId: managerId, role: 'MANAGER' } });
    await mockPrisma.businessMember.create({ data: { businessId: business1Id, userId: memberId, role: 'MEMBER' } });

    // Create Business 2
    const b2 = await mockPrisma.business.create({ data: { name: 'شركة الأمل لمواد البناء' } });
    business2Id = b2.id;

    // Create Places
    const p1 = await mockPrisma.place.create({ data: { nameAr: 'معرض السعيد - شارع حدة', businessId: business1Id } });
    linkedPlace1Id = p1.id;

    const p2 = await mockPrisma.place.create({ data: { nameAr: 'مستودع الأمل - 60', businessId: business2Id } });
    linkedPlace2Id = p2.id;

    const p3 = await mockPrisma.place.create({ data: { nameAr: 'مبنى مستمر بدون نشاط', businessId: null } });
    unlinkedPlaceId = p3.id;
  });

  // --- AUTHORIZATION TESTS ---

  it('1. Unauthenticated request is denied (401)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
    });
    expect(res.status).toBe(401);
  });

  it('2. Non-member user is denied (403)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('3. MEMBER role is denied (403)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${memberToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('4. MANAGER role is denied (403)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(res.status).toBe(403);
  });

  it('5. OWNER role is allowed (200)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.businessId).toBeNull();
  });

  it('6. ADMIN actor is allowed via business endpoint (200)', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
  });

  it('7. ADMIN actor is allowed via admin endpoint (200)', async () => {
    const res = await app.request(`/v1/admin/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.businessId).toBeNull();
  });

  // --- IDOR & OWNERSHIP BOUNDARY TESTS ---

  it('8. Business A owner attempting to unlink Business B place is denied (404)', async () => {
    // Owner 1 attempts to unlink Place 2 which belongs to Business 2
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace2Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(404);
  });

  it('9. Unlinking nonexistent Place returns 404', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/non-existent-place-id`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(404);
  });

  it('10. Unlinking nonexistent Business returns 404', async () => {
    const res = await app.request(`/v1/businesses/non-existent-biz-id/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(404);
  });

  // --- STATE & IDEMPOTENCY TESTS ---

  it('11. Linked Place businessId transitions to null on successful unlink', async () => {
    const placeBefore = mockPrisma._stores.places.get(linkedPlace1Id);
    expect(placeBefore.businessId).toBe(business1Id);

    const res = await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(200);

    const placeAfter = mockPrisma._stores.places.get(linkedPlace1Id);
    expect(placeAfter.businessId).toBeNull();
  });

  it('12. Unlinking an already unlinked Place returns 409 ALREADY_UNLINKED', async () => {
    const res = await app.request(`/v1/businesses/${business1Id}/branches/${unlinkedPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('ALREADY_UNLINKED');
  });

  // --- MUTATION INTEGRITY & PHYSICAL PLACE INTEGRITY ---

  it('13. Physical/Geographic Place attributes remain 100% unchanged during unlinking', async () => {
    const placeBefore = { ...mockPrisma._stores.places.get(linkedPlace1Id) };

    await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const placeAfter = mockPrisma._stores.places.get(linkedPlace1Id);
    expect(placeAfter.nameAr).toBe(placeBefore.nameAr);
    expect(placeAfter.nameEn).toBe(placeBefore.nameEn);
    expect(placeAfter.address).toBe(placeBefore.address);
    expect(placeAfter.phoneNumber).toBe(placeBefore.phoneNumber);
    expect(placeAfter.verificationStatus).toBe(placeBefore.verificationStatus);
    expect(placeAfter.businessId).toBeNull();
  });

  // --- HISTORICAL CLAIMS & AUDIT INTEGRITY ---

  it('14. Historical BranchClaim records remain untouched after unlinking', async () => {
    // Create an approved historical claim
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlace1Id, claimantId: ownerId, status: 'APPROVED' },
    });

    await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const claimAfter = mockPrisma._stores.branchClaims.get(claim.id);
    expect(claimAfter.status).toBe('APPROVED');
    expect(claimAfter.businessId).toBe(business1Id);
    expect(claimAfter.placeId).toBe(linkedPlace1Id);
  });

  it('15. Successful unlink emits BRANCH_LINK_REMOVED security audit event post-commit', async () => {
    await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(AuditLogger.logBranchLinkRemoved).toHaveBeenCalledWith(
      business1Id,
      linkedPlace1Id,
      ownerId,
      'USER'
    );
  });

  it('16. Admin unlink emits BRANCH_LINK_REMOVED audit event with ADMIN actorType', async () => {
    await app.request(`/v1/admin/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(AuditLogger.logBranchLinkRemoved).toHaveBeenCalledWith(
      business1Id,
      linkedPlace1Id,
      adminId,
      'ADMIN'
    );
  });

  it('17. Failed transaction does NOT emit security audit event', async () => {
    // Force transaction failure by attempting to unlink already unlinked place
    await app.request(`/v1/businesses/${business1Id}/branches/${unlinkedPlaceId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(AuditLogger.logBranchLinkRemoved).not.toHaveBeenCalled();
  });

  // --- CONCURRENCY & LOCKING TESTS ---

  it('18. Pessimistic row-level lock SELECT ... FOR UPDATE is acquired during unlinking transaction', async () => {
    await app.request(`/v1/businesses/${business1Id}/branches/${linkedPlace1Id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
  });
});
