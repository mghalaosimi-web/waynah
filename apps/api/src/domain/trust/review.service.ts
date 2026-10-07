import {
  prisma as defaultPrisma,
  type PrismaClient,
  ReviewStatus,
} from '@waynah/database';

export interface CreateReviewInput {
  businessId: string;
  rating: number;
  comment?: string | null;
  placeId?: string | null;
  productId?: string | null;
  serviceId?: string | null;
  orderId?: string | null;
  bookingId?: string | null;
}

export interface ListReviewsQuery {
  businessId?: string;
  placeId?: string;
  productId?: string;
  serviceId?: string;
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}

export class ReviewService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Creates a user review after validating input and checking duplication rules.
   */
  public async createReview(userId: string, input: CreateReviewInput) {
    // Validation Rule 1: Rating must be an integer between 1 and 5
    if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
      throw new Error('INVALID_RATING');
    }

    // Validation Rule 2: Business must exist
    const business = await this.prisma.business.findUnique({
      where: { id: input.businessId },
    });
    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    // Duplication Check 1: If orderId is provided, check if review already exists for this order
    if (input.orderId) {
      const existingOrderReview = await this.prisma.review.findFirst({
        where: { userId, orderId: input.orderId },
      });
      if (existingOrderReview) {
        throw new Error('DUPLICATE_ORDER_REVIEW');
      }
    }

    // Duplication Check 2: If bookingId is provided, check if review already exists for this booking
    if (input.bookingId) {
      const existingBookingReview = await this.prisma.review.findFirst({
        where: { userId, bookingId: input.bookingId },
      });
      if (existingBookingReview) {
        throw new Error('DUPLICATE_BOOKING_REVIEW');
      }
    }

    const review = await this.prisma.review.create({
      data: {
        userId,
        businessId: input.businessId,
        placeId: input.placeId || null,
        productId: input.productId || null,
        serviceId: input.serviceId || null,
        orderId: input.orderId || null,
        bookingId: input.bookingId || null,
        rating: input.rating,
        comment: input.comment ? input.comment.trim() : null,
        status: 'PUBLISHED',
      },
      include: {
        user: {
          select: { id: true, name: true, email: true },
        },
        business: {
          select: { id: true, name: true },
        },
      },
    });

    return review;
  }

  /**
   * Retrieves paginated reviews with aggregate rating summary.
   */
  public async listReviews(query: ListReviewsQuery) {
    const where: any = {};

    if (query.businessId) where.businessId = query.businessId;
    if (query.placeId) where.placeId = query.placeId;
    if (query.productId) where.productId = query.productId;
    if (query.serviceId) where.serviceId = query.serviceId;

    // Default: only return PUBLISHED reviews for public view unless explicitly filtered
    where.status = query.status || 'PUBLISHED';

    const page = Math.max(1, query.page || 1);
    const limit = Math.max(1, Math.min(100, query.limit || 20));
    const skip = (page - 1) * limit;

    const [items, total, allRatings] = await Promise.all([
      this.prisma.review.findMany({
        where,
        include: {
          user: {
            select: { id: true, name: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.review.count({ where }),
      this.prisma.review.findMany({
        where,
        select: { rating: true },
      }),
    ]);

    const ratingDistribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let sum = 0;
    for (const r of allRatings) {
      sum += r.rating;
      ratingDistribution[r.rating] = (ratingDistribution[r.rating] || 0) + 1;
    }
    const averageRating = allRatings.length > 0 ? Math.round((sum / allRatings.length) * 10) / 10 : 0;

    return {
      items,
      summary: {
        totalReviews: total,
        averageRating,
        ratingDistribution,
      },
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Updates an existing review (Authorization check required: actor must be review owner).
   */
  public async updateReview(userId: string, reviewId: string, input: { rating?: number; comment?: string | null }) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    if (review.userId !== userId) {
      throw new Error('FORBIDDEN_NOT_REVIEW_OWNER');
    }

    if (input.rating !== undefined) {
      if (!Number.isInteger(input.rating) || input.rating < 1 || input.rating > 5) {
        throw new Error('INVALID_RATING');
      }
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: {
        ...(input.rating !== undefined ? { rating: input.rating } : {}),
        ...(input.comment !== undefined ? { comment: input.comment ? input.comment.trim() : null } : {}),
      },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return updated;
  }

  /**
   * Deletes a review (Owner or Admin).
   */
  public async deleteReview(userId: string, reviewId: string, isAdmin: boolean = false) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    if (!isAdmin && review.userId !== userId) {
      throw new Error('FORBIDDEN_NOT_REVIEW_OWNER');
    }

    await this.prisma.review.delete({
      where: { id: reviewId },
    });

    return { success: true, id: reviewId };
  }

  /**
   * Moderates review status (Admin only).
   */
  public async moderateReview(reviewId: string, status: ReviewStatus) {
    const review = await this.prisma.review.findUnique({
      where: { id: reviewId },
    });

    if (!review) {
      throw new Error('REVIEW_NOT_FOUND');
    }

    const updated = await this.prisma.review.update({
      where: { id: reviewId },
      data: { status },
      include: {
        user: { select: { id: true, name: true } },
      },
    });

    return updated;
  }
}
