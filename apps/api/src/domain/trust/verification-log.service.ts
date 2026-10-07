import {
  prisma as defaultPrisma,
  type PrismaClient,
  BusinessVerificationStatus,
} from '@waynah/database';

export interface CreateVerificationLogInput {
  businessId: string;
  verificationId?: string | null;
  status: BusinessVerificationStatus;
  actorId: string;
  actorRole?: string;
  action: string;
  notes?: string | null;
  rejectionReason?: string | null;
}

export class VerificationLogService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Log a verification historical event (GAP-DB-02 implementation).
   */
  public async logEvent(input: CreateVerificationLogInput) {
    return await this.prisma.verificationLog.create({
      data: {
        businessId: input.businessId,
        verificationId: input.verificationId || null,
        status: input.status,
        actorId: input.actorId,
        actorRole: input.actorRole || 'USER',
        action: input.action,
        notes: input.notes || null,
        rejectionReason: input.rejectionReason || null,
      },
    });
  }

  /**
   * Retrieve complete historical event log for a business verification lifecycle.
   */
  public async getHistoryByBusinessId(businessId: string) {
    return await this.prisma.verificationLog.findMany({
      where: { businessId },
      orderBy: { createdAt: 'desc' },
    });
  }
}
