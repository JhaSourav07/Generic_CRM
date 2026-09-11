import React from 'react';
import { Users, Building2, TrendingUp, Calendar, LifeBuoy, BarChart2 } from 'lucide-react';

export const CRMCapabilities: React.FC = () => {
  const capabilities = [
    {
      icon: Users,
      tag: 'LEADS',
      title: 'Lead Management & Conversion',
      desc: 'Capture, score, triage, and assign incoming inquiries. Convert qualified leads into Customer Accounts, Contacts, and Opportunities in a single atomic transaction.'
    },
    {
      icon: Building2,
      tag: 'CUSTOMERS',
      title: 'Accounts & Contact History',
      desc: 'Maintain complete organization records with historical interaction history, primary decision maker contacts, and associated commercial agreements.'
    },
    {
      icon: TrendingUp,
      tag: 'SALES',
      title: 'Pipelines, Quotes & Orders',
      desc: 'Track deals through multi-stage Kanban pipelines. Generate formal price proposals from product line items and generate commercial orders.'
    },
    {
      icon: Calendar,
      tag: 'ACTIVITIES',
      title: 'Interactions & Tasks',
      desc: 'Log calls, meetings, notes, emails, and follow-ups. Assign actionable tasks to team members with due dates and completion tracking.'
    },
    {
      icon: LifeBuoy,
      tag: 'SUPPORT',
      title: 'Customer Case Hub',
      desc: 'Manage customer support requests, SLA resolution timelines, priority escalation, and historical resolution logs.'
    },
    {
      icon: BarChart2,
      tag: 'INSIGHTS',
      title: 'Business Analytics & Reports',
      desc: 'Gain operational visibility into pipeline velocity, team activity metrics, conversion funnels, and revenue projections.'
    }
  ];

  return (
    <section id="solutions" className="py-20 px-4 sm:px-6 border-b border-vynexa-border bg-vynexa-surface/30">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">SYSTEM CAPABILITIES</h2>
          <p className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
            One unified CRM that connects every operational domain.
          </p>
          <p className="text-xs sm:text-sm text-vynexa-text-secondary leading-relaxed">
            Eliminate fragmented tools. Vynexa CRM brings lead ingestion, deal movement, quote generation, and support SLA management into a single high-density system.
          </p>
        </div>

        {/* Structured Editorial 6-Grid Layout */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-vynexa-border bg-vynexa-surface p-6 space-y-4 transition-colors hover:border-vynexa-border/80"
            >
              <div className="flex items-center justify-between">
                <div className="h-9 w-9 rounded-md border border-vynexa-border bg-vynexa-surface-secondary flex items-center justify-center text-vynexa-text-primary">
                  <cap.icon className="h-4 w-4" />
                </div>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded border border-vynexa-border bg-vynexa-surface-secondary text-vynexa-text-muted">
                  {cap.tag}
                </span>
              </div>

              <div className="space-y-1.5">
                <h3 className="text-base font-semibold text-vynexa-text-primary tracking-tight">{cap.title}</h3>
                <p className="text-xs text-vynexa-text-secondary leading-relaxed">{cap.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
