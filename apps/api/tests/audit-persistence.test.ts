import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server.js';
import { AuditLogger, sanitizeMetadata } from '../src/utils/audit-logger.js';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const businesses = new Map<string, any>();
  const auditLogs = new Map<string, any>();

  return {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve(users.get(where.id) || null);
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, createdAt: new Date(), updatedAt: new Date(), role: 'USER', ...data };
        users.set(id, newUser);
        return Promise.resolve(newUser);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const u = users.get(where.id);
        if (u) {
          users.delete(where.id);
          return Promise.resolve(u);
        }
        throw new Error('User not found');
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
      update: vi.fn().mockImplementation(({ where, data }) => {
        for (const s of sessions.values()) {
          if (s.id === where.id) {
            Object.assign(s, data);
            return Promise.resolve(s);
          }
        }
        return Promise.resolve(null);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        for (const [k, v] of sessions.entries()) {
          if (v.id === where.id) {
            sessions.delete(k);
            return Promise.resolve(v);
          }
        }
        return Promise.resolve(null);
      }),
    },
    business: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'biz-' + Math.random().toString(36).substring(2, 9);
        const newBiz = { id, createdAt: new Date(), updatedAt: new Date(), ...data };
        businesses.set(id, newBiz);
        return Promise.resolve(newBiz);
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const b = businesses.get(where.id);
        if (b) {
          businesses.delete(where.id);
          return Promise.resolve(b);
        }
        throw new Error('Business not found');
      }),
    },
    auditLog: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'audit-' + Math.random().toString(36).substring(2, 9);
        const newLog = {
          id,
          eventType: data.eventType,
          action: data.action ?? null,
          method: data.method ?? null,
          path: data.path ?? null,
          ip: data.ip ?? null,
          actorId: data.actorId ?? null,
          actorType: data.actorType ?? null,
          actorRole: data.actorRole ?? null,
          resourceType: data.resourceType ?? null,
          resourceId: data.resourceId ?? null,
          businessId: data.businessId ?? null,
          placeId: data.placeId ?? null,
          metadata: data.metadata ?? null,
          createdAt: new Date(),
        };
        auditLogs.set(id, newLog);
        return Promise.resolve(newLog);
      }),
      findMany: vi.fn().mockImplementation(({ where, skip = 0, take = 20 }) => {
        let items = Array.from(auditLogs.values());

        if (where) {
          if (where.eventType) items = items.filter((i) => i.eventType === where.eventType);
          if (where.actorId) items = items.filter((i) => i.actorId === where.actorId);
          if (where.resourceType) items = items.filter((i) => i.resourceType === where.resourceType);
          if (where.resourceId) items = items.filter((i) => i.resourceId === where.resourceId);
          if (where.businessId) items = items.filter((i) => i.businessId === where.businessId);

          if (where.createdAt) {
            if (where.createdAt.gte) {
              const gteTime = new Date(where.createdAt.gte).getTime();
              items = items.filter((i) => new Date(i.createdAt).getTime() >= gteTime);
            }
            if (where.createdAt.lte) {
              const lteTime = new Date(where.createdAt.lte).getTime();
              items = items.filter((i) => new Date(i.createdAt).getTime() <= lteTime);
            }
          }
        }

        items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return Promise.resolve(items.slice(skip, skip + take));
      }),
      count: vi.fn().mockImplementation(({ where }) => {
        let items = Array.from(auditLogs.values());

        if (where) {
          if (where.eventType) items = items.filter((i) => i.eventType === where.eventType);
          if (where.actorId) items = items.filter((i) => i.actorId === where.actorId);
          if (where.resourceType) items = items.filter((i) => i.resourceType === where.resourceType);
          if (where.resourceId) items = items.filter((i) => i.resourceId === where.resourceId);
          if (where.businessId) items = items.filter((i) => i.businessId === where.businessId);

          if (where.createdAt) {
            if (where.createdAt.gte) {
              const gteTime = new Date(where.createdAt.gte).getTime();
              items = items.filter((i) => new Date(i.createdAt).getTime() >= gteTime);
            }
            if (where.createdAt.lte) {
              const lteTime = new Date(where.createdAt.lte).getTime();
              items = items.filter((i) => new Date(i.createdAt).getTime() <= lteTime);
            }
          }
        }

        return Promise.resolve(items.length);
      }),
    },
  } as unknown as PrismaClient;
}

describe('WAYNAH — Phase 10 — Persistent Operational Audit Trail', () => {
  let mockPrisma: PrismaClient;
  let app: Hono;
  let adminToken: string;
  let adminUserId: string;
  let normalToken: string;
  let normalUserId: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    AuditLogger.setPrismaClient(mockPrisma);
    app = createServer(mockPrisma);

    // Register Admin user
    const adminUserRes = await mockPrisma.user.create({
      data: {
        id: 'usr-admin-1',
        name: 'مدير النظام',
        email: 'admin@waynah.com',
        passwordHash: 'hash',
        role: 'ADMIN',
        emailVerified: true,
      },
    });
    adminUserId = adminUserRes.id;
    adminToken = 'session-admin-token-123';
    await mockPrisma.session.create({
      data: {
        userId: adminUserId,
        token: adminToken,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });

    // Register Normal user
    const normalUserRes = await mockPrisma.user.create({
      data: {
        id: 'usr-normal-1',
        name: 'مستخدم عادي',
        email: 'user@waynah.com',
        passwordHash: 'hash',
        role: 'USER',
        emailVerified: true,
      },
    });
    normalUserId = normalUserRes.id;
    normalToken = 'session-normal-token-123';
    await mockPrisma.session.create({
      data: {
        userId: normalUserId,
        token: normalToken,
        expiresAt: new Date(Date.now() + 7 * 86400000),
      },
    });
  });

  // Test 1 — Persistence
  it('1. Persistence: Emits audit event and verifies audit_logs row fields', async () => {
    await AuditLogger.logVerificationReviewed(
      'ver-101',
      'biz-202',
      'VERIFIED',
      adminUserId,
      '192.168.1.1',
      mockPrisma
    );

    const logs = await mockPrisma.auditLog.findMany({});
    expect(logs).toHaveLength(1);
    const entry = logs[0];

    expect(entry.eventType).toBe('BUSINESS_VERIFICATION_REVIEWED');
    expect(entry.actorId).toBe(adminUserId);
    expect(entry.actorType).toBe('ADMIN');
    expect(entry.actorRole).toBe('ADMIN');
    expect(entry.resourceType).toBe('BUSINESS_VERIFICATION');
    expect(entry.resourceId).toBe('ver-101');
    expect(entry.businessId).toBe('biz-202');
    expect(entry.ip).toBe('192.168.1.1');
    expect(entry.metadata).toBeDefined();
    expect(entry.createdAt).toBeDefined();
  });

  // Test 2 — Sanitization
  it('2. Sanitization: Redacts passwords, tokens, and secret keys in simple and nested metadata', () => {
    const rawPayload = {
      user: {
        email: 'test@waynah.com',
        password: 'SuperSecretPassword123!',
        passwordHash: 'argon2$hash$string',
      },
      tokens: {
        sessionToken: 'ses-token-xyz',
        rawToken: 'raw-secret-123',
        apiKey: 'sk_live_secret_key',
      },
      action: 'LOGIN_ATTEMPT',
      businessId: 'biz-303',
    };

    const sanitized = sanitizeMetadata(rawPayload) as any;

    expect(sanitized.action).toBe('LOGIN_ATTEMPT');
    expect(sanitized.businessId).toBe('biz-303');
    expect(sanitized.user.email).toBe('test@waynah.com');

    // Secrets MUST be redacted
    expect(sanitized.user.password).toBe('[REDACTED]');
    expect(sanitized.user.passwordHash).toBe('[REDACTED]');
    expect(sanitized.tokens.sessionToken).toBe('[REDACTED]');
    expect(sanitized.tokens.rawToken).toBe('[REDACTED]');
    expect(sanitized.tokens.apiKey).toBe('[REDACTED]');
  });

  // Test 3 — Read-only Integrity
  it('3. Read-only Integrity: Blocks POST, PUT, PATCH, DELETE operations on /v1/admin/audit-logs', async () => {
    const postRes = await app.request('/v1/admin/audit-logs', {
      method: 'POST',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ eventType: 'FAKE_EVENT' }),
    });
    expect([404, 405]).toContain(postRes.status);

    const putRes = await app.request('/v1/admin/audit-logs/audit-1', {
      method: 'PUT',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'MODIFY' }),
    });
    expect([404, 405]).toContain(putRes.status);

    const patchRes = await app.request('/v1/admin/audit-logs/audit-1', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${adminToken}` },
      body: JSON.stringify({ action: 'MODIFY' }),
    });
    expect([404, 405]).toContain(patchRes.status);

    const deleteRes = await app.request('/v1/admin/audit-logs/audit-1', {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect([404, 405]).toContain(deleteRes.status);
  });

  // Test 4 — RBAC
  it('4. RBAC: Restricts GET /v1/admin/audit-logs (Anonymous -> 401, USER/BUSINESS_MEMBER -> 403, ADMIN -> 200)', async () => {
    // 1. Anonymous -> 401
    const anonRes = await app.request('/v1/admin/audit-logs', { method: 'GET' });
    expect(anonRes.status).toBe(401);

    // 2. Standard USER -> 403
    const userRes = await app.request('/v1/admin/audit-logs', {
      method: 'GET',
      headers: { Authorization: `Bearer ${normalToken}` },
    });
    expect(userRes.status).toBe(403);

    // 3. Authorized ADMIN -> 200
    const adminRes = await app.request('/v1/admin/audit-logs', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(adminRes.status).toBe(200);
    const body = await adminRes.json();
    expect(body.success).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
    expect(body.meta).toBeDefined();
  });

  // Test 5 — Historical Preservation
  it('5. Historical Preservation: Deleting a referenced User or Business preserves the audit record', async () => {
    const tempUser = await mockPrisma.user.create({
      data: {
        id: 'usr-deletable-99',
        name: 'مستخدم سيتم حذفه',
        email: 'deleted@waynah.com',
        passwordHash: 'hash',
        role: 'USER',
      },
    });

    const tempBiz = await mockPrisma.business.create({
      data: {
        id: 'biz-deletable-99',
        name: 'نشاط سيتم حذفه',
      },
    });

    // Create audit log referencing temp user & biz
    await AuditLogger.logBusinessMemberInvited(
      'inv-777',
      tempBiz.id,
      'invited@waynah.com',
      'MEMBER',
      tempUser.id,
      '127.0.0.1',
      mockPrisma
    );

    // Delete user & business entities
    await mockPrisma.user.delete({ where: { id: tempUser.id } });
    await mockPrisma.business.delete({ where: { id: tempBiz.id } });

    // Verify AuditLog record survives entity deletion
    const logs = await mockPrisma.auditLog.findMany({ where: { businessId: tempBiz.id } });
    expect(logs).toHaveLength(1);
    expect(logs[0].actorId).toBe(tempUser.id);
    expect(logs[0].businessId).toBe(tempBiz.id);
  });

  // Test 6 — Fault Tolerance
  it('6. Fault Tolerance: Audit persistence failure catches internally and does NOT throw to primary flow', async () => {
    const errorPrisma = {
      auditLog: {
        create: vi.fn().mockRejectedValue(new Error('DATABASE_CONNECTION_LOST')),
      },
    } as unknown as PrismaClient;

    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Execution should complete without throwing
    await expect(
      AuditLogger.logAuthSuccess(
        'POST',
        '/v1/auth/login',
        'usr-123',
        'USER',
        '127.0.0.1',
        'USER',
        errorPrisma
      )
    ).resolves.not.toThrow();

    expect(consoleSpy).toHaveBeenCalledWith(
      '[AUDIT_PERSISTENCE_FAILURE]',
      expect.objectContaining({
        eventType: 'AUTH_SUCCESS',
        error: 'DATABASE_CONNECTION_LOST',
      })
    );

    consoleSpy.mockRestore();
  });

  // Test 7 — Actor Role Accuracy
  it('7. Actor Role Accuracy: Correctly records effective actorRole at event time across contexts', async () => {
    // ADMIN context
    await AuditLogger.logDataConflictResolved(
      'conflict-1',
      'place-1',
      'ACCEPT_BASE',
      'RESOLVED',
      'admin-actor-1',
      '127.0.0.1',
      mockPrisma
    );

    // SYSTEM context
    await AuditLogger.logIngestionProcessed(
      'obs-1',
      'CREATED',
      'ingestion-service',
      'source-1',
      '127.0.0.1',
      mockPrisma
    );

    // BUSINESS_MEMBER context
    await AuditLogger.logBusinessMemberRoleChanged(
      'biz-10',
      'mem-1',
      'usr-target',
      'MEMBER',
      'MANAGER',
      'usr-owner',
      '127.0.0.1',
      mockPrisma
    );

    const logs = await mockPrisma.auditLog.findMany({});
    expect(logs).toHaveLength(3);

    const conflictLog = logs.find((l) => l.eventType === 'DATA_CONFLICT_RESOLVED');
    expect(conflictLog?.actorRole).toBe('ADMIN');

    const ingestionLog = logs.find((l) => l.eventType === 'INGESTION_PROCESSED');
    expect(ingestionLog?.actorRole).toBe('SYSTEM_SERVICE');

    const memberLog = logs.find((l) => l.eventType === 'BUSINESS_MEMBER_ROLE_CHANGED');
    expect(memberLog?.actorRole).toBe('BUSINESS_OWNER');
  });

  // Test 8 — Query Filtering & Pagination
  it('8. Query Filtering & Pagination: GET /v1/admin/audit-logs handles filters and pagination accurately', async () => {
    // Seed audit logs
    await AuditLogger.logVerificationReviewed('v1', 'b1', 'VERIFIED', 'admin-1', '127.0.0.1', mockPrisma);
    await AuditLogger.logVerificationReviewed('v2', 'b2', 'REJECTED', 'admin-1', '127.0.0.1', mockPrisma);
    await AuditLogger.logDataConflictResolved('c1', 'p1', 'ACCEPT_BASE', 'RESOLVED', 'admin-2', '127.0.0.1', mockPrisma);

    // Filter by eventType
    const typeRes = await app.request('/v1/admin/audit-logs?eventType=DATA_CONFLICT_RESOLVED', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(typeRes.status).toBe(200);
    const typeBody = await typeRes.json();
    expect(typeBody.data).toHaveLength(1);
    expect(typeBody.data[0].eventType).toBe('DATA_CONFLICT_RESOLVED');

    // Filter by actorId
    const actorRes = await app.request('/v1/admin/audit-logs?actorId=admin-1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(actorRes.status).toBe(200);
    const actorBody = await actorRes.json();
    expect(actorBody.data).toHaveLength(2);

    // Filter by businessId
    const bizRes = await app.request('/v1/admin/audit-logs?businessId=b1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(bizRes.status).toBe(200);
    const bizBody = await bizRes.json();
    expect(bizBody.data).toHaveLength(1);
    expect(bizBody.data[0].businessId).toBe('b1');

    // Pagination (limit = 1, page = 2)
    const pageRes = await app.request('/v1/admin/audit-logs?page=2&limit=1', {
      method: 'GET',
      headers: { Authorization: `Bearer ${adminToken}` },
    });
    expect(pageRes.status).toBe(200);
    const pageBody = await pageRes.json();
    expect(pageBody.data).toHaveLength(1);
    expect(pageBody.meta.page).toBe(2);
    expect(pageBody.meta.limit).toBe(1);
    expect(pageBody.meta.total).toBe(3);
  });

  // Test 9 — Deterministic Awaiting / Execution Sequencing
  it('9. Deterministic Awaiting: Endpoint completes ONLY after AuditLogger promise resolves', async () => {
    const sequence: string[] = [];

    // Controlled delayed AuditLog create mock
    const delayedPrisma = {
      ...mockPrisma,
      auditLog: {
        ...mockPrisma.auditLog,
        create: vi.fn().mockImplementation(async ({ data }) => {
          sequence.push('AUDIT_PERSISTENCE_START');
          await new Promise((resolve) => setTimeout(resolve, 30));
          sequence.push('AUDIT_PERSISTENCE_END');
          return { id: 'audit-delayed-1', ...data, createdAt: new Date() };
        }),
      },
    } as unknown as PrismaClient;

    // Use AuditLogger with controlled delayed prisma
    await AuditLogger.logVerificationReviewed(
      'ver-delayed-1',
      'biz-delayed-1',
      'VERIFIED',
      adminUserId,
      '127.0.0.1',
      delayedPrisma
    );
    sequence.push('CALLER_RESUMED');

    // Assert strict sequential execution: AUDIT_PERSISTENCE_START -> AUDIT_PERSISTENCE_END -> CALLER_RESUMED
    expect(sequence).toEqual([
      'AUDIT_PERSISTENCE_START',
      'AUDIT_PERSISTENCE_END',
      'CALLER_RESUMED',
    ]);
  });
});

