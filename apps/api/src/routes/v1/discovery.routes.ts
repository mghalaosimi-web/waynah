import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import {
  createObservationSchema,
  communityReportSchema,
  searchParamsSchema,
  type CreateObservationInput,
  type CommunityReportInput,
  type SearchParams,
  PERMISSIONS,
} from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient, type DataSource } from '@waynah/database';
import { DiscoveryOrchestratorService } from '../../domain/discovery/discovery-orchestrator.service.js';
import { IngestionService } from '../../domain/discovery/ingestion.service.js';
import { SearchService } from '../../domain/search/search.service.js';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { protectedRateLimiter, publicSearchRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { AuditLogger } from '../../utils/audit-logger.js';

export const COMMUNITY_DATA_SOURCE_NAME = 'WAYNAH Community Reports';
export const COMMUNITY_DATA_SOURCE_TYPE = 'COMMUNITY_OBSERVATION';
export const COMMUNITY_DATA_SOURCE_RELIABILITY = 0.5;

export const SYSTEM_DATA_SOURCE_NAME = 'WAYNAH System Ingestion';
export const SYSTEM_DATA_SOURCE_TYPE = 'SYSTEM_INGESTION';
export const SYSTEM_DATA_SOURCE_RELIABILITY = 1.0;

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

export async function getOrCreateSystemDataSource(prismaClient: PrismaClient): Promise<DataSource> {
  let source = await prismaClient.dataSource.findFirst({
    where: { name: SYSTEM_DATA_SOURCE_NAME },
  });

  if (!source) {
    source = await prismaClient.dataSource.create({
      data: {
        name: SYSTEM_DATA_SOURCE_NAME,
        type: SYSTEM_DATA_SOURCE_TYPE,
        reliabilityWeight: SYSTEM_DATA_SOURCE_RELIABILITY,
      },
    });
  }

  return source;
}

export function createDiscoveryRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const discoveryOrchestratorService = new DiscoveryOrchestratorService(prismaClient);
  const ingestionService = new IngestionService(prismaClient);
  const searchService = new SearchService(prismaClient);

  /**
   * Unified Discovery Endpoint (GET /v1/discovery & GET /v1/discovery/search)
   * Multi-entity search across Places, Businesses, Products, and Services.
   * Rate limited for public clients.
   */
  const handleUnifiedDiscovery = async (c: any) => {
    const queryParams = c.req.valid('query') as SearchParams;
    const discoveryResult = await searchService.searchMultiEntity(queryParams);
    return c.json({
      success: true,
      data: discoveryResult,
    });
  };

  const discoveryQueryValidator = zValidator(
    'query',
    searchParamsSchema,
    (result, c) => {
      if (!result.success) {
        return c.json(
          {
            success: false,
            error: 'Invalid search query parameters',
            details: result.error.errors,
          },
          400
        );
      }
      return;
    },
    {
      validationFunction: (schema, value) => {
        const parsed: Record<string, unknown> = { ...value };
        if (typeof parsed.lat === 'string' && parsed.lat.trim() !== '') {
          parsed.lat = Number(parsed.lat);
        }
        if (typeof parsed.lng === 'string' && parsed.lng.trim() !== '') {
          parsed.lng = Number(parsed.lng);
        }
        if (typeof parsed.radiusMeters === 'string' && parsed.radiusMeters.trim() !== '') {
          parsed.radiusMeters = Number(parsed.radiusMeters);
        }
        if (typeof parsed.limit === 'string' && parsed.limit.trim() !== '') {
          parsed.limit = Number(parsed.limit);
        }
        if (typeof parsed.offset === 'string' && parsed.offset.trim() !== '') {
          parsed.offset = Number(parsed.offset);
        }
        return schema.safeParse(parsed);
      },
    }
  );

  router.get('/', publicSearchRateLimiter, discoveryQueryValidator, handleUnifiedDiscovery);
  router.get('/search', publicSearchRateLimiter, discoveryQueryValidator, handleUnifiedDiscovery);

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

      await AuditLogger.logIngestionProcessed(
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

      await AuditLogger.logIngestionProcessed(
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
