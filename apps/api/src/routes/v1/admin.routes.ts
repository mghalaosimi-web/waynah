import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { z, PERMISSIONS } from '@waynah/shared';
import { AdminService } from '../../domain/admin/admin.service.js';
import { AdminVerificationService } from '../../domain/admin/admin-verification.service.js';
import { BranchClaimAdminService } from '../../domain/admin/branch-claim-admin.service.js';
import { BusinessService } from '../../domain/business/business.service.js';
import { PlaceMergeService } from '../../domain/operations/place-merge.service.js';
import { DomainSplitService } from '../../domain/operations/domain-split.service.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { protectedRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { ApiResponse } from '../../utils/api-response.js';
import { AuditLogger } from '../../utils/audit-logger.js';
import { NotificationDispatcher } from '../../services/notification-dispatcher.js';

const reviewVerificationSchema = z.object({
  status: z.enum(['VERIFIED', 'REJECTED'], {
    errorMap: () => ({ message: 'حالة التوثيق يجب أن تكون VERIFIED أو REJECTED' }),
  }),
  rejectionReason: z.string().optional().nullable(),
});

const reviewClaimSchema = z.object({
  action: z.enum(['APPROVE', 'REJECT'], {
    errorMap: () => ({ message: 'الإجراء يجب أن يكون APPROVE أو REJECT' }),
  }),
  rejectionReason: z.string().optional().nullable(),
});

const placeHistoryParamSchema = z.object({
  id: z.string().trim().min(1, { message: 'معرف المكان غير صالح' }).regex(/^[a-zA-Z0-9_-]+$/, { message: 'معرف المكان غير صالح' }),
});

const resolveConflictSchema = z.object({
  action: z.enum(['ACCEPT_BASE', 'ACCEPT_CONFLICTING', 'REJECT_BOTH'], {
    errorMap: () => ({ message: 'الإجراء يجب أن يكون ACCEPT_BASE أو ACCEPT_CONFLICTING أو REJECT_BOTH' }),
  }),
  notes: z.string().optional().nullable(),
});

const moderateReviewSchema = z.object({
  action: z.enum(['APPROVE', 'HIDE'], {
    errorMap: () => ({ message: 'الإجراء يجب أن يكون APPROVE أو HIDE' }),
  }),
  reason: z.string().optional().nullable(),
});

const mergeCandidateSchema = z.object({
  canonicalTargetPlaceId: z.string().optional().nullable(),
});

const splitDomainSchema = z.object({
  sourcePlaceId: z.string().trim().min(1),
  newPlace: z.object({
    nameAr: z.string().trim().min(1),
    nameEn: z.string().optional().nullable(),
    categoryId: z.string().trim().min(1),
    districtId: z.string().trim().min(1),
    phoneNumber: z.string().optional().nullable(),
    address: z.string().optional().nullable(),
    latitude: z.number(),
    longitude: z.number(),
  }),
  observationIdsToMove: z.array(z.string()).min(1),
  isUnmerge: z.boolean().optional(),
});

export function createAdminRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const adminService = new AdminService(prismaClient);
  const adminVerificationService = new AdminVerificationService(prismaClient);
  const branchClaimAdminService = new BranchClaimAdminService(prismaClient);
  const businessService = new BusinessService(prismaClient);
  const placeMergeService = new PlaceMergeService(prismaClient);
  const domainSplitService = new DomainSplitService(prismaClient);
  const notificationDispatcher = new NotificationDispatcher(prismaClient);

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
   * POST /v1/admin/conflicts/:id/resolve
   * Performs server-authoritative resolution of a DataConflict.
   * Required Permission: admin.conflicts.write
   */
  router.post(
    '/conflicts/:id/resolve',
    requirePermission(PERMISSIONS.ADMIN_CONFLICTS_WRITE),
    zValidator('json', resolveConflictSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات حل النزاع غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const adminId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const conflictId = c.req.param('id');
      const body = c.req.valid('json');

      try {
        const resolved = await adminService.resolveConflict(conflictId, body.action as any, adminId);
        await AuditLogger.logDataConflictResolved(conflictId, resolved.placeId, body.action, resolved.status, adminId);
        return c.json(ApiResponse.success(resolved));
      } catch (err: any) {
        if (err.message === 'CONFLICT_NOT_FOUND') {
          return c.json(ApiResponse.error('النزاع غير موجود', 'NOT_FOUND'), 404);
        }
        if (err.message === 'CONFLICT_ALREADY_RESOLVED') {
          return c.json(ApiResponse.error('تم حل النزاع بالفعل', 'CONFLICT_ALREADY_RESOLVED'), 400);
        }
        return c.json(ApiResponse.error('فشل في حل النزاع', 'RESOLVE_FAILED'), 500);
      }
    }
  );

  /**
   * GET /v1/admin/reviews
   * Returns reviews for moderation, filterable by status.
   * Required Permission: admin.reviews.moderate
   */
  router.get('/reviews', requirePermission(PERMISSIONS.ADMIN_REVIEWS_MODERATE), async (c) => {
    const statusFilter = c.req.query('status');
    const reviews = await adminService.listReviews(statusFilter);
    return c.json(ApiResponse.success(reviews, { count: reviews.length }));
  });

  /**
   * POST /v1/admin/reviews/:id/moderate
   * Performs administrative moderation (APPROVE or HIDE) on a Review.
   * Required Permission: admin.reviews.moderate
   */
  router.post(
    '/reviews/:id/moderate',
    requirePermission(PERMISSIONS.ADMIN_REVIEWS_MODERATE),
    zValidator('json', moderateReviewSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات مراجعة التقييم غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const adminId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const reviewId = c.req.param('id');
      const body = c.req.valid('json');

      try {
        const moderated = await adminService.moderateReview(reviewId, body.action as any, body.reason || undefined);
        await AuditLogger.logReviewModerated(reviewId, body.action, moderated.status, adminId);
        try {
          await notificationDispatcher.dispatchReviewModerated({
            userId: moderated.userId,
            reviewId: moderated.id,
            status: moderated.status as any,
            reason: body.reason || undefined,
          });
        } catch (_err) {}
        return c.json(ApiResponse.success(moderated));
      } catch (err: any) {
        if (err.message === 'REVIEW_NOT_FOUND') {
          return c.json(ApiResponse.error('التقييم غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في مراجعة التقييم', 'MODERATE_FAILED'), 500);
      }
    }
  );

  /**
   * GET /v1/admin/duplicates/candidates
   * Returns list of duplicate candidates for moderation review.
   * Required Permission: admin.duplicates.manage
   */
  router.get('/duplicates/candidates', requirePermission(PERMISSIONS.ADMIN_DUPLICATES_MANAGE), async (c) => {
    const statusFilter = c.req.query('status');
    const candidates = await adminService.listDuplicateCandidates(statusFilter);
    return c.json(ApiResponse.success(candidates, { count: candidates.length }));
  });

  /**
   * POST /v1/admin/duplicates/candidates/:id/merge
   * Performs administrative Merge of a DuplicateCandidate pair.
   * Required Permission: admin.duplicates.manage
   */
  router.post(
    '/duplicates/candidates/:id/merge',
    requirePermission(PERMISSIONS.ADMIN_DUPLICATES_MANAGE),
    zValidator('json', mergeCandidateSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات دمج التكرار غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const adminId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const candidateId = c.req.param('id');
      const body = c.req.valid('json');

      const candidate = await prismaClient.duplicateCandidate.findUnique({ where: { id: candidateId } });
      if (!candidate) {
        return c.json(ApiResponse.error('مرشح التكرار غير موجود', 'NOT_FOUND'), 404);
      }

      const targetPlaceId = body.canonicalTargetPlaceId || candidate.targetPlaceId;
      const sourcePlaceId = candidate.sourcePlaceId === targetPlaceId ? candidate.targetPlaceId : candidate.sourcePlaceId;

      try {
        const mergeResult = await placeMergeService.mergePlaces(sourcePlaceId, targetPlaceId, adminId);
        await AuditLogger.logPlaceMerged(sourcePlaceId, targetPlaceId, adminId);
        return c.json(ApiResponse.success(mergeResult));
      } catch (err: any) {
        if (err.message === 'INVALID_MERGE_SAME_PLACE') {
          return c.json(ApiResponse.error('لا يمكن دمج المكان مع نفسه', 'INVALID_MERGE_SAME_PLACE'), 400);
        }
        if (err.message === 'CANNOT_MERGE_CLOSED_PLACE' || err.message === 'CANNOT_MERGE_INTO_CLOSED_TARGET') {
          return c.json(ApiResponse.error('لا يمكن دمج مكان مغلق', 'CANNOT_MERGE_CLOSED_PLACE'), 400);
        }
        if (err.message === 'PLACE_NOT_FOUND') {
          return c.json(ApiResponse.error('أحد المكانين غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في دمج التكرار', 'MERGE_FAILED'), 500);
      }
    }
  );

  /**
   * POST /v1/admin/duplicates/candidates/:id/ignore
   * Dismisses / Ignores a DuplicateCandidate pair.
   * Required Permission: admin.duplicates.manage
   */
  router.post(
    '/duplicates/candidates/:id/ignore',
    requirePermission(PERMISSIONS.ADMIN_DUPLICATES_MANAGE),
    async (c) => {
      const candidateId = c.req.param('id');
      try {
        const updated = await adminService.ignoreDuplicateCandidate(candidateId);
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'CANDIDATE_NOT_FOUND') {
          return c.json(ApiResponse.error('مرشح التكرار غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تجاهل التكرار', 'IGNORE_FAILED'), 500);
      }
    }
  );

  /**
   * POST /v1/admin/duplicates/split
   * Performs administrative Domain Split.
   * Required Permission: admin.duplicates.manage
   */
  router.post(
    '/duplicates/split',
    requirePermission(PERMISSIONS.ADMIN_DUPLICATES_MANAGE),
    zValidator('json', splitDomainSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات تفكيك النطاق غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const adminId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const body = c.req.valid('json');

      try {
        const splitResult = await domainSplitService.splitDomain(body, adminId);
        await AuditLogger.logDomainSplit(body.sourcePlaceId, splitResult.newPlaceId, splitResult.observationsMoved, adminId);
        return c.json(ApiResponse.success(splitResult));
      } catch (err: any) {
        if (err.message === 'UNMERGE_OUT_OF_SCOPE') {
          return c.json(ApiResponse.error('إلغاء الدمج (Unmerge) غير مدعوم في هذا الإصدار', 'UNMERGE_OUT_OF_SCOPE'), 400);
        }
        if (err.message === 'SOURCE_PLACE_NOT_FOUND') {
          return c.json(ApiResponse.error('المكان الرئيسي غير موجود', 'NOT_FOUND'), 404);
        }
        if (err.message === 'CANNOT_SPLIT_CLOSED_PLACE') {
          return c.json(ApiResponse.error('لا يمكن تفكيك مكان مغلق', 'CANNOT_SPLIT_CLOSED_PLACE'), 400);
        }
        if (err.message === 'OBSERVATIONS_NOT_FOUND_OR_MISMATCH') {
          return c.json(ApiResponse.error('سجلات الرصد المحددة غير موجودة أو لا تتبع المكان الرئيسي', 'INVALID_INPUT'), 400);
        }
        return c.json(ApiResponse.error('فشل في تفكيك النطاق', 'SPLIT_FAILED'), 500);
      }
    }
  );

  /**
   * GET /v1/admin/places/:id/history
   * Returns canonical place details and observation knowledge timeline.
   * Required Permission: admin.places.history.read
   */
  router.get(
    '/places/:id/history',
    requirePermission(PERMISSIONS.ADMIN_PLACES_HISTORY_READ),
    zValidator('param', placeHistoryParamSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('معرف المكان غير صالح', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const placeId = c.req.param('id');
      try {
        const place = await adminService.getPlaceHistory(placeId);

        if (!place) {
          return c.json(
            ApiResponse.error(`Place with ID '${placeId}' was not found`, 'NOT_FOUND'),
            404
          );
        }

        return c.json(ApiResponse.success(place));
      } catch (_err) {
        return c.json(
          ApiResponse.error('فشل في جلب سجل المعرفة للمكان', 'FETCH_HISTORY_FAILED'),
          500
        );
      }
    }
  );

  /**
   * GET /v1/admin/branch-claims
   * Returns branch claim review queue for administrators.
   * Required Permission: admin.branch_claims.read
   */
  router.get('/branch-claims', requirePermission(PERMISSIONS.ADMIN_BRANCH_CLAIMS_READ), async (c) => {
    const statusFilter = c.req.query('status');
    const claims = await branchClaimAdminService.listPendingClaims(statusFilter);
    return c.json(ApiResponse.success(claims, { count: claims.length }));
  });

  /**
   * POST /v1/admin/branch-claims/:id/review
   * Performs server-authoritative review (Approve or Reject) of a BranchClaim.
   * On approval, performs atomic linking of Place.businessId inside a database transaction.
   * Required Permission: admin.branch_claims.review
   */
  router.post(
    '/branch-claims/:id/review',
    requirePermission(PERMISSIONS.ADMIN_BRANCH_CLAIMS_REVIEW),
    zValidator('json', reviewClaimSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات مراجعة طلب الربط غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const reviewerId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const claimId = c.req.param('id');
      const body = c.req.valid('json');

      try {
        const result = await branchClaimAdminService.reviewClaim(
          reviewerId,
          claimId,
          body
        );

        // Post-commit structured audit logging
        if (result.eventType === 'BRANCH_LINK_ESTABLISHED') {
          await AuditLogger.logBranchLinkEstablished(
            result.updatedClaim.id,
            result.updatedClaim.businessId,
            result.updatedClaim.placeId,
            reviewerId
          );
        } else if (result.eventType === 'BRANCH_LINK_REASSIGNED') {
          await AuditLogger.logBranchLinkReassigned(
            result.updatedClaim.id,
            result.updatedClaim.businessId,
            result.previousBusinessId || '',
            result.updatedClaim.placeId,
            reviewerId
          );
        } else if (result.eventType === 'BRANCH_CLAIM_REVIEWED') {
          await AuditLogger.logBranchClaimReviewed(
            result.updatedClaim.id,
            result.updatedClaim.businessId,
            result.updatedClaim.placeId,
            body.action,
            result.updatedClaim.status,
            reviewerId
          );
        }

        if (result?.updatedClaim) {
          try {
            await notificationDispatcher.dispatchBranchClaimReviewed({
              userId: result.updatedClaim.claimantId,
              businessId: result.updatedClaim.businessId,
              placeId: result.updatedClaim.placeId,
              status: result.updatedClaim.status === 'APPROVED' ? 'APPROVED' : 'REJECTED',
              reason: result.updatedClaim.rejectionReason || undefined,
            });
          } catch (_err) {}
        }

        return c.json(ApiResponse.success(result.updatedClaim));
      } catch (err: any) {
        if (err.message === 'CLAIM_NOT_FOUND') {
          return c.json(ApiResponse.error('طلب الربط غير موجود', 'CLAIM_NOT_FOUND'), 404);
        }
        if (err.message === 'CLAIMANT_CANNOT_REVIEW_OWN_CLAIM') {
          return c.json(
            ApiResponse.error('لا يمكن لمقدم الطلب مراجعة طلبه الخاص', 'FORBIDDEN'),
            403
          );
        }
        if (err.message === 'CANNOT_REVIEW_TERMINAL_CLAIM') {
          return c.json(
            ApiResponse.error('لا يمكن مراجعة طلب ربط في حالة نهائية', 'CANNOT_REVIEW_TERMINAL_CLAIM'),
            400
          );
        }
        if (err.message === 'REJECTION_REASON_REQUIRED') {
          return c.json(
            ApiResponse.error('يرجى تحديد سبب الرفض عند رفض طلب الربط', 'REJECTION_REASON_REQUIRED'),
            400
          );
        }
        if (err.message === 'PLACE_ALREADY_LINKED' || err.message === 'DISPUTED_PLACE_NOT_LINKED') {
          return c.json(
            ApiResponse.error('تعارض في حالة ربط الموقع الحالية', 'ALREADY_LINKED'),
            409
          );
        }
        return c.json(ApiResponse.error('فشل في مراجعة طلب الربط', 'REVIEW_FAILED'), 500);
      }
    }
  );

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

        await AuditLogger.logVerificationReviewed(
          updated.id,
          updated.businessId,
          updated.status,
          reviewerId
        );

        try {
          if (prismaClient.businessMember?.findMany) {
            const members = await prismaClient.businessMember.findMany({
              where: { businessId: updated.businessId },
              select: { userId: true },
            });
            for (const member of members || []) {
              await notificationDispatcher.dispatchVerificationReviewed({
                userId: member.userId,
                businessId: updated.businessId,
                businessName: updated.business?.name || 'النشاط التجاري',
                status: updated.status as any,
                reason: updated.rejectionReason || undefined,
              });
            }
          }
        } catch (_err) {}

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

  /**
   * DELETE /v1/admin/businesses/:id/branches/:placeId
   * Admin-authoritative removal of operational branch relationship (Place.businessId = NULL).
   * Required Permission: admin.branch_claims.review
   */
  router.delete(
    '/businesses/:id/branches/:placeId',
    requirePermission(PERMISSIONS.ADMIN_BRANCH_CLAIMS_REVIEW),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const reviewerId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : 'SYSTEM_ADMIN');
      const businessId = c.req.param('id');
      const placeId = c.req.param('placeId');

      try {
        const unlinkedPlace = await businessService.unlinkBranch(
          reviewerId,
          businessId,
          placeId,
          true // Admin override
        );

        // Post-commit structured security audit logging
        await AuditLogger.logBranchLinkRemoved(
          businessId,
          placeId,
          reviewerId,
          'ADMIN'
        );

        return c.json(ApiResponse.success(unlinkedPlace));
      } catch (err: any) {
        if (
          err.message === 'BUSINESS_NOT_FOUND' ||
          err.message === 'PLACE_NOT_FOUND' ||
          err.message === 'PLACE_NOT_LINKED_TO_THIS_BUSINESS'
        ) {
          return c.json(
            ApiResponse.error('الفرع أو النشاط التجاري غير موجود أو غير مرتبط بهذا النشاط', 'NOT_FOUND'),
            404
          );
        }
        if (err.message === 'ALREADY_UNLINKED') {
          return c.json(
            ApiResponse.error('هذا الموقع غير مرتبط بأي نشاط تجاري بالفعل', 'ALREADY_UNLINKED'),
            409
          );
        }
        return c.json(ApiResponse.error('فشل فك ربط الفرع', 'BRANCH_UNLINK_FAILED'), 500);
      }
    }
  );

  /**
   * GET /v1/admin/audit-logs
   * Returns paginated operational audit logs with verified filtering.
   * Read-only administrative endpoint.
   * Required Permission: admin.audit.read
   */
  router.get(
    '/audit-logs',
    requirePermission(PERMISSIONS.ADMIN_AUDIT_READ),
    async (c) => {
      const query = c.req.query();

      const pageRaw = query.page ? parseInt(query.page, 10) : 1;
      const limitRaw = query.limit ? parseInt(query.limit, 10) : 20;

      if (isNaN(pageRaw) || pageRaw < 1) {
        return c.json(ApiResponse.error('رقم الصفحة غير صالح', 'INVALID_INPUT'), 400);
      }

      if (isNaN(limitRaw) || limitRaw < 1) {
        return c.json(ApiResponse.error('عدد العناصر غير صالح', 'INVALID_INPUT'), 400);
      }

      const page = pageRaw;
      const limit = Math.min(100, limitRaw);

      let startDateObj: Date | undefined;
      if (query.startDate) {
        startDateObj = new Date(query.startDate);
        if (isNaN(startDateObj.getTime())) {
          return c.json(ApiResponse.error('تاريخ البداية غير صالح', 'INVALID_INPUT'), 400);
        }
      }

      let endDateObj: Date | undefined;
      if (query.endDate) {
        endDateObj = new Date(query.endDate);
        if (isNaN(endDateObj.getTime())) {
          return c.json(ApiResponse.error('تاريخ النهاية غير صالح', 'INVALID_INPUT'), 400);
        }
      }

      const where: any = {};
      if (query.eventType) where.eventType = query.eventType;
      if (query.actorId) where.actorId = query.actorId;
      if (query.resourceType) where.resourceType = query.resourceType;
      if (query.resourceId) where.resourceId = query.resourceId;
      if (query.businessId) where.businessId = query.businessId;

      if (startDateObj || endDateObj) {
        where.createdAt = {};
        if (startDateObj) where.createdAt.gte = startDateObj;
        if (endDateObj) where.createdAt.lte = endDateObj;
      }

      try {
        const skip = (page - 1) * limit;
        const [total, items] = await Promise.all([
          prismaClient.auditLog.count({ where }),
          prismaClient.auditLog.findMany({
            where,
            orderBy: [{ createdAt: 'desc' }, { id: 'desc' }],
            skip,
            take: limit,
          }),
        ]);

        return c.json(
          ApiResponse.success(items, {
            page,
            limit,
            total,
            totalPages: Math.ceil(total / limit),
          })
        );
      } catch (_err) {
        return c.json(
          ApiResponse.error('فشل في جلب سجلات التدقيق', 'FETCH_AUDIT_LOGS_FAILED'),
          500
        );
      }
    }
  );

  return router;
}

export const adminRouter = createAdminRouter(defaultPrisma);
