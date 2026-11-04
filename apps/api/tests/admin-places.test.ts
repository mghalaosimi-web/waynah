import { describe, expect, it, vi } from 'vitest';
import { createServer } from '../src/server.js';
import { securityConfig } from '../src/config/security.config.js';
import { AdminService } from '../src/domain/admin/admin.service.js';
import type { PrismaClient } from '@waynah/database';

function makePlacePrisma() {
  return {
    place: {
      count: vi.fn().mockResolvedValue(41),
      findMany: vi.fn().mockResolvedValue([
        {
          id: 'place-1',
          nameAr: 'مستشفى حجة العام',
          nameEn: 'Hajjah General Hospital',
          verificationStatus: 'UNVERIFIED',
          updatedAt: new Date('2026-11-04T10:00:00.000Z'),
          category: { id: 'cat-1', nameAr: 'مستشفى', slug: 'hospital' },
          district: {
            id: 'district-1',
            nameAr: 'مدينة حجة',
            governorate: { id: 'gov-1', nameAr: 'حجة' },
          },
          business: null,
        },
      ]),
    },
  } as unknown as PrismaClient;
}

describe('Admin canonical place list', () => {
  it('rejects anonymous and system-service requests without admin.places.read', async () => {
    const app = createServer(makePlacePrisma());

    const anonymous = await app.request('/v1/admin/places');
    expect(anonymous.status).toBe(401);

    const systemService = await app.request('/v1/admin/places', {
      headers: { 'X-API-Key': securityConfig.ingestionApiKey },
    });
    expect(systemService.status).toBe(403);
  });

  it('applies bounded filters and stable pagination in the service', async () => {
    const prisma = makePlacePrisma();
    const service = new AdminService(prisma);

    const result = await service.listPlaces({
      query: 'مستشفى',
      status: 'UNVERIFIED',
      categoryId: 'category-1',
      districtId: 'district-1',
      page: 2,
      limit: 10,
    });

    expect(result).toMatchObject({
      page: 2,
      limit: 10,
      total: 41,
      totalPages: 5,
    });
    expect(result.items).toHaveLength(1);
    expect(prisma.place.count).toHaveBeenCalledWith({
      where: expect.objectContaining({
        verificationStatus: 'UNVERIFIED',
        categoryId: 'category-1',
        districtId: 'district-1',
        OR: [
          { nameAr: { contains: 'مستشفى', mode: 'insensitive' } },
          { nameEn: { contains: 'مستشفى', mode: 'insensitive' } },
        ],
      }),
    });
    expect(prisma.place.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 10,
        take: 10,
        orderBy: [{ updatedAt: 'desc' }, { id: 'desc' }],
      })
    );
  });
});
