import { prismaTest } from '../helpers/testDb.js';
import { QuoteStatus, Prisma } from '@prisma/client';
import crypto from 'crypto';

export interface CreateQuoteItemOption {
  productId?: string | null;
  description?: string;
  quantity?: number;
  unitPrice?: number;
  discount?: number;
  tax?: number;
  total?: number;
}

export interface CreateQuoteOptions {
  organizationId: string;
  createdById: string;
  accountId?: string | null;
  opportunityId?: string | null;
  quoteNumber?: string;
  status?: QuoteStatus;
  subtotal?: number;
  discount?: number;
  tax?: number;
  total?: number;
  validUntil?: Date | null;
  notes?: string | null;
  items?: CreateQuoteItemOption[];
}

export async function createTestQuote(options: CreateQuoteOptions) {
  const uid = crypto.randomUUID().slice(0, 8);
  const quoteNumber = options.quoteNumber || `QT-${uid}`;

  const items = options.items || [
    {
      description: 'Default Quote Item',
      quantity: 1,
      unitPrice: 500,
      discount: 0,
      tax: 50,
      total: 550
    }
  ];

  return prismaTest.quote.create({
    data: {
      organizationId: options.organizationId,
      createdById: options.createdById,
      accountId: options.accountId || null,
      opportunityId: options.opportunityId || null,
      quoteNumber,
      status: options.status || QuoteStatus.DRAFT,
      subtotal: new Prisma.Decimal(options.subtotal !== undefined ? options.subtotal : 500.00),
      discount: new Prisma.Decimal(options.discount !== undefined ? options.discount : 0.00),
      tax: new Prisma.Decimal(options.tax !== undefined ? options.tax : 50.00),
      total: new Prisma.Decimal(options.total !== undefined ? options.total : 550.00),
      validUntil: options.validUntil !== undefined ? options.validUntil : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      notes: options.notes || 'Commercial Proposal',
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
      createdBy: true
    }
  });
}
