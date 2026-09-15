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
  { id: 'leads', label: 'Lead Funnel' },
  { id: 'sales', label: 'Sales & Revenue' },
  { id: 'pipeline', label: 'Pipeline Forecast' },
  { id: 'activities', label: 'Team Activities' },
  { id: 'tasks', label: 'Tasks & Productivity' },
  { id: 'support', label: 'Support & SLAs' },
  { id: 'campaigns', label: 'Campaign ROI' }
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
        title="Reports & Analytics"
        description="Comprehensive business intelligence across operational domains with formula-safe CSV export."
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
          Aggregating real-time report metrics...
        </div>
      ) : (
        <div className="space-y-6">
          {/* 1. OVERVIEW REPORT */}
          {activeTab === 'overview' && overviewData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Lead Conversion Rate"
                  value={`${overviewData.leads.conversionRate}%`}
                  subtitle={`${overviewData.leads.converted} of ${overviewData.leads.total} leads converted`}
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Active Pipeline Value"
                  value={`$${overviewData.sales.pipelineValue.toLocaleString()}`}
                  subtitle={`${overviewData.sales.openOpportunities} open deals`}
                  variant="blue"
                  icon={Briefcase}
                />
                <MetricStatCard
                  title="Won Revenue"
                  value={`$${overviewData.sales.wonRevenue.toLocaleString()}`}
                  subtitle={`${overviewData.sales.wonOpportunities} closed deals (${overviewData.sales.winRate}% win rate)`}
                  variant="emerald"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Average Deal Size"
                  value={`$${overviewData.sales.averageDealSize.toLocaleString()}`}
                  subtitle="Per won commercial deal"
                  variant="default"
                  icon={Target}
                />
                <MetricStatCard
                  title="Task Completion Rate"
                  value={`${overviewData.tasks.completionRate}%`}
                  subtitle={`${overviewData.tasks.completed} of ${overviewData.tasks.total} tasks completed`}
                  variant="default"
                  icon={CheckSquare}
                />
                <MetricStatCard
                  title="Support Resolution Rate"
                  value={`${overviewData.support.resolutionRate}%`}
                  subtitle={`${overviewData.support.resolved} of ${overviewData.support.total} tickets resolved`}
                  variant="emerald"
                  icon={LifeBuoy}
                />
                <MetricStatCard
                  title="Active Marketing Campaigns"
                  value={overviewData.campaigns.active}
                  subtitle={`${overviewData.campaigns.total} total campaigns configured`}
                  variant="default"
                  icon={Megaphone}
                />
                <MetricStatCard
                  title="Total Pipeline Deals"
                  value={overviewData.sales.totalOpportunities}
                  subtitle={`${overviewData.sales.lostOpportunities} closed lost`}
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
                  title="Total Leads Ingested"
                  value={leadData.totalLeads}
                  subtitle="Captured across all acquisition channels"
                  variant="default"
                  icon={Users}
                />
                <MetricStatCard
                  title="Conversion Rate"
                  value={`${leadData.conversionRate}%`}
                  subtitle="Leads converted to Customers & Deals"
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Active Lead Funnel Stages"
                  value={leadData.byStatus.length}
                  subtitle="Defined status categories"
                  variant="blue"
                  icon={Target}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Leads by Lifecycle Status"
                  segments={leadData.byStatus.map((s) => ({
                    label: s.status,
                    count: s.count,
                    percentage: s.percentage
                  }))}
                  totalCount={leadData.totalLeads}
                />

                <DistributionBar
                  title="Leads by Acquisition Source"
                  segments={leadData.bySource.map((s) => ({
                    label: s.source,
                    count: s.count,
                    percentage: s.percentage
                  }))}
                  totalCount={leadData.totalLeads}
                />
              </div>

              {/* Timeline Trend Table */}
              {leadData.trend && leadData.trend.length > 0 && (
                <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                  <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                    Daily Lead Ingestion Timeline
                  </h4>
                  <div className="max-h-48 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-vynexa-border text-vynexa-text-secondary">
                          <th className="py-2 px-3">Date</th>
                          <th className="py-2 px-3 text-right">Leads Ingested</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vynexa-border/40 font-mono">
                        {leadData.trend.map((row) => (
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
                  title="Won Revenue"
                  value={`$${salesData.wonRevenue.toLocaleString()}`}
                  subtitle={`${salesData.wonCount} won deals`}
                  variant="emerald"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Open Pipeline Value"
                  value={`$${salesData.pipelineValue.toLocaleString()}`}
                  subtitle={`${salesData.openCount} open deals`}
                  variant="blue"
                  icon={Briefcase}
                />
                <MetricStatCard
                  title="Win Rate"
                  value={`${salesData.winRate}%`}
                  subtitle={`${salesData.wonCount} Won / ${salesData.lostCount} Lost`}
                  variant="emerald"
                  icon={Percent}
                />
                <MetricStatCard
                  title="Average Deal Size"
                  value={`$${salesData.averageDealSize.toLocaleString()}`}
                  subtitle="Per closed commercial order"
                  variant="default"
                  icon={Target}
                />
              </div>

              {/* Sales Rep Leaderboard */}
              <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                  Sales Performance by Representative
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/40 text-vynexa-text-secondary font-medium">
                        <th className="py-2.5 px-3">Sales Rep</th>
                        <th className="py-2.5 px-3 text-center">Total Opportunities</th>
                        <th className="py-2.5 px-3 text-center">Won Deals</th>
                        <th className="py-2.5 px-3 text-right">Won Revenue</th>
                        <th className="py-2.5 px-3 text-right">Rep Win Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vynexa-border/60">
                      {salesData.byRep.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-6 text-center text-vynexa-text-muted">
                            No sales representative performance data in this date range.
                          </td>
                        </tr>
                      ) : (
                        salesData.byRep.map((rep) => {
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
                                ${rep.wonRevenue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  title="Total Pipeline Deals"
                  value={pipelineData.totalDeals}
                  subtitle={pipelineData.pipeline?.name || 'Default Sales Pipeline'}
                  variant="default"
                  icon={Briefcase}
                />
                <MetricStatCard
                  title="Unweighted Pipeline Value"
                  value={`$${pipelineData.totalPipelineValue.toLocaleString()}`}
                  subtitle="Total nominal deal value"
                  variant="blue"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Weighted Expected Forecast"
                  value={`$${pipelineData.totalWeightedValue.toLocaleString()}`}
                  subtitle="Probability-adjusted pipeline revenue"
                  variant="emerald"
                  icon={TrendingUp}
                />
              </div>

              {/* Stage-by-Stage Table */}
              <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                  Pipeline Stages & Probability Breakdown
                </h4>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/40 text-vynexa-text-secondary font-medium">
                        <th className="py-2.5 px-3">Stage</th>
                        <th className="py-2.5 px-3 text-center">Deals</th>
                        <th className="py-2.5 px-3 text-center">Win Probability</th>
                        <th className="py-2.5 px-3 text-right">Nominal Value</th>
                        <th className="py-2.5 px-3 text-right">Weighted Forecast</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vynexa-border/60">
                      {pipelineData.stages.map((stage) => (
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
                            ${stage.totalValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                          </td>
                          <td className="py-2.5 px-3 text-right font-mono font-medium text-emerald-400">
                            ${stage.weightedValue.toLocaleString(undefined, { minimumFractionDigits: 2 })}
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
                  title="Total Activities Logged"
                  value={activityData.totalActivities}
                  subtitle="Calls, meetings, emails, and touchpoints"
                  variant="default"
                  icon={PhoneCall}
                />
                <MetricStatCard
                  title="Active Team Contributors"
                  value={activityData.byUser.length}
                  subtitle="Logging customer interactions"
                  variant="blue"
                  icon={Users}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Activities by Interaction Type"
                  segments={activityData.byType.map((t) => ({
                    label: t.type,
                    count: t.count,
                    percentage: t.percentage
                  }))}
                  totalCount={activityData.totalActivities}
                />

                <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                  <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                    Activities Logged by Team Member
                  </h4>
                  <div className="max-h-60 overflow-y-auto">
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-vynexa-border text-vynexa-text-secondary">
                          <th className="py-2 px-3">Team Member</th>
                          <th className="py-2 px-3 text-right">Activities Logged</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-vynexa-border/40">
                        {activityData.byUser.map((u) => (
                          <tr key={u.userId} className="hover:bg-vynexa-surface-secondary/30">
                            <td className="py-2 px-3 font-medium text-vynexa-text-primary">
                              {u.userName}
                              <span className="text-vynexa-text-muted font-normal ml-1.5">
                                ({u.userEmail})
                              </span>
                            </td>
                            <td className="py-2 px-3 text-right font-mono font-medium text-emerald-400">
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
                  title="Total Action Items"
                  value={taskData.totalTasks}
                  subtitle="Assigned across organization"
                  variant="default"
                  icon={CheckSquare}
                />
                <MetricStatCard
                  title="Completed Tasks"
                  value={taskData.completedTasks}
                  subtitle={`${taskData.completionRate}% completion rate`}
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Overdue Tasks"
                  value={taskData.overdueTasks}
                  subtitle="Past scheduled due date"
                  variant={taskData.overdueTasks > 0 ? 'red' : 'default'}
                  icon={Clock}
                />
                <MetricStatCard
                  title="Completion Rate"
                  value={`${taskData.completionRate}%`}
                  subtitle="Efficiency indicator"
                  variant="emerald"
                  icon={Percent}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Tasks by Status"
                  segments={taskData.byStatus.map((s) => ({
                    label: s.status,
                    count: s.count
                  }))}
                  totalCount={taskData.totalTasks}
                />

                <DistributionBar
                  title="Tasks by Priority"
                  segments={taskData.byPriority.map((p) => ({
                    label: p.priority,
                    count: p.count
                  }))}
                  totalCount={taskData.totalTasks}
                />
              </div>
            </div>
          )}

          {/* 7. SUPPORT REPORT */}
          {activeTab === 'support' && supportData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Total Support Cases"
                  value={supportData.totalCases}
                  subtitle="Logged tickets"
                  variant="default"
                  icon={LifeBuoy}
                />
                <MetricStatCard
                  title="Open / In Progress"
                  value={supportData.openCases}
                  subtitle="Requiring agent resolution"
                  variant="blue"
                  icon={Clock}
                />
                <MetricStatCard
                  title="Resolved Cases"
                  value={supportData.resolvedCases}
                  subtitle={`${supportData.resolutionRate}% resolution rate`}
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Avg Resolution Time"
                  value={
                    supportData.averageResolutionHours !== null
                      ? `${supportData.averageResolutionHours} hrs`
                      : 'N/A'
                  }
                  subtitle="Average SLA time to close"
                  variant="default"
                  icon={Clock}
                />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <DistributionBar
                  title="Cases by Status"
                  segments={supportData.byStatus.map((s) => ({
                    label: s.status,
                    count: s.count
                  }))}
                  totalCount={supportData.totalCases}
                />

                <DistributionBar
                  title="Cases by Priority"
                  segments={supportData.byPriority.map((p) => ({
                    label: p.priority,
                    count: p.count
                  }))}
                  totalCount={supportData.totalCases}
                />
              </div>
            </div>
          )}

          {/* 8. CAMPAIGNS REPORT */}
          {activeTab === 'campaigns' && campaignData && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <MetricStatCard
                  title="Total Campaigns"
                  value={campaignData.totalCampaigns}
                  subtitle={`${campaignData.activeCampaigns} currently active`}
                  variant="default"
                  icon={Megaphone}
                />
                <MetricStatCard
                  title="Total Marketing Budget"
                  value={`$${campaignData.totalBudget.toLocaleString()}`}
                  subtitle="Allocated across initiatives"
                  variant="default"
                  icon={DollarSign}
                />
                <MetricStatCard
                  title="Attributable Revenue"
                  value={`$${campaignData.totalAttributableRevenue.toLocaleString()}`}
                  subtitle="Generated from linked leads"
                  variant="emerald"
                  icon={TrendingUp}
                />
                <MetricStatCard
                  title="Aggregate ROI"
                  value={
                    campaignData.totalBudget > 0
                      ? `${Math.round(
                          ((campaignData.totalAttributableRevenue - campaignData.totalBudget) /
                            campaignData.totalBudget) *
                            100
                        )}%`
                      : 'N/A'
                  }
                  subtitle="Net return on marketing investment"
                  variant="emerald"
                  icon={Percent}
                />
              </div>

              {/* Campaign Performance Table */}
              <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4">
                <h4 className="text-xs font-semibold text-vynexa-text-primary mb-3">
                  Campaign Attribution & Performance Matrix
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
                        <th className="py-2.5 px-3 text-right">Attributable Revenue</th>
                        <th className="py-2.5 px-3 text-right">ROI</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-vynexa-border/60">
                      {campaignData.campaigns.length === 0 ? (
                        <tr>
                          <td colSpan={8} className="py-6 text-center text-vynexa-text-muted">
                            No campaign performance records found in this date range.
                          </td>
                        </tr>
                      ) : (
                        campaignData.campaigns.map((c) => (
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
                              {c.budget !== null ? `$${c.budget.toLocaleString()}` : '—'}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-vynexa-text-secondary">
                              {c.leadCount}
                            </td>
                            <td className="py-2.5 px-3 text-center font-mono text-emerald-400">
                              {c.convertedLeadCount} ({c.conversionRate}%)
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-vynexa-text-primary">
                              ${c.pipelineValue.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-medium">
                              ${c.wonRevenue.toLocaleString()}
                            </td>
                            <td className="py-2.5 px-3 text-right font-mono font-medium">
                              {c.roi !== null ? (
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
