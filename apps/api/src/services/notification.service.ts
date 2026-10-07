import type { PrismaClient, NotificationType } from '@waynah/database';
import { prisma as defaultPrisma } from '@waynah/database';

export interface CreateNotificationParams {
  userId: string;
  businessId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}

export interface ListNotificationsParams {
  userId: string;
  page?: number;
  limit?: number;
  isRead?: boolean;
}

export class NotificationService {
  constructor(private readonly prisma: PrismaClient = defaultPrisma) {}

  /**
   * Creates and persists a notification.
   */
  public async createNotification(params: CreateNotificationParams) {
    if (!this.prisma?.notification) return null;
    return this.prisma.notification.create({
      data: {
        userId: params.userId,
        businessId: params.businessId ?? null,
        type: params.type,
        title: params.title.trim(),
        body: params.body.trim(),
        data: params.data ? (params.data as any) : undefined,
      },
    });
  }

  /**
   * Lists user notifications with pagination and optional isRead filter.
   * STRICTLY SCOPED to current authenticated user.
   */
  public async getUserNotifications(params: ListNotificationsParams) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where: any = { userId: params.userId };
    if (params.isRead !== undefined) {
      where.isRead = params.isRead;
    }

    const [items, total] = await Promise.all([
      this.prisma.notification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.notification.count({ where }),
    ]);

    return {
      items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit) || 1,
      },
    };
  }

  /**
   * Gets unread notifications count for user.
   * STRICTLY SCOPED to current authenticated user.
   */
  public async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.notification.count({
      where: {
        userId,
        isRead: false,
      },
    });
  }

  /**
   * Marks a single notification as read.
   * STRICTLY SCOPED to current authenticated user.
   */
  public async markAsRead(id: string, userId: string) {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return null;
    }

    if (notification.isRead) {
      return notification;
    }

    return this.prisma.notification.update({
      where: { id: notification.id },
      data: {
        isRead: true,
        readAt: new Date(),
      },
    });
  }

  /**
   * Marks all unread notifications as read for current user.
   * STRICTLY SCOPED to current authenticated user.
   */
  public async markAllAsRead(userId: string) {
    const now = new Date();
    const result = await this.prisma.notification.updateMany({
      where: {
        userId,
        isRead: false,
      },
      data: {
        isRead: true,
        readAt: now,
      },
    });
    return { count: result.count };
  }

  /**
   * Deletes a notification by ID.
   * STRICTLY SCOPED to current authenticated user.
   */
  public async deleteNotification(id: string, userId: string): Promise<boolean> {
    const notification = await this.prisma.notification.findFirst({
      where: { id, userId },
    });

    if (!notification) {
      return false;
    }

    await this.prisma.notification.delete({
      where: { id: notification.id },
    });

    return true;
  }
}
