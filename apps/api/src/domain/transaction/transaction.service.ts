import type { PrismaClient } from '@waynah/database';

export interface CreateInquiryInput {
  productId?: string | null;
  serviceId?: string | null;
  subject: string;
  message: string;
}

export interface CreateRequestInput {
  businessId?: string | null;
  placeId?: string | null;
  serviceId?: string | null;
  productId?: string | null;
  title: string;
  description: string;
}

export interface CreateRFQInput {
  title: string;
  description: string;
  budget?: number | null;
  currency?: string;
  expiresAt?: Date | string | null;
}

export interface CreateQuoteInput {
  amount: number;
  currency?: string;
  notes?: string | null;
}

export interface CreateBookingInput {
  serviceId?: string | null;
  scheduledAt: Date | string;
  durationMinutes?: number | null;
  notes?: string | null;
}

export interface CreateOrderItemInput {
  productId?: string | null;
  serviceId?: string | null;
  title: string;
  quantity: number;
  unitPrice: number;
}

export interface CreateOrderInput {
  items: CreateOrderItemInput[];
  notes?: string | null;
  currency?: string;
}

export class TransactionService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Helper: Check membership and permissions for business operations
   */
  private async checkBusinessMembership(userId: string, businessId: string, isAdmin = false) {
    if (isAdmin) {
      return { role: 'ADMIN' };
    }

    const membership = await this.prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
    });

    if (!membership) {
      throw new Error('NOT_BUSINESS_MEMBER');
    }

    return membership;
  }

  private ensureCanManageTransactions(membership: { role: string }) {
    if (membership.role !== 'OWNER' && membership.role !== 'MANAGER' && membership.role !== 'ADMIN') {
      throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
    }
  }

  // ---------------- 1. INQUIRIES ----------------

  async createInquiry(userId: string, businessId: string, input: CreateInquiryInput) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (!input.subject || input.subject.trim().length < 2) {
      throw new Error('INVALID_INQUIRY_SUBJECT');
    }

    if (!input.message || input.message.trim().length < 2) {
      throw new Error('INVALID_INQUIRY_MESSAGE');
    }

    return this.prisma.inquiry.create({
      data: {
        businessId,
        userId,
        productId: input.productId || null,
        serviceId: input.serviceId || null,
        subject: input.subject.trim(),
        message: input.message.trim(),
        status: 'PENDING',
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        product: true,
        service: true,
      },
    });
  }

  async replyInquiry(userId: string, businessId: string, inquiryId: string, reply: string, isAdmin = false) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageTransactions(membership);

    const inquiry = await this.prisma.inquiry.findUnique({ where: { id: inquiryId } });
    if (!inquiry || inquiry.businessId !== businessId) {
      throw new Error('INQUIRY_NOT_FOUND');
    }

    if (!reply || reply.trim().length < 2) {
      throw new Error('INVALID_REPLY');
    }

    return this.prisma.inquiry.update({
      where: { id: inquiryId },
      data: {
        reply: reply.trim(),
        status: 'ANSWERED',
      },
    });
  }

  async listBusinessInquiries(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.inquiry.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        product: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listUserInquiries(userId: string) {
    return this.prisma.inquiry.findMany({
      where: { userId },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        product: true,
        service: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------- 2. SERVICE REQUESTS ----------------

  async createRequest(userId: string, input: CreateRequestInput) {
    if (!input.title || input.title.trim().length < 2) {
      throw new Error('INVALID_REQUEST_TITLE');
    }

    if (!input.description || input.description.trim().length < 2) {
      throw new Error('INVALID_REQUEST_DESCRIPTION');
    }

    return this.prisma.serviceRequest.create({
      data: {
        userId,
        businessId: input.businessId || null,
        placeId: input.placeId || null,
        serviceId: input.serviceId || null,
        productId: input.productId || null,
        title: input.title.trim(),
        description: input.description.trim(),
        status: 'PENDING',
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        service: true,
        product: true,
      },
    });
  }

  async updateRequestStatus(
    userId: string,
    businessId: string,
    requestId: string,
    status: 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'CANCELLED',
    notes?: string,
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageTransactions(membership);

    const req = await this.prisma.serviceRequest.findUnique({ where: { id: requestId } });
    if (!req || req.businessId !== businessId) {
      throw new Error('REQUEST_NOT_FOUND');
    }

    return this.prisma.serviceRequest.update({
      where: { id: requestId },
      data: {
        status,
        ...(notes !== undefined && { notes: notes.trim() }),
      },
    });
  }

  async listBusinessRequests(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.serviceRequest.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listUserRequests(userId: string) {
    return this.prisma.serviceRequest.findMany({
      where: { userId },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        service: true,
        product: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------- 3. RFQs & QUOTES ----------------

  async createRFQ(userId: string, businessId: string, input: CreateRFQInput) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (!input.title || input.title.trim().length < 2) {
      throw new Error('INVALID_RFQ_TITLE');
    }

    if (!input.description || input.description.trim().length < 2) {
      throw new Error('INVALID_RFQ_DESCRIPTION');
    }

    return this.prisma.rFQ.create({
      data: {
        businessId,
        userId,
        title: input.title.trim(),
        description: input.description.trim(),
        budget: input.budget ?? null,
        currency: input.currency || 'YER',
        expiresAt: input.expiresAt ? new Date(input.expiresAt) : null,
        status: 'OPEN',
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        quotes: true,
      },
    });
  }

  async createQuote(userId: string, businessId: string, rfqId: string, input: CreateQuoteInput, isAdmin = false) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageTransactions(membership);

    const rfq = await this.prisma.rFQ.findUnique({ where: { id: rfqId } });
    if (!rfq || rfq.businessId !== businessId) {
      throw new Error('RFQ_NOT_FOUND');
    }

    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new Error('INVALID_QUOTE_AMOUNT');
    }

    return this.prisma.$transaction(async (tx) => {
      const quote = await tx.quote.create({
        data: {
          rfqId,
          businessId,
          amount: input.amount,
          currency: input.currency || 'YER',
          notes: input.notes?.trim() || null,
          status: 'PENDING',
        },
      });

      await tx.rFQ.update({
        where: { id: rfqId },
        data: { status: 'QUOTED' },
      });

      return quote;
    });
  }

  async listBusinessRFQs(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.rFQ.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        quotes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listUserRFQs(userId: string) {
    return this.prisma.rFQ.findMany({
      where: { userId },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        quotes: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------- 4. BOOKINGS ----------------

  async createBooking(userId: string, businessId: string, input: CreateBookingInput) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    if (!input.scheduledAt) {
      throw new Error('INVALID_SCHEDULED_TIME');
    }

    const scheduledDate = new Date(input.scheduledAt);
    if (isNaN(scheduledDate.getTime())) {
      throw new Error('INVALID_SCHEDULED_TIME');
    }

    return this.prisma.booking.create({
      data: {
        businessId,
        userId,
        serviceId: input.serviceId || null,
        scheduledAt: scheduledDate,
        durationMinutes: input.durationMinutes || null,
        notes: input.notes?.trim() || null,
        status: 'PENDING',
      },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        service: true,
      },
    });
  }

  async updateBookingStatus(
    userId: string,
    businessId: string,
    bookingId: string,
    status: 'PENDING' | 'CONFIRMED' | 'CANCELLED' | 'COMPLETED',
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageTransactions(membership);

    const booking = await this.prisma.booking.findUnique({ where: { id: bookingId } });
    if (!booking || booking.businessId !== businessId) {
      throw new Error('BOOKING_NOT_FOUND');
    }

    return this.prisma.booking.update({
      where: { id: bookingId },
      data: { status },
      include: { service: true },
    });
  }

  async listBusinessBookings(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.booking.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        service: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async listUserBookings(userId: string) {
    return this.prisma.booking.findMany({
      where: { userId },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        service: true,
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  // ---------------- 5. ORDERS & SINGLE-MERCHANT INVARIANT ----------------

  async createOrder(userId: string, businessId: string, input: CreateOrderInput) {
    return this.prisma.$transaction(async (tx) => {
      const biz = await tx.business.findUnique({ where: { id: businessId } });
      if (!biz) {
        throw new Error('BUSINESS_NOT_FOUND');
      }

      if (!input.items || !Array.isArray(input.items) || input.items.length === 0) {
        throw new Error('EMPTY_ORDER_ITEMS');
      }

      let calculatedTotal = 0;
      const itemsToCreate = [];

      for (const item of input.items) {
        if (!item.title || item.title.trim().length < 1) {
          throw new Error('INVALID_ORDER_ITEM_TITLE');
        }
        if (typeof item.quantity !== 'number' || item.quantity <= 0) {
          throw new Error('INVALID_ORDER_ITEM_QUANTITY');
        }
        if (typeof item.unitPrice !== 'number' || item.unitPrice < 0) {
          throw new Error('INVALID_ORDER_ITEM_PRICE');
        }

        // Verify product or service belongs strictly to target Business (IDOR & Single-Merchant rule)
        if (item.productId) {
          const product = await tx.product.findUnique({ where: { id: item.productId } });
          if (!product || product.businessId !== businessId) {
            throw new Error('PRODUCT_NOT_BELONG_TO_BUSINESS');
          }
        }

        if (item.serviceId) {
          const service = await tx.serviceItem.findUnique({ where: { id: item.serviceId } });
          if (!service || service.businessId !== businessId) {
            throw new Error('SERVICE_NOT_BELONG_TO_BUSINESS');
          }
        }

        const itemTotal = item.quantity * item.unitPrice;
        calculatedTotal += itemTotal;

        itemsToCreate.push({
          productId: item.productId || null,
          serviceId: item.serviceId || null,
          title: item.title.trim(),
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          totalPrice: itemTotal,
        });
      }

      const orderNumber = `ORD-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

      return tx.order.create({
        data: {
          orderNumber,
          businessId, // Mandatory Single-merchant Invariant
          userId,
          totalAmount: calculatedTotal,
          currency: input.currency || 'YER',
          status: 'PENDING',
          notes: input.notes?.trim() || null,
          items: {
            create: itemsToCreate,
          },
        },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          items: true,
        },
      });
    });
  }

  async updateOrderStatus(
    userId: string,
    businessId: string,
    orderId: string,
    status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED',
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageTransactions(membership);

    const order = await this.prisma.order.findUnique({ where: { id: orderId } });
    if (!order || order.businessId !== businessId) {
      throw new Error('ORDER_NOT_FOUND');
    }

    return this.prisma.order.update({
      where: { id: orderId },
      data: { status },
      include: { items: true },
    });
  }

  async listBusinessOrders(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.order.findMany({
      where: { businessId },
      include: {
        user: { select: { id: true, name: true, email: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async listUserOrders(userId: string) {
    return this.prisma.order.findMany({
      where: { userId },
      include: {
        business: { select: { id: true, name: true, slug: true } },
        items: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}
