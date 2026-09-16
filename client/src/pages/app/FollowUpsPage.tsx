import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { tasksService } from '@/services/tasks.service';
import { Task, TaskPriority } from '@/types/tasks.types';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import {
  Clock,
  AlertCircle,
  Calendar,
  CheckCircle2,
  Circle,
  Plus,
  Building2,
  Contact,
  UserCheck,
  TrendingUp,
  RefreshCw,
  Edit2
} from 'lucide-react';

export const FollowUpsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [overdueTasks, setOverdueTasks] = useState<Task[]>([]);
  const [todayTasks, setTodayTasks] = useState<Task[]>([]);
  const [upcomingTasks, setUpcomingTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [createDefaultDate, setCreateDefaultDate] = useState<string | undefined>(undefined);
  const [selectedForEdit, setSelectedForEdit] = useState<Task | null>(null);

  // Reschedule state
  const [selectedForReschedule, setSelectedForReschedule] = useState<Task | null>(null);
  const [rescheduleDate, setRescheduleDate] = useState('');
  const [rescheduling, setRescheduling] = useState(false);

  const fetchFollowUps = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const [overdueRes, todayRes, upcomingRes] = await Promise.all([
        tasksService.getTasks({ overdue: true, limit: 50, sortBy: 'dueDate', sortOrder: 'asc' }),
        tasksService.getTasks({ dueToday: true, limit: 50, sortBy: 'dueDate', sortOrder: 'asc' }),
        tasksService.getTasks({ upcoming: true, limit: 50, sortBy: 'dueDate', sortOrder: 'asc' })
      ]);

      setOverdueTasks(overdueRes.tasks || []);
      // Filter todayTasks so completed don't clutter active follow-up agenda unless desired
      setTodayTasks((todayRes.tasks || []).filter((t) => t.status !== 'CANCELLED'));
      setUpcomingTasks(upcomingRes.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load follow-up schedule');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFollowUps();
  }, [fetchFollowUps]);

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'COMPLETED') {
        await tasksService.changeStatus(task.id, 'TODO');
        toast({
          type: 'success',
          title: 'Task Reopened',
          message: `'${task.title}' returned to active follow-ups.`
        });
      } else {
        await tasksService.completeTask(task.id);
        toast({
          type: 'success',
          title: 'Follow-up Completed',
          message: `'${task.title}' marked as completed.`
        });
      }
      fetchFollowUps();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not update task status.'
      });
    }
  };

  const handleRescheduleSubmit = async () => {
    if (!selectedForReschedule || !rescheduleDate) return;
    try {
      setRescheduling(true);
      await tasksService.updateTask(selectedForReschedule.id, {
        dueDate: new Date(rescheduleDate).toISOString()
      });
      toast({
        type: 'success',
        title: 'Follow-up Rescheduled',
        message: `'${selectedForReschedule.title}' rescheduled to ${new Date(rescheduleDate).toLocaleDateString()}.`
      });
      setSelectedForReschedule(null);
      setRescheduleDate('');
      fetchFollowUps();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Reschedule Failed',
        message: err.message || 'Could not update due date.'
      });
    } finally {
      setRescheduling(false);
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-vynexa-danger/10 text-vynexa-danger border border-vynexa-danger/20">
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            MED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-vynexa-surface-secondary text-vynexa-text-muted border border-vynexa-border">
            LOW
          </span>
        );
    }
  };

  const renderEntityBadge = (task: Task) => {
    if (task.account) {
      return (
        <button
          onClick={() => navigate(`/app/customers/${task.accountId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[160px]"
        >
          <Building2 className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{task.account.name}</span>
        </button>
      );
    }
    if (task.lead) {
      return (
        <button
          onClick={() => navigate(`/app/leads/${task.leadId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[160px]"
        >
          <UserCheck className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{task.lead.firstName} {task.lead.lastName}</span>
        </button>
      );
    }
    if (task.contact) {
      return (
        <button
          onClick={() => navigate(`/app/contacts/${task.contactId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[160px]"
        >
          <Contact className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{task.contact.firstName} {task.contact.lastName}</span>
        </button>
      );
    }
    if (task.opportunity) {
      return (
        <button
          onClick={() => navigate(`/app/opportunities/${task.opportunityId}`)}
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[160px]"
        >
          <TrendingUp className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{task.opportunity.name}</span>
        </button>
      );
    }
    return <span className="text-vynexa-text-muted">—</span>;
  };

  const renderTaskRow = (task: Task, section: 'OVERDUE' | 'TODAY' | 'UPCOMING') => {
    const isCompleted = task.status === 'COMPLETED';

    return (
      <div
        key={task.id}
        className={`p-3.5 hover:bg-vynexa-surface-secondary/50 transition-colors flex items-center justify-between gap-3 text-xs ${
          isCompleted ? 'opacity-60' : ''
        }`}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <button
            type="button"
            onClick={() => handleToggleComplete(task)}
            className="mt-0.5 text-vynexa-text-muted hover:text-vynexa-emerald transition-colors shrink-0"
            title={isCompleted ? 'Reopen' : 'Mark completed'}
          >
            {isCompleted ? (
              <CheckCircle2 className="h-4 w-4 text-vynexa-emerald" />
            ) : (
              <Circle className="h-4 w-4 hover:text-white" />
            )}
          </button>

          <div className="space-y-1 min-w-0 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className={`font-semibold ${
                  isCompleted ? 'line-through text-vynexa-text-muted' : 'text-vynexa-text-primary'
                }`}
              >
                {task.title}
              </span>
              {getPriorityBadge(task.priority)}
            </div>

            <div className="flex items-center gap-3 text-[11px] text-vynexa-text-muted">
              <span>{task.assignedTo?.name || 'Unassigned'}</span>
              <span>•</span>
              {renderEntityBadge(task)}
            </div>
          </div>
        </div>

        {/* Right Details & Reschedule */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right">
            <div
              className={`font-mono text-xs flex items-center gap-1 justify-end ${
                section === 'OVERDUE'
                  ? 'text-vynexa-danger font-semibold'
                  : section === 'TODAY'
                  ? 'text-amber-400 font-semibold'
                  : 'text-vynexa-text-secondary'
              }`}
            >
              <Calendar className="h-3 w-3 text-vynexa-text-muted" />
              <span>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No date'}</span>
            </div>
            {section === 'OVERDUE' && (
              <span className="text-[10px] text-vynexa-danger font-mono">Overdue</span>
            )}
            {section === 'TODAY' && (
              <span className="text-[10px] text-amber-400 font-mono">Due Today</span>
            )}
          </div>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Reschedule"
              onClick={() => {
                setSelectedForReschedule(task);
                setRescheduleDate(task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '');
              }}
            >
              <RefreshCw className="h-3 w-3 text-vynexa-text-secondary" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="h-7 w-7 p-0"
              title="Edit task"
              onClick={() => setSelectedForEdit(task)}
            >
              <Edit2 className="h-3 w-3 text-vynexa-text-secondary" />
            </Button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Follow-ups"
        description="Stay on top of customer check-ins and scheduled reminders."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'Follow-ups' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/tasks')}
            >
              All tasks
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => {
                setCreateDefaultDate(new Date().toISOString().slice(0, 10));
                setIsCreateOpen(true);
              }}
            >
              Schedule follow-up
            </Button>
          </div>
        }
      />

      {loading ? (
        <div className="space-y-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="bg-vynexa-surface border-vynexa-border p-6 space-y-3">
              <Skeleton className="h-5 w-1/4 rounded" />
              <Skeleton className="h-12 w-full rounded-lg" />
              <Skeleton className="h-12 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : error ? (
        <Card className="bg-vynexa-surface border-vynexa-border p-12 text-center text-xs text-vynexa-danger space-y-3">
          <p>{error}</p>
          <Button variant="outline" size="sm" onClick={fetchFollowUps}>
            Retry
          </Button>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* 1. OVERDUE SECTION */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-vynexa-border flex flex-row items-center justify-between bg-vynexa-danger/5">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-vynexa-danger" />
                <CardTitle className="text-sm font-semibold text-vynexa-danger">
                  Overdue
                </CardTitle>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-vynexa-danger/20 text-vynexa-danger">
                  {overdueTasks.length}
                </span>
              </div>
              <span className="text-[11px] text-vynexa-text-muted">
                Needs attention
              </span>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-vynexa-border">
              {overdueTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-vynexa-text-muted">
                  No overdue follow-ups. You are all caught up!
                </div>
              ) : (
                overdueTasks.map((t) => renderTaskRow(t, 'OVERDUE'))
              )}
            </CardContent>
          </Card>

          {/* 2. TODAY'S AGENDA SECTION */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-vynexa-border flex flex-row items-center justify-between bg-amber-500/5">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-amber-400" />
                <CardTitle className="text-sm font-semibold text-amber-400">
                  Due today
                </CardTitle>
                <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400">
                  {todayTasks.length}
                </span>
              </div>
              <span className="text-[11px] text-vynexa-text-muted">
                Scheduled for today
              </span>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-vynexa-border">
              {todayTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-vynexa-text-muted">
                  No follow-ups scheduled for today.
                </div>
              ) : (
                todayTasks.map((t) => renderTaskRow(t, 'TODAY'))
              )}
            </CardContent>
          </Card>

          {/* 3. UPCOMING TOUCHPOINTS SECTION */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="py-3 px-5 border-b border-vynexa-border flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-vynexa-blue" />
                <CardTitle className="text-sm font-semibold text-vynexa-text-primary">
                  Upcoming (next 14 days)
                </CardTitle>
                <span className="text-xs font-mono px-2 py-0.5 rounded-full bg-vynexa-surface-secondary text-vynexa-text-muted border border-vynexa-border">
                  {upcomingTasks.length}
                </span>
              </div>
              <span className="text-[11px] text-vynexa-text-muted">
                Scheduled for the coming two weeks
              </span>
            </CardHeader>
            <CardContent className="p-0 divide-y divide-vynexa-border">
              {upcomingTasks.length === 0 ? (
                <div className="p-6 text-center text-xs text-vynexa-text-muted">
                  No follow-ups scheduled for the next 14 days.
                </div>
              ) : (
                upcomingTasks.map((t) => renderTaskRow(t, 'UPCOMING'))
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* Schedule Follow-up Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchFollowUps}
        defaultDueDate={createDefaultDate}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={fetchFollowUps}
        task={selectedForEdit}
      />

      {/* Reschedule Modal */}
      <Dialog
        isOpen={Boolean(selectedForReschedule)}
        onClose={() => setSelectedForReschedule(null)}
        title="Reschedule follow-up"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-vynexa-text-secondary">
            Choose a new date for <span className="font-semibold text-white">"{selectedForReschedule?.title}"</span>:
          </p>

          <Input
            type="date"
            value={rescheduleDate}
            onChange={(e) => setRescheduleDate(e.target.value)}
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
          />

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForReschedule(null)}
              disabled={rescheduling}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleRescheduleSubmit}
              isLoading={rescheduling}
              disabled={!rescheduleDate}
            >
              Save date
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
