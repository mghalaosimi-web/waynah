import type { MiddlewareHandler } from 'hono';
import { type Actor, type ActorType, ANONYMOUS_ACTOR } from '@waynah/shared';
import { authenticate } from './auth.middleware.js';
import { AuditLogger } from '../utils/audit-logger.js';

/**
 * Evaluates whether an Actor has a specific permission.
 * Supports exact match, global wildcard ('*'), and domain wildcards (e.g., 'admin.*').
 */
export function hasPermission(actor: Actor, requiredPermission: string): boolean {
  if (!actor || !actor.permissions || !requiredPermission) return false;
  if (actor.permissions.includes('*')) return true;
  if (actor.permissions.includes(requiredPermission)) return true;

  return actor.permissions.some((p) => {
    if (p && typeof p === 'string' && p.endsWith('.*')) {
      const prefix = p.slice(0, -1); // e.g. 'admin.'
      return requiredPermission.startsWith(prefix);
    }
    return false;
  });
}

/**
 * Evaluates whether an Actor possesses a specific role.
 */
export function hasRole(actor: Actor, requiredRole: string): boolean {
  if (!actor || !actor.roles) return false;
  return actor.roles.includes(requiredRole) || actor.roles.includes('SUPER_ADMIN');
}

/**
 * Evaluates whether an Actor is of a specific identity type.
 */
export function hasActorType(actor: Actor, requiredType: ActorType): boolean {
  if (!actor) return false;
  return actor.type === requiredType;
}

/**
 * Authorization Middleware ("What are you allowed to do?")
 *
 * Enforces permission requirements on endpoints.
 * Returns 401 Unauthorized if request is unauthenticated or credentials invalid.
 * Returns 403 Forbidden if authenticated actor lacks required permission.
 */
export const requirePermission = (...permissions: string[]): MiddlewareHandler => {
  return async (c, next) => {
    // Run authentication if actor is not yet attached to context
    if (!c.get('actor')) {
      await authenticate(c, async () => {});
    }

    const authStatus = c.get('authStatus');
    const actor = c.get('actor') || ANONYMOUS_ACTOR;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    // 1. Invalid credentials provided -> 401 Unauthorized
    if (authStatus === 'INVALID_CREDENTIALS') {
      return c.json(
        {
          success: false,
          error: c.get('authError') || 'Unauthorized: Invalid or missing API key',
        },
        401
      );
    }

    // 2. Unauthenticated caller -> 401 Unauthorized
    if (actor.type === 'ANONYMOUS' || authStatus === 'ANONYMOUS') {
      await AuditLogger.logAuthFailure(c.req.method, c.req.path, ip, 'Unauthenticated access attempt to protected endpoint');
      return c.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required',
        },
        401
      );
    }

    // 3. Authenticated actor permission check -> 403 Forbidden if lacking permissions
    const hasAllPermissions = permissions.every((p) => hasPermission(actor, p));

    if (!hasAllPermissions) {
      await AuditLogger.logAuthFailure(
        c.req.method,
        c.req.path,
        ip,
        `Forbidden: Actor '${actor.id}' lacks required permissions: [${permissions.join(', ')}]`
      );

      return c.json(
        {
          success: false,
          error: 'Forbidden: Insufficient permissions',
          requiredPermissions: permissions,
        },
        403
      );
    }

    return await next();
  };
};

/**
 * Authorization Middleware enforcing specific Roles.
 */
export const requireRole = (...roles: string[]): MiddlewareHandler => {
  return async (c, next) => {
    if (!c.get('actor')) {
      await authenticate(c, async () => {});
    }

    const authStatus = c.get('authStatus');
    const actor = c.get('actor') || ANONYMOUS_ACTOR;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    if (authStatus === 'INVALID_CREDENTIALS') {
      return c.json(
        {
          success: false,
          error: c.get('authError') || 'Unauthorized: Invalid or missing API key',
        },
        401
      );
    }

    if (actor.type === 'ANONYMOUS' || authStatus === 'ANONYMOUS') {
      await AuditLogger.logAuthFailure(c.req.method, c.req.path, ip, 'Unauthenticated access attempt to role-protected endpoint');
      return c.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required',
        },
        401
      );
    }

    const hasAnyRole = roles.some((r) => hasRole(actor, r));

    if (!hasAnyRole) {
      await AuditLogger.logAuthFailure(
        c.req.method,
        c.req.path,
        ip,
        `Forbidden: Actor '${actor.id}' lacks required roles: [${roles.join(', ')}]`
      );

      return c.json(
        {
          success: false,
          error: 'Forbidden: Insufficient role privileges',
          requiredRoles: roles,
        },
        403
      );
    }

    return await next();
  };
};

/**
 * Authorization Middleware enforcing specific Actor Types.
 */
export const requireActorType = (...types: ActorType[]): MiddlewareHandler => {
  return async (c, next) => {
    if (!c.get('actor')) {
      await authenticate(c, async () => {});
    }

    const authStatus = c.get('authStatus');
    const actor = c.get('actor') || ANONYMOUS_ACTOR;
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    if (authStatus === 'INVALID_CREDENTIALS') {
      return c.json(
        {
          success: false,
          error: c.get('authError') || 'Unauthorized: Invalid or missing API key',
        },
        401
      );
    }

    if (actor.type === 'ANONYMOUS' || authStatus === 'ANONYMOUS') {
      await AuditLogger.logAuthFailure(c.req.method, c.req.path, ip, 'Unauthenticated access attempt');
      return c.json(
        {
          success: false,
          error: 'Unauthorized: Authentication required',
        },
        401
      );
    }

    if (!types.includes(actor.type)) {
      await AuditLogger.logAuthFailure(
        c.req.method,
        c.req.path,
        ip,
        `Forbidden: Actor '${actor.id}' of type '${actor.type}' is not allowed`
      );

      return c.json(
        {
          success: false,
          error: 'Forbidden: Invalid actor type',
          allowedActorTypes: types,
        },
        403
      );
    }

    return await next();
  };
};
