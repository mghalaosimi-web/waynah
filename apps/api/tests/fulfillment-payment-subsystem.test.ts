import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createServer } from '../src/server.js';

function makeMockPrisma() {
  const store = {
    users: new Map<string, any>(),
    sessions: new Map<string, any>(),
    businesses: new Map<string, any>(),
    members: new Map<string, any>(),
    orders: new Map<string, any>(),
    bookings: new Map<string, any>(),
    fulfillments: new Map<string, any>(),
    deliveries: new Map<string, any>(),
    paymentRecords: new Map<string, any>(),
  };

  return {
    store,
    $queryRaw: vi.fn().mockResolvedValue([{ ok: true }]),
    user: {
      findUnique: vi.fn(async ({ where }) => {
        if (where.id) return store.users.get(where.id) || null;
        if (where.email) {
          for (const u of store.users.values()) {
            if (u.email === where.email) return u;
          }
        }
        return null;
      }),
      create: vi.fn(async ({ data }) => {
        const id = 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, role: 'USER', emailVerified: false, emailVerifiedAt: null, createdAt: new Date(), updatedAt: new Date(), ...data };
        store.users.set(id, newUser);
        return newUser;
      }),
      update: vi.fn(async ({ where, data }) => {
        const u = store.users.get(where.id);
        if (u) Object.assign(u, data);
        return u;
      }),
    },
    session: {
      create: vi.fn(async ({ data }) => {
        const id = 'ses-' + Math.random().toString(36).substring(2, 9);
        const newSession = { id, createdAt: new Date(), ...data };
        store.sessions.set(data.token, newSession);
        return newSession;
      }),
      findUnique: vi.fn(async ({ where, include }) => {
        const session = store.sessions.get(where.token);
        if (!session) return null;
        if (include?.user) {
          const u = store.users.get(session.userId);
          return { ...session, user: u };
        }
        return session;
      }),
    },
    business: {
      findUnique: vi.fn(async ({ where }) => store.businesses.get(where.id) || null),
      findFirst: vi.fn(async ({ where }) => {
        for (const b of store.businesses.values()) {
          if (where.OR) {
            const match = where.OR.some((cond: any) => cond.id === b.id || cond.slug === b.slug);
            if (match) return b;
          }
        }
        return null;
      }),
    },
    businessMember: {
      findUnique: vi.fn(async ({ where }) => {
        const key = `${where.businessId_userId.businessId}_${where.businessId_userId.userId}`;
        return store.members.get(key) || null;
      }),
    },
    order: {
      findUnique: vi.fn(async ({ where }) => store.orders.get(where.id) || null),
    },
    booking: {
      findUnique: vi.fn(async ({ where }) => store.bookings.get(where.id) || null),
    },
    fulfillment: {
      create: vi.fn(async ({ data }) => {
        const id = `ful-${Date.now()}-${Math.random()}`;
        const item = { id, deliveries: [], ...data, createdAt: new Date(), updatedAt: new Date() };
        store.fulfillments.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.fulfillments.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.fulfillments.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.fulfillments.values()).filter((f) => f.businessId === where.businessId);
      }),
    },
    delivery: {
      create: vi.fn(async ({ data }) => {
        const id = `del-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.deliveries.set(id, item);
        return item;
      }),
    },
    paymentRecord: {
      create: vi.fn(async ({ data }) => {
        const id = `pay-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.paymentRecords.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.paymentRecords.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.paymentRecords.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.paymentRecords.values()).filter((p) => p.businessId === where.businessId);
      }),
    },
  };
}

describe('WAYNAH-PHASE-7 — Fulfillment, Delivery & Payment Boundary Subsystem Tests', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let app: ReturnType<typeof createServer>;

  let ownerToken: string;
  let ownerId: string;

  let managerToken: string;
  let managerId: string;

  let outsiderToken: string;
  let outsiderId: string;

  let testBusinessId: string;
  let testOrderId: string;
  let testBookingId: string;

  let testFulfillmentId: string;
  let testOtpCode: string;
  let testPaymentId: string;

  beforeEach(() => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma as any);

    const validExpiry = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    // Setup Owner
    ownerId = 'usr-owner-001';
    ownerToken = 'token-owner-001';
    mockPrisma.store.users.set(ownerId, { id: ownerId, role: 'USER', email: 'owner@waynah.local', name: 'Owner' });
    mockPrisma.store.sessions.set(ownerToken, { id: 'ses-1', userId: ownerId, token: ownerToken, expiresAt: validExpiry });

    // Setup Manager
    managerId = 'usr-manager-001';
    managerToken = 'token-manager-001';
    mockPrisma.store.users.set(managerId, { id: managerId, role: 'USER', email: 'manager@waynah.local', name: 'Manager' });
    mockPrisma.store.sessions.set(managerToken, { id: 'ses-2', userId: managerId, token: managerToken, expiresAt: validExpiry });

    // Setup Outsider
    outsiderId = 'usr-outsider-001';
    outsiderToken = 'token-outsider-001';
    mockPrisma.store.users.set(outsiderId, { id: outsiderId, role: 'USER', email: 'outsider@waynah.local', name: 'Outsider' });
    mockPrisma.store.sessions.set(outsiderToken, { id: 'ses-3', userId: outsiderId, token: outsiderToken, expiresAt: validExpiry });

    // Setup Business
    testBusinessId = 'biz-ful-001';
    mockPrisma.store.businesses.set(testBusinessId, {
      id: testBusinessId,
      name: 'Hajjah Logistics Express',
      slug: 'hajjah-logistics',
    });

    // Setup Memberships
    mockPrisma.store.members.set(`${testBusinessId}_${ownerId}`, {
      id: 'mem-1',
      businessId: testBusinessId,
      userId: ownerId,
      role: 'OWNER',
    });

    mockPrisma.store.members.set(`${testBusinessId}_${managerId}`, {
      id: 'mem-2',
      businessId: testBusinessId,
      userId: managerId,
      role: 'MANAGER',
    });

    // Setup Order & Booking
    testOrderId = 'ord-1001';
    mockPrisma.store.orders.set(testOrderId, {
      id: testOrderId,
      orderNumber: 'ORD-99182',
      businessId: testBusinessId,
      userId: ownerId,
      totalAmount: 1500,
      currency: 'YER',
      status: 'PENDING',
    });

    testBookingId = 'bkg-2001';
    mockPrisma.store.bookings.set(testBookingId, {
      id: testBookingId,
      businessId: testBusinessId,
      userId: ownerId,
      scheduledAt: new Date(),
      status: 'PENDING',
    });
  });

  it('1. Create Fulfillment for Order generates OTP proof code and PENDING status', async () => {
    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        mode: 'MERCHANT_FULFILLMENT',
        notes: 'توصيل مباشر عبر سيارة المنشأة',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.orderId).toBe(testOrderId);
    expect(data.data.status).toBe('PENDING');
    expect(data.data.mode).toBe('MERCHANT_FULFILLMENT');
    expect(data.data.otpCode).toBeDefined();
    expect(data.data.otpCode.length).toBe(6);

    testFulfillmentId = data.data.id;
    testOtpCode = data.data.otpCode;
  });

  it('2. Outsider cannot manage business fulfillments (403 FORBIDDEN)', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        mode: 'MERCHANT_FULFILLMENT',
      }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${outsiderToken}`,
      },
      body: JSON.stringify({
        status: 'PREPARING',
      }),
    });

    expect(res.status).toBe(403);
  });

  it('3. Authorized manager can update fulfillment status to IN_TRANSIT', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
      }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        status: 'IN_TRANSIT',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('IN_TRANSIT');
  });

  it('4. Add delivery carrier tracking info to fulfillment', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
      }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        carrierName: 'مندوب حجة السريع',
        carrierPhone: '+967771234567',
        trackingNumber: 'TRK-99281',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.carrierName).toBe('مندوب حجة السريع');
    expect(data.data.trackingNumber).toBe('TRK-99281');
  });

  it('5. Verify Proof of Delivery fails with wrong OTP code (400)', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
      }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        otpCode: '000000',
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_PROOF_OTP');
  });

  it('6. Verify Proof of Delivery succeeds with correct OTP code and sets FULFILLED state', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
      }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;
    const otp = fulData.data.otpCode;

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        otpCode: otp,
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('FULFILLED');
    expect(data.data.fulfilledAt).not.toBeNull();
  });

  it('7. Create Payment Record (CASH_ON_DELIVERY / UNPAID state)', async () => {
    const res = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        amount: 1000,
        currency: 'YER',
        method: 'CASH_ON_DELIVERY',
        notes: 'تحصيل نقدي عند استلام الشحنة',
      }),
    });

    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.amount).toBe(1000);
    expect(data.data.status).toBe('UNPAID');
    expect(data.data.method).toBe('CASH_ON_DELIVERY');

    testPaymentId = data.data.id;
  });

  it('8. Confirm Payment Status transition to PAID with verifiedAt timestamp', async () => {
    const createRes = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        amount: 1000,
        method: 'CASH_ON_DELIVERY',
      }),
    });
    const payData = await createRes.json();
    const pid = payData.data.id;

    const res = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}/${pid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${managerToken}`,
      },
      body: JSON.stringify({
        status: 'PAID',
      }),
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(data.data.status).toBe('PAID');
    expect(data.data.verifiedAt).not.toBeNull();
  });

  it('9. List Business Fulfillments returns all items for merchant', async () => {
    await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
    });

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
  });

  it('10. List Business Payment Records returns all financial boundary logs', async () => {
    await app.request(`/v1/fulfillment/payments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId, amount: 500 }),
    });

    const res = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}`, {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${ownerToken}`,
      },
    });

    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.success).toBe(true);
    expect(Array.isArray(data.data)).toBe(true);
    expect(data.data.length).toBeGreaterThanOrEqual(1);
  });

  it('11. Reject creating fulfillment with both orderId and bookingId (400)', async () => {
    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        orderId: testOrderId,
        bookingId: testBookingId,
      }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_INPUT');
  });

  it('12. Reject invalid fulfillment status transition (e.g., PENDING directly to FULFILLED) (400)', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'FULFILLED' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('INVALID_FULFILLMENT_TRANSITION');
  });

  it('13. Replay protection: OTP verification fails if already FULFILLED (400)', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;
    const otp = fulData.data.otpCode;

    // First verification succeeds
    const res1 = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ otpCode: otp }),
    });
    expect(res1.status).toBe(200);

    // Second verification fails with replay error
    const res2 = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/proof`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ otpCode: otp }),
    });
    expect(res2.status).toBe(400);
    const data2 = await res2.json();
    expect(data2.error.code).toBe('FULFILLMENT_ALREADY_COMPLETED');
  });

  it('14. Reject status update on terminated fulfillment (400 FULFILLMENT_TERMINATED)', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    // Cancel fulfillment
    await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    // Attempt status update on CANCELLED fulfillment
    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'PREPARING' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('FULFILLMENT_TERMINATED');
  });

  it('15. Reject adding delivery tracking to terminated fulfillment (400)', async () => {
    const createRes = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId }),
    });
    const fulData = await createRes.json();
    const fid = fulData.data.id;

    // Cancel fulfillment
    await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'CANCELLED' }),
    });

    const res = await app.request(`/v1/fulfillment/fulfillments/business/${testBusinessId}/${fid}/deliveries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ carrierName: 'Express' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('FULFILLMENT_TERMINATED');
  });

  it('16. Reject payment record creation for order belonging to another business (404)', async () => {
    // Setup order for another business
    const otherOrderId = 'ord-other-999';
    mockPrisma.store.orders.set(otherOrderId, {
      id: otherOrderId,
      businessId: 'biz-other-999',
      userId: ownerId,
      totalAmount: 500,
    });

    const res = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: otherOrderId, amount: 500 }),
    });

    expect(res.status).toBe(404);
    const data = await res.json();
    expect(data.error.code).toBe('RESOURCE_NOT_FOUND');
  });

  it('17. Reject invalid payment status transition (e.g., REFUNDED directly to PAID) (400)', async () => {
    const createRes = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ orderId: testOrderId, amount: 500, method: 'CASH_ON_DELIVERY' }),
    });
    const payData = await createRes.json();
    const pid = payData.data.id;

    // Refund payment record
    await app.request(`/v1/fulfillment/payments/business/${testBusinessId}/${pid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'REFUNDED' }),
    });

    // Try updating REFUNDED payment status
    const res = await app.request(`/v1/fulfillment/payments/business/${testBusinessId}/${pid}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({ status: 'PAID' }),
    });

    expect(res.status).toBe(400);
    const data = await res.json();
    expect(data.error.code).toBe('PAYMENT_RECORD_TERMINATED');
  });
});

