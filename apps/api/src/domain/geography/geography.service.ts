/**
 * WAYNAH Geography Service
 *
 * Read-only service for retrieving canonical geographic reference data
 * (Governorates and Districts) from the database.
 *
 * This service does NOT perform mutations. Geographic data import is handled
 * exclusively by GeographyImportService and is protected behind admin authorization.
 */

import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';

export interface GovernorateRecord {
  id: string;
  externalId: string | null;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface DistrictRecord {
  id: string;
  externalId: string | null;
  governorateId: string;
  nameAr: string;
  nameEn: string | null;
  code: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export class GeographyService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Returns all governorates ordered alphabetically by Arabic name.
   */
  async listGovernorates(): Promise<GovernorateRecord[]> {
    const rows = await this.prisma.governorate.findMany({
      orderBy: { nameAr: 'asc' },
      select: {
        id: true,
        externalId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows;
  }

  /**
   * Returns a single governorate by ID, or null if not found.
   */
  async getGovernorateById(id: string): Promise<GovernorateRecord | null> {
    return this.prisma.governorate.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  /**
   * Returns all districts belonging to a specific governorate,
   * ordered alphabetically by Arabic name.
   */
  async listDistrictsByGovernorate(governorateId: string): Promise<DistrictRecord[]> {
    const rows = await this.prisma.district.findMany({
      where: { governorateId },
      orderBy: { nameAr: 'asc' },
      select: {
        id: true,
        externalId: true,
        governorateId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    return rows;
  }

  /**
   * Returns a single district by ID, or null if not found.
   */
  async getDistrictById(id: string): Promise<DistrictRecord | null> {
    return this.prisma.district.findUnique({
      where: { id },
      select: {
        id: true,
        externalId: true,
        governorateId: true,
        nameAr: true,
        nameEn: true,
        code: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }
}
