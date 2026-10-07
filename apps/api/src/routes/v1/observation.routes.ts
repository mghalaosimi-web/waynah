import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z } from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { ApiResponse } from '../../utils/api-response.js';
import { ObservationPipelineService } from '../../domain/trust/observation-pipeline.service.js';

const submitObservationSchema = z.object({
  placeId: z.string().nullable().optional(),
  dataSourceId: z.string().min(1, 'مصدر البيانات مطلوب'),
  name: z.string().nullable().optional(),
  phone: z.string().nullable().optional(),
  categoryId: z.string().nullable().optional(),
  latitude: z.number().nullable().optional(),
  longitude: z.number().nullable().optional(),
});

const moderateObservationSchema = z.object({
  status: z.enum(['APPROVED', 'REJECTED', 'AUTO_APPROVED']),
});

export function createObservationRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const observationService = new ObservationPipelineService(prismaClient);

  /**
   * POST /v1/observations
   * Submits a new place/field observation.
   */
  router.post('/', zValidator('json', submitObservationSchema), async (c) => {
    try {
      const body = c.req.valid('json');
      const observation = await observationService.submitObservation(body);
      return c.json(ApiResponse.success(observation), 201);
    } catch (err: any) {
      if (err.message === 'DATA_SOURCE_NOT_FOUND') {
        return c.json(ApiResponse.error('مصدر البيانات غير موجود', 'DATA_SOURCE_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء تسجيل الرصد الميداني', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * GET /v1/observations
   * Lists observations.
   */
  router.get('/', async (c) => {
    try {
      const placeId = c.req.query('placeId');
      const status = c.req.query('status');

      const observations = await observationService.listObservations({
        placeId,
        status,
      });

      return c.json(ApiResponse.success(observations), 200);
    } catch (err: any) {
      return c.json(ApiResponse.error('حدث خطأ أثناء جلب قائمة الرصد', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * POST /v1/observations/admin/:id/status
   * Moderates observation status (Admin only).
   */
  router.post('/admin/:id/status', zValidator('json', moderateObservationSchema), async (c) => {
    try {
      const actor = c.get('actor');
      const user = c.get('user');
      const isAdmin = actor?.type === 'ADMIN' || user?.role === 'ADMIN';
      if (!isAdmin) {
        return c.json(ApiResponse.error('غير مصرح للمستخدم العادي بإجراء الإشراف', 'FORBIDDEN'), 403);
      }

      const id = c.req.param('id');
      const { status } = c.req.valid('json');

      const moderated = await observationService.moderateObservation(id, status as any);
      return c.json(ApiResponse.success(moderated), 200);
    } catch (err: any) {
      if (err.message === 'OBSERVATION_NOT_FOUND') {
        return c.json(ApiResponse.error('سجل الرصد غير موجود', 'OBSERVATION_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء التعديل على حالة الرصد', 'INTERNAL_ERROR'), 500);
    }
  });

  return router;
}
