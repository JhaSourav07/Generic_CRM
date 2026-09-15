import { Router } from 'express';
import { supportCasesController } from './support.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const supportCasesRoutes = Router();

supportCasesRoutes.use(requireAuth);

supportCasesRoutes.get('/', requirePermission('support_cases', 'VIEW'), (req, res, next) =>
  supportCasesController.list(req, res, next)
);

supportCasesRoutes.get('/:id', requirePermission('support_cases', 'VIEW'), (req, res, next) =>
  supportCasesController.getById(req, res, next)
);

supportCasesRoutes.post('/', requirePermission('support_cases', 'CREATE'), (req, res, next) =>
  supportCasesController.create(req, res, next)
);

supportCasesRoutes.patch('/:id', requirePermission('support_cases', 'UPDATE'), (req, res, next) =>
  supportCasesController.update(req, res, next)
);

supportCasesRoutes.patch('/:id/status', requirePermission('support_cases', 'UPDATE'), (req, res, next) =>
  supportCasesController.changeStatus(req, res, next)
);

supportCasesRoutes.patch('/:id/assign', requirePermission('support_cases', 'ASSIGN'), (req, res, next) =>
  supportCasesController.assign(req, res, next)
);

supportCasesRoutes.post('/:id/resolve', requirePermission('support_cases', 'UPDATE'), (req, res, next) =>
  supportCasesController.resolve(req, res, next)
);

supportCasesRoutes.post('/:id/close', requirePermission('support_cases', 'UPDATE'), (req, res, next) =>
  supportCasesController.close(req, res, next)
);

supportCasesRoutes.post('/:id/reopen', requirePermission('support_cases', 'UPDATE'), (req, res, next) =>
  supportCasesController.reopen(req, res, next)
);

supportCasesRoutes.delete('/:id', requirePermission('support_cases', 'DELETE'), (req, res, next) =>
  supportCasesController.delete(req, res, next)
);
