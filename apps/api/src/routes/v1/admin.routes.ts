import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { z, PERMISSIONS } from '@waynah/shared';
import { AdminService } from '../../domain/admin/admin.service.js';
import { AdminVerificationService } from '../../domain/admin/admin-verification.service.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { protectedRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { ApiResponse } from '../../utils/api-response.js';
import { AuditLogger } from '../../utils/audit-logger.js';

const reviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED'], {
    errorMap: () => ({ message: 'حالة التوثيق يجب أن تكون VERIFIED أو REJECTED' }),
  }),
  rejectionReason: z.string().optional().nullable(),
});

export function createAdminRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const adminService = new AdminService(prismaClient);
  const adminVerificationService = new AdminVerificationService(prismaClient);

  // Rate limiting & Authentication identification middleware
  router.use('*', protectedRateLimiter);
  router.use('*', createAuthMiddleware(prismaClient));

  /**
   * GET /v1/admin/conflicts
   * Returns list of open data conflicts needing moderation resolution.
   * Required Permission: admin.conflicts.read
   */
  router.get('/conflicts', requirePermission(PERMISSIONS.ADMIN_CONFLICTS_READ), async (c) => {
    const conflicts = await adminService.getOpenConflicts();
    return c.json(ApiResponse.success(conflicts, { count: conflicts.length }));
  });

  /**
   * GET /v1/admin/places/:id/history
   * Returns canonical place details and observation knowledge timeline.
   * Required Permission: admin.places.history.read
   */
  router.get('/places/:id/history', requirePermission(PERMISSIONS.ADMIN_PLACES_HISTORY_READ), async (c) => {
    const placeId = c.req.param('id');
    const place = await adminService.getPlaceHistory(placeId);

    if (!place) {
      return c.json(
        ApiResponse.error(`Place with ID '${placeId}' was not found`, 'NOT_FOUND'),
        404
      );
    }

    return c.json(ApiResponse.success(place));
  });

  /**
   * GET /v1/admin/verifications/stats
   * Returns metrics overview for verification review queue.
   * Required Permission: admin.verification.read
   */
  router.get('/verifications/stats', requirePermission(PERMISSIONS.ADMIN_VERIFICATION_READ), async (c) => {
    const stats = await adminVerificationService.getAdminVerificationStats();
    return c.json(ApiResponse.success(stats));
  });

  /**
   * GET /v1/admin/verifications
   * Returns business verification queue filterable by status.
   * Required Permission: admin.verification.read
   */
  router.get('/verifications', requirePermission(PERMISSIONS.ADMIN_VERIFICATION_READ), async (c) => {
    const statusFilter = c.req.query('status');
    const verifications = await adminVerificationService.listVerifications(statusFilter);
    return c.json(ApiResponse.success(verifications, { count: verifications.length }));
  });

  /**
   * GET /v1/admin/verifications/:id
   * Returns detailed verification request record with business & places context.
   * Required Permission: admin.verification.read
   */
  router.get('/verifications/:id', requirePermission(PERMISSIONS.ADMIN_VERIFICATION_READ), async (c) => {
    const id = c.req.param('id');
    const verification = await adminVerificationService.getVerificationById(id);

    if (!verification) {
      return c.json(
        ApiResponse.error('طلب التوثيق غير موجود', 'VERIFICATION_NOT_FOUND'),
        404
      );
    }

    return c.json(ApiResponse.success(verification));
  });

  /**
   * POST /v1/admin/verifications/:id/review
   * Performs server-authoritative review (Approve or Reject) of a PENDING verification.
   * Required Permission: admin.verification.review
   */
  router.post(
    '/verifications/:id/review',
    requirePermission(PERMISSIONS.ADMIN_VERIFICATION_REVIEW),
    zValidator('json', reviewVerificationSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات مراجعة التوثيق غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const reviewerId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const id = c.req.param('id');
      const body = c.req.valid('json');

      try {
        const updated = await adminVerificationService.reviewVerification(
          reviewerId,
          id,
          body as any
        );

        AuditLogger.logVerificationReviewed(
          updated.id,
          updated.businessId,
          updated.status,
          reviewerId
        );

        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'VERIFICATION_NOT_FOUND') {
          return c.json(ApiResponse.error('طلب التوثيق غير موجود', 'VERIFICATION_NOT_FOUND'), 404);
        }
        if (err.message === 'INVALID_STATE_TRANSITION') {
          return c.json(
            ApiResponse.error('يمكن مراجعة الطلبات التي بحالة قيد المراجعة (PENDING) فقط', 'INVALID_STATE_TRANSITION'),
            400
          );
        }
        if (err.message === 'REJECTION_REASON_REQUIRED') {
          return c.json(
            ApiResponse.error('يرجى تحديد سبب الرفض عند رفض طلب التوثيق', 'REJECTION_REASON_REQUIRED'),
            400
          );
        }
        if (err.message === 'INVALID_STATUS') {
          return c.json(
            ApiResponse.error('حالة التوثيق غير صالحة', 'INVALID_INPUT'),
            400
          );
        }
        return c.json(ApiResponse.error('فشل في مراجعة طلب التوثيق', 'REVIEW_FAILED'), 500);
      }
    }
  );

  return router;
}

export const adminRouter = createAdminRouter(defaultPrisma);
