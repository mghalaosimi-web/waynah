import { randomInt } from 'node:crypto';
import type { PrismaClient } from '@waynah/database';

export interface CreateFulfillmentInput {
  orderId?: string | null;
  bookingId?: string | null;
  mode?: 'CUSTOMER_PICKUP' | 'MERCHANT_FULFILLMENT' | 'THIRD_PARTY_DELIVERY' | 'FIELD_FULFILLMENT' | 'ON_SITE' | 'REMOTE';
  notes?: string | null;
}

export interface AddDeliveryInput {
  carrierName?: string | null;
  carrierPhone?: string | null;
  trackingNumber?: string | null;
  proofPhotoUrl?: string | null;
}

export interface CreatePaymentRecordInput {
  orderId?: string | null;
  bookingId?: string | null;
  amount: number;
  currency?: string;
  method?: 'CASH_ON_DELIVERY' | 'WALLET_TRANSFER' | 'BANK_TRANSFER' | 'CARD' | 'DIRECT_MERCHANT';
  referenceNumber?: string | null;
  notes?: string | null;
}

export class FulfillmentService {
  constructor(private prisma: PrismaClient) {}

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

  private ensureCanManage(membership: { role: string }) {
    if (membership.role !== 'OWNER' && membership.role !== 'MANAGER' && membership.role !== 'ADMIN') {
      throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
    }
  }

  // ---------------- 1. FULFILLMENT MANAGEMENT ----------------

  async createFulfillment(userId: string, businessId: string, input: CreateFulfillmentInput, isAdmin = false) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManage(membership);

    if (input.orderId && input.bookingId) {
      throw new Error('BOTH_ORDER_AND_BOOKING_NOT_ALLOWED');
    }

    if (!input.orderId && !input.bookingId) {
      throw new Error('ORDER_OR_BOOKING_REQUIRED');
    }

    if (input.orderId) {
      const order = await this.prisma.order.findUnique({ where: { id: input.orderId } });
      if (!order || order.businessId !== businessId) {
        throw new Error('ORDER_NOT_FOUND');
      }
    }

    if (input.bookingId) {
      const booking = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
      if (!booking || booking.businessId !== businessId) {
        throw new Error('BOOKING_NOT_FOUND');
      }
    }

    // Generate cryptographically secure 6-digit OTP code for proof of delivery verification
    const otpCode = randomInt(100000, 1000000).toString();

    return this.prisma.fulfillment.create({
      data: {
        businessId,
        orderId: input.orderId || null,
        bookingId: input.bookingId || null,
        mode: input.mode || 'MERCHANT_FULFILLMENT',
        status: 'PENDING',
        otpCode,
        notes: input.notes?.trim() || null,
      },
      include: {
        order: true,
        booking: true,
        deliveries: true,
      },
    });
  }

  async updateFulfillmentStatus(
    userId: string,
    businessId: string,
    fulfillmentId: string,
    status: 'PENDING' | 'PREPARING' | 'READY' | 'IN_TRANSIT' | 'DELIVERED' | 'FULFILLED' | 'CANCELLED',
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManage(membership);

    const fulfillment = await this.prisma.fulfillment.findUnique({ where: { id: fulfillmentId } });
    if (!fulfillment || fulfillment.businessId !== businessId) {
      throw new Error('FULFILLMENT_NOT_FOUND');
    }

    if (fulfillment.status === 'FULFILLED' || fulfillment.status === 'CANCELLED') {
      throw new Error('FULFILLMENT_TERMINATED');
    }

    const currentStatus = fulfillment.status;
    const allowedNextStates: Record<string, string[]> = {
      PENDING: ['PREPARING', 'READY', 'IN_TRANSIT', 'CANCELLED'],
      PREPARING: ['READY', 'IN_TRANSIT', 'CANCELLED'],
      READY: ['IN_TRANSIT', 'DELIVERED', 'FULFILLED', 'CANCELLED'],
      IN_TRANSIT: ['DELIVERED', 'FULFILLED', 'CANCELLED'],
      DELIVERED: ['FULFILLED', 'CANCELLED'],
    };

    if (status !== currentStatus && (!allowedNextStates[currentStatus] || !allowedNextStates[currentStatus].includes(status))) {
      throw new Error('INVALID_FULFILLMENT_TRANSITION');
    }

    const fulfilledAt = status === 'FULFILLED' ? new Date() : fulfillment.fulfilledAt;

    return this.prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: {
        status,
        fulfilledAt,
        ...(status === 'FULFILLED' ? { otpCode: null } : {}),
      },
      include: {
        deliveries: true,
        order: true,
        booking: true,
      },
    });
  }

  async verifyProofOfDelivery(
    userId: string,
    businessId: string,
    fulfillmentId: string,
    otpCode: string,
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManage(membership);

    const fulfillment = await this.prisma.fulfillment.findUnique({ where: { id: fulfillmentId } });
    if (!fulfillment || fulfillment.businessId !== businessId) {
      throw new Error('FULFILLMENT_NOT_FOUND');
    }

    if (fulfillment.status === 'FULFILLED') {
      throw new Error('FULFILLMENT_ALREADY_COMPLETED');
    }

    if (fulfillment.status === 'CANCELLED') {
      throw new Error('FULFILLMENT_TERMINATED');
    }

    if (!fulfillment.otpCode || !otpCode || fulfillment.otpCode !== otpCode.trim()) {
      throw new Error('INVALID_PROOF_OTP');
    }

    return this.prisma.fulfillment.update({
      where: { id: fulfillmentId },
      data: {
        status: 'FULFILLED',
        fulfilledAt: new Date(),
        otpCode: null,
      },
      include: {
        deliveries: true,
        order: true,
        booking: true,
      },
    });
  }

  async addDeliveryTracking(
    userId: string,
    businessId: string,
    fulfillmentId: string,
    input: AddDeliveryInput,
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManage(membership);

    const fulfillment = await this.prisma.fulfillment.findUnique({ where: { id: fulfillmentId } });
    if (!fulfillment || fulfillment.businessId !== businessId) {
      throw new Error('FULFILLMENT_NOT_FOUND');
    }

    if (fulfillment.status === 'FULFILLED' || fulfillment.status === 'CANCELLED') {
      throw new Error('FULFILLMENT_TERMINATED');
    }

    return this.prisma.delivery.create({
      data: {
        fulfillmentId,
        carrierName: input.carrierName?.trim() || null,
        carrierPhone: input.carrierPhone?.trim() || null,
        trackingNumber: input.trackingNumber?.trim() || null,
        proofPhotoUrl: input.proofPhotoUrl?.trim() || null,
        status: 'ASSIGNED',
      },
    });
  }

  async getBusinessFulfillments(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.fulfillment.findMany({
      where: { businessId },
      include: {
        order: { select: { id: true, orderNumber: true, totalAmount: true, userId: true } },
        booking: { select: { id: true, scheduledAt: true, userId: true } },
        deliveries: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  // ---------------- 2. PAYMENT BOUNDARY MANAGEMENT ----------------

  async createPaymentRecord(userId: string, businessId: string, input: CreatePaymentRecordInput, isAdmin = false) {
    if (input.orderId && input.bookingId) {
      throw new Error('BOTH_ORDER_AND_BOOKING_NOT_ALLOWED');
    }

    if (!isAdmin) {
      const isMember = await this.prisma.businessMember.findUnique({
        where: { businessId_userId: { businessId, userId } },
      });
      if (!isMember) {
        if (input.orderId) {
          const ord = await this.prisma.order.findUnique({ where: { id: input.orderId } });
          if (!ord || ord.businessId !== businessId) throw new Error('ORDER_NOT_FOUND');
          if (ord.userId !== userId) throw new Error('NOT_ORDER_OWNER');
        } else if (input.bookingId) {
          const bkg = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
          if (!bkg || bkg.businessId !== businessId) throw new Error('BOOKING_NOT_FOUND');
          if (bkg.userId !== userId) throw new Error('NOT_BOOKING_OWNER');
        } else {
          throw new Error('ORDER_OR_BOOKING_REQUIRED');
        }
      } else {
        if (input.orderId) {
          const ord = await this.prisma.order.findUnique({ where: { id: input.orderId } });
          if (!ord || ord.businessId !== businessId) throw new Error('ORDER_NOT_FOUND');
        } else if (input.bookingId) {
          const bkg = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
          if (!bkg || bkg.businessId !== businessId) throw new Error('BOOKING_NOT_FOUND');
        } else {
          throw new Error('ORDER_OR_BOOKING_REQUIRED');
        }
      }
    } else {
      if (input.orderId) {
        const ord = await this.prisma.order.findUnique({ where: { id: input.orderId } });
        if (!ord || ord.businessId !== businessId) throw new Error('ORDER_NOT_FOUND');
      } else if (input.bookingId) {
        const bkg = await this.prisma.booking.findUnique({ where: { id: input.bookingId } });
        if (!bkg || bkg.businessId !== businessId) throw new Error('BOOKING_NOT_FOUND');
      } else {
        throw new Error('ORDER_OR_BOOKING_REQUIRED');
      }
    }

    if (typeof input.amount !== 'number' || input.amount <= 0) {
      throw new Error('INVALID_PAYMENT_AMOUNT');
    }

    return this.prisma.paymentRecord.create({
      data: {
        businessId,
        orderId: input.orderId || null,
        bookingId: input.bookingId || null,
        amount: input.amount,
        currency: input.currency || 'YER',
        method: input.method || 'CASH_ON_DELIVERY',
        status: input.method === 'CASH_ON_DELIVERY' ? 'UNPAID' : 'PENDING_VERIFICATION',
        referenceNumber: input.referenceNumber?.trim() || null,
        notes: input.notes?.trim() || null,
      },
      include: {
        order: true,
        booking: true,
      },
    });
  }

  async updatePaymentStatus(
    userId: string,
    businessId: string,
    paymentRecordId: string,
    status: 'UNPAID' | 'PENDING_VERIFICATION' | 'PAID' | 'PAYMENT_FAILED' | 'PARTIALLY_REFUNDED' | 'REFUNDED',
    isAdmin = false
  ) {
    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManage(membership);

    const record = await this.prisma.paymentRecord.findUnique({ where: { id: paymentRecordId } });
    if (!record || record.businessId !== businessId) {
      throw new Error('PAYMENT_RECORD_NOT_FOUND');
    }

    if (record.status === 'REFUNDED') {
      throw new Error('PAYMENT_RECORD_TERMINATED');
    }

    const currentPaymentStatus = record.status;
    const allowedPaymentNextStates: Record<string, string[]> = {
      UNPAID: ['PENDING_VERIFICATION', 'PAID', 'PAYMENT_FAILED', 'REFUNDED'],
      PENDING_VERIFICATION: ['PAID', 'PAYMENT_FAILED', 'REFUNDED'],
      PAID: ['PARTIALLY_REFUNDED', 'REFUNDED'],
      PAYMENT_FAILED: ['UNPAID', 'PENDING_VERIFICATION', 'REFUNDED'],
      PARTIALLY_REFUNDED: ['REFUNDED'],
    };

    if (
      status !== currentPaymentStatus &&
      (!allowedPaymentNextStates[currentPaymentStatus] || !allowedPaymentNextStates[currentPaymentStatus].includes(status))
    ) {
      throw new Error('INVALID_PAYMENT_STATUS_TRANSITION');
    }

    const verifiedAt = status === 'PAID' ? new Date() : record.verifiedAt;

    return this.prisma.paymentRecord.update({
      where: { id: paymentRecordId },
      data: {
        status,
        verifiedAt,
      },
      include: {
        order: true,
        booking: true,
      },
    });
  }

  async getBusinessPaymentRecords(userId: string, businessId: string, isAdmin = false) {
    await this.checkBusinessMembership(userId, businessId, isAdmin);
    return this.prisma.paymentRecord.findMany({
      where: { businessId },
      include: {
        order: { select: { id: true, orderNumber: true, totalAmount: true, userId: true } },
        booking: { select: { id: true, scheduledAt: true, userId: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }
}

