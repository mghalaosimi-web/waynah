import { Hono } from 'hono';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { ApiResponse } from '../../utils/api-response.js';
import { TrustCalculationService } from '../../domain/trust/trust-calculation.service.js';
import { VerificationLogService } from '../../domain/trust/verification-log.service.js';

export function createTrustRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const trustService = new TrustCalculationService(prismaClient);
  const verificationLogService = new VerificationLogService(prismaClient);

  /**
   * GET /v1/trust/businesses/:id
   * Retrieves business trust score calculation & detailed breakdown.
   */
  router.get('/businesses/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const breakdown = await trustService.calculateBusinessTrust(id);
      return c.json(ApiResponse.success(breakdown), 200);
    } catch (err: any) {
      if (err.message === 'BUSINESS_NOT_FOUND') {
        return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء احتساب مؤشر الثقة', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * GET /v1/trust/businesses/:id/verification/history
   * Retrieves business verification historical event logs (GAP-DB-02).
   */
  router.get('/businesses/:id/verification/history', async (c) => {
    try {
      const id = c.req.param('id');
      const history = await verificationLogService.getHistoryByBusinessId(id);
      return c.json(ApiResponse.success(history), 200);
    } catch (err: any) {
      return c.json(ApiResponse.error('حدث خطأ أثناء جلب سجل التوثيق التاريخي', 'INTERNAL_ERROR'), 500);
    }
  });

  /**
   * GET /v1/trust/places/:id
   * Retrieves place trust score calculation & detailed breakdown.
   */
  router.get('/places/:id', async (c) => {
    try {
      const id = c.req.param('id');
      const breakdown = await trustService.calculatePlaceTrust(id);
      return c.json(ApiResponse.success(breakdown), 200);
    } catch (err: any) {
      if (err.message === 'PLACE_NOT_FOUND') {
        return c.json(ApiResponse.error('المكان غير موجود', 'PLACE_NOT_FOUND'), 404);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء احتساب مؤشر ثقة المكان', 'INTERNAL_ERROR'), 500);
    }
  });

  return router;
}
