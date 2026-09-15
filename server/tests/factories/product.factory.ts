import { prismaTest } from '../helpers/testDb.js';
import { ProductType, Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface CreateProductOptions {
  organizationId: string;
  name?: string;
  sku?: string | null;
  description?: string | null;
  type?: ProductType;
  price?: number;
  currency?: string;
  isActive?: boolean;
}

export async function createTestProduct(options: CreateProductOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const name = options.name || `Product ${uid}`;
  const sku = options.sku !== undefined ? options.sku : `SKU-${uid}`;

  return prismaTest.product.create({
    data: {
      organizationId: options.organizationId,
      name,
      sku,
      description: options.description || 'Test product item description',
      type: options.type || ProductType.PRODUCT,
      price: new Prisma.Decimal(options.price !== undefined ? options.price : 100.00),
      currency: options.currency || 'USD',
      isActive: options.isActive !== undefined ? options.isActive : true
    }
  });
}
