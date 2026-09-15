import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { campaignsService } from '@/services/campaigns.service';
import { Campaign, CampaignLeadItem, CampaignStatus } from '@/types/campaigns.types';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import { AddLeadsToCampaignModal } from '@/components/campaigns/AddLeadsToCampaignModal';
import { DistributionBar } from '@/components/reports/DistributionBar';
import {
  ArrowLeft,
  Calendar,
  DollarSign,
  TrendingUp,
  Users,
  Target,
  ShoppingCart,
  Percent,
  Plus,
  Trash2,
  Play,
  Pause,
  CheckCircle2,
  XCircle,
  Edit2
} from 'lucide-react';

export const CampaignDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [leads, setLeads] = useState<CampaignLeadItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [leadsLoading, setLeadsLoading] = useState(true);
  const [leadsPage, setLeadsPage] = useState(1);
  const [leadsTotalPages, setLeadsTotalPages] = useState(1);
  const [leadsTotal, setLeadsTotal] = useState(0);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddLeadsOpen, setIsAddLeadsOpen] = useState(false);

  const fetchCampaign = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      const data = await campaignsService.getCampaignById(id);
      setCampaign(data);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Campaign Not Found',
        message: err.message || 'Could not retrieve campaign details.'
      });
      navigate('/app/campaigns');
    } finally {
      setLoading(false);
    }
  }, [id, navigate, toast]);

  const fetchLeads = useCallback(async () => {
    if (!id) return;
    try {
      setLeadsLoading(true);
      const res = await campaignsService.getCampaignLeads(id, {
        page: leadsPage,
        limit: 20
      });
      setLeads(res.leads);
      setLeadsTotalPages(res.pagination.totalPages);
      setLeadsTotal(res.pagination.total);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to load campaign leads',
        message: err.message
      });
    } finally {
      setLeadsLoading(false);
    }
  }, [id, leadsPage, toast]);

  useEffect(() => {
    fetchCampaign();
  }, [fetchCampaign]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleStatusChange = async (newStatus: CampaignStatus) => {
    if (!id) return;
    try {
      const updated = await campaignsService.changeStatus(id, newStatus);
      setCampaign(updated);
      toast({
        title: 'Status Updated',
        message: `Campaign status changed to ${newStatus}.`,
        type: 'success'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to update status',
        message: err.message
      });
    }
  };

  const handleRemoveLead = async (leadItem: CampaignLeadItem) => {
    if (!id) return;
    if (
      !window.confirm(
        `Remove lead "${leadItem.lead.firstName} ${leadItem.lead.lastName}" from this campaign?`
      )
    ) {
      return;
    }

    try {
      await campaignsService.removeLead(id, leadItem.leadId);
      toast({
        title: 'Lead Removed',
        message: 'The lead has been detached from this campaign.',
        type: 'success'
      });
      fetchLeads();
      fetchCampaign(); // Refresh attribution metrics
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to remove lead',
        message: err.message
      });
    }
  };

  const getStatusBadge = (st: CampaignStatus) => {
    switch (st) {
      case 'ACTIVE':
        return <Badge variant="emerald">Active</Badge>;
      case 'PLANNING':
        return <Badge variant="blue">Planning</Badge>;
      case 'PAUSED':
        return <Badge variant="amber">Paused</Badge>;
      case 'COMPLETED':
        return <Badge variant="slate">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="red">Cancelled</Badge>;
      default:
        return <Badge variant="outline">{st}</Badge>;
    }
  };

  if (loading || !campaign) {
    return (
      <div className="py-20 text-center text-xs text-vynexa-text-muted">
        Loading campaign details...
      </div>
    );
  }

  const metrics = campaign.metrics || {
    totalLeads: 0,
    leadsByStatus: {},
    qualifiedLeads: 0,
    convertedLeads: 0,
    conversionRate: 0,
    linkedOpportunitiesCount: 0,
    pipelineValue: 0,
    wonValue: 0,
    attributableOrdersCount: 0,
    attributableRevenue: 0,
    roi: null
  };

  // Convert status breakdown to segments for DistributionBar
  const statusSegments = Object.entries(metrics.leadsByStatus || {}).map(
    ([statusKey, count]) => ({
      label: statusKey,
      count
    })
  );

  return (
    <div className="space-y-6 pb-12">
      {/* Back button */}
      <div>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/app/campaigns')}
          className="text-xs text-vynexa-text-muted hover:text-vynexa-text-primary px-0"
        >
          <ArrowLeft className="h-3.5 w-3.5 mr-1" />
          Back to Campaigns
        </Button>
      </div>

      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-vynexa-border pb-5">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-xl font-bold text-vynexa-text-primary">
              {campaign.name}
            </h1>
            {getStatusBadge(campaign.status)}
            {campaign.type && (
              <span className="text-xs px-2 py-0.5 rounded bg-vynexa-surface-secondary text-vynexa-text-secondary border border-vynexa-border">
                {campaign.type}
              </span>
            )}
          </div>
          {campaign.description && (
            <p className="mt-1.5 text-xs text-vynexa-text-secondary max-w-2xl">
              {campaign.description}
            </p>
          )}
          <div className="mt-2 flex flex-wrap items-center gap-4 text-xs text-vynexa-text-muted">
            <div className="flex items-center gap-1 font-mono">
              <Calendar className="h-3.5 w-3.5" />
              <span>
                {campaign.startDate ? campaign.startDate.split('T')[0] : 'Open'}
                {' → '}
                {campaign.endDate ? campaign.endDate.split('T')[0] : 'Ongoing'}
              </span>
            </div>
            {campaign.budget !== null && campaign.budget !== undefined && (
              <div className="flex items-center gap-1 font-mono text-vynexa-text-secondary">
                <DollarSign className="h-3.5 w-3.5" />
                <span>Budget: ${Number(campaign.budget).toLocaleString()}</span>
              </div>
            )}
            {campaign.createdBy && (
              <div>Owner: {campaign.createdBy.name || campaign.createdBy.email}</div>
            )}
          </div>
        </div>

        {/* Lifecycle Status & Edit Actions */}
        <div className="flex flex-wrap items-center gap-2">
          {campaign.status === 'PLANNING' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('ACTIVE')}
              className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
            >
              <Play className="h-3 w-3 mr-1" />
              Launch Campaign
            </Button>
          )}

          {campaign.status === 'ACTIVE' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('PAUSED')}
                className="text-xs border-amber-500/30 text-amber-400 hover:bg-amber-500/10"
              >
                <Pause className="h-3 w-3 mr-1" />
                Pause
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('COMPLETED')}
                className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Button>
            </>
          )}

          {campaign.status === 'PAUSED' && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('ACTIVE')}
                className="text-xs border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
              >
                <Play className="h-3 w-3 mr-1" />
                Resume
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleStatusChange('COMPLETED')}
                className="text-xs border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
              >
                <CheckCircle2 className="h-3 w-3 mr-1" />
                Complete
              </Button>
            </>
          )}

          {campaign.status !== 'CANCELLED' && campaign.status !== 'COMPLETED' && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleStatusChange('CANCELLED')}
              className="text-xs border-rose-500/30 text-rose-400 hover:bg-rose-500/10"
            >
              <XCircle className="h-3 w-3 mr-1" />
              Cancel
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsEditOpen(true)}
            className="text-xs"
          >
            <Edit2 className="h-3.5 w-3.5 mr-1" />
            Edit
          </Button>
        </div>
      </div>

      {/* Attribution & ROI Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
          <span className="text-[11px] text-vynexa-text-muted">Total Leads</span>
          <div className="mt-1 font-mono text-xl font-semibold text-vynexa-text-primary">
            {metrics.totalLeads}
          </div>
          <span className="text-[10px] text-vynexa-text-muted">Linked Candidates</span>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
          <span className="text-[11px] text-vynexa-text-muted">Qualified / Converted</span>
          <div className="mt-1 font-mono text-xl font-semibold text-emerald-400">
            {metrics.convertedLeads}
          </div>
          <span className="text-[10px] text-vynexa-text-muted">
            {metrics.conversionRate}% conversion
          </span>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
          <span className="text-[11px] text-vynexa-text-muted">Pipeline Deals</span>
          <div className="mt-1 font-mono text-xl font-semibold text-blue-400">
            {metrics.linkedOpportunitiesCount}
          </div>
          <span className="text-[10px] text-vynexa-text-muted">Active Pipeline</span>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
          <span className="text-[11px] text-vynexa-text-muted">Pipeline Value</span>
          <div className="mt-1 font-mono text-xl font-semibold text-vynexa-text-primary">
            ${metrics.pipelineValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-vynexa-text-muted">Forecasted Deals</span>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
          <span className="text-[11px] text-vynexa-text-muted">Attributable Revenue</span>
          <div className="mt-1 font-mono text-xl font-semibold text-emerald-400">
            ${metrics.attributableRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
          </div>
          <span className="text-[10px] text-vynexa-text-muted">
            {metrics.attributableOrdersCount} Closed Orders
          </span>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
          <span className="text-[11px] text-vynexa-text-muted">Campaign ROI</span>
          <div className="mt-1 font-mono text-xl font-semibold text-vynexa-text-primary">
            {metrics.roi !== null ? (
              <span className={metrics.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                {metrics.roi > 0 ? `+${metrics.roi}%` : `${metrics.roi}%`}
              </span>
            ) : (
              <span className="text-vynexa-text-muted text-sm font-normal">N/A (No Budget)</span>
            )}
          </div>
          <span className="text-[10px] text-vynexa-text-muted">Return on Investment</span>
        </div>
      </div>

      {/* Lead Funnel Breakdown */}
      {statusSegments.length > 0 && (
        <DistributionBar
          title="Campaign Lead Status Distribution"
          segments={statusSegments}
          totalCount={metrics.totalLeads}
        />
      )}

      {/* Attached Leads Section */}
      <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-semibold text-vynexa-text-primary">
              Associated Leads ({leadsTotal})
            </h3>
            <p className="text-xs text-vynexa-text-muted">
              Leads linked to this marketing campaign for source tracking and pipeline conversion.
            </p>
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsAddLeadsOpen(true)}
            className="flex items-center gap-1 text-xs"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Add Leads</span>
          </Button>
        </div>

        {/* Leads Table */}
        <div className="rounded-md border border-vynexa-border overflow-hidden">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-secondary font-medium">
                <th className="py-2.5 px-3">Lead Name</th>
                <th className="py-2.5 px-3">Company</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-center">Score</th>
                <th className="py-2.5 px-3">Owner</th>
                <th className="py-2.5 px-3">Attached Date</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vynexa-border/60">
              {leadsLoading ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-vynexa-text-muted">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-vynexa-text-muted">
                    No leads linked to this campaign yet. Click "Add Leads" to link candidate leads.
                  </td>
                </tr>
              ) : (
                leads.map((item) => (
                  <tr key={item.id} className="hover:bg-vynexa-surface-secondary/40 transition-colors">
                    <td className="py-2.5 px-3 font-medium text-vynexa-text-primary">
                      {item.lead.firstName} {item.lead.lastName}
                      {item.lead.email && (
                        <div className="text-[11px] text-vynexa-text-muted font-normal">
                          {item.lead.email}
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-vynexa-text-secondary">
                      {item.lead.company || '—'}
                    </td>
                    <td className="py-2.5 px-3">
                      <Badge variant="outline">{item.lead.status}</Badge>
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono text-vynexa-text-secondary">
                      {item.lead.score}
                    </td>
                    <td className="py-2.5 px-3 text-vynexa-text-secondary">
                      {item.lead.owner ? item.lead.owner.name || item.lead.owner.email : 'Unassigned'}
                    </td>
                    <td className="py-2.5 px-3 font-mono text-[11px] text-vynexa-text-muted">
                      {item.addedAt ? item.addedAt.split('T')[0] : '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveLead(item)}
                        className="h-6 w-6 p-0 text-vynexa-text-muted hover:text-vynexa-status-danger"
                        title="Remove Lead from Campaign"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Leads Pagination */}
        {leadsTotalPages > 1 && (
          <div className="flex items-center justify-between text-xs text-vynexa-text-muted pt-2">
            <span>
              Page {leadsPage} of {leadsTotalPages}
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadsPage((p) => Math.max(1, p - 1))}
                disabled={leadsPage <= 1 || leadsLoading}
                className="h-6 px-2 text-xs"
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setLeadsPage((p) => Math.min(leadsTotalPages, p + 1))}
                disabled={leadsPage >= leadsTotalPages || leadsLoading}
                className="h-6 px-2 text-xs"
              >
                Next
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <EditCampaignModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        campaign={campaign}
        onSuccess={() => {
          fetchCampaign();
        }}
      />

      <AddLeadsToCampaignModal
        isOpen={isAddLeadsOpen}
        onClose={() => setIsAddLeadsOpen(false)}
        campaignId={campaign.id}
        existingLeadIds={leads.map((l) => l.leadId)}
        onSuccess={() => {
          fetchLeads();
          fetchCampaign();
        }}
      />
    </div>
  );
};
