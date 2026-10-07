/**
 * Idempotent Seed Helper for WAYNAH Default DataSources
 *
 * Ensures Default System DataSource and Community DataSource exist in database.
 * Non-destructive, idempotent, safe for multiple runs without creating duplicate records.
 */

import { prisma as defaultPrisma, PrismaClient, type DataSource } from '@waynah/database';

export const SYSTEM_DATA_SOURCE_NAME = 'WAYNAH System Ingestion';
export const COMMUNITY_DATA_SOURCE_NAME = 'WAYNAH Community Reports';

export async function seedDefaultDataSources(prismaClient: PrismaClient = defaultPrisma): Promise<{
  systemSource: DataSource;
  communitySource: DataSource;
}> {
  let systemSource = await prismaClient.dataSource.findFirst({
    where: { name: SYSTEM_DATA_SOURCE_NAME },
  });

  if (!systemSource) {
    systemSource = await prismaClient.dataSource.create({
      data: {
        name: SYSTEM_DATA_SOURCE_NAME,
        type: 'SYSTEM_INGESTION',
        reliabilityWeight: 1.0,
      },
    });
  }

  let communitySource = await prismaClient.dataSource.findFirst({
    where: { name: COMMUNITY_DATA_SOURCE_NAME },
  });

  if (!communitySource) {
    communitySource = await prismaClient.dataSource.create({
      data: {
        name: COMMUNITY_DATA_SOURCE_NAME,
        type: 'COMMUNITY_OBSERVATION',
        reliabilityWeight: 0.5,
      },
    });
  }

  return { systemSource, communitySource };
}
