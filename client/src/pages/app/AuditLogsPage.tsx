import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { auditLogsService } from '@/services/audit-logs.service';
import { usersService } from '@/services/users.service';
import { AuditLog } from '@/types/audit-logs.types';
import {
  ShieldCheck,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  User,
  Calendar,
  Eye,
  FileCode,
  RefreshCw,
  Activity,
  AlertTriangle,
  Layers
} from 'lucide-react';

const ENTITY_TYPES = [
  'User',
  'Role',
  'Organization',
  'Lead',
  'Account',
  'Contact',
  'Opportunity',
  'Pipeline',
  'Activity',
  'Task',
  'Product',
  'Quote',
  'Order',
  'Document',
  'SupportCase',
  'Campaign',
  'Report'
];

export const AuditLogsPage: React.FC = () => {
  const { toast } = useToast();

  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [entity, setEntity] = useState('');
  const [action, setAction] = useState('');
  const [userId, setUserId] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [users, setUsers] = useState<any[]>([]);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);

  useEffect(() => {
    usersService
      .getUsers({ limit: 100 })
      .then((res: any) => {
        setUsers(res.users || res.data || []);
      })
      .catch(() => {});
  }, []);

  const fetchLogs = useCallback(async () => {
    try {
      setLoading(true);
      const res = await auditLogsService.getAuditLogs({
        page,
        limit: 20,
        search: search.trim() || undefined,
        entity: entity || undefined,
        action: action || undefined,
        userId: userId || undefined,
        startDate: startDate || undefined,
        endDate: endDate || undefined,
        sortBy: 'createdAt',
        sortOrder: 'desc'
      });
      setLogs(res.logs);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to load audit logs',
        message: err.message || 'An error occurred while fetching audit records.'
      });
    } finally {
      setLoading(false);
    }
  }, [page, search, entity, action, userId, startDate, endDate, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const handleResetFilters = () => {
    setSearch('');
    setEntity('');
    setAction('');
    setUserId('');
    setStartDate('');
    setEndDate('');
    setPage(1);
  };

  const getActionBadge = (actionStr: string) => {
    const act = actionStr.toUpperCase();
    if (act.includes('DELETE') || act.includes('FAIL') || act.includes('REJECT') || act.includes('CANCEL')) {
      return <Badge variant="red">{actionStr}</Badge>;
    }
    if (act.includes('CREATE') || act.includes('WON') || act.includes('APPROV') || act.includes('CONVERT') || act.includes('LOGIN')) {
      return <Badge variant="emerald">{actionStr}</Badge>;
    }
    if (act.includes('UPDATE') || act.includes('STATUS') || act.includes('ASSIGN') || act.includes('PAUSE')) {
      return <Badge variant="amber">{actionStr}</Badge>;
    }
    return <Badge variant="slate">{actionStr}</Badge>;
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Audit Logs"
        description="Immutable, tamper-proof record of system events, security state changes, and commercial workflows."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Total Logged Events</span>
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-vynexa-text-primary">
            {totalCount.toLocaleString()}
          </div>
          <p className="mt-1 text-[11px] text-vynexa-text-muted">
            Tracked across all organization resources
          </p>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Current Filter Matches</span>
            <Layers className="h-4 w-4 text-blue-400" />
          </div>
          <div className="mt-2 font-mono text-2xl font-semibold text-blue-400">
            {logs.length}
          </div>
          <p className="mt-1 text-[11px] text-vynexa-text-muted">
            Displaying page {page} of {totalPages}
          </p>
        </div>

        <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
          <div className="flex items-center justify-between text-xs text-vynexa-text-secondary">
            <span>Audit Immutability</span>
            <Activity className="h-4 w-4 text-vynexa-text-muted" />
          </div>
          <div className="mt-2 font-mono text-base font-semibold text-emerald-400 flex items-center gap-1.5">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Append-Only Enforcement
          </div>
          <p className="mt-1 text-[11px] text-vynexa-text-muted">
            Read-only API • Client mutations prohibited
          </p>
        </div>
      </div>

      {/* Filter Toolbar */}
      <div className="flex flex-col gap-3 rounded-lg border border-vynexa-border bg-vynexa-surface p-3.5">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-vynexa-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search action, entity..."
              className="pl-8 h-8 text-xs"
            />
          </div>

          {/* Entity Filter */}
          <div>
            <Select
              value={entity}
              onChange={(e) => {
                setEntity(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs"
            >
              <option value="">All Entities</option>
              {ENTITY_TYPES.map((et) => (
                <option key={et} value={et}>
                  {et}
                </option>
              ))}
            </Select>
          </div>

          {/* User Filter */}
          <div>
            <Select
              value={userId}
              onChange={(e) => {
                setUserId(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs"
            >
              <option value="">All Team Members</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name || u.email}
                </option>
              ))}
            </Select>
          </div>

          {/* Start Date */}
          <div>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs"
              placeholder="Start Date"
            />
          </div>

          {/* End Date */}
          <div>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="h-8 text-xs"
              placeholder="End Date"
            />
          </div>
        </div>

        {(search || entity || action || userId || startDate || endDate) && (
          <div className="flex items-center justify-end pt-1">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={handleResetFilters}
              className="h-7 text-xs text-vynexa-text-muted hover:text-vynexa-text-primary px-2"
            >
              <RefreshCw className="h-3 w-3 mr-1" />
              Reset All Filters
            </Button>
          </div>
        )}
      </div>

      {/* Audit Logs Table */}
      <div className="rounded-lg border border-vynexa-border bg-vynexa-surface overflow-hidden shadow-subtle">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-secondary font-medium select-none">
                <th className="py-2.5 px-3.5">Timestamp</th>
                <th className="py-2.5 px-3.5">Actor</th>
                <th className="py-2.5 px-3.5">Action</th>
                <th className="py-2.5 px-3.5">Entity</th>
                <th className="py-2.5 px-3.5">Entity ID</th>
                <th className="py-2.5 px-3.5 text-right">Payload</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-vynexa-border/60">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vynexa-text-muted">
                    Loading audit records...
                  </td>
                </tr>
              ) : logs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-vynexa-text-muted">
                    No audit records matching criteria.
                  </td>
                </tr>
              ) : (
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-vynexa-surface-secondary/40 transition-colors"
                  >
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-vynexa-text-secondary whitespace-nowrap">
                      {new Date(log.createdAt).toLocaleString(undefined, {
                        year: 'numeric',
                        month: 'short',
                        day: '2-digit',
                        hour: '2-digit',
                        minute: '2-digit',
                        second: '2-digit'
                      })}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {log.user ? (
                        <div>
                          <div className="font-medium text-vynexa-text-primary">
                            {log.user.name}
                          </div>
                          <div className="text-[10px] text-vynexa-text-muted">
                            {log.user.email}
                          </div>
                        </div>
                      ) : (
                        <span className="text-vynexa-text-muted italic">System / Anonymous</span>
                      )}
                    </td>
                    <td className="py-2.5 px-3.5">
                      {getActionBadge(log.action)}
                    </td>
                    <td className="py-2.5 px-3.5 font-medium text-vynexa-text-primary">
                      {log.entity}
                    </td>
                    <td className="py-2.5 px-3.5 font-mono text-[11px] text-vynexa-text-muted truncate max-w-[140px]" title={log.entityId}>
                      {log.entityId}
                    </td>
                    <td className="py-2.5 px-3.5 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedLog(log)}
                        className="h-6 px-2 text-[11px] border-vynexa-border text-vynexa-text-secondary hover:text-vynexa-text-primary"
                      >
                        <Eye className="h-3 w-3 mr-1" />
                        Inspect
                      </Button>
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
              Page {page} of {totalPages} ({totalCount} total events)
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

      {/* Log Inspection Modal */}
      <Dialog
        isOpen={!!selectedLog}
        onClose={() => setSelectedLog(null)}
        title="Audit Event Details"
        description="Inspect event payload and before/after transition diff."
        maxWidth="lg"
      >
        {selectedLog && (
          <div className="space-y-4 pt-1 max-h-[70vh] overflow-y-auto">
            <div className="grid grid-cols-2 gap-3 p-3 rounded-md border border-vynexa-border bg-vynexa-surface-secondary/30 text-xs">
              <div>
                <span className="text-[10px] text-vynexa-text-muted uppercase tracking-wider font-mono">Action</span>
                <div className="mt-0.5 font-medium text-vynexa-text-primary">{selectedLog.action}</div>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-muted uppercase tracking-wider font-mono">Timestamp</span>
                <div className="mt-0.5 font-mono text-vynexa-text-primary">{new Date(selectedLog.createdAt).toISOString()}</div>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-muted uppercase tracking-wider font-mono">Entity Type</span>
                <div className="mt-0.5 text-vynexa-text-primary">{selectedLog.entity}</div>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-muted uppercase tracking-wider font-mono">Entity ID</span>
                <div className="mt-0.5 font-mono text-vynexa-text-primary text-[11px] truncate">{selectedLog.entityId}</div>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-muted uppercase tracking-wider font-mono">Actor</span>
                <div className="mt-0.5 text-vynexa-text-primary">
                  {selectedLog.user ? `${selectedLog.user.name} (${selectedLog.user.email})` : 'System'}
                </div>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-muted uppercase tracking-wider font-mono">Log ID</span>
                <div className="mt-0.5 font-mono text-[11px] text-vynexa-text-muted truncate">{selectedLog.id}</div>
              </div>
            </div>

            {/* Before / After Payload */}
            <div className="space-y-3">
              {selectedLog.oldValue && (
                <div>
                  <h5 className="text-[11px] font-semibold text-vynexa-text-secondary mb-1">
                    Previous State (oldValue)
                  </h5>
                  <pre className="p-3 rounded bg-vynexa-surface-secondary text-[11px] font-mono text-rose-300 border border-vynexa-border overflow-x-auto">
                    {JSON.stringify(selectedLog.oldValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.newValue && (
                <div>
                  <h5 className="text-[11px] font-semibold text-vynexa-text-secondary mb-1">
                    Modified State (newValue)
                  </h5>
                  <pre className="p-3 rounded bg-vynexa-surface-secondary text-[11px] font-mono text-emerald-300 border border-vynexa-border overflow-x-auto">
                    {JSON.stringify(selectedLog.newValue, null, 2)}
                  </pre>
                </div>
              )}

              {selectedLog.metadata && (
                <div>
                  <h5 className="text-[11px] font-semibold text-vynexa-text-secondary mb-1">
                    Context Metadata
                  </h5>
                  <pre className="p-3 rounded bg-vynexa-surface-secondary text-[11px] font-mono text-vynexa-text-secondary border border-vynexa-border overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end pt-3 border-t border-vynexa-border">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedLog(null)}
                className="text-xs"
              >
                Close
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
};
