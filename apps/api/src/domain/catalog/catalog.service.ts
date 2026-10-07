import type { PrismaClient } from '@waynah/database';

export interface CreateProductInput {
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  price: number;
  currency?: string;
  isAvailable?: boolean;
  sku?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
}

export interface UpdateProductInput {
  nameAr?: string;
  nameEn?: string | null;
  description?: string | null;
  price?: number;
  currency?: string;
  isAvailable?: boolean;
  sku?: string | null;
  imageUrl?: string | null;
  categoryId?: string | null;
}

export interface CreateServiceInput {
  nameAr: string;
  nameEn?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string;
  isAvailable?: boolean;
  durationMinutes?: number | null;
  categoryId?: string | null;
}

export interface UpdateServiceInput {
  nameAr?: string;
  nameEn?: string | null;
  description?: string | null;
  price?: number | null;
  currency?: string;
  isAvailable?: boolean;
  durationMinutes?: number | null;
  categoryId?: string | null;
}

export class CatalogService {
  constructor(private prisma: PrismaClient) {}

  /**
   * Check user membership in business and retrieve role.
   */
  private async checkBusinessMembership(userId: string, businessId: string, isAdmin = false) {
    if (isAdmin) {
      return { role: 'ADMIN' };
    }

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

    return membership;
  }

  /**
   * Ensure user has OWNER or MANAGER role to modify catalog.
   */
  private ensureCanManageCatalog(membership: { role: string }) {
    if (membership.role !== 'OWNER' && membership.role !== 'MANAGER' && membership.role !== 'ADMIN') {
      throw new Error('INSUFFICIENT_BUSINESS_PERMISSIONS');
    }
  }

  /**
   * Create a new Product for a Business
   */
  async createProduct(userId: string, businessId: string, input: CreateProductInput, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageCatalog(membership);

    if (!input.nameAr || input.nameAr.trim().length < 2) {
      throw new Error('INVALID_PRODUCT_NAME');
    }

    if (typeof input.price !== 'number' || input.price < 0) {
      throw new Error('INVALID_PRODUCT_PRICE');
    }

    return this.prisma.product.create({
      data: {
        businessId,
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn?.trim() || null,
        description: input.description?.trim() || null,
        price: input.price,
        currency: input.currency || 'YER',
        isAvailable: input.isAvailable ?? true,
        sku: input.sku?.trim() || null,
        imageUrl: input.imageUrl?.trim() || null,
        categoryId: input.categoryId || null,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Update an existing Product
   */
  async updateProduct(userId: string, businessId: string, productId: string, input: UpdateProductInput, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageCatalog(membership);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== businessId) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    if (input.nameAr !== undefined && input.nameAr.trim().length < 2) {
      throw new Error('INVALID_PRODUCT_NAME');
    }

    if (input.price !== undefined && (typeof input.price !== 'number' || input.price < 0)) {
      throw new Error('INVALID_PRODUCT_PRICE');
    }

    return this.prisma.product.update({
      where: { id: productId },
      data: {
        ...(input.nameAr !== undefined && { nameAr: input.nameAr.trim() }),
        ...(input.nameEn !== undefined && { nameEn: input.nameEn?.trim() || null }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
        ...(input.sku !== undefined && { sku: input.sku?.trim() || null }),
        ...(input.imageUrl !== undefined && { imageUrl: input.imageUrl?.trim() || null }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId || null }),
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Delete a Product
   */
  async deleteProduct(userId: string, businessId: string, productId: string, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageCatalog(membership);

    const product = await this.prisma.product.findUnique({ where: { id: productId } });
    if (!product || product.businessId !== businessId) {
      throw new Error('PRODUCT_NOT_FOUND');
    }

    return this.prisma.product.delete({
      where: { id: productId },
    });
  }

  /**
   * Create a new Service for a Business
   */
  async createService(userId: string, businessId: string, input: CreateServiceInput, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageCatalog(membership);

    if (!input.nameAr || input.nameAr.trim().length < 2) {
      throw new Error('INVALID_SERVICE_NAME');
    }

    if (input.price !== undefined && input.price !== null && (typeof input.price !== 'number' || input.price < 0)) {
      throw new Error('INVALID_SERVICE_PRICE');
    }

    return this.prisma.serviceItem.create({
      data: {
        businessId,
        nameAr: input.nameAr.trim(),
        nameEn: input.nameEn?.trim() || null,
        description: input.description?.trim() || null,
        price: input.price ?? null,
        currency: input.currency || 'YER',
        isAvailable: input.isAvailable ?? true,
        durationMinutes: input.durationMinutes ?? null,
        categoryId: input.categoryId || null,
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Update an existing Service
   */
  async updateService(userId: string, businessId: string, serviceId: string, input: UpdateServiceInput, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageCatalog(membership);

    const service = await this.prisma.serviceItem.findUnique({ where: { id: serviceId } });
    if (!service || service.businessId !== businessId) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    if (input.nameAr !== undefined && input.nameAr.trim().length < 2) {
      throw new Error('INVALID_SERVICE_NAME');
    }

    if (input.price !== undefined && input.price !== null && (typeof input.price !== 'number' || input.price < 0)) {
      throw new Error('INVALID_SERVICE_PRICE');
    }

    return this.prisma.serviceItem.update({
      where: { id: serviceId },
      data: {
        ...(input.nameAr !== undefined && { nameAr: input.nameAr.trim() }),
        ...(input.nameEn !== undefined && { nameEn: input.nameEn?.trim() || null }),
        ...(input.description !== undefined && { description: input.description?.trim() || null }),
        ...(input.price !== undefined && { price: input.price }),
        ...(input.currency !== undefined && { currency: input.currency }),
        ...(input.isAvailable !== undefined && { isAvailable: input.isAvailable }),
        ...(input.durationMinutes !== undefined && { durationMinutes: input.durationMinutes }),
        ...(input.categoryId !== undefined && { categoryId: input.categoryId || null }),
      },
      include: {
        category: true,
      },
    });
  }

  /**
   * Delete a Service
   */
  async deleteService(userId: string, businessId: string, serviceId: string, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const membership = await this.checkBusinessMembership(userId, businessId, isAdmin);
    this.ensureCanManageCatalog(membership);

    const service = await this.prisma.serviceItem.findUnique({ where: { id: serviceId } });
    if (!service || service.businessId !== businessId) {
      throw new Error('SERVICE_NOT_FOUND');
    }

    return this.prisma.serviceItem.delete({
      where: { id: serviceId },
    });
  }

  /**
   * Get public catalog for a Business by ID or Slug
   */
  async getPublicCatalog(idOrSlug: string) {
    const business = await this.prisma.business.findFirst({
      where: {
        OR: [{ id: idOrSlug }, { slug: idOrSlug }],
      },

    });

    if (!business) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    const products = await this.prisma.product.findMany({
      where: {
        businessId: business.id,
        isAvailable: true,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    const services = await this.prisma.serviceItem.findMany({
      where: {
        businessId: business.id,
        isAvailable: true,
      },
      include: {
        category: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    return {
      business: {
        id: business.id,
        name: business.name,
        slug: business.slug,
        description: business.description,
      },
      products,
      services,
      totalProducts: products.length,
      totalServices: services.length,
    };
  }

  /**
   * Get full merchant catalog (including unavailable items) for Business Members
   */
  async getMerchantCatalog(userId: string, businessId: string, isAdmin = false) {
    const biz = await this.prisma.business.findUnique({ where: { id: businessId } });
    if (!biz) {
      throw new Error('BUSINESS_NOT_FOUND');
    }

    await this.checkBusinessMembership(userId, businessId, isAdmin);

    const products = await this.prisma.product.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    const services = await this.prisma.serviceItem.findMany({
      where: { businessId },
      include: { category: true },
      orderBy: { createdAt: 'desc' },
    });

    return {
      products,
      services,
      totalProducts: products.length,
      totalServices: services.length,
    };
  }
}
