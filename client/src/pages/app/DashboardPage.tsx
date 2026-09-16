import React, { useEffect, useState, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  UserCheck,
  TrendingUp,
  Kanban,
  CheckSquare,
  CheckCircle2,
  Circle,
  AlertCircle,
  RefreshCw,
  PhoneCall,
  Video,
  Mail,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck,
  Plus
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '@/services/dashboard.service';
import { tasksService } from '@/services/tasks.service';
import { useToast } from '@/components/ui/toast';
import { DashboardOverviewData } from '@/types/dashboard.types';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [taskTab, setTaskTab] = useState<'my' | 'all'>('my');
  const [completingTaskId, setCompletingTaskId] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getOverview();
      setData(res);
    } catch (_err) {
      setError('Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

  const handleQuickComplete = async (taskId: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (completingTaskId) return;

    setCompletingTaskId(taskId);
    try {
      await tasksService.changeStatus(taskId, 'COMPLETED');
      toast({
        type: 'success',
        title: 'Task completed',
        message: 'Task status updated to completed.'
      });
      setData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          tasks: prev.tasks.filter((t) => t.id !== taskId),
          myTasks: prev.myTasks ? prev.myTasks.filter((t) => t.id !== taskId) : [],
          metrics: {
            ...prev.metrics,
            openTasks: Math.max(0, prev.metrics.openTasks - 1),
            myOpenTasks: prev.metrics.myOpenTasks ? Math.max(0, prev.metrics.myOpenTasks - 1) : undefined
          }
        };
      });
    } catch (_err) {
      toast({
        type: 'error',
        title: 'Error',
        message: 'Could not complete task. Please try again.'
      });
    } finally {
      setCompletingTaskId(null);
    }
  };

  const currencySymbol = data?.organization.currency === 'INR' ? '₹' : '$';

  const formatCurrency = (val: number) => {
    if (val >= 1000000) return `${currencySymbol}${(val / 1000000).toFixed(1)}M`;
    if (val >= 1000) return `${currencySymbol}${(val / 1000).toFixed(1)}k`;
    return `${currencySymbol}${val.toLocaleString()}`;
  };

  const todayDateStr = new Date().toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });

  const myTasksList = data?.myTasks ?? (user ? (data?.tasks || []).filter((t) => t.assignedTo?.id === user.id) : []);
  const allTasksList = data?.tasks || [];
  const currentTasks = taskTab === 'my' ? myTasksList : allTasksList;
  const myOverdueCount = data?.metrics.myOverdueTasks ?? myTasksList.filter((t) => t.isOverdue).length;

  return (
    <div className="space-y-6 select-none">
      {/* Restrained Enterprise Dashboard Header */}
      <PageHeader
        title="Dashboard"
        description="See your sales, active deals, tasks, and recent activity."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'Overview' }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-2.5 py-1 text-xs font-mono">
              {todayDateStr}
            </Badge>
            <Badge variant="slate" className="px-2.5 py-1 text-xs font-mono">
              {data?.organization.name || user?.organization?.name || 'Workspace'}
            </Badge>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchDashboard}
              isLoading={loading}
              title="Refresh dashboard"
              className="h-7 px-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      {/* ERROR STATE */}
      {error && (
        <Card className="bg-vynexa-surface border-vynexa-status-danger/40">
          <CardContent className="py-6 text-center space-y-3">
            <div className="mx-auto h-10 w-10 rounded-full bg-vynexa-status-danger-bg flex items-center justify-center text-vynexa-status-danger">
              <AlertCircle className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-vynexa-text-primary">Could not load dashboard</h3>
              <p className="text-xs text-vynexa-text-secondary mt-1">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchDashboard} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Try again
            </Button>
          </CardContent>
        </Card>
      )}

      {/* LOADING SKELETON STATE */}
      {loading && !data && !error && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Card key={i} className="bg-vynexa-surface border-vynexa-border p-4 space-y-2">
                <Skeleton className="h-3 w-16 bg-vynexa-border" />
                <Skeleton className="h-6 w-24 bg-vynexa-border" />
              </Card>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2 bg-vynexa-surface border-vynexa-border p-5 space-y-4">
              <Skeleton className="h-4 w-32 bg-vynexa-border" />
              <Skeleton className="h-32 w-full bg-vynexa-border" />
            </Card>
            <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-4">
              <Skeleton className="h-4 w-28 bg-vynexa-border" />
              <Skeleton className="h-32 w-full bg-vynexa-border" />
            </Card>
          </div>
        </div>
      )}

      {/* SUCCESS STATE — REAL BACKEND DASHBOARD DATA */}
      {data && !loading && (
        <>
          {/* COMPACT KPI METRIC BLOCKS */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">TOTAL LEADS</span>
                <UserCheck className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.totalLeads}
              </div>
              <div className="flex items-center gap-1 mt-1 text-[10px] font-mono">
                <span className="text-emerald-400" title="Hot leads">{data.metrics.leadScores?.hot || 0} hot</span>
                <span className="text-vynexa-text-muted">·</span>
                <span className="text-blue-400" title="Warm leads">{data.metrics.leadScores?.warm || 0} warm</span>
                <span className="text-vynexa-text-muted">·</span>
                <span className="text-vynexa-text-muted" title="Cool / Cold leads">{(data.metrics.leadScores?.cool || 0) + (data.metrics.leadScores?.cold || 0)} cool</span>
              </div>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">ACTIVE DEALS</span>
                <Kanban className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.activeOpportunities}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">In progress</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">PIPELINE VALUE</span>
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {formatCurrency(data.metrics.pipelineValue)}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">Expected sales</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">OPEN TASKS</span>
                <CheckSquare className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.openTasks}
              </div>
              <span className="text-[10px] text-vynexa-text-muted font-mono truncate block">
                {myTasksList.length} assigned to you
              </span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">WON DEALS</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-vynexa-status-success" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.wonOpportunities}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">Deals won</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">OVERDUE TASKS</span>
                <Clock className="h-3.5 w-3.5 text-vynexa-status-danger" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.overdueTasks}
              </div>
              <span className={`text-[10px] font-mono font-medium truncate block ${myOverdueCount > 0 ? 'text-vynexa-status-danger' : 'text-vynexa-text-muted'}`}>
                {myOverdueCount > 0 ? `${myOverdueCount} of yours overdue` : 'None of yours overdue'}
              </span>
            </Card>
          </div>

          {/* MAIN DASHBOARD CONTENT GRID */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* PIPELINE OVERVIEW & TASKS (2 COLS) */}
            <div className="lg:col-span-2 space-y-6">
              {/* PIPELINE STAGE BREAKDOWN */}
              <Card className="bg-vynexa-surface border-vynexa-border">
                <CardHeader className="pb-3 border-b border-vynexa-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Sales pipeline</CardTitle>
                      <CardDescription className="text-xs">Active deals by stage.</CardDescription>
                    </div>
                    <Link to="/app/pipeline">
                      <Button variant="ghost" size="sm" className="text-xs font-mono" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                        View pipeline
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {data.pipeline.length === 0 ? (
                    <div className="py-8 text-center text-xs text-vynexa-text-muted">
                      No deals in your pipeline yet.
                    </div>
                  ) : (
                    data.pipeline.map((stage) => (
                      <div key={stage.id} className="space-y-1 text-xs">
                        <div className="flex items-center justify-between font-medium">
                          <span className="text-vynexa-text-primary flex items-center gap-2">
                            {stage.name}
                            <Badge variant="outline" className="text-[10px] font-mono px-1.5">
                              {stage.count} {stage.count === 1 ? 'deal' : 'deals'}
                            </Badge>
                          </span>
                          <span className="font-mono text-vynexa-text-primary">
                            {formatCurrency(stage.totalValue)} ({stage.percentage}%)
                          </span>
                        </div>
                        {/* Stage Progress Bar */}
                        <div className="h-1.5 w-full bg-vynexa-surface-secondary rounded-full overflow-hidden">
                          <div
                            className="h-full bg-vynexa-text-primary transition-all duration-300"
                            style={{ width: `${Math.max(stage.percentage, stage.count > 0 ? 5 : 0)}%` }}
                          />
                        </div>
                      </div>
                    ))
                  )}
                </CardContent>
              </Card>

              {/* TASKS OVERVIEW WITH MY TASKS & ALL TASKS TOGGLE */}
              <Card className="bg-vynexa-surface border-vynexa-border">
                <CardHeader className="pb-3 border-b border-vynexa-border">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-sm font-semibold">
                          {taskTab === 'my' ? 'My tasks' : 'Team tasks'}
                        </CardTitle>
                        <Badge variant="outline" className="text-[10px] font-mono px-1.5 py-0.2">
                          {currentTasks.length}
                        </Badge>
                        {taskTab === 'my' && myOverdueCount > 0 && (
                          <Badge variant="red" className="text-[10px] font-mono">
                            {myOverdueCount} overdue
                          </Badge>
                        )}
                        {taskTab === 'all' && (data.metrics.overdueTasks || 0) > 0 && (
                          <Badge variant="red" className="text-[10px] font-mono">
                            {data.metrics.overdueTasks} overdue
                          </Badge>
                        )}
                      </div>
                      <CardDescription className="text-xs mt-0.5">
                        {taskTab === 'my'
                          ? 'Tasks assigned to you that need your attention.'
                          : 'Tasks across your organization.'}
                      </CardDescription>
                    </div>

                    <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto">
                      {/* Segmented Control */}
                      <div className="flex items-center rounded-lg bg-vynexa-surface-secondary p-0.5 border border-vynexa-border text-xs">
                        <button
                          type="button"
                          onClick={() => setTaskTab('my')}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                            taskTab === 'my'
                              ? 'bg-vynexa-surface text-vynexa-text-primary shadow-sm'
                              : 'text-vynexa-text-muted hover:text-vynexa-text-secondary'
                          }`}
                        >
                          <UserCheck className="h-3 w-3" />
                          <span>My tasks</span>
                          {myTasksList.length > 0 && (
                            <span className="px-1 rounded-full text-[10px] bg-vynexa-surface-elevated font-mono">
                              {myTasksList.length}
                            </span>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTaskTab('all')}
                          className={`px-2.5 py-1 rounded-md transition-all font-medium flex items-center gap-1.5 ${
                            taskTab === 'all'
                              ? 'bg-vynexa-surface text-vynexa-text-primary shadow-sm'
                              : 'text-vynexa-text-muted hover:text-vynexa-text-secondary'
                          }`}
                        >
                          <CheckSquare className="h-3 w-3" />
                          <span>All tasks</span>
                        </button>
                      </div>

                      <Link to={taskTab === 'my' && user ? `/app/tasks?assignedToId=${user.id}` : '/app/tasks'}>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs font-mono h-7 px-2"
                          rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}
                        >
                          View all
                        </Button>
                      </Link>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-3">
                  {currentTasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-vynexa-text-muted space-y-2">
                      <CheckCircle2 className="h-6 w-6 text-vynexa-text-muted mx-auto" />
                      <div>
                        <p className="font-medium text-vynexa-text-primary">
                          {taskTab === 'my' ? 'No tasks assigned to you' : "You're all caught up"}
                        </p>
                        <p className="text-[11px] text-vynexa-text-muted mt-0.5">
                          {taskTab === 'my'
                            ? 'You have finished all tasks assigned to you. Great job!'
                            : 'No open tasks need attention across the team right now.'}
                        </p>
                      </div>
                      {taskTab === 'my' && (
                        <Link to="/app/tasks?action=create">
                          <Button variant="outline" size="sm" className="text-xs h-7 mt-2" leftIcon={<Plus className="h-3 w-3" />}>
                            Create task
                          </Button>
                        </Link>
                      )}
                    </div>
                  ) : (
                    <div className="divide-y divide-vynexa-border/40">
                      {currentTasks.map((task) => {
                        const isCompleting = completingTaskId === task.id;
                        return (
                          <div
                            key={task.id}
                            className="py-2.5 flex items-center justify-between gap-3 text-xs group hover:bg-vynexa-surface-secondary/20 -mx-2 px-2 rounded transition-colors"
                          >
                            <div className="flex items-center gap-2.5 overflow-hidden flex-1 min-w-0">
                              {/* Quick Complete Toggle Checkbox */}
                              <button
                                type="button"
                                onClick={(e) => handleQuickComplete(task.id, e)}
                                disabled={isCompleting}
                                className="text-vynexa-text-muted hover:text-vynexa-status-success shrink-0 transition-colors p-0.5 rounded focus:outline-none"
                                title="Mark task as completed"
                              >
                                {isCompleting ? (
                                  <RefreshCw className="h-3.5 w-3.5 animate-spin text-vynexa-text-muted" />
                                ) : (
                                  <Circle className="h-3.5 w-3.5 group-hover:hidden" />
                                )}
                                {!isCompleting && (
                                  <CheckCircle2 className="h-3.5 w-3.5 hidden group-hover:inline text-vynexa-status-success" />
                                )}
                              </button>

                              <div className="truncate flex-1 min-w-0">
                                <Link
                                  to="/app/tasks"
                                  className={`font-semibold truncate block hover:underline ${
                                    task.isOverdue ? 'text-vynexa-status-danger' : 'text-vynexa-text-primary'
                                  }`}
                                >
                                  {task.title}
                                </Link>
                                <div className="flex items-center gap-2 text-[11px] text-vynexa-text-muted truncate mt-0.5">
                                  {task.relatedEntityName && (
                                    <span className="truncate">{task.relatedEntityName}</span>
                                  )}
                                  {taskTab === 'all' && task.assignedTo && (
                                    <>
                                      {task.relatedEntityName && <span>•</span>}
                                      <span className="truncate text-vynexa-text-secondary font-medium">
                                        {task.assignedTo.name || task.assignedTo.email}
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                              {task.dueDate && (
                                <span
                                  className={
                                    task.isOverdue
                                      ? 'text-vynexa-status-danger font-semibold'
                                      : 'text-vynexa-text-muted'
                                  }
                                >
                                  {new Date(task.dueDate).toLocaleDateString('en-US', {
                                    month: 'short',
                                    day: 'numeric'
                                  })}
                                </span>
                              )}
                              <Badge
                                variant={
                                  task.priority === 'URGENT'
                                    ? 'red'
                                    : task.priority === 'HIGH'
                                    ? 'amber'
                                    : 'outline'
                                }
                                className="text-[9px] px-1.5 py-0.2"
                              >
                                {task.priority}
                              </Badge>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* SIDEBAR COL: RECENT ACTIVITIES & NOTIFICATIONS (1 COL) */}
            <div className="space-y-6">
              {/* RECENT ACTIVITIES LOG */}
              <Card className="bg-vynexa-surface border-vynexa-border">
                <CardHeader className="pb-3 border-b border-vynexa-border">
                  <CardTitle className="text-sm font-semibold">Recent activity</CardTitle>
                  <CardDescription className="text-xs">Calls, meetings, emails, and notes.</CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  {data.recentActivities.length === 0 ? (
                    <div className="py-8 text-center text-xs text-vynexa-text-muted">
                      No activity logged yet.
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {data.recentActivities.map((act) => {
                        let IconComp = FileText;
                        if (act.type === 'CALL') IconComp = PhoneCall;
                        else if (act.type === 'MEETING') IconComp = Video;
                        else if (act.type === 'EMAIL') IconComp = Mail;

                        return (
                          <div key={act.id} className="flex items-start gap-2.5 text-xs">
                            <div className="h-6 w-6 rounded bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center shrink-0 mt-0.5 text-vynexa-text-muted">
                              <IconComp className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 overflow-hidden">
                              <p className="font-semibold text-vynexa-text-primary truncate">{act.subject}</p>
                              {act.relatedTo && (
                                <p className="text-[11px] text-vynexa-text-muted truncate">{act.relatedTo.name}</p>
                              )}
                              <p className="text-[10px] font-mono text-vynexa-text-muted mt-0.5">
                                {new Date(act.activityDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* USER NOTIFICATIONS WIDGET */}
              <Card className="bg-vynexa-surface border-vynexa-border">
                <CardHeader className="pb-3 border-b border-vynexa-border">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-sm font-semibold">Recent updates</CardTitle>
                    {data.notifications.unreadCount > 0 && (
                      <Badge variant="blue" className="text-[10px] font-mono px-1.5">
                        {data.notifications.unreadCount} unread
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {data.notifications.items.length === 0 ? (
                    <div className="py-6 text-center text-xs text-vynexa-text-muted">
                      No new notifications.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {data.notifications.items.map((notif) => (
                        <div key={notif.id} className="p-2 rounded border border-vynexa-border/40 bg-vynexa-surface-secondary/40 text-xs space-y-0.5">
                          <div className="font-medium text-vynexa-text-primary flex items-center justify-between">
                            <span>{notif.title}</span>
                            {!notif.isRead && <span className="h-1.5 w-1.5 rounded-full bg-vynexa-status-info" />}
                          </div>
                          <p className="text-[11px] text-vynexa-text-secondary">{notif.message}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* SECURITY TENANT ISOLATION CARD */}
              <Card className="bg-vynexa-surface border-vynexa-border">
                <CardContent className="p-3.5 flex items-center gap-3">
                  <ShieldCheck className="h-5 w-5 text-vynexa-text-muted shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-vynexa-text-primary">Data privacy</p>
                    <p className="text-[11px] text-vynexa-text-muted">All records are private to {data.organization.name}.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
