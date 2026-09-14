import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { activitiesService } from '@/services/activities.service';
import { Activity } from '@/types/activities.types';
import { CreateActivityModal } from './CreateActivityModal';
import { EditActivityModal } from './EditActivityModal';
import {
  PhoneCall,
  Video,
  Mail,
  FileText,
  MoreHorizontal,
  Plus,
  Clock,
  Trash2,
  Edit2,
  Calendar
} from 'lucide-react';

interface ActivityTimelineProps {
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  title?: string;
}

export const ActivityTimeline: React.FC<ActivityTimelineProps> = ({
  leadId,
  accountId,
  contactId,
  opportunityId,
  title = 'Interaction Stream & Timeline'
}) => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Activity | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Activity | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { toast } = useToast();

  const fetchTimeline = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await activitiesService.getTimeline({
        leadId,
        accountId,
        contactId,
        opportunityId,
        limit: 50
      });
      setActivities(res);
    } catch (err: any) {
      setError(err.message || 'Failed to load activity stream');
    } finally {
      setLoading(false);
    }
  }, [leadId, accountId, contactId, opportunityId]);

  useEffect(() => {
    fetchTimeline();
  }, [fetchTimeline]);

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await activitiesService.deleteActivity(selectedForDelete.id);
      toast({
        type: 'success',
        title: 'Activity Deleted',
        message: 'Interaction record removed from history.'
      });
      setSelectedForDelete(null);
      fetchTimeline();
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

  const getActivityIcon = (type: string) => {
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

  return (
    <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-vynexa-border py-3.5 px-5">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-vynexa-text-secondary" />
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span className="text-[11px] font-mono text-vynexa-text-muted">
            ({activities.length})
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 px-2.5"
          leftIcon={<Plus className="h-3 w-3" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Log Activity
        </Button>
      </CardHeader>

      <CardContent className="p-5">
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex gap-3">
                <Skeleton className="h-7 w-7 rounded-full shrink-0" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-1/3 rounded" />
                  <Skeleton className="h-8 w-full rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="py-8 text-center text-xs text-vynexa-danger space-y-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTimeline}>
              Retry
            </Button>
          </div>
        ) : activities.length === 0 ? (
          <div className="py-10 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center text-vynexa-text-muted">
              <Calendar className="h-5 w-5" />
            </div>
            <div className="text-xs text-vynexa-text-muted max-w-sm mx-auto">
              No logged activities or customer interactions recorded yet. Keep your team aligned by logging calls, meetings, notes, or emails.
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Log First Activity
            </Button>
          </div>
        ) : (
          <div className="relative pl-4 border-l border-vynexa-border space-y-6">
            {activities.map((act) => (
              <div key={act.id} className="relative group">
                {/* Timeline node icon */}
                <div className="absolute -left-[27px] top-0 h-6 w-6 rounded-full bg-vynexa-surface-elevated border border-vynexa-border flex items-center justify-center text-vynexa-text-muted group-hover:text-vynexa-text-primary transition-colors">
                  {getActivityIcon(act.type)}
                </div>

                {/* Content Box */}
                <div className="p-3.5 rounded-lg border border-vynexa-border bg-vynexa-surface-secondary space-y-2 text-xs hover:border-vynexa-border/90 transition-all">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-vynexa-text-primary text-[13px]">
                          {act.subject}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-vynexa-surface border border-vynexa-border text-vynexa-text-muted">
                          {act.type}
                        </span>
                        {act.duration && (
                          <span className="text-[10px] text-vynexa-text-muted font-mono">
                            {act.duration}m
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-vynexa-text-muted mt-0.5">
                        <span>by {act.createdBy?.name || 'Workspace User'}</span>
                        <span>•</span>
                        <span className="font-mono">
                          {new Date(act.activityDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        type="button"
                        onClick={() => setSelectedForEdit(act)}
                        className="p-1 rounded hover:bg-vynexa-surface text-vynexa-text-muted hover:text-vynexa-text-primary transition-colors"
                        title="Edit Activity"
                      >
                        <Edit2 className="h-3 w-3" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setSelectedForDelete(act)}
                        className="p-1 rounded hover:bg-vynexa-surface text-vynexa-text-muted hover:text-vynexa-danger transition-colors"
                        title="Delete Activity"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>

                  {act.description && (
                    <p className="text-vynexa-text-secondary text-xs leading-relaxed whitespace-pre-wrap pt-1 border-t border-vynexa-border/50">
                      {act.description}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>

      {/* Log Activity Modal */}
      <CreateActivityModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTimeline}
        initialLeadId={leadId}
        initialAccountId={accountId}
        initialContactId={contactId}
        initialOpportunityId={opportunityId}
      />

      {/* Edit Activity Modal */}
      <EditActivityModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={fetchTimeline}
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
            This will remove the interaction permanently from the chronological history.
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
    </Card>
  );
};
