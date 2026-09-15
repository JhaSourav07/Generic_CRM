import { prismaTest } from '../helpers/testDb.js';
import { OrderStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface CreateOrderItemOption {
  productId?: string | null;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  total?: number;
}

export interface CreateOrderOptions {
  organizationId: string;
  createdById: string;
  accountId?: string | null;
  opportunityId?: string | null;
  quoteId?: string | null;
  orderNumber?: string;
  status?: OrderStatus;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  notes?: string | null;
  items?: CreateOrderItemOption[];
}

export async function createTestOrder(options: CreateOrderOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const orderNumber = options.orderNumber || `ORD-${uid}`;

  const items = options.items || [
    {
      description: 'Default Order Item',
      quantity: 1,
      unitPrice: 500,
      discount: 0,
      tax: 50,
      total: 550
    }
  ];

  return prismaTest.order.create({
    data: {
      organizationId: options.organizationId,
      createdById: options.createdById,
      accountId: options.accountId || null,
      opportunityId: options.opportunityId || null,
      quoteId: options.quoteId || null,
      orderNumber,
      status: options.status || OrderStatus.PENDING,
      subtotal: new Prisma.Decimal(options.subtotal !== undefined ? options.subtotal : 500.00),
      discount: new Prisma.Decimal(options.discount !== undefined ? options.discount : 0.00),
      tax: new Prisma.Decimal(options.tax !== undefined ? options.tax : 50.00),
      total: new Prisma.Decimal(options.total !== undefined ? options.total : 550.00),
      notes: options.notes || 'Commercial Order',
      items: {
        create: items.map((it) => ({
          productId: it.productId || null,
          description: it.description || 'Line Item',
          quantity: it.quantity !== undefined ? it.quantity : 1,
          unitPrice: new Prisma.Decimal(it.unitPrice !== undefined ? it.unitPrice : 500.00),
          discount: new Prisma.Decimal(it.discount !== undefined ? it.discount : 0.00),
          tax: new Prisma.Decimal(it.tax !== undefined ? it.tax : 50.00),
          total: new Prisma.Decimal(it.total !== undefined ? it.total : 550.00)
        }))
      }
    },
    include: {
      items: { include: { product: true } },
      account: true,
      opportunity: true,
      quote: true,
      createdBy: true
    }
  });
}
