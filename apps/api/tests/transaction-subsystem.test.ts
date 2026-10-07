import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createServer } from '../src/server.js';

function makeMockPrisma() {
  const store = {
    users: new Map<string, any>(),
    sessions: new Map<string, any>(),
    businesses: new Map<string, any>(),
    members: new Map<string, any>(),
    products: new Map<string, any>(),
    services: new Map<string, any>(),
    inquiries: new Map<string, any>(),
    requests: new Map<string, any>(),
    rfqs: new Map<string, any>(),
    quotes: new Map<string, any>(),
    bookings: new Map<string, any>(),
    orders: new Map<string, any>(),
  };

  const mockPrisma: any = {
    store,
    $queryRaw: vi.fn().mockResolvedValue([{ ok: true }]),
    $transaction: vi.fn(async (cb: any) => {
      if (typeof cb === 'function') {
        return cb(mockPrisma);
      }
      return cb;
    }),
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
    product: {
      findUnique: vi.fn(async ({ where }) => store.products.get(where.id) || null),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.products.values()).filter((p) => p.businessId === where.businessId);
      }),
    },
    serviceItem: {
      findUnique: vi.fn(async ({ where }) => store.services.get(where.id) || null),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.services.values()).filter((s) => s.businessId === where.businessId);
      }),
    },
    inquiry: {
      create: vi.fn(async ({ data }) => {
        const id = `inq-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.inquiries.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.inquiries.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.inquiries.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.inquiries.values()).filter(
          (i) => (where.businessId && i.businessId === where.businessId) || (where.userId && i.userId === where.userId)
        );
      }),
    },
    serviceRequest: {
      create: vi.fn(async ({ data }) => {
        const id = `req-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.requests.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.requests.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.requests.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.requests.values()).filter(
          (r) => (where.businessId && r.businessId === where.businessId) || (where.userId && r.userId === where.userId)
        );
      }),
    },
    rFQ: {
      create: vi.fn(async ({ data }) => {
        const id = `rfq-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, quotes: [], createdAt: new Date(), updatedAt: new Date() };
        store.rfqs.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.rfqs.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.rfqs.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.rfqs.values()).filter(
          (r) => (where.businessId && r.businessId === where.businessId) || (where.userId && r.userId === where.userId)
        );
      }),
    },
    quote: {
      create: vi.fn(async ({ data }) => {
        const id = `qte-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.quotes.set(id, item);
        return item;
      }),
    },
    booking: {
      create: vi.fn(async ({ data }) => {
        const id = `bkg-${Date.now()}-${Math.random()}`;
        const item = { id, ...data, createdAt: new Date(), updatedAt: new Date() };
        store.bookings.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.bookings.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.bookings.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.bookings.values()).filter(
          (b) => (where.businessId && b.businessId === where.businessId) || (where.userId && b.userId === where.userId)
        );
      }),
    },
    order: {
      create: vi.fn(async ({ data }) => {
        const id = `ord-${Date.now()}-${Math.random()}`;
        const items = data.items.create.map((it: any) => ({ id: `ordit-${Math.random()}`, orderId: id, ...it }));
        const item = {
          id,
          orderNumber: data.orderNumber,
          businessId: data.businessId,
          userId: data.userId,
          totalAmount: data.totalAmount,
          currency: data.currency,
          status: data.status,
          notes: data.notes,
          items,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        store.orders.set(id, item);
        return item;
      }),
      findUnique: vi.fn(async ({ where }) => store.orders.get(where.id) || null),
      update: vi.fn(async ({ where, data }) => {
        const item = store.orders.get(where.id);
        if (item) Object.assign(item, data, { updatedAt: new Date() });
        return item;
      }),
      findMany: vi.fn(async ({ where }) => {
        return Array.from(store.orders.values()).filter(
          (o) => (where.businessId && o.businessId === where.businessId) || (where.userId && o.userId === where.userId)
        );
      }),
    },
  };
  return mockPrisma;
}

describe('WAYNAH Phase 6 — Transaction Subsystems Tests (Inquiry, Request, RFQ, Booking & Single-Merchant Order)', () => {
  let mockPrisma: ReturnType<typeof makeMockPrisma>;
  let app: any;

  let customerToken: string;
  let customerUser: any;
  let ownerToken: string;
  let ownerUser: any;
  let memberToken: string;
  let memberUser: any;

  const bizA = { id: 'biz-a', name: 'متجر صنعاء الإلكتروني', slug: 'sanaa-store', status: 'ACTIVE' };
  const bizB = { id: 'biz-b', name: 'مؤسسة عدن للخدمات', slug: 'aden-services', status: 'ACTIVE' };

  const prodA = { id: 'prod-a1', businessId: 'biz-a', nameAr: 'هاتف ذكي', price: 500, currency: 'YER', isAvailable: true };
  const prodB = { id: 'prod-b1', businessId: 'biz-b', nameAr: 'كمبيوتر محمول', price: 1200, currency: 'YER', isAvailable: true };

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma as any);

    // Register Customer User
    const regCustomer = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'العميل علي', email: 'customer@example.com', password: 'Password123!' }),
    });
    const resCust = await regCustomer.json();
    customerToken = resCust.data.token;
    customerUser = resCust.data.user;

    // Register Owner User
    const regOwner = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'التاجر صاحب المحل', email: 'owner@example.com', password: 'Password123!' }),
    });
    const resOwn = await regOwner.json();
    ownerToken = resOwn.data.token;
    ownerUser = resOwn.data.user;

    // Register Member User
    const regMember = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: 'الموظف العادي', email: 'member@example.com', password: 'Password123!' }),
    });
    const resMem = await regMember.json();
    memberToken = resMem.data.token;
    memberUser = resMem.data.user;

    mockPrisma.store.businesses.set(bizA.id, bizA);
    mockPrisma.store.businesses.set(bizB.id, bizB);

    mockPrisma.store.members.set(`biz-a_${ownerUser.id}`, { businessId: 'biz-a', userId: ownerUser.id, role: 'OWNER' });
    mockPrisma.store.members.set(`biz-a_${memberUser.id}`, { businessId: 'biz-a', userId: memberUser.id, role: 'MEMBER' });

    mockPrisma.store.products.set(prodA.id, prodA);
    mockPrisma.store.products.set(prodB.id, prodB);
  });

  // ---------------- 1. INQUIRIES ----------------

  it('1. Customer can submit an inquiry to a Business', async () => {
    const res = await app.request('/v1/transactions/businesses/biz-a/inquiries', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        productId: 'prod-a1',
        subject: 'استفسار عن الضمان',
        message: 'هل يشمل الضمان استبدال الجهاز؟',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.subject).toBe('استفسار عن الضمان');
    expect(json.data.status).toBe('PENDING');
  });

  it('2. Merchant OWNER can reply to an inquiry', async () => {
    const inqId = 'inq-100';
    mockPrisma.store.inquiries.set(inqId, {
      id: inqId,
      businessId: 'biz-a',
      userId: customerUser.id,
      subject: 'استفسار عن الضمان',
      message: 'هل يشمل الضمان؟',
      status: 'PENDING',
    });

    const res = await app.request(`/v1/transactions/businesses/biz-a/inquiries/${inqId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        reply: 'نعم، يشمل الضمان الاستبدال لمدة سنة.',
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.reply).toBe('نعم، يشمل الضمان الاستبدال لمدة سنة.');
    expect(json.data.status).toBe('ANSWERED');
  });

  it('3. Read-only MEMBER cannot reply to inquiry (403)', async () => {
    const inqId = 'inq-101';
    mockPrisma.store.inquiries.set(inqId, {
      id: inqId,
      businessId: 'biz-a',
      userId: customerUser.id,
      subject: 'سؤال',
      message: 'نص السؤال',
      status: 'PENDING',
    });

    const res = await app.request(`/v1/transactions/businesses/biz-a/inquiries/${inqId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${memberToken}`,
      },
      body: JSON.stringify({
        reply: 'محاولة رد غير مصرح بها',
      }),
    });

    expect(res.status).toBe(403);
  });

  // ---------------- 2. SERVICE REQUESTS ----------------

  it('4. Customer can submit a Service Request', async () => {
    const res = await app.request('/v1/transactions/requests', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        businessId: 'biz-a',
        title: 'طلب صيانة هاتف',
        description: 'الشاشة تحتاج إلى تغيير',
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.title).toBe('طلب صيانة هاتف');
    expect(json.data.status).toBe('PENDING');
  });

  // ---------------- 3. RFQS & QUOTES ----------------

  it('5. Customer can submit RFQ and Merchant can submit Quote', async () => {
    // 5.1 Create RFQ
    const resRfq = await app.request('/v1/transactions/businesses/biz-a/rfqs', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        title: 'طلب تسعير كمية هواتف',
        description: 'مطلوب توريد 50 جهاز هاتف ذكي',
        budget: 25000,
      }),
    });

    expect(resRfq.status).toBe(201);
    const jsonRfq = await resRfq.json();
    const rfqId = jsonRfq.data.id;

    // 5.2 Submit Quote by Merchant
    const resQuote = await app.request(`/v1/transactions/businesses/biz-a/rfqs/${rfqId}/quotes`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        amount: 24000,
        currency: 'YER',
        notes: 'عرض خصم الكمية',
      }),
    });

    expect(resQuote.status).toBe(201);
    const jsonQuote = await resQuote.json();
    expect(jsonQuote.success).toBe(true);
    expect(jsonQuote.data.amount).toBe(24000);
  });

  // ---------------- 4. BOOKINGS ----------------

  it('6. Customer can book a service and Merchant can confirm it', async () => {
    // 6.1 Booking creation
    const resBkg = await app.request('/v1/transactions/businesses/biz-a/bookings', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        scheduledAt: new Date(Date.now() + 86400000).toISOString(),
        durationMinutes: 45,
        notes: 'حجز موعد استشارة فنية',
      }),
    });

    expect(resBkg.status).toBe(201);
    const jsonBkg = await resBkg.json();
    const bkgId = jsonBkg.data.id;

    // 6.2 Confirmation by Merchant
    const resConfirm = await app.request(`/v1/transactions/businesses/biz-a/bookings/${bkgId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        status: 'CONFIRMED',
      }),
    });

    expect(resConfirm.status).toBe(200);
    const jsonConfirm = await resConfirm.json();
    expect(jsonConfirm.data.status).toBe('CONFIRMED');
  });

  // ---------------- 5. ORDERS & SINGLE-MERCHANT INVARIANT ----------------

  it('7. Customer can create valid single-merchant Order', async () => {
    const res = await app.request('/v1/transactions/businesses/biz-a/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        currency: 'YER',
        notes: 'طلب توصيل مستعجل',
        items: [
          {
            productId: 'prod-a1',
            title: 'هاتف ذكي',
            quantity: 2,
            unitPrice: 500,
          },
        ],
      }),
    });

    expect(res.status).toBe(201);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.data.businessId).toBe('biz-a');
    expect(json.data.totalAmount).toBe(1000);
    expect(json.data.items.length).toBe(1);
  });

  it('8. Order creation fails if item belongs to another Business (Single-Merchant Violation 400)', async () => {
    const res = await app.request('/v1/transactions/businesses/biz-a/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${customerToken}`,
      },
      body: JSON.stringify({
        items: [
          {
            productId: 'prod-b1', // Belongs to biz-b, NOT biz-a!
            title: 'كمبيوتر محمول',
            quantity: 1,
            unitPrice: 1200,
          },
        ],
      }),
    });

    expect(res.status).toBe(400);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.error.code).toBe('SINGLE_MERCHANT_VIOLATION');
  });

  it('9. Merchant can update Order status', async () => {
    const orderId = 'ord-555';
    mockPrisma.store.orders.set(orderId, {
      id: orderId,
      orderNumber: 'ORD-12345',
      businessId: 'biz-a',
      userId: customerUser.id,
      totalAmount: 1000,
      currency: 'YER',
      status: 'PENDING',
      items: [],
    });

    const res = await app.request(`/v1/transactions/businesses/biz-a/orders/${orderId}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${ownerToken}`,
      },
      body: JSON.stringify({
        status: 'PROCESSING',
      }),
    });

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.data.status).toBe('PROCESSING');
  });

  it('10. Customer can fetch list of their own orders and inquiries', async () => {
    const resOrd = await app.request('/v1/transactions/my/orders', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });

    expect(resOrd.status).toBe(200);
    const jsonOrd = await resOrd.json();
    expect(jsonOrd.success).toBe(true);

    const resInq = await app.request('/v1/transactions/my/inquiries', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${customerToken}`,
      },
    });

    expect(resInq.status).toBe(200);
    const jsonInq = await resInq.json();
    expect(jsonInq.success).toBe(true);
  });
});
