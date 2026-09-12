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
  AlertCircle,
  RefreshCw,
  PhoneCall,
  Video,
  Mail,
  FileText,
  Clock,
  ArrowUpRight,
  ShieldCheck
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { dashboardService } from '@/services/dashboard.service';
import { DashboardOverviewData } from '@/types/dashboard.types';
import { useAuth } from '@/context/AuthContext';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const [data, setData] = useState<DashboardOverviewData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboard = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await dashboardService.getOverview();
      setData(res);
    } catch (_err) {
      setError('Unable to load workspace dashboard data from PostgreSQL server.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboard();
  }, [fetchDashboard]);

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

  return (
    <div className="space-y-6 select-none">
      {/* Restrained Enterprise Dashboard Header */}
      <PageHeader
        title="Dashboard"
        description="Overview of your customer and sales activity."
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
              title="Refresh Dashboard"
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
              <h3 className="text-sm font-semibold text-vynexa-text-primary">Dashboard Connection Error</h3>
              <p className="text-xs text-vynexa-text-secondary mt-1">{error}</p>
            </div>
            <Button size="sm" variant="outline" onClick={fetchDashboard} leftIcon={<RefreshCw className="h-3.5 w-3.5" />}>
              Retry Connection
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
              <span className="text-[10px] text-vynexa-text-muted">In pipeline</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">ACTIVE DEALS</span>
                <Kanban className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.activeOpportunities}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">Open status</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">PIPELINE VALUE</span>
                <TrendingUp className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {formatCurrency(data.metrics.pipelineValue)}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">Open forecast</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">OPEN TASKS</span>
                <CheckSquare className="h-3.5 w-3.5" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.openTasks}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">Pending action</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">WON DEALS</span>
                <CheckCircle2 className="h-3.5 w-3.5 text-vynexa-status-success" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.wonOpportunities}
              </div>
              <span className="text-[10px] text-vynexa-text-muted">Closed won</span>
            </Card>

            <Card className="bg-vynexa-surface border-vynexa-border p-3.5">
              <div className="flex items-center justify-between text-vynexa-text-muted mb-1">
                <span className="text-[11px] font-mono font-medium uppercase">OVERDUE TASKS</span>
                <Clock className="h-3.5 w-3.5 text-vynexa-status-danger" />
              </div>
              <div className="text-xl font-bold font-mono text-vynexa-text-primary tracking-tight">
                {data.metrics.overdueTasks}
              </div>
              <span className="text-[10px] text-vynexa-status-danger font-mono font-medium">Requires action</span>
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
                      <CardTitle className="text-sm font-semibold">Sales Pipeline Distribution</CardTitle>
                      <CardDescription className="text-xs">Active opportunities grouped by deal stage.</CardDescription>
                    </div>
                    <Link to="/app/pipeline">
                      <Button variant="ghost" size="sm" className="text-xs font-mono" rightIcon={<ArrowUpRight className="h-3.5 w-3.5" />}>
                        View Kanban
                      </Button>
                    </Link>
                  </div>
                </CardHeader>
                <CardContent className="pt-4 space-y-3">
                  {data.pipeline.length === 0 ? (
                    <div className="py-8 text-center text-xs text-vynexa-text-muted">
                      No active pipeline stages configured.
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

              {/* TASKS OVERVIEW */}
              <Card className="bg-vynexa-surface border-vynexa-border">
                <CardHeader className="pb-3 border-b border-vynexa-border">
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="text-sm font-semibold">Tasks &amp; Action Items</CardTitle>
                      <CardDescription className="text-xs">Pending tasks and customer follow-ups.</CardDescription>
                    </div>
                    {data.metrics.overdueTasks > 0 && (
                      <Badge variant="red" className="text-[10px] font-mono">
                        {data.metrics.overdueTasks} Overdue
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {data.tasks.length === 0 ? (
                    <div className="py-8 text-center text-xs text-vynexa-text-muted space-y-1">
                      <CheckCircle2 className="h-6 w-6 text-vynexa-text-muted mx-auto" />
                      <p className="font-medium text-vynexa-text-primary">You're all caught up!</p>
                      <p className="text-[11px]">No pending tasks or action items due.</p>
                    </div>
                  ) : (
                    <div className="divide-y divide-vynexa-border/40">
                      {data.tasks.map((task) => (
                        <div key={task.id} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                          <div className="flex items-center gap-2.5 overflow-hidden">
                            <div
                              className={`h-2 w-2 rounded-full shrink-0 ${
                                task.isOverdue
                                  ? 'bg-vynexa-status-danger'
                                  : task.priority === 'HIGH' || task.priority === 'URGENT'
                                  ? 'bg-vynexa-status-warning'
                                  : 'bg-vynexa-status-info'
                              }`}
                            />
                            <div className="truncate">
                              <p className={`font-semibold truncate ${task.isOverdue ? 'text-vynexa-status-danger' : 'text-vynexa-text-primary'}`}>
                                {task.title}
                              </p>
                              {task.relatedEntityName && (
                                <p className="text-[11px] text-vynexa-text-muted truncate">{task.relatedEntityName}</p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 shrink-0 font-mono text-[11px]">
                            {task.dueDate && (
                              <span className={task.isOverdue ? 'text-vynexa-status-danger font-semibold' : 'text-vynexa-text-muted'}>
                                {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                              </span>
                            )}
                            <Badge variant={task.priority === 'URGENT' ? 'red' : 'outline'} className="text-[9px] px-1.5 py-0.2">
                              {task.priority}
                            </Badge>
                          </div>
                        </div>
                      ))}
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
                  <CardTitle className="text-sm font-semibold">Recent Interaction Log</CardTitle>
                  <CardDescription className="text-xs">Latest activity recorded across workspace.</CardDescription>
                </CardHeader>
                <CardContent className="pt-3">
                  {data.recentActivities.length === 0 ? (
                    <div className="py-8 text-center text-xs text-vynexa-text-muted">
                      No customer interactions logged yet.
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
                    <CardTitle className="text-sm font-semibold">Workspace Stream</CardTitle>
                    {data.notifications.unreadCount > 0 && (
                      <Badge variant="blue" className="text-[10px] font-mono px-1.5">
                        {data.notifications.unreadCount} Unread
                      </Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="pt-3">
                  {data.notifications.items.length === 0 ? (
                    <div className="py-6 text-center text-xs text-vynexa-text-muted">
                      No system notifications.
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
                    <p className="text-xs font-semibold text-vynexa-text-primary">Tenant Data Boundary</p>
                    <p className="text-[11px] text-vynexa-text-muted">Metrics &amp; records isolated for {data.organization.name}.</p>
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
