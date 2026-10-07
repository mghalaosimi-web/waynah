import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { z, PERMISSIONS } from '@waynah/shared';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { ApiResponse } from '../../utils/api-response.js';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { TransactionService } from '../../domain/transaction/transaction.service.js';

const createInquirySchema = z.object({
  productId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  subject: z.string().min(2, 'الموضوع يجب أن يكون حرفين على الأقل'),
  message: z.string().min(2, 'الرسالة يجب أن تكون حرفين على الأقل'),
});

const replyInquirySchema = z.object({
  reply: z.string().min(2, 'الرد يجب أن يكون حرفين على الأقل'),
});

const createRequestSchema = z.object({
  businessId: z.string().nullable().optional(),
  placeId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  productId: z.string().nullable().optional(),
  title: z.string().min(2, 'عنوان الطلب يجب أن يكون حرفين على الأقل'),
  description: z.string().min(2, 'وصف الطلب يجب أن يكون حرفين على الأقل'),
});

const updateRequestStatusSchema = z.object({
  status: z.enum(['PENDING', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  notes: z.string().optional(),
});

const createRFQSchema = z.object({
  title: z.string().min(2, 'عنوان طلب التسعير يجب أن يكون حرفين على الأقل'),
  description: z.string().min(2, 'تفاصيل طلب التسعير يجب أن تكون حرفين على الأقل'),
  budget: z.number().min(0, 'الميزانية لا يمكن أن تكون بالسالب').nullable().optional(),
  currency: z.string().optional(),
  expiresAt: z.string().nullable().optional(),
});

const createQuoteSchema = z.object({
  amount: z.number().gt(0, 'المبلغ يجب أن يكون أكبر من صفر'),
  currency: z.string().optional(),
  notes: z.string().nullable().optional(),
});

const createBookingSchema = z.object({
  serviceId: z.string().nullable().optional(),
  scheduledAt: z.string().min(1, 'وقت الحجز مطلوب'),
  durationMinutes: z.number().min(1).nullable().optional(),
  notes: z.string().nullable().optional(),
});

const updateBookingStatusSchema = z.object({
  status: z.enum(['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED']),
});

const createOrderItemSchema = z.object({
  productId: z.string().nullable().optional(),
  serviceId: z.string().nullable().optional(),
  title: z.string().min(1, 'اسم العنصر مطلوب'),
  quantity: z.number().min(1, 'الكمية يجب أن تكون 1 على الأقل'),
  unitPrice: z.number().min(0, 'سعر الوحدة لا يمكن أن يكون بالسالب'),
});

const createOrderSchema = z.object({
  items: z.array(createOrderItemSchema).min(1, 'يجب تقديم عنصر واحد على الأقل في الطلب'),
  notes: z.string().nullable().optional(),
  currency: z.string().optional(),
});

const updateOrderStatusSchema = z.object({
  status: z.enum(['PENDING', 'PROCESSING', 'COMPLETED', 'CANCELLED']),
});

export function createTransactionRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const txService = new TransactionService(prismaClient);

  // ---------------- INQUIRIES ----------------

  // POST /v1/transactions/businesses/:id/inquiries — Create inquiry
  router.post(
    '/businesses/:id/inquiries',
    zValidator('json', createInquirySchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات الاستفسار غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
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
        const inquiry = await txService.createInquiry(userId, businessId, body);
        return c.json(ApiResponse.success(inquiry), 201);
      } catch (err: any) {
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تقديم الاستفسار', 'INQUIRY_CREATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/businesses/:id/inquiries — List business inquiries (Merchant)
  router.get('/businesses/:id/inquiries', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const inquiries = await txService.listBusinessInquiries(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(inquiries));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على الاستفسارات', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('فشل في جلب الاستفسارات', 'INQUIRIES_FETCH_FAILED'), 500);
    }
  });

  // POST /v1/transactions/businesses/:id/inquiries/:inquiryId/reply — Merchant reply
  router.post(
    '/businesses/:id/inquiries/:inquiryId/reply',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', replyInquirySchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('الرد غير صالح', 'INVALID_INPUT', result.error.errors), 400);
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const inquiryId = c.req.param('inquiryId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await txService.replyInquiry(userId, businessId, inquiryId, body.reply, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية الرد على الاستفسارات', 'FORBIDDEN'), 403);
        }
        if (err.message === 'INQUIRY_NOT_FOUND') {
          return c.json(ApiResponse.error('الاستفسار غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في الرد على الاستفسار', 'REPLY_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/my/inquiries — User list own inquiries
  router.get('/my/inquiries', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const inquiries = await txService.listUserInquiries(userId);
    return c.json(ApiResponse.success(inquiries));
  });

  // ---------------- 2. SERVICE REQUESTS ----------------

  // POST /v1/transactions/requests — Submit service request
  router.post(
    '/requests',
    zValidator('json', createRequestSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات الطلب غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
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
        const req = await txService.createRequest(userId, body);
        return c.json(ApiResponse.success(req), 201);
      } catch (err: any) {
        return c.json(ApiResponse.error('فشل في تقديم الطلب', 'REQUEST_CREATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/businesses/:id/requests — Merchant list requests
  router.get('/businesses/:id/requests', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const requests = await txService.listBusinessRequests(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(requests));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على الطلبات', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('فشل في جلب الطلبات', 'REQUESTS_FETCH_FAILED'), 500);
    }
  });

  // PATCH /v1/transactions/businesses/:id/requests/:requestId — Update request status
  router.patch(
    '/businesses/:id/requests/:requestId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateRequestStatusSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات التحديث غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const requestId = c.req.param('requestId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await txService.updateRequestStatus(
          userId,
          businessId,
          requestId,
          body.status,
          body.notes,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تحديث حالة الطلب', 'FORBIDDEN'), 403);
        }
        if (err.message === 'REQUEST_NOT_FOUND') {
          return c.json(ApiResponse.error('الطلب غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تحديث الطلب', 'REQUEST_UPDATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/my/requests — User list own requests
  router.get('/my/requests', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const requests = await txService.listUserRequests(userId);
    return c.json(ApiResponse.success(requests));
  });

  // ---------------- 3. RFQs & QUOTES ----------------

  // POST /v1/transactions/businesses/:id/rfqs — Customer create RFQ
  router.post(
    '/businesses/:id/rfqs',
    zValidator('json', createRFQSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات طلب التسعير غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
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
        const rfq = await txService.createRFQ(userId, businessId, body);
        return c.json(ApiResponse.success(rfq), 201);
      } catch (err: any) {
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تقديم طلب التسعير', 'RFQ_CREATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/businesses/:id/rfqs — Merchant list RFQs
  router.get('/businesses/:id/rfqs', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const rfqs = await txService.listBusinessRFQs(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(rfqs));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على طلبات التسعير', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('فشل في جلب طلبات التسعير', 'RFQS_FETCH_FAILED'), 500);
    }
  });

  // POST /v1/transactions/businesses/:id/rfqs/:rfqId/quotes — Merchant submit quote
  router.post(
    '/businesses/:id/rfqs/:rfqId/quotes',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', createQuoteSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات العرض غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const rfqId = c.req.param('rfqId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const quote = await txService.createQuote(userId, businessId, rfqId, body, actor?.type === 'ADMIN');
        return c.json(ApiResponse.success(quote), 201);
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تقديم العروض', 'FORBIDDEN'), 403);
        }
        if (err.message === 'RFQ_NOT_FOUND') {
          return c.json(ApiResponse.error('طلب التسعير غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تقديم عرض السعر', 'QUOTE_CREATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/my/rfqs — User list own RFQs
  router.get('/my/rfqs', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const rfqs = await txService.listUserRFQs(userId);
    return c.json(ApiResponse.success(rfqs));
  });

  // ---------------- 4. BOOKINGS ----------------

  // POST /v1/transactions/businesses/:id/bookings — Customer create booking
  router.post(
    '/businesses/:id/bookings',
    zValidator('json', createBookingSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات الحجز غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
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
        const booking = await txService.createBooking(userId, businessId, body);
        return c.json(ApiResponse.success(booking), 201);
      } catch (err: any) {
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        if (err.message === 'INVALID_SCHEDULED_TIME') {
          return c.json(ApiResponse.error('تاريخ أو وقت الحجز غير صالح', 'INVALID_INPUT'), 400);
        }
        return c.json(ApiResponse.error('فشل في إنشاء الحجز', 'BOOKING_CREATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/businesses/:id/bookings — Merchant list bookings
  router.get('/businesses/:id/bookings', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const bookings = await txService.listBusinessBookings(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(bookings));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على الحجوزات', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('فشل في جلب الحجوزات', 'BOOKINGS_FETCH_FAILED'), 500);
    }
  });

  // PATCH /v1/transactions/businesses/:id/bookings/:bookingId — Merchant update booking status
  router.patch(
    '/businesses/:id/bookings/:bookingId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateBookingStatusSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات التحديث غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const bookingId = c.req.param('bookingId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await txService.updateBookingStatus(
          userId,
          businessId,
          bookingId,
          body.status,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تحديث الحجز', 'FORBIDDEN'), 403);
        }
        if (err.message === 'BOOKING_NOT_FOUND') {
          return c.json(ApiResponse.error('الحجز غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تحديث الحجز', 'BOOKING_UPDATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/my/bookings — User list own bookings
  router.get('/my/bookings', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const bookings = await txService.listUserBookings(userId);
    return c.json(ApiResponse.success(bookings));
  });

  // ---------------- 5. ORDERS & SINGLE-MERCHANT INVARIANT ----------------

  // POST /v1/transactions/businesses/:id/orders — Customer create single-merchant order
  router.post(
    '/businesses/:id/orders',
    zValidator('json', createOrderSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات الطلب المالي غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
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
        const order = await txService.createOrder(userId, businessId, body);
        return c.json(ApiResponse.success(order), 201);
      } catch (err: any) {
        if (err.message === 'BUSINESS_NOT_FOUND') {
          return c.json(ApiResponse.error('النشاط التجاري غير موجود', 'BUSINESS_NOT_FOUND'), 404);
        }
        if (err.message === 'PRODUCT_NOT_BELONG_TO_BUSINESS' || err.message === 'SERVICE_NOT_BELONG_TO_BUSINESS') {
          return c.json(ApiResponse.error('عنصر الطلب لا ينتمي لنفس النشاط التجاري (قاعدة التاجر الموحد)', 'SINGLE_MERCHANT_VIOLATION'), 400);
        }
        if (err.message === 'EMPTY_ORDER_ITEMS' || err.message === 'INVALID_ORDER_ITEM_TITLE' || err.message === 'INVALID_ORDER_ITEM_QUANTITY' || err.message === 'INVALID_ORDER_ITEM_PRICE') {
          return c.json(ApiResponse.error('بيانات عناصر الطلب غير صالحة', 'INVALID_INPUT'), 400);
        }
        return c.json(ApiResponse.error('فشل في إنشاء الطلب المالي', 'ORDER_CREATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/businesses/:id/orders — Merchant list orders
  router.get('/businesses/:id/orders', requirePermission(PERMISSIONS.BUSINESS_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
    const businessId = c.req.param('id');

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    try {
      const orders = await txService.listBusinessOrders(userId, businessId, actor?.type === 'ADMIN');
      return c.json(ApiResponse.success(orders));
    } catch (err: any) {
      if (err.message === 'NOT_BUSINESS_MEMBER') {
        return c.json(ApiResponse.error('غير مصرح لك بالاطلاع على الطلبات المالية', 'FORBIDDEN'), 403);
      }
      return c.json(ApiResponse.error('فشل في جلب الطلبات المالية', 'ORDERS_FETCH_FAILED'), 500);
    }
  });

  // PATCH /v1/transactions/businesses/:id/orders/:orderId — Merchant update order status
  router.patch(
    '/businesses/:id/orders/:orderId',
    requirePermission(PERMISSIONS.BUSINESS_MANAGE),
    zValidator('json', updateOrderStatusSchema, (result, c) => {
      if (!result.success) {
        return c.json(ApiResponse.error('بيانات التحديث غير صالحة', 'INVALID_INPUT', result.error.errors), 400);
      }
      return undefined;
    }),
    async (c) => {
      const user = c.get('user');
      const actor = c.get('actor');
      const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);
      const businessId = c.req.param('id');
      const orderId = c.req.param('orderId');

      if (!userId) {
        return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
      }

      const body = c.req.valid('json');

      try {
        const updated = await txService.updateOrderStatus(
          userId,
          businessId,
          orderId,
          body.status,
          actor?.type === 'ADMIN'
        );
        return c.json(ApiResponse.success(updated));
      } catch (err: any) {
        if (err.message === 'INSUFFICIENT_BUSINESS_PERMISSIONS' || err.message === 'NOT_BUSINESS_MEMBER') {
          return c.json(ApiResponse.error('ليس لديك صلاحية تحديث حالة الطلب المالي', 'FORBIDDEN'), 403);
        }
        if (err.message === 'ORDER_NOT_FOUND') {
          return c.json(ApiResponse.error('الطلب المالي غير موجود', 'NOT_FOUND'), 404);
        }
        return c.json(ApiResponse.error('فشل في تحديث حالة الطلب المالي', 'ORDER_UPDATE_FAILED'), 500);
      }
    }
  );

  // GET /v1/transactions/my/orders — User list own orders
  router.get('/my/orders', async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const orders = await txService.listUserOrders(userId);
    return c.json(ApiResponse.success(orders));
  });

  return router;
}

export const transactionRouter = createTransactionRouter(defaultPrisma);
