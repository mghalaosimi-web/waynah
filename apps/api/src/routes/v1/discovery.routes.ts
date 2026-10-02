import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createObservationSchema,
  communityReportSchema,
  type CreateObservationInput,
  type CommunityReportInput,
  PERMISSIONS,
} from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient, type DataSource } from '@waynah/database';
import { DiscoveryOrchestratorService } from '../../domain/discovery/discovery-orchestrator.service.js';
import { IngestionService } from '../../domain/discovery/ingestion.service.js';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { protectedRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { AuditLogger } from '../../utils/audit-logger.js';

export const COMMUNITY_DATA_SOURCE_NAME = 'WAYNAH Community Reports';
export const COMMUNITY_DATA_SOURCE_TYPE = 'COMMUNITY_OBSERVATION';
export const COMMUNITY_DATA_SOURCE_RELIABILITY = 0.5;

export async function getOrCreateCommunityDataSource(prismaClient: PrismaClient): Promise<DataSource> {
  let source = await prismaClient.dataSource.findFirst({
    where: { name: COMMUNITY_DATA_SOURCE_NAME },
  });

  if (!source) {
    source = await prismaClient.dataSource.create({
      data: {
        name: COMMUNITY_DATA_SOURCE_NAME,
        type: COMMUNITY_DATA_SOURCE_TYPE,
        reliabilityWeight: COMMUNITY_DATA_SOURCE_RELIABILITY,
      },
    });
  }

  return source;
}

export function createDiscoveryRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const discoveryOrchestratorService = new DiscoveryOrchestratorService(prismaClient);
  const ingestionService = new IngestionService(prismaClient);

  /**
   * Protected System Ingestion Route (POST /v1/discovery/ingest)
   * Requires DISCOVERY_INGEST permission.
   */
  router.post(
    '/ingest',
    protectedRateLimiter,
    authenticate,
    requirePermission(PERMISSIONS.DISCOVERY_INGEST),
    zValidator('json', createObservationSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Invalid observation payload',
            details: result.error.errors,
          },
          400
        );
      }
      return;
    }),
    async (c) => {
      const input = c.req.valid('json') as CreateObservationInput;
      const actor = c.get('actor');
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      const result = await discoveryOrchestratorService.processObservation(input, prismaClient);

      AuditLogger.logIngestionProcessed(
        result.observation.id,
        result.action,
        actor?.id || 'unknown',
        input.dataSourceId,
        ip
      );

      return c.json(
        {
          success: true,
          data: result,
        },
        201
      );
    }
  );

  /**
   * Public Community Observation Submission Route (POST /v1/discovery/community-report)
   *
   * Allows public site visitors to report place observations without elevated permissions.
   * Rate-limited per IP. Automatically binds the server-managed Community DataSource.
   * Directly ingests observation as PENDING with confidence 0.0 without mutating Place master records.
   */
  router.post(
    '/community-report',
    protectedRateLimiter,
    zValidator('json', communityReportSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Invalid community report payload',
            details: result.error.errors,
          },
          400
        );
      }
      return;
    }),
    async (c) => {
      const input = c.req.valid('json') as CommunityReportInput;
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      // Bind community DataSource server-side (provenance integrity protection)
      const communitySource = await getOrCreateCommunityDataSource(prismaClient);

      const ingestionInput: CreateObservationInput = {
        ...input,
        dataSourceId: communitySource.id,
      };

      const observation = await ingestionService.ingestObservation(ingestionInput);

      AuditLogger.logIngestionProcessed(
        observation.id,
        'OBSERVATION_INGESTED',
        'public-community-user',
        communitySource.id,
        ip
      );

      return c.json(
        {
          success: true,
          data: {
            action: 'OBSERVATION_INGESTED',
            observationId: observation.id,
            observation,
          },
        },
        201
      );
    }
  );

  return router;
}


export const discoveryRouter = createDiscoveryRouter(defaultPrisma);

