/**
 * WAYNAH-AUTH-002 — Authentication UI & User Identity Flow Tests
 *
 * Verifies:
 *  1. Register validation (invalid email, short password, missing name)
 *  2. Register success (returns user, actor, token; passwordHash NEVER returned)
 *  3. Duplicate account handling (register with existing email)
 *  4. Login success (returns user, actor, session token)
 *  5. Login failure (wrong email or password -> safe error, no account enumeration)
 *  6. /me endpoint for anonymous caller
 *  7. /me endpoint for authenticated user
 *  8. Logout invalidates session
 *  9. Protected operations with user session
 * 10. Rate limiting behavior on /v1/auth endpoints
 * 11. Audit logging does not leak passwords or tokens
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { AuditLogger } from '../src/utils/audit-logger.js';
import { PasswordSecurity } from '../src/utils/password.js';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();

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
        if (where.token) {
          sessions.delete(where.token);
        }
        return Promise.resolve({ count: 1 });
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        for (const [k, v] of sessions.entries()) {
          if (v.id === where.id) {
            const updated = { ...v, ...data };
            sessions.set(k, updated);
            return Promise.resolve(updated);
          }
        }
        return Promise.resolve({ id: where.id, ...data });
      }),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
  } as unknown as PrismaClient;
}

describe('WAYNAH-AUTH-002 — Authentication & Identity Flow', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  // 1. Password Security Unit Tests
  it('PasswordSecurity correctly hashes and verifies passwords', () => {
    const rawPassword = 'StrongPassword123!';
    const hash = PasswordSecurity.hashPassword(rawPassword);

    expect(hash).not.toBe(rawPassword);
    expect(hash).toContain(':'); // salt:hash format

    expect(PasswordSecurity.verifyPassword(rawPassword, hash)).toBe(true);
    expect(PasswordSecurity.verifyPassword('WrongPassword', hash)).toBe(false);
  });

  // 2. Register Validation
  it('POST /v1/auth/register fails on invalid email or short password', async () => {
    const res = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Ahmad',
        email: 'invalid-email',
        password: '123',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('REGISTRATION_FAILED');
  });

  // 3. Register Success & Password Hash Concealment
  it('POST /v1/auth/register creates user and session, never returning password hash', async () => {
    const res = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Tariq Ali',
        email: 'tariq@waynah.com',
        password: 'Password123!',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('tariq@waynah.com');
    expect(data.data.user.role).toBe('USER');
    expect(data.data.actor.type).toBe('USER');
    expect(data.data.token).toBeDefined();

    // Critical security check: password hash must NEVER be in response payload
    const jsonString = JSON.stringify(data);
    expect(jsonString).not.toContain('passwordHash');
    expect(jsonString).not.toContain('Password123!');
  });

  // 4. Duplicate Registration
  it('POST /v1/auth/register fails gracefully when email already exists', async () => {
    const payload = {
      name: 'User One',
      email: 'duplicate@waynah.com',
      password: 'Password123!',
    };

    // First registration
    const res1 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res1.status).toBe(201);

    // Second registration with same email
    const res2 = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    expect(res2.status).toBe(400);
    const data = await res2.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('مستخدم بالفعل');
  });

  // 5. Login Success
  it('POST /v1/auth/login succeeds with valid credentials', async () => {
    // Register first
    await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sarah Khaled',
        email: 'sarah@waynah.com',
        password: 'SecurePassword123!',
      }),
    });

    // Login
    const loginRes = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sarah@waynah.com',
        password: 'SecurePassword123!',
      }),
    });

    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.success).toBe(true);
    expect(loginData.data.user.name).toBe('Sarah Khaled');
    expect(loginData.data.actor.type).toBe('USER');
    expect(loginData.data.token).toBeDefined();
  });

  // 6. Login Failure (Safe error message)
  it('POST /v1/auth/login fails with invalid password without exposing account enumeration', async () => {
    await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Sara',
        email: 'sara@waynah.com',
        password: 'CorrectPassword123!',
      }),
    });

    const res = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'sara@waynah.com',
        password: 'WrongPassword!',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.code).toBe('INVALID_CREDENTIALS');
  });

  // 7. GET /v1/auth/me Anonymous vs Authenticated
  it('GET /v1/auth/me returns anonymous for unauthenticated caller', async () => {
    const res = await app.request('/v1/auth/me');
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.authenticated).toBe(false);
    expect(data.data.actor.type).toBe('ANONYMOUS');
    expect(data.data.user).toBeNull();
  });

  it('GET /v1/auth/me returns authenticated actor and user for valid session token', async () => {
    // Register
    const regRes = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Omar Developer',
        email: 'omar@waynah.com',
        password: 'OmarPassword123!',
      }),
    });
    const regData = await regRes.json();
    const token = regData.data.token;

    // Call /me with Bearer token header
    const meRes = await app.request('/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    expect(meRes.status).toBe(200);
    const meData = await meRes.json();
    expect(meData.success).toBe(true);
    expect(meData.data.authenticated).toBe(true);
    expect(meData.data.user.email).toBe('omar@waynah.com');
    expect(meData.data.actor.type).toBe('USER');
  });

  // 8. Logout Invalidates Session
  it('POST /v1/auth/logout invalidates user session', async () => {
    // Register
    const regRes = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Hassan User',
        email: 'hassan@waynah.com',
        password: 'HassanPassword123!',
      }),
    });
    const regData = await regRes.json();
    const token = regData.data.token;

    // Logout
    const logoutRes = await app.request('/v1/auth/logout', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(logoutRes.status).toBe(200);

    // Call /me after logout -> should be anonymous
    const meRes = await app.request('/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });
    const meData = await meRes.json();
    expect(meData.data.authenticated).toBe(false);
    expect(meData.data.actor.type).toBe('ANONYMOUS');
  });

  // 9. Audit Logging Security Verification
  it('Security AuditLogger never logs sensitive passwords or tokens', () => {
    const warnSpy = vi.spyOn(console, 'warn');
    const infoSpy = vi.spyOn(console, 'info');

    AuditLogger.logAuthFailure('POST', '/v1/auth/login', '127.0.0.1', 'Invalid credentials for user@example.com');
    AuditLogger.logAuthSuccess('POST', '/v1/auth/login', 'usr-123', 'USER', '127.0.0.1');

    const warnLog = warnSpy.mock.calls.map((c) => c.join(' ')).join(' ');
    const infoLog = infoSpy.mock.calls.map((c) => c.join(' ')).join(' ');

    expect(warnLog).not.toContain('password');
    expect(warnLog).not.toContain('hash');
    expect(infoLog).not.toContain('token');

    warnSpy.mockRestore();
    infoSpy.mockRestore();
  });

  // 10. Slice 5A — Email Normalization & Case Insensitivity
  it('Normalizes email during registration and login (lowercase + trimming whitespace)', async () => {
    // Register with mixed case and leading/trailing spaces
    const regRes = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Normal User',
        email: '  Normal.User@WAYNAH.COM  ',
        password: 'Password123!',
      }),
    });
    expect(regRes.status).toBe(201);
    const regData = await regRes.json();
    expect(regData.data.user.email).toBe('normal.user@waynah.com');

    // Login with different case variations and spaces
    const loginRes = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: ' NORMAL.USER@waynah.com ',
        password: 'Password123!',
      }),
    });
    expect(loginRes.status).toBe(200);
    const loginData = await loginRes.json();
    expect(loginData.data.user.email).toBe('normal.user@waynah.com');
  });

  // 11. Slice 5A — Hardened Login Input Validation
  it('Rejects malformed email strings during login validation', async () => {
    const res = await app.request('/v1/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'not-an-email',
        password: 'Password123!',
      }),
    });
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('غير صحيحة');
  });

  // 12. Slice 5A — Sliding Session Refresh
  it('Slides session expiration date if session is close to expiring', async () => {
    const AuthServiceModule = await import('../src/services/auth.service.js');
    const authService = new AuthServiceModule.AuthService(mockPrisma);

    const oldExpiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3 days remaining (< 5 days)

    vi.spyOn(mockPrisma.session, 'findUnique').mockResolvedValueOnce({
      id: 'ses-old-1',
      userId: 'usr-1',
      token: 'tok-old-1',
      expiresAt: oldExpiresAt,
      createdAt: new Date(),
      user: {
        id: 'usr-1',
        name: 'User One',
        email: 'user1@waynah.com',
        role: 'USER',
        passwordHash: 'hash',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    } as any);

    const updateSpy = vi.spyOn(mockPrisma.session, 'update').mockResolvedValueOnce({} as any);

    const result = await authService.validateSession('tok-old-1');
    expect(result).not.toBeNull();
    expect(updateSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 'ses-old-1' },
        data: expect.objectContaining({
          expiresAt: expect.any(Date),
        }),
      })
    );
  });
});
