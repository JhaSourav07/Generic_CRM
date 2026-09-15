import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { opportunitiesService } from '@/services/opportunities.service';
import { usersService } from '@/services/users.service';
import { Opportunity, Pipeline, OpportunityStatus } from '@/types/opportunities.types';
import { UserItem } from '@/types/users.types';

import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal';
import { EditOpportunityModal } from '@/components/opportunities/EditOpportunityModal';
import { ChangeStageModal } from '@/components/opportunities/ChangeStageModal';
import { MarkWonModal } from '@/components/opportunities/MarkWonModal';
import { MarkLostModal } from '@/components/opportunities/MarkLostModal';

import {
  Plus,
  Search,
  Kanban,
  DollarSign,
  TrendingUp,
  Trophy,
  XCircle,
  Eye,
  Edit2,
  Trash2,
  ArrowRightLeft,
  Calendar,
  Building2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export const OpportunitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [pipelineFilter, setPipelineFilter] = useState('');
  const [stageFilter, setStageFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [ownerFilter, setOwnerFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'value' | 'expectedCloseDate'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedOppForEdit, setSelectedOppForEdit] = useState<Opportunity | null>(null);
  const [selectedOppForStage, setSelectedOppForStage] = useState<Opportunity | null>(null);
  const [selectedOppForWon, setSelectedOppForWon] = useState<Opportunity | null>(null);
  const [selectedOppForLost, setSelectedOppForLost] = useState<Opportunity | null>(null);
  const [selectedOppForDelete, setSelectedOppForDelete] = useState<Opportunity | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Metrics
  const [metrics, setMetrics] = useState({
    totalCount: 0,
    openValue: 0,
    wonValue: 0,
    winRate: 0
  });

  const fetchOpportunities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await opportunitiesService.getOpportunities({
        page,
        limit,
        search: search.trim() || undefined,
        pipelineId: pipelineFilter || undefined,
        stageId: stageFilter || undefined,
        status: (statusFilter as OpportunityStatus) || undefined,
        ownerId: ownerFilter || undefined,
        sortBy,
        sortOrder
      });

      setOpportunities(res.opportunities);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total);

      // Compute summary stats from server-side summary or current view
      if (res.summary) {
        const closedCount = res.summary.wonCount + res.summary.lostCount;
        const rate = closedCount > 0 ? Math.round((res.summary.wonCount / closedCount) * 100) : 0;
        setMetrics({
          totalCount: res.summary.totalCount,
          openValue: res.summary.openValue,
          wonValue: res.summary.wonValue,
          winRate: rate
        });
      } else {
        const openDeals = res.opportunities.filter((o) => {
          const stageName = o.stage?.name?.toLowerCase() || '';
          return o.status === 'OPEN' && !stageName.includes('won') && !stageName.includes('lost');
        });
        const wonDeals = res.opportunities.filter((o) => {
          const stageName = o.stage?.name?.toLowerCase() || '';
          return o.status === 'WON' || stageName.includes('won');
        });
        const lostDeals = res.opportunities.filter((o) => {
          const stageName = o.stage?.name?.toLowerCase() || '';
          return o.status === 'LOST' || stageName.includes('lost');
        });

        const openSum = openDeals.reduce((acc, o) => acc + Number(o.value || 0), 0);
        const wonSum = wonDeals.reduce((acc, o) => acc + Number(o.value || 0), 0);
        const closedTotal = wonDeals.length + lostDeals.length;
        const rate = closedTotal > 0 ? Math.round((wonDeals.length / closedTotal) * 100) : 0;

        setMetrics({
          totalCount: res.meta.total,
          openValue: openSum,
          wonValue: wonSum,
          winRate: rate
        });
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunities directory.');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, pipelineFilter, stageFilter, statusFilter, ownerFilter, sortBy, sortOrder]);

  useEffect(() => {
    // Initial pipelines and users
    opportunitiesService.getPipelines().then(setPipelines).catch(() => {});
    usersService.getUsers().then((res) => setUsers(res.users)).catch(() => {});
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      fetchOpportunities();
    }, 250);
    return () => clearTimeout(timer);
  }, [fetchOpportunities]);

  const handleDelete = async () => {
    if (!selectedOppForDelete) return;
    try {
      setDeleting(true);
      await opportunitiesService.deleteOpportunity(selectedOppForDelete.id);
      toast({
        type: 'success',
        title: 'Opportunity Deleted',
        message: `'${selectedOppForDelete.name}' soft-deleted.`
      });
      setSelectedOppForDelete(null);
      fetchOpportunities();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete opportunity.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status: OpportunityStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="blue">Open</Badge>;
      case 'WON':
        return <Badge variant="emerald">Won</Badge>;
      case 'LOST':
        return <Badge variant="red">Lost</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const currentPipeline = pipelines.find((p) => p.id === pipelineFilter);
  const currentStages = currentPipeline ? currentPipeline.stages : [];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Opportunities"
        description="Enterprise sales deal pipeline, value tracking, and probability engine."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Sales' },
          { label: 'Opportunities' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Kanban className="h-3.5 w-3.5" />}
              onClick={() => navigate('/app/pipeline')}
            >
              Pipeline Board
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

      {/* Metrics Bar */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-vynexa-surface border-vynexa-border p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Total Opportunities</span>
            <TrendingUp className="h-4 w-4 text-vynexa-text-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-vynexa-text-primary mt-2">
            {totalCount}
          </div>
          <div className="text-[11px] text-vynexa-text-muted mt-1">Total recorded deals</div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Open Pipeline Value</span>
            <DollarSign className="h-4 w-4 text-vynexa-blue" />
          </div>
          <div className="text-2xl font-bold font-mono text-vynexa-text-primary mt-2">
            {formatCurrency(metrics.openValue)}
          </div>
          <div className="text-[11px] text-vynexa-text-muted mt-1">Active negotiation pipeline</div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Closed Won Revenue</span>
            <Trophy className="h-4 w-4 text-vynexa-emerald" />
          </div>
          <div className="text-2xl font-bold font-mono text-vynexa-emerald mt-2">
            {formatCurrency(metrics.wonValue)}
          </div>
          <div className="text-[11px] text-vynexa-text-muted mt-1">Recognized commercial wins</div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Close Win Rate</span>
            <TrendingUp className="h-4 w-4 text-vynexa-text-muted" />
          </div>
          <div className="text-2xl font-bold font-mono text-vynexa-text-primary mt-2">
            {metrics.winRate}%
          </div>
          <div className="text-[11px] text-vynexa-text-muted mt-1">Won vs. lost closed deals</div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-vynexa-surface border-vynexa-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div className="relative md:col-span-2">
            <Search className="h-4 w-4 absolute left-3 top-2.5 text-vynexa-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search deal name, customer, contact, or owner..."
              className="pl-9 bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            />
          </div>

          <div>
            <Select
              value={pipelineFilter}
              onChange={(e) => {
                setPipelineFilter(e.target.value);
                setStageFilter('');
                setPage(1);
              }}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            >
              <option value="">All Pipelines</option>
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open Only</option>
              <option value="WON">Won Only</option>
              <option value="LOST">Lost Only</option>
            </Select>
          </div>

          <div>
            <Select
              value={ownerFilter}
              onChange={(e) => {
                setOwnerFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            >
              <option value="">All Owners</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </Card>

      {/* Main Opportunities Table */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            <Skeleton className="h-10 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
            <Skeleton className="h-12 w-full rounded" />
          </div>
        ) : error ? (
          <div className="p-8 text-center space-y-3">
            <p className="text-sm text-vynexa-danger">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchOpportunities}>
              Retry
            </Button>
          </div>
        ) : opportunities.length === 0 ? (
          <div className="p-12 text-center space-y-4">
            <div className="h-12 w-12 rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center mx-auto text-vynexa-text-muted">
              <TrendingUp className="h-6 w-6" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-vynexa-text-primary">No opportunities found</h3>
              <p className="text-xs text-vynexa-text-muted mt-1 max-w-sm mx-auto">
                No deal records match your query. Create your first sales opportunity to begin tracking.
              </p>
            </div>
            <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)}>
              <Plus className="h-3.5 w-3.5 mr-1" /> Create Opportunity
            </Button>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="border-b border-vynexa-border bg-vynexa-surface-secondary/40">
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase">Opportunity</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase">Customer</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase">Stage</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase text-right">Value</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase text-center">Probability</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase">Expected Close</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase">Owner</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase">Status</TableHead>
                  <TableHead className="text-[11px] font-semibold text-vynexa-text-secondary uppercase text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {opportunities.map((opp) => (
                  <TableRow key={opp.id} className="border-b border-vynexa-border/60 hover:bg-vynexa-surface-secondary/30 transition-colors">
                    {/* Deal Name */}
                    <TableCell className="font-medium text-xs">
                      <button
                        onClick={() => navigate(`/app/opportunities/${opp.id}`)}
                        className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-left"
                      >
                        {opp.name}
                      </button>
                      {opp.description && (
                        <div className="text-[11px] text-vynexa-text-muted truncate max-w-xs">{opp.description}</div>
                      )}
                    </TableCell>

                    {/* Customer */}
                    <TableCell className="text-xs">
                      {opp.account ? (
                        <button
                          onClick={() => navigate(`/app/customers/${opp.account?.id}`)}
                          className="text-vynexa-text-secondary hover:text-vynexa-text-primary flex items-center gap-1.5 transition-colors"
                        >
                          <Building2 className="h-3 w-3 text-vynexa-text-muted" />
                          <span>{opp.account.name}</span>
                        </button>
                      ) : (
                        <span className="text-vynexa-text-muted">—</span>
                      )}
                    </TableCell>

                    {/* Stage */}
                    <TableCell className="text-xs">
                      <span className="text-vynexa-text-secondary font-medium">
                        {opp.stage?.name || '—'}
                      </span>
                    </TableCell>

                    {/* Value */}
                    <TableCell className="text-xs font-mono font-semibold text-right text-vynexa-text-primary">
                      {formatCurrency(opp.value)}
                    </TableCell>

                    {/* Probability */}
                    <TableCell className="text-center text-xs font-mono text-vynexa-text-secondary">
                      {Math.round((opp.probability || 0) * 100)}%
                    </TableCell>

                    {/* Expected Close */}
                    <TableCell className="text-xs font-mono text-vynexa-text-muted">
                      {opp.expectedCloseDate ? (
                        <span className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(opp.expectedCloseDate).toLocaleDateString()}
                        </span>
                      ) : (
                        '—'
                      )}
                    </TableCell>

                    {/* Owner */}
                    <TableCell className="text-xs text-vynexa-text-secondary">
                      {opp.owner?.name || 'Unassigned'}
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(opp.status)}</TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="View Details"
                          onClick={() => navigate(`/app/opportunities/${opp.id}`)}
                        >
                          <Eye className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                        </Button>

                        {opp.status === 'OPEN' && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              title="Change Stage"
                              onClick={() => setSelectedOppForStage(opp)}
                            >
                              <ArrowRightLeft className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-vynexa-emerald hover:text-vynexa-emerald"
                              title="Mark Won"
                              onClick={() => setSelectedOppForWon(opp)}
                            >
                              <Trophy className="h-3.5 w-3.5" />
                            </Button>

                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-vynexa-danger hover:text-vynexa-danger"
                              title="Mark Lost"
                              onClick={() => setSelectedOppForLost(opp)}
                            >
                              <XCircle className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0"
                          title="Edit"
                          onClick={() => setSelectedOppForEdit(opp)}
                        >
                          <Edit2 className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                        </Button>

                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-7 w-7 p-0 text-vynexa-danger hover:text-vynexa-danger"
                          title="Delete"
                          onClick={() => setSelectedOppForDelete(opp)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}

        {/* Pagination Footer */}
        <div className="p-3 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-text-muted">
          <div>
            Showing {opportunities.length > 0 ? (page - 1) * limit + 1 : 0} to{' '}
            {Math.min(page * limit, totalCount)} of {totalCount} opportunities
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-3.5 w-3.5 mr-1" /> Previous
            </Button>
            <span className="font-mono text-vynexa-text-secondary px-2">
              Page {page} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next <ChevronRight className="h-3.5 w-3.5 ml-1" />
            </Button>
          </div>
        </div>
      </Card>

      {/* Modals */}
      <CreateOpportunityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOpportunities}
      />

      <EditOpportunityModal
        isOpen={!!selectedOppForEdit}
        onClose={() => setSelectedOppForEdit(null)}
        onSuccess={fetchOpportunities}
        opportunity={selectedOppForEdit}
      />

      <ChangeStageModal
        isOpen={!!selectedOppForStage}
        onClose={() => setSelectedOppForStage(null)}
        onSuccess={fetchOpportunities}
        opportunity={selectedOppForStage}
        stages={
          pipelines.find((p) => p.id === selectedOppForStage?.pipelineId)?.stages || []
        }
      />

      <MarkWonModal
        isOpen={!!selectedOppForWon}
        onClose={() => setSelectedOppForWon(null)}
        onSuccess={fetchOpportunities}
        opportunity={selectedOppForWon}
      />

      <MarkLostModal
        isOpen={!!selectedOppForLost}
        onClose={() => setSelectedOppForLost(null)}
        onSuccess={fetchOpportunities}
        opportunity={selectedOppForLost}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={!!selectedOppForDelete}
        onClose={() => setSelectedOppForDelete(null)}
        title="Delete Opportunity"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to delete opportunity{' '}
            <span className="font-semibold text-vynexa-text-primary">
              {selectedOppForDelete?.name}
            </span>
            ? This deal will be soft-deleted and removed from active pipeline views.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedOppForDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Confirm Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
