import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Kanban, Building2, ChevronRight, Filter, Search } from 'lucide-react';

export const ProductPreview: React.FC = () => {
  const deals = [
    {
      company: 'Northstar Systems',
      amount: '₹4.8L',
      stage: 'Negotiation',
      probability: '75%',
      owner: 'Dave Miller',
      date: '24 Sep 2026',
      statusVariant: 'amber' as const
    },
    {
      company: 'Acme Industries',
      amount: '₹2.4L',
      stage: 'Proposal',
      probability: '50%',
      owner: 'Sarah Connor',
      date: '28 Sep 2026',
      statusVariant: 'blue' as const
    },
    {
      company: 'Vertex Labs',
      amount: '₹1.2L',
      stage: 'Qualified',
      probability: '25%',
      owner: 'Dave Miller',
      date: '02 Oct 2026',
      statusVariant: 'slate' as const
    }
  ];

  return (
    <section id="product" className="py-16 px-4 sm:px-6 border-b border-vynexa-border">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">PRODUCT VIEWPORT</h2>
          <p className="text-2xl font-bold text-vynexa-text-primary tracking-tight">High-density workspace for sales operations</p>
        </div>

        {/* Application Frame Simulation */}
        <div className="rounded-xl border border-vynexa-border bg-vynexa-surface shadow-elevated overflow-hidden">
          {/* Top Frame Header Bar */}
          <div className="flex items-center justify-between border-b border-vynexa-border bg-vynexa-surface-secondary px-4 py-3 text-xs font-mono select-none">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-vynexa-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-vynexa-border" />
              <span className="h-2.5 w-2.5 rounded-full bg-vynexa-border" />
              <span className="text-vynexa-text-muted ml-3 hidden sm:inline">vynexa.app / pipeline / active-deals</span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-[11px] text-vynexa-text-muted">ORGANIZATION: ACME CORP</span>
              <span className="bg-vynexa-surface px-2 py-0.5 rounded text-[10px] text-vynexa-text-secondary border border-vynexa-border">PRO TENANT</span>
            </div>
          </div>

          {/* CRM App Workspace Body */}
          <div className="p-4 sm:p-6 bg-vynexa-bg space-y-6">
            {/* View Toolbar */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-vynexa-border">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 font-semibold text-sm text-vynexa-text-primary">
                  <Kanban className="h-4 w-4 text-vynexa-text-muted" />
                  <span>Commercial Sales Pipeline</span>
                </div>
                <Badge variant="emerald" className="font-mono">Q3 FY26</Badge>
              </div>

              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-vynexa-text-muted" />
                  <input
                    type="text"
                    readOnly
                    placeholder="Filter deals..."
                    className="h-8 pl-8 pr-3 w-40 sm:w-48 rounded border border-vynexa-border bg-vynexa-surface text-xs text-vynexa-text-primary pointer-events-none"
                  />
                </div>
                <div className="h-8 px-2.5 rounded border border-vynexa-border bg-vynexa-surface flex items-center gap-1.5 text-xs text-vynexa-text-secondary select-none">
                  <Filter className="h-3.5 w-3.5 text-vynexa-text-muted" />
                  <span>Filter</span>
                </div>
              </div>
            </div>

            {/* Pipeline Stage Column Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {deals.map((deal, idx) => (
                <div key={idx} className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4 space-y-3 shadow-subtle">
                  <div className="flex items-center justify-between border-b border-vynexa-border/60 pb-2.5">
                    <span className="text-xs font-mono font-semibold text-vynexa-text-primary">{deal.stage.toUpperCase()}</span>
                    <Badge variant={deal.statusVariant} className="text-[10px] font-mono">{deal.probability} PROB</Badge>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-vynexa-text-muted shrink-0" />
                        <h4 className="text-sm font-semibold text-vynexa-text-primary tracking-tight">{deal.company}</h4>
                      </div>
                    </div>

                    <div className="flex items-baseline justify-between pt-1">
                      <span className="text-xs text-vynexa-text-secondary">Expected Value</span>
                      <span className="text-sm font-bold font-mono text-vynexa-text-primary">{deal.amount}</span>
                    </div>

                    <div className="pt-2 border-t border-vynexa-border/40 flex items-center justify-between text-[11px] text-vynexa-text-muted font-mono">
                      <span>Owner: {deal.owner}</span>
                      <span>Close: {deal.date}</span>
                    </div>
                  </div>

                  <button className="w-full mt-1 pt-2 flex items-center justify-center gap-1 text-[11px] font-medium text-vynexa-text-secondary hover:text-vynexa-text-primary transition-colors border-t border-vynexa-border/30">
                    <span>Inspect Commercial Details</span>
                    <ChevronRight className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>

            {/* Micro Metadata Summary Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-between p-3 rounded border border-vynexa-border bg-vynexa-surface-secondary text-xs text-vynexa-text-secondary font-mono">
              <span>ACTIVE WORKSPACE PIPELINE: ₹8.4L</span>
              <span className="text-vynexa-text-muted mt-1 sm:mt-0">3 Qualified Deals — All tenant boundaries validated</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
