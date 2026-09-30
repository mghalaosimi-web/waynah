import crypto from 'node:crypto';
import {
  prisma as defaultPrisma,
  PrismaClient,
  User,
} from '@waynah/database';
import { type Actor, PERMISSIONS } from '@waynah/shared';
import { PasswordSecurity } from '../utils/password.js';
import { AuditLogger } from '../utils/audit-logger.js';

export interface UserResponse {
  id: string;
  name: string;
  email: string;
  role: string;
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
    ];

    if (role === 'ADMIN' || role === 'SUPER_ADMIN') {
      actorType = 'ADMIN';
      permissions = [
        'admin.*',
        PERMISSIONS.ADMIN_VERIFICATION_READ,
        PERMISSIONS.ADMIN_VERIFICATION_REVIEW,
        PERMISSIONS.PLACE_READ,
        PERMISSIONS.PLACE_UPDATE,
        PERMISSIONS.PLACE_DELETE,
        PERMISSIONS.BUSINESS_READ,
        PERMISSIONS.BUSINESS_MANAGE,
        PERMISSIONS.BUSINESS_VERIFICATION_READ,
        PERMISSIONS.BUSINESS_VERIFICATION_SUBMIT,
        PERMISSIONS.FAVORITE_READ,
        PERMISSIONS.FAVORITE_MANAGE,
        PERMISSIONS.REQUEST_READ,
        PERMISSIONS.REQUEST_CREATE,
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
        PERMISSIONS.FAVORITE_READ,
        PERMISSIONS.FAVORITE_MANAGE,
        PERMISSIONS.REQUEST_READ,
        PERMISSIONS.REQUEST_CREATE,
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
    };
  }

  /**
   * Registers a new User account and starts a session.
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
      AuditLogger.logAuthFailure('POST', '/v1/auth/register', ip, `Duplicate email registration attempt: ${email}`);
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

    const actor = AuthService.buildActorFromUser(newUser);
    const userRes = AuthService.toUserResponse(newUser);

    AuditLogger.logAuthSuccess('POST', '/v1/auth/register', newUser.id, actor.type, ip);

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
      AuditLogger.logAuthFailure('POST', '/v1/auth/login', ip, 'Invalid email or password');
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

    AuditLogger.logAuthSuccess('POST', '/v1/auth/login', user.id, actor.type, ip);

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
        AuditLogger.logAuthSuccess('POST', '/v1/auth/logout', session.userId, session.user.role, ip);
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

      const actor = AuthService.buildActorFromUser(session.user);
      const user = AuthService.toUserResponse(session.user);

      return { user, actor };
    } catch {
      return null;
    }
  }
}
