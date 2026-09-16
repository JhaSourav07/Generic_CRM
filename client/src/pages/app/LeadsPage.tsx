import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { leadsService } from '@/services/leads.service';
import { Lead, LeadStatus, LeadScoreCategory, GetLeadsQuery } from '@/types/leads.types';

import { CreateLeadModal } from '@/components/leads/CreateLeadModal';
import { EditLeadModal } from '@/components/leads/EditLeadModal';
import { AssignLeadModal } from '@/components/leads/AssignLeadModal';
import { ConvertLeadDialog } from '@/components/leads/ConvertLeadDialog';

import {
  Plus,
  Search,
  UserCheck,
  MoreVertical,
  MoreHorizontal,
  Edit2,
  UserPlus,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye
} from 'lucide-react';

export const LeadsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [leads, setLeads] = useState<Lead[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [scoreCategoryFilter, setScoreCategoryFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'score' | 'company' | 'firstName'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedLeadForEdit, setSelectedLeadForEdit] = useState<Lead | null>(null);
  const [selectedLeadForAssign, setSelectedLeadForAssign] = useState<Lead | null>(null);
  const [selectedLeadForConvert, setSelectedLeadForConvert] = useState<Lead | null>(null);
  const [selectedLeadForDelete, setSelectedLeadForDelete] = useState<Lead | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchLeads = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query: GetLeadsQuery = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        status: statusFilter ? (statusFilter as LeadStatus) : undefined,
        scoreCategory: scoreCategoryFilter ? (scoreCategoryFilter as LeadScoreCategory) : undefined,
        sortBy,
        sortOrder
      };

      const res = await leadsService.getLeads(query);
      setLeads(res.leads);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || 'Could not load leads. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, statusFilter, scoreCategoryFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchLeads();
  }, [fetchLeads]);

  const handleDelete = async () => {
    if (!selectedLeadForDelete) return;
    try {
      setDeleting(true);
      await leadsService.deleteLead(selectedLeadForDelete.id);
      toast({
        type: 'success',
        title: 'Lead deleted',
        message: `${selectedLeadForDelete.firstName} ${selectedLeadForDelete.lastName} has been removed.`
      });
      setSelectedLeadForDelete(null);
      fetchLeads();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not delete lead',
        message: err.message || 'An error occurred while deleting.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="slate">New</Badge>;
      case 'QUALIFIED':
        return <Badge variant="emerald">Qualified</Badge>;
      case 'CONTACTED':
        return <Badge variant="blue">Contacted</Badge>;
      case 'ASSIGNED':
        return <Badge variant="slate">Assigned</Badge>;
      case 'CONVERTED':
        return <Badge variant="emerald">Converted</Badge>;
      case 'LOST':
        return <Badge variant="red">Lost</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getScoreCategoryBadge = (category?: string | null, score?: number) => {
    const cat = category || (score !== undefined ? (score >= 80 ? 'HOT' : score >= 60 ? 'WARM' : score >= 30 ? 'COOL' : 'COLD') : 'COLD');
    switch (cat) {
      case 'HOT':
        return <Badge variant="emerald" className="text-[10px] px-1.5 py-0 font-medium">Hot</Badge>;
      case 'WARM':
        return <Badge variant="blue" className="text-[10px] px-1.5 py-0 font-medium">Warm</Badge>;
      case 'COOL':
        return <Badge variant="slate" className="text-[10px] px-1.5 py-0 font-medium text-slate-300">Cool</Badge>;
      case 'COLD':
      default:
        return <Badge variant="slate" className="text-[10px] px-1.5 py-0 font-medium text-vynexa-text-muted">Cold</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title="Leads"
        description="Track and follow up with potential customers."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'CRM' },
          { label: 'Leads' }
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            onClick={() => setIsCreateOpen(true)}
            leftIcon={<Plus className="h-3.5 w-3.5" />}
          >
            Add lead
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card className="bg-vynexa-surface border-vynexa-border p-4">
        <div className="flex flex-col md:flex-row gap-4 items-stretch md:items-center justify-between">
          {/* Search */}
          <div className="w-full md:w-72 relative">
            <Input
              placeholder="Search by name, company, or email..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4 text-vynexa-text-muted" />}
            />
          </div>

          {/* Filters & Sorting */}
          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
            <div className="w-40 shrink-0">
              <Select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All statuses' },
                  { value: 'NEW', label: 'New' },
                  { value: 'QUALIFIED', label: 'Qualified' },
                  { value: 'CONTACTED', label: 'Contacted' },
                  { value: 'ASSIGNED', label: 'Assigned' },
                  { value: 'CONVERTED', label: 'Converted' },
                  { value: 'LOST', label: 'Lost' }
                ]}
              />
            </div>

            <div className="w-36 shrink-0">
              <Select
                value={scoreCategoryFilter}
                onChange={(e) => {
                  setScoreCategoryFilter(e.target.value);
                  setPage(1);
                }}
                options={[
                  { value: '', label: 'All scores' },
                  { value: 'HOT', label: 'Hot (80–100)' },
                  { value: 'WARM', label: 'Warm (60–79)' },
                  { value: 'COOL', label: 'Cool (30–59)' },
                  { value: 'COLD', label: 'Cold (0–29)' }
                ]}
              />
            </div>

            <div className="w-40 shrink-0">
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                options={[
                  { value: 'createdAt', label: 'Date created' },
                  { value: 'score', label: 'Lead score' },
                  { value: 'company', label: 'Company' },
                  { value: 'firstName', label: 'Name' }
                ]}
              />
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="shrink-0"
            >
              {sortOrder === 'asc' ? '↑ Asc' : '↓ Desc'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Main Data Table */}
      <Card className="bg-vynexa-surface border-vynexa-border">
        <CardContent className="p-0">
          {loading ? (
            <div className="p-6 space-y-3">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
              <Skeleton className="h-12 w-full" />
            </div>
          ) : error ? (
            <div className="p-12 text-center space-y-3">
              <p className="text-sm text-rose-400 font-medium">{error}</p>
              <Button variant="outline" size="sm" onClick={fetchLeads}>
                Try again
              </Button>
            </div>
          ) : leads.length === 0 ? (
            <div className="p-12 text-center space-y-3">
              <div className="h-12 w-12 rounded-full bg-vynexa-surface-elevated mx-auto flex items-center justify-center text-vynexa-text-muted">
                <Filter className="h-6 w-6" />
              </div>
              <h3 className="text-sm font-semibold text-vynexa-text-primary">No leads found</h3>
              <p className="text-xs text-vynexa-text-muted max-w-sm mx-auto">
                No leads match your search. Add a lead or clear your filters to see more results.
              </p>
              <Button variant="primary" size="sm" onClick={() => setIsCreateOpen(true)} leftIcon={<Plus className="h-3.5 w-3.5" />}>
                Add lead
              </Button>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Lead name</TableHead>
                  <TableHead>Company &amp; title</TableHead>
                  <TableHead>Source</TableHead>
                  <TableHead
                    className="cursor-pointer hover:text-white transition-colors select-none"
                    onClick={() => {
                      if (sortBy === 'score') {
                        setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
                      } else {
                        setSortBy('score');
                        setSortOrder('desc');
                      }
                    }}
                    title="Click to sort by score"
                  >
                    <div className="flex items-center gap-1">
                      Lead score
                      {sortBy === 'score' && (
                        <span className="text-xs">{sortOrder === 'asc' ? '↑' : '↓'}</span>
                      )}
                    </div>
                  </TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Assigned to</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {leads.map((lead) => (
                  <TableRow key={lead.id}>
                    {/* Name & Email */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span
                          onClick={() => navigate(`/app/leads/${lead.id}`)}
                          className="font-medium text-vynexa-text-primary hover:text-white cursor-pointer transition-colors"
                        >
                          {lead.firstName} {lead.lastName}
                        </span>
                        <span className="text-xs text-vynexa-text-muted">{lead.email || 'No email'}</span>
                      </div>
                    </TableCell>

                    {/* Company */}
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-mono text-xs text-vynexa-text-secondary">{lead.company || '—'}</span>
                        <span className="text-xs text-vynexa-text-muted">{lead.jobTitle || '—'}</span>
                      </div>
                    </TableCell>

                    {/* Source */}
                    <TableCell className="text-xs text-vynexa-text-muted">
                      {lead.source || 'Direct'}
                    </TableCell>

                    {/* Score */}
                    <TableCell>
                      <div className="flex items-center gap-1.5">
                        <span className="font-mono text-xs font-semibold text-vynexa-text-primary">
                          {lead.score}
                        </span>
                        {getScoreCategoryBadge(lead.scoreCategory, lead.score)}
                      </div>
                    </TableCell>

                    {/* Status */}
                    <TableCell>{getStatusBadge(lead.status)}</TableCell>

                    {/* Owner */}
                    <TableCell className="text-xs text-vynexa-text-secondary">
                      {lead.owner ? lead.owner.name : <span className="text-vynexa-text-muted italic">Unassigned</span>}
                    </TableCell>

                    {/* Actions */}
                    <TableCell className="text-right">
                      <Dropdown
                        trigger={
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary"
                            title="Actions"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        }
                      >
                        <DropdownItem icon={<Eye className="h-3.5 w-3.5" />} onClick={() => navigate(`/app/leads/${lead.id}`)}>
                          View details
                        </DropdownItem>
                        <DropdownItem icon={<Edit2 className="h-3.5 w-3.5" />} onClick={() => setSelectedLeadForEdit(lead)}>
                          Edit lead
                        </DropdownItem>
                        <DropdownItem icon={<UserPlus className="h-3.5 w-3.5" />} onClick={() => setSelectedLeadForAssign(lead)}>
                          Assign team member
                        </DropdownItem>
                        <DropdownItem
                          icon={<UserCheck className="h-3.5 w-3.5 text-emerald-400" />}
                          disabled={lead.status === 'CONVERTED'}
                          onClick={() => setSelectedLeadForConvert(lead)}
                        >
                          Turn into customer
                        </DropdownItem>
                        <DropdownSeparator />
                        <DropdownItem
                          icon={<Trash2 className="h-3.5 w-3.5 text-rose-400" />}
                          danger
                          onClick={() => setSelectedLeadForDelete(lead)}
                        >
                          Delete lead
                        </DropdownItem>
                      </Dropdown>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination Controls */}
          {!loading && leads.length > 0 && (
            <div className="p-4 border-t border-vynexa-border flex items-center justify-between">
              <span className="text-xs text-vynexa-text-muted">
                Showing {leads.length} of {meta.total} leads (Page {meta.page} of {meta.totalPages})
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage(p => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage(p => p + 1)}
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Modal */}
      <CreateLeadModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchLeads}
      />

      {/* Edit Modal */}
      <EditLeadModal
        isOpen={!!selectedLeadForEdit}
        lead={selectedLeadForEdit}
        onClose={() => setSelectedLeadForEdit(null)}
        onSuccess={fetchLeads}
      />

      {/* Assign Modal */}
      <AssignLeadModal
        isOpen={!!selectedLeadForAssign}
        lead={selectedLeadForAssign}
        onClose={() => setSelectedLeadForAssign(null)}
        onSuccess={fetchLeads}
      />

      {/* Convert Dialog */}
      <ConvertLeadDialog
        isOpen={!!selectedLeadForConvert}
        lead={selectedLeadForConvert}
        onClose={() => setSelectedLeadForConvert(null)}
        onSuccess={fetchLeads}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={!!selectedLeadForDelete}
        onClose={() => setSelectedLeadForDelete(null)}
        title="Delete lead"
        description="Are you sure you want to delete this lead? This cannot be undone."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setSelectedLeadForDelete(null)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
            Delete lead
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
