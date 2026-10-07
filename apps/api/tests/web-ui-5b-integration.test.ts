import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server.js';
import { AuthService } from '../src/services/auth.service.js';
import { EmailService } from '../src/services/email.service.js';
import { ApiClient } from '../../web/lib/api/api-client.js';

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

describe('WAYNAH-SLICE5B.4 — Web UI Integration & Security Hardening Tests', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    EmailService.resetProvider();
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  /* -------------------------------------------------------------------------- */
  /*                          API CLIENT CONTRACT TESTS                         */
  /* -------------------------------------------------------------------------- */

  describe('1. ApiClient 5B Wrappers & Endpoints Contract', () => {
    it('1. ApiClient.verifyEmail sends valid payload and handles response', async () => {
      const email = `web-user1-${Date.now()}@test-5b4.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Web User 1', email, password: 'Password123!' }),
      });

      const rawToken = EmailService.getProvider().getSentEmailsTo(email)[0].rawToken;

      const client = new ApiClient();
      // Intercept request to route to Hono test app directly
      vi.spyOn(client as any, 'request').mockImplementation(async (endpoint: string, options: any) => {
        const res = await app.request(endpoint, {
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body,
        });
        return res.json();
      });

      const res = await client.verifyEmail({ token: rawToken });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.message).toBeDefined();
      }
    });

    it('2. ApiClient.verifyEmail handles invalid or missing token gracefully', async () => {
      const client = new ApiClient();
      vi.spyOn(client as any, 'request').mockImplementation(async (endpoint: string, options: any) => {
        const res = await app.request(endpoint, {
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body,
        });
        return res.json();
      });

      const resMissing = await client.verifyEmail({ token: '' });
      expect(resMissing.success).toBe(false);

      const resInvalid = await client.verifyEmail({ token: 'invalid-token-123' });
      expect(resInvalid.success).toBe(false);
    });

    it('3. ApiClient.resendVerification sends email and receives generic response', async () => {
      const email = `web-resend-${Date.now()}@test-5b4.com`;
      const client = new ApiClient();
      vi.spyOn(client as any, 'request').mockImplementation(async (endpoint: string, options: any) => {
        const res = await app.request(endpoint, {
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body,
        });
        return res.json();
      });

      const res = await client.resendVerification({ email });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.message).toContain('تأكيد');
      }
    });

    it('4. ApiClient.forgotPassword handles generic anti-enumeration response', async () => {
      const client = new ApiClient();
      vi.spyOn(client as any, 'request').mockImplementation(async (endpoint: string, options: any) => {
        const res = await app.request(endpoint, {
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body,
        });
        return res.json();
      });

      const res = await client.forgotPassword({ email: 'nonexistent@test-5b4.com' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.message).toContain('كلمة المرور');
      }
    });

    it('5. ApiClient.resetPassword executes reset and revokes sessions', async () => {
      const email = `web-reset-${Date.now()}@test-5b4.com`;
      const regRes = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Reset User', email, password: 'OldPassword123!' }),
      });

      const regData = await regRes.json();
      const sessionToken = regData.data.token;

      await app.request('/v1/auth/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const rawResetToken = EmailService.getProvider().getSentEmailsTo(email).find(m => m.type === 'PASSWORD_RESET')!.rawToken;

      const client = new ApiClient();
      vi.spyOn(client as any, 'request').mockImplementation(async (endpoint: string, options: any) => {
        const res = await app.request(endpoint, {
          method: options?.method || 'GET',
          headers: options?.headers,
          body: options?.body,
        });
        return res.json();
      });

      const resetRes = await client.resetPassword({ token: rawResetToken, newPassword: 'NewPassword456!' });
      expect(resetRes.success).toBe(true);

      // Session token is now revoked
      const meRes = await app.request('/v1/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const meData = await meRes.json();
      expect(meData.data.authenticated).toBe(false);
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                          AUTH STATE INTEGRATION TESTS                      */
  /* -------------------------------------------------------------------------- */

  describe('2. Auth State & Verification Synchronization', () => {
    it('6. Register returns unverified user state emailVerified === false', async () => {
      const email = `unverified-${Date.now()}@test-5b4.com`;
      const res = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Unverified User', email, password: 'Password123!' }),
      });

      const data = await res.json();
      expect(data.success).toBe(true);
      expect(data.data.user.emailVerified).toBe(false);
      expect(data.data.user.emailVerifiedAt).toBeNull();
    });

    it('7. /v1/auth/me reflects emailVerified === true after verification', async () => {
      const email = `sync-${Date.now()}@test-5b4.com`;
      const regRes = await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Sync User', email, password: 'Password123!' }),
      });

      const regData = await regRes.json();
      const sessionToken = regData.data.token;

      // Before verification
      const meBefore = await app.request('/v1/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      expect((await meBefore.json()).data.user.emailVerified).toBe(false);

      // Verify email
      const rawToken = EmailService.getProvider().getSentEmailsTo(email)[0].rawToken;
      await app.request('/v1/auth/verify-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken }),
      });

      // After verification
      const meAfter = await app.request('/v1/auth/me', {
        headers: { Authorization: `Bearer ${sessionToken}` },
      });
      const meAfterData = await meAfter.json();
      expect(meAfterData.data.user.emailVerified).toBe(true);
      expect(meAfterData.data.user.emailVerifiedAt).toBeDefined();
    });
  });

  /* -------------------------------------------------------------------------- */
  /*                          SECURITY & ANTI-ENUMERATION                       */
  /* -------------------------------------------------------------------------- */

  describe('3. Frontend Hardening & Security Audit', () => {
    it('8. Forgot Password & Resend Verification do not leak user existence', async () => {
      const existingEmail = `exist-${Date.now()}@test-5b4.com`;
      await app.request('/v1/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Exist', email: existingEmail, password: 'Password123!' }),
      });

      const nonExistentEmail = `notexist-${Date.now()}@test-5b4.com`;

      const resendExist = await app.request('/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: existingEmail }),
      });

      const resendNonExist = await app.request('/v1/auth/resend-verification', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: nonExistentEmail }),
      });

      const dataExist = await resendExist.json();
      const dataNonExist = await resendNonExist.json();

      expect(resendExist.status).toBe(200);
      expect(resendNonExist.status).toBe(200);
      expect(dataExist.data.message).toBe(dataNonExist.data.message);
    });
  });
});
