import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { supportCasesService } from '@/services/support.service';
import { SupportCase, SupportCasePriority, SupportCaseStatus } from '@/types/support.types';
import { CreateSupportCaseModal } from '@/components/support/CreateSupportCaseModal';
import {
  LifeBuoy,
  Plus,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Building2,
  AlertCircle,
  CheckCircle2,
  ArrowUpRight
} from 'lucide-react';

export const SupportCasesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [cases, setCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportCasesService.getCases({
        page,
        limit: 15,
        search: search.trim() || undefined,
        status: (status as SupportCaseStatus) || undefined,
        priority: (priority as SupportCasePriority) || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setCases(res.cases);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error loading cases',
        message: 'Failed to retrieve support ticket data.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, status, priority, toast]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const getPriorityBadge = (p: SupportCasePriority) => {
    switch (p) {
      case 'URGENT':
        return <Badge variant="red">URGENT</Badge>;
      case 'HIGH':
        return <Badge variant="amber">HIGH</Badge>;
      case 'MEDIUM':
        return <Badge variant="blue">MEDIUM</Badge>;
      case 'LOW':
      default:
        return <Badge variant="slate">LOW</Badge>;
    }
  };

  const getStatusBadge = (s: SupportCaseStatus) => {
    switch (s) {
      case 'OPEN':
        return <Badge variant="blue">OPEN</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="amber">IN PROGRESS</Badge>;
      case 'RESOLVED':
        return <Badge variant="emerald">RESOLVED</Badge>;
      case 'CLOSED':
        return <Badge variant="slate">CLOSED</Badge>;
      default:
        return <Badge variant="slate">{s}</Badge>;
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Support Cases"
        description="Customer inquiries, incident management, and resolution tracking"
        actions={
          <Button onClick={() => setIsCreateOpen(true)} size="sm">
            <Plus className="h-4 w-4 mr-1.5" />
            New Case
          </Button>
        }
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="p-3.5 bg-vynexa-surface border-vynexa-border">
          <div className="text-[11px] font-medium text-vynexa-text-secondary uppercase tracking-wider">
            Total Cases
          </div>
          <div className="text-xl font-mono font-bold text-vynexa-text-primary mt-1">
            {totalCount}
          </div>
        </Card>

        <Card className="p-3.5 bg-vynexa-surface border-vynexa-border">
          <div className="text-[11px] font-medium text-vynexa-text-secondary uppercase tracking-wider">
            Active / Open
          </div>
          <div className="text-xl font-mono font-bold text-blue-400 mt-1">
            {cases.filter((c) => c.status === 'OPEN' || c.status === 'IN_PROGRESS').length}
          </div>
        </Card>

        <Card className="p-3.5 bg-vynexa-surface border-vynexa-border">
          <div className="text-[11px] font-medium text-vynexa-text-secondary uppercase tracking-wider">
            Resolved / Closed
          </div>
          <div className="text-xl font-mono font-bold text-emerald-400 mt-1">
            {cases.filter((c) => c.status === 'RESOLVED' || c.status === 'CLOSED').length}
          </div>
        </Card>

        <Card className="p-3.5 bg-vynexa-surface border-vynexa-border">
          <div className="text-[11px] font-medium text-vynexa-text-secondary uppercase tracking-wider">
            Urgent Priority
          </div>
          <div className="text-xl font-mono font-bold text-rose-400 mt-1">
            {cases.filter((c) => c.priority === 'URGENT').length}
          </div>
        </Card>
      </div>

      {/* Filters Bar */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-vynexa-text-muted" />
          <Input
            placeholder="Search by case #, subject, or description..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="pl-9 h-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs w-36"
          >
            <option value="">All Statuses</option>
            <option value="OPEN">Open</option>
            <option value="IN_PROGRESS">In Progress</option>
            <option value="RESOLVED">Resolved</option>
            <option value="CLOSED">Closed</option>
          </Select>

          <Select
            value={priority}
            onChange={(e) => {
              setPriority(e.target.value);
              setPage(1);
            }}
            className="h-9 text-xs w-36"
          >
            <option value="">All Priorities</option>
            <option value="URGENT">Urgent</option>
            <option value="HIGH">High</option>
            <option value="MEDIUM">Medium</option>
            <option value="LOW">Low</option>
          </Select>
        </div>
      </div>

      {/* Data Table */}
      <Card className="overflow-hidden border-vynexa-border bg-vynexa-surface">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-[11px] font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                <th className="py-2.5 px-4">Case #</th>
                <th className="py-2.5 px-4">Subject</th>
                <th className="py-2.5 px-4">Account</th>
                <th className="py-2.5 px-4">Priority</th>
                <th className="py-2.5 px-4">Status</th>
                <th className="py-2.5 px-4">Assignee</th>
                <th className="py-2.5 px-4">Created</th>
                <th className="py-2.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vynexa-border/60">
              {loading ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-vynexa-text-muted font-mono text-xs">
                    Loading support cases...
                  </td>
                </tr>
              ) : cases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-16 text-center">
                    <div className="space-y-2">
                      <LifeBuoy className="h-8 w-8 text-vynexa-text-muted mx-auto opacity-40" />
                      <p className="text-sm font-semibold text-vynexa-text-primary">No cases found</p>
                      <p className="text-xs text-vynexa-text-secondary">
                        {search || status || priority
                          ? 'Try adjusting your search criteria or filters.'
                          : 'Create your first support case to begin tracking customer tickets.'}
                      </p>
                      {!search && !status && !priority && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setIsCreateOpen(true)}
                          className="mt-2"
                        >
                          <Plus className="h-3.5 w-3.5 mr-1" />
                          Create Case
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ) : (
                cases.map((c) => (
                  <tr
                    key={c.id}
                    onClick={() => navigate(`/app/support-cases/${c.id}`)}
                    className="hover:bg-vynexa-surface-secondary/40 cursor-pointer transition-colors group"
                  >
                    <td className="py-3 px-4 font-mono font-medium text-vynexa-text-primary">
                      {c.caseNumber}
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-vynexa-text-primary max-w-xs truncate group-hover:text-blue-400 transition-colors">
                        {c.subject}
                      </div>
                      {c.description && (
                        <div className="text-[11px] text-vynexa-text-muted truncate max-w-xs">
                          {c.description}
                        </div>
                      )}
                    </td>

                    <td className="py-3 px-4">
                      {c.account ? (
                        <div className="flex items-center gap-1.5 text-vynexa-text-secondary">
                          <Building2 className="h-3.5 w-3.5 shrink-0 text-vynexa-text-muted" />
                          <span className="truncate max-w-[120px]">{c.account.name}</span>
                        </div>
                      ) : (
                        <span className="text-vynexa-text-muted font-mono">—</span>
                      )}
                    </td>

                    <td className="py-3 px-4">{getPriorityBadge(c.priority)}</td>

                    <td className="py-3 px-4">{getStatusBadge(c.status)}</td>

                    <td className="py-3 px-4">
                      {c.assignedTo ? (
                        <div className="flex items-center gap-1.5 text-vynexa-text-secondary">
                          <div className="h-5 w-5 rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center text-[10px] font-mono text-vynexa-text-primary font-semibold">
                            {c.assignedTo.name.charAt(0).toUpperCase()}
                          </div>
                          <span className="truncate max-w-[100px]">{c.assignedTo.name}</span>
                        </div>
                      ) : (
                        <span className="text-vynexa-text-muted italic text-[11px]">Unassigned</span>
                      )}
                    </td>

                    <td className="py-3 px-4 font-mono text-vynexa-text-muted text-[11px] whitespace-nowrap">
                      {new Date(c.createdAt).toLocaleDateString()}
                    </td>

                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/app/support-cases/${c.id}`);
                        }}
                      >
                        <ArrowUpRight className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between pt-2">
          <span className="text-xs text-vynexa-text-muted font-mono">
            Page {page} of {totalPages}
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft className="h-4 w-4 mr-1" />
              Previous
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              Next
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      )}

      {/* Create Modal */}
      <CreateSupportCaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => {
          setIsCreateOpen(false);
          fetchCases();
        }}
      />
    </div>
  );
};
