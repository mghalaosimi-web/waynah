import {
  prisma as defaultPrisma,
  type PrismaClient,
  BranchClaimStatus,
} from '@waynah/database';

const ACTIVE_CLAIM_STATUSES: BranchClaimStatus[] = ['PENDING_REVIEW', 'PENDING_DISPUTE'];

export interface ReviewClaimInput {
  action: 'APPROVE' | 'REJECT';
  rejectionReason?: string | null;
}

export interface ReviewClaimResult {
  updatedClaim: any;
  eventType: 'BRANCH_LINK_ESTABLISHED' | 'BRANCH_LINK_REASSIGNED' | 'BRANCH_CLAIM_REVIEWED';
  previousBusinessId?: string | null;
}

export class BranchClaimAdminService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Retrieves pending or filterable branch claims for administrator review queue.
   */
  public async listPendingClaims(statusFilter?: string) {
    const where: Record<string, any> = {};

    if (statusFilter && ['PENDING_REVIEW', 'PENDING_DISPUTE', 'APPROVED', 'REJECTED', 'CANCELLED'].includes(statusFilter)) {
      where.status = statusFilter;
    } else {
      where.status = { in: ACTIVE_CLAIM_STATUSES };
    }

    const claims = await this.prisma.branchClaim.findMany({
      where,
      include: {
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            address: true,
            verificationStatus: true,
            businessId: true,
          },
        },
        claimant: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: { submittedAt: 'desc' },
    });

    return claims;
  }

  /**
   * Server-authoritative review (Approve or Reject) of a BranchClaim.
   * On APPROVE, performs atomic update of Place.businessId inside a transaction
   * with PostgreSQL row-level locking (FOR UPDATE) on the target Place.
   */
  public async reviewClaim(
    reviewerId: string,
    claimId: string,
    input: ReviewClaimInput
  ): Promise<ReviewClaimResult> {
    const action = input.action;

    if (action !== 'APPROVE' && action !== 'REJECT') {
      throw new Error('INVALID_ACTION');
    }

    // 1. Initial lookup
    const claim = await this.prisma.branchClaim.findUnique({
      where: { id: claimId },
      include: {
        place: true,
      },
    });

    if (!claim) {
      throw new Error('CLAIM_NOT_FOUND');
    }

    // 2. Claimant / Reviewer Separation Rule
    if (claim.claimantId === reviewerId) {
      throw new Error('CLAIMANT_CANNOT_REVIEW_OWN_CLAIM');
    }

    // 3. Source State Validation Rule
    if (!ACTIVE_CLAIM_STATUSES.includes(claim.status)) {
      throw new Error('CANNOT_REVIEW_TERMINAL_CLAIM');
    }

    // 4. REJECTION PATH
    if (action === 'REJECT') {
      if (!input.rejectionReason || input.rejectionReason.trim().length === 0) {
        throw new Error('REJECTION_REASON_REQUIRED');
      }

      const rejectionReason = input.rejectionReason.trim();

      const updatedClaim = await this.prisma.branchClaim.update({
        where: { id: claimId },
        data: {
          status: 'REJECTED',
          reviewerId,
          reviewedAt: new Date(),
          rejectionReason,
        },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          place: { select: { id: true, nameAr: true, nameEn: true, address: true, businessId: true } },
          claimant: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      return {
        updatedClaim,
        eventType: 'BRANCH_CLAIM_REVIEWED',
      };
    }

    // 5. APPROVAL PATH (Atomic transaction with row lock)
    let eventType: 'BRANCH_LINK_ESTABLISHED' | 'BRANCH_LINK_REASSIGNED' = 'BRANCH_LINK_ESTABLISHED';
    let previousBusinessId: string | null = null;

    const result = await this.prisma.$transaction(async (tx) => {
      // Step A: Acquire PostgreSQL row-level lock FOR UPDATE on target Place
      await tx.$queryRaw`SELECT "id", "business_id" FROM "places" WHERE "id" = ${claim.placeId} FOR UPDATE`;

      // Step B: Re-read authoritative Place state inside transaction
      const currentPlace = await tx.place.findUnique({
        where: { id: claim.placeId },
      });

      if (!currentPlace) {
        throw new Error('PLACE_NOT_FOUND');
      }

      // Step C: Re-verify BranchClaim state inside transaction
      const currentClaim = await tx.branchClaim.findUnique({
        where: { id: claimId },
      });

      if (!currentClaim || !ACTIVE_CLAIM_STATUSES.includes(currentClaim.status)) {
        throw new Error('CANNOT_REVIEW_TERMINAL_CLAIM');
      }

      // Step D: Precondition checks based on claim status
      if (currentClaim.status === 'PENDING_REVIEW') {
        // Normal approval precondition: Place.businessId MUST be null
        if (currentPlace.businessId !== null) {
          throw new Error('PLACE_ALREADY_LINKED');
        }
        eventType = 'BRANCH_LINK_ESTABLISHED';
      } else if (currentClaim.status === 'PENDING_DISPUTE') {
        // Disputed approval precondition: Place.businessId MUST NOT be null
        if (currentPlace.businessId === null) {
          throw new Error('DISPUTED_PLACE_NOT_LINKED');
        }
        if (currentPlace.businessId === currentClaim.businessId) {
          throw new Error('PLACE_ALREADY_LINKED');
        }
        previousBusinessId = currentPlace.businessId;
        eventType = 'BRANCH_LINK_REASSIGNED';
      }

      // Step E: Update BranchClaim to APPROVED
      const updatedClaim = await tx.branchClaim.update({
        where: { id: claimId },
        data: {
          status: 'APPROVED',
          reviewerId,
          reviewedAt: new Date(),
        },
        include: {
          business: { select: { id: true, name: true, slug: true } },
          place: { select: { id: true, nameAr: true, nameEn: true, address: true, businessId: true } },
          claimant: { select: { id: true, name: true, email: true } },
          reviewer: { select: { id: true, name: true, email: true } },
        },
      });

      // Step F: Atomically mutate Place.businessId
      await tx.place.update({
        where: { id: claim.placeId },
        data: {
          businessId: currentClaim.businessId,
        },
      });

      return updatedClaim;
    });

    return {
      updatedClaim: result,
      eventType,
      previousBusinessId,
    };
  }
}
