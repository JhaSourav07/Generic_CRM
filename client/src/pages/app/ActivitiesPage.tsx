import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { activitiesService } from '@/services/activities.service';
import { Activity, ActivityType } from '@/types/activities.types';
import { CreateActivityModal } from '@/components/activities/CreateActivityModal';
import { EditActivityModal } from '@/components/activities/EditActivityModal';
import {
  PhoneCall,
  Video,
  Mail,
  FileText,
  MoreHorizontal,
  Plus,
  Search,
  Calendar,
  Building2,
  Contact,
  UserCheck,
  TrendingUp,
  Trash2,
  Edit2,
  ChevronLeft,
  ChevronRight,
  Filter
} from 'lucide-react';

export const ActivitiesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Activity | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchActivities = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const res = await activitiesService.getActivities({
        page,
        limit,
        search: search.trim() || undefined,
        type: (typeFilter as ActivityType) || undefined,
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        endDate: endDate ? new Date(endDate).toISOString() : undefined,
        sortBy: 'activityDate',
        sortOrder: 'desc'
      });

      setActivities(res.activities);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load interactions log');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, startDate, endDate]);

  useEffect(() => {
    fetchActivities();
  }, [fetchActivities]);

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await activitiesService.deleteActivity(selectedForDelete.id);
      toast({
        type: 'success',
        title: 'Activity Deleted',
        message: 'Interaction removed from chronological history.'
      });
      setSelectedForDelete(null);
      fetchActivities();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete activity.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getActivityIcon = (type: ActivityType) => {
    switch (type) {
      case 'CALL':
        return <PhoneCall className="h-3.5 w-3.5" />;
      case 'MEETING':
        return <Video className="h-3.5 w-3.5" />;
      case 'EMAIL':
        return <Mail className="h-3.5 w-3.5" />;
      case 'NOTE':
        return <FileText className="h-3.5 w-3.5" />;
      default:
        return <MoreHorizontal className="h-3.5 w-3.5" />;
    }
  };

  // Helper to render linked entity badge
  const renderEntityLink = (act: Activity) => {
    if (act.account) {
      return (
        <button
          onClick={() => navigate(`/app/customers/${act.accountId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[200px]"
        >
          <Building2 className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{act.account.name}</span>
        </button>
      );
    }
    if (act.lead) {
      return (
        <button
          onClick={() => navigate(`/app/leads/${act.leadId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[200px]"
        >
          <UserCheck className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{act.lead.firstName} {act.lead.lastName}</span>
        </button>
      );
    }
    if (act.contact) {
      return (
        <button
          onClick={() => navigate(`/app/contacts/${act.contactId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[200px]"
        >
          <Contact className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{act.contact.firstName} {act.contact.lastName}</span>
        </button>
      );
    }
    if (act.opportunity) {
      return (
        <button
          onClick={() => navigate(`/app/opportunities/${act.opportunityId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[200px]"
        >
          <TrendingUp className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{act.opportunity.name}</span>
        </button>
      );
    }
    return <span className="text-vynexa-text-muted">—</span>;
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Activities & Interactions"
        description="Chronological log of customer calls, meetings, notes, and communications."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'Activities' }
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Log Activity
          </Button>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted">Total Recorded</div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {totalCount}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <PhoneCall className="h-3 w-3" /> Calls Logged
          </div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {activities.filter((a) => a.type === 'CALL').length}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <Video className="h-3 w-3" /> Meetings Held
          </div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {activities.filter((a) => a.type === 'MEETING').length}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <FileText className="h-3 w-3" /> Notes & Memos
          </div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {activities.filter((a) => a.type === 'NOTE').length}
          </div>
        </Card>
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-vynexa-surface border-vynexa-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-vynexa-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search subject, description, entity..."
              className="pl-8 bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            />
          </div>

          {/* Type Filter */}
          <div>
            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            >
              <option value="">All Activity Types</option>
              <option value="CALL">Calls</option>
              <option value="MEETING">Meetings</option>
              <option value="EMAIL">Emails</option>
              <option value="NOTE">Notes</option>
              <option value="OTHER">Other</option>
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
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
            />
          </div>

          {/* End Date / Reset */}
          <div className="flex items-center gap-2">
            <Input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setPage(1);
              }}
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs flex-1"
            />
            {(search || typeFilter || startDate || endDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-9 px-2 text-vynexa-text-muted hover:text-white"
                onClick={() => {
                  setSearch('');
                  setTypeFilter('');
                  setStartDate('');
                  setEndDate('');
                  setPage(1);
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Table / Stream View */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-vynexa-border/40">
                <Skeleton className="h-5 w-1/4 rounded" />
                <Skeleton className="h-5 w-1/5 rounded" />
                <Skeleton className="h-5 w-1/6 rounded" />
                <Skeleton className="h-5 w-1/6 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-vynexa-danger space-y-3">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchActivities}>
              Retry
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center text-vynexa-text-muted">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold text-vynexa-text-primary">No activities found</div>
            <div className="text-xs text-vynexa-text-muted max-w-sm mx-auto">
              No historical interactions match your current search and filter criteria.
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Log New Activity
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-vynexa-border">
            {activities.map((act) => (
              <div
                key={act.id}
                className="p-4 hover:bg-vynexa-surface-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
              >
                {/* Left: Icon & Subject & Description */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                  <div className="h-8 w-8 rounded-lg bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center text-vynexa-text-muted shrink-0 mt-0.5">
                    {getActivityIcon(act.type)}
                  </div>

                  <div className="space-y-1 min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-vynexa-text-primary text-sm">
                        {act.subject}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-vynexa-surface-secondary border border-vynexa-border text-vynexa-text-muted">
                        {act.type}
                      </span>
                      {act.duration && (
                        <span className="text-[10px] font-mono text-vynexa-text-muted">
                          {act.duration}m
                        </span>
                      )}
                    </div>

                    {act.description && (
                      <p className="text-vynexa-text-muted text-xs line-clamp-2">
                        {act.description}
                      </p>
                    )}

                    <div className="flex items-center gap-3 text-[11px] text-vynexa-text-muted pt-0.5">
                      <span>Logged by {act.createdBy?.name || 'User'}</span>
                      <span>•</span>
                      {renderEntityLink(act)}
                    </div>
                  </div>
                </div>

                {/* Right: Date & Actions */}
                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-11 sm:pl-0">
                  <div className="text-right">
                    <div className="font-mono text-xs text-vynexa-text-primary">
                      {new Date(act.activityDate).toLocaleDateString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric'
                      })}
                    </div>
                    <div className="font-mono text-[10px] text-vynexa-text-muted">
                      {new Date(act.activityDate).toLocaleTimeString(undefined, {
                        hour: '2-digit',
                        minute: '2-digit'
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setSelectedForEdit(act)}
                    >
                      <Edit2 className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-vynexa-danger"
                      onClick={() => setSelectedForDelete(act)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination Bar */}
        {!loading && totalPages > 1 && (
          <div className="p-4 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-text-muted">
            <div>
              Showing page <span className="font-mono text-vynexa-text-primary">{page}</span> of{' '}
              <span className="font-mono text-vynexa-text-primary">{totalPages}</span> ({totalCount} total)
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Log Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchActivities}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={fetchActivities}
        activity={selectedForEdit}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        title="Delete Activity Record"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-vynexa-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-white">"{selectedForDelete?.subject}"</span>?
            This will permanently remove the logged interaction.
          </p>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForDelete(null)}
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
              Delete
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
