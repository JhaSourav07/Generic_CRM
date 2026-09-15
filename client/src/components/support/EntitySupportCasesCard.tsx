import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supportCasesService } from '@/services/support.service';
import { SupportCase, SupportCaseStatus, SupportCasePriority } from '@/types/support.types';
import { CreateSupportCaseModal } from './CreateSupportCaseModal';
import { LifeBuoy, Plus, Clock, User, ChevronRight } from 'lucide-react';

export interface EntitySupportCasesCardProps {
  title?: string;
  accountId?: string;
  contactId?: string;
}

export const EntitySupportCasesCard: React.FC<EntitySupportCasesCardProps> = ({
  title = 'Support Cases',
  accountId,
  contactId
}) => {
  const navigate = useNavigate();
  const [cases, setCases] = useState<SupportCase[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchCases = useCallback(async () => {
    try {
      setLoading(true);
      const res = await supportCasesService.getCases({
        accountId,
        contactId,
        limit: 50
      });
      setCases(res.cases);
    } catch (_err) {
      // Graceful error fallback
    } finally {
      setLoading(false);
    }
  }, [accountId, contactId]);

  useEffect(() => {
    fetchCases();
  }, [fetchCases]);

  const getStatusBadge = (status: SupportCaseStatus) => {
    switch (status) {
      case 'OPEN':
        return <Badge variant="slate">Open</Badge>;
      case 'IN_PROGRESS':
        return <Badge variant="blue">In Progress</Badge>;
      case 'RESOLVED':
        return <Badge variant="emerald">Resolved</Badge>;
      case 'CLOSED':
        return <Badge variant="outline">Closed</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: SupportCasePriority) => {
    switch (priority) {
      case 'LOW':
        return <Badge variant="slate">Low</Badge>;
      case 'MEDIUM':
        return <Badge variant="amber">Medium</Badge>;
      case 'HIGH':
        return <Badge variant="red">High</Badge>;
      case 'URGENT':
        return <Badge variant="red">Urgent</Badge>;
      default:
        return <Badge variant="slate">{priority}</Badge>;
    }
  };

  return (
    <Card className="bg-vynexa-surface border-vynexa-border">
      <CardHeader className="border-b border-vynexa-border pb-3 flex flex-row items-center justify-between">
        <CardTitle className="text-sm font-semibold text-vynexa-text-primary flex items-center gap-2">
          <LifeBuoy className="h-4 w-4 text-vynexa-text-muted" />
          <span>{title}</span>
          <span className="text-xs font-mono font-normal text-vynexa-text-muted">
            ({cases.length})
          </span>
        </CardTitle>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreateOpen(true)}
          className="text-xs flex items-center gap-1.5 h-8"
        >
          <Plus className="h-3.5 w-3.5" />
          <span>New Case</span>
        </Button>
      </CardHeader>

      <CardContent className="pt-3">
        {loading ? (
          <div className="py-6 text-center text-xs text-vynexa-text-muted font-mono">
            Loading support history...
          </div>
        ) : cases.length === 0 ? (
          <div className="py-8 text-center space-y-2">
            <LifeBuoy className="h-8 w-8 text-vynexa-text-muted mx-auto opacity-40" />
            <p className="text-xs text-vynexa-text-secondary">No customer cases logged for this record.</p>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCreateOpen(true)}
              className="text-xs mx-auto"
            >
              Open Support Case
            </Button>
          </div>
        ) : (
          <div className="divide-y divide-vynexa-border/60">
            {cases.map((c) => (
              <div
                key={c.id}
                onClick={() => navigate(`/app/support-cases/${c.id}`)}
                className="py-2.5 flex items-center justify-between gap-3 text-xs hover:bg-vynexa-surface-secondary/40 px-2 rounded cursor-pointer transition-colors"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-mono text-[11px] font-bold text-vynexa-text-primary">
                      {c.caseNumber}
                    </span>
                    {getStatusBadge(c.status)}
                    {getPriorityBadge(c.priority)}
                  </div>
                  <p className="font-medium text-vynexa-text-primary truncate">{c.subject}</p>
                  <div className="flex items-center gap-3 text-[10px] text-vynexa-text-muted font-mono mt-1">
                    <span className="flex items-center gap-1">
                      <User className="h-2.5 w-2.5" />
                      {c.assignedTo?.name || 'Unassigned Queue'}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="h-2.5 w-2.5" />
                      {new Date(c.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-vynexa-text-muted shrink-0" />
              </div>
            ))}
          </div>
        )}
      </CardContent>

      <CreateSupportCaseModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchCases}
        defaultAccountId={accountId}
        defaultContactId={contactId}
      />
    </Card>
  );
};
