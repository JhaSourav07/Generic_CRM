import { Request, Response, NextFunction } from 'express';
import { quotesService } from './quotes.service.js';
import {
  getQuotesQuerySchema,
  createQuoteSchema,
  updateQuoteSchema,
  rejectQuoteSchema
} from './quotes.validation.js';

export class QuotesController {
  public async getQuotes(req: Request, res: Response, next: NextFunction) {
    try {
      const validatedQuery = getQuotesQuerySchema.parse(req.query);
      const organizationId = req.user!.organizationId;

      const result = await quotesService.getQuotes(organizationId, validatedQuery);

      res.status(200).json({
        success: true,
        data: result.quotes,
        pagination: result.pagination
      });
    } catch (err) {
      next(err);
    }
  }

  public async getQuoteById(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const quote = await quotesService.getQuoteById(organizationId, req.params.id);

      res.status(200).json({
        success: true,
        data: quote
      });
    } catch (err) {
      next(err);
    }
  }

  public async createQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const validatedData = createQuoteSchema.parse(req.body);

      const quote = await quotesService.createQuote(organizationId, userId, validatedData);

      res.status(201).json({
        success: true,
        data: quote
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const validatedData = updateQuoteSchema.parse(req.body);

      const updated = await quotesService.updateQuote(
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

  public async deleteQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await quotesService.deleteQuote(organizationId, userId, req.params.id);

      res.status(200).json({
        success: true,
        data: result
      });
    } catch (err) {
      next(err);
    }
  }

  public async sendQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await quotesService.sendQuote(organizationId, userId, req.params.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Quote marked as sent.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async approveQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await quotesService.approveQuote(organizationId, userId, req.params.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Quote approved successfully.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async rejectQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;
      const { reason } = rejectQuoteSchema.parse(req.body);

      const result = await quotesService.rejectQuote(organizationId, userId, req.params.id, reason);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Quote rejected.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async expireQuote(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const result = await quotesService.expireQuote(organizationId, userId, req.params.id);

      res.status(200).json({
        success: true,
        data: result,
        message: 'Quote marked as expired.'
      });
    } catch (err) {
      next(err);
    }
  }

  public async convertToOrder(req: Request, res: Response, next: NextFunction) {
    try {
      const organizationId = req.user!.organizationId;
      const userId = req.user!.userId;

      const order = await quotesService.convertQuoteToOrder(organizationId, userId, req.params.id);

      res.status(201).json({
        success: true,
        data: order,
        message: 'Quote successfully converted to order.'
      });
    } catch (err) {
      next(err);
    }
  }
}

export const quotesController = new QuotesController();
