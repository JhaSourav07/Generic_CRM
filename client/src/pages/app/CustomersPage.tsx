import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Building2 } from 'lucide-react';

export const CustomersPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers & Accounts"
        description="Organization accounts directory with financial, contract, and historical context."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'CRM' },
          { label: 'Customers' }
        ]}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            Add Account
          </Button>
        }
      />

      <Card className="bg-vynexa-surface border-vynexa-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Accounts Directory Layout</CardTitle>
            <CardDescription>High-density account tracking workspace.</CardDescription>
          </div>
          <Badge variant="slate">Phase 8 Roadmap</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>ACCOUNT NAME</TableHead>
                <TableHead>INDUSTRY</TableHead>
                <TableHead>TIER</TableHead>
                <TableHead>STATUS</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-vynexa-text-primary">
                  <div className="flex items-center gap-2">
                    <Building2 className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>Structural Account Placeholder</span>
                  </div>
                </TableCell>
                <TableCell className="text-vynexa-text-secondary">Enterprise Technology</TableCell>
                <TableCell className="font-mono text-vynexa-text-secondary">Enterprise Pro</TableCell>
                <TableCell>
                  <Badge variant="emerald">Active Account</Badge>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">View Context</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
