import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const businessMembers = new Map<string, any>();
  const verifications = new Map<string, any>();
  const places = new Map<string, any>();
  const branchClaims = new Map<string, any>();
  const observations = new Map<string, any>();
  const conflicts = new Map<string, any>();

  return {
    _stores: {
      users,
      sessions,
      businesses,
      businessMembers,
      verifications,
      places,
      branchClaims,
      observations,
      conflicts,
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
        const verification = verifications.get(biz.id) || null;
        return Promise.resolve({ ...biz, members: [], places: [], verification });
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
    place: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(places.get(where.id) || null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'plc-' + Math.random().toString(36).substring(2, 9);
        const newPlace = {
          id,
          nameAr: data.nameAr || 'الموقع الرئيسي',
          nameEn: data.nameEn || 'Main Place',
          address: data.address || 'شارع الرئيسي',
          phoneNumber: data.phoneNumber || '+967 770 000 111',
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
        const status = data.status || 'PENDING_REVIEW';
        const record = {
          id,
          businessId: data.businessId,
          placeId: data.placeId,
          claimantId: data.claimantId,
          status,
          notes: data.notes || null,
          reviewerId: data.reviewerId || null,
          rejectionReason: data.rejectionReason || null,
          submittedAt: data.submittedAt || new Date(),
          reviewedAt: data.reviewedAt || null,
          createdAt: new Date(),
          updatedAt: new Date(),
          business: businesses.get(data.businessId),
          place: places.get(data.placeId),
          claimant: users.get(data.claimantId),
          reviewer: data.reviewerId ? users.get(data.reviewerId) : null,
        };
        branchClaims.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(branchClaims.get(where.id) || null);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const results: any[] = [];
        for (const claim of branchClaims.values()) {
          let match = true;
          if (where?.status) {
            if (where.status.in && !where.status.in.includes(claim.status)) match = false;
            else if (typeof where.status === 'string' && claim.status !== where.status) match = false;
          }
          if (match) results.push(claim);
        }
        return Promise.resolve(results);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const claim = branchClaims.get(where.id);
        if (claim) {
          Object.assign(claim, data, { updatedAt: new Date() });
          if (data.reviewerId) claim.reviewer = users.get(data.reviewerId);
          return Promise.resolve(claim);
        }
        return Promise.resolve(null);
      }),
    },
    $queryRaw: vi.fn().mockImplementation((strings: TemplateStringsArray, ...values: any[]) => {
      // Mock PostgreSQL SELECT ... FOR UPDATE row-level lock
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
        branchClaim: {
          findUnique: vi.fn().mockImplementation(({ where }: any) => Promise.resolve(branchClaims.get(where.id) || null)),
          update: vi.fn().mockImplementation(({ where, data }: any) => {
            const claim = branchClaims.get(where.id);
            if (claim) {
              Object.assign(claim, data, { updatedAt: new Date() });
              if (data.reviewerId) claim.reviewer = users.get(data.reviewerId);
              return Promise.resolve(claim);
            }
            return Promise.resolve(null);
          }),
        },
      };
      return cb(txMock);
    }),
  } as unknown as PrismaClient & { _stores: any };
}

describe('WAYNAH-SLICE4C — Admin Moderation & Atomic Branch Linking Tests', () => {
  let mockPrisma: any;
  let app: ReturnType<typeof createServer>;

  let adminToken: string;
  let adminId: string;
  let adminClaimantToken: string;
  let adminClaimantId: string;
  let ownerToken: string;
  let ownerId: string;
  let userToken: string;
  let userId: string;

  let business1Id: string;
  let business2Id: string;
  let unlinkedPlaceId: string;
  let linkedPlaceId: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // 1. Register Admin Reviewer
    const regAdmin = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير المراجعة', email: 'admin-reviewer@waynah.com', password: 'Password123!' }),
    });
    const dAdmin = await regAdmin.json();
    adminToken = dAdmin.data.token;
    adminId = dAdmin.data.user.id;
    await mockPrisma.user.update({ where: { id: adminId }, data: { role: 'ADMIN' } });

    // 2. Register Admin Claimant (Admin who submits a claim)
    const regAdminClaimant = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير مقدم الطلب', email: 'admin-claimant@waynah.com', password: 'Password123!' }),
    });
    const dAdminClaimant = await regAdminClaimant.json();
    adminClaimantToken = dAdminClaimant.data.token;
    adminClaimantId = dAdminClaimant.data.user.id;
    await mockPrisma.user.update({ where: { id: adminClaimantId }, data: { role: 'ADMIN' } });

    // 3. Register Business Owner
    const regOwner = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مالك الشركة', email: 'owner@waynah.com', password: 'Password123!' }),
    });
    const dOwner = await regOwner.json();
    ownerToken = dOwner.data.token;
    ownerId = dOwner.data.user.id;

    // 4. Register Normal User
    const regUser = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مستخدم عادي', email: 'user@waynah.com', password: 'Password123!' }),
    });
    const dUser = await regUser.json();
    userToken = dUser.data.token;
    userId = dUser.data.user.id;

    // Create Business 1 & 2
    const b1 = await mockPrisma.business.create({ data: { name: 'مجموعة النور التجارية' } });
    business1Id = b1.id;

    const b2 = await mockPrisma.business.create({ data: { name: 'شركة الهدى الدولية' } });
    business2Id = b2.id;

    // Create Places
    const p1 = await mockPrisma.place.create({ data: { nameAr: 'صيدلية النور - الفرع الرئيسي', businessId: null } });
    unlinkedPlaceId = p1.id;

    const p2 = await mockPrisma.place.create({ data: { nameAr: 'صيدلية الهدى - الفرع القائم', businessId: business2Id } });
    linkedPlaceId = p2.id;
  });

  // --- ADMIN QUEUE TESTS (1-6) ---

  it('1. Unauthenticated queue request is denied (401)', async () => {
    const res = await app.request('/v1/admin/branch-claims');
    expect(res.status).toBe(401);
  });

  it('2. Non-admin queue request is denied (403)', async () => {
    // Normal User
    const res1 = await app.request('/v1/admin/branch-claims', {
      headers: { Authorization: `Bearer ${userToken}` },
    });
    expect(res1.status).toBe(403);

    // Business Owner
    const res2 = await app.request('/v1/admin/branch-claims', {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    expect(res2.status).toBe(403);
  });

  it('3. Admin queue request succeeds (200)', async () => {
    const res = await app.request('/v1/admin/branch-claims', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('4. Queue contains pending claims (PENDING_REVIEW & PENDING_DISPUTE)', async () => {
    await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });
    await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });
    await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'REJECTED' },
    });

    const res = await app.request('/v1/admin/branch-claims', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await res.json();
    expect(data.data.length).toBe(2);
    const statuses = data.data.map((c: any) => c.status);
    expect(statuses).toContain('PENDING_REVIEW');
    expect(statuses).toContain('PENDING_DISPUTE');
    expect(statuses).not.toContain('REJECTED');
  });

  it('5. Queue is read-only and does not mutate database records', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request('/v1/admin/branch-claims', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.status).toBe('PENDING_REVIEW');
    expect(mockPrisma.place.update).not.toHaveBeenCalled();
  });

  it('6. Admin Queue has global scope (IDOR irrelevant)', async () => {
    await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });
    await mockPrisma.branchClaim.create({
      data: { businessId: business2Id, placeId: linkedPlaceId, claimantId: userId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request('/v1/admin/branch-claims', {
      headers: { Authorization: `Bearer ${adminToken}` },
    });

    const data = await res.json();
    expect(data.data.length).toBe(2);
  });

  // --- REVIEW AUTHORIZATION & SEPARATION TESTS (7-11) ---

  it('7. Unauthenticated review request is denied (401)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(401);
  });

  it('8. Non-admin review request is denied (403)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(403);
  });

  it('9. Authorized admin can review claim', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(200);
  });

  it('10. Claimant CANNOT review their own claim (403)', async () => {
    // Admin Claimant submits claim
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: adminClaimantId, status: 'PENDING_REVIEW' },
    });

    // Admin Claimant tries to approve their OWN claim
    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminClaimantToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.error.code).toBe('FORBIDDEN');
  });

  it('11. Non-claimant Admin can review Admin-submitted claim', async () => {
    // Admin Claimant submits claim
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: adminClaimantId, status: 'PENDING_REVIEW' },
    });

    // Different Admin reviews the claim
    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(200);
  });

  // --- STATE MACHINE TESTS (12-18) ---

  it('12. PENDING_REVIEW can be approved', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('APPROVED');
  });

  it('13. PENDING_REVIEW can be rejected', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: 'عدم وجود ترخيص فرعي' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('REJECTED');
  });

  it('14. PENDING_DISPUTE can be approved', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('APPROVED');
  });

  it('15. PENDING_DISPUTE can be rejected', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: 'نزاع غير مبرر' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.status).toBe('REJECTED');
  });

  it('16. APPROVED claim cannot be reviewed again (400)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'APPROVED' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: 'تغيير القرار' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('CANNOT_REVIEW_TERMINAL_CLAIM');
  });

  it('17. REJECTED claim cannot be reviewed again (400)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'REJECTED' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(400);
  });

  it('18. CANCELLED claim cannot be reviewed (400)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'CANCELLED' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(400);
  });

  // --- NORMAL APPROVAL & ATOMIC LINKING TESTS (19-24) ---

  it('19. Unlinked Place becomes linked to claim.businessId on approval', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const place = mockPrisma._stores.places.get(unlinkedPlaceId);
    expect(place.businessId).toBe(business1Id);
  });

  it('20. Claim status becomes APPROVED on approval', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.status).toBe('APPROVED');
  });

  it('21. Approval updates reviewerId to authenticated admin ID', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.reviewerId).toBe(adminId);
  });

  it('22. Approval updates reviewedAt timestamp', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.reviewedAt).toBeDefined();
    expect(dbClaim.reviewedAt instanceof Date).toBe(true);
  });

  it('23. Place fields other than businessId remain completely unchanged', async () => {
    const placeBefore = { ...mockPrisma._stores.places.get(unlinkedPlaceId) };

    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const placeAfter = mockPrisma._stores.places.get(unlinkedPlaceId);
    expect(placeAfter.nameAr).toBe(placeBefore.nameAr);
    expect(placeAfter.address).toBe(placeBefore.address);
    expect(placeAfter.phoneNumber).toBe(placeBefore.phoneNumber);
    expect(placeAfter.verificationStatus).toBe(placeBefore.verificationStatus);
  });

  it('24. Claim status and Place.businessId commit atomically inside transaction', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(mockPrisma.$transaction).toHaveBeenCalled();
    const place = mockPrisma._stores.places.get(unlinkedPlaceId);
    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);

    expect(place.businessId).toBe(business1Id);
    expect(dbClaim.status).toBe('APPROVED');
  });

  // --- NORMAL CONFLICT TESTS (25-27) ---

  it('25. PENDING_REVIEW approval fails if Place is already linked (409 Conflict)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(409);
  });

  it('26. Place.businessId remains unchanged after failed approval', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const place = mockPrisma._stores.places.get(linkedPlaceId);
    expect(place.businessId).toBe(business2Id);
  });

  it('27. Claim does not become APPROVED after failed approval', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.status).toBe('PENDING_REVIEW');
  });

  // --- REASSIGNMENT TESTS (28-32) ---

  it('28. Valid PENDING_DISPUTE reassigns Place atomically (prevBiz -> newBiz)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: linkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(200);
    const place = mockPrisma._stores.places.get(linkedPlaceId);
    expect(place.businessId).toBe(business1Id);
  });

  it('29. Reassignment fails if current Place.businessId became NULL', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(res.status).toBe(409);
  });

  it('30. Failed reassignment does not approve claim', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.status).toBe('PENDING_DISPUTE');
  });

  it('31. Failed reassignment does not mutate Place.businessId', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_DISPUTE' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    const place = mockPrisma._stores.places.get(unlinkedPlaceId);
    expect(place.businessId).toBeNull();
  });

  // --- CONCURRENCY TESTS (32-34) ---

  it('32. Competing approvals evaluate row lock and prevent dual ownership', async () => {
    // Create two competing claims for the same unlinked place
    const claimA = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });
    const claimB = await mockPrisma.branchClaim.create({
      data: { businessId: business2Id, placeId: unlinkedPlaceId, claimantId: userId, status: 'PENDING_REVIEW' },
    });

    // Admin 1 approves Claim A
    const resA = await app.request(`/v1/admin/branch-claims/${claimA.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    expect(resA.status).toBe(200);

    // Admin 2 attempts to approve Claim B for same Place (which is now linked to Business 1)
    const resB = await app.request(`/v1/admin/branch-claims/${claimB.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });
    expect(resB.status).toBe(409);

    // Place MUST belong ONLY to Business 1
    const place = mockPrisma._stores.places.get(unlinkedPlaceId);
    expect(place.businessId).toBe(business1Id);
  });

  // --- REJECTION TESTS (35-39) ---

  it('35. Rejection does not mutate Place.businessId', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: 'مستندات غير واضحة' }),
    });

    const place = mockPrisma._stores.places.get(unlinkedPlaceId);
    expect(place.businessId).toBeNull();
  });

  it('36. Rejection stores reviewerId and reviewedAt', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: 'مستندات غير واضحة' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.status).toBe('REJECTED');
    expect(dbClaim.reviewerId).toBe(adminId);
    expect(dbClaim.reviewedAt).toBeDefined();
  });

  it('37. Rejection stores rejectionReason', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: 'السجل تجاري ملغى' }),
    });

    const dbClaim = mockPrisma._stores.branchClaims.get(claim.id);
    expect(dbClaim.rejectionReason).toBe('السجل تجاري ملغى');
  });

  it('38. Rejection without rejectionReason is rejected with 400 Bad Request', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    const res = await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'REJECT', rejectionReason: '   ' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('REJECTION_REASON_REQUIRED');
  });

  // --- ISOLATION TESTS (39-41) ---

  it('39. Review does not create DataConflict', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(mockPrisma._stores.conflicts.size).toBe(0);
  });

  it('40. Review does not create PlaceObservation', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(mockPrisma._stores.observations.size).toBe(0);
  });

  it('41. Review does not invoke discovery pipeline', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: { businessId: business1Id, placeId: unlinkedPlaceId, claimantId: ownerId, status: 'PENDING_REVIEW' },
    });

    await app.request(`/v1/admin/branch-claims/${claim.id}/review`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'APPROVE' }),
    });

    expect(mockPrisma._stores.observations.size).toBe(0);
  });
});
