import { Request, Response, NextFunction } from 'express';
import { ordersService } from './orders.service.js';
import {
  getOrdersQuerySchema,
  createOrderSchema,
  updateOrderSchema,
  cancelOrderSchema
} from './orders.validation.js';

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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const validatedData = createOrderSchema.parse(req.body);

      const order = await ordersService.createOrder(organizationId, userId, validatedData);

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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const validatedData = updateOrderSchema.parse(req.body);

      const updated = await ordersService.updateOrder(
        organizationId,
        userId,
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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await ordersService.deleteOrder(organizationId, userId, req.params.id);

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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await ordersService.confirmOrder(organizationId, userId, req.params.id);

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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await ordersService.processOrder(organizationId, userId, req.params.id);

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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await ordersService.completeOrder(organizationId, userId, req.params.id);

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
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const { reason } = cancelOrderSchema.parse(req.body);

      const result = await ordersService.cancelOrder(organizationId, userId, req.params.id, reason);

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
