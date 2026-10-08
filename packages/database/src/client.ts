import { PrismaClient, Prisma } from '@prisma/client';

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

/**
 * Creates a dedicated PrismaClient instance using DIRECT_URL (direct PostgreSQL port 5432).
 * Designed exclusively for long-running CLI bulk operations and transactional imports.
 */
export function createDirectPrismaClient(): PrismaClient {
  const directUrl = process.env.DIRECT_URL?.trim();
  if (!directUrl) {
    throw new Error(
      '[PRE-FLIGHT GUARD FAILURE] DIRECT_URL environment variable is missing or empty. Bulk import requires a direct PostgreSQL connection on port 5432.'
    );
  }
  return new PrismaClient({
    datasources: {
      db: {
        url: directUrl,
      },
    },
    log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  });
}

export { PrismaClient, Prisma };

