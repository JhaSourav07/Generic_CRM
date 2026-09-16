import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { opportunitiesService } from '@/services/opportunities.service';
import { Opportunity } from '@/types/opportunities.types';
import { useToast } from '@/components/ui/toast';
import { XCircle } from 'lucide-react';

interface MarkLostModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: Opportunity | null;
}

export const MarkLostModal: React.FC<MarkLostModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity
}) => {
  const [reasonCategory, setReasonCategory] = useState('Price / Budget');
  const [customReason, setCustomReason] = useState('');
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!opportunity) return;
    try {
      setLoading(true);
      const finalReason = customReason.trim()
        ? `${reasonCategory}: ${customReason.trim()}`
        : reasonCategory;

      await opportunitiesService.loseOpportunity(opportunity.id, finalReason);

      toast({
        type: 'info',
        title: 'Deal marked lost',
        message: `'${opportunity.name}' marked as lost.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not mark deal as lost',
        message: err.message || 'Failed to update deal.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Mark deal as lost" maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-vynexa-border bg-vynexa-surface">
          <div className="h-10 w-10 rounded-full bg-vynexa-danger/10 border border-vynexa-danger/20 flex items-center justify-center shrink-0">
            <XCircle className="h-5 w-5 text-vynexa-danger" />
          </div>
          <div>
            <div className="font-semibold text-vynexa-text-primary text-sm">{opportunity?.name}</div>
            <div className="text-xs text-vynexa-text-muted">Record why this deal was lost</div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Reason <span className="text-vynexa-danger">*</span>
          </label>
          <Select
            value={reasonCategory}
            onChange={(e) => setReasonCategory(e.target.value)}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary mb-3"
          >
            <option value="Price / Budget">Price / Budget constraints</option>
            <option value="Competitor Selected">Selected competitor</option>
            <option value="Feature / Technical Mismatch">Missing features</option>
            <option value="Timing / Project Postponed">Project postponed</option>
            <option value="No Decision / Ghosted">No decision</option>
            <option value="Other">Other</option>
          </Select>

          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Additional notes (optional)
          </label>
          <Input
            type="text"
            placeholder="e.g. Budget cut, evaluating next quarter..."
            value={customReason}
            onChange={(e) => setCustomReason(e.target.value)}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary placeholder:text-vynexa-text-muted text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            size="sm"
            onClick={handleConfirm}
            isLoading={loading}
          >
            Mark as lost
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
