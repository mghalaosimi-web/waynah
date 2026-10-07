import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient, type ReviewStatus } from '@waynah/database';
import { ApiResponse } from '../../utils/api-response.js';
import { ReviewService } from '../../domain/trust/review.service.js';

const createReviewSchema = z.object({
  businessId: z.string().min(1, 'معرف المنشأة مطلوب'),
  rating: z.number().int().min(1).max(5),
  comment: z.string().nullable().optional(),
  placeId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  orderId: z.string().nullable().optional(),
  bookingId: z.string().nullable().optional(),
});

const updateReviewSchema = z.object({
  rating: z.number().int().min(1).max(5).optional(),
  comment: z.string().nullable().optional(),
});

const moderateReviewSchema = z.object({
  status: z.enum(['PUBLISHED', 'FLAGGED', 'HIDDEN']),
});

export function createReviewRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const reviewService = new ReviewService(prismaClient);

  /**
   * POST /v1/reviews
   * Creates a user review (Authentication required).
   */
  router.post('/', zValidator('json', createReviewSchema), async (c) => {
    try {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      const review = await reviewService.createReview(userId, body);
      return c.json(ApiResponse.success(review), 201);
    } catch (err: any) {
      if (err.message === 'INVALID_RATING') {
        return c.json(ApiResponse.error('التقييم يجب أن يكون عدداً صحيحاً بين 1 و 5', 'INVALID_RATING'), 400);
      }
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('المنشأة غير موجودة', 'BUSINESS_NOT_FOUND'), 404);
      }
      if (err.message === 'DUPLICATE_ORDER_REVIEW' || err.message === 'DUPLICATE_BOOKING_REVIEW') {
        return c.json(ApiResponse.error('تم إرسال تقييم سابق لهذه العملية بالفعل', 'DUPLICATE_REVIEW'), 409);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء إضافة التقييم', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * GET /v1/reviews
   * Lists reviews with aggregate rating summary (Public).
   */
  router.get('/', async (c) => {
    try {
      const businessId = c.req.query('businessId');
      const placeId = c.req.query('placeId');
      const productId = c.req.query('productId');
      const serviceId = c.req.query('serviceId');
      const status = c.req.query('status');
      const page = c.req.query('page');
      const limit = c.req.query('limit');

      const result = await reviewService.listReviews({
        businessId,
        placeId,
        productId,
        serviceId,
        status: status as ReviewStatus,
        page: page ? Number(page) : undefined,
        limit: limit ? Number(limit) : undefined,
      });

      return c.json(ApiResponse.success(result), 200);
    } catch (err: any) {
      return c.json(ApiResponse.error('حدث خطأ أثناء جلب المراجعات', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * PUT /v1/reviews/:id
   * Updates review content/rating (Auth required: review owner).
   */
  router.put('/:id', zValidator('json', updateReviewSchema), async (c) => {
    try {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const id = c.req.param('id');
      const body = c.req.valid('json');

      const updated = await reviewService.updateReview(userId, id, body);
      return c.json(ApiResponse.success(updated), 200);
    } catch (err: any) {
      if (err.message === 'REVIEW_NOT_FOUND') {
        return c.json(ApiResponse.error('المراجعة غير موجودة', 'REVIEW_NOT_FOUND'), 404);
      }
      if (err.message === 'FORBIDDEN_NOT_REVIEW_OWNER') {
        return c.json(ApiResponse.error('غير مصرح بتعديل هذه المراجعة', 'FORBIDDEN'), 403);
      }
      if (err.message === 'INVALID_RATING') {
        return c.json(ApiResponse.error('التقييم يجب أن يكون بين 1 و 5', 'INVALID_RATING'), 400);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء تحديث المراجعة', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * DELETE /v1/reviews/:id
   * Deletes a review (Auth required: review owner or admin).
   */
  router.delete('/:id', async (c) => {
    try {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const isAdmin = actor?.type === 'ADMIN' || user?.role === 'ADMIN';
      const id = c.req.param('id');

      const result = await reviewService.deleteReview(userId, id, isAdmin);
      return c.json(ApiResponse.success(result), 200);
    } catch (err: any) {
      if (err.message === 'REVIEW_NOT_FOUND') {
        return c.json(ApiResponse.error('المراجعة غير موجودة', 'REVIEW_NOT_FOUND'), 404);
      }
      if (err.message === 'FORBIDDEN_NOT_REVIEW_OWNER') {
        return c.json(ApiResponse.error('غير مصرح بحذف هذه المراجعة', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء حذف المراجعة', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * POST /v1/reviews/admin/:id/moderate
   * Moderates review status (Admin only).
   */
  router.post('/admin/:id/moderate', zValidator('json', moderateReviewSchema), async (c) => {
    try {
      const actor = c.get('actor');
      const user = c.get('user');
      const isAdmin = actor?.type === 'ADMIN' || user?.role === 'ADMIN';
      if (!isAdmin) {
        return c.json(ApiResponse.error('غير مصرح للمستخدم العادي بإجراء الإشراف', 'FORBIDDEN'), 403);
      }

      const id = c.req.param('id');
      const { status } = c.req.valid('json');

      const moderated = await reviewService.moderateReview(id, status as ReviewStatus);
      return c.json(ApiResponse.success(moderated), 200);
    } catch (err: any) {
      if (err.message === 'REVIEW_NOT_FOUND') {
        return c.json(ApiResponse.error('المراجعة غير موجودة', 'REVIEW_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء الإشراف على المراجعة', 'INTERNAL_ERROR'), 500);
    }
  });

  return router;
}
