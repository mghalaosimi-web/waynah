import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma as defaultPrisma, type PrismaClient, BusinessStatus } from '@waynah/database';
import { z, PERMISSIONS } from '@waynah/shared';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { BusinessService } from '../../domain/business/business.service.js';
import { BusinessVerificationService } from '../../domain/business/business-verification.service.js';
import { ApiResponse } from '../../utils/api-response.js';

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

export function createBusinessRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const businessService = new BusinessService(prismaClient);
  const verificationService = new BusinessVerificationService(prismaClient);

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

  return router;
}

export const businessRouter = createBusinessRouter(defaultPrisma);
