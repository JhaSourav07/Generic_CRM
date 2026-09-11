import React from 'react';
import { Link } from 'react-router-dom';

export const Footer: React.FC = () => {
  return (
    <footer className="py-12 px-4 sm:px-6 border-t border-vynexa-border bg-vynexa-bg text-xs text-vynexa-text-muted">
      <div className="mx-auto max-w-7xl space-y-10">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8">
          {/* Brand Column */}
          <div className="col-span-2 space-y-3">
            <div className="flex items-center gap-2 font-mono">
              <div className="h-6 w-6 rounded bg-vynexa-text-primary text-vynexa-bg flex items-center justify-center font-bold text-xs">
                V
              </div>
              <span className="font-bold text-sm tracking-wider text-vynexa-text-primary">VYNEXA CRM</span>
            </div>
            <p className="text-xs text-vynexa-text-secondary max-w-sm leading-relaxed">
              Unified commercial SaaS Customer Relationship Management platform. Designed for high-density sales operations, pipelines, and customer support.
            </p>
          </div>

          {/* Product Column */}
          <div className="space-y-2.5">
            <p className="font-mono font-semibold text-xs text-vynexa-text-primary">PRODUCT</p>
            <ul className="space-y-1.5 text-vynexa-text-secondary font-medium">
              <li><a href="#product" className="hover:text-vynexa-text-primary transition-colors">Pipeline Viewport</a></li>
              <li><a href="#solutions" className="hover:text-vynexa-text-primary transition-colors">Capabilities</a></li>
              <li><a href="#workflow" className="hover:text-vynexa-text-primary transition-colors">Customer Lifecycle</a></li>
              <li><a href="#insights" className="hover:text-vynexa-text-primary transition-colors">Analytics Reports</a></li>
            </ul>
          </div>

          {/* Solutions Column */}
          <div className="space-y-2.5">
            <p className="font-mono font-semibold text-xs text-vynexa-text-primary">SOLUTIONS</p>
            <ul className="space-y-1.5 text-vynexa-text-secondary font-medium">
              <li><Link to="/app/leads" className="hover:text-vynexa-text-primary transition-colors">Lead Triage</Link></li>
              <li><Link to="/app/pipeline" className="hover:text-vynexa-text-primary transition-colors">Deal Kanban</Link></li>
              <li><Link to="/app/customers" className="hover:text-vynexa-text-primary transition-colors">Account History</Link></li>
              <li><Link to="/app/dashboard" className="hover:text-vynexa-text-primary transition-colors">App Shell</Link></li>
            </ul>
          </div>

          {/* Account Column */}
          <div className="space-y-2.5">
            <p className="font-mono font-semibold text-xs text-vynexa-text-primary">ACCOUNT</p>
            <ul className="space-y-1.5 text-vynexa-text-secondary font-medium">
              <li><Link to="/login" className="hover:text-vynexa-text-primary transition-colors">Sign In</Link></li>
              <li><Link to="/signup" className="hover:text-vynexa-text-primary transition-colors">Create Account</Link></li>
              <li><Link to="/app/dashboard" className="hover:text-vynexa-text-primary transition-colors">Workspace Overview</Link></li>
            </ul>
          </div>
        </div>

        {/* Copyright Bar */}
        <div className="pt-8 border-t border-vynexa-border flex flex-col sm:flex-row items-center justify-between gap-4 font-mono text-[11px]">
          <span>© 2026 Vynexa Inc. All rights reserved.</span>
          <span className="text-vynexa-text-muted">Built for Enterprise Multi-Tenancy &amp; Scale</span>
        </div>
      </div>
    </footer>
  );
};
