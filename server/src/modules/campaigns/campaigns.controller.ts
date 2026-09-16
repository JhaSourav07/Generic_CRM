import { Request, Response, NextFunction } from 'express';
import { campaignsService } from './campaigns.service.js';
import {
  listCampaignsSchema,
  createCampaignSchema,
  updateCampaignSchema,
  addCampaignLeadSchema,
  bulkAddCampaignLeadsSchema,
  listCampaignLeadsSchema
} from './campaigns.validation.js';
import { AuthContext } from '../../utils/rbac.js';

function getAuthContext(req: Request): AuthContext {
  const user = (req as any).user;
  return {
    userId: user.userId || user.id,
    email: user.email,
    role: user.roleName || user.role || 'SALES_REPRESENTATIVE',
    organizationId: user.organizationId
  };
}

export class CampaignsController {
  async list(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const query = listCampaignsSchema.parse(req.query);
      const result = await campaignsService.getCampaigns(context, query);
      res.json({
        success: true,
        data: result.campaigns,
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
      const campaign = await campaignsService.getCampaignById(context, req.params.id);
      res.json({
        success: true,
        data: campaign,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async create(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = createCampaignSchema.parse(req.body);
      const campaign = await campaignsService.createCampaign(context, input);
      res.status(201).json({
        success: true,
        data: campaign,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async update(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const input = updateCampaignSchema.parse(req.body);
      const campaign = await campaignsService.updateCampaign(context, req.params.id, input);
      res.json({
        success: true,
        data: campaign,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async delete(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await campaignsService.deleteCampaign(context, req.params.id);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async activate(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const campaign = await campaignsService.changeStatus(context, req.params.id, 'ACTIVE');
      res.json({
        success: true,
        data: campaign,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async pause(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const campaign = await campaignsService.changeStatus(context, req.params.id, 'PAUSED');
      res.json({
        success: true,
        data: campaign,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async complete(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const campaign = await campaignsService.changeStatus(context, req.params.id, 'COMPLETED');
      res.json({
        success: true,
        data: campaign,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async addLead(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { leadId } = addCampaignLeadSchema.parse({ leadId: req.params.leadId });
      const result = await campaignsService.addLeadToCampaign(context, req.params.id, leadId);
      res.status(200).json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async removeLead(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const result = await campaignsService.removeLeadFromCampaign(context, req.params.id, req.params.leadId);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async bulkAddLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const { leadIds } = bulkAddCampaignLeadsSchema.parse(req.body);
      const result = await campaignsService.bulkAddLeadsToCampaign(context, req.params.id, leadIds);
      res.json({
        success: true,
        data: result,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }

  async getLeads(req: Request, res: Response, next: NextFunction) {
    try {
      const context = getAuthContext(req);
      const query = listCampaignLeadsSchema.parse(req.query);
      const result = await campaignsService.getCampaignLeads(context, req.params.id, query);
      res.json({
        success: true,
        data: result.leads,
        meta: result.pagination,
        error: null
      });
    } catch (err) {
      next(err);
    }
  }
}

export const campaignsController = new CampaignsController();
