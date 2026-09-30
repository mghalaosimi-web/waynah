/**
 * WAYNAH Audit Logger Utility
 *
 * Provides safe, structured audit logging for security events and sensitive domain actions
 * without exposing passwords, tokens, API keys, or raw sensitive payloads.
 */

export interface SecurityAuditEvent {
  timestamp: string;
  eventType: 'AUTH_SUCCESS' | 'AUTH_FAILURE' | 'RATE_LIMIT_EXCEEDED' | 'INGESTION_PROCESSED' | 'SECURITY_VIOLATION' | 'BUSINESS_VERIFICATION_REVIEWED';
  path: string;
  method: string;
  ip?: string;
  actorId?: string;
  actorType?: string;
  details?: Record<string, unknown>;
}

export class AuditLogger {
  private static formatEvent(event: SecurityAuditEvent): string {
    return JSON.stringify({
      level: event.eventType.includes('FAILURE') || event.eventType.includes('VIOLATION') ? 'WARN' : 'INFO',
      type: 'SECURITY_AUDIT',
      ...event,
    });
  }

  public static logAuthFailure(method: string, path: string, ip?: string, reason?: string): void {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_FAILURE',
      method,
      path,
      ip,
      details: { reason: reason || 'Invalid or missing API credentials' },
    };
    console.warn(`[SECURITY AUDIT] ${this.formatEvent(event)}`);
  }

  public static logAuthSuccess(method: string, path: string, actorId: string, actorType: string, ip?: string): void {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'AUTH_SUCCESS',
      method,
      path,
      ip,
      actorId,
      actorType,
    };
    console.info(`[SECURITY AUDIT] ${this.formatEvent(event)}`);
  }

  public static logRateLimitExceeded(method: string, path: string, ip?: string): void {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'RATE_LIMIT_EXCEEDED',
      method,
      path,
      ip,
      details: { message: 'Maximum allowed request rate exceeded' },
    };
    console.warn(`[SECURITY AUDIT] ${this.formatEvent(event)}`);
  }

  public static logIngestionProcessed(
    observationId: string,
    action: string,
    actorId: string,
    dataSourceId: string,
    ip?: string
  ): void {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'INGESTION_PROCESSED',
      method: 'POST',
      path: '/v1/discovery/ingest',
      ip,
      actorId,
      details: {
        observationId,
        action,
        dataSourceId,
      },
    };
    console.info(`[SECURITY AUDIT] ${this.formatEvent(event)}`);
  }

  public static logVerificationReviewed(
    verificationId: string,
    businessId: string,
    resultingStatus: string,
    actorId: string,
    ip?: string
  ): void {
    const event: SecurityAuditEvent = {
      timestamp: new Date().toISOString(),
      eventType: 'BUSINESS_VERIFICATION_REVIEWED',
      method: 'POST',
      path: `/v1/admin/verifications/${verificationId}/review`,
      ip,
      actorId,
      actorType: 'ADMIN',
      details: {
        verificationId,
        businessId,
        resultingStatus,
      },
    };
    console.info(`[SECURITY AUDIT] ${this.formatEvent(event)}`);
  }
}
