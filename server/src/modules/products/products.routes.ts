import { Router } from 'express';
import { productsController } from './products.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const productsRoutes = Router();

productsRoutes.use(requireAuth);

productsRoutes.get('/', requirePermission('products', 'VIEW'), (req, res, next) =>
  productsController.getProducts(req, res, next)
);

productsRoutes.get('/:id', requirePermission('products', 'VIEW'), (req, res, next) =>
  productsController.getProductById(req, res, next)
);

productsRoutes.post('/', requirePermission('products', 'CREATE'), (req, res, next) =>
  productsController.createProduct(req, res, next)
);

productsRoutes.patch('/:id', requirePermission('products', 'UPDATE'), (req, res, next) =>
  productsController.updateProduct(req, res, next)
);

productsRoutes.delete('/:id', requirePermission('products', 'DELETE'), (req, res, next) =>
  productsController.deleteProduct(req, res, next)
);
