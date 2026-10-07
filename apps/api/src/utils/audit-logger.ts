/**
 * WAYNAH Audit Logger Utility
 *
 * Provides safe, structured audit logging for security events and sensitive domain actions
 * without exposing passwords, tokens, API keys, or raw sensitive payloads.
 * Now upgraded with persistent storage in PostgreSQL via Prisma.
 */

import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';

export interface SecurityAuditEvent {
  timestamp?: string;
  eventType:
    | 'AUTH_SUCCESS'
    | 'AUTH_FAILURE'
    | 'RATE_LIMIT_EXCEEDED'
    | 'INGESTION_PROCESSED'
    | 'SECURITY_VIOLATION'
    | 'BUSINESS_VERIFICATION_REVIEWED'
    | 'BRANCH_LINK_ESTABLISHED'
    | 'BRANCH_LINK_REASSIGNED'
    | 'BRANCH_CLAIM_REVIEWED'
    | 'BRANCH_LINK_REMOVED'
    | 'BUSINESS_MEMBER_INVITED'
    | 'BUSINESS_INVITATION_ACCEPTED'
    | 'BUSINESS_INVITATION_DECLINED'
    | 'BUSINESS_INVITATION_CANCELLED'
    | 'BUSINESS_MEMBER_ROLE_CHANGED'
    | 'BUSINESS_MEMBER_REMOVED'
    | 'DATA_CONFLICT_RESOLVED'
    | 'REVIEW_MODERATED'
    | 'PLACE_MERGED'
    | 'DOMAIN_SPLIT';

  path?: string;
  method?: string;
  ip?: string;
  actorId?: string;
  actorType?: string;
  actorRole?: string;
  action?: string;
  resourceType?: string;
  resourceId?: string;
  businessId?: string;
  placeId?: string;
  details?: Record<string, unknown>;
}

const SENSITIVE_KEY_REGEX =
  /password|passwordhash|pwd|token|tokenhash|sessiontoken|refreshtoken|invitationtoken|rawtoken|apikey|secret|secretkey|authorization|credential/i;

/**
 * Defensive recursive metadata sanitizer.
 * Replaces matching sensitive keys (passwords, tokens, API keys, credentials) with '[REDACTED]'.
 */
export function sanitizeMetadata(data: unknown, visited = new WeakSet()): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data !== 'object') return data;
  if (data instanceof Date) return data.toISOString();
  if (visited.has(data as object)) return '[CIRCULAR]';

  visited.add(data as object);

  if (Array.isArray(data)) {
    return data.map((item) => sanitizeMetadata(item, visited));
  }

  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    if (typeof value === 'object' && value !== null) {
      result[key] = sanitizeMetadata(value, visited);
    } else if (SENSITIVE_KEY_REGEX.test(key)) {
      result[key] = '[REDACTED]';
    } else {
      result[key] = value;
    }
  }

  return result;
}

export class AuditLogger {
  private static activePrismaClient: PrismaClient | null = null;

  public static setPrismaClient(client: PrismaClient | null): void {
    AuditLogger.activePrismaClient = client;
  }

  private static getPrisma(override?: PrismaClient): PrismaClient {
    return override || AuditLogger.activePrismaClient || defaultPrisma;
  }

  private static formatEvent(event: SecurityAuditEvent): string {
    return JSON.stringify({
      level: event.eventType.includes('FAILURE') || event.eventType.includes('VIOLATION') ? 'WARN' : 'INFO',
      type: 'SECURITY_AUDIT',
      ...event,
    });
  }

  /**
   * Primary entry point for audit persistence.
   * Emits structured console logs and persists to audit_logs table.
   * Catches errors internally so audit failures NEVER break the primary transaction flow.
   */
  public static async log(event: SecurityAuditEvent, prismaOverride?: PrismaClient): Promise<void> {
    const timestamp = event.timestamp || new Date().toISOString();
    const formatted = this.formatEvent({ ...event, timestamp });

    // 1. Structured console logging
    if (event.eventType.includes('FAILURE') || event.eventType.includes('VIOLATION')) {
      console.warn(`[SECURITY AUDIT] ${formatted}`);
    } else {
      console.info(`[SECURITY AUDIT] ${formatted}`);
    }

    // 2. Metadata sanitization
    const sanitizedDetails = event.details
      ? (sanitizeMetadata(event.details) as Record<string, unknown>)
      : undefined;

    // 3. Field extractions
    const actorId = event.actorId ?? (sanitizedDetails?.actorId as string | undefined) ?? null;
    const actorType = event.actorType ?? (actorId ? 'USER' : 'ANONYMOUS');
    const actorRole =
      event.actorRole ??
      AuditLogger.resolveActorRole(actorType, sanitizedDetails);

    const resourceType =
      event.resourceType ??
      AuditLogger.resolveResourceType(event.eventType);

    const resourceId =
      event.resourceId ??
      AuditLogger.resolveResourceId(sanitizedDetails);

    const businessId =
      event.businessId ??
      (sanitizedDetails?.businessId as string | undefined) ??
      (sanitizedDetails?.newBusinessId as string | undefined) ??
      null;

    const placeId =
      event.placeId ??
      (sanitizedDetails?.placeId as string | undefined) ??
      (sanitizedDetails?.sourcePlaceId as string | undefined) ??
      null;

    const action =
      event.action ??
      (sanitizedDetails?.action as string | undefined) ??
      null;

    // 4. Persistence attempt with defensive catch
    try {
      const client = AuditLogger.getPrisma(prismaOverride);
      if (client?.auditLog?.create) {
        await client.auditLog.create({
          data: {
            eventType: event.eventType,
            action,
            method: event.path ? (event.method || 'POST') : (event.method ?? null),
            path: event.path ?? null,
            ip: event.ip ?? null,
            actorId,
            actorType,
            actorRole,
            resourceType,
            resourceId,
            businessId,
            placeId,
            metadata: sanitizedDetails ? (sanitizedDetails as any) : undefined,
          },
        });
      }
    } catch (err: any) {
      console.error('[AUDIT_PERSISTENCE_FAILURE]', {
        eventType: event.eventType,
        error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  private static resolveActorRole(
    actorType: string,
    details?: Record<string, unknown>
  ): string {
    if (details?.role && typeof details.role === 'string') return details.role;
    if (details?.actorRole && typeof details.actorRole === 'string') return details.actorRole;
    if (details?.removedRole && typeof details.removedRole === 'string') return details.removedRole;
    if (details?.newRole && typeof details.newRole === 'string') return details.newRole;

    if (actorType === 'ADMIN') return 'ADMIN';
    if (actorType === 'SYSTEM' || actorType === 'SERVICE') return 'SYSTEM_SERVICE';
    if (actorType === 'ANONYMOUS') return 'ANONYMOUS';

    return 'USER';
  }

  private static resolveResourceType(eventType: string): string | null {
    switch (eventType) {
      case 'BUSINESS_VERIFICATION_REVIEWED':
        return 'BUSINESS_VERIFICATION';
      case 'BRANCH_LINK_ESTABLISHED':
      case 'BRANCH_LINK_REASSIGNED':
      case 'BRANCH_CLAIM_REVIEWED':
        return 'BRANCH_CLAIM';
      case 'BRANCH_LINK_REMOVED':
        return 'PLACE';
      case 'BUSINESS_MEMBER_INVITED':
      case 'BUSINESS_INVITATION_ACCEPTED':
      case 'BUSINESS_INVITATION_DECLINED':
      case 'BUSINESS_INVITATION_CANCELLED':
        return 'BUSINESS_INVITATION';
      case 'BUSINESS_MEMBER_ROLE_CHANGED':
      case 'BUSINESS_MEMBER_REMOVED':
        return 'BUSINESS_MEMBER';
      case 'DATA_CONFLICT_RESOLVED':
        return 'DATA_CONFLICT';
      case 'REVIEW_MODERATED':
        return 'REVIEW';
      case 'PLACE_MERGED':
      case 'DOMAIN_SPLIT':
        return 'PLACE';
      case 'INGESTION_PROCESSED':
        return 'OBSERVATION';
      case 'AUTH_SUCCESS':
      case 'AUTH_FAILURE':
      case 'RATE_LIMIT_EXCEEDED':
      case 'SECURITY_VIOLATION':
        return 'AUTH';
      default:
        return null;
    }
  }

  private static resolveResourceId(details?: Record<string, unknown>): string | null {
    if (!details) return null;
    if (typeof details.verificationId === 'string') return details.verificationId;
    if (typeof details.claimId === 'string') return details.claimId;
    if (typeof details.invitationId === 'string') return details.invitationId;
    if (typeof details.memberId === 'string') return details.memberId;
    if (typeof details.conflictId === 'string') return details.conflictId;
    if (typeof details.reviewId === 'string') return details.reviewId;
    if (typeof details.observationId === 'string') return details.observationId;
    if (typeof details.sourcePlaceId === 'string') return details.sourcePlaceId;
    if (typeof details.placeId === 'string') return details.placeId;
    if (typeof details.businessId === 'string') return details.businessId;
    return null;
  }

  // --- Static Event Emitters ---

  public static async logAuthFailure(
    method: string,
    path: string,
    ip?: string,
    reason?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_FAILURE',
      method,
      path,
      ip,
      actorType: 'ANONYMOUS',
      actorRole: 'ANONYMOUS',
      details: { reason: reason || 'Invalid or missing API credentials' },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logAuthSuccess(
    method: string,
    path: string,
    actorId: string,
    actorType: string,
    ip?: string,
    actorRole?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_SUCCESS',
      method,
      path,
      ip,
      actorId,
      actorType,
      actorRole: actorRole || (actorType === 'ADMIN' ? 'ADMIN' : actorType === 'SYSTEM' ? 'SYSTEM_SERVICE' : 'USER'),
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logRateLimitExceeded(
    method: string,
    path: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      method,
      path,
      ip,
      actorType: 'ANONYMOUS',
      actorRole: 'ANONYMOUS',
      details: { message: 'Maximum allowed request rate exceeded' },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logIngestionProcessed(
    observationId: string,
    action: string,
    actorId: string,
    dataSourceId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'INGESTION_PROCESSED',
      method: 'POST',
      path: '/v1/discovery/ingest',
      ip,
      actorId,
      actorType: 'SYSTEM',
      actorRole: 'SYSTEM_SERVICE',
      details: {
        observationId,
        action,
        dataSourceId,
      },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logSecurityViolation(
    method: string,
    path: string,
    ip?: string,
    details?: Record<string, unknown>,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'SECURITY_VIOLATION',
      method,
      path,
      ip,
      actorType: 'ANONYMOUS',
      actorRole: 'ANONYMOUS',
      details,
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logVerificationReviewed(
    verificationId: string,
    businessId: string,
    resultingStatus: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_VERIFICATION_REVIEWED',
      method: 'POST',
      path: `/v1/admin/verifications/${verificationId}/review`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: {
        verificationId,
        businessId,
        resultingStatus,
      },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBranchLinkEstablished(
    claimId: string,
    businessId: string,
    placeId: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BRANCH_LINK_ESTABLISHED',
      method: 'POST',
      path: `/v1/admin/branch-claims/${claimId}/review`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: {
        claimId,
        businessId,
        newBusinessId: businessId,
        placeId,
        action: 'APPROVE',
        outcome: 'LINK_ESTABLISHED',
      },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBranchLinkReassigned(
    claimId: string,
    newBusinessId: string,
    previousBusinessId: string,
    placeId: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BRANCH_LINK_REASSIGNED',
      method: 'POST',
      path: `/v1/admin/branch-claims/${claimId}/review`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: {
        claimId,
        businessId: newBusinessId,
        newBusinessId,
        previousBusinessId,
        placeId,
        action: 'APPROVE',
        outcome: 'LINK_REASSIGNED',
      },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBranchClaimReviewed(
    claimId: string,
    businessId: string,
    placeId: string,
    action: string,
    outcome: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BRANCH_CLAIM_REVIEWED',
      method: 'POST',
      path: `/v1/admin/branch-claims/${claimId}/review`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: {
        claimId,
        businessId,
        placeId,
        action,
        outcome,
      },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBranchLinkRemoved(
    businessId: string,
    placeId: string,
    actorId: string,
    actorType: string = 'USER',
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BRANCH_LINK_REMOVED',
      method: 'DELETE',
      path: `/v1/businesses/${businessId}/branches/${placeId}`,
      ip,
      actorId,
      actorType,
      actorRole: actorType === 'ADMIN' ? 'ADMIN' : 'BUSINESS_OWNER',
      details: {
        businessId,
        previousBusinessId: businessId,
        newBusinessId: null,
        placeId,
        action: 'UNLINK',
        outcome: 'LINK_REMOVED',
      },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBusinessMemberInvited(
    invitationId: string,
    businessId: string,
    email: string,
    role: string,
    inviterId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_MEMBER_INVITED',
      method: 'POST',
      path: `/v1/businesses/${businessId}/members/invite`,
      ip,
      actorId: inviterId,
      actorRole: 'BUSINESS_OWNER',
      details: { invitationId, businessId, email, role },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBusinessInvitationAccepted(
    invitationId: string,
    businessId: string,
    userId: string,
    email: string,
    role: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_INVITATION_ACCEPTED',
      method: 'POST',
      path: '/v1/businesses/invitations/accept',
      ip,
      actorId: userId,
      actorRole: role,
      details: { invitationId, businessId, userId, email, role },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBusinessInvitationDeclined(
    invitationId: string,
    businessId: string,
    userId: string,
    email: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_INVITATION_DECLINED',
      method: 'POST',
      path: '/v1/businesses/invitations/decline',
      ip,
      actorId: userId,
      actorRole: 'USER',
      details: { invitationId, businessId, userId, email },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBusinessInvitationCancelled(
    invitationId: string,
    businessId: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_INVITATION_CANCELLED',
      method: 'DELETE',
      path: `/v1/businesses/${businessId}/invitations/${invitationId}`,
      ip,
      actorId,
      actorRole: 'BUSINESS_OWNER',
      details: { invitationId, businessId },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBusinessMemberRoleChanged(
    businessId: string,
    memberId: string,
    targetUserId: string,
    previousRole: string,
    newRole: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_MEMBER_ROLE_CHANGED',
      method: 'PATCH',
      path: `/v1/businesses/${businessId}/members/${memberId}`,
      ip,
      actorId,
      actorRole: 'BUSINESS_OWNER',
      details: { businessId, memberId, targetUserId, previousRole, newRole },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logBusinessMemberRemoved(
    businessId: string,
    memberId: string,
    targetUserId: string,
    removedRole: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_MEMBER_REMOVED',
      method: 'DELETE',
      path: `/v1/businesses/${businessId}/members/${memberId}`,
      ip,
      actorId,
      actorRole: 'BUSINESS_OWNER',
      details: { businessId, memberId, targetUserId, removedRole },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logDataConflictResolved(
    conflictId: string,
    placeId: string,
    action: string,
    status: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'DATA_CONFLICT_RESOLVED',
      method: 'POST',
      path: `/v1/admin/conflicts/${conflictId}/resolve`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: { conflictId, placeId, action, status },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logReviewModerated(
    reviewId: string,
    action: string,
    resultingStatus: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'REVIEW_MODERATED',
      method: 'POST',
      path: `/v1/admin/reviews/${reviewId}/moderate`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: { reviewId, action, resultingStatus },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logPlaceMerged(
    sourcePlaceId: string,
    targetPlaceId: string,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'PLACE_MERGED',
      method: 'POST',
      path: `/v1/admin/duplicates/candidates/merge`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: { sourcePlaceId, targetPlaceId },
    };
    return AuditLogger.log(event, prismaOverride);
  }

  public static async logDomainSplit(
    sourcePlaceId: string,
    newPlaceId: string,
    observationsMoved: number,
    actorId: string,
    ip?: string,
    prismaOverride?: PrismaClient
  ): Promise<void> {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'DOMAIN_SPLIT',
      method: 'POST',
      path: `/v1/admin/duplicates/split`,
      ip,
      actorId,
      actorType: 'ADMIN',
      actorRole: 'ADMIN',
      details: { sourcePlaceId, newPlaceId, observationsMoved },
    };
    return AuditLogger.log(event, prismaOverride);
  }
}
