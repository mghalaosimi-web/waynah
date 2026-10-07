import { describe, it, expect, vi, beforeEach } from 'vitest';
import { Hono } from 'hono';
import type { PrismaClient } from '@waynah/database';
import { createServer } from '../src/server.js';
import { NotificationService } from '../src/services/notification.service.js';
import { NotificationDispatcher } from '../src/services/notification-dispatcher.js';

function makeMockPrisma() {
  const users = new Map<string, any>();
  const sessions = new Map<string, any>();
  const notifications = new Map<string, any>();
  const businessMembers = new Map<string, any>();

  return {
    user: {
      findUnique: vi.fn().mockImplementation(({ where }) => {
        if (where.id) return Promise.resolve(users.get(where.id) || null);
        if (where.email) {
          for (const u of users.values()) {
            if (u.email === where.email) return Promise.resolve(u);
          }
        }
        return Promise.resolve(null);
      }),
      create: vi.fn().mockImplementation(({ data }) => {
        const id = data.id || 'usr-' + Math.random().toString(36).substring(2, 9);
        const newUser = { id, createdAt: new Date(), updatedAt: new Date(), role: 'USER', ...data };
        users.set(id, newUser);
        return Promise.resolve(newUser);
      }),
      createMany: vi.fn().mockImplementation(({ data }) => {
        for (const u of data) {
          users.set(u.id, u);
        }
        return Promise.resolve({ count: data.length });
      }),
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        let count = 0;
        if (where.id?.in) {
          for (const id of where.id.in) {
            if (users.has(id)) {
              users.delete(id);
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      }),
    },
    session: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'ses-' + Math.random().toString(36).substring(2, 9);
        const newSession = { id, createdAt: new Date(), ...data };
        sessions.set(data.token, newSession);
        return Promise.resolve(newSession);
      }),
      findUnique: vi.fn().mockImplementation(({ where, include }) => {
        const session = sessions.get(where.token);
        if (!session) return Promise.resolve(null);
        if (include?.user) {
          const user = users.get(session.userId);
          return Promise.resolve({ ...session, user });
        }
        return Promise.resolve(session);
      }),
    },
    businessMember: {
      findMany: vi.fn().mockImplementation(({ where }) => {
        const result: any[] = [];
        for (const bm of businessMembers.values()) {
          if (bm.businessId === where.businessId) {
            result.push(bm);
          }
        }
        return Promise.resolve(result);
      }),
    },
    notification: {
      create: vi.fn().mockImplementation(({ data }) => {
        const id = 'notif-' + Math.random().toString(36).substring(2, 9);
        const newNotif = {
          id,
          userId: data.userId,
          businessId: data.businessId ?? null,
          type: data.type,
          title: data.title,
          body: data.body,
          data: data.data ?? null,
          isRead: false,
          readAt: null,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        notifications.set(id, newNotif);
        return Promise.resolve(newNotif);
      }),
      findMany: vi.fn().mockImplementation(({ where, skip = 0, take = 20 }) => {
        const filtered: any[] = [];
        for (const n of notifications.values()) {
          if (n.userId === where.userId) {
            if (where.isRead !== undefined && n.isRead !== where.isRead) {
              continue;
            }
            filtered.push(n);
          }
        }
        filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        return Promise.resolve(filtered.slice(skip, skip + take));
      }),
      count: vi.fn().mockImplementation(({ where }) => {
        let count = 0;
        for (const n of notifications.values()) {
          if (n.userId === where.userId) {
            if (where.isRead !== undefined && n.isRead !== where.isRead) {
              continue;
            }
            count++;
          }
        }
        return Promise.resolve(count);
      }),
      findFirst: vi.fn().mockImplementation(({ where }) => {
        for (const n of notifications.values()) {
          if (n.id === where.id && n.userId === where.userId) {
            return Promise.resolve(n);
          }
        }
        return Promise.resolve(null);
      }),
      findUnique: vi.fn().mockImplementation(({ where }) => {
        return Promise.resolve(notifications.get(where.id) || null);
      }),
      update: vi.fn().mockImplementation(({ where, data }) => {
        const n = notifications.get(where.id);
        if (!n) throw new Error('Notification not found');
        const updated = { ...n, ...data, updatedAt: new Date() };
        notifications.set(where.id, updated);
        return Promise.resolve(updated);
      }),
      updateMany: vi.fn().mockImplementation(({ where, data }) => {
        let count = 0;
        for (const n of notifications.values()) {
          if (n.userId === where.userId) {
            if (where.isRead !== undefined && n.isRead !== where.isRead) {
              continue;
            }
            const updated = { ...n, ...data, updatedAt: new Date() };
            notifications.set(n.id, updated);
            count++;
          }
        }
        return Promise.resolve({ count });
      }),
      delete: vi.fn().mockImplementation(({ where }) => {
        const n = notifications.get(where.id);
        if (n) {
          notifications.delete(where.id);
          return Promise.resolve(n);
        }
        throw new Error('Notification not found');
      }),
      deleteMany: vi.fn().mockImplementation(({ where }) => {
        let count = 0;
        if (where.userId?.in) {
          for (const n of notifications.values()) {
            if (where.userId.in.includes(n.userId)) {
              notifications.delete(n.id);
              count++;
            }
          }
        }
        return Promise.resolve({ count });
      }),
    },
  } as unknown as PrismaClient;
}

describe('WAYNAH — Phase 10 Unit B — Notifications Subsystem', () => {
  let mockPrisma: PrismaClient;
  let app: Hono;
  let service: NotificationService;
  let dispatcher: NotificationDispatcher;
  let tokenA: string;
  let userIdA: string;
  let userIdB: string;

  beforeEach(async () => {
    mockPrisma = makeMockPrisma();
    app = createServer(mockPrisma);
    service = new NotificationService(mockPrisma);
    dispatcher = new NotificationDispatcher(mockPrisma);

    // Register test user A via auth endpoint to obtain a valid session token
    const regResA = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'المستخدم أ',
        email: `notif-a-${Date.now()}@waynah.com`,
        password: 'Password123!',
      }),
    });
    const dataA = await regResA.json();
    tokenA = dataA.data.token;
    userIdA = dataA.data.user.id;

    // Register test user B
    const regResB = await app.request('/v1/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'المستخدم ب',
        email: `notif-b-${Date.now()}@waynah.com`,
        password: 'Password123!',
      }),
    });
    const dataB = await regResB.json();
    userIdB = dataB.data.user.id;
  });

  // 1. NotificationService Unit Tests
  it('1. NotificationService creates, lists, counts unread, marks read, and deletes notifications correctly', async () => {
    const created = await service.createNotification({
      userId: userIdA,
      type: 'SYSTEM_ALERT',
      title: 'إشعار اختبار',
      body: 'تفاصيل إشعار الاختبار',
      data: { key: 'value' },
    });

    expect(created.id).toBeDefined();
    expect(created.userId).toBe(userIdA);
    expect(created.isRead).toBe(false);

    // Check unread count
    const unreadCount = await service.getUnreadCount(userIdA);
    expect(unreadCount).toBe(1);

    // List notifications
    const list = await service.getUserNotifications({ userId: userIdA });
    expect(list.items).toHaveLength(1);
    expect(list.items[0].id).toBe(created.id);

    // Mark as read
    const read = await service.markAsRead(created.id, userIdA);
    expect(read).not.toBeNull();
    expect(read?.isRead).toBe(true);
    expect(read?.readAt).toBeDefined();

    // Verify unread count is 0
    const updatedUnread = await service.getUnreadCount(userIdA);
    expect(updatedUnread).toBe(0);

    // Delete notification
    const deleted = await service.deleteNotification(created.id, userIdA);
    expect(deleted).toBe(true);

    const emptyList = await service.getUserNotifications({ userId: userIdA });
    expect(emptyList.items).toHaveLength(0);
  });

  // 2. NotificationDispatcher Event Mapping Tests
  it('2. NotificationDispatcher dispatches domain event notifications accurately', async () => {
    await dispatcher.dispatchVerificationReviewed({
      userId: userIdA,
      businessId: 'biz-1',
      businessName: 'متجر حجة',
      status: 'VERIFIED',
    });

    await dispatcher.dispatchBranchClaimReviewed({
      userId: userIdA,
      businessId: 'biz-1',
      placeId: 'place-1',
      status: 'APPROVED',
    });

    const userNotifs = await service.getUserNotifications({ userId: userIdA });
    expect(userNotifs.items).toHaveLength(2);
    expect(userNotifs.items.map((n) => n.type)).toContain('VERIFICATION_UPDATE');
    expect(userNotifs.items.map((n) => n.type)).toContain('CLAIM_UPDATE');
  });

  // 3. User Isolation & Security Enforcement (CRITICAL)
  it('3. Enforces STRICT User Isolation: User A cannot read, mark, or delete User B notifications', async () => {
    // Create notification for User B
    const notifB = await service.createNotification({
      userId: userIdB,
      type: 'SYSTEM_ALERT',
      title: 'خاص بالمستخدم ب',
      body: 'سري جداً',
    });

    // User A attempts to list notifications -> should NOT see User B's notification
    const listA = await service.getUserNotifications({ userId: userIdA });
    expect(listA.items).toHaveLength(0);

    // User A attempts to mark User B's notification as read -> should fail (return null)
    const markAttempt = await service.markAsRead(notifB.id, userIdA);
    expect(markAttempt).toBeNull();

    // Verify User B's notification is STILL unread in DB
    const freshNotifB = await mockPrisma.notification.findUnique({ where: { id: notifB.id } });
    expect(freshNotifB?.isRead).toBe(false);

    // User A attempts to delete User B's notification -> should fail (return false)
    const deleteAttempt = await service.deleteNotification(notifB.id, userIdA);
    expect(deleteAttempt).toBe(false);

    // Verify User B's notification STILL exists in DB
    const existsB = await mockPrisma.notification.findUnique({ where: { id: notifB.id } });
    expect(existsB).not.toBeNull();
  });

  // 4. API Endpoints via HTTP Integration
  it('4. HTTP API Endpoints (/v1/notifications) operate correctly with authentication', async () => {
    // Create notification for User A
    const n = await service.createNotification({
      userId: userIdA,
      type: 'TRANSACTION_UPDATE',
      title: 'طلبك مكتمل',
      body: 'تم استلام طلبك بنجاح',
    });

    // Authenticated request as User A
    const getRes = await app.request('/v1/notifications', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });

    expect(getRes.status).toBe(200);
    const body = await getRes.json();
    expect(body.success).toBe(true);
    expect(body.data).toHaveLength(1);
    expect(body.data[0].id).toBe(n.id);

    // GET /unread-count
    const unreadRes = await app.request('/v1/notifications/unread-count', {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(unreadRes.status).toBe(200);
    const unreadData = await unreadRes.json();
    expect(unreadData.data.unreadCount).toBe(1);

    // PATCH /:id/read
    const patchRes = await app.request(`/v1/notifications/${n.id}/read`, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(patchRes.status).toBe(200);
    const patchData = await patchRes.json();
    expect(patchData.data.isRead).toBe(true);

    // POST /read-all
    const readAllRes = await app.request('/v1/notifications/read-all', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(readAllRes.status).toBe(200);

    // DELETE /:id
    const delRes = await app.request(`/v1/notifications/${n.id}`, {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${tokenA}`,
      },
    });
    expect(delRes.status).toBe(200);
  });

  // 5. Unauthorized Access Protection
  it('5. Blocks anonymous unauthenticated access to notification endpoints (401 Unauthorized)', async () => {
    const res = await app.request('/v1/notifications', {
      method: 'GET',
    });
    expect(res.status).toBe(401);
  });
});
