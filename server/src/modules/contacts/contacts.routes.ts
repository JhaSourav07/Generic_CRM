import { Router } from 'express';
import { contactsController } from './contacts.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const contactsRoutes = Router();

contactsRoutes.use(requireAuth);

contactsRoutes.get('/', requirePermission('contacts', 'VIEW'), (req, res, next) => contactsController.getContacts(req, res, next));
contactsRoutes.get('/:id', requirePermission('contacts', 'VIEW'), (req, res, next) => contactsController.getContactById(req, res, next));
contactsRoutes.post('/', requirePermission('contacts', 'CREATE'), (req, res, next) => contactsController.createContact(req, res, next));
contactsRoutes.patch('/:id', requirePermission('contacts', 'UPDATE'), (req, res, next) => contactsController.updateContact(req, res, next));
contactsRoutes.delete('/:id', requirePermission('contacts', 'DELETE'), (req, res, next) => contactsController.deleteContact(req, res, next));
