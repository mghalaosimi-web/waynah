import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';
import { securityConfig } from '../src/config/security.config.js';
import { AdminService } from '../src/domain/admin/admin.service.js';
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
  it('rejects anonymous and system-service requests without admin.audit.read', async () => {
    const app = createServer(makeAnalyticsPrisma());

    const anonymous = await app.request('/v1/admin/analytics/overview');
    expect(anonymous.status).toBe(401);

    const systemService = await app.request('/v1/admin/analytics/overview', {
      headers: { 'X-API-Key': securityConfig.ingestionApiKey },
    });
    expect(systemService.status).toBe(403);
  });

  it('returns real aggregates and a privacy-minimized recent audit list from the service', async () => {
    const prisma = makeAnalyticsPrisma();
    const service = new AdminService(prisma);
    const result = await service.getAnalyticsOverview();

    expect(result.periodDays).toBe(7);
    expect(result.summary).toMatchObject({
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
    expect(result.recentAuditEvents).toHaveLength(1);
    expect(result.recentAuditEvents[0]).not.toHaveProperty('ip');
    expect(result.recentAuditEvents[0]).not.toHaveProperty('metadata');
    expect(prisma.auditLog.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 8,
        orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
      })
    );
  });
});
