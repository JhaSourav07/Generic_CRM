import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, UserCheck } from 'lucide-react';

export const LeadsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Lead Management"
        description="Capture, triage, scoring, assignment, and qualification workflow workspace."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'CRM' },
          { label: 'Leads' }
        ]}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Create Lead
          </Button>
        }
      />

      <Card className="bg-vynexa-surface border-vynexa-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Lead Directory Layout</CardTitle>
            <CardDescription>Dense tabular view for sales representative triage.</CardDescription>
          </div>
          <Badge variant="slate">Phase 7 Roadmap</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>LEAD NAME</TableHead>
                <TableHead>COMPANY</TableHead>
                <TableHead>SOURCE</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead>ASSIGNED TO</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-vynexa-text-primary">
                  <div className="flex items-center gap-2">
                    <UserCheck className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>Structural Placeholder Record</span>
                  </div>
                </TableCell>
                <TableCell className="font-mono text-vynexa-text-secondary">Enterprise Lead Corp</TableCell>
                <TableCell className="text-vynexa-text-muted">Inbound Webform</TableCell>
                <TableCell>
                  <Badge variant="emerald">Qualified</Badge>
                </TableCell>
                <TableCell className="text-vynexa-text-secondary">Sales Representative</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Manage</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
