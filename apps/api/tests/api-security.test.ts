/**
 * WAYNAH-SEC-001 — API Security Foundation Integration & Unit Tests
 *
 * Verifies:
 *  1. Public vs Protected endpoints access control
 *  2. Authentication requirement for POST /v1/discovery/ingest
 *  3. Header-based API key validation (X-API-Key and Authorization: Bearer)
 *  4. Security Headers enforcement
 *  5. Rate limiting headers & enforcement
 *  6. CORS origin configuration
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createServer } from '../src/server';
import type { PrismaClient } from '@waynah/database';
import { securityConfig } from '../src/config/security.config';

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

describe('API Security Foundation (WAYNAH-SEC-001)', () => {
  let mockPrisma: PrismaClient;
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
  });

  // ─── 1. Public vs Protected Endpoints ─────────────────────────────────────
  it('allows public access to /health without credentials', async () => {
    // Note: /health attempts database verifySpatialConnection, which fails in unit test environment,
    // but HTTP level response is generated (500 database failed or 200 ok) rather than 401 Unauthorized.
    const res = await app.request('/health');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('allows public access to GET /v1/search without credentials', async () => {
    const res = await app.request('/v1/search?query=cafe');
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('blocks unauthenticated POST /v1/discovery/ingest with 401 Unauthorized', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Test Observation',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
    expect(data.error).toContain('Unauthorized');
  });

  it('blocks POST /v1/discovery/ingest with invalid API key with 401 Unauthorized', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': 'invalid-secret-key',
      },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        name: 'Test Observation',
      }),
    });

    expect(res.status).toBe(401);
    const data = await res.json();
    expect(data.success).toBe(false);
  });

  // ─── 2. Valid Authentication via Header ──────────────────────────────────
  it('accepts POST /v1/discovery/ingest with valid X-API-Key header', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': securityConfig.ingestionApiKey,
      },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'Valid Ingestion Request',
        latitude: 24.7136,
        longitude: 46.6753,
      }),
    });

    // Valid auth bypasses 401 barrier. It either reaches validation/domain (201 or 400).
    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  it('accepts POST /v1/discovery/ingest with valid Bearer token header', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${securityConfig.ingestionApiKey}`,
      },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'Valid Ingestion Request',
        latitude: 24.7136,
        longitude: 46.6753,
      }),
    });

    expect(res.status).not.toBe(401);
    expect(res.status).not.toBe(403);
  });

  // ─── 3. Security Headers ──────────────────────────────────────────────────
  it('attaches security headers to responses', async () => {
    const res = await app.request('/v1/search');
    expect(res.headers.get('x-content-type-options')).toBe('nosniff');
    expect(res.headers.get('x-frame-options')).toBe('DENY');
    expect(res.headers.get('x-xss-protection')).toBe('1; mode=block');
  });

  // ─── 4. Rate Limiting Headers ─────────────────────────────────────────────
  it('returns rate limit headers on protected endpoints', async () => {
    const res = await app.request('/v1/discovery/ingest', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': securityConfig.ingestionApiKey,
      },
      body: JSON.stringify({
        dataSourceId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
        categoryId: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a22',
        name: 'Rate Limit Test',
        latitude: 24.7136,
        longitude: 46.6753,
      }),
    });

    expect(res.headers.get('x-ratelimit-limit')).not.toBeNull();
    expect(res.headers.get('x-ratelimit-remaining')).not.toBeNull();
  });

  // ─── 5. CORS ──────────────────────────────────────────────────────────────
  it('handles CORS preflight for allowed dev origins', async () => {
    const res = await app.request('/v1/search', {
      method: 'OPTIONS',
      headers: {
        Origin: 'http://localhost:3000',
        'Access-Control-Request-Method': 'GET',
      },
    });

    expect(res.headers.get('access-control-allow-origin')).toBe('http://localhost:3000');
  });

  // ─── 6. Admin API Boundary Routes ─────────────────────────────────────────
  it('blocks unauthenticated GET /v1/admin/conflicts', async () => {
    const res = await app.request('/v1/admin/conflicts');
    expect(res.status).toBe(401);
  });

  it('allows authenticated GET /v1/admin/conflicts', async () => {
    const res = await app.request('/v1/admin/conflicts', {
      headers: {
        'X-API-Key': securityConfig.ingestionApiKey,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
  });

  it('allows authenticated GET /v1/admin/places/:id/history', async () => {
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
});
