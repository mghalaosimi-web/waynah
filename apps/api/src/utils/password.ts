import crypto from 'node:crypto';

/**
 * WAYNAH Password Security Utility
 *
 * Enforces strong password hashing using Node.js crypto.scryptSync with random salt.
 * Performs constant-time comparison to prevent timing attacks.
 * Passwords are NEVER stored in plaintext.
 */

export class PasswordSecurity {
  /**
   * Hashes a password with a randomly generated 16-byte salt.
   * Returns salt:hash format.
   */
  public static hashPassword(password: string): string {
    const salt = crypto.randomBytes(16).toString('hex');
    const derivedKey = crypto.scryptSync(password, salt, 64);
    return `${salt}:${derivedKey.toString('hex')}`;
  }

  /**
   * Verifies a candidate password against a stored salt:hash string.
   */
  public static verifyPassword(password: string, storedHash: string): boolean {
    try {
      const parts = storedHash.split(':');
      if (parts.length !== 2) return false;

      const salt = parts[0];
      const key = parts[1];
      if (!salt || !key) return false;

      const keyBuffer = Buffer.from(key, 'hex');
      const derivedKey = crypto.scryptSync(password, salt, keyBuffer.length);

      return crypto.timingSafeEqual(keyBuffer, derivedKey);
    } catch {
      return false;
    }
  }

  /**
   * Validates user registration fields.
   */
  public static validateRegistrationInput(data: {
    name?: string;
    email?: string;
    password?: string;
  }): { isValid: boolean; error?: string } {
    if (!data.name || typeof data.name !== 'string' || data.name.trim().length < 2) {
      return { isValid: false, error: 'الاسم يجب أن يحتوي على حرفين على الأقل' };
    }

    if (!data.email || typeof data.email !== 'string') {
      return { isValid: false, error: 'البريد الإلكتروني مطلوب' };
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email.trim())) {
      return { isValid: false, error: 'صيغة البريد الإلكتروني غير صحيحة' };
    }

    if (!data.password || typeof data.password !== 'string') {
      return { isValid: false, error: 'كلمة المرور مطلوبة' };
    }

    if (data.password.length < 8) {
      return { isValid: false, error: 'كلمة المرور يجب أن لا تقل عن 8 خانات' };
    }

    return { isValid: true };
  }

  /**
   * Validates login input fields.
   */
  public static validateLoginInput(data: {
    email?: string;
    password?: string;
  }): { isValid: boolean; error?: string } {
    if (!data.email || typeof data.email !== 'string' || !data.password || typeof data.password !== 'string') {
      return { isValid: false, error: 'البريد الإلكتروني وكلمة المرور مطلوبان' };
    }
    return { isValid: true };
  }
}
