/**
 * WAYNAH-AUTH-001 — Authentication & Authorization Foundation Tests
 *
 * Verifies:
 *  1. Anonymous -> public route -> allowed (200)
 *  2. Anonymous -> protected route -> denied (401 Unauthorized)
 *  3. Authenticated system actor -> ingestion -> allowed (201)
 *  4. Actor without required permission -> protected route -> denied (403 Forbidden)
 *  5. Actor with required permission -> protected route -> allowed (200 OK)
 *  6. Invalid credentials -> protected route -> denied (401 Unauthorized)
 *  7. Permission wildcard evaluations ('*' and 'admin.*')
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import { createServer } from '../src/server.js';
import type { PrismaClient } from '@waynah/database';
import { securityConfig } from '../src/config/security.config.js';
import { authenticate } from '../src/middleware/auth.middleware.js';
import { requirePermission, hasPermission } from '../src/middleware/authorization.middleware.js';
import { type Actor, PERMISSIONS } from '@waynah/shared';

function makeMockPrisma() {
  return {
    $transaction: vi.fn((fn) => fn(makeMockPrisma())),
    $queryRaw: vi.fn().mockResolvedValue([{ district_id: 'dist-001' }]),
    $executeRaw: vi.fn().mockResolvedValue(1),
    placeObservation: {
      findUnique: vi.fn().mockResolvedValue({
        id: 'obs-123',
        dataSourceId: 'src-001',
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'Test Observation',
        confidenceScore: 0.0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      create: vi.fn().mockResolvedValue({
        id: 'obs-123',
        dataSourceId: 'src-001',
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'Test Observation',
        latitude: 24.7136,
        longitude: 46.6753,
        confidenceScore: 0.0,
        status: 'PENDING',
        createdAt: new Date(),
        updatedAt: new Date(),
      }),
      update: vi.fn().mockResolvedValue({
        id: 'obs-123',
        status: 'AUTO_APPROVED',
        confidenceScore: 0.85,
      }),
    },
    dataConflict: {
      findMany: vi.fn().mockResolvedValue([]),
    },
    category: {
      findUnique: vi.fn().mockResolvedValue({ id: 'cat-001', nameAr: 'Café' }),
    },
    district: { findFirst: vi.fn() },
    governorate: { findFirst: vi.fn() },
    place: {
      create: vi.fn().mockResolvedValue({ id: 'place-123', nameAr: 'Test Place' }),
      findUnique: vi.fn().mockResolvedValue({ id: 'place-123', nameAr: 'Test Place', category: { nameAr: 'Café' }, observations: [] }),
      findMany: vi.fn().mockResolvedValue([]),
    },
    dataSource: {
      findUnique: vi.fn().mockResolvedValue({ id: 'src-001', reliabilityWeight: 1.0 }),
    },
  } as unknown as PrismaClient;
}

describe('WAYNAH-AUTH-001 — Authentication & Authorization Foundation', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  // 1. Public Routes Access
  it('Anonymous -> public search route -> allowed (200)', async () => {
    const res = await app.request('/v1/search?query=cafe');
    expect(res.status).toBe(200);
  });

  // 2. Unauthenticated Protected Access
  it('Anonymous -> protected ingestion route -> denied (401 Unauthorized)', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Test Place',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('Anonymous -> protected admin conflicts route -> denied (401 Unauthorized)', async () => {
    const res = await app.request('/v1/admin/conflicts');
    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  // 3. Invalid Credentials Access
  it('Unknown/invalid credentials -> protected route -> denied (401 Unauthorized)', async () => {
    const res = await app.request('/v1/admin/conflicts', {
      headers: { 'X-API-Key': 'invalid-secret-key' },
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Invalid or missing API key');
  });

  // 4. Authenticated System Access
  it('Authenticated system actor -> ingestion route -> allowed (201)', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': securityConfig.ingestionApiKey,
      },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'System Ingestion Test',
        latitude: 24.7136,
        longitude: 46.6753,
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  it('Authenticated system actor -> admin history route -> allowed (200)', async () => {
    const res = await app.request('/v1/admin/places/place-123/history', {
      headers: {
        'X-API-Key': securityConfig.ingestionApiKey,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.id).toBe('place-123');
  });

  // 5. Permission Enforcement (403 Forbidden vs 200 OK)
  it('Actor without required permission -> protected operation -> denied (403 Forbidden)', async () => {
    const testApp = new Hono();

    // Custom test route simulating an actor with only place.read permission attempting an admin operation
    testApp.use('*', async (c, next) => {
      const mockUserActor: Actor = {
        id: 'regular-user-001',
        type: 'USER',
        roles: ['USER'],
        permissions: [PERMISSIONS.PLACE_READ],
      };
      c.set('actor', mockUserActor);
      c.set('authStatus', 'AUTHENTICATED');
      return await next();
    });

    testApp.get('/test/admin-only', requirePermission(PERMISSIONS.ADMIN_CONFLICTS_READ), (c) => {
      return c.json({ success: true, message: 'Admin Access Granted' });
    });

    const res = await testApp.request('/test/admin-only');
    expect(res.status).toBe(403);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Forbidden');
    expect(data.requiredPermissions).toContain(PERMISSIONS.ADMIN_CONFLICTS_READ);
  });

  it('Actor with required permission -> protected operation -> allowed (200 OK)', async () => {
    const testApp = new Hono();

    testApp.use('*', async (c, next) => {
      const mockBusinessActor: Actor = {
        id: 'biz-owner-001',
        type: 'BUSINESS_MEMBER',
        roles: ['BUSINESS_OWNER'],
        permissions: [PERMISSIONS.PLACE_UPDATE, PERMISSIONS.BUSINESS_MANAGE],
      };
      c.set('actor', mockBusinessActor);
      c.set('authStatus', 'AUTHENTICATED');
      return await next();
    });

    testApp.post('/test/business-update', requirePermission(PERMISSIONS.BUSINESS_MANAGE), (c) => {
      return c.json({ success: true, message: 'Business Managed Successfully' });
    });

    const res = await testApp.request('/test/business-update', { method: 'POST' });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
  });

  // 6. Wildcard Permission Unit Tests
  it('Correctly evaluates wildcard permissions', () => {
    const adminActor: Actor = {
      id: 'admin-001',
      type: 'ADMIN',
      roles: ['ADMIN'],
      permissions: ['admin.*'],
    };

    expect(hasPermission(adminActor, PERMISSIONS.ADMIN_CONFLICTS_READ)).toBe(true);
    expect(hasPermission(adminActor, PERMISSIONS.ADMIN_PLACES_HISTORY_READ)).toBe(true);
    expect(hasPermission(adminActor, PERMISSIONS.PLACE_DELETE)).toBe(false);

    const superAdminActor: Actor = {
      id: 'superadmin-001',
      type: 'ADMIN',
      roles: ['SUPER_ADMIN'],
      permissions: ['*'],
    };

    expect(hasPermission(superAdminActor, PERMISSIONS.PLACE_DELETE)).toBe(true);
    expect(hasPermission(superAdminActor, PERMISSIONS.DISCOVERY_INGEST)).toBe(true);
  });
});
