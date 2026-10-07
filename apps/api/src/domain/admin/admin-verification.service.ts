import {
  prisma as defaultPrisma,
  type PrismaClient,
  BusinessVerificationStatus,
} from '@waynah/database';

const STATUS_PENDING = (BusinessVerificationStatus?.PENDING || 'PENDING') as BusinessVerificationStatus;
const STATUS_VERIFIED = (BusinessVerificationStatus?.VERIFIED || 'VERIFIED') as BusinessVerificationStatus;
const STATUS_REJECTED = (BusinessVerificationStatus?.REJECTED || 'REJECTED') as BusinessVerificationStatus;

export interface ReviewVerificationInput {
  status: BusinessVerificationStatus;
  rejectionReason?: string | null;
}

export class AdminVerificationService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Lists verification requests with optional status filtering.
   */
  public async listVerifications(statusFilter?: string) {
    const where: Record<string, any> = {};
    if (statusFilter && ['PENDING', 'VERIFIED', 'REJECTED', 'UNVERIFIED'].includes(statusFilter)) {
      where.status = statusFilter;
    }

    const verifications = await this.prisma.businessVerification.findMany({
      where,
      include: {
        business: {
          include: {
            places: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                verificationStatus: true,
              },
            },
            _count: {
              select: { members: true, places: true },
            },
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return verifications;
  }

  /**
   * Retrieves single verification detail record by ID or Business ID.
   */
  public async getVerificationById(idOrBusinessId: string) {
    const verification = await this.prisma.businessVerification.findFirst({
      where: {
        OR: [{ id: idOrBusinessId }, { businessId: idOrBusinessId }],
      },
      include: {
        business: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
            places: {
              select: {
                id: true,
                nameAr: true,
                nameEn: true,
                address: true,
                verificationStatus: true,
              },
            },
          },
        },
      },
    });

    return verification;
  }

  /**
   * Returns verification overview statistics for admin dashboard metrics.
   */
  public async getAdminVerificationStats() {
    const [pendingCount, verifiedCount, rejectedCount, totalBusinessesCount] = await Promise.all([
      this.prisma.businessVerification.count({ where: { status: STATUS_PENDING } }),
      this.prisma.businessVerification.count({ where: { status: STATUS_VERIFIED } }),
      this.prisma.businessVerification.count({ where: { status: STATUS_REJECTED } }),
      this.prisma.business.count(),
    ]);

    return {
      pendingCount,
      verifiedCount,
      rejectedCount,
      totalBusinessesCount,
    };
  }

  /**
   * Server-authoritative review of a PENDING Business Verification request.
   * Atomic state transition with strict validation:
   * - Must be PENDING state.
   * - Rejection requires non-empty reason.
   * - Timestamp & reviewerId are server-generated.
   */
  public async reviewVerification(
    reviewerId: string,
    idOrBusinessId: string,
    input: ReviewVerificationInput
  ) {
    const verification = await this.prisma.businessVerification.findFirst({
      where: {
        OR: [{ id: idOrBusinessId }, { businessId: idOrBusinessId }],
      },
      include: {
        business: true,
      },
    });

    if (!verification) {
      throw new Error('VERIFICATION_NOT_FOUND');
    }

    // State Transition Rule: Review is strictly allowed ONLY from PENDING state
    if (verification.status !== STATUS_PENDING) {
      throw new Error('INVALID_STATE_TRANSITION');
    }

    const targetStatus = input.status;
    if (targetStatus !== STATUS_VERIFIED && targetStatus !== STATUS_REJECTED) {
      throw new Error('INVALID_STATUS');
    }

    // Rejection Reason Validation Rule: Required and non-empty for REJECTED status
    let rejectionReason: string | null = null;
    if (targetStatus === STATUS_REJECTED) {
      if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
        throw new Error('REJECTION_REASON_REQUIRED');
      }
      rejectionReason = input.rejectionReason.trim();
    }

    // Atomic transaction for status transition
    const reviewedAt = new Date();

    const updated = await this.prisma.businessVerification.update({
      where: { id: verification.id },
      data: {
        status: targetStatus,
        reviewedAt,
        reviewerId,
        rejectionReason: targetStatus === STATUS_REJECTED ? rejectionReason : null,
      },
      include: {
        business: true,
      },
    });

    // GAP-DB-02: Write historical audit trail record
    if (this.prisma.verificationLog) {
      await this.prisma.verificationLog.create({
        data: {
          businessId: verification.businessId,
          verificationId: verification.id,
          status: targetStatus,
          actorId: reviewerId,
          actorRole: 'ADMIN',
          action: targetStatus === STATUS_VERIFIED ? 'APPROVE' : 'REJECT',
          rejectionReason: targetStatus === STATUS_REJECTED ? rejectionReason : null,
        },
      });
    }

    return updated;
  }
}
