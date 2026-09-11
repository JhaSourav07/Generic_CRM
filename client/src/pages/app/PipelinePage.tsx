import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Kanban } from 'lucide-react';

export const PipelinePage: React.FC = () => {
  const stages = [
    'QUALIFICATION',
    'VALUE PROPOSAL',
    'NEGOTIATION',
    'CLOSED WON',
    'CLOSED LOST'
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Sales Pipeline"
        description="Visual Kanban deal progression and probability workspace."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Sales' },
          { label: 'Pipeline' }
        ]}
        actions={
          <Button variant="primary" size="sm" leftIcon={<Plus className="h-3.5 w-3.5" />}>
            New Opportunity
          </Button>
        }
      />

      {/* Kanban Stage Board Structure Placeholder */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        {stages.map((stage, idx) => (
          <Card key={idx} className="bg-vynexa-surface border-vynexa-border flex flex-col h-[480px]">
            <CardHeader className="p-3 border-b border-vynexa-border shrink-0">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-mono font-bold tracking-tight text-vynexa-text-primary">{stage}</span>
                <Badge variant="slate" className="text-[10px] font-mono px-1.5 py-0">0</Badge>
              </div>
            </CardHeader>
            <CardContent className="p-3 flex-1 overflow-y-auto space-y-3">
              <div className="rounded border border-vynexa-border/60 bg-vynexa-surface-secondary p-3 space-y-2 text-xs">
                <div className="flex items-center justify-between">
                  <span className="font-semibold text-vynexa-text-primary">Pipeline Board Shell</span>
                  <Kanban className="h-3.5 w-3.5 text-vynexa-text-muted" />
                </div>
                <p className="text-[11px] text-vynexa-text-muted">Opportunity Kanban stage view placeholder.</p>
                <div className="pt-2 flex items-center justify-between text-[10px] font-mono text-vynexa-text-secondary border-t border-vynexa-border/40">
                  <span>Phase 9</span>
                  <Badge variant="outline" className="text-[9px]">Stage {idx + 1}</Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
