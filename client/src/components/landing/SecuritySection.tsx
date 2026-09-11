import React from 'react';
import { ShieldCheck, Lock, Database, FileText, CheckCircle2 } from 'lucide-react';

export const SecuritySection: React.FC = () => {
  return (
    <section className="py-20 px-4 sm:px-6 border-b border-vynexa-border">
      <div className="mx-auto max-w-7xl space-y-12">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
          {/* Left Text Description */}
          <div className="lg:col-span-6 space-y-4">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">BUILT FOR CONTROL &amp; SCALE</h2>
            <h3 className="text-2xl sm:text-3xl font-bold text-vynexa-text-primary tracking-tight">
              Multi-tenant architecture with strict boundary enforcement
            </h3>
            <p className="text-xs sm:text-sm text-vynexa-text-secondary leading-relaxed">
              Every query, action, and entity lookup is evaluated against validated server-side session contexts. Data cross-contamination between organizations is strictly prevented at the PostgreSQL relational layer.
            </p>

            <div className="pt-2 space-y-3">
              {[
                { title: 'Row-Level Multi-Tenancy Isolation', desc: 'Every organization-owned model contains explicit organizationId foreign key boundaries.' },
                { title: '7 System RBAC Roles', desc: 'Fine-grained permission actions (View, Create, Edit, Delete, Assign, Approve, Export).' },
                { title: 'Immutable Audit Logging', desc: 'Automatic tracking of who changed what, when, and exact before/after deltas.' },
                { title: 'Abstracted Object Storage', desc: 'Document metadata separated from actual binary files for S3 / cloud compatibility.' }
              ].map((item, idx) => (
                <div key={idx} className="flex items-start gap-3">
                  <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0 mt-0.5" />
                  <div>
                    <p className="text-xs font-semibold text-vynexa-text-primary">{item.title}</p>
                    <p className="text-[11px] text-vynexa-text-muted">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right Security Code Box Simulation */}
          <div className="lg:col-span-6">
            <div className="rounded-xl border border-vynexa-border bg-vynexa-surface p-5 shadow-elevated space-y-4 font-mono text-xs">
              <div className="flex items-center justify-between border-b border-vynexa-border pb-3">
                <div className="flex items-center gap-2">
                  <Lock className="h-4 w-4 text-vynexa-text-muted" />
                  <span className="font-bold text-vynexa-text-primary">SECURITY_ENFORCEMENT.ts</span>
                </div>
                <span className="text-[10px] bg-vynexa-surface-secondary text-vynexa-status-success border border-vynexa-border px-2 py-0.5 rounded">PASSED</span>
              </div>

              <div className="space-y-2 text-[11px] text-vynexa-text-secondary leading-relaxed bg-vynexa-bg p-4 rounded border border-vynexa-border">
                <p className="text-vynexa-text-muted">// 1. Context validation from session token</p>
                <p><span className="text-vynexa-text-muted">const</span> tenantId = req.user.organizationId;</p>
                <p className="pt-2 text-vynexa-text-muted">// 2. Row-level data isolation enforced</p>
                <p><span className="text-vynexa-text-muted">const</span> deals = <span className="text-vynexa-text-primary">await</span> prisma.opportunity.findMany(&#123;</p>
                <p className="pl-4">where: &#123; organizationId: tenantId &#125;</p>
                <p>&#125;);</p>
                <p className="pt-2 text-vynexa-text-muted">// 3. Audit trail record created</p>
                <p><span className="text-vynexa-text-muted">await</span> auditLog.create(&#123; action: <span className="text-vynexa-text-primary">'OPPORTUNITY_UPDATE'</span> &#125;);</p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 text-[11px]">
                <div className="p-2.5 rounded border border-vynexa-border bg-vynexa-surface-secondary flex items-center gap-2">
                  <Database className="h-3.5 w-3.5 text-vynexa-text-muted" />
                  <span>PostgreSQL ORM</span>
                </div>
                <div className="p-2.5 rounded border border-vynexa-border bg-vynexa-surface-secondary flex items-center gap-2">
                  <FileText className="h-3.5 w-3.5 text-vynexa-text-muted" />
                  <span>Immutable Audits</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
