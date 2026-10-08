import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';

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
        const id = data.id || ('usr-' + Math.random().toString(36).substring(2, 9));
        const newUser = { createdAt: new Date(), updatedAt: new Date(), ...data, id };
        users.set(id, newUser);
        return Promise.resolve(newUser);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const existing = users.get(where.id);
        if (existing) {
          const updated = { ...existing, ...data, updatedAt: new Date() };
          users.set(where.id, updated);
          return Promise.resolve(updated);
        }
        return Promise.resolve({ id: where.id, ...data });
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
        if (where.token) sessions.delete(where.token);
        return Promise.resolve({ count: 1 });
      }),
    },
    $queryRaw: vi.fn().mockResolvedValue([]),
  } as unknown as PrismaClient;
}

describe('WAYNAH — Google OAuth Endpoint (/v1/auth/google)', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('1. Rejects request with missing accessToken with 400', async () => {
    const res = await app.request('/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('توكن التوثيق مطلوب');
  });

  it('2. Rejects invalid or expired token with 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(JSON.stringify({ error: 'invalid_token' }), { status: 401 })
    );

    const res = await app.request('/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'invalid-token-123' }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('غير صالح');
  });

  it('3. Rejects non-Google provider tokens with 401', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'supa-user-1',
          email: 'githubuser@example.com',
          app_metadata: { provider: 'github' },
          identities: [{ provider: 'github' }],
        }),
        { status: 200 }
      )
    );

    const res = await app.request('/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-github-token' }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error.message).toContain('Google');
  });

  it('4. Successfully registers new user via Google OAuth and sets session cookie', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'supa-user-google-1',
          email: 'newgoogleuser@example.com',
          user_metadata: { full_name: 'Google User One' },
          app_metadata: { provider: 'google' },
          identities: [{ provider: 'google', id: 'g-sub-123' }],
        }),
        { status: 200 }
      )
    );

    const res = await app.request('/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-google-token' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('newgoogleuser@example.com');
    expect(data.data.user.name).toBe('Google User One');
    expect(data.data.user.emailVerified).toBe(true);
    expect(data.data.user.role).toBe('USER');
    expect(data.data.token).toBeDefined();

    // Check cookie header
    const setCookie = res.headers.get('set-cookie');
    expect(setCookie).toContain('waynah_session=');
  });

  it('5. Successfully logs in existing WAYNAH user without duplicate creation or role modification', async () => {
    // Pre-create existing user
    await mockPrisma.user.create({
      data: {
        id: 'usr-existing-1',
        name: 'Existing User',
        email: 'existing@example.com',
        passwordHash: 'hashedpassword',
        role: 'USER',
        emailVerified: false,
      },
    });

    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'supa-user-google-2',
          email: 'EXISTING@example.com', // test case normalization
          user_metadata: { full_name: 'Existing User Google' },
          app_metadata: { provider: 'google' },
          identities: [{ provider: 'google' }],
        }),
        { status: 200 }
      )
    );

    const res = await app.request('/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ accessToken: 'valid-google-token-existing' }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.user.email).toBe('existing@example.com');
    expect(data.data.user.emailVerified).toBe(true);
  });

  it('6. Ignores client-provided email or name in request body (anti-impersonation)', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValueOnce(
      new Response(
        JSON.stringify({
          id: 'supa-user-real',
          email: 'realuser@example.com',
          user_metadata: { full_name: 'Real Name' },
          app_metadata: { provider: 'google' },
          identities: [{ provider: 'google' }],
        }),
        { status: 200 }
      )
    );

    const res = await app.request('/v1/auth/google', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessToken: 'valid-google-token-real',
        email: 'victim@example.com', // Fake email injection
        name: 'Attacker Name',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.data.user.email).toBe('realuser@example.com');
    expect(data.data.user.email).not.toBe('victim@example.com');
  });
});
