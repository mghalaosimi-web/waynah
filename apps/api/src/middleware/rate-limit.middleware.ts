import type { MiddlewareHandler } from 'hono';
import { securityConfig } from '../config/security.config.js';
import { AuditLogger } from '../utils/audit-logger.js';

interface RateLimitEntry {
  count: number;
  resetTime: number;
}

/**
 * In-Memory Rate Limiter Middleware
 *
 * Provides essential rate limiting protection for sensitive endpoints
 * without requiring external infrastructure (e.g. Redis).
 */
export function createRateLimiter(options?: {
  windowMs?: number;
  maxRequests?: number;
}): MiddlewareHandler {
  const windowMs = options?.windowMs || securityConfig.rateLimit.windowMs;
  const maxRequests = options?.maxRequests || securityConfig.rateLimit.maxRequestsProtected;

  const hits = new Map<string, RateLimitEntry>();

  // Periodically clean expired entries to prevent memory leaks
  const cleanupInterval = setInterval(() => {
    const now = Date.now();
    for (const [key, entry] of hits.entries()) {
      if (now > entry.resetTime) {
        hits.delete(key);
      }
    }
  }, Math.max(windowMs, 30000));

  // Ensure interval does not keep process alive in test runners
  if (typeof cleanupInterval.unref === 'function') {
    cleanupInterval.unref();
  }

  return async (c, next) => {
    // In test environment, allow bypassing if explicitly desired, but test runner handles it
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';
    const key = `${ip}:${c.req.path}`;
    const now = Date.now();

    let entry = hits.get(key);

    if (!entry || now > entry.resetTime) {
      entry = {
        count: 1,
        resetTime: now + windowMs,
      };
      hits.set(key, entry);
    } else {
      entry.count += 1;
    }

    const remaining = Math.max(0, maxRequests - entry.count);
    const resetSeconds = Math.ceil((entry.resetTime - now) / 1000);

    c.header('X-RateLimit-Limit', maxRequests.toString());
    c.header('X-RateLimit-Remaining', remaining.toString());
    c.header('X-RateLimit-Reset', resetSeconds.toString());

    if (entry.count > maxRequests) {
      AuditLogger.logRateLimitExceeded(c.req.method, c.req.path, ip);
      return c.json(
        {
          success: false,
          error: 'Too Many Requests: Rate limit exceeded. Please try again later.',
        },
        429
      );
    }

    return await next();
  };
}

export const protectedRateLimiter = createRateLimiter({
  windowMs: securityConfig.rateLimit.windowMs,
  maxRequests: securityConfig.rateLimit.maxRequestsProtected,
});
