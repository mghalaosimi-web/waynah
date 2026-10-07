import type { MiddlewareHandler } from 'hono';
import { getCookie } from 'hono/cookie';
import type { PrismaClient } from '@waynah/database';
import { securityConfig } from '../config/security.config.js';
import { AuditLogger } from '../utils/audit-logger.js';
import { type Actor, ANONYMOUS_ACTOR, PERMISSIONS } from '@waynah/shared';
import { AuthService, type UserResponse } from '../services/auth.service.js';

// Extend Hono Context Variables
declare module 'hono' {
  interface ContextVariableMap {
    actor: Actor;
    user?: UserResponse;
    authStatus: 'ANONYMOUS' | 'AUTHENTICATED' | 'INVALID_CREDENTIALS';
    authError?: string;
  }
}

/**
 * Creates Authentication Middleware ("Who are you?")
 *
 * Accepts optional PrismaClient instance for dependency injection (e.g. tests/custom DB).
 * Inspects incoming request headers/cookies/credentials, verifies them,
 * and attaches an Actor identity (and User object if authenticated user) to Hono context.
 */
export function createAuthMiddleware(prismaClient?: PrismaClient): MiddlewareHandler {
  const authService = new AuthService(prismaClient);

  return async (c, next) => {
    const authHeader = c.req.header('Authorization');
    const apiKeyHeader = c.req.header('X-API-Key');
    const cookieToken = getCookie(c, 'waynah_session');
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    let providedKey: string | null = null;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      providedKey = authHeader.substring(7).trim();
    } else if (apiKeyHeader) {
      providedKey = apiKeyHeader.trim();
    } else if (cookieToken) {
      providedKey = cookieToken.trim();
    }

    // No credentials provided -> ANONYMOUS identity
    if (!providedKey) {
      c.set('actor', ANONYMOUS_ACTOR);
      c.set('authStatus', 'ANONYMOUS');
      return await next();
    }

    const expectedKey = securityConfig.ingestionApiKey;

    // 1. Check System / Ingestion API key
    if (expectedKey && providedKey === expectedKey) {
      const actor: Actor = {
        id: 'ingestion-service',
        type: 'SYSTEM',
        roles: ['SYSTEM_SERVICE'],
        permissions: [
          PERMISSIONS.DISCOVERY_INGEST,
          PERMISSIONS.ADMIN_CONFLICTS_READ,
          PERMISSIONS.ADMIN_PLACES_HISTORY_READ,
          PERMISSIONS.PLACE_READ,
          PERMISSIONS.PLACE_CREATE,
          PERMISSIONS.PLACE_UPDATE,
        ],
      };

      c.set('actor', actor);
      c.set('authStatus', 'AUTHENTICATED');
      await AuditLogger.logAuthSuccess(c.req.method, c.req.path, actor.id, actor.type, ip);
      return await next();
    }

    // 2. Check User Session token in Database
    const sessionResult = await authService.validateSession(providedKey);

    if (sessionResult) {
      c.set('actor', sessionResult.actor);
      c.set('user', sessionResult.user);
      c.set('authStatus', 'AUTHENTICATED');
      return await next();
    }

    // 3. Provided credentials invalid or expired
    await AuditLogger.logAuthFailure(c.req.method, c.req.path, ip, 'Invalid or expired authentication credentials');
    c.set('actor', ANONYMOUS_ACTOR);
    c.set('authStatus', 'INVALID_CREDENTIALS');
    c.set('authError', 'Unauthorized: Invalid or missing API key');
    return await next();
  };
}

export const authenticate: MiddlewareHandler = createAuthMiddleware();

/**
 * Legacy Composite Middleware for Ingestion Protection (WAYNAH-SEC-001 compatibility)
 * Ensures authentication + requires valid credentials.
 */
export const requireIngestionAuth: MiddlewareHandler = async (c, next) => {
  if (!c.get('actor')) {
    await authenticate(c, async () => {});
  }

  const authStatus = c.get('authStatus');
  if (authStatus === 'INVALID_CREDENTIALS' || authStatus === 'ANONYMOUS') {
    return c.json(
      {
        success: false,
        error: c.get('authError') || 'Unauthorized: Invalid or missing API key',
      },
      401
    );
  }

  return await next();
};

export { type Actor } from '@waynah/shared';
