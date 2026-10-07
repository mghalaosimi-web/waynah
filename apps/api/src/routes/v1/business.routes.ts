import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma as defaultPrisma, type PrismaClient, BusinessStatus, BusinessRole } from '@waynah/database';
import { z, PERMISSIONS } from '@waynah/shared';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { protectedRateLimiter, createRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { BusinessService } from '../../domain/business/business.service.js';
import { BusinessVerificationService } from '../../domain/business/business-verification.service.js';
import { BranchClaimService } from '../../domain/business/branch-claim.service.js';
import { BusinessTeamService } from '../../domain/business/business-team.service.js';
import { CatalogService } from '../../domain/catalog/catalog.service.js';
import { ApiResponse } from '../../utils/api-response.js';
import { AuditLogger } from '../../utils/audit-logger.js';
import { NotificationDispatcher } from '../../services/notification-dispatcher.js';

const inviteMemberSchema = z.object({
  email: z.string().email('صيغة البريد الإلكتروني غير صحيحة'),
  role: z.nativeEnum(BusinessRole).optional(),
});

const updateMemberRoleSchema = z.object({
  role: z.nativeEnum(BusinessRole),
});

const createBusinessSchema = z.object({
  name: z.string().min(2, 'اسم النشاط يجب أن يكون حرفين على الأقل'),
  description: z.string().nullable().optional(),
  slug: z.string().nullable().optional(),
});

const updateBusinessSchema = z.object({
  name: z.string().min(2, 'اسم النشاط يجب أن يكون حرفين على الأقل').optional(),
  description: z.string().nullable().optional(),
  status: z.nativeEnum(BusinessStatus).optional(),
});

const submitVerificationSchema = z.object({
  notes: z.string().max(1000, 'الملاحظات يجب أن لا تتجاوز 1000 حرف').optional().nullable(),
});

const submitClaimSchema = z.object({
  placeId: z.string().min(1, 'معرف الموقع مطلوب'),
  notes: z.string().max(1000, 'الملاحظات يجب أن لا تتجاوز 1000 حرف').optional().nullable(),
});

const createProductSchema = z.object({
  nameAr: z.string().min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل'),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون بالسالب'),
  currency: z.string().optional(),
  isAvailable: z.boolean().optional(),
  sku: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

const updateProductSchema = z.object({
  nameAr: z.string().min(2, 'اسم المنتج يجب أن يكون حرفين على الأقل').optional(),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون بالسالب').optional(),
  currency: z.string().optional(),
  isAvailable: z.boolean().optional(),
  sku: z.string().nullable().optional(),
  imageUrl: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

const createServiceSchema = z.object({
  nameAr: z.string().min(2, 'اسم الخدمة يجب أن يكون حرفين على الأقل'),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون بالسالب').nullable().optional(),
  currency: z.string().optional(),
  isAvailable: z.boolean().optional(),
  durationMinutes: z.number().min(1, 'المدة يجب أن تكون دقيقة واحدة على الأقل').nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

const updateServiceSchema = z.object({
  nameAr: z.string().min(2, 'اسم الخدمة يجب أن يكون حرفين على الأقل').optional(),
  nameEn: z.string().nullable().optional(),
  description: z.string().nullable().optional(),
  price: z.number().min(0, 'السعر لا يمكن أن يكون بالسالب').nullable().optional(),
  currency: z.string().optional(),
  isAvailable: z.boolean().optional(),
  durationMinutes: z.number().min(1, 'المدة يجب أن تكون دقيقة واحدة على الأقل').nullable().optional(),
  categoryId: z.string().nullable().optional(),
});

export function createBusinessRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const businessService = new BusinessService(prismaClient);
  const verificationService = new BusinessVerificationService(prismaClient);
  const claimService = new BranchClaimService(prismaClient);
  const teamService = new BusinessTeamService(prismaClient);
  const catalogService = new CatalogService(prismaClient);
  const notificationDispatcher = new NotificationDispatcher(prismaClient);

  // Rate limiter for invitations (10 attempts / hour / business)
  const inviteRateLimiter = createRateLimiter({
    windowMs: 60 * 60 * 1000,
    maxRequests: 10,
  });

  // GET /v1/businesses/invitations/preview — Public preview of invitation details
  router.get('/invitations/preview', async (c) => {
    c.header('Cache-Control', 'no-store, no-cache, must-revalidate, private');
    const token = c.req.query('token');

    if (!token) {
      return c.json(ApiResponse.error('رمز الدعوة مطلوب', 'INVALID_OR_EXPIRED_INVITATION'), 400);
    }

    try {
      const preview = await teamService.getPublicInvitationPreview(token);
      return c.json(ApiResponse.success(preview));
    } catch (err: any) {
      return c.json(
        ApiResponse.error('دعوة غير صالحة أو منتهية الصلاحية', 'INVALID_OR_EXPIRED_INVITATION'),
        400
      );
    }
  });

  // POST /v1/businesses/invitations/accept — Accept invitation for authenticated user
  router.post('/invitations/accept', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const token = body.token;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    try {
      const result = await teamService.acceptInvitation(userId, token, ip);
      return c.json(ApiResponse.success(result));
    } catch (err: any) {
      if (err.message === 'INVITATION_EMAIL_MISMATCH') {
        return c.json(
          ApiResponse.error('البريد الإلكتروني لا يطابق البريد الإلكتروني في الدعوة', 'INVITATION_EMAIL_MISMATCH'),
          403
        );
      }
      if (err.message === 'USER_ALREADY_BUSINESS_MEMBER') {
        return c.json(
          ApiResponse.error('أنت عضو بالفعل في هذا النشاط التجاري', 'USER_ALREADY_BUSINESS_MEMBER'),
          409
        );
      }
      return c.json(
        ApiResponse.error('دعوة غير صالحة أو منتهية الصلاحية', 'INVALID_OR_EXPIRED_INVITATION'),
        400
      );
    }
  });

  // POST /v1/businesses/invitations/decline — Decline invitation for authenticated user
  router.post('/invitations/decline', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const body = await c.req.json().catch(() => ({}));
    const token = body.token;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    try {
      const result = await teamService.declineInvitation(userId, token, ip);
      return c.json(ApiResponse.success(result));
    } catch (err: any) {
      if (err.message === 'INVITATION_EMAIL_MISMATCH') {
        return c.json(
          ApiResponse.error('البريد الإلكتروني لا يطابق البريد الإلكتروني في الدعوة', 'INVITATION_EMAIL_MISMATCH'),
          403
        );
      }
      return c.json(
        ApiResponse.error('دعوة غير صالحة أو منتهية الصلاحية', 'INVALID_OR_EXPIRED_INVITATION'),
        400
      );
    }
  });

  // GET /v1/businesses/my — Get businesses belonging to current authenticated user
  router.get('/my', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const businesses = await businessService.getUserBusinesses(userId);
    return c.json(ApiResponse.success(businesses, { count: businesses.length }));
  });

  // GET /v1/businesses — Alias for list user's businesses
  router.get('/', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const businesses = await businessService.getUserBusinesses(userId);
    return c.json(ApiResponse.success(businesses, { count: businesses.length }));
  });

  // GET /v1/businesses/public/:idOrSlug — Get public profile for a business
  router.get('/public/:idOrSlug', async (c) => {
    const idOrSlug = c.req.param('idOrSlug');
    const business = await businessService.getPublicBusinessProfile(idOrSlug);

    if (!business) {
      return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
    }

    return c.json(ApiResponse.success(business));
  });

  // GET /v1/businesses/public/:idOrSlug/catalog — Get public catalog (products & services)
  router.get('/public/:idOrSlug/catalog', async (c) => {
    const idOrSlug = c.req.param('idOrSlug');
    try {
      const catalog = await catalogService.getPublicCatalog(idOrSlug);
      return c.json(ApiResponse.success(catalog));
    } catch (err: any) {
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('فشل في جلب الكتالوج', 'CATALOG_FETCH_FAILED'), 500);
    }
  });

  // GET /v1/businesses/:id/claims — List claims for a business
  router.get('/:id/claims', requirePermission(PERMISSIONS.BUSINESS_CLAIMS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const claims = await claimService.listClaims(
        userId,
        businessId,
        actor?.type === 'ADMIN'
      );
      return c.json(ApiResponse.success(claims, { count: claims.length }));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(
          ApiResponse.error('غير مصرح لك بالاطلاع على طلبات الربط لهذا النشاط التجاري', 'FORBIDDEN'),
          403
        );
      }
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(
          ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'),
          404
        );
      }
      return c.json(ApiResponse.error('فشل جلب قائمة طلبات الربط', 'CLAIMS_FETCH_FAILED'), 500);
    }
  });

  // POST /v1/businesses/:id/claims — Submit a new branch claim
  router.post(
    '/:id/claims',
    protectedRateLimiter,
    requirePermission(PERMISSIONS.BUSINESS_CLAIMS_MANAGE),
    zValidator('json', submitClaimSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات طلب الادعاء غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const claim = await claimService.submitClaim(
          userId,
          businessId,
          body,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(claim), 201);
      } catch (err: any) {
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(
            ApiResponse.error('غير مصرح لك بتقديم طلب ربط فرع لهذا النشاط التجاري', 'FORBIDDEN'),
            403
          );
        }
        if (err.message === 'BUSINESS_VERIFICATION_REQUIRED') {
          return c.json(
            ApiResponse.error('النشاط التجاري يجب أن يكون توثيقه قيد المراجعة أو موثقاً لتقديم طلبات الربط', 'BUSINESS_NOT_VERIFIED'),
            400
          );
        }
        if (err.message === 'PLACE_NOT_FOUND') {
          return c.json(
            ApiResponse.error('الموقع غير موجود', 'PLACE_NOT_FOUND'),
            404
          );
        }
        if (err.message === 'PLACE_ALREADY_LINKED') {
          return c.json(
            ApiResponse.error('هذا الموقع مرتبط بالفعل بهذا النشاط التجاري', 'ALREADY_LINKED'),
            409
          );
        }
        if (err.message === 'PLACE_LINKED_TO_OTHER_BUSINESS') {
          return c.json(
            ApiResponse.error('هذا الموقع مرتبط بنشاط تجاري آخر', 'ALREADY_LINKED_TO_OTHER_BUSINESS'),
            409
          );
        }
        if (err.message === 'DUPLICATE_ACTIVE_CLAIM') {
          return c.json(
            ApiResponse.error('يوجد طلب ربط نشط بالفعل لهذا الموقع والنشاط التجاري', 'DUPLICATE_CLAIM'),
            409
          );
        }
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(
            ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'),
            404
          );
        }
        return c.json(ApiResponse.error('فشل تقديم طلب الربط', 'CLAIM_SUBMIT_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/businesses/:id/claims/:claimId — Cancel an active branch claim
  router.delete(
    '/:id/claims/:claimId',
    requirePermission(PERMISSIONS.BUSINESS_CLAIMS_MANAGE),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const claimId = c.req.param('claimId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      try {
        const cancelledClaim = await claimService.cancelClaim(
          userId,
          businessId,
          claimId,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(cancelledClaim));
      } catch (err: any) {
        if (
          err.message === 'NOT_BUSINESS_MEMBER' ||
          err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' ||
          err.message === 'CANCELLER_MUST_BE_CLAIMANT'
        ) {
          return c.json(
            ApiResponse.error('ليس لديك صلاحية إلغاء هذا الطلب', 'FORBIDDEN'),
            403
          );
        }
        if (err.message === 'CLAIM_NOT_FOUND') {
          return c.json(
            ApiResponse.error('طلب الربط غير موجود', 'CLAIM_NOT_FOUND'),
            404
          );
        }
        if (err.message === 'CANNOT_CANCEL_TERMINAL_CLAIM') {
          return c.json(
            ApiResponse.error('لا يمكن إلغاء طلب ربط في حالة نهائية', 'CANNOT_CANCEL_TERMINAL_CLAIM'),
            400
          );
        }
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(
            ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'),
            404
          );
        }
        return c.json(ApiResponse.error('فشل إلغاء طلب الربط', 'CLAIM_CANCEL_FAILED'), 500);
      }
    }
  );

  // GET /v1/businesses/:id/verification — Get current verification status for a business
  router.get('/:id/verification', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const verification = await verificationService.getVerificationStatus(
        userId,
        businessId,
        actor?.type === 'ADMIN'
      );
      return c.json(ApiResponse.success(verification));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على حالة توثيق هذا النشاط', 'FORBIDDEN'), 403);
      }
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('فشل في جلب حالة التوثيق', 'VERIFICATION_FETCH_FAILED'), 500);
    }
  });

  // POST /v1/businesses/:id/verification — Submit verification request
  router.post(
    '/:id/verification',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', submitVerificationSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات طلب التوثيق غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const verification = await verificationService.submitVerificationRequest(
          userId,
          businessId,
          body || undefined,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(verification), 200);
      } catch (err: any) {
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'OWNER_ONLY_VERIFICATION_SUBMISSION') {
          return c.json(
            ApiResponse.error('فقط مالك النشاط التجاري يمكنه تقديم طلب التوثيق', 'FORBIDDEN'),
            403
          );
        }
        if (err.message === 'DUPLICATE_VERIFICATION_REQUEST') {
          return c.json(
            ApiResponse.error('يوجد طلب توثيق قيد المراجعة بالفعل لهذا النشاط', 'DUPLICATE_REQUEST'),
            400
          );
        }
        if (err.message === 'ALREADY_VERIFIED') {
          return c.json(
            ApiResponse.error('هذا النشاط التجاري موثّق بالفعل', 'ALREADY_VERIFIED'),
            400
          );
        }
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(
            ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'),
            404
          );
        }
        return c.json(ApiResponse.error('فشل تقديم طلب التوثيق', 'VERIFICATION_SUBMIT_FAILED'), 500);
      }
    }
  );

  // GET /v1/businesses/:id — Get details of a business
  router.get('/:id', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    // Check membership
    const membership = await businessService.getMembership(userId, businessId);
    if (!membership && actor?.type !== 'ADMIN') {
      return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على هذا النشاط', 'FORBIDDEN'), 403);
    }

    const business = await businessService.getBusinessById(businessId);
    if (!business) {
      return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
    }

    return c.json(ApiResponse.success({
      ...business,
      membershipRole: membership?.role || 'MEMBER',
    }));
  });

  // POST /v1/businesses — Create a new business
  router.post(
    '/',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', createBusinessSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات إنشاء النشاط غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const business = await businessService.createBusiness(userId, body);
        return c.json(ApiResponse.success(business), 201);
      } catch (err: any) {
        console.error('Error creating business:', err);
        if (err.message === 'INVALID_BUSINESS_NAME') {
          return c.json(ApiResponse.error('اسم النشاط تجاري غير صالح', 'INVALID_INPUT'), 400);
        }
        return c.json(ApiResponse.error('فشل في إنشاء النشاط التجاري', 'BUSINESS_CREATE_FAILED'), 500);
      }
    }
  );

  // PATCH /v1/businesses/:id — Update business details (IDOR Protected)
  router.patch(
    '/:id',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateBusinessSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات التحديث غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await businessService.updateBusiness(userId, businessId, body);
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(
            ApiResponse.error('ليس لديك صلاحية تعديل هذا النشاط التجاري', 'FORBIDDEN'),
            403
          );
        }
        return c.json(ApiResponse.error('فشل تحديث النشاط التجاري', 'BUSINESS_UPDATE_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/businesses/:id/branches/:placeId — Unlink a branch from a business
  router.delete(
    '/:id/branches/:placeId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const placeId = c.req.param('placeId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      try {
        const unlinkedPlace = await businessService.unlinkBranch(
          userId,
          businessId,
          placeId,
          actor?.type === 'ADMIN'
        );

        // Post-commit structured security audit logging
        await AuditLogger.logBranchLinkRemoved(
          businessId,
          placeId,
          userId,
          actor?.type === 'ADMIN' ? 'ADMIN' : 'USER'
        );

        return c.json(ApiResponse.success(unlinkedPlace));
      } catch (err: any) {
        if (
          err.message === 'NOT_BUSINESS_MEMBER' ||
          err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS'
        ) {
          return c.json(
            ApiResponse.error('ليس لديك صلاحية فك ربط هذا الفرع', 'FORBIDDEN'),
            403
          );
        }
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

  // GET /v1/businesses/:id/invitations — List pending invitations
  router.get('/:id/invitations', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const invitations = await teamService.listPendingInvitations(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(invitations, { count: invitations.length }));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على دعوات هذا النشاط', 'FORBIDDEN'), 403);
      }
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('فشل في جلب الدعوات المعلقة', 'INVITATIONS_FETCH_FAILED'), 500);
    }
  });

  // GET /v1/businesses/:id/members — List business members
  router.get('/:id/members', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const members = await teamService.listMembers(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(members, { count: members.length }));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على أعضاء الفريق', 'FORBIDDEN'), 403);
      }
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('فشل في جلب أعضاء الفريق', 'MEMBERS_FETCH_FAILED'), 500);
    }
  });

  // POST /v1/businesses/:id/members/invite — Invite a new member
  router.post(
    '/:id/members/invite',
    inviteRateLimiter,
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', inviteMemberSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات الدعوة غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      try {
        const result = await teamService.inviteMember(
          userId,
          businessId,
          body,
          actor?.type === 'ADMIN',
          ip
        );

        if (body.email) {
          const invitedUser = await prismaClient.user.findUnique({
            where: { email: body.email.trim().toLowerCase() },
          });
          if (invitedUser) {
            const inv = (result as any)?.invitation;
            await notificationDispatcher.dispatchBusinessMemberInvited({
              userId: invitedUser.id,
              businessId,
              businessName: inv?.business?.name || 'النشاط التجاري',
              role: body.role || 'MEMBER',
              inviterName: inv?.inviter?.name || 'إدارة النشاط',
            });
          }
        }

        return c.json(ApiResponse.success(result), 201);
      } catch (err: any) {
        if (err.message === 'INVALID_INVITATION_ROLE' || err.message === 'INVALID_EMAIL') {
          return c.json(ApiResponse.error('دور الدعوة أو البريد الإلكتروني غير صالح', 'INVALID_INVITATION_ROLE'), 400);
        }
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية لإرسال هذه الدعوة', 'FORBIDDEN'), 403);
        }
        if (err.message === 'USER_ALREADY_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('المستخدم عضو بالفعل في النشاط التجاري', 'USER_ALREADY_BUSINESS_MEMBER'), 409);
        }
        if (err.message === 'DUPLICATE_ACTIVE_INVITATION') {
          return c.json(ApiResponse.error('توجد دعوة نشطة بالفعل لهذا البريد الإلكتروني', 'DUPLICATE_ACTIVE_INVITATION'), 409);
        }
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل إرسال الدعوة', 'INVITE_FAILED'), 500);
      }
    }
  );

  // PATCH /v1/businesses/:id/members/:memberId — Update member role
  router.patch(
    '/:id/members/:memberId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateMemberRoleSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات الدور غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const memberId = c.req.param('memberId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      try {
        const updated = await teamService.changeMemberRole(
          userId,
          businessId,
          memberId,
          body.role,
          actor?.type === 'ADMIN',
          ip
        );
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'CANNOT_REMOVE_SOLE_OWNER') {
          return c.json(
            ApiResponse.error('لا يمكن تغيير دور المالك الوحيد للنشاط التجاري', 'CANNOT_REMOVE_SOLE_OWNER'),
            400
          );
        }
        if (err.message === 'INVALID_ROLE') {
          return c.json(ApiResponse.error('الدور المحدد غير صالح', 'INVALID_ROLE'), 400);
        }
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تغيير الأدوار', 'FORBIDDEN'), 403);
        }
        if (err.message === 'MEMBER_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('العضو غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل تعديل دور العضو', 'ROLE_CHANGE_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/businesses/:id/members/:memberId — Remove a team member
  router.delete(
    '/:id/members/:memberId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const memberId = c.req.param('memberId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      try {
        const removed = await teamService.removeMember(
          userId,
          businessId,
          memberId,
          actor?.type === 'ADMIN',
          ip
        );
        return c.json(ApiResponse.success(removed));
      } catch (err: any) {
        if (err.message === 'CANNOT_REMOVE_SOLE_OWNER') {
          return c.json(
            ApiResponse.error('لا يمكن إزالة المالك الوحيد للنشاط التجاري', 'CANNOT_REMOVE_SOLE_OWNER'),
            400
          );
        }
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية إزالة هذا العضو', 'FORBIDDEN'), 403);
        }
        if (err.message === 'MEMBER_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('العضو غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل إزالة العضو', 'MEMBER_REMOVE_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/businesses/:id/invitations/:invId — Cancel pending invitation
  router.delete(
    '/:id/invitations/:invId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const invitationId = c.req.param('invId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      try {
        const cancelled = await teamService.cancelInvitation(
          userId,
          businessId,
          invitationId,
          actor?.type === 'ADMIN',
          ip
        );
        return c.json(ApiResponse.success(cancelled));
      } catch (err: any) {
        if (err.message === 'CANNOT_CANCEL_TERMINAL_INVITATION') {
          return c.json(ApiResponse.error('لا يمكن إلغاء دعوة منتهية الصلاحية أو مقبولة', 'CANNOT_CANCEL_TERMINAL_INVITATION'), 400);
        }
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية إلغاء هذه الدعوة', 'FORBIDDEN'), 403);
        }
        if (err.message === 'INVITATION_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('الدعوة غير موجودة', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل إلغاء الدعوة', 'INVITATION_CANCEL_FAILED'), 500);
      }
    }
  );

  // ---------------- CATALOG, PRODUCTS & SERVICES (PHASE 5) ----------------

  // GET /v1/businesses/:id/catalog — Get full catalog for merchant members
  router.get('/:id/catalog', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const catalog = await catalogService.getMerchantCatalog(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(catalog));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على الكتالوج', 'FORBIDDEN'), 403);
      }
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('فشل في جلب الكتالوج', 'CATALOG_FETCH_FAILED'), 500);
    }
  });

  // POST /v1/businesses/:id/products — Create product
  router.post(
    '/:id/products',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', createProductSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات المنتج غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const product = await catalogService.createProduct(userId, businessId, body, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(product), 201);
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية إضافة منتجات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'INVALID_PRODUCT_NAME' || err.message === 'INVALID_PRODUCT_PRICE') {
          return c.json(ApiResponse.error('اسم المنتج أو السعر غير صالح', 'INVALID_INPUT'), 400);
        }
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في إضافة المنتج', 'PRODUCT_CREATE_FAILED'), 500);
      }
    }
  );

  // PATCH /v1/businesses/:id/products/:productId — Update product
  router.patch(
    '/:id/products/:productId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateProductSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات التحديث غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const productId = c.req.param('productId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await catalogService.updateProduct(userId, businessId, productId, body, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تعديل المنتجات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'PRODUCT_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('المنتج غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تحديث المنتج', 'PRODUCT_UPDATE_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/businesses/:id/products/:productId — Delete product
  router.delete(
    '/:id/products/:productId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const productId = c.req.param('productId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      try {
        const deleted = await catalogService.deleteProduct(userId, businessId, productId, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(deleted));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية حذف المنتجات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'PRODUCT_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('المنتج غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في حذف المنتج', 'PRODUCT_DELETE_FAILED'), 500);
      }
    }
  );

  // POST /v1/businesses/:id/services — Create service
  router.post(
    '/:id/services',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', createServiceSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات الخدمة غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const service = await catalogService.createService(userId, businessId, body, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(service), 201);
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية إضافة خدمات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'INVALID_SERVICE_NAME' || err.message === 'INVALID_SERVICE_PRICE') {
          return c.json(ApiResponse.error('اسم الخدمة أو السعر غير صالح', 'INVALID_INPUT'), 400);
        }
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في إضافة الخدمة', 'SERVICE_CREATE_FAILED'), 500);
      }
    }
  );

  // PATCH /v1/businesses/:id/services/:serviceId — Update service
  router.patch(
    '/:id/services/:serviceId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateServiceSchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('بيانات التحديث غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const serviceId = c.req.param('serviceId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await catalogService.updateService(userId, businessId, serviceId, body, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تعديل الخدمات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'SERVICE_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('الخدمة غير موجودة', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تحديث الخدمة', 'SERVICE_UPDATE_FAILED'), 500);
      }
    }
  );

  // DELETE /v1/businesses/:id/services/:serviceId — Delete service
  router.delete(
    '/:id/services/:serviceId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const serviceId = c.req.param('serviceId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      try {
        const deleted = await catalogService.deleteService(userId, businessId, serviceId, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(deleted));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية حذف الخدمات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'SERVICE_NOT_FOUND' || err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('الخدمة غير موجودة', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في حذف الخدمة', 'SERVICE_DELETE_FAILED'), 500);
      }
    }
  );

  return router;
}

export const businessRouter = createBusinessRouter(defaultPrisma);

