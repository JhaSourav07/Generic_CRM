import { Prisma, ProductType } from '@prisma/client';
import { prisma } from '../../config/prisma.js';
import { GetProductsQuery, CreateProductInput, UpdateProductInput } from './products.validation.js';
import { AppError } from '../../middleware/errorHandler.js';


export class ProductsService {
  /**
   * Helper to format product price for client responses.
   */
  private formatProduct(product: any) {
    if (!product) return product;
    return {
      ...product,
      price: Number(product.price || 0)
    };
  }

  /**
   * List products with server-side pagination, search, filtering, and sorting.
   */
  public async getProducts(organizationId: string, query: Partial<GetProductsQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.ProductWhereInput = {
      organizationId,
      deletedAt: null
    };

    // Server-side Search across name, sku, description
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { name: { contains: searchTerm, mode: 'insensitive' } },
        { sku: { contains: searchTerm, mode: 'insensitive' } },
        { description: { contains: searchTerm, mode: 'insensitive' } }
      ];
    }

    // Type filter
    if (query.type) {
      whereClause.type = query.type as ProductType;
    }

    // Active status filter
    if (query.isActive !== undefined) {
      whereClause.isActive = query.isActive;
    }

    // Whitelist sorting fields
    const allowedSortFields = ['name', 'price', 'createdAt', 'sku'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, rawProducts] = await Promise.all([
      prisma.product.count({ where: whereClause }),
      prisma.product.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          _count: {
            select: {
              quoteItems: true,
              orderItems: true
            }
          }
        }
      })
    ]);

    const products = rawProducts.map((p) => this.formatProduct(p));

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single product by ID.
   */
  public async getProductById(organizationId: string, id: string) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            quoteItems: true,
            orderItems: true
          }
        }
      }
    });

    if (!product) {
      const error: AppError = new Error('Product not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.formatProduct(product);
  }

  /**
   * Create a new product scoped to the authenticated organization.
   */
  public async createProduct(organizationId: string, userId: string, input: CreateProductInput) {
    try {
      const product = await prisma.product.create({
        data: {
          organizationId,
          name: input.name,
          sku: input.sku && input.sku.trim() !== '' ? input.sku.trim() : null,
          description: input.description,
          type: input.type as ProductType,
          price: new Prisma.Decimal(input.price),
          currency: input.currency || 'USD',
          isActive: input.isActive ?? true
        }
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'CREATE',
          entity: 'Product',
          entityId: product.id,
          newValue: {
            name: product.name,
            sku: product.sku,
            type: product.type,
            price: Number(product.price)
          }
        }
      });

      return this.formatProduct(product);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const error: AppError = new Error(`A product with SKU '${input.sku}' already exists in your organization`);
        error.statusCode = 409;
        error.code = 'CONFLICT';
        throw error;
      }
      throw err;
    }
  }

  /**
   * Update an existing product.
   */
  public async updateProduct(organizationId: string, userId: string, id: string, input: UpdateProductInput) {
    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      }
    });

    if (!existing) {
      const error: AppError = new Error('Product not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    try {
      const updateData: Prisma.ProductUpdateInput = {};
      if (input.name !== undefined) updateData.name = input.name;
      if (input.sku !== undefined) updateData.sku = input.sku && input.sku.trim() !== '' ? input.sku.trim() : null;
      if (input.description !== undefined) updateData.description = input.description;
      if (input.type !== undefined) updateData.type = input.type as ProductType;
      if (input.price !== undefined) updateData.price = new Prisma.Decimal(input.price);
      if (input.currency !== undefined) updateData.currency = input.currency;
      if (input.isActive !== undefined) updateData.isActive = input.isActive;

      const updated = await prisma.product.update({
        where: { id: existing.id },
        data: updateData
      });

      // Audit log
      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'UPDATE',
          entity: 'Product',
          entityId: updated.id,
          oldValue: {
            name: existing.name,
            sku: existing.sku,
            price: Number(existing.price),
            isActive: existing.isActive
          },
          newValue: {
            name: updated.name,
            sku: updated.sku,
            price: Number(updated.price),
            isActive: updated.isActive
          }
        }
      });

      return this.formatProduct(updated);
    } catch (err: any) {
      if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
        const error: AppError = new Error(`A product with SKU '${input.sku}' already exists in your organization`);
        error.statusCode = 409;
        error.code = 'CONFLICT';
        throw error;
      }
      throw err;
    }
  }

  /**
   * Deactivate or soft-delete product.
   * If referenced by quotes or orders, deactivates (isActive = false) to protect historical data.
   */
  public async deleteProduct(organizationId: string, userId: string, id: string) {
    const existing = await prisma.product.findFirst({
      where: {
        id,
        organizationId,
        deletedAt: null
      },
      include: {
        _count: {
          select: {
            quoteItems: true,
            orderItems: true
          }
        }
      }
    });

    if (!existing) {
      const error: AppError = new Error('Product not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const hasCommercialReferences = existing._count.quoteItems > 0 || existing._count.orderItems > 0;

    if (hasCommercialReferences) {
      // Deactivate to protect historical quotes and orders
      const deactivated = await prisma.product.update({
        where: { id: existing.id },
        data: {
          isActive: false,
          deletedAt: new Date()
        }
      });

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'DEACTIVATE',
          entity: 'Product',
          entityId: id,
          oldValue: { isActive: true },
          newValue: { isActive: false, reason: 'Historical quotes/orders present' }
        }
      });

      return {
        message: 'Product referenced by historical quotes/orders. Successfully deactivated to preserve commercial history.',
        deactivated: true
      };
    } else {
      // Safe to soft-delete
      await prisma.product.update({
        where: { id: existing.id },
        data: {
          deletedAt: new Date(),
          isActive: false
        }
      });

      await prisma.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'DELETE',
          entity: 'Product',
          entityId: id,
          oldValue: { name: existing.name, sku: existing.sku }
        }
      });

      return {
        message: 'Product successfully deleted.',
        deleted: true
      };
    }
  }
}

export const productsService = new ProductsService();
