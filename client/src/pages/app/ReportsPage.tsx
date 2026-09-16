import React, { useState, useEffect, useCallback } from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Tabs } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/components/ui/toast';
import { reportsService } from '@/services/reports.service';
import {
  ReportType,
  ReportFilterParams,
  OverviewReportData,
  LeadReportData,
  SalesReportData,
  PipelineReportData,
  ActivityReportData,
  TaskReportData,
  SupportReportData,
  CampaignReportData
} from '@/types/reports.types';
import { ReportFilterToolbar } from '@/components/reports/ReportFilterToolbar';
import { MetricStatCard } from '@/components/reports/MetricStatCard';
import { DistributionBar } from '@/components/reports/DistributionBar';
import {
  BarChart3,
  TrendingUp,
  DollarSign,
  Users,
  CheckSquare,
  LifeBuoy,
  Megaphone,
  Briefcase,
  PhoneCall,
  Clock,
  Target,
  Percent
} from 'lucide-react';

const REPORT_TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'leads', label: 'Leads' },
  { id: 'sales', label: 'Sales' },
  { id: 'pipeline', label: 'Pipeline' },
  { id: 'activities', label: 'Activities' },
  { id: 'tasks', label: 'Tasks' },
  { id: 'support', label: 'Support' },
  { id: 'campaigns', label: 'Campaigns' }
];

export const ReportsPage: React.FC = () => {
  const { toast } = useToast();

  const [activeTab, setActiveTab] = useState<ReportType>('overview');
  const [filters, setFilters] = useState<ReportFilterParams>({});
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // Data states
  const [overviewData, setOverviewData] = useState<OverviewReportData | null>(null);
  const [leadData, setLeadData] = useState<LeadReportData | null>(null);
  const [salesData, setSalesData] = useState<SalesReportData | null>(null);
  const [pipelineData, setPipelineData] = useState<PipelineReportData | null>(null);
  const [activityData, setActivityData] = useState<ActivityReportData | null>(null);
  const [taskData, setTaskData] = useState<TaskReportData | null>(null);
  const [supportData, setSupportData] = useState<SupportReportData | null>(null);
  const [campaignData, setCampaignData] = useState<CampaignReportData | null>(null);

  const fetchCurrentReport = useCallback(async () => {
    try {
      setLoading(true);
      switch (activeTab) {
        case 'overview': {
          const res = await reportsService.getOverviewReport(filters);
          setOverviewData(res);
          break;
        }
        case 'leads': {
          const res = await reportsService.getLeadReport(filters);
          setLeadData(res);
          break;
        }
        case 'sales': {
          const res = await reportsService.getSalesReport(filters);
          setSalesData(res);
          break;
        }
        case 'pipeline': {
          const res = await reportsService.getPipelineReport(filters);
          setPipelineData(res);
          break;
        }
        case 'activities': {
          const res = await reportsService.getActivityReport(filters);
          setActivityData(res);
          break;
        }
        case 'tasks': {
          const res = await reportsService.getTaskReport(filters);
          setTaskData(res);
          break;
        }
        case 'support': {
          const res = await reportsService.getSupportReport(filters);
          setSupportData(res);
          break;
        }
        case 'campaigns': {
          const res = await reportsService.getCampaignReport(filters);
          setCampaignData(res);
          break;
        }
      }
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Report Query Error',
        message: err.message || 'Could not fetch report metrics.'
      });
    } finally {
      setLoading(false);
    }
  }, [activeTab, filters, toast]);

  useEffect(() => {
    fetchCurrentReport();
  }, [fetchCurrentReport]);

  const handleExport = async () => {
    try {
      setIsExporting(true);
      await reportsService.exportReport(activeTab, filters);
      toast({
        title: 'Report Exported',
        message: `Downloaded ${activeTab} report as CSV.`,
        type: 'success'
      });
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Export Failed',
        message: err.message || 'Could not generate report CSV.'
      });
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-6 pb-12">
      <PageHeader
        title="Reports"
        description="Review sales performance, pipeline forecasts, and team activity."
      />

      {/* Date & Filter Toolbar */}
      <ReportFilterToolbar
        filters={filters}
        onFilterChange={setFilters}
        onExport={handleExport}
        isExporting={isExporting}
        reportType={activeTab}
      />

      {/* Domain Navigation Tabs */}
      <Tabs
        tabs={REPORT_TABS}
        activeTab={activeTab}
        onChange={(tabId) => setActiveTab(tabId as ReportType)}
      />

      {/* Tab Content */}
      {loading ? (
        <div className="py-16 text-center text-xs text-vynexa-text-muted">
          Loading report...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. OVERVIEW REPORT */}
          {activeTab === 'overview' && overviewData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Lead conversion rate"
                  value={`${overviewData.leads.conversionRate}%`}
                  subtitle={`${overviewData.leads.converted} of ${overviewData.leads.total} leads converted`}
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Pipeline value"
                  value={`$${overviewData.sales.pipelineValue.toLocaleString()}`}
                  subtitle={`${overviewData.sales.openOpportunities} open deals`}
                  variant="blue"
                  icon={Briefcase}
                />
                <MetricStatCard
                  title="Won revenue"
                  value={`$${overviewData.sales.wonRevenue.toLocaleString()}`}
                  subtitle={`${overviewData.sales.wonOpportunities} closed deals (${overviewData.sales.winRate}% win rate)`}
                  variant="emerald"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Average deal size"
                  value={`$${overviewData.sales.averageDealSize.toLocaleString()}`}
                  subtitle="For won deals"
                  variant="default"
                  icon={Target}
                />
                <MetricStatCard
                  title="Task completion rate"
                  value={`${overviewData.tasks.completionRate}%`}
                  subtitle={`${overviewData.tasks.completed} of ${overviewData.tasks.total} tasks completed`}
                  variant="default"
                  icon={CheckSquare}
                />
                <MetricStatCard
                  title="Support resolution rate"
                  value={`${overviewData.support.resolutionRate}%`}
                  subtitle={`${overviewData.support.resolved} of ${overviewData.support.total} requests resolved`}
                  variant="emerald"
                  icon={LifeBuoy}
                />
                <MetricStatCard
                  title="Active campaigns"
                  value={overviewData.campaigns.active}
                  subtitle={`${overviewData.campaigns.total} total campaigns`}
                  variant="default"
                  icon={Megaphone}
                />
                <MetricStatCard
                  title="Total opportunities"
                  value={overviewData.sales.totalOpportunities}
                  subtitle={`${overviewData.sales.lostOpportunities} lost deals`}
                  variant="default"
                  icon={BarChart3}
                />
              </div>
            </div>
          )}

          {/* 2. LEADS REPORT */}
          {activeTab === 'leads' && leadData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricStatCard
                  title="Total leads"
                  value={leadData.totalLeads ?? 0}
                  subtitle="All captured leads"
                  variant="default"
                  icon={Users}
                />
                <MetricStatCard
                  title="Conversion rate"
                  value={`${leadData.conversionRate ?? 0}%`}
                  subtitle="Converted to customers and deals"
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Converted leads"
                  value={(leadData.byStatus || []).find((s) => s.status === 'CONVERTED')?.count ?? 0}
                  subtitle="Converted into accounts & deals"
                  variant="blue"
                  icon={Target}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Leads by status"
                  segments={(leadData.byStatus || []).map((s) => ({
                    label: s.status,
                    count: s.count,
                    percentage: s.percentage
                  }))}
                  totalCount={leadData.totalLeads ?? 0}
                />

                <DistributionBar
                  title="Leads by source"
                  segments={(leadData.bySource || []).map((s) => ({
                    label: s.source,
                    count: s.count,
                    percentage: s.percentage
                  }))}
                  totalCount={leadData.totalLeads ?? 0}
                />
              </div>

              {/* Timeline Trend Table */}
              {(leadData.trend || []).length > 0 && (
                <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                  <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                    Daily new leads
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-vynexa-border text-vynexa-text-secondary">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Leads</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vynexa-border/40 font-mono">
                        {(leadData.trend || []).map((row) => (
                          <tr key={row.date} className="hover:bg-vynexa-surface-secondary/30">
                            <td className="py-1.5 px-3 text-vynexa-text-primary">{row.date}</td>
                            <td className="py-1.5 px-3 text-right text-emerald-400 font-medium">
                              {row.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* 3. SALES REPORT */}
          {activeTab === 'sales' && salesData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Won revenue"
                  value={`$${(salesData.wonRevenue ?? 0).toLocaleString()}`}
                  subtitle={`${salesData.wonCount ?? 0} won deals`}
                  variant="emerald"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Open pipeline value"
                  value={`$${(salesData.pipelineValue ?? 0).toLocaleString()}`}
                  subtitle={`${salesData.openCount ?? 0} open deals`}
                  variant="blue"
                  icon={Briefcase}
                />
                <MetricStatCard
                  title="Win rate"
                  value={`${salesData.winRate ?? 0}%`}
                  subtitle={`${salesData.wonCount ?? 0} won / ${salesData.lostCount ?? 0} lost`}
                  variant="emerald"
                  icon={Percent}
                />
                <MetricStatCard
                  title="Average deal size"
                  value={`$${(salesData.averageDealSize ?? 0).toLocaleString()}`}
                  subtitle="For won deals"
                  variant="default"
                  icon={Target}
                />
              </div>

              {/* Sales Rep Leaderboard */}
              <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                  Sales by team member
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/40 text-vynexa-text-secondary font-medium">
                        <th className="py-2.5 px-3">Team member</th>
                        <th className="py-2.5 px-3 text-center">Total opportunities</th>
                        <th className="py-2.5 px-3 text-center">Won deals</th>
                        <th className="py-2.5 px-3 text-right">Won revenue</th>
                        <th className="py-2.5 px-3 text-right">Win rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vynexa-border/60">
                      {(salesData.byRep || []).length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-vynexa-text-muted">
                            No sales data found for this date range.
                          </td>
                        </tr>
                      ) : (
                        (salesData.byRep || []).map((rep) => {
                          const repWinRate =
                            rep.totalDeals > 0
                              ? Number(((rep.wonDeals / rep.totalDeals) * 100).toFixed(1))
                              : 0;
                          return (
                            <tr key={rep.userId} className="hover:bg-vynexa-surface-secondary/30">
                              <td className="py-2.5 px-3">
                                <div className="font-medium text-vynexa-text-primary">
                                  {rep.userName}
                                </div>
                                <div className="text-[11px] text-vynexa-text-muted">
                                  {rep.userEmail}
                                </div>
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-vynexa-text-secondary">
                                {rep.totalDeals}
                              </td>
                              <td className="py-2.5 px-3 text-center font-mono text-emerald-400 font-medium">
                                {rep.wonDeals}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono font-medium text-vynexa-text-primary">
                                ${(rep.wonRevenue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                              </td>
                              <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                                {repWinRate}%
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 4. PIPELINE REPORT */}
          {activeTab === 'pipeline' && pipelineData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <MetricStatCard
                  title="Open deals"
                  value={pipelineData.totalDeals ?? 0}
                  subtitle={pipelineData.pipeline?.name || 'Sales pipeline'}
                  variant="default"
                  icon={Briefcase}
                />
                <MetricStatCard
                  title="Pipeline value"
                  value={`$${(pipelineData.totalPipelineValue ?? 0).toLocaleString()}`}
                  subtitle="Total value of open deals"
                  variant="blue"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Expected sales"
                  value={`$${(pipelineData.totalWeightedValue ?? 0).toLocaleString()}`}
                  subtitle="Estimated sales based on deal probabilities"
                  variant="emerald"
                  icon={TrendingUp}
                />
              </div>

              {/* Stage-by-Stage Table */}
              <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                  Deals by stage
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/40 text-vynexa-text-secondary font-medium">
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3 text-center">Deals</th>
                        <th className="py-2.5 px-3 text-center">Probability</th>
                        <th className="py-2.5 px-3 text-right">Total value</th>
                        <th className="py-2.5 px-3 text-right">Expected sales</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vynexa-border/60">
                      {(pipelineData.stages || []).map((stage) => (
                        <tr key={stage.stageId} className="hover:bg-vynexa-surface-secondary/30">
                          <td className="py-2.5 px-3 font-medium text-vynexa-text-primary">
                            {stage.stageName}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-vynexa-text-secondary">
                            {stage.dealCount}
                          </td>
                          <td className="py-2.5 px-3 text-center font-mono text-blue-400">
                            {stage.probability}%
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono text-vynexa-text-primary">
                            ${(stage.totalValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-400">
                            ${(stage.weightedValue ?? 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* 5. ACTIVITIES REPORT */}
          {activeTab === 'activities' && activityData && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <MetricStatCard
                  title="Total activities"
                  value={activityData.totalActivities ?? 0}
                  subtitle="Calls, meetings, emails, and notes"
                  variant="default"
                  icon={PhoneCall}
                />
                <MetricStatCard
                  title="Team members"
                  value={(activityData.byUser || []).length}
                  subtitle="With logged activities"
                  variant="blue"
                  icon={Users}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Activities by type"
                  segments={(
                    Array.isArray(activityData.byType)
                      ? activityData.byType
                      : Array.isArray(activityData.byTypeArray)
                      ? activityData.byTypeArray
                      : Object.entries((activityData.typeBreakdown || activityData.byType || {}) as Record<string, number>).map(
                          ([type, count]) => ({
                            type,
                            count,
                            percentage: activityData.totalActivities ? Math.round((count / activityData.totalActivities) * 100) : 0
                          })
                        )
                  ).map((t) => ({
                    label: t.type,
                    count: t.count,
                    percentage: t.percentage
                  }))}
                  totalCount={activityData.totalActivities ?? 0}
                />

                <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                  <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                    Activities by team member
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-vynexa-border text-vynexa-text-secondary">
                          <th className="py-2 px-3">Team member</th>
                          <th className="py-2 px-3 text-right">Activities</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vynexa-border/40">
                        {(activityData.byUser || []).map((u) => (
                          <tr key={u.userId} className="hover:bg-vynexa-surface-secondary/30">
                            <td className="py-2.5 px-3 font-medium text-vynexa-text-primary">
                              {u.userName}
                              <span className="text-vynexa-text-muted font-normal ml-1.5">
                                ({u.userEmail})
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-400">
                              {u.count}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 6. TASKS REPORT */}
          {activeTab === 'tasks' && taskData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Total tasks"
                  value={taskData.totalTasks ?? 0}
                  subtitle="All created tasks"
                  variant="default"
                  icon={CheckSquare}
                />
                <MetricStatCard
                  title="Completed tasks"
                  value={taskData.completedTasks ?? 0}
                  subtitle={`${taskData.completionRate ?? 0}% completion rate`}
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Overdue tasks"
                  value={taskData.overdueTasks ?? 0}
                  subtitle="Past due date"
                  variant={(taskData.overdueTasks ?? 0) > 0 ? 'red' : 'default'}
                  icon={Clock}
                />
                <MetricStatCard
                  title="Completion rate"
                  value={`${taskData.completionRate ?? 0}%`}
                  subtitle="Percentage of tasks finished"
                  variant="emerald"
                  icon={Percent}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Tasks by status"
                  segments={(taskData.byStatus || []).map((s) => ({
                    label: s.status,
                    count: s.count
                  }))}
                  totalCount={taskData.totalTasks ?? 0}
                />

                <DistributionBar
                  title="Tasks by priority"
                  segments={(taskData.byPriority || []).map((p) => ({
                    label: p.priority,
                    count: p.count
                  }))}
                  totalCount={taskData.totalTasks ?? 0}
                />
              </div>
            </div>
          )}

          {/* 7. SUPPORT REPORT */}
          {activeTab === 'support' && supportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Total requests"
                  value={supportData.totalCases ?? 0}
                  subtitle="All support requests"
                  variant="default"
                  icon={LifeBuoy}
                />
                <MetricStatCard
                  title="Open requests"
                  value={supportData.openCases ?? 0}
                  subtitle="In progress or awaiting response"
                  variant="blue"
                  icon={Clock}
                />
                <MetricStatCard
                  title="Resolved requests"
                  value={supportData.resolvedCases ?? 0}
                  subtitle={`${supportData.resolutionRate ?? 0}% resolution rate`}
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Average resolution time"
                  value={
                    supportData.averageResolutionHours !== null && supportData.averageResolutionHours !== undefined
                      ? `${supportData.averageResolutionHours} hrs`
                      : 'N/A'
                  }
                  subtitle="Average time to resolve"
                  variant="default"
                  icon={Clock}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Requests by status"
                  segments={(supportData.byStatus || []).map((s) => ({
                    label: s.status,
                    count: s.count
                  }))}
                  totalCount={supportData.totalCases ?? 0}
                />

                <DistributionBar
                  title="Requests by priority"
                  segments={(supportData.byPriority || []).map((p) => ({
                    label: p.priority,
                    count: p.count
                  }))}
                  totalCount={supportData.totalCases ?? 0}
                />
              </div>
            </div>
          )}

          {/* 8. CAMPAIGNS REPORT */}
          {activeTab === 'campaigns' && campaignData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Total campaigns"
                  value={campaignData.totalCampaigns ?? 0}
                  subtitle={`${campaignData.activeCampaigns ?? 0} currently active`}
                  variant="default"
                  icon={Megaphone}
                />
                <MetricStatCard
                  title="Total budget"
                  value={`$${(campaignData.totalBudget ?? 0).toLocaleString()}`}
                  subtitle="Across all campaigns"
                  variant="default"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Revenue generated"
                  value={`$${(campaignData.totalAttributableRevenue ?? 0).toLocaleString()}`}
                  subtitle="From campaign leads"
                  variant={(campaignData.totalAttributableRevenue ?? 0) > 0 ? 'emerald' : 'default'}
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Return on investment"
                  value={
                    (campaignData.totalBudget ?? 0) > 0
                      ? `${Math.round(
                          (((campaignData.totalAttributableRevenue ?? 0) - (campaignData.totalBudget ?? 0)) /
                            (campaignData.totalBudget ?? 1)) *
                            100
                        )}%`
                      : 'N/A'
                  }
                  subtitle="Based on campaign budget"
                  variant={
                    (campaignData.totalBudget ?? 0) > 0 &&
                    (campaignData.totalAttributableRevenue ?? 0) >= (campaignData.totalBudget ?? 0)
                      ? 'emerald'
                      : (campaignData.totalAttributableRevenue ?? 0) === 0
                      ? 'default'
                      : 'red'
                  }
                  icon={Percent}
                />
              </div>

              {/* Campaign Performance Table */}
              <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                  Campaign performance
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/40 text-vynexa-text-secondary font-medium">
                        <th className="py-2.5 px-3">Campaign</th>
                        <th className="py-2.5 px-3">Status</th>
                        <th className="py-2.5 px-3 text-right">Budget</th>
                        <th className="py-2.5 px-3 text-center">Leads</th>
                        <th className="py-2.5 px-3 text-center">Converted</th>
                        <th className="py-2.5 px-3 text-right">Pipeline</th>
                        <th className="py-2.5 px-3 text-right">Revenue</th>
                        <th className="py-2.5 px-3 text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vynexa-border/60">
                      {(campaignData.campaigns || []).length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-vynexa-text-muted">
                            No campaign records found for this date range.
                          </td>
                        </tr>
                      ) : (
                        (campaignData.campaigns || []).map((c) => (
                          <tr key={c.id} className="hover:bg-vynexa-surface-secondary/30">
                            <td className="py-2.5 px-3">
                              <div className="font-medium text-vynexa-text-primary">{c.name}</div>
                              {c.type && (
                                <div className="text-[11px] text-vynexa-text-muted">{c.type}</div>
                              )}
                            </td>
                            <td className="py-2.5 px-3">
                              <Badge variant="outline">{c.status}</Badge>
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-vynexa-text-secondary">
                              {c.budget !== null && c.budget !== undefined ? `$${Number(c.budget).toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-vynexa-text-secondary">
                              {c.leadCount ?? 0}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                              {c.convertedLeadCount ?? 0} ({c.conversionRate ?? 0}%)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-vynexa-text-primary">
                              ${(c.pipelineValue ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-medium">
                              ${(c.wonRevenue ?? 0).toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium">
                              {c.roi !== null && c.roi !== undefined ? (
                                <span className={c.roi >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                                  {c.roi > 0 ? `+${c.roi}%` : `${c.roi}%`}
                                </span>
                              ) : (
                                <span className="text-vynexa-text-muted">—</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
