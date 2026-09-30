import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';

export class AdminService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Retrieves all OPEN data conflicts requiring moderation review.
   */
  async getOpenConflicts() {
    return this.prisma.dataConflict.findMany({
      where: { status: 'OPEN' },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves complete knowledge history for a canonical place by ID,
   * including observations, data sources, category, district, governorate, location, and conflicts.
   */
  async getPlaceHistory(placeId: string) {
    return this.prisma.place.findUnique({
      where: { id: placeId },
      include: {
        category: true,
        district: {
          include: {
            governorate: true,
          },
        },
        location: true,
        observations: {
          include: {
            dataSource: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        conflicts: {
          orderBy: { createdAt: 'desc' },
        },
      },
    });
  }
}
