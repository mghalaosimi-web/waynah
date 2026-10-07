import { Hono } from 'hono';
import { getCookie, setCookie } from 'hono/cookie';
import type { PrismaClient } from '@waynah/database';
import { ANONYMOUS_ACTOR } from '@waynah/shared';
import { ApiResponse } from '../../utils/api-response.js';
import { AuthService } from '../../services/auth.service.js';
import { createRateLimiter } from '../../middleware/rate-limit.middleware.js';
import { createAuthMiddleware } from '../../middleware/auth.middleware.js';

export function createAuthRouter(prismaClient?: PrismaClient) {
  const router = new Hono();
  const authService = new AuthService(prismaClient);
  const authMiddleware = createAuthMiddleware(prismaClient);

  // Rate Limiter for sensitive authentication endpoints (10 attempts per minute)
  const authRateLimiter = createRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
  });

  // Rate Limiter for recovery and resend requests (3 attempts per 15 minutes)
  const recoveryRateLimiter = createRateLimiter({
    windowMs: 15 * 60 * 1000,
    maxRequests: 3,
  });

  /**
   * POST /v1/auth/register
   * Creates a new User account and sets a session cookie.
   */
  router.post('/register', authRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      const result = await authService.register(body, ip);

      if (!result.success || !result.data) {
        return c.json(
          ApiResponse.error(result.error || 'فشل إنشاء الحساب', 'REGISTRATION_FAILED'),
          400
        );
      }

      // Set HttpOnly session cookie
      setCookie(c, 'waynah_session', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return c.json(
        ApiResponse.success({
          user: result.data.user,
          actor: result.data.actor,
          token: result.data.token,
        }),
        201
      );
    } catch (err) {
      return c.json(ApiResponse.error('حدث خطأ في طلب التسجيل', 'SERVER_ERROR'), 500);
    }
  });

  /**
   * POST /v1/auth/register-with-invitation
   * Registers a new User account via an invitation token and marks email verified.
   */
  router.post('/register-with-invitation', authRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      const result = await authService.registerWithInvitation(body, ip);

      if (!result.success || !result.data) {
        const statusCode = result.errorCode === 'INVITATION_EMAIL_MISMATCH' ? 403 : 400;
        return c.json(
          ApiResponse.error(result.error || 'فشل إنشاء الحساب من خلال الدعوة', result.errorCode || 'REGISTRATION_FAILED'),
          statusCode
        );
      }

      // Set HttpOnly session cookie
      setCookie(c, 'waynah_session', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return c.json(
        ApiResponse.success({
          user: result.data.user,
          actor: result.data.actor,
          token: result.data.token,
        }),
        201
      );
    } catch (err) {
      return c.json(ApiResponse.error('حدث خطأ في طلب التسجيل بالدعوة', 'SERVER_ERROR'), 500);
    }
  });

  /**
   * POST /v1/auth/login
   * Authenticates user and sets a session cookie.
   */
  router.post('/login', authRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      const result = await authService.login(body, ip);

      if (!result.success || !result.data) {
        return c.json(
          ApiResponse.error(result.error || 'فشل تسجيل الدخول', 'INVALID_CREDENTIALS'),
          401
        );
      }

      // Set HttpOnly session cookie
      setCookie(c, 'waynah_session', result.data.token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'Lax',
        path: '/',
        maxAge: 7 * 24 * 60 * 60,
      });

      return c.json(
        ApiResponse.success({
          user: result.data.user,
          actor: result.data.actor,
          token: result.data.token,
        })
      );
    } catch (err) {
      return c.json(ApiResponse.error('حدث خطأ أثناء تسجيل الدخول', 'SERVER_ERROR'), 500);
    }
  });

  /**
   * POST /v1/auth/logout
   * Invalidates active session and clears session cookie.
   */
  router.post('/logout', async (c) => {
    const authHeader = c.req.header('Authorization');
    const cookieToken = getCookie(c, 'waynah_session');
    const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

    let token = '';
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.substring(7).trim();
    } else if (cookieToken) {
      token = cookieToken.trim();
    }

    await authService.logout(token, ip);

    // Clear session cookie
    setCookie(c, 'waynah_session', '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'Lax',
      path: '/',
      maxAge: 0,
    });

    return c.json(
      ApiResponse.success({
        message: 'تم تسجيل الخروج بنجاح',
      })
    );
  });

  /**
   * GET /v1/auth/me
   * Returns current active User and Actor identity.
   */
  router.get('/me', authMiddleware, async (c) => {
    const actor = c.get('actor') || ANONYMOUS_ACTOR;
    const user = c.get('user') || null;
    const authStatus = c.get('authStatus');

    const isAuthenticated = authStatus === 'AUTHENTICATED' && actor.type !== 'ANONYMOUS';

    return c.json(
      ApiResponse.success({
        authenticated: isAuthenticated,
        actor,
        user,
      })
    );
  });

  /**
   * POST /v1/auth/verify-email
   * Confirms email address using raw token.
   */
  router.post('/verify-email', authRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = await authService.verifyEmail(body.token);

      if (!result.success) {
        return c.json(
          ApiResponse.error(result.error || 'فشل تأكيد البريد الإلكتروني', 'VERIFICATION_FAILED'),
          400
        );
      }

      return c.json(ApiResponse.success({ message: result.message }));
    } catch {
      return c.json(ApiResponse.error('حدث خطأ أثناء تأكيد البريد الإلكتروني', 'SERVER_ERROR'), 500);
    }
  });

  /**
   * POST /v1/auth/resend-verification
   * Resends email verification link to user. Anti-enumeration protected.
   */
  router.post('/resend-verification', recoveryRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = await authService.resendVerification(body.email);

      if (!result.success) {
        return c.json(
          ApiResponse.error(result.error || 'صيغة البريد الإلكتروني غير صحيحة', 'INVALID_INPUT'),
          400
        );
      }

      return c.json(ApiResponse.success({ message: result.message }));
    } catch {
      return c.json(ApiResponse.error('حدث خطأ أثناء طلب تأكيد البريد', 'SERVER_ERROR'), 500);
    }
  });

  /**
   * POST /v1/auth/forgot-password
   * Initiates password recovery. Anti-enumeration protected.
   */
  router.post('/forgot-password', recoveryRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const result = await authService.forgotPassword(body.email);

      if (!result.success) {
        return c.json(
          ApiResponse.error(result.error || 'صيغة البريد الإلكتروني غير صحيحة', 'INVALID_INPUT'),
          400
        );
      }

      return c.json(ApiResponse.success({ message: result.message }));
    } catch {
      return c.json(ApiResponse.error('حدث خطأ أثناء طلب استعادة كلمة المرور', 'SERVER_ERROR'), 500);
    }
  });

  /**
   * POST /v1/auth/reset-password
   * Resets password using valid token and purges user sessions.
   */
  router.post('/reset-password', authRateLimiter, async (c) => {
    try {
      const body = await c.req.json().catch(() => ({}));
      const ip = c.req.header('x-forwarded-for') || c.req.header('x-real-ip') || '127.0.0.1';

      const result = await authService.resetPassword(body, ip);

      if (!result.success) {
        return c.json(
          ApiResponse.error(result.error || 'فشل إعادة ضبط كلمة المرور', 'RESET_FAILED'),
          400
        );
      }

      return c.json(ApiResponse.success({ message: result.message }));
    } catch {
      return c.json(ApiResponse.error('حدث خطأ أثناء إعادة ضبط كلمة المرور', 'SERVER_ERROR'), 500);
    }
  });

  return router;
}
