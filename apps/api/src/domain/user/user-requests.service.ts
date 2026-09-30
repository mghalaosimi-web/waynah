import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';

export interface CreateRequestParams {
  title: string;
  description: string;
  placeId?: string | null;
}

export class UserRequestsService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Retrieves all requests created by a specific user.
   */
  async getRequests(userId: string) {
    const requests = await this.prisma.serviceRequest.findMany({
      where: { userId },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return requests.map((req) => ({
      id: req.id,
      userId: req.userId,
      placeId: req.placeId,
      title: req.title,
      description: req.description,
      status: req.status,
      createdAt: req.createdAt,
      updatedAt: req.updatedAt,
      place: req.place
        ? {
            id: req.place.id,
            nameAr: req.place.nameAr,
            nameEn: req.place.nameEn,
          }
        : null,
    }));
  }

  /**
   * Creates a new user service request.
   */
  async createRequest(userId: string, data: CreateRequestParams) {
    const title = data.title?.trim();
    const description = data.description?.trim();

    if (!title || title.length < 3) {
      throw new Error('INVALID_TITLE');
    }
    if (!description || description.length < 5) {
      throw new Error('INVALID_DESCRIPTION');
    }

    let validPlaceId: string | null = null;
    if (data.placeId) {
      const place = await this.prisma.place.findUnique({
        where: { id: data.placeId },
      });
      if (!place) {
        throw new Error('PLACE_NOT_FOUND');
      }
      validPlaceId = place.id;
    }

    const request = await this.prisma.serviceRequest.create({
      data: {
        userId,
        placeId: validPlaceId,
        title,
        description,
        status: 'PENDING',
      },
      include: {
        place: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
          },
        },
      },
    });

    return {
      id: request.id,
      userId: request.userId,
      placeId: request.placeId,
      title: request.title,
      description: request.description,
      status: request.status,
      createdAt: request.createdAt,
      updatedAt: request.updatedAt,
      place: request.place
        ? {
            id: request.place.id,
            nameAr: request.place.nameAr,
            nameEn: request.place.nameEn,
          }
        : null,
    };
  }
}
