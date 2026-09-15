import { Request, Response, NextFunction } from 'express';
import { searchQuerySchema } from './search.validation.js';
import { searchService } from './search.service.js';
import { AuthContext } from '../../utils/rbac.js';

export class SearchController {
  public async search(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const parsed = searchQuerySchema.parse(req.query);
      const user = (req as any).user;

      const authContext: AuthContext = {
        userId: user.userId,
        email: user.email,
        role: user.roleName || user.role?.name || 'MEMBER',
        organizationId: user.organizationId
      };

      const result = await searchService.search(authContext, parsed.q, parsed.limit);

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

export const searchController = new SearchController();
