import React from 'react';
import { Users, Building2, TrendingUp, Calendar, LifeBuoy, BarChart2 } from 'lucide-react';

export const CRMCapabilities: React.FC = () => {
  const capabilities = [
    {
      icon: Users,
      tag: 'LEADS',
      title: 'Leads & Conversion',
      desc: 'Collect new inquiries, see who is a good fit, and turn leads into customers with one click.'
    },
    {
      icon: Building2,
      tag: 'CUSTOMERS',
      title: 'Customers & Contacts',
      desc: 'Keep all your customer details, key contacts, purchase history, and past conversations in one place.'
    },
    {
      icon: TrendingUp,
      tag: 'SALES',
      title: 'Pipeline, Quotes & Orders',
      desc: 'See every deal in progress, send clear price quotes, and turn approved quotes into customer orders.'
    },
    {
      icon: Calendar,
      tag: 'ACTIVITIES',
      title: 'Activities & Tasks',
      desc: 'Keep track of calls, meetings, emails, and notes. Assign tasks to teammates with clear due dates.'
    },
    {
      icon: LifeBuoy,
      tag: 'SUPPORT',
      title: 'Customer Support',
      desc: 'Track and resolve customer requests quickly so nothing slips through the cracks.'
    },
    {
      icon: BarChart2,
      tag: 'REPORTS',
      title: 'Reports & Numbers',
      desc: 'See how your sales are moving, which marketing brings leads, and how your team is performing.'
    }
  ];

  return (
    <section id="solutions" className="py-20 px-4 sm:px-6 border-b border-vynexa-border bg-vynexa-surface/30">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="max-w-3xl space-y-3">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">WHAT VYNEXA DOES</h2>
          <p className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
            Everything your business needs in one place.
          </p>
          <p className="text-xs sm:text-sm text-vynexa-text-secondary leading-relaxed">
            Replace messy spreadsheets and disconnected apps. Keep your sales, customers, quotes, tasks, and support organized together.
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
