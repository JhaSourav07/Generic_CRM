import { PrismaClient, Prisma } from '@prisma/client';
import {
  CreatePipelineInput,
  UpdatePipelineInput,
  CreateStageInput,
  UpdateStageInput,
  ReorderStagesInput
} from './pipelines.validation.js';
import { AppError } from '../../middleware/errorHandler.js';

const prisma = new PrismaClient();

export class PipelinesService {
  /**
   * List all pipelines belonging to the tenant organization.
   */
  public async getPipelines(organizationId: string) {
    const pipelines = await prisma.pipeline.findMany({
      where: { organizationId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'asc' }
      ],
      include: {
        stages: {
          orderBy: { order: 'asc' }
        },
        _count: {
          select: {
            opportunities: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return pipelines;
  }

  /**
   * Get a single pipeline by ID within tenant boundary.
   */
  public async getPipelineById(organizationId: string, pipelineId: string) {
    const pipeline = await prisma.pipeline.findFirst({
      where: {
        id: pipelineId,
        organizationId
      },
      include: {
        stages: {
          orderBy: { order: 'asc' },
          include: {
            _count: {
              select: {
                opportunities: {
                  where: { deletedAt: null }
                }
              }
            }
          }
        },
        _count: {
          select: {
            opportunities: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    if (!pipeline) {
      const error: AppError = new Error('Sales pipeline not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    return pipeline;
  }

  /**
   * Create a new pipeline with optional initial stages inside an atomic transaction.
   */
  public async createPipeline(organizationId: string, currentUserId: string, input: CreatePipelineInput) {
    return await prisma.$transaction(async (tx) => {
      // If this pipeline is marked default, unset isDefault on existing pipelines
      if (input.isDefault) {
        await tx.pipeline.updateMany({
          where: { organizationId, isDefault: true },
          data: { isDefault: false }
        });
      }

      // Determine default stages if none provided
      const stageData = input.stages && input.stages.length > 0
        ? input.stages.map((stage, idx) => ({
            name: stage.name.trim(),
            order: stage.order !== undefined ? stage.order : idx + 1,
            probability: stage.probability !== undefined ? stage.probability : 0
          }))
        : [
            { name: 'Qualification', order: 1, probability: 0.2 },
            { name: 'Value Proposal', order: 2, probability: 0.4 },
            { name: 'Negotiation', order: 3, probability: 0.7 },
            { name: 'Closed Won', order: 4, probability: 1.0 },
            { name: 'Closed Lost', order: 5, probability: 0.0 }
          ];

      const pipeline = await tx.pipeline.create({
        data: {
          organizationId,
          name: input.name.trim(),
          description: input.description?.trim() || null,
          isDefault: input.isDefault ?? false,
          stages: {
            create: stageData
          }
        },
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'PIPELINE_CREATED',
          entity: 'Pipeline',
          entityId: pipeline.id,
          newValue: {
            name: pipeline.name,
            isDefault: pipeline.isDefault,
            stagesCount: pipeline.stages.length
          }
        }
      });

      return pipeline;
    });
  }

  /**
   * Update pipeline details.
   */
  public async updatePipeline(organizationId: string, currentUserId: string, pipelineId: string, input: UpdatePipelineInput) {
    return await prisma.$transaction(async (tx) => {
      const existing = await tx.pipeline.findFirst({
        where: { id: pipelineId, organizationId }
      });

      if (!existing) {
        const error: AppError = new Error('Sales pipeline not found');
        error.statusCode = 404;
        error.code = 'NOT_FOUND';
        throw error;
      }

      if (input.isDefault) {
        await tx.pipeline.updateMany({
          where: { organizationId, isDefault: true, id: { not: pipelineId } },
          data: { isDefault: false }
        });
      }

      const updated = await tx.pipeline.update({
        where: { id: pipelineId },
        data: {
          name: input.name !== undefined ? input.name.trim() : undefined,
          description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
          isDefault: input.isDefault !== undefined ? input.isDefault : undefined
        },
        include: {
          stages: {
            orderBy: { order: 'asc' }
          }
        }
      });

      // Audit Log
      await tx.auditLog.create({
        data: {
          organizationId,
          userId: currentUserId,
          action: 'PIPELINE_UPDATED',
          entity: 'Pipeline',
          entityId: pipelineId,
          oldValue: {
            name: existing.name,
            description: existing.description,
            isDefault: existing.isDefault
          },
          newValue: {
            name: updated.name,
            description: updated.description,
            isDefault: updated.isDefault
          }
        }
      });

      return updated;
    });
  }

  /**
   * Safely delete a pipeline. Rejects if active opportunities depend on it.
   */
  public async deletePipeline(organizationId: string, currentUserId: string, pipelineId: string) {
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: pipelineId, organizationId }
    });

    if (!pipeline) {
      const error: AppError = new Error('Sales pipeline not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Safety check: protect active sales opportunities
    const activeOpportunitiesCount = await prisma.opportunity.count({
      where: {
        pipelineId,
        organizationId,
        deletedAt: null
      }
    });

    if (activeOpportunitiesCount > 0) {
      const error: AppError = new Error('This pipeline contains active opportunities and cannot be deleted.');
      error.statusCode = 409;
      error.code = 'CONFLICT';
      throw error;
    }

    await prisma.pipeline.delete({
      where: { id: pipelineId }
    });

    // Audit Log
    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'PIPELINE_DELETED',
        entity: 'Pipeline',
        entityId: pipelineId,
        oldValue: {
          name: pipeline.name
        }
      }
    });

    return { success: true, message: 'Pipeline successfully deleted' };
  }

  /**
   * Get stages for a pipeline.
   */
  public async getStages(organizationId: string, pipelineId: string) {
    await this.getPipelineById(organizationId, pipelineId);

    const stages = await prisma.pipelineStage.findMany({
      where: { pipelineId },
      orderBy: { order: 'asc' },
      include: {
        _count: {
          select: {
            opportunities: {
              where: { deletedAt: null }
            }
          }
        }
      }
    });

    return stages;
  }

  /**
   * Create a stage in a pipeline.
   */
  public async createStage(organizationId: string, currentUserId: string, pipelineId: string, input: CreateStageInput) {
    await this.getPipelineById(organizationId, pipelineId);

    let stageOrder = input.order;
    if (stageOrder === undefined) {
      const lastStage = await prisma.pipelineStage.findFirst({
        where: { pipelineId },
        orderBy: { order: 'desc' }
      });
      stageOrder = (lastStage?.order ?? 0) + 1;
    }

    const stage = await prisma.pipelineStage.create({
      data: {
        pipelineId,
        name: input.name.trim(),
        order: stageOrder,
        probability: input.probability !== undefined ? input.probability : 0
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'PIPELINE_STAGE_CREATED',
        entity: 'PipelineStage',
        entityId: stage.id,
        newValue: {
          pipelineId,
          name: stage.name,
          order: stage.order,
          probability: stage.probability
        }
      }
    });

    return stage;
  }

  /**
   * Update a pipeline stage.
   */
  public async updateStage(organizationId: string, currentUserId: string, stageId: string, input: UpdateStageInput) {
    const existing = await prisma.pipelineStage.findFirst({
      where: {
        id: stageId,
        pipeline: { organizationId }
      },
      include: { pipeline: true }
    });

    if (!existing) {
      const error: AppError = new Error('Pipeline stage not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    const updated = await prisma.pipelineStage.update({
      where: { id: stageId },
      data: {
        name: input.name !== undefined ? input.name.trim() : undefined,
        order: input.order !== undefined ? input.order : undefined,
        probability: input.probability !== undefined ? input.probability : undefined
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'PIPELINE_STAGE_UPDATED',
        entity: 'PipelineStage',
        entityId: stageId,
        oldValue: {
          name: existing.name,
          order: existing.order,
          probability: existing.probability
        },
        newValue: {
          name: updated.name,
          order: updated.order,
          probability: updated.probability
        }
      }
    });

    return updated;
  }

  /**
   * Delete a pipeline stage. Rejects if opportunities are assigned to it.
   */
  public async deleteStage(organizationId: string, currentUserId: string, stageId: string) {
    const stage = await prisma.pipelineStage.findFirst({
      where: {
        id: stageId,
        pipeline: { organizationId }
      },
      include: { pipeline: true }
    });

    if (!stage) {
      const error: AppError = new Error('Pipeline stage not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // Safety check: protect opportunities in this stage
    const opportunitiesCount = await prisma.opportunity.count({
      where: {
        stageId,
        organizationId,
        deletedAt: null
      }
    });

    if (opportunitiesCount > 0) {
      const error: AppError = new Error('This stage contains opportunities and cannot be deleted.');
      error.statusCode = 409;
      error.code = 'CONFLICT';
      throw error;
    }

    await prisma.pipelineStage.delete({
      where: { id: stageId }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'PIPELINE_STAGE_DELETED',
        entity: 'PipelineStage',
        entityId: stageId,
        oldValue: {
          name: stage.name,
          pipelineId: stage.pipelineId
        }
      }
    });

    return { success: true, message: 'Pipeline stage successfully deleted' };
  }

  /**
   * Reorder pipeline stages in batch transaction.
   */
  public async reorderStages(organizationId: string, currentUserId: string, pipelineId: string, input: ReorderStagesInput) {
    await this.getPipelineById(organizationId, pipelineId);

    // Two-phase transaction avoids unique constraint collision on [pipelineId, order]
    await prisma.$transaction(async (tx) => {
      // Phase 1: Set temporary negative orders
      for (let i = 0; i < input.stages.length; i++) {
        await tx.pipelineStage.updateMany({
          where: { id: input.stages[i].id, pipelineId },
          data: { order: -(i + 1) }
        });
      }

      // Phase 2: Set final target orders
      for (const stage of input.stages) {
        await tx.pipelineStage.updateMany({
          where: { id: stage.id, pipelineId },
          data: { order: stage.order }
        });
      }
    });

    await prisma.auditLog.create({
      data: {
        organizationId,
        userId: currentUserId,
        action: 'PIPELINE_STAGES_REORDERED',
        entity: 'Pipeline',
        entityId: pipelineId,
        newValue: { count: input.stages.length }
      }
    });

    return { success: true, message: 'Stages reordered successfully' };
  }

  /**
   * High-Performance Single-Query Pipeline Kanban Board Aggregate Endpoint.
   * Zero N+1 queries. Reads pipeline, stages in order, and active opportunities grouped by stage.
   */
  public async getPipelineBoard(organizationId: string, pipelineId?: string) {
    // 1. Resolve pipeline: specified ID, or default, or first available
    let targetPipelineId = pipelineId && pipelineId !== 'default' ? pipelineId : undefined;

    if (!targetPipelineId) {
      const defaultPipeline = await prisma.pipeline.findFirst({
        where: { organizationId, isDefault: true }
      });
      if (defaultPipeline) {
        targetPipelineId = defaultPipeline.id;
      } else {
        const anyPipeline = await prisma.pipeline.findFirst({
          where: { organizationId },
          orderBy: { createdAt: 'asc' }
        });
        if (anyPipeline) {
          targetPipelineId = anyPipeline.id;
        }
      }
    }

    if (!targetPipelineId) {
      // No pipelines exist yet for this tenant
      return {
        pipeline: null,
        stages: [],
        totals: {
          openCount: 0,
          openValue: 0,
          weightedValue: 0,
          wonValue: 0,
          lostValue: 0
        }
      };
    }

    // 2. Fetch pipeline with stages in order
    const pipeline = await prisma.pipeline.findFirst({
      where: { id: targetPipelineId, organizationId },
      include: {
        stages: {
          orderBy: { order: 'asc' }
        }
      }
    });

    if (!pipeline) {
      const error: AppError = new Error('Sales pipeline not found');
      error.statusCode = 404;
      error.code = 'NOT_FOUND';
      throw error;
    }

    // 3. Fetch all active opportunities for this pipeline in a single database query
    const opportunities = await prisma.opportunity.findMany({
      where: {
        pipelineId: targetPipelineId,
        organizationId,
        deletedAt: null
      },
      orderBy: { createdAt: 'desc' },
      include: {
        account: {
          select: {
            id: true,
            name: true,
            industry: true
          }
        },
        contact: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            phone: true
          }
        },
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true
          }
        },
        stage: {
          select: {
            id: true,
            name: true,
            order: true,
            probability: true
          }
        }
      }
    });

    // 4. Group opportunities by stage & calculate real aggregates
    const oppsByStage = new Map<string, typeof opportunities>();
    for (const stage of pipeline.stages) {
      oppsByStage.set(stage.id, []);
    }

    let openCount = 0;
    let openValue = 0;
    let weightedValue = 0;
    let wonValue = 0;
    let lostValue = 0;

    for (const opp of opportunities) {
      const numValue = Number(opp.value || 0);
      const stageList = oppsByStage.get(opp.stageId);
      if (stageList) {
        stageList.push(opp);
      }

      const stageLower = opp.stage?.name?.toLowerCase() || '';
      const isWon = opp.status === 'WON' || stageLower.includes('won');
      const isLost = opp.status === 'LOST' || stageLower.includes('lost');

      if (isWon) {
        wonValue += numValue;
      } else if (isLost) {
        lostValue += numValue;
      } else {
        openCount += 1;
        openValue += numValue;
        const prob = opp.probability > 0 ? opp.probability : (opp.stage?.probability || 0);
        weightedValue += numValue * prob;
      }
    }

    const stagesWithData = pipeline.stages.map((stage) => {
      const stageOpps = oppsByStage.get(stage.id) || [];
      const stageTotal = stageOpps.reduce((acc, opp) => acc + Number(opp.value || 0), 0);

      return {
        id: stage.id,
        pipelineId: stage.pipelineId,
        name: stage.name,
        order: stage.order,
        probability: stage.probability,
        opportunityCount: stageOpps.length,
        totalValue: stageTotal,
        opportunities: stageOpps.map((opp) => ({
          id: opp.id,
          name: opp.name,
          description: opp.description,
          value: Number(opp.value || 0),
          probability: opp.probability,
          expectedCloseDate: opp.expectedCloseDate,
          status: opp.status,
          lostReason: opp.lostReason,
          closedAt: opp.closedAt,
          createdAt: opp.createdAt,
          updatedAt: opp.updatedAt,
          account: opp.account,
          contact: opp.contact,
          owner: opp.owner,
          stage: opp.stage
        }))
      };
    });

    return {
      pipeline: {
        id: pipeline.id,
        name: pipeline.name,
        description: pipeline.description,
        isDefault: pipeline.isDefault,
        createdAt: pipeline.createdAt,
        updatedAt: pipeline.updatedAt
      },
      stages: stagesWithData,
      totals: {
        openCount,
        openValue,
        weightedValue: Math.round(weightedValue * 100) / 100,
        wonValue,
        lostValue
      }
    };
  }
}

export const pipelinesService = new PipelinesService();
