import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Phone, Calendar, Mail, FileText, CheckCircle2, Clock } from 'lucide-react';

export const TeamWorkspace: React.FC = () => {
  const schedule = [
    {
      time: '09:30',
      type: 'CALL',
      icon: Phone,
      title: 'Call — Acme Industries',
      desc: 'Discuss Q3 enterprise license renewal requirements with VP Tech.',
      status: 'COMPLETED',
      statusVariant: 'emerald' as const
    },
    {
      time: '11:00',
      type: 'FOLLOW_UP',
      icon: Clock,
      title: 'Follow-up — Northstar Systems',
      desc: 'Review SLA terms and customized implementation timeline.',
      status: 'IN_PROGRESS',
      statusVariant: 'amber' as const
    },
    {
      time: '13:30',
      type: 'MEETING',
      icon: Calendar,
      title: 'Meeting — Vertex Labs',
      desc: 'Product demonstration & custom API workflow discussion.',
      status: 'SCHEDULED',
      statusVariant: 'blue' as const
    },
    {
      time: '15:00',
      type: 'PROPOSAL',
      icon: FileText,
      title: 'Send proposal — Orion Technologies',
      desc: 'Deliver formal commercial quote #QT-2026-042 for approval.',
      status: 'PENDING',
      statusVariant: 'slate' as const
    }
  ];

  return (
    <section className="py-20 px-4 sm:px-6 border-b border-vynexa-border">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Text Description Column */}
          <div className="lg:col-span-5 space-y-4">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">TEAM SCHEDULE &amp; TASKS</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
              Give your team one simple place to work
            </h3>
            <p className="text-xs sm:text-sm text-vynexa-text-secondary leading-relaxed">
              Never let a customer or follow-up slip through. Keep your daily schedule, assigned tasks, call notes, and meeting follow-ups in one clear view.
            </p>
            <div className="pt-2 space-y-2 text-xs text-vynexa-text-secondary font-medium">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />
                <span>Call notes and meetings attached directly to customers</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />
                <span>Clear task assignments with due date reminders</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />
                <span>History of every change and interaction saved automatically</span>
              </div>
            </div>
          </div>

          {/* Agenda UI Simulation Column */}
          <div className="lg:col-span-7">
            <div className="rounded-xl border border-vynexa-border bg-vynexa-surface p-5 shadow-elevated space-y-4">
              <div className="flex items-center justify-between border-b border-vynexa-border pb-3">
                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="font-bold text-vynexa-text-primary">TODAY'S SCHEDULE</span>
                  <span className="text-vynexa-text-muted">— 24 September 2026</span>
                </div>
                <Badge variant="slate" className="font-mono text-[10px]">4 ITEMS TODAY</Badge>
              </div>

              <div className="space-y-3">
                {schedule.map((item, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 p-3 rounded border border-vynexa-border/60 bg-vynexa-surface-secondary/70 hover:border-vynexa-border transition-colors"
                  >
                    <div className="font-mono text-xs font-bold text-vynexa-text-primary shrink-0 w-12 pt-0.5">
                      {item.time}
                    </div>
                    <div className="h-7 w-7 rounded border border-vynexa-border bg-vynexa-surface flex items-center justify-center text-vynexa-text-primary shrink-0">
                      <item.icon className="h-3.5 w-3.5" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-0.5">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-xs font-semibold text-vynexa-text-primary truncate">{item.title}</p>
                        <Badge variant={item.statusVariant} className="text-[9px] font-mono shrink-0">{item.status}</Badge>
                      </div>
                      <p className="text-[11px] text-vynexa-text-muted truncate">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
