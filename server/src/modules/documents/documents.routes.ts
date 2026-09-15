import { Router } from 'express';
import multer from 'multer';
import { documentsController } from './documents.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';
import { MAX_FILE_SIZE_BYTES } from '../../storage/storage.service.js';

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: MAX_FILE_SIZE_BYTES
  }
});

export const documentsRoutes = Router();

documentsRoutes.use(requireAuth);

documentsRoutes.get('/', requirePermission('documents', 'VIEW'), (req, res, next) =>
  documentsController.list(req, res, next)
);

documentsRoutes.get('/:id', requirePermission('documents', 'VIEW'), (req, res, next) =>
  documentsController.getById(req, res, next)
);

documentsRoutes.get('/:id/download', requirePermission('documents', 'VIEW'), (req, res, next) =>
  documentsController.download(req, res, next)
);

documentsRoutes.post(
  '/upload',
  requirePermission('documents', 'CREATE'),
  upload.single('file'),
  (req, res, next) => documentsController.upload(req, res, next)
);

documentsRoutes.patch('/:id', requirePermission('documents', 'UPDATE'), (req, res, next) =>
  documentsController.update(req, res, next)
);

documentsRoutes.delete('/:id', requirePermission('documents', 'DELETE'), (req, res, next) =>
  documentsController.delete(req, res, next)
);
