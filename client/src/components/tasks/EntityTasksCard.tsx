import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { tasksService } from '@/services/tasks.service';
import { Task, TaskPriority } from '@/types/tasks.types';
import { CreateTaskModal } from './CreateTaskModal';
import { EditTaskModal } from './EditTaskModal';
import {
  CheckSquare,
  Plus,
  CheckCircle2,
  Circle,
  Calendar,
  AlertCircle,
  Edit2
} from 'lucide-react';

interface EntityTasksCardProps {
  leadId?: string;
  accountId?: string;
  contactId?: string;
  opportunityId?: string;
  title?: string;
}

export const EntityTasksCard: React.FC<EntityTasksCardProps> = ({
  leadId,
  accountId,
  contactId,
  opportunityId,
  title = 'Tasks & Follow-ups'
}) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Task | null>(null);
  const { toast } = useToast();

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await tasksService.getTasks({
        leadId,
        accountId,
        contactId,
        opportunityId,
        limit: 50,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      });
      setTasks(res.tasks || []);
    } catch (err: any) {
      setError(err.message || 'Failed to load entity tasks');
    } finally {
      setLoading(false);
    }
  }, [leadId, accountId, contactId, opportunityId]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'COMPLETED') {
        await tasksService.changeStatus(task.id, 'TODO');
        toast({
          type: 'success',
          title: 'Task Reopened',
          message: `'${task.title}' returned to active queue.`
        });
      } else {
        await tasksService.completeTask(task.id);
        toast({
          type: 'success',
          title: 'Task Completed',
          message: `'${task.title}' marked as completed.`
        });
      }
      fetchTasks();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not update task status.'
      });
    }
  };

  const getPriorityBadge = (priority: TaskPriority) => {
    switch (priority) {
      case 'URGENT':
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-vynexa-danger/10 text-vynexa-danger border border-vynexa-danger/20">
            URGENT
          </span>
        );
      case 'HIGH':
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20">
            HIGH
          </span>
        );
      case 'MEDIUM':
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-blue-500/10 text-blue-400 border border-blue-500/20">
            MED
          </span>
        );
      default:
        return (
          <span className="text-[10px] font-mono font-semibold px-1.5 py-0.2 rounded bg-vynexa-surface border border-vynexa-border text-vynexa-text-muted">
            LOW
          </span>
        );
    }
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  return (
    <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-vynexa-border py-3.5 px-5">
        <div className="flex items-center gap-2">
          <CheckSquare className="h-4 w-4 text-vynexa-text-secondary" />
          <CardTitle className="text-sm font-semibold">{title}</CardTitle>
          <span className="text-[11px] font-mono text-vynexa-text-muted">
            ({tasks.filter((t) => t.status !== 'COMPLETED').length} open)
          </span>
        </div>

        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7 px-2.5"
          leftIcon={<Plus className="h-3 w-3" />}
          onClick={() => setIsCreateOpen(true)}
        >
          Add Task
        </Button>
      </CardHeader>

      <CardContent className="p-0">
        {loading ? (
          <div className="p-5 space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-10 w-full rounded" />
            ))}
          </div>
        ) : error ? (
          <div className="p-6 text-center text-xs text-vynexa-danger space-y-2">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTasks}>
              Retry
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-8 text-center space-y-2 text-xs text-vynexa-text-muted">
            <p>No tasks or follow-ups scheduled for this record.</p>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3 w-3" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Create First Task
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-vynexa-border">
            {tasks.map((task) => {
              const completed = task.status === 'COMPLETED';
              const overdue = isOverdue(task);

              return (
                <div
                  key={task.id}
                  className={`p-3.5 hover:bg-vynexa-surface-secondary/40 transition-colors flex items-center justify-between gap-3 text-xs ${
                    completed ? 'opacity-60' : ''
                  }`}
                >
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 text-vynexa-text-muted hover:text-vynexa-emerald transition-colors shrink-0"
                      title={completed ? 'Reopen' : 'Mark completed'}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-4 w-4 text-vynexa-emerald" />
                      ) : (
                        <Circle className="h-4 w-4 hover:text-white" />
                      )}
                    </button>

                    <div className="space-y-0.5 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-medium ${
                            completed ? 'line-through text-vynexa-text-muted' : 'text-vynexa-text-primary'
                          }`}
                        >
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                      </div>

                      <div className="flex items-center gap-2 text-[11px] text-vynexa-text-muted">
                        <span>Assigned to {task.assignedTo?.name || 'Unassigned'}</span>
                      </div>
                    </div>
                  </div>

                  {/* Due Date & Action */}
                  <div className="flex items-center gap-3 shrink-0">
                    {task.dueDate ? (
                      <div
                        className={`font-mono text-xs flex items-center gap-1 ${
                          overdue
                            ? 'text-vynexa-danger font-semibold'
                            : 'text-vynexa-text-secondary'
                        }`}
                      >
                        {overdue && <AlertCircle className="h-3 w-3" />}
                        <Calendar className="h-3 w-3 text-vynexa-text-muted" />
                        <span>{new Date(task.dueDate).toLocaleDateString()}</span>
                      </div>
                    ) : (
                      <span className="text-vynexa-text-muted text-xs">No due date</span>
                    )}

                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 w-7 p-0"
                      onClick={() => setSelectedForEdit(task)}
                      title="Edit Task"
                    >
                      <Edit2 className="h-3 w-3 text-vynexa-text-secondary" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>

      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTasks}
        initialLeadId={leadId}
        initialAccountId={accountId}
        initialContactId={contactId}
        initialOpportunityId={opportunityId}
      />

      <EditTaskModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={fetchTasks}
        task={selectedForEdit}
      />
    </Card>
  );
};
