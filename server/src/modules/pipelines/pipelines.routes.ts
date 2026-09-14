import { Router } from 'express';
import { pipelinesController } from './pipelines.controller.js';
import { requireAuth, requirePermission } from '../../middleware/auth.middleware.js';

export const pipelinesRoutes = Router();
export const pipelineStagesRoutes = Router();

// Pipeline Routes
pipelinesRoutes.use(requireAuth);

pipelinesRoutes.get('/', requirePermission('pipelines', 'VIEW'), (req, res, next) =>
  pipelinesController.getPipelines(req, res, next)
);
pipelinesRoutes.get('/:id/board', requirePermission('pipelines', 'VIEW'), (req, res, next) =>
  pipelinesController.getPipelineBoard(req, res, next)
);
pipelinesRoutes.get('/:id/stages', requirePermission('pipelines', 'VIEW'), (req, res, next) =>
  pipelinesController.getStages(req, res, next)
);
pipelinesRoutes.get('/:id', requirePermission('pipelines', 'VIEW'), (req, res, next) =>
  pipelinesController.getPipelineById(req, res, next)
);
pipelinesRoutes.post('/', requirePermission('pipelines', 'CREATE'), (req, res, next) =>
  pipelinesController.createPipeline(req, res, next)
);
pipelinesRoutes.patch('/:id/stages/reorder', requirePermission('pipelines', 'UPDATE'), (req, res, next) =>
  pipelinesController.reorderStages(req, res, next)
);
pipelinesRoutes.patch('/:id', requirePermission('pipelines', 'UPDATE'), (req, res, next) =>
  pipelinesController.updatePipeline(req, res, next)
);
pipelinesRoutes.delete('/:id', requirePermission('pipelines', 'DELETE'), (req, res, next) =>
  pipelinesController.deletePipeline(req, res, next)
);
pipelinesRoutes.post('/:id/stages', requirePermission('pipelines', 'CREATE'), (req, res, next) =>
  pipelinesController.createStage(req, res, next)
);

// Pipeline Stages Direct Routes
pipelineStagesRoutes.use(requireAuth);

pipelineStagesRoutes.patch('/:id', requirePermission('pipelines', 'UPDATE'), (req, res, next) =>
  pipelinesController.updateStage(req, res, next)
);
pipelineStagesRoutes.delete('/:id', requirePermission('pipelines', 'DELETE'), (req, res, next) =>
  pipelinesController.deleteStage(req, res, next)
);
