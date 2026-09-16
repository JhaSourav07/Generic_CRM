import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';
import {
  getOrdersQuerySchema,
  createOrderSchema,
  updateOrderSchema,
  cancelOrderSchema
} from './orders.validation.js';
import { AuthContext } from '../../utils/auth-helpers.js';

function getAuthContext(req: Request): AuthContext {
  const u = (req as any).user;
  return {
    userId: u.userId || u.id,
    organizationId: u.organizationId,
    role: u.roleName || u.role || 'SALES_REPRESENTATIVE',
    email: u.email || ''
  };
}

export class OrdersController {
  public async getOrders(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getOrdersQuerySchema.parse(req.query);
      const organizationId = req.user!.organizationId;

      const result = await ordersService.getOrders(organizationId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result.orders,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  public async getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const order = await ordersService.getOrderById(organizationId, req.params.id);

      res.status(200).json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  public async createOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const validatedData = createOrderSchema.parse(req.body);

      const order = await ordersService.createOrder(context, validatedData);

      res.status(201).json({
        success: true,
        data: order
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const validatedData = updateOrderSchema.parse(req.body);

      const updated = await ordersService.updateOrder(
        context,
        req.params.id,
        validatedData
      );

      res.status(200).json({
        success: true,
        data: updated
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);

      const result = await ordersService.deleteOrder(context, req.params.id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async confirmOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);

      const result = await ordersService.confirmOrder(context, req.params.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Order confirmed successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async processOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);

      const result = await ordersService.processOrder(context, req.params.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Order marked as processing.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async completeOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);

      const result = await ordersService.completeOrder(context, req.params.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Order completed successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async cancelOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { reason } = cancelOrderSchema.parse(req.body);

      const result = await ordersService.cancelOrder(context, req.params.id, reason);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Order cancelled.'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const ordersController = new OrdersController();
