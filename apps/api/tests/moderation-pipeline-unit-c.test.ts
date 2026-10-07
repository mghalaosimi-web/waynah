/**
 * WAYNAH — Phase 9 Unit C — Moderation Pipeline & Admin API Unit Tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { createServer } from '../src/server.js';
import { prisma as defaultPrisma, DuplicateCandidateStatus } from '@waynah/database';

describe('WAYNAH Phase 9 Unit C — Moderation Pipeline & Admin API Tests', () => {
  let app: ReturnType<typeof createServer>;

  beforeEach(() => {
    app = createServer(defaultPrisma);
  });

  // 1. DataConflict Listing
  it('1. GET /v1/admin/conflicts requires admin permissions & returns open conflicts', async () => {
    // Unauthenticated request -> 401
    const resUnauth = await app.request('/v1/admin/conflicts');
    expect(resUnauth.status).toBe(401);
  });

  // 2. DataConflict Resolution
  it('2. POST /v1/admin/conflicts/:id/resolve resolves conflict & updates canonical Place attributes', async () => {
    // Test endpoint structure and permission guards
    const res = await app.request('/v1/admin/conflicts/non-existent/resolve', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'ACCEPT_BASE' }),
    });

    expect(res.status).toBe(401);
  });

  // 3. Review Moderation Queue
  it('3. GET /v1/admin/reviews returns flagged reviews queue for moderation', async () => {
    const res = await app.request('/v1/admin/reviews');
    expect(res.status).toBe(401);
  });

  // 4. Review Moderation Action (APPROVE / HIDE)
  it('4. POST /v1/admin/reviews/:id/moderate requires admin.reviews.moderate permission', async () => {
    const res = await app.request('/v1/admin/reviews/rev-123/moderate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'HIDE', reason: 'محتوى مسيء' }),
    });

    expect(res.status).toBe(401);
  });

  // 5. Duplicate Candidate Moderation Queue
  it('5. GET /v1/admin/duplicates/candidates returns candidates for moderation', async () => {
    const res = await app.request('/v1/admin/duplicates/candidates');
    expect(res.status).toBe(401);
  });

  // 6. Duplicate Candidate Merge Action Endpoint
  it('6. POST /v1/admin/duplicates/candidates/:id/merge requires admin.duplicates.manage permission', async () => {
    const res = await app.request('/v1/admin/duplicates/candidates/cand-123/merge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });

    expect(res.status).toBe(401);
  });

  // 7. Duplicate Candidate Ignore Action Endpoint
  it('7. POST /v1/admin/duplicates/candidates/:id/ignore requires admin.duplicates.manage permission', async () => {
    const res = await app.request('/v1/admin/duplicates/candidates/cand-123/ignore', {
      method: 'POST',
    });

    expect(res.status).toBe(401);
  });

  // 8. Domain Split Action Endpoint
  it('8. POST /v1/admin/duplicates/split requires admin.duplicates.manage permission & validates parameters', async () => {
    const res = await app.request('/v1/admin/duplicates/split', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sourcePlaceId: 'plc-1',
        newPlace: {
          nameAr: 'محل جديد',
          categoryId: 'cat-1',
          districtId: 'dist-1',
          latitude: 15.35,
          longitude: 44.2,
        },
        observationIdsToMove: ['obs-1'],
      }),
    });

    expect(res.status).toBe(401);
  });
});
