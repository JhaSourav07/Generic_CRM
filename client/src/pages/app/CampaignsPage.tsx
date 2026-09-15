import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { campaignsService } from '@/services/campaigns.service';
import { Campaign, CampaignStatus } from '@/types/campaigns.types';
import { CreateCampaignModal } from '@/components/campaigns/CreateCampaignModal';
import { EditCampaignModal } from '@/components/campaigns/EditCampaignModal';
import {
  Megaphone,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  DollarSign,
  Users,
  Calendar,
  MoreHorizontal,
  Trash2,
  Edit2,
  Eye
} from 'lucide-react';

export const CampaignsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [type, setType] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  const fetchCampaigns = useCallback(async () => {
    try {
      setLoading(true);
      const res = await campaignsService.getCampaigns({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: (status as CampaignStatus) || undefined,
        type: type.trim() || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setCampaigns(res.campaigns);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to load campaigns',
        message: err.message || 'An error occurred while fetching campaigns.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, type, toast]);

  useEffect(() => {
    fetchCampaigns();
  }, [fetchCampaigns]);

  const handleDelete = async (campaign: Campaign) => {
    if (!window.confirm(`Are you sure you want to delete campaign "${campaign.name}"?`)) {
      return;
    }

    try {
      await campaignsService.deleteCampaign(campaign.id);
      toast({
        title: 'Campaign Deleted',
        message: `Campaign "${campaign.name}" was removed.`,
        type: 'success'
      });
      fetchCampaigns();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to delete campaign',
        message: err.message || 'An error occurred.'
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

  // High level metrics
  const activeCount = campaigns.filter((c) => c.status === 'ACTIVE').length;
  const totalBudget = campaigns.reduce((sum, c) => sum + (c.budget ? Number(c.budget) : 0), 0);
  const totalLeadsCount = campaigns.reduce((sum, c) => sum + (c._count?.campaignLeads || 0), 0);

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Marketing Campaigns"
        description="Track lead acquisition sources, multi-channel initiatives, pipeline attribution, and real ROI."
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-1.5 shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Create Campaign</span>
          </Button>
        }
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Total Campaigns</span>
            <Megaphone className="h-4 w-4 text-vynexa-text-muted" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-vynexa-text-primary">
            {totalCount}
          </div>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Active Campaigns</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-emerald-400">
            {activeCount}
          </div>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Page Budget Aggregate</span>
            <DollarSign className="h-4 w-4 text-vynexa-text-muted" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-vynexa-text-primary">
            ${totalBudget.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Linked Campaign Leads</span>
            <Users className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-blue-400">
            {totalLeadsCount.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3 justify-between bg-vynexa-surface p-3 rounded-lg border border-vynexa-border">
        <div className="flex flex-1 items-center gap-2.5 w-full sm:w-auto">
          <div className="relative flex-1 sm:max-w-xs">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-vynexa-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search campaigns..."
              className="pl-8 h-9 text-xs"
            />
          </div>

          <div className="w-36">
            <Select
              value={status}
              onChange={(e) => {
                setStatus(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
            >
              <option value="">All Statuses</option>
              <option value="PLANNING">Planning</option>
              <option value="ACTIVE">Active</option>
              <option value="PAUSED">Paused</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>

          <div className="w-40">
            <Select
              value={type}
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
              }}
              className="h-9 text-xs"
            >
              <option value="">All Types</option>
              <option value="Email Marketing">Email Marketing</option>
              <option value="Webinar">Webinar</option>
              <option value="Paid Search / SEM">Paid Search / SEM</option>
              <option value="Paid Social">Paid Social</option>
              <option value="Event / Conference">Event / Conference</option>
              <option value="Outbound Prospecting">Outbound Prospecting</option>
            </Select>
          </div>
        </div>
      </div>

      {/* Campaign Table */}
      <div className="rounded-lg border border-vynexa-border bg-vynexa-surface overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-secondary font-medium select-none">
                <th className="py-3 px-4">Campaign Name</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4">Duration</th>
                <th className="py-3 px-4 text-right">Budget</th>
                <th className="py-3 px-4 text-center">Leads</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vynexa-border/60">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-vynexa-text-muted">
                    Loading campaigns...
                  </td>
                </tr>
              ) : campaigns.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-vynexa-text-muted">
                    No marketing campaigns found. Create your first campaign to begin tracking attribution.
                  </td>
                </tr>
              ) : (
                campaigns.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-vynexa-surface-secondary/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/campaigns/${c.id}`)}
                  >
                    <td className="py-3 px-4">
                      <div className="font-semibold text-vynexa-text-primary group-hover:text-emerald-400 transition-colors">
                        {c.name}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-vynexa-text-muted truncate max-w-xs">
                          {c.description}
                        </div>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(c.status)}
                    </td>
                    <td className="py-3 px-4 text-vynexa-text-secondary">
                      {c.type || '—'}
                    </td>
                    <td className="py-3 px-4 text-vynexa-text-secondary">
                      <div className="flex items-center gap-1 font-mono text-[11px]">
                        <Calendar className="h-3 w-3 text-vynexa-text-muted" />
                        <span>
                          {c.startDate ? c.startDate.split('T')[0] : 'Open'}
                          {' → '}
                          {c.endDate ? c.endDate.split('T')[0] : 'Ongoing'}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-right font-mono text-vynexa-text-primary">
                      {c.budget !== null && c.budget !== undefined
                        ? `$${Number(c.budget).toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                        : '—'}
                    </td>
                    <td className="py-3 px-4 text-center font-mono text-vynexa-text-secondary">
                      {c._count?.campaignLeads || 0}
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => navigate(`/app/campaigns/${c.id}`)}
                          className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-vynexa-text-primary"
                          title="View Campaign Details & Leads"
                        >
                          <Eye className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setEditingCampaign(c)}
                          className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-vynexa-text-primary"
                          title="Edit Campaign"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(c)}
                          className="h-7 w-7 p-0 text-vynexa-text-muted hover:text-vynexa-status-danger"
                          title="Delete Campaign"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between p-3 border-t border-vynexa-border bg-vynexa-surface-secondary/20 text-xs text-vynexa-text-secondary">
            <span>
              Page {page} of {totalPages} ({totalCount} total)
            </span>
            <div className="flex items-center gap-1.5">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1 || loading}
                className="h-7 px-2"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages || loading}
                className="h-7 px-2"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateCampaignModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchCampaigns()}
      />

      <EditCampaignModal
        isOpen={!!editingCampaign}
        onClose={() => setEditingCampaign(null)}
        campaign={editingCampaign}
        onSuccess={() => fetchCampaigns()}
      />
    </div>
  );
};
