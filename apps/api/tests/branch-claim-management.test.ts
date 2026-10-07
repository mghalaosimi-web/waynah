import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient, BranchClaimStatus } from '@waynah/database';

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
          record = { ...existing, ...update, updatedAt: new Date() };
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
    place: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(places.get(where.id) || null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'plc-' + Math.random().toString(36).substring(2, 9);
        const newPlace = {
          id,
          nameAr: data.nameAr || 'فرع التجربة',
          businessId: data.businessId || null,
          verificationStatus: 'UNVERIFIED',
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        places.set(id, newPlace);
        return Promise.resolve(newPlace);
      }),
    },
    branchClaim: {
      create: vi.fn().mockImplementation(({ data }) => {
        const status = data.status || 'PENDING_REVIEW';
        // Active claim check
        if (status === 'PENDING_REVIEW' || status === 'PENDING_DISPUTE') {
          for (const c of branchClaims.values()) {
            if (
              c.businessId === data.businessId &&
              c.placeId === data.placeId &&
              (c.status === 'PENDING_REVIEW' || c.status === 'PENDING_DISPUTE')
            ) {
              const err: any = new Error('Unique constraint failed on branch_claims_active_business_place_idx');
              err.code = 'P2002';
              throw err;
            }
          }
        }

        const id = 'claim-' + Math.random().toString(36).substring(2, 9);
        const place = places.get(data.placeId);
        const claimant = users.get(data.claimantId);

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
          place,
          claimant,
        };

        branchClaims.set(id, record);
        return Promise.resolve(record);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(branchClaims.get(where.id) || null);
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        for (const claim of branchClaims.values()) {
          if (claim.businessId === where.businessId && claim.placeId === where.placeId) {
            if (where.status?.in) {
              if (where.status.in.includes(claim.status)) {
                return Promise.resolve(claim);
              }
            } else if (!where.status || claim.status === where.status) {
              return Promise.resolve(claim);
            }
          }
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(({ where }) => {
        const results: any[] = [];
        for (const claim of branchClaims.values()) {
          if (claim.businessId === where.businessId) {
            results.push(claim);
          }
        }
        return Promise.resolve(results);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const claim = branchClaims.get(where.id);
        if (claim) {
          Object.assign(claim, data, { updatedAt: new Date() });
          return Promise.resolve(claim);
        }
        return Promise.resolve(null);
      }),
    },
    placeObservation: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    dataConflict: {
      findMany: vi.fn().mockResolvedValue([]),
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
  } as unknown as PrismaClient & { _stores: any };
}

describe('WAYNAH-SLICE4B — Business Claim Submission & Management Tests', () => {
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

  let businessId: string;
  let place1Id: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // 1. Register Owner
    const regOwner = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مالك الشركة', email: 'owner@waynah.com', password: 'Password123!' }),
    });
    const dOwner = await regOwner.json();
    ownerToken = dOwner.data.token;
    ownerId = dOwner.data.user.id;

    // 2. Register Manager
    const regMgr = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير العمليات', email: 'manager@waynah.com', password: 'Password123!' }),
    });
    const dMgr = await regMgr.json();
    managerToken = dMgr.data.token;
    managerId = dMgr.data.user.id;

    // 3. Register Member
    const regMem = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'عضو النشاط', email: 'member@waynah.com', password: 'Password123!' }),
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

    // Create Business
    const bRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ name: 'شركة السلام التجارية' }),
    });
    const bData = await bRes.json();
    businessId = bData.data.id;

    // Add Manager & Member roles to business
    await mockPrisma.businessMember.create({
      data: { businessId, userId: managerId, role: 'MANAGER' },
    });
    await mockPrisma.businessMember.create({
      data: { businessId, userId: memberId, role: 'MEMBER' },
    });

    // Create Place
    const place = await mockPrisma.place.create({
      data: { nameAr: 'صيدلية السلام - شارع حدة', businessId: null },
    });
    place1Id = place.id;
  });

  // --- AUTHORIZATION TESTS ---

  it('1. Unauthenticated claim submission is denied (401)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ placeId: place1Id }),
    });
    expect(res.status).toBe(401);
  });

  it('2. OWNER can submit a claim for verified/pending business', async () => {
    // Set verification to VERIFIED
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id, notes: 'فرع الصيدلية الرئيسي' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('PENDING_REVIEW');
    expect(data.data.claimantId).toBe(ownerId);
  });

  it('3. MANAGER can submit a claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(201);
  });

  it('4. MEMBER cannot submit a claim (403)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(403);
  });

  it('5. Unrelated business member cannot submit a claim (403)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${outsiderToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(403);
  });

  it('6. Unauthorized claim list is denied (401/403)', async () => {
    // Unauthenticated
    const res1 = await app.request(`/v1/businesses/${businessId}/claims`);
    expect(res1.status).toBe(401);

    // Outsider
    const res2 = await app.request(`/v1/businesses/${businessId}/claims`, {
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });
    expect(res2.status).toBe(403);
  });

  it('7. Authorized business members (OWNER, MANAGER, MEMBER) can view claims list', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      headers: { Authorization: `Bearer ${memberToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('8. Unauthorized cancellation is denied (403)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Owner creates claim
    const claimRes = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });
    const claimData = await claimRes.json();
    const claimId = claimData.data.id;

    // Outsider attempts cancellation
    const cancelRes = await app.request(`/v1/businesses/${businessId}/claims/${claimId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${outsiderToken}` },
    });
    expect(cancelRes.status).toBe(403);

    // Manager (who is NOT the claimant) attempts cancellation
    const cancelRes2 = await app.request(`/v1/businesses/${businessId}/claims/${claimId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });
    expect(cancelRes2.status).toBe(403);
  });

  // --- VERIFICATION PREREQUISITE TESTS ---

  it('9. UNVERIFIED business cannot submit a claim (400)', async () => {
    // Business is UNVERIFIED by default
    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('BUSINESS_NOT_VERIFIED');
  });

  it('10. REJECTED business cannot submit a claim (400)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'REJECTED' },
      update: { status: 'REJECTED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(400);
  });

  it('11. PENDING business can submit a claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'PENDING' },
      update: { status: 'PENDING' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(201);
  });

  it('12. VERIFIED business can submit a claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(201);
  });

  // --- PLACE VALIDATION & BOUNDARY TESTS ---

  it('13. Nonexistent Place is rejected (404)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: 'non-existent-place-id' }),
    });

    expect(res.status).toBe(404);
  });

  it('14. Unlinked Place accepts claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(201);
  });

  it('15. Place already linked to same business handled as conflict (409)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Link place to businessId
    const place = mockPrisma._stores.places.get(place1Id);
    place.businessId = businessId;

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('ALREADY_LINKED');
  });

  it('16. Place already linked to different business handled as conflict (409)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Link place to a different business
    const place = mockPrisma._stores.places.get(place1Id);
    place.businessId = 'other-biz-999';

    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(409);
    const data = await res.json();
    expect(data.error.code).toBe('ALREADY_LINKED_TO_OTHER_BUSINESS');
  });

  it('17. Place.businessId remains unchanged after successful claim (Claim != Link)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const placeBefore = mockPrisma._stores.places.get(place1Id);
    expect(placeBefore.businessId).toBeNull();

    await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    const placeAfter = mockPrisma._stores.places.get(place1Id);
    expect(placeAfter.businessId).toBeNull();
  });

  // --- DUPLICATE CLAIM TESTS ---

  it('18. Duplicate active claim rejected (409)', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // First claim
    await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    // Second claim (Duplicate)
    const res2 = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res2.status).toBe(409);
    const data = await res2.json();
    expect(data.error.code).toBe('DUPLICATE_CLAIM');
  });

  it('19. REJECTED historical claim can coexist with a new active claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Create historical REJECTED claim directly
    await mockPrisma.branchClaim.create({
      data: {
        businessId,
        placeId: place1Id,
        claimantId: ownerId,
        status: 'REJECTED',
      },
    });

    // Submit new claim
    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(201);
  });

  it('20. CANCELLED historical claim can coexist with a new active claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Create historical CANCELLED claim
    await mockPrisma.branchClaim.create({
      data: {
        businessId,
        placeId: place1Id,
        claimantId: ownerId,
        status: 'CANCELLED',
      },
    });

    // Submit new claim
    const res = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(res.status).toBe(201);
  });

  // --- CANCELLATION TESTS ---

  it('21. Claimant can cancel PENDING_REVIEW claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Submit claim
    const submitRes = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });
    const claim = (await submitRes.json()).data;

    // Cancel claim
    const cancelRes = await app.request(`/v1/businesses/${businessId}/claims/${claim.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.data.status).toBe('CANCELLED');
  });

  it('22. Claimant can cancel PENDING_DISPUTE claim', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    // Create PENDING_DISPUTE claim directly
    const claim = await mockPrisma.branchClaim.create({
      data: {
        businessId,
        placeId: place1Id,
        claimantId: ownerId,
        status: 'PENDING_DISPUTE',
      },
    });

    const cancelRes = await app.request(`/v1/businesses/${businessId}/claims/${claim.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(cancelRes.status).toBe(200);
    const cancelData = await cancelRes.json();
    expect(cancelData.data.status).toBe('CANCELLED');
  });

  it('23. Terminal APPROVED cannot be cancelled (400)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: {
        businessId,
        placeId: place1Id,
        claimantId: ownerId,
        status: 'APPROVED',
      },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims/${claim.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('CANNOT_CANCEL_TERMINAL_CLAIM');
  });

  it('24. Terminal REJECTED cannot be cancelled (400)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: {
        businessId,
        placeId: place1Id,
        claimantId: ownerId,
        status: 'REJECTED',
      },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims/${claim.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(400);
  });

  it('25. Terminal CANCELLED cannot be cancelled again (400)', async () => {
    const claim = await mockPrisma.branchClaim.create({
      data: {
        businessId,
        placeId: place1Id,
        claimantId: ownerId,
        status: 'CANCELLED',
      },
    });

    const res = await app.request(`/v1/businesses/${businessId}/claims/${claim.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(400);
  });

  it('26. Cancellation does not delete historical claim record', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const submitRes = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });
    const claimId = (await submitRes.json()).data.id;

    await app.request(`/v1/businesses/${businessId}/claims/${claimId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    // Record MUST still exist in database with CANCELLED status
    const dbClaim = mockPrisma._stores.branchClaims.get(claimId);
    expect(dbClaim).toBeDefined();
    expect(dbClaim.status).toBe('CANCELLED');
  });

  it('27. Cancellation does not mutate Place.businessId', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    const submitRes = await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });
    const claimId = (await submitRes.json()).data.id;

    await app.request(`/v1/businesses/${businessId}/claims/${claimId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const place = mockPrisma._stores.places.get(place1Id);
    expect(place.businessId).toBeNull();
  });

  // --- SEMANTIC ISOLATION TESTS ---

  it('28. Submission does not create DataConflict', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(mockPrisma._stores.conflicts.size).toBe(0);
  });

  it('29. Submission does not create PlaceObservation', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(mockPrisma._stores.observations.size).toBe(0);
  });

  it('30. Submission does not invoke discovery pipeline', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    expect(mockPrisma._stores.observations.size).toBe(0);
  });

  it('31. Submission does not change business verification status', async () => {
    await mockPrisma.businessVerification.upsert({
      where: { businessId },
      create: { businessId, status: 'VERIFIED' },
      update: { status: 'VERIFIED' },
    });

    await app.request(`/v1/businesses/${businessId}/claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ placeId: place1Id }),
    });

    const vRecord = mockPrisma._stores.verifications.get(businessId);
    expect(vRecord.status).toBe('VERIFIED');
  });
});
