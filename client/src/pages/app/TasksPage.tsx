import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { tasksService } from '@/services/tasks.service';
import { usersService } from '@/services/users.service';
import { Task, TaskPriority, TaskStatus, TaskSummary } from '@/types/tasks.types';
import { UserItem } from '@/types/users.types';
import { CreateTaskModal } from '@/components/tasks/CreateTaskModal';
import { EditTaskModal } from '@/components/tasks/EditTaskModal';
import { AssignTaskModal } from '@/components/tasks/AssignTaskModal';
import {
  CheckSquare,
  Plus,
  Search,
  Calendar,
  AlertCircle,
  Clock,
  CheckCircle2,
  Circle,
  Building2,
  Contact,
  UserCheck,
  TrendingUp,
  Trash2,
  Edit2,
  UserPlus,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';

export const TasksPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tasks, setTasks] = useState<Task[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering state
  const [page, setPage] = useState(1);
  const [limit] = useState(15);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [priorityFilter, setPriorityFilter] = useState<string>('');
  const [assigneeFilter, setAssigneeFilter] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'ALL' | 'TODO' | 'IN_PROGRESS' | 'COMPLETED'>('ALL');

  const [summary, setSummary] = useState<TaskSummary>({
    openCount: 0,
    overdueCount: 0,
    dueTodayCount: 0,
    completedCount: 0
  });

  // Modals state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Task | null>(null);
  const [selectedForAssign, setSelectedForAssign] = useState<Task | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Task | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  // Load active users for filter dropdown
  useEffect(() => {
    const loadUsers = async () => {
      try {
        const res = await usersService.getUsers({ limit: 100, isActive: true });
        setUsers(res.users || []);
      } catch (err) {
        console.error('Failed to load users for filter', err);
      }
    };
    loadUsers();
  }, []);

  const fetchTasks = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      let effectiveStatus = statusFilter;
      if (activeTab === 'TODO') effectiveStatus = 'TODO';
      else if (activeTab === 'IN_PROGRESS') effectiveStatus = 'IN_PROGRESS';
      else if (activeTab === 'COMPLETED') effectiveStatus = 'COMPLETED';

      const res = await tasksService.getTasks({
        page,
        limit,
        search: search.trim() || undefined,
        status: (effectiveStatus as TaskStatus) || undefined,
        priority: (priorityFilter as TaskPriority) || undefined,
        assignedToId: assigneeFilter || undefined,
        sortBy: 'dueDate',
        sortOrder: 'asc'
      });

      setTasks(res.tasks);
      setTotalPages(res.meta.totalPages || 1);
      setTotalCount(res.meta.total);
      setSummary(res.summary);
    } catch (err: any) {
      setError(err.message || 'Failed to load task queue');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, priorityFilter, assigneeFilter, activeTab]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  // One-click task completion toggle
  const handleToggleComplete = async (task: Task) => {
    try {
      if (task.status === 'COMPLETED') {
        // Reopen task
        await tasksService.changeStatus(task.id, 'TODO');
        toast({
          type: 'success',
          title: 'Task Reopened',
          message: `'${task.title}' returned to active queue.`
        });
      } else {
        // Complete task
        await tasksService.completeTask(task.id);
        toast({
          type: 'success',
          title: 'Task Completed',
          message: `'${task.title}' marked as complete.`
        });
      }
      fetchTasks();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'Could not update task status.'
      });
    }
  };

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      await tasksService.deleteTask(selectedForDelete.id);
      toast({
        type: 'success',
        title: 'Task Deleted',
        message: 'Task removed from workspace queue.'
      });
      setSelectedForDelete(null);
      fetchTasks();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete task.'
      });
    } finally {
      setDeleting(false);
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
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[180px]"
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
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[180px]"
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
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[180px]"
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
          className="flex items-center gap-1.5 text-vynexa-text-secondary hover:text-white transition-colors truncate max-w-[180px]"
        >
          <TrendingUp className="h-3 w-3 text-vynexa-text-muted shrink-0" />
          <span className="truncate">{task.opportunity.name}</span>
        </button>
      );
    }
    return <span className="text-vynexa-text-muted">—</span>;
  };

  const isOverdue = (task: Task) => {
    if (!task.dueDate || task.status === 'COMPLETED' || task.status === 'CANCELLED') return false;
    return new Date(task.dueDate).getTime() < Date.now();
  };

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title="Tasks & Action Items"
        description="Operational work-queue for customer follow-ups, scheduled obligations, and assignments."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'Tasks' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/follow-ups')}
            >
              Follow-ups View
            </Button>
            <Button
              variant="primary"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateOpen(true)}
            >
              New Task
            </Button>
          </div>
        }
      />

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <CheckSquare className="h-3 w-3 text-vynexa-blue" /> Active Tasks
          </div>
          <div className="text-xl font-bold font-mono text-vynexa-text-primary mt-1">
            {summary.openCount}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <AlertCircle className="h-3 w-3 text-vynexa-danger" /> Overdue
          </div>
          <div className="text-xl font-bold font-mono text-vynexa-danger mt-1">
            {summary.overdueCount}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <Clock className="h-3 w-3 text-amber-400" /> Due Today
          </div>
          <div className="text-xl font-bold font-mono text-amber-400 mt-1">
            {summary.dueTodayCount}
          </div>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
          <div className="text-[11px] text-vynexa-text-muted flex items-center gap-1.5">
            <CheckCircle2 className="h-3 w-3 text-vynexa-emerald" /> Completed
          </div>
          <div className="text-xl font-bold font-mono text-vynexa-emerald mt-1">
            {summary.completedCount}
          </div>
        </Card>
      </div>

      {/* Status Tabs */}
      <div className="flex items-center gap-2 border-b border-vynexa-border pb-3">
        {[
          { id: 'ALL', label: 'All Tasks' },
          { id: 'TODO', label: 'To Do' },
          { id: 'IN_PROGRESS', label: 'In Progress' },
          { id: 'COMPLETED', label: 'Completed' }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => {
              setActiveTab(tab.id as any);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-vynexa-surface-elevated text-white border border-vynexa-border shadow-xs'
                : 'text-vynexa-text-muted hover:text-vynexa-text-secondary hover:bg-vynexa-surface'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter and Search Bar */}
      <Card className="bg-vynexa-surface border-vynexa-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-vynexa-text-muted" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search task title, description, contact..."
              className="pl-8 bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            />
          </div>

          {/* Priority Filter */}
          <div>
            <Select
              value={priorityFilter}
              onChange={(e) => {
                setPriorityFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs"
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          {/* Assignee Filter */}
          <div className="flex items-center gap-2">
            <Select
              value={assigneeFilter}
              onChange={(e) => {
                setAssigneeFilter(e.target.value);
                setPage(1);
              }}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary text-xs flex-1"
            >
              <option value="">All Assignees</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>

            {(search || priorityFilter || assigneeFilter || activeTab !== 'ALL') && (
              <Button
                variant="ghost"
                size="sm"
                className="text-xs h-9 px-2 text-vynexa-text-muted hover:text-white"
                onClick={() => {
                  setSearch('');
                  setPriorityFilter('');
                  setAssigneeFilter('');
                  setActiveTab('ALL');
                  setPage(1);
                }}
              >
                Reset
              </Button>
            )}
          </div>
        </div>
      </Card>

      {/* Main Tasks List */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="flex items-center justify-between gap-4 py-2 border-b border-vynexa-border/40">
                <Skeleton className="h-5 w-1/3 rounded" />
                <Skeleton className="h-5 w-1/5 rounded" />
                <Skeleton className="h-5 w-1/6 rounded" />
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="p-12 text-center text-xs text-vynexa-danger space-y-3">
            <p>{error}</p>
            <Button variant="outline" size="sm" onClick={fetchTasks}>
              Retry
            </Button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="py-16 text-center space-y-3">
            <div className="h-10 w-10 mx-auto rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center text-vynexa-text-muted">
              <CheckSquare className="h-5 w-5" />
            </div>
            <div className="text-sm font-semibold text-vynexa-text-primary">No tasks found</div>
            <div className="text-xs text-vynexa-text-muted max-w-sm mx-auto">
              No tasks currently match your filter criteria. Create tasks to keep work moving forward.
            </div>
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Plus className="h-3.5 w-3.5" />}
              onClick={() => setIsCreateOpen(true)}
            >
              Create New Task
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
                  className={`p-4 hover:bg-vynexa-surface-secondary/40 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                    completed ? 'opacity-60' : ''
                  }`}
                >
                  {/* Left: 1-Click Checkbox & Title & Context */}
                  <div className="flex items-start gap-3 flex-1 min-w-0">
                    <button
                      type="button"
                      onClick={() => handleToggleComplete(task)}
                      className="mt-0.5 text-vynexa-text-muted hover:text-vynexa-emerald transition-colors shrink-0"
                      title={completed ? 'Reopen task' : 'Mark completed'}
                    >
                      {completed ? (
                        <CheckCircle2 className="h-5 w-5 text-vynexa-emerald" />
                      ) : (
                        <Circle className="h-5 w-5 hover:text-white" />
                      )}
                    </button>

                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`font-semibold text-sm ${
                            completed ? 'line-through text-vynexa-text-muted' : 'text-vynexa-text-primary'
                          }`}
                        >
                          {task.title}
                        </span>
                        {getPriorityBadge(task.priority)}
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-vynexa-surface-secondary border border-vynexa-border text-vynexa-text-muted">
                          {task.status.replace('_', ' ')}
                        </span>
                      </div>

                      {task.description && (
                        <p className="text-vynexa-text-muted text-xs line-clamp-1">
                          {task.description}
                        </p>
                      )}

                      <div className="flex items-center gap-3 text-[11px] text-vynexa-text-muted pt-0.5">
                        <span>Assigned to {task.assignedTo?.name || 'Unassigned'}</span>
                        <span>•</span>
                        {renderEntityBadge(task)}
                      </div>
                    </div>
                  </div>

                  {/* Right: Due Date & Actions */}
                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-8 sm:pl-0">
                    <div className="text-right">
                      {task.dueDate ? (
                        <div
                          className={`font-mono text-xs flex items-center gap-1 justify-end ${
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
                      {overdue && (
                        <span className="text-[10px] text-vynexa-danger font-mono">Overdue</span>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Reassign Task"
                        onClick={() => setSelectedForAssign(task)}
                      >
                        <UserPlus className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0"
                        title="Edit Task"
                        onClick={() => setSelectedForEdit(task)}
                      >
                        <Edit2 className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-vynexa-danger"
                        title="Delete Task"
                        onClick={() => setSelectedForDelete(task)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
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

      {/* Create Task Modal */}
      <CreateTaskModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchTasks}
      />

      {/* Edit Task Modal */}
      <EditTaskModal
        isOpen={Boolean(selectedForEdit)}
        onClose={() => setSelectedForEdit(null)}
        onSuccess={fetchTasks}
        task={selectedForEdit}
      />

      {/* Assign Task Modal */}
      <AssignTaskModal
        isOpen={Boolean(selectedForAssign)}
        onClose={() => setSelectedForAssign(null)}
        onSuccess={fetchTasks}
        task={selectedForAssign}
      />

      {/* Delete Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(selectedForDelete)}
        onClose={() => setSelectedForDelete(null)}
        title="Delete Task"
        maxWidth="sm"
      >
        <div className="space-y-4 text-xs">
          <p className="text-vynexa-text-secondary">
            Are you sure you want to delete <span className="font-semibold text-white">"{selectedForDelete?.title}"</span>?
            This will archive the task from your active queue.
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
              Delete Task
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
