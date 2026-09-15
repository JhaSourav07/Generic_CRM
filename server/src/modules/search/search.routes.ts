import { Router } from 'express';
import { searchController } from './search.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';

export const searchRoutes = Router();

// Search requires authentication
searchRoutes.use(requireAuth);

searchRoutes.get('/', (req, res, next) => searchController.search(req, res, next));
