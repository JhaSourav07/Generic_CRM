import { Router } from 'express';
import { quotesController } from './quotes.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const quotesRoutes = Router();

quotesRoutes.use(requireAuth);

quotesRoutes.get('/', requirePermission('quotes', 'VIEW'), (req, res, next) =>
  quotesController.getQuotes(req, res, next)
);

quotesRoutes.get('/:id', requirePermission('quotes', 'VIEW'), (req, res, next) =>
  quotesController.getQuoteById(req, res, next)
);

quotesRoutes.post('/', requirePermission('quotes', 'CREATE'), (req, res, next) =>
  quotesController.createQuote(req, res, next)
);

quotesRoutes.patch('/:id', requirePermission('quotes', 'UPDATE'), (req, res, next) =>
  quotesController.updateQuote(req, res, next)
);

quotesRoutes.delete('/:id', requirePermission('quotes', 'DELETE'), (req, res, next) =>
  quotesController.deleteQuote(req, res, next)
);

quotesRoutes.post('/:id/send', requirePermission('quotes', 'UPDATE'), (req, res, next) =>
  quotesController.sendQuote(req, res, next)
);

quotesRoutes.post('/:id/approve', requirePermission('quotes', 'APPROVE'), (req, res, next) =>
  quotesController.approveQuote(req, res, next)
);

quotesRoutes.post('/:id/reject', requirePermission('quotes', 'UPDATE'), (req, res, next) =>
  quotesController.rejectQuote(req, res, next)
);

quotesRoutes.post('/:id/expire', requirePermission('quotes', 'UPDATE'), (req, res, next) =>
  quotesController.expireQuote(req, res, next)
);

quotesRoutes.post('/:id/convert-to-order', requirePermission('orders', 'CREATE'), (req, res, next) =>
  quotesController.convertToOrder(req, res, next)
);
