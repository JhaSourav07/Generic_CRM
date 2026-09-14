import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { opportunitiesService } from '@/services/opportunities.service';
import { Opportunity, PipelineStage } from '@/types/opportunities.types';
import { useToast } from '@/components/ui/toast';

interface ChangeStageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: Opportunity | null;
  stages: PipelineStage[];
}

export const ChangeStageModal: React.FC<ChangeStageModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity,
  stages
}) => {
  const [selectedStageId, setSelectedStageId] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  React.useEffect(() => {
    if (opportunity) {
      setSelectedStageId(opportunity.stageId);
    }
  }, [opportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity || !selectedStageId) return;

    try {
      setLoading(true);
      await opportunitiesService.changeStage(opportunity.id, selectedStageId);

      const newStage = stages.find((s) => s.id === selectedStageId);
      toast({
        type: 'success',
        title: 'Stage Updated',
        message: `'${opportunity.name}' moved to '${newStage?.name || 'new stage'}'.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to Change Stage',
        message: err.message || 'Could not change opportunity stage.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Change Pipeline Stage" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs text-vynexa-text-secondary mb-3">
            Select the new pipeline stage for deal <span className="font-semibold text-vynexa-text-primary">{opportunity?.name}</span>:
          </p>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Target Stage
          </label>
          <Select
            value={selectedStageId}
            onChange={(e) => setSelectedStageId(e.target.value)}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary"
          >
            {stages.map((stage) => (
              <option key={stage.id} value={stage.id}>
                {stage.name} ({Math.round(stage.probability * 100)}% probability)
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Update Stage
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
