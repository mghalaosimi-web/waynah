import {
  prisma as defaultPrisma,
  type PrismaClient,
  BranchClaimStatus,
  BusinessRole,
  BusinessVerificationStatus,
} from '@waynah/database';

const OWNER_ROLE = (BusinessRole?.OWNER || 'OWNER') as BusinessRole;
const MANAGER_ROLE = (BusinessRole?.MANAGER || 'MANAGER') as BusinessRole;

const STATUS_VERIFIED = (BusinessVerificationStatus?.VERIFIED || 'VERIFIED') as BusinessVerificationStatus;
const STATUS_PENDING = (BusinessVerificationStatus?.PENDING || 'PENDING') as BusinessVerificationStatus;

const ACTIVE_CLAIM_STATUSES: BranchClaimStatus[] = ['PENDING_REVIEW', 'PENDING_DISPUTE'];

export interface SubmitClaimInput {
  placeId: string;
  notes?: string | null;
}

export class BranchClaimService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Submits a new branch claim for a business.
   * Requires OWNER or MANAGER membership role and PENDING/VERIFIED business verification status.
   */
  public async submitClaim(
    userId: string,
    businessId: string,
    input: SubmitClaimInput,
    isAdmin = false
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: { verification: true },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    // 1. Membership & Authorization Check (OWNER or MANAGER allowed)
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

      if (membership.role !== OWNER_ROLE && membership.role !== MANAGER_ROLE) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }
    }

    // 2. Verification Prerequisite Check (PENDING or VERIFIED allowed)
    const verificationStatus = business.verification?.status || 'UNVERIFIED';
    if (verificationStatus !== STATUS_PENDING && verificationStatus !== STATUS_VERIFIED) {
      throw new Error('BUSINESS_VERIFICATION_REQUIRED');
    }

    // 3. Place Validation
    const place = await this.prisma.place.findUnique({
      where: { id: input.placeId },
    });

    if (!place) {
      throw new Error('PLACE_NOT_FOUND');
    }

    // 4. Already-Linked Place Checks
    if (place.businessId === businessId) {
      throw new Error('PLACE_ALREADY_LINKED');
    }

    if (place.businessId !== null && place.businessId !== businessId) {
      throw new Error('PLACE_LINKED_TO_OTHER_BUSINESS');
    }

    // 5. Active Claim Duplicate Check
    const existingActiveClaim = await this.prisma.branchClaim.findFirst({
      where: {
        businessId,
        placeId: input.placeId,
        status: { in: ACTIVE_CLAIM_STATUSES },
      },
    });

    if (existingActiveClaim) {
      throw new Error('DUPLICATE_ACTIVE_CLAIM');
    }

    // 6. Create BranchClaim record
    const notes = input.notes ? input.notes.trim() : null;

    try {
      const claim = await this.prisma.branchClaim.create({
        data: {
          businessId,
          placeId: input.placeId,
          claimantId: userId,
          status: 'PENDING_REVIEW',
          notes,
          reviewerId: null,
          rejectionReason: null,
          submittedAt: new Date(),
          reviewedAt: null,
        },
        include: {
          place: {
            select: {
              id: true,
              nameAr: true,
              nameEn: true,
              address: true,
              verificationStatus: true,
            },
          },
          claimant: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      });

      return claim;
    } catch (err: any) {
      if (err.code === 'P2002' || err.message?.includes('branch_claims_active_business_place_idx')) {
        throw new Error('DUPLICATE_ACTIVE_CLAIM');
      }
      throw err;
    }
  }

  /**
   * Retrieves all branch claims for a specific Business.
   * Requires Business membership (OWNER, MANAGER, or MEMBER) or Admin access.
   */
  public async listClaims(userId: string, businessId: string, isAdmin = false) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

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

    const claims = await this.prisma.branchClaim.findMany({
      where: { businessId },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            address: true,
            verificationStatus: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return claims;
  }

  /**
   * Cancels an active branch claim.
   * Only active claims (PENDING_REVIEW, PENDING_DISPUTE) can be cancelled.
   * Caller must be OWNER or MANAGER of the Business, and must be the original claimant.
   */
  public async cancelClaim(
    userId: string,
    businessId: string,
    claimId: string,
    isAdmin = false
  ) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const claim = await this.prisma.branchClaim.findUnique({
      where: { id: claimId },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            address: true,
            verificationStatus: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    if (!claim || claim.businessId !== businessId) {
      throw new Error('CLAIM_NOT_FOUND');
    }

    // Membership & Authorization Check
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

      if (membership.role !== OWNER_ROLE && membership.role !== MANAGER_ROLE) {
        throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
      }

      if (claim.claimantId !== userId) {
        throw new Error('CANCELLER_MUST_BE_CLAIMANT');
      }
    }

    // Cancellation State Rule: Only active claims can be cancelled
    if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      throw new Error('CANNOT_CANCEL_TERMINAL_CLAIM');
    }

    // Update claim status to CANCELLED (Historical record is preserved, Place.businessId unmutated)
    const updatedClaim = await this.prisma.branchClaim.update({
      where: { id: claimId },
      data: {
        status: 'CANCELLED',
      },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            address: true,
            verificationStatus: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    return updatedClaim;
  }
}
