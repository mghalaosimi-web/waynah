import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server.js';
import { AuthService } from '../src/services/auth.service.js';
import { EmailService } from '../src/services/email.service.js';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const accountTokens = new Map<string, any>();

  const mock: any = {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email) return Promise.resolve({ ...u });
          }
        }
        if (where.id) {
          const u = users.get(where.id);
          return Promise.resolve(u ? { ...u } : null);
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = {
          id,
          emailVerified: false,
          emailVerifiedAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          ...data,
        };
        users.set(id, newUser);
        return Promise.resolve({ ...newUser });
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const u = users.get(where.id);
        if (u) {
          const updated = { ...u, ...data };
          users.set(where.id, updated);
          return Promise.resolve({ ...updated });
        }
        return Promise.resolve(null);
      }),
      deleteMany: vi.fn().mockResolvedValue({ count: 0 }),
    },
    session: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'ses-' + Math.random().toString(36).substring(2, 9);
        const newSession = { id, createdAt: new Date(), ...data };
        sessions.set(data.token, newSession);
        return Promise.resolve({ ...newSession });
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        const session = sessions.get(where.token);
        if (!session) return Promise.resolve(null);
        if (include?.user) {
          const user = users.get(session.userId);
          return Promise.resolve({ ...session, user: user ? { ...user } : null });
        }
        return Promise.resolve({ ...session });
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        if (where.id) {
          for (const [k, v] of sessions.entries()) {
            if (v.id === where.id) {
              sessions.delete(k);
              break;
            }
          }
        } else if (where.token) {
          sessions.delete(where.token);
        }
        return Promise.resolve({ count: 1 });
      }),
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        let count = 0;
        if (where.userId) {
          for (const [k, v] of sessions.entries()) {
            if (v.userId === where.userId) {
              sessions.delete(k);
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        for (const [k, v] of sessions.entries()) {
          if (v.id === where.id) {
            const updated = { ...v, ...data };
            sessions.set(k, updated);
            return Promise.resolve({ ...updated });
          }
        }
        return Promise.resolve({ id: where.id, ...data });
      }),
    },
    accountToken: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'tok-' + Math.random().toString(36).substring(2, 9);
        const newToken = { id, usedAt: null, createdAt: new Date(), ...data };
        accountTokens.set(data.tokenHash, newToken);
        return Promise.resolve({ ...newToken });
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        const token = accountTokens.get(where.tokenHash);
        if (!token) return Promise.resolve(null);
        if (include?.user) {
          const user = users.get(token.userId);
          return Promise.resolve({ ...token, user: user ? { ...user } : null });
        }
        return Promise.resolve({ ...token });
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        for (const [k, v] of accountTokens.entries()) {
          if (v.id === where.id) {
            const updated = { ...v, ...data };
            accountTokens.set(k, updated);
            return Promise.resolve({ ...updated });
          }
        }
        return Promise.resolve(null);
      }),
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        let count = 0;
        for (const [k, v] of accountTokens.entries()) {
          let matches = true;
          if (where.userId && v.userId !== where.userId) matches = false;
          if (where.type && v.type !== where.type) matches = false;
          if (matches) {
            accountTokens.delete(k);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
    },
    $transaction: vi.fn().mockImplementation(async (operations: any) => {
      if (Array.isArray(operations)) {
        return Promise.all(operations);
      }
      if (typeof operations === 'function') {
        return operations(mock);
      }
      return Promise.resolve([]);
    }),
    $queryRaw: vi.fn().mockResolvedValue([]),
  };

  return mock as PrismaClient;
}

describe('WAYNAH-SLICE5B — Account Email Verification & Credential Recovery Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    EmailService.resetProvider();
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  /* -------------------------------------------------------------------------- */
  /*                             EMAIL VERIFICATION                             */
  /* -------------------------------------------------------------------------- */

  describe('1. Email Verification Flow', () => {
    it('1. Registration automatically creates email verification token and sends email', async () => {
      const email = `user1-${Date.now()}@test-5b.com`;
      const res = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User 1',
          email,
          password: 'Password123!',
        }),
      });

      expect(res.status).toBe(201);
      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user.emailVerified).toBe(false);

      // Verify email provider recorded message
      const provider = EmailService.getProvider();
      const sentMessages = provider.getSentEmailsTo(email);
      expect(sentMessages.length).toBe(1);
      expect(sentMessages[0].type).toBe('EMAIL_VERIFICATION');
      expect(sentMessages[0].rawToken).toBeDefined();

      // Verify DB stores hash of token, not raw token
      const rawToken = sentMessages[0].rawToken;
      const expectedHash = AuthService.hashToken(rawToken);

      const dbToken = await mockPrisma.accountToken.findUnique({
        where: { tokenHash: expectedHash },
      });
      expect(dbToken).not.toBeNull();
      expect(dbToken?.type).toBe('EMAIL_VERIFICATION');
      expect(dbToken?.usedAt).toBeNull();
    });

    it('2. POST /v1/auth/verify-email with valid raw token verifies account and sets emailVerifiedAt', async () => {
      const email = `user2-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User 2',
          email,
          password: 'Password123!',
        }),
      });

      const provider = EmailService.getProvider();
      const sentMsg = provider.getSentEmailsTo(email)[0];
      expect(sentMsg).toBeDefined();

      const verifyRes = await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: sentMsg.rawToken }),
      });

      expect(verifyRes.status).toBe(200);
      const verifyData = await verifyRes.json();
      expect(verifyData.success).toBe(true);
      expect(verifyData.data.message).toContain('نجاح');

      // Verify DB User record
      const updatedUser = await mockPrisma.user.findUnique({ where: { email } });
      expect(updatedUser?.emailVerified).toBe(true);
      expect(updatedUser?.emailVerifiedAt).not.toBeNull();

      // Verify DB Token marked used
      const tokenHash = AuthService.hashToken(sentMsg.rawToken);
      const dbToken = await mockPrisma.accountToken.findUnique({ where: { tokenHash } });
      expect(dbToken?.usedAt).not.toBeNull();
    });

    it('3. Reusing an already consumed verification token fails (400 Bad Request)', async () => {
      const email = `user3-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User 3',
          email,
          password: 'Password123!',
        }),
      });

      const provider = EmailService.getProvider();
      const rawToken = provider.getSentEmailsTo(email)[0].rawToken;

      // First verification succeeds
      await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });

      // Second verification attempt fails
      const replayRes = await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });

      expect(replayRes.status).toBe(400);
      const replayData = await replayRes.json();
      expect(replayData.success).toBe(false);
    });

    it('4. Verification with expired token fails (400 Bad Request)', async () => {
      const email = `user4-${Date.now()}@test-5b.com`;
      const regRes = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User 4',
          email,
          password: 'Password123!',
        }),
      });

      const regData = await regRes.json();
      const userId = regData.data.user.id;

      // Create an expired token manually in DB
      const expiredRawToken = AuthService.generateRawToken();
      const expiredHash = AuthService.hashToken(expiredRawToken);
      await mockPrisma.accountToken.create({
        data: {
          userId,
          type: 'EMAIL_VERIFICATION',
          tokenHash: expiredHash,
          expiresAt: new Date(Date.now() - 10000), // expired 10s ago
        },
      });

      const verifyRes = await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: expiredRawToken }),
      });

      expect(verifyRes.status).toBe(400);
    });

    it('5. Verification with malformed or missing token fails (400 Bad Request)', async () => {
      const resMissing = await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      });
      expect(resMissing.status).toBe(400);

      const resInvalid = await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'nonexistent-token-xyz' }),
      });
      expect(resInvalid.status).toBe(400);
    });

    it('6. Email verification preserves active user sessions', async () => {
      const email = `user6-${Date.now()}@test-5b.com`;
      const regRes = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Test User 6',
          email,
          password: 'Password123!',
        }),
      });

      const regData = await regRes.json();
      const sessionToken = regData.data.token;

      // Verify email
      const provider = EmailService.getProvider();
      const rawToken = provider.getSentEmailsTo(email)[0].rawToken;
      await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });

      // Session remains valid
      const meRes = await app.request('/v1/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      expect(meRes.status).toBe(200);
      const meData = await meRes.json();
      expect(meData.data.authenticated).toBe(true);
      expect(meData.data.user.emailVerified).toBe(true);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                             RESEND VERIFICATION                            */
  /* -------------------------------------------------------------------------- */

  describe('2. Resend Verification Flow', () => {
    it('7. Resend verification generates new token for unverified account and returns generic success', async () => {
      const email = `resend1-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Resend User 1',
          email,
          password: 'Password123!',
        }),
      });

      EmailService.resetProvider();

      const resendRes = await app.request('/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      expect(resendRes.status).toBe(200);
      const resendData = await resendRes.json();
      expect(resendData.success).toBe(true);

      const provider = EmailService.getProvider();
      const sentMsgs = provider.getSentEmailsTo(email);
      expect(sentMsgs.length).toBe(1);
    });

    it('8. Resend verification for non-existent email returns same generic success (anti-enumeration)', async () => {
      const nonExistentEmail = `nonexistent-${Date.now()}@test-5b.com`;

      const resendRes = await app.request('/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nonExistentEmail }),
      });

      expect(resendRes.status).toBe(200);
      const resendData = await resendRes.json();
      expect(resendData.success).toBe(true);

      const provider = EmailService.getProvider();
      const sentMsgs = provider.getSentEmailsTo(nonExistentEmail);
      expect(sentMsgs.length).toBe(0);
    });

    it('9. Resend verification for already verified email returns generic success without info leak', async () => {
      const email = `alreadyverified-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: 'Verified User',
          email,
          password: 'Password123!',
        }),
      });

      const provider = EmailService.getProvider();
      const rawToken = provider.getSentEmailsTo(email)[0].rawToken;
      await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });

      EmailService.resetProvider();

      const resendRes = await app.request('/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      expect(resendRes.status).toBe(200);
      expect(provider.getSentEmailsTo(email).length).toBe(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                             PASSWORD RECOVERY                              */
  /* -------------------------------------------------------------------------- */

  describe('3. Forgot Password Flow', () => {
    it('10. Requesting forgot password with valid email creates reset token and sends email', async () => {
      const email = `forgot1-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.1.1' },
        body: JSON.stringify({
          name: 'Forgot User 1',
          email,
          password: 'OldPassword123!',
        }),
      });

      EmailService.resetProvider();

      const forgotRes = await app.request('/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.1.1' },
        body: JSON.stringify({ email }),
      });

      expect(forgotRes.status).toBe(200);
      const forgotData = await forgotRes.json();
      expect(forgotData.success).toBe(true);

      const provider = EmailService.getProvider();
      const sentMsgs = provider.getSentEmailsTo(email);
      expect(sentMsgs.length).toBe(1);
      expect(sentMsgs[0].type).toBe('PASSWORD_RESET');

      // Check DB hash
      const rawToken = sentMsgs[0].rawToken;
      const expectedHash = AuthService.hashToken(rawToken);

      const dbToken = await mockPrisma.accountToken.findUnique({
        where: { tokenHash: expectedHash },
      });
      expect(dbToken).not.toBeNull();
      expect(dbToken?.type).toBe('PASSWORD_RESET');
    });

    it('11. Requesting forgot password for non-existent email returns same generic response (anti-enumeration)', async () => {
      const nonExistent = `nobody-${Date.now()}@test-5b.com`;

      const forgotRes = await app.request('/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.1.2' },
        body: JSON.stringify({ email: nonExistent }),
      });

      expect(forgotRes.status).toBe(200);
      const forgotData = await forgotRes.json();
      expect(forgotData.success).toBe(true);

      const provider = EmailService.getProvider();
      expect(provider.getSentEmailsTo(nonExistent).length).toBe(0);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                              PASSWORD RESET                                */
  /* -------------------------------------------------------------------------- */

  describe('4. Reset Password & Session Revocation Flow', () => {
    it('12. Reset password with valid token updates password, marks token used, and PURGES ALL SESSIONS', async () => {
      const email = `reset1-${Date.now()}@test-5b.com`;
      const regRes = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.1' },
        body: JSON.stringify({
          name: 'Reset User 1',
          email,
          password: 'OldPassword123!',
        }),
      });

      const regData = await regRes.json();
      const oldSessionToken = regData.data.token;

      // Initiate forgot password
      await app.request('/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.1' },
        body: JSON.stringify({ email }),
      });

      const provider = EmailService.getProvider();
      const resetMsg = provider.getSentEmailsTo(email).find((m) => m.type === 'PASSWORD_RESET');
      expect(resetMsg).toBeDefined();
      const rawResetToken = resetMsg!.rawToken;

      // Execute password reset
      const resetRes = await app.request('/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.1' },
        body: JSON.stringify({
          token: rawResetToken,
          newPassword: 'NewPassword456!',
        }),
      });

      expect(resetRes.status).toBe(200);
      const resetData = await resetRes.json();
      expect(resetData.success).toBe(true);

      // Verify OLD SESSION IS PURGED / INVALIDATED
      const meRes = await app.request('/v1/auth/me', {
        headers: { Authorization: `Bearer ${oldSessionToken}`, 'x-forwarded-for': '10.0.2.1' },
      });
      const meData = await meRes.json();
      expect(meData.data.authenticated).toBe(false);

      // Verify OLD PASSWORD LOGIN FAILS
      const oldLoginRes = await app.request('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.1' },
        body: JSON.stringify({
          email,
          password: 'OldPassword123!',
        }),
      });
      expect(oldLoginRes.status).toBe(401);

      // Verify NEW PASSWORD LOGIN SUCCEEDS
      const newLoginRes = await app.request('/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.1' },
        body: JSON.stringify({
          email,
          password: 'NewPassword456!',
        }),
      });
      expect(newLoginRes.status).toBe(200);
      const newLoginData = await newLoginRes.json();
      expect(newLoginData.success).toBe(true);
    });

    it('13. Reusing a password reset token fails (400 Bad Request)', async () => {
      const email = `reuse1-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.2' },
        body: JSON.stringify({
          name: 'Reuse User 1',
          email,
          password: 'OldPassword123!',
        }),
      });

      await app.request('/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.2' },
        body: JSON.stringify({ email }),
      });

      const rawResetToken = EmailService.getProvider().getSentEmailsTo(email)[0].rawToken;

      // First reset succeeds
      await app.request('/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.2' },
        body: JSON.stringify({
          token: rawResetToken,
          newPassword: 'NewPassword456!',
        }),
      });

      // Second reset attempt fails
      const replayRes = await app.request('/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.2' },
        body: JSON.stringify({
          token: rawResetToken,
          newPassword: 'AnotherPassword789!',
        }),
      });

      expect(replayRes.status).toBe(400);
    });

    it('14. Reset password with short password fails (400 Bad Request)', async () => {
      const email = `shortpass-${Date.now()}@test-5b.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.3' },
        body: JSON.stringify({
          name: 'Short Pass User',
          email,
          password: 'OldPassword123!',
        }),
      });

      await app.request('/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.3' },
        body: JSON.stringify({ email }),
      });

      const rawResetToken = EmailService.getProvider().getSentEmailsTo(email)[0].rawToken;

      const resetRes = await app.request('/v1/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-forwarded-for': '10.0.2.3' },
        body: JSON.stringify({
          token: rawResetToken,
          newPassword: 'short',
        }),
      });

      expect(resetRes.status).toBe(400);
    });
  });
});
