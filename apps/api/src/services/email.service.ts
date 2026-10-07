import crypto from 'node:crypto';

export type EmailType = 'EMAIL_VERIFICATION' | 'PASSWORD_RESET' | 'BUSINESS_INVITATION';

export interface SentEmailMessage {
  id: string;
  to: string;
  type: EmailType;
  rawToken: string;
  subject: string;
  businessName?: string;
  role?: string;
  inviterName?: string;
  sentAt: Date;
}

export interface IEmailProvider {
  sendVerificationEmail(to: string, rawToken: string): Promise<boolean>;
  sendPasswordResetEmail(to: string, rawToken: string): Promise<boolean>;
  sendBusinessInvitationEmail(
    to: string,
    rawToken: string,
    businessName: string,
    role: string,
    inviterName: string
  ): Promise<boolean>;
}

/**
 * InMemoryEmailProvider for development and test execution.
 * Stores sent messages in memory for test assertions without external API dependencies.
 * RAW TOKENS ARE NEVER LOGGED TO CONSOLE OR AUDIT LOGS.
 */
export class InMemoryEmailProvider implements IEmailProvider {
  private sentEmails: SentEmailMessage[] = [];

  public async sendVerificationEmail(to: string, rawToken: string): Promise<boolean> {
    const message: SentEmailMessage = {
      id: `msg-${crypto.randomBytes(8).toString('hex')}`,
      to: to.trim().toLowerCase(),
      type: 'EMAIL_VERIFICATION',
      rawToken,
      subject: 'تأكيد البريد الإلكتروني - WAYNAH',
      sentAt: new Date(),
    };
    this.sentEmails.push(message);
    return true;
  }

  public async sendPasswordResetEmail(to: string, rawToken: string): Promise<boolean> {
    const message: SentEmailMessage = {
      id: `msg-${crypto.randomBytes(8).toString('hex')}`,
      to: to.trim().toLowerCase(),
      type: 'PASSWORD_RESET',
      rawToken,
      subject: 'إعادة ضبط كلمة المرور - WAYNAH',
      sentAt: new Date(),
    };
    this.sentEmails.push(message);
    return true;
  }

  public async sendBusinessInvitationEmail(
    to: string,
    rawToken: string,
    businessName: string,
    role: string,
    inviterName: string
  ): Promise<boolean> {
    const message: SentEmailMessage = {
      id: `msg-${crypto.randomBytes(8).toString('hex')}`,
      to: to.trim().toLowerCase(),
      type: 'BUSINESS_INVITATION',
      rawToken,
      subject: `دعوة للانضمام إلى فريق ${businessName} - WAYNAH`,
      businessName,
      role,
      inviterName,
      sentAt: new Date(),
    };
    this.sentEmails.push(message);
    return true;
  }

  /**
   * Test inspection helpers
   */
  public getSentEmails(): SentEmailMessage[] {
    return [...this.sentEmails];
  }

  public getSentEmailsTo(to: string): SentEmailMessage[] {
    const normalized = to.trim().toLowerCase();
    return this.sentEmails.filter((m) => m.to === normalized);
  }

  public getLastSentEmail(): SentEmailMessage | undefined {
    return this.sentEmails[this.sentEmails.length - 1];
  }

  public clear(): void {
    this.sentEmails = [];
  }
}

/**
 * Core EmailService Singleton / Factory
 */
export class EmailService {
  private static instanceProvider: InMemoryEmailProvider | null = null;

  public static getProvider(): InMemoryEmailProvider {
    if (!EmailService.instanceProvider) {
      EmailService.instanceProvider = new InMemoryEmailProvider();
    }
    return EmailService.instanceProvider;
  }

  public static resetProvider(): void {
    if (EmailService.instanceProvider) {
      EmailService.instanceProvider.clear();
    }
  }
}
