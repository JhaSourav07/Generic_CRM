import { Request, Response, NextFunction } from 'express';
import { contactsService } from './contacts.service.js';
import {
  getContactsQuerySchema,
  createContactSchema,
  updateContactSchema
} from './contacts.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

export class ContactsController {
  public async getContacts(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const query = getContactsQuerySchema.parse(req.query);
      const result = await contactsService.getContacts(req.user.organizationId, query);

      res.status(200).json({
        success: true,
        data: result.contacts,
        meta: result.meta,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async getContactById(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const contact = await contactsService.getContactById(req.user.organizationId, id);

      res.status(200).json({
        success: true,
        data: contact,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async createContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const input = createContactSchema.parse(req.body);
      const contact = await contactsService.createContact(req.user.organizationId, req.user.userId, input);

      res.status(201).json({
        success: true,
        data: contact,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async updateContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const input = updateContactSchema.parse(req.body);
      const updated = await contactsService.updateContact(req.user.organizationId, req.user.userId, id, input);

      res.status(200).json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  public async deleteContact(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      if (!req.user) {
        const error: AppError = new Error('Authentication required');
        error.statusCode = 401;
        error.code = 'UNAUTHORIZED';
        return next(error);
      }

      const { id } = req.params;
      const result = await contactsService.deleteContact(req.user.organizationId, req.user.userId, id);

      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const contactsController = new ContactsController();
