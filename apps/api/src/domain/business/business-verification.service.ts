import {
  prisma as defaultPrisma,
  type PrismaClient,
  BusinessVerificationStatus,
  BusinessRole,
} from '@waynah/database';

const STATUS_UNVERIFIED = (BusinessVerificationStatus?.UNVERIFIED || 'UNVERIFIED') as BusinessVerificationStatus;
const STATUS_PENDING = (BusinessVerificationStatus?.PENDING || 'PENDING') as BusinessVerificationStatus;
const STATUS_VERIFIED = (BusinessVerificationStatus?.VERIFIED || 'VERIFIED') as BusinessVerificationStatus;
const STATUS_REJECTED = (BusinessVerificationStatus?.REJECTED || 'REJECTED') as BusinessVerificationStatus;
const OWNER_ROLE = (BusinessRole?.OWNER || 'OWNER') as BusinessRole;

export interface SubmitVerificationInput {
  notes?: string | null;
}

export class BusinessVerificationService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Retrieves current verification status for an authorized business member/owner or admin.
   */
  public async getVerificationStatus(userId: string, businessId: string, isAdmin = false) {
    if (!isAdmin) {
      const membership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }
    }

    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const verification = await this.prisma.businessVerification.findUnique({
      where: { businessId },
    });

    if (!verification) {
      return {
        id: null,
        businessId,
        status: STATUS_UNVERIFIED,
        notes: null,
        submittedAt: null,
        reviewedAt: null,
        rejectionReason: null,
        createdAt: null,
        updatedAt: null,
      };
    }

    return verification;
  }

  /**
   * Submits a verification request for a Business.
   * Requires Business OWNER role for authorization (IDOR protected).
   */
  public async submitVerificationRequest(
    userId: string,
    businessId: string,
    input?: SubmitVerificationInput,
    isAdmin = false
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    // IDOR & Membership authorization check: Server-side identity resolution
    if (!isAdmin) {
      const membership = await this.prisma.businessMember.findUnique({
        where: {
          businessId_userId: {
            businessId,
            userId,
          },
        },
      });

      if (!membership) {
        throw new Error('NOT_BUSINESS_MEMBER');
      }

      if (membership.role !== OWNER_ROLE) {
        throw new Error('OWNER_ONLY_VERIFICATION_SUBMISSION');
      }
    }

    // Check existing verification status
    const existing = await this.prisma.businessVerification.findUnique({
      where: { businessId },
    });

    if (existing?.status === STATUS_PENDING) {
      throw new Error('DUPLICATE_VERIFICATION_REQUEST');
    }

    if (existing?.status === STATUS_VERIFIED) {
      throw new Error('ALREADY_VERIFIED');
    }

    const notes = input?.notes ? input.notes.trim() : null;

    // Create or update verification record to PENDING
    const verification = await this.prisma.businessVerification.upsert({
      where: { businessId },
      create: {
        businessId,
        status: STATUS_PENDING,
        notes,
        submittedAt: new Date(),
      },
      update: {
        status: STATUS_PENDING,
        notes,
        submittedAt: new Date(),
        reviewedAt: null,
        rejectionReason: null,
        reviewerId: null,
      },
    });

    return verification;
  }

  /**
   * Admin review preparation helper (for administrative actions / test fixtures)
   */
  public async reviewVerificationRequest(
    businessId: string,
    status: BusinessVerificationStatus,
    rejectionReason?: string | null,
    reviewerId?: string | null
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    return await this.prisma.businessVerification.upsert({
      where: { businessId },
      create: {
        businessId,
        status,
        rejectionReason: status === STATUS_REJECTED ? rejectionReason || null : null,
        reviewedAt: new Date(),
        reviewerId: reviewerId || null,
      },
      update: {
        status,
        rejectionReason: status === STATUS_REJECTED ? rejectionReason || null : null,
        reviewedAt: new Date(),
        reviewerId: reviewerId || null,
      },
    });
  }

  /**
   * Returns clean public verification state for a business.
   * Strips all private metadata, reviewer details, and internal notes.
   */
  public async getPublicVerificationState(businessId: string) {
    const verification = await this.prisma.businessVerification.findUnique({
      where: { businessId },
      select: {
        status: true,
      },
    });

    const status = verification?.status || STATUS_UNVERIFIED;

    return {
      verified: status === STATUS_VERIFIED,
      verificationStatus: status,
    };
  }
}
