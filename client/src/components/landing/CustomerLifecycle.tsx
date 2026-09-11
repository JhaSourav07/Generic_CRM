import React from 'react';
import { ArrowRight } from 'lucide-react';

export const CustomerLifecycle: React.FC = () => {
  const steps = [
    { num: '01', title: 'Lead', desc: 'Inbound capture & scoring' },
    { num: '02', title: 'Qualification', desc: 'Triage & account conversion' },
    { num: '03', title: 'Opportunity', desc: 'Pipeline deal tracking' },
    { num: '04', title: 'Quote', desc: 'Product line proposal' },
    { num: '05', title: 'Order', desc: 'Commercial agreement' },
    { num: '06', title: 'Support', desc: 'Service case resolution' },
    { num: '07', title: 'Retention', desc: 'Account renewal & growth' }
  ];

  return (
    <section id="workflow" className="py-20 px-4 sm:px-6 border-b border-vynexa-border">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-2">
          <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">CONNECTED LIFECYCLE</h2>
          <p className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
            From first inquiry to long-term account retention
          </p>
          <p className="text-xs sm:text-sm text-vynexa-text-secondary">
            Vynexa connects every transition so context is never lost when a lead becomes an active account.
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
