import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { campaignsService } from '@/services/campaigns.service';
import { leadsService } from '@/services/leads.service';
import { Lead } from '@/types/leads.types';
import { Search, AlertCircle, CheckSquare, Square } from 'lucide-react';

export interface AddLeadsToCampaignModalProps {
  isOpen: boolean;
  onClose: () => void;
  campaignId: string;
  existingLeadIds: string[];
  onSuccess?: () => void;
}

export const AddLeadsToCampaignModal: React.FC<AddLeadsToCampaignModalProps> = ({
  isOpen,
  onClose,
  campaignId,
  existingLeadIds,
  onSuccess
}) => {
  const { toast } = useToast();

  const [search, setSearch] = useState('');
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      fetchLeads();
      setSelectedIds(new Set());
      setError(null);
    }
  }, [isOpen, search]);

  const fetchLeads = async () => {
    try {
      setLoading(true);
      const res = await leadsService.getLeads({
        search: search.trim() || undefined,
        limit: 50
      });
      setLeads(res.leads || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load leads');
    } finally {
      setLoading(false);
    }
  };

  const toggleLead = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const toggleSelectAll = () => {
    const unattachedLeads = leads.filter((l) => !existingLeadIds.includes(l.id));
    if (selectedIds.size === unattachedLeads.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(unattachedLeads.map((l) => l.id)));
    }
  };

  const handleSubmit = async () => {
    if (selectedIds.size === 0) return;

    try {
      setSubmitting(true);
      setError(null);

      const res = await campaignsService.bulkAddLeads(campaignId, Array.from(selectedIds));

      toast({
        title: 'Leads Attached',
        message: `Successfully linked ${res.addedCount} lead(s) to this campaign.`,
        type: 'success'
      });

      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to attach leads to campaign');
    } finally {
      setSubmitting(false);
    }
  };

  const unattachedLeads = leads.filter((l) => !existingLeadIds.includes(l.id));

  return (
    <Dialog
      isOpen={isOpen}
      onClose={() => {
        if (!submitting) onClose();
      }}
      title="Add Leads to Campaign"
      description="Select candidate leads from your organization to associate with this campaign."
      maxWidth="lg"
    >
      <div className="space-y-4 pt-2">
        {error && (
          <div className="flex items-start gap-2.5 rounded-md border border-vynexa-status-danger/30 bg-vynexa-status-danger-bg/40 p-3 text-xs text-vynexa-status-danger">
            <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-vynexa-text-muted" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search leads by name, email, company..."
              className="pl-9"
              disabled={loading || submitting}
            />
          </div>
          {unattachedLeads.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={toggleSelectAll}
              disabled={submitting}
              className="shrink-0 text-xs"
            >
              {selectedIds.size === unattachedLeads.length ? 'Deselect All' : 'Select All'}
            </Button>
          )}
        </div>

        {/* Lead List Table */}
        <div className="max-h-72 overflow-y-auto rounded-md border border-vynexa-border bg-vynexa-surface-secondary/40 divide-y divide-vynexa-border">
          {loading ? (
            <div className="p-8 text-center text-xs text-vynexa-text-muted">Loading leads...</div>
          ) : leads.length === 0 ? (
            <div className="p-8 text-center text-xs text-vynexa-text-muted">No leads found.</div>
          ) : (
            leads.map((lead) => {
              const isAlreadyAdded = existingLeadIds.includes(lead.id);
              const isSelected = selectedIds.has(lead.id);

              return (
                <div
                  key={lead.id}
                  onClick={() => {
                    if (!isAlreadyAdded && !submitting) {
                      toggleLead(lead.id);
                    }
                  }}
                  className={`flex items-center justify-between p-3 text-xs transition-colors ${
                    isAlreadyAdded
                      ? 'opacity-40 cursor-not-allowed bg-vynexa-surface/20'
                      : isSelected
                      ? 'bg-vynexa-surface cursor-pointer'
                      : 'hover:bg-vynexa-surface/50 cursor-pointer'
                  }`}
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <button
                      type="button"
                      disabled={isAlreadyAdded || submitting}
                      className="text-vynexa-text-secondary focus:outline-none"
                    >
                      {isAlreadyAdded ? (
                        <CheckSquare className="h-4 w-4 text-vynexa-text-muted" />
                      ) : isSelected ? (
                        <CheckSquare className="h-4 w-4 text-vynexa-text-primary" />
                      ) : (
                        <Square className="h-4 w-4 text-vynexa-text-muted" />
                      )}
                    </button>
                    <div className="min-w-0">
                      <div className="font-medium text-vynexa-text-primary truncate">
                        {lead.firstName} {lead.lastName}
                        {lead.company && (
                          <span className="text-vynexa-text-muted font-normal ml-1.5">
                            • {lead.company}
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-vynexa-text-muted truncate">
                        {lead.email || 'No email'}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Badge variant="outline">{lead.status}</Badge>
                    <span className="font-mono text-[11px] text-vynexa-text-secondary">
                      Score: {lead.score}
                    </span>
                    {isAlreadyAdded && (
                      <span className="text-[10px] text-vynexa-text-muted italic ml-1">Added</span>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        <div className="flex items-center justify-between pt-3 border-t border-vynexa-border/60">
          <span className="text-xs text-vynexa-text-muted">
            {selectedIds.size} lead(s) selected
          </span>
          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              onClick={handleSubmit}
              disabled={selectedIds.size === 0 || submitting}
            >
              {submitting ? 'Attaching...' : `Attach Leads (${selectedIds.size})`}
            </Button>
          </div>
        </div>
      </div>
    </Dialog>
  );
};
