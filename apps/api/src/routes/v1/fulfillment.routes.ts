import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z, PERMISSIONS } from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { ApiResponse } from '../../utils/api-response.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { FulfillmentService } from '../../domain/fulfillment/fulfillment.service.js';

const createFulfillmentSchema = z.object({
  orderId: z.string().nullable().optional(),
  bookingId: z.string().nullable().optional(),
  mode: z.enum(['CUSTOMER_PICKUP', 'MERCHANT_FULFILLMENT', 'THIRD_PARTY_DELIVERY', 'FIELD_FULFILLMENT', 'ON_SITE', 'REMOTE']).optional(),
  notes: z.string().nullable().optional(),
});

const updateFulfillmentStatusSchema = z.object({
  status: z.enum(['PENDING', 'PREPARING', 'READY', 'IN_TRANSIT', 'DELIVERED', 'FULFILLED', 'CANCELLED']),
});

const verifyProofSchema = z.object({
  otpCode: z.string().min(1, 'رمز إثبات الاكتمال مطلوب'),
});

const addDeliverySchema = z.object({
  carrierName: z.string().nullable().optional(),
  carrierPhone: z.string().nullable().optional(),
  trackingNumber: z.string().nullable().optional(),
  proofPhotoUrl: z.string().nullable().optional(),
});

const createPaymentSchema = z.object({
  orderId: z.string().nullable().optional(),
  bookingId: z.string().nullable().optional(),
  amount: z.number().gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.string().optional(),
  method: z.enum(['CASH_ON_DELIVERY', 'WALLET_TRANSFER', 'BANK_TRANSFER', 'CARD', 'DIRECT_MERCHANT']).optional(),
  referenceNumber: z.string().nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updatePaymentStatusSchema = z.object({
  status: z.enum(['UNPAID', 'PENDING_VERIFICATION', 'PAID', 'PAYMENT_FAILED', 'PARTIALLY_REFUNDED', 'REFUNDED']),
});

export function createFulfillmentRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const service = new FulfillmentService(prismaClient);

  // 1. FULFILLMENTS

  router.post(
    '/fulfillments/business/:businessId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', createFulfillmentSchema),
    async (c) => {
      try {
        const user = c.get('user');
        const actor = c.get('actor');
        const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
        if (!userId) {
          return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
        }

        const businessId = c.req.param('businessId');
        const body = c.req.valid('json');

        const fulfillment = await service.createFulfillment(userId, businessId, body, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(fulfillment), 201);
      } catch (err: any) {
        if (err.message === 'BOTH_ORDER_AND_BOOKING_NOT_ALLOWED') {
          return c.json(ApiResponse.error('لا يمكن ربط الوفاء بطلب وحجز في نفس الوقت', 'INVALID_INPUT'), 400);
        }
        if (err.message === 'ORDER_OR_BOOKING_REQUIRED') {
          return c.json(ApiResponse.error('يجب ربط إجراء الوفاء بطلب أو حجز مالي', 'ORDER_OR_BOOKING_REQUIRED'), 400);
        }
        if (err.message === 'ORDER_NOT_FOUND' || err.message === 'BOOKING_NOT_FOUND') {
          return c.json(ApiResponse.error('الطلب أو الحجز غير موجود أو لا يتبع هذا النشاط', 'RESOURCE_NOT_FOUND'), 404);
        }
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(ApiResponse.error('غير مصرح بإدارة عمليات الوفاء لهذه المنشأة', 'FORBIDDEN'), 403);
        }
        return c.json(ApiResponse.error('حدث خطأ أثناء إنشاء إجراء الوفاء', 'INTERNAL_ERROR'), 500);
      }
    }
  );

  router.patch(
    '/fulfillments/business/:businessId/:id/status',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateFulfillmentStatusSchema),
    async (c) => {
      try {
        const user = c.get('user');
        const actor = c.get('actor');
        const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
        if (!userId) {
          return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
        }

        const businessId = c.req.param('businessId');
        const fulfillmentId = c.req.param('id');
        const { status } = c.req.valid('json');

        const fulfillment = await service.updateFulfillmentStatus(
          userId,
          businessId,
          fulfillmentId,
          status,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(fulfillment), 200);
      } catch (err: any) {
        if (err.message === 'FULFILLMENT_NOT_FOUND') {
          return c.json(ApiResponse.error('إجراء الوفاء غير موجود', 'FULFILLMENT_NOT_FOUND'), 404);
        }
        if (err.message === 'FULFILLMENT_TERMINATED') {
          return c.json(ApiResponse.error('لا يمكن تعديل إجراء وفاء مغلق أو ملغى', 'FULFILLMENT_TERMINATED'), 400);
        }
        if (err.message === 'INVALID_FULFILLMENT_TRANSITION') {
          return c.json(ApiResponse.error('انتقال غير صالح في مسار الوفاء', 'INVALID_FULFILLMENT_TRANSITION'), 400);
        }
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(ApiResponse.error('غير مصرح لتحديث حالة الوفاء', 'FORBIDDEN'), 403);
        }
        return c.json(ApiResponse.error('حدث خطأ أثناء تحديث حالة الوفاء', 'INTERNAL_ERROR'), 500);
      }
    }
  );

  router.post(
    '/fulfillments/business/:businessId/:id/proof',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', verifyProofSchema),
    async (c) => {
      try {
        const user = c.get('user');
        const actor = c.get('actor');
        const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
        if (!userId) {
          return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
        }

        const businessId = c.req.param('businessId');
        const fulfillmentId = c.req.param('id');
        const { otpCode } = c.req.valid('json');

        const fulfillment = await service.verifyProofOfDelivery(
          userId,
          businessId,
          fulfillmentId,
          otpCode,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(fulfillment), 200);
      } catch (err: any) {
        if (err.message === 'INVALID_PROOF_OTP') {
          return c.json(ApiResponse.error('رمز إثبات الاستلام غير صحيح', 'INVALID_PROOF_OTP'), 400);
        }
        if (err.message === 'FULFILLMENT_ALREADY_COMPLETED') {
          return c.json(ApiResponse.error('تم تأكيد إثبات الاستلام ومكتمل مسبقاً', 'FULFILLMENT_ALREADY_COMPLETED'), 400);
        }
        if (err.message === 'FULFILLMENT_TERMINATED') {
          return c.json(ApiResponse.error('لا يمكن التحقق من إجراء وفاء ملغى', 'FULFILLMENT_TERMINATED'), 400);
        }
        if (err.message === 'FULFILLMENT_NOT_FOUND') {
          return c.json(ApiResponse.error('إجراء الوفاء غير موجود', 'FULFILLMENT_NOT_FOUND'), 404);
        }
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(ApiResponse.error('غير مصرح بالتحقق من إثبات الاستلام', 'FORBIDDEN'), 403);
        }
        return c.json(ApiResponse.error('حدث خطأ أثناء فحص رمز إثبات الاستلام', 'INTERNAL_ERROR'), 500);
      }
    }
  );

  router.post(
    '/fulfillments/business/:businessId/:id/deliveries',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', addDeliverySchema),
    async (c) => {
      try {
        const user = c.get('user');
        const actor = c.get('actor');
        const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
        if (!userId) {
          return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
        }

        const businessId = c.req.param('businessId');
        const fulfillmentId = c.req.param('id');
        const body = c.req.valid('json');

        const delivery = await service.addDeliveryTracking(
          userId,
          businessId,
          fulfillmentId,
          body,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(delivery), 201);
      } catch (err: any) {
        if (err.message === 'FULFILLMENT_NOT_FOUND') {
          return c.json(ApiResponse.error('إجراء الوفاء غير موجود', 'FULFILLMENT_NOT_FOUND'), 404);
        }
        if (err.message === 'FULFILLMENT_TERMINATED') {
          return c.json(ApiResponse.error('لا يمكن إضافة شحنة لإجراء وفاء مغلق أو ملغى', 'FULFILLMENT_TERMINATED'), 400);
        }
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(ApiResponse.error('غير مصرح بإضافة تتبع الشحن', 'FORBIDDEN'), 403);
        }
        return c.json(ApiResponse.error('حدث خطأ أثناء إضافة تتبع الشحن', 'INTERNAL_ERROR'), 500);
      }
    }
  );

  router.get('/fulfillments/business/:businessId', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    try {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const businessId = c.req.param('businessId');
      const list = await service.getBusinessFulfillments(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(list), 200);
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح بعرض قائمة الوفاء', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء جلب قائمة الوفاء', 'INTERNAL_ERROR'), 500);
    }
  });

  // 2. PAYMENTS BOUNDARY

  router.post('/payments/business/:businessId', zValidator('json', createPaymentSchema), async (c) => {
    try {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const businessId = c.req.param('businessId');
      const body = c.req.valid('json');

      const record = await service.createPaymentRecord(userId, businessId, body, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(record), 201);
    } catch (err: any) {
      if (err.message === 'BOTH_ORDER_AND_BOOKING_NOT_ALLOWED') {
        return c.json(ApiResponse.error('لا يمكن ربط المعاملة المالية بطلب وحجز في نفس الوقت', 'INVALID_INPUT'), 400);
      }
      if (err.message === 'ORDER_NOT_FOUND' || err.message === 'BOOKING_NOT_FOUND') {
        return c.json(ApiResponse.error('الطلب أو الحجز غير موجود أو لا يتبع هذا النشاط', 'RESOURCE_NOT_FOUND'), 404);
      }
      if (err.message === 'NOT_ORDER_OWNER' || err.message === 'NOT_BOOKING_OWNER') {
        return c.json(ApiResponse.error('غير مصرح بإنشاء سجل دفع لهذا الطلب أو الحجز', 'FORBIDDEN'), 403);
      }
      if (err.message === 'INVALID_PAYMENT_AMOUNT') {
        return c.json(ApiResponse.error('مبلغ العملية المالية غير صحيح', 'INVALID_PAYMENT_AMOUNT'), 400);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء تسجيل العملية المالية', 'INTERNAL_ERROR'), 500);
    }
  });

  router.patch(
    '/payments/business/:businessId/:id/status',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updatePaymentStatusSchema),
    async (c) => {
      try {
        const user = c.get('user');
        const actor = c.get('actor');
        const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
        if (!userId) {
          return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
        }

        const businessId = c.req.param('businessId');
        const paymentRecordId = c.req.param('id');
        const { status } = c.req.valid('json');

        const record = await service.updatePaymentStatus(
          userId,
          businessId,
          paymentRecordId,
          status,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(record), 200);
      } catch (err: any) {
        if (err.message === 'PAYMENT_RECORD_NOT_FOUND') {
          return c.json(ApiResponse.error('سجل الدفع غير موجود', 'PAYMENT_RECORD_NOT_FOUND'), 404);
        }
        if (err.message === 'PAYMENT_RECORD_TERMINATED') {
          return c.json(ApiResponse.error('لا يمكن تعديل سجل مالي تم استرداده بالكامل', 'PAYMENT_RECORD_TERMINATED'), 400);
        }
        if (err.message === 'INVALID_PAYMENT_STATUS_TRANSITION') {
          return c.json(ApiResponse.error('انتقال غير صالح في مسار السداد المالي', 'INVALID_PAYMENT_STATUS_TRANSITION'), 400);
        }
        if (err.message === 'NOT_BUSINESS_MEMBER' || err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS') {
          return c.json(ApiResponse.error('غير مصرح بتحديث حالة السداد', 'FORBIDDEN'), 403);
        }
        return c.json(ApiResponse.error('حدث خطأ أثناء تحديث حالة الدفع', 'INTERNAL_ERROR'), 500);
      }
    }
  );

  router.get('/payments/business/:businessId', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    try {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const businessId = c.req.param('businessId');
      const list = await service.getBusinessPaymentRecords(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(list), 200);
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح بعرض السجلات المالية', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('حدث خطأ أثناء جلب السجلات المالية', 'INTERNAL_ERROR'), 500);
    }
  });

  return router;
}
