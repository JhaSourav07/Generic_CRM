import { Request, Response, NextFunction } from 'express';
import { documentsService } from './documents.service.js';
import {
  listDocumentsSchema,
  uploadDocumentMetadataSchema,
  updateDocumentSchema
} from './documents.validation.js';
import { AuthContext } from '../../utils/rbac.js';

function getAuthContext(req: Request): AuthContext {
  const user = (req as any).user;
  return {
    userId: user.userId || user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId
  };
}

export class DocumentsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const query = listDocumentsSchema.parse(req.query);
      const result = await documentsService.listDocuments(context, query);
      res.json({
        success: true,
        data: result.documents,
        meta: result.pagination,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getById(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const doc = await documentsService.getDocumentById(context, req.params.id);
      res.json({
        success: true,
        data: doc,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async upload(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      if (!req.file) {
        return res.status(400).json({
          success: false,
          data: null,
          error: {
            code: 'FILE_REQUIRED',
            message: 'No file was uploaded.'
          }
        });
      }

      const metadata = uploadDocumentMetadataSchema.parse(req.body);
      const doc = await documentsService.uploadDocument(context, req.file, metadata);
      res.status(201).json({
        success: true,
        data: doc,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async download(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const fileResult = await documentsService.downloadDocument(context, req.params.id);

      res.setHeader('Content-Type', fileResult.mimeType);
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="${encodeURIComponent(fileResult.filename)}"`
      );
      res.setHeader('Content-Length', fileResult.size);

      fileResult.stream.pipe(res);
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = updateDocumentSchema.parse(req.body);
      const updated = await documentsService.updateDocument(context, req.params.id, input);
      res.json({
        success: true,
        data: updated,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await documentsService.deleteDocument(context, req.params.id);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const documentsController = new DocumentsController();
