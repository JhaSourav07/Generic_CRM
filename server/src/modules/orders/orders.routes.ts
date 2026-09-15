import { Router } from 'express';
import { ordersController } from './orders.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const ordersRoutes = Router();

ordersRoutes.use(requireAuth);

ordersRoutes.get('/', requirePermission('orders', 'VIEW'), (req, res, next) =>
  ordersController.getOrders(req, res, next)
);

ordersRoutes.get('/:id', requirePermission('orders', 'VIEW'), (req, res, next) =>
  ordersController.getOrderById(req, res, next)
);

ordersRoutes.post('/', requirePermission('orders', 'CREATE'), (req, res, next) =>
  ordersController.createOrder(req, res, next)
);

ordersRoutes.patch('/:id', requirePermission('orders', 'UPDATE'), (req, res, next) =>
  ordersController.updateOrder(req, res, next)
);

ordersRoutes.delete('/:id', requirePermission('orders', 'DELETE'), (req, res, next) =>
  ordersController.deleteOrder(req, res, next)
);

ordersRoutes.post('/:id/confirm', requirePermission('orders', 'UPDATE'), (req, res, next) =>
  ordersController.confirmOrder(req, res, next)
);

ordersRoutes.post('/:id/process', requirePermission('orders', 'UPDATE'), (req, res, next) =>
  ordersController.processOrder(req, res, next)
);

ordersRoutes.post('/:id/complete', requirePermission('orders', 'UPDATE'), (req, res, next) =>
  ordersController.completeOrder(req, res, next)
);

ordersRoutes.post('/:id/cancel', requirePermission('orders', 'UPDATE'), (req, res, next) =>
  ordersController.cancelOrder(req, res, next)
);
