import { prisma as defaultPrisma, type PrismaClient } from '@waynah/database';
import { aggregatePlaceTimeline } from './timeline-aggregator.js';

export class AdminService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Retrieves all OPEN data conflicts requiring moderation review.
   */
  async getOpenConflicts() {
    return this.prisma.dataConflict.findMany({
      where: { status: 'OPEN' },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            phoneNumber: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Retrieves complete knowledge history and aggregated timeline for a canonical place by ID,
   * including observations, data sources, category, district, governorate, location, conflicts, and branch claims.
   */
  async getPlaceHistory(placeId: string) {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      include: {
        category: true,
        district: {
          include: {
            governorate: true,
          },
        },
        location: true,
        observations: {
          include: {
            dataSource: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        conflicts: {
          orderBy: { createdAt: 'desc' },
        },
        branchClaims: {
          include: {
            business: {
              select: {
                id: true,
                name: true,
                slug: true,
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
        },
        business: {
          select: {
            id: true,
            name: true,
            slug: true,
          },
        },
      },
    });

    if (!place) {
      return null;
    }

    const timeline = aggregatePlaceTimeline(place);

    return {
      ...place,
      timeline,
    };
  }

  /**
   * Resolves a DataConflict.
   * On accepting base or conflicting observation, updates the canonical Place attributes.
   */
  async resolveConflict(
    conflictId: string,
    action: 'ACCEPT_BASE' | 'ACCEPT_CONFLICTING' | 'REJECT_BOTH',
    _actorId: string
  ) {
    const conflict = await this.prisma.dataConflict.findUnique({
      where: { id: conflictId },
      include: { place: true },
    });

    if (!conflict) {
      throw new Error('CONFLICT_NOT_FOUND');
    }

    if (conflict.status !== 'OPEN') {
      throw new Error('CONFLICT_ALREADY_RESOLVED');
    }

    let targetStatus = 'RESOLVED';
    if (action === 'REJECT_BOTH') {
      targetStatus = 'REJECTED';
    }

    return await this.prisma.$transaction(async (tx) => {
      let acceptedObsId: string | null = null;
      if (action === 'ACCEPT_BASE') acceptedObsId = conflict.baseObservationId;
      if (action === 'ACCEPT_CONFLICTING') acceptedObsId = conflict.conflictingObservationId;

      if (acceptedObsId) {
        const obs = await tx.placeObservation.findUnique({ where: { id: acceptedObsId } });
        if (obs) {
          const updateData: Record<string, any> = {};
          if (obs.name) updateData.nameAr = obs.name;
          if (obs.phone) updateData.phoneNumber = obs.phone;
          if (obs.categoryId) updateData.categoryId = obs.categoryId;

          if (Object.keys(updateData).length > 0) {
            await tx.place.update({
              where: { id: conflict.placeId },
              data: updateData,
            });
          }
        }
      }

      return await tx.dataConflict.update({
        where: { id: conflictId },
        data: {
          status: targetStatus,
          resolvedAt: new Date(),
        },
      });
    });
  }

  /**
   * Lists reviews for admin moderation, filterable by status (default: FLAGGED).
   */
  async listReviews(statusFilter?: string) {
    const status = statusFilter || 'FLAGGED';
    return this.prisma.review.findMany({
      where: { status: status as any },
      include: {
        user: { select: { id: true, name: true, email: true } },
        business: { select: { id: true, name: true } },
        place: { select: { id: true, nameAr: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Performs administrative moderation action (APPROVE or HIDE) on a Review.
   */
  async moderateReview(reviewId: string, action: 'APPROVE' | 'HIDE', _reason?: string) {
    const review = await this.prisma.review.findUnique({ where: { id: reviewId } });
    if (!review) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    const newStatus = action === 'APPROVE' ? 'PUBLISHED' : 'HIDDEN';
    return this.prisma.review.update({
      where: { id: reviewId },
      data: { status: newStatus as any },
    });
  }

  /**
   * Lists duplicate candidates for admin moderation, filterable by status (default: PENDING).
   */
  async listDuplicateCandidates(statusFilter?: string) {
    const status = statusFilter || 'PENDING';
    return this.prisma.duplicateCandidate.findMany({
      where: { status: status as any },
      include: {
        sourcePlace: { select: { id: true, nameAr: true, nameEn: true, districtId: true } },
        targetPlace: { select: { id: true, nameAr: true, nameEn: true, districtId: true } },
      },
      orderBy: { candidateScore: 'desc' },
    });
  }

  /**
   * Dismisses / Ignores a DuplicateCandidate.
   */
  async ignoreDuplicateCandidate(candidateId: string) {
    const candidate = await this.prisma.duplicateCandidate.findUnique({ where: { id: candidateId } });
    if (!candidate) {
      throw new Error('CANDIDATE_NOT_FOUND');
    }

    return this.prisma.duplicateCandidate.update({
      where: { id: candidateId },
      data: { status: 'IGNORED' },
    });
  }
}

