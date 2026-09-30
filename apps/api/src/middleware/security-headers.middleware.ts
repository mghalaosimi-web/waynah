import { secureHeaders } from 'hono/secure-headers';
import type { MiddlewareHandler } from 'hono';

/**
 * Security Headers Middleware
 *
 * Configures essential HTTP security headers suitable for API services:
 * - Prevents MIME-sniffing (X-Content-Type-Options: nosniff)
 * - Restricts framing/clickjacking (X-Frame-Options: DENY)
 * - Enables XSS filtering (X-XSS-Protection)
 * - Controls referrer information (Referrer-Policy)
 */
export const securityHeadersMiddleware: MiddlewareHandler = secureHeaders({
  xFrameOptions: 'DENY',
  xContentTypeOptions: 'nosniff',
  xXssProtection: '1; mode=block',
  referrerPolicy: 'strict-origin-when-cross-origin',
});
