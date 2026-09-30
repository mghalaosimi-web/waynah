import { prisma as defaultPrisma, PrismaClient } from '@waynah/database';

export class UserFavoritesService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Retrieves user's saved favorites with place details.
   */
  async getFavorites(userId: string) {
    const favorites = await this.prisma.favorite.findMany({
      where: { userId },
      include: {
        place: {
          include: {
            category: true,
            district: {
              include: {
                governorate: true,
              },
            },
            location: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return favorites.map((fav) => ({
      id: fav.id,
      userId: fav.userId,
      placeId: fav.placeId,
      createdAt: fav.createdAt,
      place: {
        id: fav.place.id,
        nameAr: fav.place.nameAr,
        nameEn: fav.place.nameEn,
        slug: fav.place.slug,
        description: fav.place.description,
        address: fav.place.address,
        phoneNumber: fav.place.phoneNumber,
        website: fav.place.website,
        verificationStatus: fav.place.verificationStatus,
        categoryId: fav.place.categoryId,
        categoryNameAr: fav.place.category?.nameAr ?? null,
        districtId: fav.place.districtId,
        districtNameAr: fav.place.district?.nameAr ?? null,
        governorateNameAr: fav.place.district?.governorate?.nameAr ?? null,
        latitude: fav.place.location?.latitude ?? null,
        longitude: fav.place.location?.longitude ?? null,
      },
    }));
  }

  /**
   * Adds a place to user's favorites.
   */
  async addFavorite(userId: string, placeId: string) {
    // 1. Check if place exists
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
      },
    });

    if (!place) {
      throw new Error('PLACE_NOT_FOUND');
    }

    // 2. Upsert / create favorite record uniquely per user
    const favorite = await this.prisma.favorite.upsert({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
      create: {
        userId,
        placeId,
      },
      update: {},
      include: {
        place: {
          include: {
            category: true,
            district: {
              include: {
                governorate: true,
              },
            },
            location: true,
          },
        },
      },
    });

    return {
      id: favorite.id,
      userId: favorite.userId,
      placeId: favorite.placeId,
      createdAt: favorite.createdAt,
      place: {
        id: place.id,
        nameAr: place.nameAr,
        nameEn: place.nameEn,
        slug: place.slug,
        description: place.description,
        address: place.address,
        phoneNumber: place.phoneNumber,
        website: place.website,
        verificationStatus: place.verificationStatus,
        categoryId: place.categoryId,
        categoryNameAr: place.category?.nameAr ?? null,
        districtId: place.districtId,
        districtNameAr: place.district?.nameAr ?? null,
        governorateNameAr: place.district?.governorate?.nameAr ?? null,
        latitude: place.location?.latitude ?? null,
        longitude: place.location?.longitude ?? null,
      },
    };
  }

  /**
   * Removes a place from user's favorites. IDOR safe.
   */
  async removeFavorite(userId: string, placeId: string) {
    try {
      await this.prisma.favorite.delete({
        where: {
          userId_placeId: {
            userId,
            placeId,
          },
        },
      });
      return { success: true, message: 'تم إزالة المكان من المفضلة بنجاح' };
    } catch {
      // Return success if record was already deleted/not found
      return { success: true, message: 'تم إزالة المكان من المفضلة بنجاح' };
    }
  }

  /**
   * Checks if a place is saved in user's favorites.
   */
  async isFavorite(userId: string, placeId: string): Promise<boolean> {
    const existing = await this.prisma.favorite.findUnique({
      where: {
        userId_placeId: {
          userId,
          placeId,
        },
      },
    });
    return Boolean(existing);
  }
}
