import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LayoutDashboard, Layers, ShieldCheck, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const DashboardPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Executive Overview"
        description="Vynexa CRM application shell and workspace dashboard foundation."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Overview' }
        ]}
        actions={
          <Badge variant="emerald" className="px-2.5 py-1 text-xs">
            System Shell Ready
          </Badge>
        }
      />

      {/* Structural Foundation Overview Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
        <Card className="bg-vynexa-surface border-vynexa-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-vynexa-text-muted">MODULE 01</span>
              <Layers className="h-4 w-4 text-vynexa-text-muted" />
            </div>
            <CardTitle className="mt-2">Lead Lifecycle Engine</CardTitle>
            <CardDescription>Qualified lead triage and conversion pipelines.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="pt-2">
              <Link to="/app/leads">
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Navigate to Leads Shell
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-vynexa-text-muted">MODULE 02</span>
              <LayoutDashboard className="h-4 w-4 text-vynexa-text-muted" />
            </div>
            <CardTitle className="mt-2">Sales Opportunity Pipeline</CardTitle>
            <CardDescription>Multi-stage deal tracking and probability viewports.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="pt-2">
              <Link to="/app/pipeline">
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Navigate to Pipeline Shell
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-vynexa-surface border-vynexa-border">
          <CardHeader>
            <div className="flex items-center justify-between">
              <span className="text-xs font-mono font-semibold text-vynexa-text-muted">MODULE 03</span>
              <ShieldCheck className="h-4 w-4 text-vynexa-text-muted" />
            </div>
            <CardTitle className="mt-2">Multi-Tenant Governance</CardTitle>
            <CardDescription>Organization boundary security and RBAC controls.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="pt-2">
              <Link to="/app/customers">
                <Button variant="outline" size="sm" className="w-full" rightIcon={<ArrowRight className="h-3.5 w-3.5" />}>
                  Navigate to Customers Shell
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Architectural Context Card */}
      <Card className="bg-vynexa-surface border-vynexa-border">
        <CardHeader>
          <CardTitle>Architecture Status — Phase 1</CardTitle>
          <CardDescription>
            The technical foundation and dark charcoal design system are fully configured. Live database models and business API integration will be introduced in subsequent roadmap phases.
          </CardDescription>
        </CardHeader>
      </Card>
    </div>
  );
};
