import { Router } from 'express';
import { searchController } from './search.controller.js';
import { requireAuth } from '../../middleware/auth.middleware.js';
import { searchRateLimiter } from '../../middleware/rateLimiter.js';

export const searchRoutes = Router();

// Search requires authentication and rate limiting
searchRoutes.use(requireAuth);
searchRoutes.use(searchRateLimiter);

searchRoutes.get('/', (req, res, next) => searchController.search(req, res, next));

