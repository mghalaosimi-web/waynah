import type { PrismaClient } from '@waynah/database';
import { prisma as defaultPrisma } from '@waynah/database';
import { NotificationService } from './notification.service.js';

export class NotificationDispatcher {
  private service: NotificationService;

  constructor(prisma: PrismaClient = defaultPrisma) {
    this.service = new NotificationService(prisma);
  }

  /**
   * Dispatches a notification when a Business Verification is reviewed (approved or rejected).
   */
  public async dispatchVerificationReviewed(params: {
    userId: string;
    businessId: string;
    businessName: string;
    status: 'VERIFIED' | 'REJECTED';
    reason?: string;
  }): Promise<void> {
    try {
      const isApproved = params.status === 'VERIFIED';
      const title = isApproved
        ? `تم توثيق النشاط التجاري (${params.businessName})`
        : `تم رفض طلب توثيق النشاط التجاري (${params.businessName})`;
      
      const body = isApproved
        ? `مبروك! تم اعتماد توثيق نشاطك التجاري "${params.businessName}" بنجاح في منصة وينه.`
        : `للأسف تم رفض طلب التوثيق لنشاطك التجاري "${params.businessName}".${params.reason ? ` السبب: ${params.reason}` : ''}`;

      await this.service.createNotification({
        userId: params.userId,
        businessId: params.businessId,
        type: 'VERIFICATION_UPDATE',
        title,
        body,
        data: {
          businessId: params.businessId,
          businessName: params.businessName,
          status: params.status,
          reason: params.reason || null,
        },
      });
    } catch (err) {
      console.error('[NotificationDispatcher] Failed to dispatch verification notification:', err);
    }
  }

  /**
   * Dispatches a notification when a Branch Claim is reviewed (approved or rejected).
   */
  public async dispatchBranchClaimReviewed(params: {
    userId: string;
    businessId: string;
    placeId: string;
    placeName?: string;
    status: 'APPROVED' | 'REJECTED';
    reason?: string;
  }): Promise<void> {
    try {
      const isApproved = params.status === 'APPROVED';
      const placeDisplayName = params.placeName || 'الفرع المحدد';
      const title = isApproved
        ? `تم الموافقة على طلب ملكية الفرع (${placeDisplayName})`
        : `تم رفض طلب ملكية الفرع (${placeDisplayName})`;

      const body = isApproved
        ? `تمت إتاحة ربط الفرع "${placeDisplayName}" بنجاح بنشاطك التجاري.`
        : `تم رفض طلب ملكية الفرع "${placeDisplayName}".${params.reason ? ` السبب: ${params.reason}` : ''}`;

      await this.service.createNotification({
        userId: params.userId,
        businessId: params.businessId,
        type: 'CLAIM_UPDATE',
        title,
        body,
        data: {
          businessId: params.businessId,
          placeId: params.placeId,
          status: params.status,
          reason: params.reason || null,
        },
      });
    } catch (err) {
      console.error('[NotificationDispatcher] Failed to dispatch claim review notification:', err);
    }
  }

  /**
   * Dispatches a notification when a user is invited to join a business team.
   */
  public async dispatchBusinessMemberInvited(params: {
    userId: string;
    businessId: string;
    businessName: string;
    role: string;
    inviterName: string;
  }): Promise<void> {
    try {
      const title = `دعوة للانضمام إلى فريق (${params.businessName})`;
      const body = `دعاك ${params.inviterName} للانضمام إلى فريق عمل "${params.businessName}" بدور (${params.role}).`;

      await this.service.createNotification({
        userId: params.userId,
        businessId: params.businessId,
        type: 'MEMBER_INVITATION',
        title,
        body,
        data: {
          businessId: params.businessId,
          businessName: params.businessName,
          role: params.role,
        },
      });
    } catch (err) {
      console.error('[NotificationDispatcher] Failed to dispatch member invitation notification:', err);
    }
  }

  /**
   * Dispatches a notification when a user review is moderated.
   */
  public async dispatchReviewModerated(params: {
    userId: string;
    reviewId: string;
    status: 'PUBLISHED' | 'HIDDEN' | 'FLAGGED';
    reason?: string;
  }): Promise<void> {
    try {
      const isHidden = params.status === 'HIDDEN';
      const title = isHidden ? 'تحديث بشأن تقييمك' : 'تم نشر تقييمك بنجاح';
      const body = isHidden
        ? `تم إخفاء التقييم الخاص بك لعدم مطابقته لمعايير النشر.${params.reason ? ` السبب: ${params.reason}` : ''}`
        : 'تمت مراجعة تقييمك ونشره بنجاح للجمهور.';

      await this.service.createNotification({
        userId: params.userId,
        type: 'REVIEW_MODERATED',
        title,
        body,
        data: {
          reviewId: params.reviewId,
          status: params.status,
        },
      });
    } catch (err) {
      console.error('[NotificationDispatcher] Failed to dispatch review moderation notification:', err);
    }
  }

  /**
   * Dispatches a general system alert to a specific user.
   */
  public async dispatchSystemAlert(params: {
    userId: string;
    title: string;
    body: string;
    data?: Record<string, unknown>;
  }): Promise<void> {
    try {
      await this.service.createNotification({
        userId: params.userId,
        type: 'SYSTEM_ALERT',
        title: params.title,
        body: params.body,
        data: params.data,
      });
    } catch (err) {
      console.error('[NotificationDispatcher] Failed to dispatch system alert notification:', err);
    }
  }
}
