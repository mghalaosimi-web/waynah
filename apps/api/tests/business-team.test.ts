import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { AuthService } from '../src/services/auth.service.js';
import { EmailService } from '../src/services/email.service.js';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const businessMembers = new Map<string, any>();
  const invitations = new Map<string, any>();

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
      delete: vi.fn().mockImplementation(({ where }) => {
        for (const [k, v] of sessions.entries()) {
          if (v.id === where.id) {
            sessions.delete(k);
            break;
          }
        }
        return Promise.resolve();
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
        if (where.slug) {
          for (const b of businesses.values()) {
            if (b.slug === where.slug) return Promise.resolve({ ...b });
          }
        }
        if (where.id) {
          const biz = businesses.get(where.id);
          if (!biz) return Promise.resolve(null);
          return Promise.resolve({ ...biz });
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
      findMany: vi.fn().mockImplementation(({ where, include }) => {
        const result: any[] = [];
        for (const bm of businessMembers.values()) {
          if (bm.businessId === where.businessId) {
            const user = users.get(bm.userId);
            result.push({ ...bm, user });
          }
        }
        return Promise.resolve(result);
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        if (where.id) {
          for (const bm of businessMembers.values()) {
            if (bm.id === where.id) {
              const user = users.get(bm.userId);
              return Promise.resolve({ ...bm, user });
            }
          }
          return Promise.resolve(null);
        }
        if (where.businessId_userId) {
          const key = `${where.businessId_userId.businessId}:${where.businessId_userId.userId}`;
          const bm = businessMembers.get(key);
          if (!bm) return Promise.resolve(null);
          const user = users.get(bm.userId);
          return Promise.resolve({ ...bm, user });
        }
        return Promise.resolve(null);
      }),
      count: vi.fn().mockImplementation(({ where }) => {
        let cnt = 0;
        for (const bm of businessMembers.values()) {
          if (bm.businessId === where.businessId && bm.role === where.role) {
            cnt++;
          }
        }
        return Promise.resolve(cnt);
      }),
      update: vi.fn().mockImplementation(({ where, data, include }) => {
        let targetBm: any = null;
        for (const [k, bm] of businessMembers.entries()) {
          if (bm.id === where.id) {
            targetBm = bm;
            break;
          }
        }
        if (targetBm) {
          Object.assign(targetBm, data, { updatedAt: new Date() });
          const user = users.get(targetBm.userId);
          return Promise.resolve({ ...targetBm, user });
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockImplementation(({ where, include }) => {
        let targetBm: any = null;
        for (const [k, bm] of businessMembers.entries()) {
          if (bm.id === where.id) {
            targetBm = bm;
            businessMembers.delete(k);
            break;
          }
        }
        if (targetBm) {
          const user = users.get(targetBm.userId);
          return Promise.resolve({ ...targetBm, user });
        }
        return Promise.resolve(null);
      }),
    },
    businessInvitation: {
      create: vi.fn().mockImplementation(({ data, include }) => {
        const id = 'inv-' + Math.random().toString(36).substring(2, 9);
        const newInv = {
          id,
          status: 'PENDING',
          createdAt: new Date(),
          updatedAt: new Date(),
          acceptedAt: null,
          declinedAt: null,
          cancelledAt: null,
          ...data,
        };
        invitations.set(id, newInv);
        const biz = businesses.get(data.businessId);
        const inviter = users.get(data.inviterId);
        return Promise.resolve({ ...newInv, business: biz, inviter });
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        if (where.tokenHash) {
          for (const inv of invitations.values()) {
            if (inv.tokenHash === where.tokenHash) {
              const biz = businesses.get(inv.businessId);
              const inviter = users.get(inv.inviterId);
              return Promise.resolve({ ...inv, business: biz, inviter });
            }
          }
        }
        if (where.id) {
          const inv = invitations.get(where.id);
          if (!inv) return Promise.resolve(null);
          const biz = businesses.get(inv.businessId);
          const inviter = users.get(inv.inviterId);
          return Promise.resolve({ ...inv, business: biz, inviter });
        }
        return Promise.resolve(null);
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        for (const inv of invitations.values()) {
          if (
            inv.businessId === where.businessId &&
            inv.email === where.email &&
            inv.status === where.status &&
            inv.expiresAt > new Date()
          ) {
            return Promise.resolve(inv);
          }
        }
        return Promise.resolve(null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const inv = invitations.get(where.id);
        if (inv) {
          Object.assign(inv, data, { updatedAt: new Date() });
          return Promise.resolve(inv);
        }
        return Promise.resolve(null);
      }),
      findMany: vi.fn().mockImplementation(({ where, include, orderBy }) => {
        const result: any[] = [];
        for (const inv of invitations.values()) {
          const statusMatch = !where?.status || inv.status === where.status;
          const bizMatch = !where?.businessId || inv.businessId === where.businessId;
          const expiresMatch = !where?.expiresAt?.gt || inv.expiresAt > where.expiresAt.gt;
          if (statusMatch && bizMatch && expiresMatch) {
            const inviter = users.get(inv.inviterId);
            result.push({ ...inv, inviter });
          }
        }
        return Promise.resolve(result);
      }),
    },
    $transaction: vi.fn().mockImplementation((cb) => {
      if (Array.isArray(cb)) {
        return Promise.all(cb);
      }
      return cb(mockClient);
    }),
    $queryRaw: vi.fn().mockResolvedValue([]),
  };

  return mockClient as PrismaClient;
}

describe('WAYNAH-SLICE-6B.1 — Business Team & Invitations Domain Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  let ownerToken: string;
  let ownerId: string;
  let managerToken: string;
  let managerId: string;
  let memberToken: string;
  let memberId: string;
  let otherUserToken: string;
  let otherUserId: string;

  let businessId: string;
  let managerMemberId: string;
  let memberMemberId: string;

  beforeEach(async () => {
    EmailService.resetProvider();
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);

    // Register Owner
    const reg1 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مالك النشاط', email: 'owner@waynah.com', password: 'Password123!' }),
    });
    const d1 = await reg1.json();
    ownerToken = d1.data.token;
    ownerId = d1.data.user.id;

    // Create Business by Owner
    const bizRes = await app.request('/v1/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ name: 'شركة سبأ للتجارة' }),
    });
    if (bizRes.status !== 201) {
      const txt = await bizRes.text();
      throw new Error(`Create business failed with status ${bizRes.status}: ${txt}`);
    }
    const bizData = await bizRes.json();
    businessId = bizData.data.id;

    // Register Manager User
    const reg2 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير الفرع', email: 'manager@waynah.com', password: 'Password123!' }),
    });
    const d2 = await reg2.json();
    managerToken = d2.data.token;
    managerId = d2.data.user.id;

    // Directly assign Manager role for test setup
    const bmManager = await mockPrisma.businessMember.create({
      data: { businessId, userId: managerId, role: 'MANAGER' },
    });
    managerMemberId = bmManager.id;

    // Register Normal Member User
    const reg3 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'عضو الفريق', email: 'member@waynah.com', password: 'Password123!' }),
    });
    const d3 = await reg3.json();
    memberToken = d3.data.token;
    memberId = d3.data.user.id;

    const bmMember = await mockPrisma.businessMember.create({
      data: { businessId, userId: memberId, role: 'MEMBER' },
    });
    memberMemberId = bmMember.id;

    // Register Other User (not team member)
    const reg4 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مستخدم آخر', email: 'other@waynah.com', password: 'Password123!' }),
    });
    const d4 = await reg4.json();
    otherUserToken = d4.data.token;
    otherUserId = d4.data.user.id;
  });

  // --- 1. INVITATIONS CREATION & ROLE PERMISSIONS ---

  it('1. Owner can invite MEMBER', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'newmember@waynah.com', role: 'MEMBER' }),
    });

    if (res.status !== 201) {
      const txt = await res.text();
      throw new Error(`Invite member failed with status ${res.status}: ${txt}`);
    }

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.invitation.role).toBe('MEMBER');
    expect(data.data.rawToken).toBeDefined();

    // Verify email sent
    const emails = EmailService.getProvider().getSentEmailsTo('newmember@waynah.com');
    expect(emails.length).toBe(1);
    expect(emails[0].type).toBe('BUSINESS_INVITATION');
  });

  it('2. Owner can invite MANAGER', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'newmanager@waynah.com', role: 'MANAGER' }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.data.invitation.role).toBe('MANAGER');
  });

  it('3. Manager can invite MEMBER', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ email: 'staff@waynah.com', role: 'MEMBER' }),
    });

    expect(res.status).toBe(201);
  });

  it('4. Manager CANNOT invite MANAGER (403)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ email: 'manager2@waynah.com', role: 'MANAGER' }),
    });

    expect(res.status).toBe(403);
  });

  it('5. Manager CANNOT invite OWNER (400 or 403)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ email: 'coowner@waynah.com', role: 'OWNER' }),
    });

    expect([400, 403]).toContain(res.status);
  });

  it('6. MEMBER cannot mutate team or send invitations (403)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${memberToken}` },
      body: JSON.stringify({ email: 'anyone@waynah.com', role: 'MEMBER' }),
    });

    expect(res.status).toBe(403);
  });

  it('7. Duplicate active invitation returns 409', async () => {
    // Invite once
    await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'dup@waynah.com', role: 'MEMBER' }),
    });

    // Invite twice
    const res2 = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'dup@waynah.com', role: 'MEMBER' }),
    });

    expect(res2.status).toBe(409);
    const data = await res2.json();
    expect(data.error.message).toBe('توجد دعوة نشطة بالفعل لهذا البريد الإلكتروني');
  });

  // --- TOKEN SECURITY & AUDIT LOGGING ---

  it('10. Invitation token is hashed at rest (never stored raw)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'hashtest@waynah.com', role: 'MEMBER' }),
    });

    if (res.status !== 201) {
      const txt = await res.text();
      throw new Error(`Test 10 invite failed with status ${res.status}: ${txt}`);
    }

    const data = await res.json();
    const rawToken = data.data.rawToken;
    const invId = data.data.invitation.id;

    const storedInv = await mockPrisma.businessInvitation.findUnique({ where: { id: invId } });
    expect(storedInv.tokenHash).not.toBe(rawToken);
    expect(storedInv.tokenHash).toBe(AuthService.hashToken(rawToken));
  });

  // --- PREVIEW & LIFECYCLE ---

  it('12. Valid preview succeeds with safe metadata and Cache-Control: no-store', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'candidate@waynah.com', role: 'MEMBER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    const previewRes = await app.request(`/v1/businesses/invitations/preview?token=${rawToken}`);

    expect(previewRes.status).toBe(200);
    expect(previewRes.headers.get('Cache-Control')).toContain('no-store');

    const previewData = await previewRes.json();
    expect(previewData.data.businessName).toBe('شركة سبأ للتجارة');
    expect(previewData.data.email).toBe('candidate@waynah.com');
    expect(previewData.data.rawToken).toBeUndefined();
    expect(previewData.data.id).toBeUndefined();
  });

  it('13. Expired or malformed preview fails (400)', async () => {
    const previewRes = await app.request('/v1/businesses/invitations/preview?token=invalidtoken123');
    expect(previewRes.status).toBe(400);
  });

  // --- ACCEPTANCE & DECLINE ---

  it('15. Existing user accepts invitation', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'other@waynah.com', role: 'MEMBER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    const acceptRes = await app.request('/v1/businesses/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ token: rawToken }),
    });

    expect(acceptRes.status).toBe(200);

    // Verify membership added
    const memList = await app.request(`/v1/businesses/${businessId}/members`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const memData = await memList.json();
    expect(memData.data.some((m: any) => m.userId === otherUserId)).toBe(true);
  });

  it('16. Acceptance with mismatched email returns 403 INVITATION_EMAIL_MISMATCH', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'someoneelse@waynah.com', role: 'MEMBER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    // User "other@waynah.com" tries to accept invitation sent to "someoneelse@waynah.com"
    const acceptRes = await app.request('/v1/businesses/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ token: rawToken }),
    });

    expect(acceptRes.status).toBe(403);
  });

  it('17. Already a member accepting invitation returns 409 USER_ALREADY_BUSINESS_MEMBER', async () => {
    // Invite existing member email
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'unrelated@waynah.com', role: 'MEMBER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    // Before accepting, force add user to business
    await mockPrisma.businessMember.create({
      data: { businessId, userId: otherUserId, role: 'MEMBER' },
    });
    // Manually change invitation target email to otherUser email
    const tokenHash = AuthService.hashToken(rawToken);
    const inv = await mockPrisma.businessInvitation.findUnique({ where: { tokenHash } });
    await mockPrisma.businessInvitation.update({
      where: { id: inv.id },
      data: { email: 'other@waynah.com' },
    });

    const acceptRes = await app.request('/v1/businesses/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ token: rawToken }),
    });

    expect(acceptRes.status).toBe(409);
  });

  it('18. Invitation decline sets DECLINED status', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'other@waynah.com', role: 'MEMBER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    const declineRes = await app.request('/v1/businesses/invitations/decline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ token: rawToken }),
    });

    expect(declineRes.status).toBe(200);

    // Terminal state cannot be accepted
    const reAcceptRes = await app.request('/v1/businesses/invitations/accept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ token: rawToken }),
    });
    expect(reAcceptRes.status).toBe(400);
  });

  // --- CANCELLATION ---

  it('19. Owner can cancel any invitation', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'tocancel@waynah.com', role: 'MEMBER' }),
    });
    const invId = (await inviteRes.json()).data.invitation.id;

    const cancelRes = await app.request(`/v1/businesses/${businessId}/invitations/${invId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(cancelRes.status).toBe(200);
  });

  it('20. Manager can cancel MEMBER invitation', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'membercancel@waynah.com', role: 'MEMBER' }),
    });
    const invId = (await inviteRes.json()).data.invitation.id;

    const cancelRes = await app.request(`/v1/businesses/${businessId}/invitations/${invId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(cancelRes.status).toBe(200);
  });

  it('21. Manager CANNOT cancel MANAGER invitation (403)', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'managercancel@waynah.com', role: 'MANAGER' }),
    });
    const invId = (await inviteRes.json()).data.invitation.id;

    const cancelRes = await app.request(`/v1/businesses/${businessId}/invitations/${invId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(cancelRes.status).toBe(403);
  });

  // --- ROLE CHANGES & SOLE OWNER INVARIANT ---

  it('22. Owner promotes MEMBER -> OWNER', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/${memberMemberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ role: 'OWNER' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.role).toBe('OWNER');
  });

  it('26. Sole owner demotion returns 400 CANNOT_REMOVE_SOLE_OWNER', async () => {
    // Locate owner member record
    const memList = await app.request(`/v1/businesses/${businessId}/members`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerMember = (await memList.json()).data.find((m: any) => m.userId === ownerId);

    const res = await app.request(`/v1/businesses/${businessId}/members/${ownerMember.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ role: 'MANAGER' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.message || data.error.code).toContain('المالك الوحيد');
  });

  it('27. Sole owner removal returns 400 CANNOT_REMOVE_SOLE_OWNER', async () => {
    const memList = await app.request(`/v1/businesses/${businessId}/members`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });
    const ownerMember = (await memList.json()).data.find((m: any) => m.userId === ownerId);

    const res = await app.request(`/v1/businesses/${businessId}/members/${ownerMember.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(400);
  });

  it('28. Owner removes staff member successfully', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/${memberMemberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(200);
  });

  it('29. Manager removes MEMBER successfully', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/${memberMemberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(res.status).toBe(200);
  });

  it('30. Manager CANNOT remove MANAGER (403)', async () => {
    // Create another manager
    const regExtra = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'مدير 2', email: 'mgr2@waynah.com', password: 'Password123!' }),
    });
    const extraUserId = (await regExtra.json()).data.user.id;
    const bmExtra = await mockPrisma.businessMember.create({
      data: { businessId, userId: extraUserId, role: 'MANAGER' },
    });

    const res = await app.request(`/v1/businesses/${businessId}/members/${bmExtra.id}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(res.status).toBe(403);
  });

  it('31. Manager CANNOT change roles (403)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/members/${memberMemberId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${managerToken}` },
      body: JSON.stringify({ role: 'MANAGER' }),
    });

    expect(res.status).toBe(403);
  });

  it('32. IDOR attempts across businesses fail with 403/404', async () => {
    // Create business 2 by other user
    const biz2Res = await app.request('/v1/businesses', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${otherUserToken}` },
      body: JSON.stringify({ name: 'نشاط تجاري منفصل' }),
    });
    const biz2Id = (await biz2Res.json()).data.id;

    // Owner of business 1 tries to remove member of business 2
    const res = await app.request(`/v1/businesses/${biz2Id}/members/${memberMemberId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect([403, 404]).toContain(res.status);
  });

  // --- UNREGISTERED INVITATION REGISTRATION ---

  it('33-35. Unregistered invitation registration creates verified USER & BusinessMember atomically', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'newuser@waynah.com', role: 'MANAGER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    const regRes = await app.request('/v1/auth/register-with-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'مستخدم جديد بدعوة',
        email: 'newuser@waynah.com',
        password: 'Password123!',
        token: rawToken,
      }),
    });

    expect(regRes.status).toBe(201);
    const data = await regRes.json();
    expect(data.success).toBe(true);
    expect(data.data.user.emailVerified).toBe(true);
    expect(data.data.token).toBeDefined();

    // Verify BusinessMember was created with MANAGER role
    const newUserId = data.data.user.id;
    const membership = await mockPrisma.businessMember.findUnique({
      where: { businessId_userId: { businessId, userId: newUserId } },
    });
    expect(membership).toBeDefined();
    expect(membership.role).toBe('MANAGER');
  });

  it('36-37. Registration with wrong email returns 403 INVITATION_EMAIL_MISMATCH and does not consume invitation', async () => {
    const inviteRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'target@waynah.com', role: 'MEMBER' }),
    });
    const { rawToken } = (await inviteRes.json()).data;

    const regRes = await app.request('/v1/auth/register-with-invitation', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'اسم مختلف',
        email: 'wrongemail@waynah.com',
        password: 'Password123!',
        token: rawToken,
      }),
    });

    expect(regRes.status).toBe(403);

    // Verify invitation is still PENDING
    const tokenHash = AuthService.hashToken(rawToken);
    const inv = await mockPrisma.businessInvitation.findUnique({ where: { tokenHash } });
    expect(inv.status).toBe('PENDING');
  });

  // --- GET /invitations — 6B.2 New Endpoint ---

  it('40. OWNER can list pending invitations (GET /:id/invitations)', async () => {
    // Create a pending invitation
    await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'listed@waynah.com', role: 'MEMBER' }),
    });

    const res = await app.request(`/v1/businesses/${businessId}/invitations`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
    expect(data.data[0].email).toBe('listed@waynah.com');
    expect(data.data[0].status).toBe('PENDING');
  });

  it('41. MANAGER can list pending invitations', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/invitations`, {
      headers: { Authorization: `Bearer ${managerToken}` },
    });

    expect(res.status).toBe(200);
  });

  it('42. Non-member cannot list invitations (403)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/invitations`, {
      headers: { Authorization: `Bearer ${otherUserToken}` },
    });

    expect(res.status).toBe(403);
  });

  it('43. Unauthenticated cannot list invitations (401)', async () => {
    const res = await app.request(`/v1/businesses/${businessId}/invitations`);
    expect(res.status).toBe(401);
  });

  it('44. Cancelled invitation is NOT returned in pending list', async () => {
    // Create invitation
    const invRes = await app.request(`/v1/businesses/${businessId}/members/invite`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${ownerToken}` },
      body: JSON.stringify({ email: 'tocancel2@waynah.com', role: 'MEMBER' }),
    });
    const invId = (await invRes.json()).data.invitation.id;

    // Cancel it
    await app.request(`/v1/businesses/${businessId}/invitations/${invId}`, {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    // List should not include it (status CANCELLED)
    const listRes = await app.request(`/v1/businesses/${businessId}/invitations`, {
      headers: { Authorization: `Bearer ${ownerToken}` },
    });

    const data = await listRes.json();
    expect(data.success).toBe(true);
    expect(data.data.every((inv: any) => inv.id !== invId)).toBe(true);
  });
});

