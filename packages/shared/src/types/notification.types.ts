export type NotificationType =
  | 'SYSTEM_ALERT'
  | 'VERIFICATION_UPDATE'
  | 'CLAIM_UPDATE'
  | 'MEMBER_INVITATION'
  | 'TRANSACTION_UPDATE'
  | 'REVIEW_MODERATED';

export interface NotificationItem {
  id: string;
  userId: string;
  businessId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
  isRead: boolean;
  readAt?: string | Date | null;
  createdAt: string | Date;
  updatedAt: string | Date;
}

export interface NotificationUnreadCountResponse {
  unreadCount: number;
}

export interface CreateNotificationInput {
  userId: string;
  businessId?: string | null;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, unknown> | null;
}
