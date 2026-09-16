import React from 'react';
import { ArrowRight } from 'lucide-react';

export const CustomerLifecycle: React.FC = () => {
  const steps = [
    { num: '01', title: 'Lead', desc: 'Capture new interest' },
    { num: '02', title: 'Qualify', desc: 'Check if they are a fit' },
    { num: '03', title: 'Potential Sale', desc: 'Track deals in progress' },
    { num: '04', title: 'Quote', desc: 'Send clear price quotes' },
    { num: '05', title: 'Order', desc: 'Confirm the sale' },
    { num: '06', title: 'Support', desc: 'Answer customer questions' },
    { num: '07', title: 'Follow-up', desc: 'Keep customers happy' }
  ];

  return (
    <section id="workflow" className="py-20 px-4 sm:px-6 border-b border-vynexa-border">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">HOW IT WORKS</h2>
          <p className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
            See every sale from first contact to order
          </p>
          <p className="text-xs sm:text-sm text-vynexa-text-secondary">
            Keep notes, tasks, quotes, and conversations together so your team never misses a detail.
          </p>
        </div>

        {/* 7-Step Connected Sequence Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3 relative">
          {steps.map((step, idx) => (
            <div
              key={idx}
              className="rounded-lg border border-vynexa-border bg-vynexa-surface p-4 flex flex-col justify-between space-y-4 relative group hover:border-vynexa-text-muted transition-colors"
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-mono font-extrabold text-vynexa-text-primary">{step.num}</span>
                {idx < steps.length - 1 && (
                  <ArrowRight className="h-3.5 w-3.5 text-vynexa-text-muted hidden lg:block" />
                )}
              </div>

              <div className="space-y-1">
                <h4 className="text-xs font-bold text-vynexa-text-primary tracking-tight">{step.title}</h4>
                <p className="text-[11px] text-vynexa-text-muted leading-tight">{step.desc}</p>
              </div>

              <div className="h-0.5 w-full bg-vynexa-border rounded-full group-hover:bg-vynexa-text-secondary transition-colors" />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};
