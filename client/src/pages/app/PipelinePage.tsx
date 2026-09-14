import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';

import { opportunitiesService } from '@/services/opportunities.service';
import { Pipeline, PipelineBoardData, Opportunity, PipelineStage } from '@/types/opportunities.types';

import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal';
import { ChangeStageModal } from '@/components/opportunities/ChangeStageModal';
import { MarkWonModal } from '@/components/opportunities/MarkWonModal';
import { MarkLostModal } from '@/components/opportunities/MarkLostModal';

import {
  Plus,
  Kanban,
  DollarSign,
  TrendingUp,
  Trophy,
  XCircle,
  Building2,
  Calendar,
  MoreVertical,
  ArrowRightLeft,
  Eye,
  CheckCircle2
} from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [selectedPipelineId, setSelectedPipelineId] = useState<string>('');
  const [boardData, setBoardData] = useState<PipelineBoardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Drag-and-drop state
  const [draggedOppId, setDraggedOppId] = useState<string | null>(null);
  const [dragOverStageId, setDragOverStageId] = useState<string | null>(null);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOppForStage, setSelectedOppForStage] = useState<Opportunity | null>(null);
  const [selectedOppForWon, setSelectedOppForWon] = useState<Opportunity | null>(null);
  const [selectedOppForLost, setSelectedOppForLost] = useState<Opportunity | null>(null);

  // Initial load of pipelines list
  useEffect(() => {
    opportunitiesService.getPipelines().then((pipes) => {
      setPipelines(pipes);
      if (pipes.length > 0) {
        const defaultPipe = pipes.find((p) => p.isDefault) || pipes[0];
        setSelectedPipelineId(defaultPipe.id);
      }
    }).catch((err) => {
      setError(err.message || 'Failed to load sales pipelines.');
    });
  }, []);

  const fetchBoard = useCallback(async (pipelineId?: string) => {
    try {
      setLoading(true);
      setError(null);
      const data = await opportunitiesService.getPipelineBoard(pipelineId);
      setBoardData(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load pipeline Kanban board.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedPipelineId) {
      fetchBoard(selectedPipelineId);
    }
  }, [selectedPipelineId, fetchBoard]);

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  // Drag and Drop Event Handlers
  const handleDragStart = (e: React.DragEvent, oppId: string) => {
    setDraggedOppId(oppId);
    e.dataTransfer.setData('text/plain', oppId);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverStageId !== stageId) {
      setDragOverStageId(stageId);
    }
  };

  const handleDragLeave = (e: React.DragEvent, stageId: string) => {
    e.preventDefault();
    if (dragOverStageId === stageId) {
      setDragOverStageId(null);
    }
  };

  const handleDrop = async (e: React.DragEvent, targetStageId: string) => {
    e.preventDefault();
    setDragOverStageId(null);

    const oppId = e.dataTransfer.getData('text/plain') || draggedOppId;
    if (!oppId || !boardData) return;

    // Find source stage and opportunity
    let sourceStage: PipelineStage | undefined;
    let targetStage: PipelineStage | undefined;
    let movingOpp: Opportunity | undefined;

    for (const stage of boardData.stages) {
      if (stage.id === targetStageId) targetStage = stage;
      const found = stage.opportunities?.find((o) => o.id === oppId);
      if (found) {
        sourceStage = stage;
        movingOpp = found;
      }
    }

    if (!movingOpp || !sourceStage || !targetStage || sourceStage.id === targetStage.id) {
      return;
    }

    // Save previous state for atomic rollback on failure
    const previousBoard = { ...boardData };

    // Optimistic UI update
    const updatedStages = boardData.stages.map((stage) => {
      if (stage.id === sourceStage?.id) {
        const filtered = (stage.opportunities || []).filter((o) => o.id !== oppId);
        return {
          ...stage,
          opportunities: filtered,
          opportunityCount: filtered.length,
          totalValue: filtered.reduce((acc, o) => acc + Number(o.value || 0), 0)
        };
      }
      if (stage.id === targetStage?.id) {
        const updatedOpp = {
          ...movingOpp!,
          stageId: targetStage!.id,
          stage: targetStage
        };
        const updatedList = [updatedOpp, ...(stage.opportunities || [])];
        return {
          ...stage,
          opportunities: updatedList,
          opportunityCount: updatedList.length,
          totalValue: updatedList.reduce((acc, o) => acc + Number(o.value || 0), 0)
        };
      }
      return stage;
    });

    // Optimistic totals calculation
    let nextOpenCount = 0;
    let nextOpenValue = 0;
    let nextWeightedValue = 0;
    let nextWonValue = 0;
    let nextLostValue = 0;

    for (const st of updatedStages) {
      const stageLower = st.name.toLowerCase();
      const isWon = stageLower.includes('won') || st.probability === 1;
      const isLost = stageLower.includes('lost');

      for (const opp of st.opportunities || []) {
        const val = Number(opp.value || 0);
        if (opp.status === 'WON' || isWon) {
          nextWonValue += val;
        } else if (opp.status === 'LOST' || isLost) {
          nextLostValue += val;
        } else {
          nextOpenCount += 1;
          nextOpenValue += val;
          const p = opp.probability > 0 ? opp.probability : st.probability;
          nextWeightedValue += val * p;
        }
      }
    }

    setBoardData({
      ...boardData,
      stages: updatedStages,
      totals: {
        openCount: nextOpenCount,
        openValue: nextOpenValue,
        weightedValue: nextWeightedValue,
        wonValue: nextWonValue,
        lostValue: nextLostValue
      }
    });

    // Execute backend mutation
    try {
      await opportunitiesService.changeStage(oppId, targetStageId);
      toast({
        type: 'success',
        title: 'Stage Updated',
        message: `'${movingOpp.name}' moved to '${targetStage.name}'.`
      });
      // Synchronize exact aggregates from PostgreSQL
      const freshBoard = await opportunitiesService.getPipelineBoard(selectedPipelineId);
      setBoardData(freshBoard);
    } catch (err: any) {
      // Rollback on failure
      setBoardData(previousBoard);
      toast({
        type: 'error',
        title: 'Stage Movement Failed',
        message: err.message || 'Could not update opportunity stage. Reverting changes.'
      });
      fetchBoard(selectedPipelineId);
    } finally {
      setDraggedOppId(null);
    }
  };

  const totals = boardData?.totals || {
    openCount: 0,
    openValue: 0,
    weightedValue: 0,
    wonValue: 0,
    lostValue: 0
  };

  return (
    <div className="space-y-6">
      {/* Page Header with Pipeline Selector and Actions */}
      <PageHeader
        title="Sales Pipeline"
        description="Visual Kanban deal progression, probability stages, and commercial workspace."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Sales' },
          { label: 'Pipeline' }
        ]}
        actions={
          <div className="flex items-center gap-3">
            {/* Pipeline Selector */}
            {pipelines.length > 1 && (
              <div className="w-56">
                <Select
                  value={selectedPipelineId}
                  onChange={(e) => setSelectedPipelineId(e.target.value)}
                  className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
                >
                  {pipelines.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} {p.isDefault ? '(Default)' : ''}
                    </option>
                  ))}
                </Select>
              </div>
            )}

            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/opportunities')}
            >
              Table View
            </Button>

            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Opportunity
            </Button>
          </div>
        }
      />

      {/* Pipeline Aggregate Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        <Card className="bg-vynexa-surface border-vynexa-border p-3">
          <div className="text-[11px] text-vynexa-text-muted">Open Deals</div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {totals.openCount}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3">
          <div className="text-[11px] text-vynexa-text-muted">Total Pipeline Value</div>
          <div className="text-xl font-bold font-mono text-vynexa-blue mt-1">
            {formatCurrency(totals.openValue)}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3">
          <div className="text-[11px] text-vynexa-text-muted">Weighted Value</div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {formatCurrency(totals.weightedValue)}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3">
          <div className="text-[11px] text-vynexa-text-muted">Closed Won Revenue</div>
          <div className="text-xl font-bold font-mono text-vynexa-emerald mt-1">
            {formatCurrency(totals.wonValue)}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3">
          <div className="text-[11px] text-vynexa-text-muted">Closed Lost</div>
          <div className="text-xl font-bold font-mono text-vynexa-danger mt-1">
            {formatCurrency(totals.lostValue)}
          </div>
        </Card>
      </div>

      {/* Main Kanban Board Columns */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          {[1, 2, 3, 4, 5].map((idx) => (
            <Card key={idx} className="bg-vynexa-surface border-vynexa-border p-4 h-96 space-y-3">
              <Skeleton className="h-6 w-3/4 rounded" />
              <Skeleton className="h-20 w-full rounded-lg" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-vynexa-surface border-vynexa-border p-12 text-center space-y-3">
          <p className="text-sm text-vynexa-danger">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchBoard(selectedPipelineId)}>
            Retry
          </Button>
        </Card>
      ) : !boardData || boardData.stages.length === 0 ? (
        <Card className="bg-vynexa-surface border-vynexa-border p-12 text-center space-y-3">
          <p className="text-sm text-vynexa-text-secondary">No stages configured for this pipeline.</p>
        </Card>
      ) : (
        <div className="flex gap-4 overflow-x-auto pb-4 items-start min-h-[580px]">
          {boardData.stages.map((stage) => {
            const opps = stage.opportunities || [];
            const isDragOver = dragOverStageId === stage.id;

            return (
              <div
                key={stage.id}
                onDragOver={(e) => handleDragOver(e, stage.id)}
                onDragLeave={(e) => handleDragLeave(e, stage.id)}
                onDrop={(e) => handleDrop(e, stage.id)}
                className={`flex-shrink-0 w-72 flex flex-col rounded-lg border bg-vynexa-surface transition-colors ${
                  isDragOver
                    ? 'border-vynexa-blue/80 bg-vynexa-surface-secondary/60 ring-1 ring-vynexa-blue/40'
                    : 'border-vynexa-border'
                }`}
              >
                {/* Stage Header */}
                <div className="p-3 border-b border-vynexa-border bg-vynexa-surface-secondary/40 rounded-t-lg space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold text-vynexa-text-primary tracking-tight">
                      {stage.name}
                    </span>
                    <Badge variant="slate" className="font-mono text-[10px] px-1.5 py-0">
                      {stage.opportunityCount || opps.length}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between text-[11px] font-mono text-vynexa-text-muted">
                    <span>{Math.round(stage.probability * 100)}% prob</span>
                    <span className="text-vynexa-text-secondary font-semibold">
                      {formatCurrency(stage.totalValue)}
                    </span>
                  </div>
                </div>

                {/* Cards Container */}
                <div className="p-2 space-y-2.5 overflow-y-auto max-h-[620px] min-h-[140px]">
                  {opps.length === 0 ? (
                    <div className="h-28 border border-dashed border-vynexa-border/60 rounded-md flex items-center justify-center text-[11px] text-vynexa-text-muted select-none">
                      Drag deals here
                    </div>
                  ) : (
                    opps.map((opp) => (
                      <div
                        key={opp.id}
                        draggable
                        onDragStart={(e) => handleDragStart(e, opp.id)}
                        onClick={() => navigate(`/app/opportunities/${opp.id}`)}
                        className="group relative p-3 rounded-lg border border-vynexa-border bg-vynexa-surface-secondary hover:border-vynexa-border/90 hover:shadow-md cursor-grab active:cursor-grabbing transition-all space-y-2 text-xs select-none"
                      >
                        {/* Title & Amount */}
                        <div className="flex items-start justify-between gap-2">
                          <div className="font-semibold text-vynexa-text-primary group-hover:text-white line-clamp-2">
                            {opp.name}
                          </div>
                          <div className="font-mono font-bold text-vynexa-text-primary whitespace-nowrap">
                            {formatCurrency(opp.value)}
                          </div>
                        </div>

                        {/* Customer context */}
                        {opp.account && (
                          <div className="flex items-center gap-1.5 text-[11px] text-vynexa-text-secondary truncate">
                            <Building2 className="h-3 w-3 text-vynexa-text-muted shrink-0" />
                            <span className="truncate">{opp.account.name}</span>
                          </div>
                        )}

                        {/* Footer: Owner & Close Date & Actions */}
                        <div className="pt-2 border-t border-vynexa-border/50 flex items-center justify-between text-[10px] text-vynexa-text-muted">
                          <span className="truncate max-w-[100px] text-vynexa-text-secondary font-medium">
                            {opp.owner?.name || 'Unassigned'}
                          </span>

                          <div className="flex items-center gap-2">
                            {opp.expectedCloseDate && (
                              <span className="font-mono flex items-center gap-1">
                                <Calendar className="h-2.5 w-2.5" />
                                {new Date(opp.expectedCloseDate).toLocaleDateString(undefined, {
                                  month: 'numeric',
                                  day: 'numeric'
                                })}
                              </span>
                            )}

                            {/* Quick Mark Won / Lost / Change Stage Actions */}
                            {opp.status !== 'WON' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOppForWon(opp);
                                }}
                                className="p-1 rounded hover:bg-vynexa-emerald/20 text-vynexa-text-muted hover:text-vynexa-emerald transition-colors"
                                title="Mark as Won"
                              >
                                <Trophy className="h-3 w-3" />
                              </button>
                            )}

                            {opp.status !== 'LOST' && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedOppForLost(opp);
                                }}
                                className="p-1 rounded hover:bg-vynexa-danger/20 text-vynexa-text-muted hover:text-vynexa-danger transition-colors"
                                title="Mark as Lost"
                              >
                                <XCircle className="h-3 w-3" />
                              </button>
                            )}

                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedOppForStage(opp);
                              }}
                              className="p-1 rounded hover:bg-vynexa-surface text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors"
                              title="Change Stage"
                            >
                              <ArrowRightLeft className="h-3 w-3" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <CreateOpportunityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchBoard(selectedPipelineId)}
        initialPipelineId={selectedPipelineId}
      />

      <ChangeStageModal
        isOpen={!!selectedOppForStage}
        onClose={() => setSelectedOppForStage(null)}
        onSuccess={() => fetchBoard(selectedPipelineId)}
        opportunity={selectedOppForStage}
        stages={boardData?.stages || []}
      />

      <MarkWonModal
        isOpen={!!selectedOppForWon}
        onClose={() => setSelectedOppForWon(null)}
        onSuccess={() => fetchBoard(selectedPipelineId)}
        opportunity={selectedOppForWon}
      />

      <MarkLostModal
        isOpen={!!selectedOppForLost}
        onClose={() => setSelectedOppForLost(null)}
        onSuccess={() => fetchBoard(selectedPipelineId)}
        opportunity={selectedOppForLost}
      />
    </div>
  );
};
