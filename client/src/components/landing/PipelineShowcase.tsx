import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Kanban, TrendingUp, CheckCircle2, DollarSign, Calendar, Shield } from 'lucide-react';

export const PipelineShowcase: React.FC = () => {
  const stages = [
    {
      name: 'Qualified',
      count: '12 DEALS',
      total: '₹8.4L',
      badgeVariant: 'slate' as const,
      sampleDeal: { company: 'Horizon Tech', value: '₹1.8L', prob: '25%', owner: 'Dave M.' }
    },
    {
      name: 'Proposal',
      count: '8 DEALS',
      total: '₹12.6L',
      badgeVariant: 'blue' as const,
      sampleDeal: { company: 'Acme Industries', value: '₹2.4L', prob: '50%', owner: 'Sarah C.' }
    },
    {
      name: 'Negotiation',
      count: '5 DEALS',
      total: '₹9.8L',
      badgeVariant: 'amber' as const,
      sampleDeal: { company: 'Northstar Systems', value: '₹4.8L', prob: '75%', owner: 'Dave M.' }
    },
    {
      name: 'Won',
      count: '7 DEALS',
      total: '₹15.2L',
      badgeVariant: 'emerald' as const,
      sampleDeal: { company: 'Apex Cloud Solutions', value: '₹6.2L', prob: '100%', owner: 'Alex V.' }
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 border-b border-vynexa-border bg-vynexa-surface/20">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl space-y-2">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">SALES PIPELINE</h2>
            <p className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
              See where every potential sale stands
            </p>
            <p className="text-xs sm:text-sm text-vynexa-text-secondary">
              See how deals move from first conversation to closed sale, with clear values, chances of winning, and next steps.
            </p>
          </div>

          <div className="flex items-center gap-3 font-mono text-xs text-vynexa-text-secondary">
            <div className="px-3 py-1.5 rounded border border-vynexa-border bg-vynexa-surface flex items-center gap-2">
              <TrendingUp className="h-3.5 w-3.5 text-vynexa-status-success" />
              <span>TOTAL PIPELINE: ₹46.0L</span>
            </div>
          </div>
        </div>

        {/* Realistic Pipeline Stage Columns Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {stages.map((stage, idx) => (
            <div key={idx} className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4 flex flex-col justify-between space-y-4">
              {/* Column Header */}
              <div className="space-y-1 pb-3 border-b border-vynexa-border">
                <div className="flex items-center justify-between">
                  <h4 className="text-sm font-semibold text-vynexa-text-primary tracking-tight">{stage.name}</h4>
                  <Badge variant={stage.badgeVariant} className="text-[10px] font-mono">{stage.count}</Badge>
                </div>
                <p className="text-xs font-bold font-mono text-vynexa-text-primary">{stage.total}</p>
              </div>

              {/* Sample Deal Card */}
              <div className="rounded border border-vynexa-border/70 bg-vynexa-surface-secondary p-3 space-y-2 text-xs">
                <div className="flex items-start justify-between">
                  <span className="font-semibold text-vynexa-text-primary truncate">{stage.sampleDeal.company}</span>
                  <span className="text-[10px] font-mono text-vynexa-text-muted">{stage.sampleDeal.prob}</span>
                </div>
                <div className="flex items-center justify-between text-xs font-mono font-bold text-vynexa-text-primary">
                  <span>{stage.sampleDeal.value}</span>
                </div>
                <div className="pt-2 border-t border-vynexa-border/40 flex items-center justify-between text-[10px] font-mono text-vynexa-text-muted">
                  <span>Owner: {stage.sampleDeal.owner}</span>
                </div>
              </div>

              {/* Capability bullet */}
              <div className="pt-2 border-t border-vynexa-border/30 text-[11px] text-vynexa-text-muted flex items-center gap-1.5 font-mono">
                <CheckCircle2 className="h-3 w-3 text-vynexa-text-secondary shrink-0" />
                <span>Stage changes saved automatically</span>
              </div>
            </div>
          ))}
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded border border-vynexa-border bg-vynexa-surface flex items-start gap-3">
            <DollarSign className="h-4 w-4 text-vynexa-text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-vynexa-text-primary">Accurate Price Records</p>
              <p className="text-vynexa-text-muted text-[11px] mt-0.5">Quotes lock prices at the time they are created, so past orders stay accurate.</p>
            </div>
          </div>

          <div className="p-4 rounded border border-vynexa-border bg-vynexa-surface flex items-start gap-3">
            <Calendar className="h-4 w-4 text-vynexa-text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-vynexa-text-primary">Target Close Dates</p>
              <p className="text-vynexa-text-muted text-[11px] mt-0.5">Know when sales are expected to finish and receive follow-up reminders on time.</p>
            </div>
          </div>

          <div className="p-4 rounded border border-vynexa-border bg-vynexa-surface flex items-start gap-3">
            <Shield className="h-4 w-4 text-vynexa-text-primary shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-vynexa-text-primary">Quote Approvals</p>
              <p className="text-vynexa-text-muted text-[11px] mt-0.5">Managers can review and approve quotes before customer orders are created.</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
