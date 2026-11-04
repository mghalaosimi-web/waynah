import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';
import { securityConfig } from '../src/config/security.config.js';
import type { PrismaClient } from '@waynah/database';

function makeAnalyticsPrisma() {
  return {
    place: {
      count: vi.fn().mockImplementation(({ where } = {}) => {
        if (where?.verificationStatus === 'VERIFIED') return Promise.resolve(7);
        if (where?.verificationStatus === 'UNVERIFIED') return Promise.resolve(12);
        return Promise.resolve(20);
      }),
    },
    business: { count: vi.fn().mockResolvedValue(5) },
    category: { count: vi.fn().mockResolvedValue(8) },
    governorate: { count: vi.fn().mockResolvedValue(22) },
    district: { count: vi.fn().mockResolvedValue(333) },
    dataSource: { count: vi.fn().mockResolvedValue(3) },
    placeObservation: {
      count: vi.fn().mockImplementation(({ where } = {}) =>
        Promise.resolve(where?.status === 'PENDING' ? 18 : 120)
      ),
    },
    dataConflict: { count: vi.fn().mockResolvedValue(4) },
    review: { count: vi.fn().mockResolvedValue(10) },
    auditLog: {
      count: vi.fn().mockResolvedValue(21),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'audit-1',
          eventType: 'PLACE_VERIFICATION_REVIEWED',
          action: 'APPROVE',
          actorType: 'ADMIN',
          resourceType: 'PLACE',
          resourceId: 'place-1',
          createdAt: new Date('2026-11-04T10:00:00.000Z'),
        },
      ]),
    },
  } as unknown as PrismaClient;
}

describe('Admin analytics overview', () => {
  it('requires authentication', async () => {
    const app = createServer(makeAnalyticsPrisma());
    const response = await app.request('/v1/admin/analytics/overview');

    expect(response.status).toBe(401);
  });

  it('returns real aggregates and a privacy-minimized recent audit list to an authorized admin key', async () => {
    const prisma = makeAnalyticsPrisma();
    const app = createServer(prisma);

    const response = await app.request('/v1/admin/analytics/overview', {
      headers: {
        'X-API-Key': securityConfig.ingestionApiKey,
      },
    });

    expect(response.status).toBe(200);
    const payload = await response.json();

    expect(payload.success).toBe(true);
    expect(payload.data.periodDays).toBe(7);
    expect(payload.data.summary).toMatchObject({
      placesTotal: 20,
      placesVerified: 7,
      placesUnverified: 12,
      businessesTotal: 5,
      categoriesTotal: 8,
      governoratesTotal: 22,
      districtsTotal: 333,
      dataSourcesTotal: 3,
      observationsTotal: 120,
      observationsPending: 18,
      openConflictsTotal: 4,
      reviewsTotal: 10,
      auditEventsLast7Days: 21,
    });
    expect(payload.data.recentAuditEvents).toHaveLength(1);
    expect(payload.data.recentAuditEvents[0]).not.toHaveProperty('ip');
    expect(payload.data.recentAuditEvents[0]).not.toHaveProperty('metadata');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 8,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })
    );
  });
});
