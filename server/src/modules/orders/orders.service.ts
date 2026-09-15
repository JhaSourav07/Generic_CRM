import { PrismaClient, Prisma, OrderStatus } from '@prisma/client';
import { GetOrdersQuery, CreateOrderInput, UpdateOrderInput } from './orders.validation.js';
import { calculateDocumentTotals, LineItemInput } from '../../utils/pricing.js';
import { AppError } from '../../middleware/errorHandler.js';
import { notificationsService } from '../notifications/notifications.service.js';

const prisma = new PrismaClient();

export class OrdersService {
  /**
   * Format order record for JSON response with numeric decimal values.
   */
  private formatOrder(order: any) {
    if (!order) return order;
    return {
      ...order,
      subtotal: Number(order.subtotal || 0),
      discount: Number(order.discount || 0),
      tax: Number(order.tax || 0),
      total: Number(order.total || 0),
      items: order.items?.map((item: any) => ({
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
   * Generate sequential order number (e.g. ORD-00001).
   */
  private async generateOrderNumber(tx: Prisma.TransactionClient, organizationId: string): Promise<string> {
    const count = await tx.order.count({ where: { organizationId } });
    const sequence = String(count + 1).padStart(5, '0');
    return `ORD-${sequence}`;
  }

  /**
   * List orders with server-side pagination, search, status filtering, and sorting.
   */
  public async getOrders(organizationId: string, query: Partial<GetOrdersQuery> = {}) {
    const page = query.page ?? 1;
    const limit = query.limit ?? 10;
    const skip = (page - 1) * limit;

    const whereClause: Prisma.OrderWhereInput = {
      organizationId
    };

    // Server-side Search across order number, customer name, quote number, opportunity name
    if (query.search && query.search.trim() !== '') {
      const searchTerm = query.search.trim();
      whereClause.OR = [
        { orderNumber: { contains: searchTerm, mode: 'insensitive' } },
        { account: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { opportunity: { name: { contains: searchTerm, mode: 'insensitive' } } },
        { quote: { quoteNumber: { contains: searchTerm, mode: 'insensitive' } } }
      ];
    }

    if (query.status) {
      whereClause.status = query.status as OrderStatus;
    }

    if (query.accountId) {
      whereClause.accountId = query.accountId;
    }

    if (query.opportunityId) {
      whereClause.opportunityId = query.opportunityId;
    }

    if (query.quoteId) {
      whereClause.quoteId = query.quoteId;
    }

    if (query.ownerId) {
      whereClause.createdById = query.ownerId;
    }

    const allowedSortFields = ['orderNumber', 'total', 'createdAt'];
    const sortBy = query.sortBy && allowedSortFields.includes(query.sortBy) ? query.sortBy : 'createdAt';
    const sortOrder = query.sortOrder ?? 'desc';

    const [total, rawOrders] = await Promise.all([
      prisma.order.count({ where: whereClause }),
      prisma.order.findMany({
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
          quote: {
            select: { id: true, quoteNumber: true, status: true, total: true }
          },
          createdBy: {
            select: { id: true, name: true, email: true }
          },
          _count: {
            select: { items: true }
          }
        }
      })
    ]);

    const orders = rawOrders.map((o) => this.formatOrder(o));

    return {
      orders,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Get single order by ID with all relations.
   */
  public async getOrderById(organizationId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: {
        id,
        organizationId
      },
      include: {
        account: {
          select: { id: true, name: true, email: true, phone: true, address: true, city: true, country: true }
        },
        opportunity: {
          select: { id: true, name: true, value: true }
        },
        quote: {
          select: { id: true, quoteNumber: true, status: true, total: true }
        },
        createdBy: {
          select: { id: true, name: true, email: true }
        },
        items: {
          include: {
            product: {
              select: { id: true, name: true, sku: true, type: true, price: true }
            }
          }
        }
      }
    });

    if (!order) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return this.formatOrder(order);
  }

  /**
   * Manual order creation (if not converted from quote).
   * Atomically calculated and created.
   */
  public async createOrder(organizationId: string, userId: string, input: CreateOrderInput) {
    return prisma.$transaction(async (tx) => {
      // Validate account
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

      // Validate opportunity
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

      // Validate quote
      if (input.quoteId) {
        const quote = await tx.quote.findFirst({
          where: { id: input.quoteId, organizationId }
        });
        if (!quote) {
          const error: AppError = new Error('Associated Quote not found in your organization');
          error.statusCode = 404;
          error.code = 'NOT_FOUND';
          throw error;
        }
      }

      // Resolve items and calculate authoritative pricing
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
            const error: AppError = new Error(`Product '${product.name}' is inactive and cannot be ordered`);
            error.statusCode = 400;
            error.code = 'PRODUCT_INACTIVE';
            throw error;
          }

          if (resolvedUnitPrice === undefined || resolvedUnitPrice === null) {
            resolvedUnitPrice = Number(product.price);
          }
        }

        if (resolvedUnitPrice === undefined || resolvedUnitPrice === null) {
          const error: AppError = new Error(`Unit price must be specified for item: ${item.description}`);
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

      const totals = calculateDocumentTotals(lineInputs);

      let orderNumber = await this.generateOrderNumber(tx, organizationId);
      const existingOrderNumber = await tx.order.findUnique({
        where: { organizationId_orderNumber: { organizationId, orderNumber } }
      });
      if (existingOrderNumber) {
        orderNumber = `ORD-${Date.now().toString().slice(-6)}`;
      }

      const order = await tx.order.create({
        data: {
          organizationId,
          accountId: input.accountId || null,
          opportunityId: input.opportunityId || null,
          quoteId: input.quoteId || null,
          createdById: userId,
          orderNumber,
          status: OrderStatus.PENDING,
          subtotal: totals.subtotal,
          discount: totals.discount,
          tax: totals.tax,
          total: totals.total,
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
          items: { include: { product: true } },
          account: true,
          opportunity: true,
          quote: true
        }
      });

      await tx.auditLog.create({
        data: {
          organizationId,
          userId,
          action: 'CREATE',
          entity: 'Order',
          entityId: order.id,
          newValue: {
            orderNumber: order.orderNumber,
            total: Number(order.total),
            status: order.status
          }
        }
      });

      await notificationsService.createNotification({
        organizationId,
        userId,
        type: 'ORDER_CREATED',
        title: 'Order Created',
        message: `Order #${order.orderNumber} has been created.`
      });

      return this.formatOrder(order);
    });
  }

  /**
   * Update order details (e.g. notes).
   */
  public async updateOrder(organizationId: string, userId: string, id: string, input: UpdateOrderInput) {
    const existing = await prisma.order.findFirst({
      where: { id, organizationId }
    });

    if (!existing) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (existing.status === OrderStatus.COMPLETED || existing.status === OrderStatus.CANCELLED) {
      const error: AppError = new Error(`Cannot modify an order with status '${existing.status}'`);
      error.statusCode = 400;
      error.code = 'ORDER_LOCKED';
      throw error;
    }

    const updated = await prisma.order.update({
      where: { id: existing.id },
      data: {
        notes: input.notes !== undefined ? input.notes : existing.notes
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'UPDATE',
        entity: 'Order',
        entityId: updated.id,
        oldValue: { notes: existing.notes },
        newValue: { notes: updated.notes }
      }
    });

    return this.formatOrder(updated);
  }

  /**
   * Delete order if PENDING or CANCELLED.
   */
  public async deleteOrder(organizationId: string, userId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, organizationId }
    });

    if (!order) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (order.status !== OrderStatus.PENDING && order.status !== OrderStatus.CANCELLED) {
      const error: AppError = new Error(`Cannot delete order with status '${order.status}'`);
      error.statusCode = 400;
      error.code = 'CANNOT_DELETE_ACTIVE_ORDER';
      throw error;
    }

    await prisma.order.delete({
      where: { id: order.id }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'DELETE',
        entity: 'Order',
        entityId: id,
        oldValue: { orderNumber: order.orderNumber, status: order.status }
      }
    });

    return { message: 'Order deleted successfully' };
  }

  /**
   * Confirm order (PENDING -> CONFIRMED).
   */
  public async confirmOrder(organizationId: string, userId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, organizationId }
    });

    if (!order) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (order.status !== OrderStatus.PENDING) {
      const error: AppError = new Error(`Cannot confirm order with current status '${order.status}'`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.CONFIRMED }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'CONFIRM',
        entity: 'Order',
        entityId: order.id,
        oldValue: { status: order.status },
        newValue: { status: OrderStatus.CONFIRMED }
      }
    });

    return this.formatOrder(updated);
  }

  /**
   * Process order (CONFIRMED -> PROCESSING).
   */
  public async processOrder(organizationId: string, userId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, organizationId }
    });

    if (!order) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (order.status !== OrderStatus.CONFIRMED) {
      const error: AppError = new Error(`Cannot process order with current status '${order.status}'. Order must be CONFIRMED first.`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.PROCESSING }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'PROCESS',
        entity: 'Order',
        entityId: order.id,
        oldValue: { status: order.status },
        newValue: { status: OrderStatus.PROCESSING }
      }
    });

    return this.formatOrder(updated);
  }

  /**
   * Complete order (PROCESSING -> COMPLETED).
   */
  public async completeOrder(organizationId: string, userId: string, id: string) {
    const order = await prisma.order.findFirst({
      where: { id, organizationId }
    });

    if (!order) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (order.status !== OrderStatus.PROCESSING) {
      const error: AppError = new Error(`Cannot complete order with current status '${order.status}'. Order must be PROCESSING first.`);
      error.statusCode = 400;
      error.code = 'INVALID_STATUS_TRANSITION';
      throw error;
    }

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: { status: OrderStatus.COMPLETED }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'COMPLETE',
        entity: 'Order',
        entityId: order.id,
        oldValue: { status: order.status },
        newValue: { status: OrderStatus.COMPLETED }
      }
    });

    return this.formatOrder(updated);
  }

  /**
   * Cancel order (PENDING or CONFIRMED -> CANCELLED).
   */
  public async cancelOrder(organizationId: string, userId: string, id: string, reason?: string) {
    const order = await prisma.order.findFirst({
      where: { id, organizationId }
    });

    if (!order) {
      const error: AppError = new Error('Order not found in your organization');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    if (order.status === OrderStatus.COMPLETED) {
      const error: AppError = new Error('Completed orders cannot be cancelled');
      error.statusCode = 400;
      error.code = 'CANNOT_CANCEL_COMPLETED_ORDER';
      throw error;
    }

    if (order.status === OrderStatus.CANCELLED) {
      const error: AppError = new Error('Order is already cancelled');
      error.statusCode = 400;
      error.code = 'ALREADY_CANCELLED';
      throw error;
    }

    const notesUpdate = reason ? (order.notes ? `${order.notes}\nCancellation Reason: ${reason}` : `Cancellation Reason: ${reason}`) : order.notes;

    const updated = await prisma.order.update({
      where: { id: order.id },
      data: {
        status: OrderStatus.CANCELLED,
        notes: notesUpdate
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId,
        action: 'CANCEL',
        entity: 'Order',
        entityId: order.id,
        oldValue: { status: order.status },
        newValue: { status: OrderStatus.CANCELLED, reason }
      }
    });

    return this.formatOrder(updated);
  }
}

export const ordersService = new OrdersService();
