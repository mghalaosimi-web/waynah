/**
 * Idempotent Seed for WAYNAH Default DataSources
 *
 * Ensures Default System DataSource and Community DataSource exist in database.
 * Non-destructive, idempotent, safe for multiple runs without creating duplicate records.
 */

import { prisma } from '@waynah/database';

export const SYSTEM_DATA_SOURCE_NAME = 'WAYNAH System Ingestion';
export const COMMUNITY_DATA_SOURCE_NAME = 'WAYNAH Community Reports';

export async function seedDefaultDataSources() {
  console.log('--- SEEDING DEFAULT DATA SOURCES ---');

  let systemSource = await prisma.dataSource.findFirst({
    where: { name: SYSTEM_DATA_SOURCE_NAME },
  });

  if (!systemSource) {
    systemSource = await prisma.dataSource.create({
      data: {
        name: SYSTEM_DATA_SOURCE_NAME,
        type: 'SYSTEM_INGESTION',
        reliabilityWeight: 1.0,
      },
    });
    console.log(`[CREATED] Default System DataSource: ${systemSource.name} (${systemSource.id})`);
  } else {
    console.log(`[EXISTS] Default System DataSource: ${systemSource.name} (${systemSource.id})`);
  }

  let communitySource = await prisma.dataSource.findFirst({
    where: { name: COMMUNITY_DATA_SOURCE_NAME },
  });

  if (!communitySource) {
    communitySource = await prisma.dataSource.create({
      data: {
        name: COMMUNITY_DATA_SOURCE_NAME,
        type: 'COMMUNITY_OBSERVATION',
        reliabilityWeight: 0.5,
      },
    });
    console.log(`[CREATED] Community DataSource: ${communitySource.name} (${communitySource.id})`);
  } else {
    console.log(`[EXISTS] Community DataSource: ${communitySource.name} (${communitySource.id})`);
  }

  return { systemSource, communitySource };
}

if (process.argv[1]?.includes('seed-default-data-sources')) {
  seedDefaultDataSources()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[SEED ERROR]', err);
      process.exit(1);
    });
}
