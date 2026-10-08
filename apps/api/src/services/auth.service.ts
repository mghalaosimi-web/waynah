import crypto from 'node:crypto';
import {
  prisma as defaultPrisma,
  PrismaClient,
  User,
} from '@waynah/database';
import { type Actor, PERMISSIONS } from '@waynah/shared';
import { PasswordSecurity } from '../utils/password.js';
import { AuditLogger } from '../utils/audit-logger.js';
import { EmailService } from './email.service.js';
import { securityConfig } from '../config/security.config.js';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
  emailVerified: boolean;
  emailVerifiedAt: string | null;
}

export interface AuthSuccessPayload {
  user: UserResponse;
  actor: Actor;
  token: string;
}

export class AuthService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Generates a cryptographically random 256-bit token (64 hex characters).
   */
  public static generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Hashes a raw token using SHA-256 for secure persistence at rest.
   */
  public static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  }

  /**
   * Helper to build domain Actor object from User record
   */
  public static buildActorFromUser(user: User): Actor {
    const role = user.role || 'USER';
    let actorType: Actor['type'] = 'USER';
    let permissions: string[] = [
      PERMISSIONS.PLACE_READ,
      PERMISSIONS.FAVORITE_READ,
      PERMISSIONS.FAVORITE_MANAGE,
      PERMISSIONS.REQUEST_READ,
      PERMISSIONS.REQUEST_CREATE,
      PERMISSIONS.BUSINESS_READ,
      PERMISSIONS.BUSINESS_MANAGE,
      PERMISSIONS.BUSINESS_VERIFICATION_READ,
      PERMISSIONS.BUSINESS_VERIFICATION_SUBMIT,
      PERMISSIONS.BUSINESS_CLAIMS_READ,
      PERMISSIONS.BUSINESS_CLAIMS_MANAGE,
      PERMISSIONS.NOTIFICATION_READ,
      PERMISSIONS.NOTIFICATION_MANAGE,
    ];

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      actorType = 'ADMIN';
      permissions = [
        'admin.*',
        PERMISSIONS.ADMIN_AUDIT_READ,
        PERMISSIONS.ADMIN_VERIFICATION_READ,
        PERMISSIONS.ADMIN_VERIFICATION_REVIEW,
        PERMISSIONS.PLACE_READ,
        PERMISSIONS.PLACE_UPDATE,
        PERMISSIONS.PLACE_DELETE,
        PERMISSIONS.BUSINESS_READ,
        PERMISSIONS.BUSINESS_MANAGE,
        PERMISSIONS.BUSINESS_VERIFICATION_READ,
        PERMISSIONS.BUSINESS_VERIFICATION_SUBMIT,
        PERMISSIONS.BUSINESS_CLAIMS_READ,
        PERMISSIONS.BUSINESS_CLAIMS_MANAGE,
        PERMISSIONS.FAVORITE_READ,
        PERMISSIONS.FAVORITE_MANAGE,
        PERMISSIONS.REQUEST_READ,
        PERMISSIONS.REQUEST_CREATE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.NOTIFICATION_MANAGE,
      ];
    } else if (role === 'BUSINESS_OWNER' || role === 'BUSINESS_MEMBER') {
      actorType = 'BUSINESS_MEMBER';
      permissions = [
        PERMISSIONS.PLACE_READ,
        PERMISSIONS.PLACE_UPDATE,
        PERMISSIONS.BUSINESS_READ,
        PERMISSIONS.BUSINESS_MANAGE,
        PERMISSIONS.BUSINESS_VERIFICATION_READ,
        PERMISSIONS.BUSINESS_VERIFICATION_SUBMIT,
        PERMISSIONS.BUSINESS_CLAIMS_READ,
        PERMISSIONS.BUSINESS_CLAIMS_MANAGE,
        PERMISSIONS.FAVORITE_READ,
        PERMISSIONS.FAVORITE_MANAGE,
        PERMISSIONS.REQUEST_READ,
        PERMISSIONS.REQUEST_CREATE,
        PERMISSIONS.NOTIFICATION_READ,
        PERMISSIONS.NOTIFICATION_MANAGE,
      ];
    }

    return {
      id: user.id,
      type: actorType,
      roles: [role],
      permissions,
    };
  }

  /**
   * Helper to strip sensitive fields from User record
   */
  public static toUserResponse(user: User): UserResponse {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: Boolean(user.emailVerified),
      emailVerifiedAt: user.emailVerifiedAt ? user.emailVerifiedAt.toISOString() : null,
    };
  }

  /**
   * Registers a new User account, creates an initial session, and sends verification email.
   */
  public async register(
    data: { name?: string; email?: string; password?: string },
    ip: string = '127.0.0.1'
  ): Promise<{ success: boolean; data?: AuthSuccessPayload; error?: string }> {
    const validation = PasswordSecurity.validateRegistrationInput(data);
    if (!validation.isValid || !data.email || !data.password || !data.name) {
      return { success: false, error: validation.error || 'بيانات التسجيل غير مكتملة' };
    }

    const email = data.email.trim().toLowerCase();

    // Check for existing user
    const existingUser = await this.prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      await AuditLogger.logAuthFailure('POST', '/v1/auth/register', ip, `Duplicate email registration attempt: ${email}`);
      return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل' };
    }

    // Hash password & create user
    const passwordHash = PasswordSecurity.hashPassword(data.password);
    const newUser = await this.prisma.user.create({
      data: {
        name: data.name.trim(),
        email,
        passwordHash,
        role: 'USER',
        emailVerified: false,
      },
    });

    // Create session (7 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: newUser.id,
        token,
        expiresAt,
      },
    });

    // Generate & store email verification token (24h expiry)
    if (this.prisma.accountToken) {
      const rawVerificationToken = AuthService.generateRawToken();
      const verificationTokenHash = AuthService.hashToken(rawVerificationToken);
      const verificationExpiresAt = new Date(
        Date.now() + securityConfig.accountTokens.emailVerificationExpiryMs
      );

      await this.prisma.accountToken.create({
        data: {
          userId: newUser.id,
          type: 'EMAIL_VERIFICATION',
          tokenHash: verificationTokenHash,
          expiresAt: verificationExpiresAt,
        },
      });

      await EmailService.getProvider().sendVerificationEmail(newUser.email, rawVerificationToken);
    }

    const actor = AuthService.buildActorFromUser(newUser);
    const userRes = AuthService.toUserResponse(newUser);

    await AuditLogger.logAuthSuccess('POST', '/v1/auth/register', newUser.id, actor.type, ip);

    return {
      success: true,
      data: {
        user: userRes,
        actor,
        token,
      },
    };
  }

  /**
   * Registers a new User account via an invitation token.
   * Execution is fully atomic inside a single database transaction.
   * User role is set to USER, emailVerified = true, emailVerifiedAt = now.
   * Session creation happens post-commit.
   */
  public async registerWithInvitation(
    data: { name?: string; email?: string; password?: string; token?: string },
    ip: string = '127.0.0.1'
  ): Promise<{ success: boolean; data?: AuthSuccessPayload; error?: string; errorCode?: string }> {
    if (!data.token || typeof data.token !== 'string' || !data.token.trim()) {
      return { success: false, error: 'رمز الدعوة مطلوب', errorCode: 'INVALID_OR_EXPIRED_INVITATION' };
    }

    const validation = PasswordSecurity.validateRegistrationInput(data);
    if (!validation.isValid || !data.email || !data.password || !data.name) {
      return { success: false, error: validation.error || 'بيانات التسجيل غير مكتملة', errorCode: 'INVALID_INPUT' };
    }

    const email = data.email.trim().toLowerCase();
    const tokenHash = AuthService.hashToken(data.token);

    try {
      const { newUser, invitation } = await this.prisma.$transaction(async (tx) => {
        // 1. Lock/lookup invitation
        const inv = await tx.businessInvitation.findUnique({
          where: { tokenHash },
          include: { business: true },
        });

        if (
          !inv ||
          inv.status !== 'PENDING' ||
          inv.expiresAt < new Date()
        ) {
          throw new Error('INVALID_OR_EXPIRED_INVITATION');
        }

        // 2. Email mismatch check
        if (email !== inv.email.trim().toLowerCase()) {
          throw new Error('INVITATION_EMAIL_MISMATCH');
        }

        // 3. User already exists check
        const existingUser = await tx.user.findUnique({ where: { email } });
        if (existingUser) {
          throw new Error('USER_ALREADY_EXISTS');
        }

        // 4. Create User (verified)
        const passwordHash = PasswordSecurity.hashPassword(data.password!);
        const now = new Date();
        const createdUser = await tx.user.create({
          data: {
            name: data.name!.trim(),
            email,
            passwordHash,
            role: 'USER',
            emailVerified: true,
            emailVerifiedAt: now,
          },
        });

        // 5. Create BusinessMember
        await tx.businessMember.create({
          data: {
            businessId: inv.businessId,
            userId: createdUser.id,
            role: inv.role,
          },
        });

        // 6. Mark invitation ACCEPTED
        const updatedInv = await tx.businessInvitation.update({
          where: { id: inv.id },
          data: {
            status: 'ACCEPTED',
            acceptedAt: now,
          },
        });

        return { newUser: createdUser, invitation: updatedInv };
      });

      // Session creation post-commit
      const sessionToken = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await this.prisma.session.create({
        data: {
          userId: newUser.id,
          token: sessionToken,
          expiresAt,
        },
      });

      await AuditLogger.logAuthSuccess('POST', '/v1/auth/register-with-invitation', newUser.id, 'USER', ip);
      await AuditLogger.logBusinessInvitationAccepted(
        invitation.id,
        invitation.businessId,
        newUser.id,
        email,
        invitation.role,
        ip
      );

      const actor = AuthService.buildActorFromUser(newUser);
      const userRes = AuthService.toUserResponse(newUser);

      return {
        success: true,
        data: {
          user: userRes,
          actor,
          token: sessionToken,
        },
      };
    } catch (err: any) {
      if (err.message === 'INVALID_OR_EXPIRED_INVITATION') {
        return { success: false, error: 'دعوة غير صالحة أو منتهية الصلاحية', errorCode: 'INVALID_OR_EXPIRED_INVITATION' };
      }
      if (err.message === 'INVITATION_EMAIL_MISMATCH') {
        return { success: false, error: 'البريد الإلكتروني لا يطابق البريد الإلكتروني في الدعوة', errorCode: 'INVITATION_EMAIL_MISMATCH' };
      }
      if (err.message === 'USER_ALREADY_EXISTS') {
        return { success: false, error: 'البريد الإلكتروني مستخدم بالفعل', errorCode: 'USER_ALREADY_EXISTS' };
      }
      return { success: false, error: 'فشل في إنشاء الحساب من خلال الدعوة', errorCode: 'REGISTRATION_FAILED' };
    }
  }

  /**
   * Authenticates user with email and password, creating a session.
   */
  public async login(
    data: { email?: string; password?: string },
    ip: string = '127.0.0.1'
  ): Promise<{ success: boolean; data?: AuthSuccessPayload; error?: string }> {
    const validation = PasswordSecurity.validateLoginInput(data);
    if (!validation.isValid || !data.email || !data.password) {
      return { success: false, error: validation.error || 'يرجى إدخال البريد الإلكتروني وكلمة المرور' };
    }

    const email = data.email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({ where: { email } });

    // Safe error response against account enumeration
    if (!user || !PasswordSecurity.verifyPassword(data.password, user.passwordHash)) {
      await AuditLogger.logAuthFailure('POST', '/v1/auth/login', ip, 'Invalid email or password');
      return { success: false, error: 'اسم المستخدم أو كلمة المرور غير صحيحة' };
    }

    // Create session (7 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const actor = AuthService.buildActorFromUser(user);
    const userRes = AuthService.toUserResponse(user);

    await AuditLogger.logAuthSuccess('POST', '/v1/auth/login', user.id, actor.type, ip);

    return {
      success: true,
      data: {
        user: userRes,
        actor,
        token,
      },
    };
  }

  /**
   * Authenticates user using Google OAuth via Supabase access token.
   * Verifies token cryptographically via Supabase Auth API, matches/creates WAYNAH user,
   * and issues standard WAYNAH session token.
   */
  public async authenticateGoogleUser(
    accessToken: string,
    ip: string = '127.0.0.1'
  ): Promise<{ success: boolean; data?: AuthSuccessPayload; error?: string }> {
    if (!accessToken || typeof accessToken !== 'string' || !accessToken.trim()) {
      return { success: false, error: 'توكن التوثيق مطلوب' };
    }

    const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://jtltakhmgsptnjxymdmm.supabase.co';
    const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    let supabaseUser: any = null;

    try {
      const response = await fetch(`${supabaseUrl.replace(/\/$/, '')}/auth/v1/user`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken.trim()}`,
          apikey: supabaseAnonKey,
        },
      });

      if (!response.ok) {
        await AuditLogger.logAuthFailure('POST', '/v1/auth/google', ip, 'Invalid or expired Supabase token');
        return { success: false, error: 'توكن التوثيق غير صالح أو منتهي الصلاحية' };
      }

      supabaseUser = await response.json();
    } catch {
      return { success: false, error: 'تعذر الاتصال بمزود التوثيق Supabase' };
    }

    if (!supabaseUser || !supabaseUser.id || !supabaseUser.email) {
      await AuditLogger.logAuthFailure('POST', '/v1/auth/google', ip, 'Missing identity in Supabase token');
      return { success: false, error: 'بيانات الهوية غير مكتملة في توكن التوثيق' };
    }

    // Verify provider is Google
    const provider = supabaseUser.app_metadata?.provider;
    const identities = supabaseUser.identities || [];
    const isGoogleProvider = provider === 'google' || identities.some((i: any) => i.provider === 'google');

    if (!isGoogleProvider) {
      await AuditLogger.logAuthFailure('POST', '/v1/auth/google', ip, 'Provider mismatch: non-Google token');
      return { success: false, error: 'مزود الهوية يجب أن يكون Google' };
    }

    const email = supabaseUser.email.trim().toLowerCase();
    const name =
      supabaseUser.user_metadata?.full_name ||
      supabaseUser.user_metadata?.name ||
      email.split('@')[0];

    // Find existing user or create a new user safely
    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // If user exists and email is not verified, mark it as verified since Google verified it
      if (!user.emailVerified) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: {
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
      }
    } else {
      // Create new User record with safe unusable password hash
      try {
        user = await this.prisma.user.create({
          data: {
            name,
            email,
            passwordHash: '!oauth_google_unusable_pass',
            role: 'USER',
            emailVerified: true,
            emailVerifiedAt: new Date(),
          },
        });
      } catch (err: any) {
        // Handle race condition for unique constraint P2002
        if (err?.code === 'P2002') {
          const found = await this.prisma.user.findUnique({ where: { email } });
          if (!found) {
            return { success: false, error: 'فشل إنشاء حساب المستخدم' };
          }
          user = found;
        } else {
          return { success: false, error: 'حدث خطأ أثناء حفظ بيانات المستخدم' };
        }
      }
    }

    // Issue standard WAYNAH session token (7 days validity)
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

    await this.prisma.session.create({
      data: {
        userId: user.id,
        token,
        expiresAt,
      },
    });

    const actor = AuthService.buildActorFromUser(user);
    const userRes = AuthService.toUserResponse(user);

    await AuditLogger.logAuthSuccess('POST', '/v1/auth/google', user.id, actor.type, ip);

    return {
      success: true,
      data: {
        user: userRes,
        actor,
        token,
      },
    };
  }

  /**
   * Destroys an active session (Logout).
   */
  public async logout(
    token: string,
    ip: string = '127.0.0.1'
  ): Promise<{ success: boolean; message: string }> {
    if (!token) {
      return { success: true, message: 'تم تسجيل الخروج بنجاح' };
    }

    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (session) {
        await this.prisma.session.delete({ where: { id: session.id } });
        await AuditLogger.logAuthSuccess('POST', '/v1/auth/logout', session.userId, session.user.role, ip);
      }
    } catch {
      // Ignore errors if session does not exist
    }

    return { success: true, message: 'تم تسجيل الخروج بنجاح' };
  }

  /**
   * Resolves session token to active user and Actor identity.
   */
  public async validateSession(
    token: string
  ): Promise<{ user: UserResponse; actor: Actor } | null> {
    if (!token) return null;

    try {
      const session = await this.prisma.session.findUnique({
        where: { token },
        include: { user: true },
      });

      if (!session) return null;

      if (session.expiresAt < new Date()) {
        // Asynchronously clean up expired session
        this.prisma.session.delete({ where: { id: session.id } }).catch(() => {});
        return null;
      }

      // Sliding session refresh: if remaining validity is less than 5 days, slide expiration to +7 days
      const now = Date.now();
      const fiveDaysMs = 5 * 24 * 60 * 60 * 1000;
      const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;

      if (session.expiresAt.getTime() - now < fiveDaysMs) {
        const newExpiresAt = new Date(now + sevenDaysMs);
        this.prisma.session
          .update({
            where: { id: session.id },
            data: { expiresAt: newExpiresAt },
          })
          .catch(() => {});
      }

      const actor = AuthService.buildActorFromUser(session.user);
      const user = AuthService.toUserResponse(session.user);

      return { user, actor };
    } catch {
      return null;
    }
  }

  /**
   * Confirms user email verification with raw token.
   */
  public async verifyEmail(
    token?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!token || typeof token !== 'string' || !token.trim()) {
      return { success: false, error: 'رمز التحقق مطلوب' };
    }

    const tokenHash = AuthService.hashToken(token);

    const accountToken = await this.prisma.accountToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !accountToken ||
      accountToken.type !== 'EMAIL_VERIFICATION' ||
      accountToken.usedAt !== null ||
      accountToken.expiresAt < new Date()
    ) {
      return { success: false, error: 'رمز التحقق غير صالح أو منتهي الصلاحية' };
    }

    const now = new Date();

    await this.prisma.$transaction([
      this.prisma.accountToken.update({
        where: { id: accountToken.id },
        data: { usedAt: now },
      }),
      this.prisma.user.update({
        where: { id: accountToken.userId },
        data: {
          emailVerified: true,
          emailVerifiedAt: now,
        },
      }),
    ]);

    return { success: true, message: 'تم تأكيد البريد الإلكتروني بنجاح' };
  }

  /**
   * Resends email verification token if user exists and is unverified.
   * Protects against account enumeration by returning generic success for valid email input.
   */
  public async resendVerification(
    email?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!email || typeof email !== 'string' || !email.trim()) {
      return { success: false, error: 'البريد الإلكتروني مطلوب' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'صيغة البريد الإلكتروني غير صحيحة' };
    }

    const genericSuccess = {
      success: true,
      message: 'إذا كان البريد الإلكتروني متاحاً وغير مفعل، تم إرسال رابط التأكيد',
    };

    try {
      const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user || user.emailVerified) {
        return genericSuccess;
      }

      // Delete older unused verification tokens for this user
      await this.prisma.accountToken.deleteMany({
        where: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
        },
      });

      const rawToken = AuthService.generateRawToken();
      const tokenHash = AuthService.hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + securityConfig.accountTokens.emailVerificationExpiryMs
      );

      await this.prisma.accountToken.create({
        data: {
          userId: user.id,
          type: 'EMAIL_VERIFICATION',
          tokenHash,
          expiresAt,
        },
      });

      await EmailService.getProvider().sendVerificationEmail(user.email, rawToken);

      return genericSuccess;
    } catch {
      return genericSuccess;
    }
  }

  /**
   * Initiates password recovery flow.
   * Protects against account enumeration by returning generic success for valid email input.
   */
  public async forgotPassword(
    email?: string
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!email || typeof email !== 'string' || !email.trim()) {
      return { success: false, error: 'البريد الإلكتروني مطلوب' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const normalizedEmail = email.trim().toLowerCase();

    if (!emailRegex.test(normalizedEmail)) {
      return { success: false, error: 'صيغة البريد الإلكتروني غير صحيحة' };
    }

    const genericSuccess = {
      success: true,
      message: 'إذا كان البريد الإلكتروني مسجلاً، فقد تم إرسال تعليمات إعادة ضبط كلمة المرور',
    };

    try {
      const user = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
      if (!user) {
        return genericSuccess;
      }

      // Delete older unused reset tokens for this user
      await this.prisma.accountToken.deleteMany({
        where: {
          userId: user.id,
          type: 'PASSWORD_RESET',
        },
      });

      const rawToken = AuthService.generateRawToken();
      const tokenHash = AuthService.hashToken(rawToken);
      const expiresAt = new Date(
        Date.now() + securityConfig.accountTokens.passwordResetExpiryMs
      );

      await this.prisma.accountToken.create({
        data: {
          userId: user.id,
          type: 'PASSWORD_RESET',
          tokenHash,
          expiresAt,
        },
      });

      await EmailService.getProvider().sendPasswordResetEmail(user.email, rawToken);

      return genericSuccess;
    } catch {
      return genericSuccess;
    }
  }

  /**
   * Resets user password using a valid reset token and REVOKES ALL ACTIVE SESSIONS for the user.
   */
  public async resetPassword(
    data: { token?: string; newPassword?: string },
    ip: string = '127.0.0.1'
  ): Promise<{ success: boolean; message?: string; error?: string }> {
    if (!data.token || typeof data.token !== 'string' || !data.token.trim()) {
      return { success: false, error: 'رمز إعادة الضبط مطلوب' };
    }

    if (!data.newPassword || typeof data.newPassword !== 'string') {
      return { success: false, error: 'كلمة المرور الجديدة مطلوبة' };
    }

    if (data.newPassword.length < 8) {
      return { success: false, error: 'كلمة المرور يجب أن لا تقل عن 8 خانات' };
    }

    const tokenHash = AuthService.hashToken(data.token);

    const accountToken = await this.prisma.accountToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (
      !accountToken ||
      accountToken.type !== 'PASSWORD_RESET' ||
      accountToken.usedAt !== null ||
      accountToken.expiresAt < new Date()
    ) {
      return { success: false, error: 'رمز إعادة الضبط غير صالح أو منتهي الصلاحية' };
    }

    const now = new Date();
    const newPasswordHash = PasswordSecurity.hashPassword(data.newPassword);

    // Atomically update password, mark token used, and PURGE ALL SESSIONS for userId
    await this.prisma.$transaction([
      this.prisma.user.update({
        where: { id: accountToken.userId },
        data: { passwordHash: newPasswordHash },
      }),
      this.prisma.accountToken.update({
        where: { id: accountToken.id },
        data: { usedAt: now },
      }),
      this.prisma.session.deleteMany({
        where: { userId: accountToken.userId },
      }),
    ]);

    await AuditLogger.logAuthSuccess('POST', '/v1/auth/reset-password', accountToken.userId, accountToken.user.role, ip);

    return {
      success: true,
      message: 'تم تغيير كلمة المرور بنجاح. يمكنك الآن تسجيل الدخول بكلمة المرور الجديدة',
    };
  }
}
