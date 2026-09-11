import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Contact } from 'lucide-react';

export const ContactsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <PageHeader
        title="Contact Directory"
        description="Individual person records associated with customer companies and deal workflows."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'CRM' },
          { label: 'Contacts' }
        ]}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            New Contact
          </Button>
        }
      />

      <Card className="bg-vynexa-surface border-vynexa-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Contacts Directory Layout</CardTitle>
            <CardDescription>Individual decision maker contact directory.</CardDescription>
          </div>
          <Badge variant="slate">Phase 8 Roadmap</Badge>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>FULL NAME</TableHead>
                <TableHead>JOB TITLE</TableHead>
                <TableHead>COMPANY</TableHead>
                <TableHead>EMAIL</TableHead>
                <TableHead className="text-right">ACTION</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell className="font-medium text-vynexa-text-primary">
                  <div className="flex items-center gap-2">
                    <Contact className="h-3.5 w-3.5 text-vynexa-text-muted" />
                    <span>Structural Contact Placeholder</span>
                  </div>
                </TableCell>
                <TableCell className="text-vynexa-text-secondary">VP of Engineering</TableCell>
                <TableCell className="font-mono text-vynexa-text-secondary">Acme Global Inc.</TableCell>
                <TableCell className="font-mono text-vynexa-text-muted">contact@acme.com</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm">Details</Button>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};
