import React from 'react';
import { Badge } from '@/components/ui/badge';
import { BarChart2, TrendingUp, CheckCircle, Target } from 'lucide-react';

export const InsightsShowcase: React.FC = () => {
  const kpis = [
    { label: 'PIPELINE VALUE', value: '₹46.0L', change: '+14.2%', icon: TrendingUp, positive: true },
    { label: 'OPEN OPPORTUNITIES', value: '25 DEALS', change: '+5 new', icon: Target, positive: true },
    { label: 'COMMERCIAL WIN RATE', value: '68.4%', change: '+3.1%', icon: BarChart2, positive: true },
    { label: 'TASKS COMPLETED', value: '142', change: '98% SLA', icon: CheckCircle, positive: true }
  ];

  return (
    <section id="insights" className="py-20 px-4 sm:px-6 border-b border-vynexa-border bg-vynexa-surface/30">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">BUSINESS INTELLIGENCE &amp; REPORTING</h2>
          <p className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
            Real-time pipeline performance and team velocity
          </p>
          <p className="text-xs sm:text-sm text-vynexa-text-secondary">
            Gain executive oversight across lead conversion funnels, sales rep activity, and commercial revenue forecasts.
          </p>
        </div>

        {/* Compact KPI Rows */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {kpis.map((kpi, idx) => (
            <div key={idx} className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-vynexa-text-muted">{kpi.label}</span>
                <kpi.icon className="h-3.5 w-3.5 text-vynexa-text-muted" />
              </div>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-extrabold font-mono text-vynexa-text-primary tracking-tight">{kpi.value}</span>
                <Badge variant="emerald" className="text-[10px] font-mono">{kpi.change}</Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Believable Analytics Chart Simulation */}
        <div className="rounded-xl border border-vynexa-border bg-vynexa-surface p-6 shadow-elevated space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-vynexa-border pb-4">
            <div>
              <h3 className="text-sm font-semibold text-vynexa-text-primary tracking-tight">Monthly Commercial Conversion Funnel</h3>
              <p className="text-xs text-vynexa-text-muted">Lead qualification to closed order progression</p>
            </div>
            <div className="flex items-center gap-2 font-mono text-xs text-vynexa-text-secondary">
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-vynexa-text-primary" /> Target</span>
              <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-vynexa-text-muted" /> Achieved</span>
            </div>
          </div>

          {/* Simple SVG Bar / Trend Visualization */}
          <div className="h-48 w-full flex items-end justify-between gap-3 pt-4 px-2">
            {[
              { month: 'MAY', val: 45 },
              { month: 'JUN', val: 62 },
              { month: 'JUL', val: 55 },
              { month: 'AUG', val: 78 },
              { month: 'SEP', val: 92 },
              { month: 'OCT', val: 84 }
            ].map((bar, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-2 h-full justify-end">
                <span className="text-[10px] font-mono text-vynexa-text-muted">{bar.val}%</span>
                <div
                  className="w-full max-w-[48px] rounded-t bg-vynexa-surface-secondary border-t border-x border-vynexa-border transition-all hover:bg-vynexa-surface-elevated"
                  style={{ height: `${bar.val}%` }}
                />
                <span className="text-[10px] font-mono text-vynexa-text-secondary">{bar.month}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
