import { z } from 'zod';

export const notificationTypeEnum = z.enum([
  'SYSTEM_ALERT',
  'VERIFICATION_UPDATE',
  'CLAIM_UPDATE',
  'MEMBER_INVITATION',
  'TRANSACTION_UPDATE',
  'REVIEW_MODERATED',
]);

export const listNotificationsQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  isRead: z.enum(['true', 'false']).optional(),
});

export type ListNotificationsQuery = z.infer<typeof listNotificationsQuerySchema>;
