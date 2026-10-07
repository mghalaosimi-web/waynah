import { Hono } from 'hono';
import { zValidator } from '@hono/zod-validator';
import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { listNotificationsQuerySchema, PERMISSIONS } from '@waynah/shared';
import { requirePermission } from '../../middleware/authorization.middleware.js';
import { NotificationService } from '../../services/notification.service.js';
import { ApiResponse } from '../../utils/api-response.js';

export function createNotificationRouter(prismaClient: PrismaClient = defaultPrisma) {
  const router = new Hono();
  const notificationService = new NotificationService(prismaClient);

  // 1. GET /v1/notifications — List notifications for current user
  router.get(
    '/',
    requirePermission(PERMISSIONS.NOTIFICATION_READ),
    zValidator('query', listNotificationsQuerySchema, (result, c) => {
      if (!result.success) {
        return c.json(
          ApiResponse.error('معايير الفلترة غير صالحة', 'INVALID_INPUT', result.error.errors),
          400
        );
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

      const { page, limit, isRead } = c.req.valid('query');
      const parsedIsRead = isRead === 'true' ? true : isRead === 'false' ? false : undefined;

      const result = await notificationService.getUserNotifications({
        userId,
        page,
        limit,
        isRead: parsedIsRead,
      });

      return c.json(ApiResponse.success(result.items, result.pagination));
    }
  );

  // 2. GET /v1/notifications/unread-count — Unread count for current user
  router.get('/unread-count', requirePermission(PERMISSIONS.NOTIFICATION_READ), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const unreadCount = await notificationService.getUnreadCount(userId);
    return c.json(ApiResponse.success({ unreadCount }));
  });

  // 3. PATCH /v1/notifications/:id/read — Mark single notification read
  router.patch('/:id/read', requirePermission(PERMISSIONS.NOTIFICATION_MANAGE), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const id = c.req.param('id');
    const notification = await notificationService.markAsRead(id, userId);

    if (!notification) {
      return c.json(ApiResponse.error('الإشعار غير موجود أو لا تملك صلاحية الوصول إليه', 'NOT_FOUND'), 404);
    }

    return c.json(ApiResponse.success(notification));
  });

  // 4. POST /v1/notifications/read-all — Mark all notifications read
  router.post('/read-all', requirePermission(PERMISSIONS.NOTIFICATION_MANAGE), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const result = await notificationService.markAllAsRead(userId);
    return c.json(ApiResponse.success(result));
  });

  // 5. DELETE /v1/notifications/:id — Delete notification
  router.delete('/:id', requirePermission(PERMISSIONS.NOTIFICATION_MANAGE), async (c) => {
    const user = c.get('user');
    const actor = c.get('actor');
    const userId = user?.id || (actor?.type !== 'ANONYMOUS' ? actor?.id : null);

    if (!userId) {
      return c.json(ApiResponse.error('Unauthorized', 'UNAUTHORIZED'), 401);
    }

    const id = c.req.param('id');
    const success = await notificationService.deleteNotification(id, userId);

    if (!success) {
      return c.json(ApiResponse.error('الإشعار غير موجود أو لا تملك صلاحية الوصول إليه', 'NOT_FOUND'), 404);
    }

    return c.json(ApiResponse.success({ deleted: true }));
  });

  return router;
}

export const notificationRouter = createNotificationRouter(defaultPrisma);
