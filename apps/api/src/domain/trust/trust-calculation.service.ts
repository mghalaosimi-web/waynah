import {
  prisma as defaultPrisma,
  type PrismaClient,
} from '@waynah/database';

export interface BusinessTrustBreakdown {
  score: number;
  verificationBonus: number;
  dataCompletenessScore: number;
  reviewBonus: number;
  observationBonus: number;
}

export interface PlaceTrustBreakdown {
  score: number;
  verificationBonus: number;
  locationScore: number;
  observationConfidence: number;
  reviewBonus: number;
}

export class TrustCalculationService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Calculates independent Business Trust Score (0 to 100).
   *
   * Rules:
   * 1. Official Verification Status:
   *    - VERIFIED: +40 pts
   *    - PENDING: +10 pts
   *    - UNVERIFIED / REJECTED: +0 pts
   * 2. Data Completeness (max +40 pts):
   *    - Description present & >10 chars: +10 pts
   *    - Physical Place / Branch linked: +10 pts
   *    - Catalog Products/Services present: +10 pts
   *    - Active Members present: +10 pts
   * 3. Customer Reviews (max +10 pts):
   *    - Average rating (1-5) * 2
   * 4. Field Observations (max +10 pts):
   *    - Total approved observations * 2 (capped at 10)
   */
  public async calculateBusinessTrust(businessId: string): Promise<BusinessTrustBreakdown> {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        verification: true,
        places: true,
        products: true,
        services: true,
        members: true,
        reviews: {
          where: { status: 'PUBLISHED' },
          select: { rating: true },
        },
      },
    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    // 1. Verification Bonus
    let verificationBonus = 0;
    if (business.verification?.status === 'VERIFIED') {
      verificationBonus = 40;
    } else if (business.verification?.status === 'PENDING') {
      verificationBonus = 10;
    }

    // 2. Data Completeness
    let dataCompletenessScore = 0;
    if (business.description && business.description.trim().length >= 10) {
      dataCompletenessScore += 10;
    }
    if (business.places && business.places.length > 0) {
      dataCompletenessScore += 10;
    }
    if ((business.products && business.products.length > 0) || (business.services && business.services.length > 0)) {
      dataCompletenessScore += 10;
    }
    if (business.members && business.members.length > 0) {
      dataCompletenessScore += 10;
    }

    // 3. Review Bonus
    let reviewBonus = 0;
    if (business.reviews && business.reviews.length > 0) {
      const sum = business.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / business.reviews.length;
      reviewBonus = Math.min(10, Math.round(avg * 2));
    }

    // 4. Observation Bonus (derived from places observations)
    let observationBonus = 0;
    if (business.places && business.places.length > 0) {
      const placeIds = business.places.map((p) => p.id);
      const obsCount = await this.prisma.placeObservation.count({
        where: { placeId: { in: placeIds } },
      });
      observationBonus = Math.min(10, obsCount * 2);
    }

    const totalRaw = verificationBonus + dataCompletenessScore + reviewBonus + observationBonus;
    const score = Math.min(100, Math.max(0, totalRaw));

    return {
      score,
      verificationBonus,
      dataCompletenessScore,
      reviewBonus,
      observationBonus,
    };
  }

  /**
   * Calculates independent Place Trust Score (0 to 100).
   *
   * Rules:
   * 1. Official Verification Status: VERIFIED = +30 pts, CLAIMED = +15 pts
   * 2. Coordinates / Location Accuracy: +30 pts if PlaceLocation exists
   * 3. Observation Confidence: Avg confidenceScore * 20 (max +20 pts)
   * 4. Customer / Place Reviews: Average rating * 4 (max +20 pts)
   */
  public async calculatePlaceTrust(placeId: string): Promise<PlaceTrustBreakdown> {
    const place = await this.prisma.place.findUnique({
      where: { id: placeId },
      include: {
        location: true,
        observations: true,
        reviews: {
          where: { status: 'PUBLISHED' },
          select: { rating: true },
        },
      },
    });

    if (!place) {
      throw new Error('PLACE_NOT_FOUND');
    }

    // 1. Verification Bonus
    let verificationBonus = 0;
    if (place.verificationStatus === 'VERIFIED') {
      verificationBonus = 30;
    } else if (place.verificationStatus === 'CLAIMED') {
      verificationBonus = 15;
    }

    // 2. Location Score
    const locationScore = place.location ? 30 : 0;

    // 3. Observation Confidence
    let observationConfidence = 0;
    if (place.observations && place.observations.length > 0) {
      const avgConfidence =
        place.observations.reduce((acc, o) => acc + (o.confidenceScore || 0), 0) /
        place.observations.length;
      observationConfidence = Math.min(20, Math.round(avgConfidence * 20));
    }

    // 4. Review Bonus
    let reviewBonus = 0;
    if (place.reviews && place.reviews.length > 0) {
      const sum = place.reviews.reduce((acc, r) => acc + r.rating, 0);
      const avg = sum / place.reviews.length;
      reviewBonus = Math.min(20, Math.round(avg * 4));
    }

    const totalRaw = verificationBonus + locationScore + observationConfidence + reviewBonus;
    const score = Math.min(100, Math.max(0, totalRaw));

    return {
      score,
      verificationBonus,
      locationScore,
      observationConfidence,
      reviewBonus,
    };
  }
}
