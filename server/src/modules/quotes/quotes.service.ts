import { PrismaClient, Prisma, QuoteStatus, OrderStatus } from '@prisma/client';
import { GetQuotesQuery, CreateQuoteInput, UpdateQuoteInput } from './quotes.validation.js';
import { calculateDocumentTotals, LineItemInput } from '../../utils/pricing.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class QuotesService {
  /**
   * Format quote record for JSON output with numeric decimals.
   */
  private formatQuote(quote: any) {
    if (!quote) return quote;
    return {
      ...quote,
      subtotal: Number(quote.subtotal || 0),
      discount: Number(quote.discount || 0),
      tax: Number(quote.tax || 0),
      total: Number(quote.total || 0),
      items: quote.items?.map((item: any) => ({
        ...item,
        unitPrice: Number(item.unitPrice || 0),
        discount: Number(item.discount || 0),
        tax: Number(item.tax || 0),
        total: Number(item.total || 0),
        product: item.product
          ? {
              ...item.product,
              price: Number(item.product.price || 0)
            }
          : null
      }))
    };
  }

  /**
   * Helper to generate human-readable sequential quote number (e.g. QT-00001).
   */
  private async generateQuoteNumber(tx: Prisma.TransactionClient, organizationId: string): Promise<string> {
    const count = await tx.quote.count({ where: { organizationId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `QT-${sequence}`;
  }

  /**
   * Helper to generate sequential order number (e.g. ORD-00001).
   */
  private async generateOrderNumber(tx: Prisma.TransactionClient, organizationId: string): Promise<string> {
    const count = await tx.order.count({ where: { organizationId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `ORD-${sequence}`;
  }

  /**
   * List quotes with pagination, server search, status filtering, and sorting.
   */
  public async getQuotes(organizationId: string, query: Partial<GetQuotesQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.QuoteWhereInput = {
      organizationId
    };

    // Server-side Search across quote number, customer name, opportunity name
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { quoteNumber: { contains: searchTerm, mode: 'insensitive' } },
        { account: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { opportunity: { name: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    if (query.status) {
      whereClause.status = query.status as QuoteStatus;
    }

    if (query.accountId) {
      whereClause.accountId = query.accountId;
    }

    if (query.opportunityId) {
      whereClause.opportunityId = query.opportunityId;
    }

    if (query.ownerId) {
      whereClause.createdById = query.ownerId;
    }

    const allowedSortFields = ['quoteNumber', 'total', 'validUntil', 'createdAt'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, rawQuotes] = await Promise.all([
      prisma.quote.count({ where: whereClause }),
      prisma.quote.findMany({
        where: whereClause,
        take: limit,
        skip,
        orderBy: { [sortBy]: sortOrder },
        include: {
          account: {
            select: { id: true, name: true, email: true }
          },
          opportunity: {
            select: { id: true, name: true, value: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          orders: {
            select: { id: true, orderNumber: true, status: true }
          },
          _count: {
            select: { items: true }
          }
        }
      })
    ]);

    const quotes = rawQuotes.map((q) => this.formatQuote(q));

    return {
      quotes,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get quote detail by ID.
   */
  public async getQuoteById(organizationId: string, id: string) {
    const quote = await prisma.quote.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        account: {
          select: { id: true, name: true, email: true, phone: true, address: true, city: true, country: true }
        },
        opportunity: {
          select: { id: true, name: true, value: true, status: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        orders: {
          select: { id: true, orderNumber: true, status: true, total: true, createdAt: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, type: true, price: true, isActive: true }
            }
          }
        }
      }
    });

    if (!quote) {
      const error: AppError = new Error('Quote not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.formatQuote(quote);
  }

  /**
   * Create a new quote with line items atomically inside a transaction.
   * All pricing is calculated server-side.
   */
  public async createQuote(organizationId: string, userId: string, input: CreateQuoteInput) {
    return prisma.$transaction(async (tx) => {
      // 1. Validate Account relation if supplied
      if (input.accountId) {
        const account = await tx.account.findFirst({
          where: { id: input.accountId, organizationId, deletedAt: null }
        });
        if (!account) {
          const error: AppError = new Error('Associated Customer account not found in your organization');
          error.statusCode = 404;
          error.code = 'NOT_FOUND';
          throw error;
        }
      }

      // 2. Validate Opportunity relation if supplied
      if (input.opportunityId) {
        const opp = await tx.opportunity.findFirst({
          where: { id: input.opportunityId, organizationId, deletedAt: null }
        });
        if (!opp) {
          const error: AppError = new Error('Associated Opportunity not found in your organization');
          error.statusCode = 404;
          error.code = 'NOT_FOUND';
          throw error;
        }
      }

      // 3. Validate Products and resolve pricing
      const lineInputs: LineItemInput[] = [];

      for (const item of input.items) {
        let resolvedUnitPrice = item.unitPrice;

        if (item.productId) {
          const product = await tx.product.findFirst({
            where: { id: item.productId, organizationId, deletedAt: null }
          });

          if (!product) {
            const error: AppError = new Error(`Product not found in your organization (ID: ${item.productId})`);
            error.statusCode = 404;
            error.code = 'NOT_FOUND';
            throw error;
          }

          if (!product.isActive) {
            const error: AppError = new Error(`Product '${product.name}' is inactive and cannot be added to a new quote`);
            error.statusCode = 400;
            error.code = 'PRODUCT_INACTIVE';
            throw error;
          }

          // Use product price if unit price was not explicitly overridden
          if (resolvedUnitPrice === undefined || resolvedUnitPrice === null) {
            resolvedUnitPrice = Number(product.price);
          }
        }

        if (resolvedUnitPrice === undefined || resolvedUnitPrice === null) {
          const error: AppError = new Error(`Unit price must be specified for line item: ${item.description}`);
          error.statusCode = 400;
          error.code = 'INVALID_UNIT_PRICE';
          throw error;
        }

        lineInputs.push({
          productId: item.productId || null,
          description: item.description,
          quantity: item.quantity,
          unitPrice: resolvedUnitPrice,
          discount: item.discount,
          tax: item.tax
        });
      }

      // 4. Calculate authoritative totals
      const totals = calculateDocumentTotals(lineInputs);

      // 5. Generate Quote Number
      let quoteNumber = await this.generateQuoteNumber(tx, organizationId);

      // Verify unique quoteNumber
      let existingQuote = await tx.quote.findUnique({
        where: { organizationId_quoteNumber: { organizationId, quoteNumber } }
      });
      if (existingQuote) {
        quoteNumber = `QT-${Date.now().toString().slice(-6)}`;
      }

      // 6. Create Quote
      const quote = await tx.quote.create({
        data: {
          organizationId,
          accountId: input.accountId || null,
          opportunityId: input.opportunityId || null,
          createdById: userId,
          quoteNumber,
          status: QuoteStatus.DRAFT,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
          validUntil: input.validUntil ? new Date(input.validUntil) : null,
          notes: input.notes || null,
          items: {
            create: totals.items.map((it) => ({
              productId: it.productId,
              description: it.description,
              quantity: it.quantity,
              unitPrice: it.unitPrice,
              discount: it.discount,
              tax: it.tax,
              total: it.total
            }))
          }
        },
        include: {
          items: {
            include: { product: true }
          },
          account: true,
          opportunity: true
        }
      });

      // 7. Audit log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'CREATE',
          entity: 'Quote',
          entityId: quote.id,
          newValue: {
            quoteNumber: quote.quoteNumber,
            total: Number(quote.total),
            status: quote.status
          }
        }
      });

      return this.formatQuote(quote);
    });
  }

  /**
   * Update quote. Approved quotes are immutable.
   */
  public async updateQuote(organizationId: string, userId: string, id: string, input: UpdateQuoteInput) {
    return prisma.$transaction(async (tx) => {
      const existing = await tx.quote.findFirst({
        where: { id, organizationId },
        include: { items: true }
      });

      if (!existing) {
        const error: AppError = new Error('Quote not found in your organization');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      // Approved quote immutability rule
      if (existing.status === QuoteStatus.APPROVED) {
        const error: AppError = new Error('Approved quotes are immutable and cannot have their terms modified');
        error.statusCode = 400;
        error.code = 'QUOTE_IMMUTABLE';
        throw error;
      }

      if (existing.status === QuoteStatus.REJECTED || existing.status === QuoteStatus.EXPIRED) {
        const error: AppError = new Error(`Cannot modify a quote with status '${existing.status}'`);
        error.statusCode = 400;
        error.code = 'INVALID_STATUS_TRANSITION';
        throw error;
      }

      // Validate Account if updating
      if (input.accountId !== undefined && input.accountId !== null) {
        const account = await tx.account.findFirst({
          where: { id: input.accountId, organizationId, deletedAt: null }
        });
        if (!account) {
          const error: AppError = new Error('Associated Customer account not found');
          error.statusCode = 404;
          error.code = 'NOT_FOUND';
          throw error;
        }
      }

      // Validate Opportunity if updating
      if (input.opportunityId !== undefined && input.opportunityId !== null) {
        const opp = await tx.opportunity.findFirst({
          where: { id: input.opportunityId, organizationId, deletedAt: null }
        });
        if (!opp) {
          const error: AppError = new Error('Associated Opportunity not found');
          error.statusCode = 404;
          error.code = 'NOT_FOUND';
          throw error;
        }
      }

      let subtotal = existing.subtotal;
      let discount = existing.discount;
      let tax = existing.tax;
      let total = existing.total;

      // If updating items, recalculate totals
      if (input.items && input.items.length > 0) {
        const lineInputs: LineItemInput[] = [];

        for (const item of input.items) {
          let resolvedUnitPrice = item.unitPrice;

          if (item.productId) {
            const product = await tx.product.findFirst({
              where: { id: item.productId, organizationId, deletedAt: null }
            });

            if (!product) {
              const error: AppError = new Error(`Product not found (ID: ${item.productId})`);
              error.statusCode = 404;
              error.code = 'NOT_FOUND';
              throw error;
            }

            if (!product.isActive) {
              const error: AppError = new Error(`Product '${product.name}' is inactive and cannot be added`);
              error.statusCode = 400;
              error.code = 'PRODUCT_INACTIVE';
              throw error;
            }

            if (resolvedUnitPrice === undefined || resolvedUnitPrice === null) {
              resolvedUnitPrice = Number(product.price);
            }
          }

          if (resolvedUnitPrice === undefined || resolvedUnitPrice === null) {
            const error: AppError = new Error(`Unit price must be specified for: ${item.description}`);
            error.statusCode = 400;
            error.code = 'INVALID_UNIT_PRICE';
            throw error;
          }

          lineInputs.push({
            productId: item.productId || null,
            description: item.description,
            quantity: item.quantity,
            unitPrice: resolvedUnitPrice,
            discount: item.discount,
            tax: item.tax
          });
        }

        const calculated = calculateDocumentTotals(lineInputs);
        subtotal = calculated.subtotal;
        discount = calculated.discount;
        tax = calculated.tax;
        total = calculated.total;

        // Replace existing items
        await tx.quoteItem.deleteMany({ where: { quoteId: existing.id } });
        await tx.quoteItem.createMany({
          data: calculated.items.map((it) => ({
            quoteId: existing.id,
            productId: it.productId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: it.discount,
            tax: it.tax,
            total: it.total
          }))
        });
      }

      const updateData: Prisma.QuoteUpdateInput = {
        subtotal,
        discount,
        tax,
        total
      };

      if (input.accountId !== undefined) updateData.account = input.accountId ? { connect: { id: input.accountId } } : { disconnect: true };
      if (input.opportunityId !== undefined) updateData.opportunity = input.opportunityId ? { connect: { id: input.opportunityId } } : { disconnect: true };
      if (input.validUntil !== undefined) updateData.validUntil = input.validUntil ? new Date(input.validUntil) : null;
      if (input.notes !== undefined) updateData.notes = input.notes;

      const updated = await tx.quote.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          items: { include: { product: true } },
          account: true,
          opportunity: true
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'UPDATE',
          entity: 'Quote',
          entityId: updated.id,
          oldValue: { total: Number(existing.total), status: existing.status },
          newValue: { total: Number(updated.total), status: updated.status }
        }
      });

      return this.formatQuote(updated);
    });
  }

  /**
   * Delete quote if DRAFT or REJECTED.
   */
  public async deleteQuote(organizationId: string, userId: string, id: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, organizationId }
    });

    if (!quote) {
      const error: AppError = new Error('Quote not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (quote.status === QuoteStatus.APPROVED) {
      const error: AppError = new Error('Cannot delete an approved quote');
      error.statusCode = 400;
      error.code = 'CANNOT_DELETE_APPROVED_QUOTE';
      throw error;
    }

    await prisma.quote.delete({
      where: { id: quote.id }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'DELETE',
        entity: 'Quote',
        entityId: id,
        oldValue: { quoteNumber: quote.quoteNumber, total: Number(quote.total) }
      }
    });

    return { message: 'Quote deleted successfully' };
  }

  /**
   * Send quote (Transition DRAFT -> SENT).
   */
  public async sendQuote(organizationId: string, userId: string, id: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, organizationId }
    });

    if (!quote) {
      const error: AppError = new Error('Quote not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (quote.status !== QuoteStatus.DRAFT) {
      const error: AppError = new Error(`Cannot send quote with status '${quote.status}'`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.SENT }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'SEND',
        entity: 'Quote',
        entityId: quote.id,
        oldValue: { status: quote.status },
        newValue: { status: QuoteStatus.SENT }
      }
    });

    return this.formatQuote(updated);
  }

  /**
   * Approve quote. Enforces RBAC & non-expired rules.
   */
  public async approveQuote(organizationId: string, userId: string, id: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, organizationId }
    });

    if (!quote) {
      const error: AppError = new Error('Quote not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (quote.status === QuoteStatus.APPROVED) {
      const error: AppError = new Error('Quote is already approved');
      error.statusCode = 400;
      error.code = 'ALREADY_APPROVED';
      throw error;
    }

    if (quote.status === QuoteStatus.REJECTED || quote.status === QuoteStatus.EXPIRED) {
      const error: AppError = new Error(`Cannot approve a quote that is ${quote.status}`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    // Check expiration date
    if (quote.validUntil && new Date(quote.validUntil) < new Date()) {
      const error: AppError = new Error('Cannot approve an expired quote. Please extend the validity date first.');
      error.statusCode = 400;
      error.code = 'QUOTE_EXPIRED';
      throw error;
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.APPROVED }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'APPROVE',
        entity: 'Quote',
        entityId: quote.id,
        oldValue: { status: quote.status },
        newValue: { status: QuoteStatus.APPROVED }
      }
    });

    return this.formatQuote(updated);
  }

  /**
   * Reject quote.
   */
  public async rejectQuote(organizationId: string, userId: string, id: string, reason?: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, organizationId }
    });

    if (!quote) {
      const error: AppError = new Error('Quote not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (quote.status === QuoteStatus.APPROVED) {
      const error: AppError = new Error('Cannot reject an already approved quote');
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const notesUpdate = reason ? (quote.notes ? `${quote.notes}\nRejection Reason: ${reason}` : `Rejection Reason: ${reason}`) : quote.notes;

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: {
        status: QuoteStatus.REJECTED,
        notes: notesUpdate
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'REJECT',
        entity: 'Quote',
        entityId: quote.id,
        oldValue: { status: quote.status },
        newValue: { status: QuoteStatus.REJECTED, reason }
      }
    });

    return this.formatQuote(updated);
  }

  /**
   * Mark quote as expired.
   */
  public async expireQuote(organizationId: string, userId: string, id: string) {
    const quote = await prisma.quote.findFirst({
      where: { id, organizationId }
    });

    if (!quote) {
      const error: AppError = new Error('Quote not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (quote.status === QuoteStatus.APPROVED) {
      const error: AppError = new Error('Cannot expire an approved quote');
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await prisma.quote.update({
      where: { id: quote.id },
      data: { status: QuoteStatus.EXPIRED }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'EXPIRE',
        entity: 'Quote',
        entityId: quote.id,
        oldValue: { status: quote.status },
        newValue: { status: QuoteStatus.EXPIRED }
      }
    });

    return this.formatQuote(updated);
  }

  /**
   * Convert Approved Quote to an Order.
   * Atomically executed inside a transaction.
   * Returns 409 CONFLICT if quote was already converted.
   * Preserves historical approved pricing!
   */
  public async convertQuoteToOrder(organizationId: string, userId: string, quoteId: string) {
    return prisma.$transaction(async (tx) => {
      // 1. Load Quote with items
      const quote = await tx.quote.findFirst({
        where: { id: quoteId, organizationId },
        include: { items: true }
      });

      if (!quote) {
        const error: AppError = new Error('Quote not found in your organization');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      // 2. Validate status is APPROVED
      if (quote.status !== QuoteStatus.APPROVED) {
        const error: AppError = new Error(`Only approved quotes can be converted to orders. Current status: ${quote.status}`);
        error.statusCode = 400;
        error.code = 'QUOTE_NOT_APPROVED';
        throw error;
      }

      // 3. Check for existing converted order (Double Conversion Protection)
      const existingOrder = await tx.order.findFirst({
        where: { quoteId: quote.id, organizationId }
      });

      if (existingOrder) {
        const error: AppError = new Error(
          `This quote has already been converted to Order #${existingOrder.orderNumber}`
        );
        error.statusCode = 409;
        error.code = 'ALREADY_CONVERTED';
        throw error;
      }

      // 4. Generate sequential order number
      let orderNumber = await this.generateOrderNumber(tx, organizationId);
      const existingOrderNumber = await tx.order.findUnique({
        where: { organizationId_orderNumber: { organizationId, orderNumber } }
      });
      if (existingOrderNumber) {
        orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      }

      // 5. Create Order inheriting approved commercial terms
      const order = await tx.order.create({
        data: {
          organizationId,
          accountId: quote.accountId,
          opportunityId: quote.opportunityId,
          quoteId: quote.id,
          createdById: userId,
          orderNumber,
          status: OrderStatus.PENDING,
          subtotal: quote.subtotal,
          discount: quote.discount,
          tax: quote.tax,
          total: quote.total,
          notes: quote.notes ? `Converted from Quote ${quote.quoteNumber}. ${quote.notes}` : `Converted from Quote ${quote.quoteNumber}`,
          items: {
            create: quote.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discount: item.discount,
              tax: item.tax,
              total: item.total
            }))
          }
        },
        include: {
          items: { include: { product: true } },
          account: true,
          opportunity: true,
          quote: true
        }
      });

      // 6. Audit log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'CONVERT_TO_ORDER',
          entity: 'Quote',
          entityId: quote.id,
          newValue: {
            orderId: order.id,
            orderNumber: order.orderNumber,
            total: Number(order.total)
          }
        }
      });

      return {
        ...order,
        subtotal: Number(order.subtotal),
        discount: Number(order.discount),
        tax: Number(order.tax),
        total: Number(order.total),
        items: order.items.map((it: any) => ({
          ...it,
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount),
          tax: Number(it.tax),
          total: Number(it.total)
        }))
      };
    });
  }
}

export const quotesService = new QuotesService();
