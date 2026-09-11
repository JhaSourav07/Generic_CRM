import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  ArrowRight,
  ShieldCheck,
  Zap,
  TrendingUp,
  BarChart2,
  Users,
  CheckCircle2,
  Lock,
  Layers,
  Globe
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-vynexa-bg text-vynexa-text-primary selection:bg-vynexa-border">
      {/* Public Header */}
      <header className="sticky top-0 z-50 border-b border-vynexa-border bg-vynexa-bg/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-md bg-vynexa-text-primary text-vynexa-bg flex items-center justify-center font-bold text-sm shadow-subtle">
              V
            </div>
            <div className="flex flex-col select-none">
              <span className="text-sm font-bold tracking-widest text-vynexa-text-primary leading-tight font-mono">
                VYNEXA
              </span>
              <span className="text-[9px] text-vynexa-text-muted font-medium tracking-widest font-mono">
                ENTERPRISE SaaS CRM
              </span>
            </div>
          </div>

          <nav className="hidden md:flex items-center gap-8 text-xs font-medium text-vynexa-text-secondary">
            <a href="#capabilities" className="hover:text-vynexa-text-primary transition-colors">Capabilities</a>
            <a href="#workflows" className="hover:text-vynexa-text-primary transition-colors">Workflows</a>
            <a href="#analytics" className="hover:text-vynexa-text-primary transition-colors">Analytics</a>
            <a href="#security" className="hover:text-vynexa-text-primary transition-colors">Security</a>
          </nav>

          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm">Sign In</Button>
            </Link>
            <Link to="/signup">
              <Button variant="primary" size="sm" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-24 pb-20 px-6 border-b border-vynexa-border/60">
        <div className="mx-auto max-w-4xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-vynexa-border bg-vynexa-surface-secondary text-[11px] font-mono text-vynexa-text-secondary select-none">
            <span className="h-1.5 w-1.5 rounded-full bg-vynexa-status-success animate-pulse" />
            <span>Commercial Enterprise SaaS v1.0</span>
          </div>

          <h1 className="text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight text-vynexa-text-primary leading-[1.15]">
            Customer relationships, <br />
            <span className="text-vynexa-text-secondary">intelligently organized.</span>
          </h1>

          <p className="mx-auto max-w-2xl text-sm sm:text-base text-vynexa-text-secondary font-normal leading-relaxed">
            Engineered for high-performing sales teams and modern enterprises. Vynexa CRM unites lead conversion, deal pipelines, commercial quotes, and multi-tenant security into a single high-density workspace.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
            <Link to="/signup" className="w-full sm:w-auto">
              <Button variant="primary" size="lg" className="w-full sm:w-auto" rightIcon={<ArrowRight className="h-4 w-4" />}>
                Start Free Workspace
              </Button>
            </Link>
            <Link to="/app/dashboard" className="w-full sm:w-auto">
              <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                Explore Demo Shell
              </Button>
            </Link>
          </div>

          {/* Key Assurance Badges */}
          <div className="pt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto text-left">
            {[
              { icon: ShieldCheck, title: 'Multi-Tenant Isolation', desc: 'Strict organization boundary security' },
              { icon: Zap, title: 'High Density UI', desc: 'Fast scanning Linear/Stripe aesthetic' },
              { icon: TrendingUp, title: 'Commercial Engine', desc: 'Lead to quote to order transitions' },
              { icon: Lock, title: 'Enterprise RBAC', desc: 'Fine-grained action permission control' }
            ].map((item, idx) => (
              <div key={idx} className="p-3 rounded-lg border border-vynexa-border bg-vynexa-surface">
                <item.icon className="h-4 w-4 text-vynexa-text-primary mb-2" />
                <p className="text-xs font-semibold text-vynexa-text-primary">{item.title}</p>
                <p className="text-[11px] text-vynexa-text-muted mt-0.5">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Product Showcase Section */}
      <section className="py-20 px-6 border-b border-vynexa-border">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto mb-12 space-y-2">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">SYSTEM ARCHITECTURE</h2>
            <p className="text-2xl font-bold text-vynexa-text-primary tracking-tight">Built for power users who spend hours in the CRM daily.</p>
          </div>

          <div className="rounded-xl border border-vynexa-border bg-vynexa-surface p-2 shadow-elevated">
            <div className="rounded-lg border border-vynexa-border/60 bg-vynexa-bg p-4 md:p-6 space-y-6">
              {/* Header simulation */}
              <div className="flex items-center justify-between border-b border-vynexa-border pb-4">
                <div className="flex items-center gap-3">
                  <div className="h-3 w-3 rounded-full bg-vynexa-border" />
                  <div className="h-3 w-3 rounded-full bg-vynexa-border" />
                  <div className="h-3 w-3 rounded-full bg-vynexa-border" />
                  <span className="text-xs font-mono text-vynexa-text-muted ml-2">app.vynexa.com/app/pipeline</span>
                </div>
                <span className="text-[11px] font-mono text-vynexa-text-muted">ORGANIZATION: ACME CORP</span>
              </div>

              {/* Grid content simulation */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {[
                  { stage: 'QUALIFICATION', count: 12, value: '$184,000' },
                  { stage: 'VALUE PROPOSAL', count: 8, value: '$310,500' },
                  { stage: 'NEGOTIATION', count: 5, value: '$520,000' }
                ].map((col, idx) => (
                  <div key={idx} className="rounded-md border border-vynexa-border bg-vynexa-surface-secondary p-4 space-y-3">
                    <div className="flex items-center justify-between border-b border-vynexa-border/60 pb-2">
                      <span className="text-xs font-mono font-semibold text-vynexa-text-primary">{col.stage}</span>
                      <span className="text-[10px] font-mono bg-vynexa-surface px-1.5 py-0.5 rounded text-vynexa-text-muted">{col.count} DEALS</span>
                    </div>
                    <div className="p-3 rounded border border-vynexa-border bg-vynexa-surface space-y-2">
                      <p className="text-xs font-semibold text-vynexa-text-primary">Enterprise License Renewal</p>
                      <p className="text-[11px] font-mono text-vynexa-text-secondary">{col.value}</p>
                      <div className="flex items-center justify-between pt-1">
                        <span className="text-[10px] text-vynexa-text-muted">Acme Global Inc.</span>
                        <span className="text-[10px] font-mono text-vynexa-status-success">85% prob</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Capabilities Section */}
      <section id="capabilities" className="py-20 px-6 border-b border-vynexa-border bg-vynexa-surface/30">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12">
            <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">CAPABILITIES</h2>
            <p className="text-2xl font-bold text-vynexa-text-primary tracking-tight mt-1">Complete commercial operations footprint.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: Users,
                title: 'Lead Management & Triage',
                desc: 'Qualify, score, and assign incoming inquiries. Seamlessly convert qualified leads into Customer Accounts, Contacts, and initial Opportunities in a single atomic transaction.'
              },
              {
                icon: Layers,
                title: 'Visual Deal Pipelines',
                desc: 'Multi-stage Kanban and dense tabular deal management. Track probability, deal value, expected close dates, and stage transitions with audit log recording.'
              },
              {
                icon: BarChart2,
                title: 'Commercial Engine',
                desc: 'Generate precise price quotes from product catalog line items. Implement approval workflows and convert approved quotes straight into commercial orders.'
              }
            ].map((cap, idx) => (
              <Card key={idx} className="bg-vynexa-surface border-vynexa-border">
                <CardContent className="p-6 space-y-3">
                  <div className="h-9 w-9 rounded-md border border-vynexa-border bg-vynexa-surface-secondary flex items-center justify-center">
                    <cap.icon className="h-4 w-4 text-vynexa-text-primary" />
                  </div>
                  <h3 className="text-base font-semibold text-vynexa-text-primary">{cap.title}</h3>
                  <p className="text-xs text-vynexa-text-secondary leading-relaxed">{cap.desc}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section id="security" className="py-20 px-6 border-b border-vynexa-border">
        <div className="mx-auto max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
            <div className="space-y-4">
              <h2 className="text-xs font-mono font-semibold tracking-wider text-vynexa-text-muted uppercase">ENTERPRISE SECURITY</h2>
              <h3 className="text-3xl font-bold text-vynexa-text-primary tracking-tight">Multi-tenant data isolation, enforced server-side.</h3>
              <p className="text-xs sm:text-sm text-vynexa-text-secondary leading-relaxed">
                Vynexa CRM guarantees that organization boundaries are strictly respected at every database lookup. All requests are authenticated, authorized, and logged for total operational transparency.
              </p>
              <ul className="space-y-2 text-xs text-vynexa-text-secondary font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />
                  <span>Strict PostgreSQL row-level organization isolation</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />
                  <span>7 distinct RBAC system roles with action permission checks</span>
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-vynexa-status-success shrink-0" />
                  <span>Immutable audit logging for critical commercial transitions</span>
                </li>
              </ul>
            </div>
            <div className="rounded-lg border border-vynexa-border bg-vynexa-surface p-6 font-mono text-xs space-y-3">
              <div className="flex items-center justify-between border-b border-vynexa-border pb-3">
                <span className="text-vynexa-text-muted">// SERVER-SIDE RBAC ENFORCEMENT</span>
                <span className="text-vynexa-status-success font-semibold">ENFORCED</span>
              </div>
              <div className="text-vynexa-text-secondary space-y-1 text-[11px]">
                <p><span className="text-vynexa-text-muted">WHERE</span> organization_id = req.user.organizationId</p>
                <p><span className="text-vynexa-text-muted">AND</span> permission = <span className="text-vynexa-text-primary">'opportunity:approve'</span></p>
                <p className="pt-2 text-vynexa-text-muted">// Response envelope guaranteed</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-vynexa-border bg-vynexa-bg text-xs text-vynexa-text-muted">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 font-mono">
            <span className="font-bold text-vynexa-text-primary">VYNEXA CRM</span>
            <span>— Commercial Enterprise SaaS</span>
          </div>
          <p className="text-[11px]">© {new Date().getFullYear()} Vynexa Inc. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};
