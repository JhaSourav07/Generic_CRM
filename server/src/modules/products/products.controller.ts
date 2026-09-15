import { Request, Response, NextFunction } from 'express';
import { productsService } from './products.service.js';
import {
  getProductsQuerySchema,
  createProductSchema,
  updateProductSchema
} from './products.validation.js';

export class ProductsController {
  public async getProducts(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getProductsQuerySchema.parse(req.query);
      const organizationId = req.user!.organizationId;

      const result = await productsService.getProducts(organizationId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result.products,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  public async getProductById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const product = await productsService.getProductById(organizationId, req.params.id);

      res.status(200).json({
        success: true,
        data: product
      });
    } catch (err) {
      next(err);
    }
  }

  public async createProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const validatedData = createProductSchema.parse(req.body);

      const product = await productsService.createProduct(organizationId, userId, validatedData);

      res.status(201).json({
        success: true,
        data: product
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const validatedData = updateProductSchema.parse(req.body);

      const updated = await productsService.updateProduct(
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

  public async deleteProduct(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await productsService.deleteProduct(organizationId, userId, req.params.id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }
}

export const productsController = new ProductsController();
