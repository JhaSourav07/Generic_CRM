import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { opportunitiesService } from '@/services/opportunities.service';
import { Opportunity } from '@/types/opportunities.types';
import { useToast } from '@/components/ui/toast';
import { Trophy } from 'lucide-react';

interface MarkWonModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: Opportunity | null;
}

export const MarkWonModal: React.FC<MarkWonModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleConfirm = async () => {
    if (!opportunity) return;
    try {
      setLoading(true);
      await opportunitiesService.winOpportunity(opportunity.id);

      toast({
        type: 'success',
        title: 'Deal Won! 🎉',
        message: `Opportunity '${opportunity.name}' has been marked as WON.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not mark opportunity as won.'
      });
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Mark Opportunity as Won" maxWidth="sm">
      <div className="space-y-4">
        <div className="flex items-center gap-3 p-3 rounded-lg border border-vynexa-border bg-vynexa-surface">
          <div className="h-10 w-10 rounded-full bg-vynexa-emerald/10 border border-vynexa-emerald/20 flex items-center justify-center shrink-0">
            <Trophy className="h-5 w-5 text-vynexa-emerald" />
          </div>
          <div>
            <div className="font-semibold text-vynexa-text-primary text-sm">{opportunity?.name}</div>
            <div className="text-xs font-mono text-vynexa-emerald">
              {formatCurrency(opportunity?.value)}
            </div>
          </div>
        </div>

        <p className="text-xs text-vynexa-text-secondary leading-relaxed">
          Are you sure you want to mark this deal as <span className="font-semibold text-vynexa-emerald">Won</span>?
          This will close the opportunity and update executive revenue metrics.
        </p>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            onClick={handleConfirm}
            isLoading={loading}
            className="bg-vynexa-emerald hover:bg-vynexa-emerald/90 text-white"
          >
            Confirm Won
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
