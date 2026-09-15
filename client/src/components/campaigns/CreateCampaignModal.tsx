import React, { useState } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { campaignsService } from '@/services/campaigns.service';
import { CampaignStatus } from '@/types/campaigns.types';
import { AlertCircle } from 'lucide-react';

export interface CreateCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CAMPAIGN_TYPES = [
  'Email Marketing',
  'Webinar',
  'Paid Search / SEM',
  'Paid Social',
  'Event / Conference',
  'Outbound Prospecting',
  'Content Marketing',
  'Referral Program',
  'Other'
];

export const CreateCampaignModal: React.FC<CreateCampaignModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { toast } = useToast();

  const [name, setName] = useState('');
  const [type, setType] = useState('Email Marketing');
  const [status, setStatus] = useState<CampaignStatus>('PLANNING');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [budget, setBudget] = useState('');
  const [description, setDescription] = useState('');

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetForm = () => {
    setName('');
    setType('Email Marketing');
    setStatus('PLANNING');
    setStartDate('');
    setEndDate('');
    setBudget('');
    setDescription('');
    setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Campaign name is required.');
      return;
    }

    if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
      setError('End date must be on or after start date.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await campaignsService.createCampaign({
        name: name.trim(),
        type: type.trim() || undefined,
        status,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        budget: budget ? parseFloat(budget) : undefined,
        description: description.trim() || undefined
      });

      toast({
        title: 'Campaign Created',
        message: `Campaign "${name}" was created successfully.`,
        type: 'success'
      });

      resetForm();
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!loading) {
          resetForm();
          onClose();
        }
      }}
      title="Create Marketing Campaign"
      description="Define a new marketing campaign to track leads, pipeline attribution, and ROI."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="flex items-start gap-2.5 rounded-md border border-vynexa-status-danger/30 bg-vynexa-status-danger-bg/40 p-3 text-xs text-vynexa-status-danger">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
            Campaign Name <span className="text-vynexa-status-danger">*</span>
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Q4 Enterprise Security Summit"
            disabled={loading}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
              Campaign Type
            </label>
            <Select
              value={type}
              onChange={(e) => setType(e.target.value)}
              disabled={loading}
            >
              {CAMPAIGN_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
              Status
            </label>
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as CampaignStatus)}
              disabled={loading}
            >
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
              Budget ($)
            </label>
            <Input
              type="number"
              min="0"
              step="0.01"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              placeholder="0.00"
              disabled={loading}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
            Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Target audience, channels, and objective goals..."
            rows={3}
            disabled={loading}
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border/60">
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              resetForm();
              onClose();
            }}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating...' : 'Create Campaign'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
