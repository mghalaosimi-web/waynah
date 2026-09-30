import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { createObservationSchema, type CreateObservationInput, PERMISSIONS } from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { DiscoveryOrchestratorService } from '../../domain/discovery/discovery-orchestrator.service.js';

import { authenticate } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { protectedRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { AuditLogger } from '../../utils/audit-logger.js';

export function createDiscoveryRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const discoveryOrchestratorService = new DiscoveryOrchestratorService(prismaClient);

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

      const result = await discoveryOrchestratorService.processObservation(input);

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

  return router;
}

export const discoveryRouter = createDiscoveryRouter(defaultPrisma);
