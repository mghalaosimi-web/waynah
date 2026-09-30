import { prisma as defaultPrisma, type PrismaClient, BusinessStatus, BusinessRole } from '@waynah/database';

const ACTIVE_STATUS = (BusinessStatus?.ACTIVE || 'ACTIVE') as BusinessStatus;
const OWNER_ROLE = (BusinessRole?.OWNER || 'OWNER') as BusinessRole;
const MANAGER_ROLE = (BusinessRole?.MANAGER || 'MANAGER') as BusinessRole;

export interface CreateBusinessInput {
  name: string;
  description?: string | null;
  slug?: string | null;
}

export interface UpdateBusinessInput {
  name?: string;
  description?: string | null;
  status?: BusinessStatus;
}

export class BusinessService {
  private readonly prisma: PrismaClient;

  constructor(prismaClient: PrismaClient = defaultPrisma) {
    this.prisma = prismaClient;
  }

  /**
   * Helper to slugify a business name
   */
  public static slugify(text: string): string {
    return text
      .trim()
      .toLowerCase()
      .replace(/[^\w\u0600-\u06FF\s-]/g, '')
      .replace(/[\s_]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  /**
   * Creates a new Business record and assigns the creating User as OWNER.
   * Updates user role to BUSINESS_OWNER if currently USER.
   */
  public async createBusiness(userId: string, input: CreateBusinessInput) {
    if (!input.name || input.name.trim().length < 2) {
      throw new Error('INVALID_BUSINESS_NAME');
    }

    const name = input.name.trim();
    const description = input.description ? input.description.trim() : null;
    
    // Generate slug
    let slug = input.slug ? BusinessService.slugify(input.slug) : BusinessService.slugify(name);
    if (!slug) {
      slug = `biz-${Math.random().toString(36).substring(2, 9)}`;
    }

    // Check slug uniqueness, append random suffix if collision
    const existingSlug = await this.prisma.business.findUnique({ where: { slug } });
    if (existingSlug) {
      slug = `${slug}-${Math.random().toString(36).substring(2, 6)}`;
    }

    return await this.prisma.$transaction(async (tx) => {
      // Create business entity
      const business = await tx.business.create({
        data: {
          name,
          slug,
          description,
          status: ACTIVE_STATUS,
        },
      });

      // Assign creator as OWNER in BusinessMember
      const member = await tx.businessMember.create({
        data: {
          businessId: business.id,
          userId,
          role: OWNER_ROLE,
        },
        include: {
          user: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
      });

      // Update user role to BUSINESS_OWNER if standard USER
      const user = await tx.user.findUnique({ where: { id: userId } });
      if (user && user.role === 'USER') {
        await tx.user.update({
          where: { id: userId },
          data: { role: 'BUSINESS_OWNER' },
        });
      }

      return {
        ...business,
        membershipRole: member.role,
        members: [member],
      };
    });
  }

  /**
   * Retrieves all businesses where the specified User is a member.
   */
  public async getUserBusinesses(userId: string) {
    const memberships = await this.prisma.businessMember.findMany({
      where: { userId },
      include: {
        business: {
          include: {
            verification: true,
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, role: true },
                },
              },
            },
            places: {
              select: { id: true, nameAr: true, nameEn: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return memberships.map((m) => ({
      ...m.business,
      membershipRole: m.role,
      joinedAt: m.createdAt,
    }));
  }

  /**
   * Retrieves a single Business by ID, checking authorization if requested.
   */
  public async getBusinessById(businessId: string) {
    const business = await this.prisma.business.findUnique({
      where: { id: businessId },
      include: {
        verification: true,
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
    });

    return business;
  }

  /**
   * Retrieves public Business info by ID or Slug.
   */
  public async getPublicBusinessProfile(idOrSlug: string) {
    const business = await this.prisma.business.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },
      include: {
        verification: {
          select: { status: true },
        },
        places: {
          select: {
            id: true,
            nameAr: true,
            nameEn: true,
            description: true,
            address: true,
            phoneNumber: true,
            verificationStatus: true,
            category: { select: { id: true, nameAr: true, icon: true } },
            district: { select: { id: true, nameAr: true } },
          },
        },
        _count: {
          select: { members: true, places: true },
        },
      },
    });

    if (!business) return null;

    const vStatus = business.verification?.status || 'UNVERIFIED';

    // Filter public response - ONLY expose safe boolean/status, no private fields
    return {
      id: business.id,
      name: business.name,
      slug: business.slug,
      description: business.description,
      status: business.status,
      verified: vStatus === 'VERIFIED',
      verificationStatus: vStatus,
      createdAt: business.createdAt,
      places: business.places,
      totalPlaces: business._count.places,
    };
  }

  /**
   * Updates Business details with strict ownership / membership verification.
   */
  public async updateBusiness(userId: string, businessId: string, input: UpdateBusinessInput) {
    // IDOR Check: Ensure requesting user is OWNER or MANAGER of this specific business
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

    const dataToUpdate: Record<string, any> = {};
    if (input.name !== undefined && input.name.trim().length >= 2) {
      dataToUpdate.name = input.name.trim();
    }
    if (input.description !== undefined) {
      dataToUpdate.description = input.description ? input.description.trim() : null;
    }
    if (input.status !== undefined) {
      dataToUpdate.status = input.status;
    }

    return await this.prisma.business.update({
      where: { id: businessId },
      data: dataToUpdate,
    });
  }

  /**
   * Verifies if a user is an active member of a business.
   */
  public async getMembership(userId: string, businessId: string) {
    return await this.prisma.businessMember.findUnique({
      where: {
        businessId_userId: {
          businessId,
          userId,
        },
      },
    });
  }
}
