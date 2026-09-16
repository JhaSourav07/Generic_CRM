import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { opportunitiesService } from '@/services/opportunities.service';
import { Opportunity, PipelineStage, OpportunityStatus } from '@/types/opportunities.types';

import { EditOpportunityModal } from '@/components/opportunities/EditOpportunityModal';
import { ChangeStageModal } from '@/components/opportunities/ChangeStageModal';
import { AssignOpportunityModal } from '@/components/opportunities/AssignOpportunityModal';
import { MarkWonModal } from '@/components/opportunities/MarkWonModal';
import { MarkLostModal } from '@/components/opportunities/MarkLostModal';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTasksCard } from '@/components/tasks/EntityTasksCard';
import { EntityQuotesOrdersCard } from '@/components/commercial/EntityQuotesOrdersCard';
import { EntityDocumentsCard } from '@/components/documents/EntityDocumentsCard';

import {
  DollarSign,
  TrendingUp,
  Building2,
  Contact,
  UserCheck,
  Calendar,
  Clock,
  Trophy,
  XCircle,
  Edit2,
  Trash2,
  ArrowRightLeft,
  ArrowLeft,
  CheckCircle2,
  FileText
} from 'lucide-react';

export const OpportunityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [opportunity, setOpportunity] = useState<Opportunity | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isStageOpen, setIsStageOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isWonOpen, setIsWonOpen] = useState(false);
  const [isLostOpen, setIsLostOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchOpportunity = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await opportunitiesService.getOpportunityById(id);
      setOpportunity(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load opportunity details.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOpportunity();
  }, [fetchOpportunity]);

  const handleDelete = async () => {
    if (!opportunity) return;
    try {
      setDeleting(true);
      await opportunitiesService.deleteOpportunity(opportunity.id);
      toast({
        type: 'success',
        title: 'Opportunity Deleted',
        message: `'${opportunity.name}' deleted.`
      });
      navigate('/app/opportunities');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Delete Failed',
        message: err.message || 'Could not delete opportunity.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount || 0);
  };

  const getStatusBadge = (status?: OpportunityStatus) => {
    if (!status) return null;
    switch (status) {
      case 'OPEN':
        return <Badge variant="blue">Open</Badge>;
      case 'WON':
        return <Badge variant="emerald">Won</Badge>;
      case 'LOST':
        return <Badge variant="red">Lost</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-56" />
            <Skeleton className="h-4 w-72" />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 md:col-span-2 rounded-xl" />
          <Skeleton className="h-64 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !opportunity) {
    return (
      <div className="space-y-6">
        <PageHeader
          title="Opportunity Details"
          breadcrumbs={[
            { label: 'Application', href: '/app/dashboard' },
            { label: 'Sales', href: '/app/opportunities' },
            { label: 'Error' }
          ]}
        />
        <Card className="bg-vynexa-surface border-vynexa-border p-8 text-center space-y-4">
          <p className="text-sm text-vynexa-danger">{error || 'Opportunity record not found.'}</p>
          <Button variant="outline" size="sm" onClick={() => navigate('/app/opportunities')}>
            <ArrowLeft className="h-3.5 w-3.5 mr-1" /> Return to Opportunities
          </Button>
        </Card>
      </div>
    );
  }

  const numValue = Number(opportunity.value || 0);
  const prob = opportunity.probability > 0 ? opportunity.probability : (opportunity.stage?.probability || 0);
  const weightedValue = numValue * prob;

  return (
    <div className="space-y-6">
      <PageHeader
        title={opportunity.name}
        description={`Deal value: ${formatCurrency(numValue)} | Stage: ${opportunity.stage?.name || 'Unassigned'}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Opportunities', href: '/app/opportunities' },
          { label: opportunity.name }
        ]}
        actions={
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<ArrowLeft className="h-3.5 w-3.5" />}
              onClick={() => navigate('/app/opportunities')}
            >
              Back
            </Button>

            {opportunity.status === 'OPEN' && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  leftIcon={<ArrowRightLeft className="h-3.5 w-3.5" />}
                  onClick={() => setIsStageOpen(true)}
                >
                  Change stage
                </Button>

                <Button
                  variant="primary"
                  size="sm"
                  className="bg-vynexa-emerald hover:bg-vynexa-emerald/90 text-white"
                  leftIcon={<Trophy className="h-3.5 w-3.5" />}
                  onClick={() => setIsWonOpen(true)}
                >
                  Mark as won
                </Button>

                <Button
                  variant="outline"
                  size="sm"
                  className="text-vynexa-danger hover:text-vynexa-danger border-vynexa-border"
                  leftIcon={<XCircle className="h-3.5 w-3.5" />}
                  onClick={() => setIsLostOpen(true)}
                >
                  Mark as lost
                </Button>
              </>
            )}

            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={() => setIsEditOpen(true)}
            >
              Edit opportunity
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="text-vynexa-danger hover:text-vynexa-danger"
              onClick={() => setIsDeleteOpen(true)}
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        }
      />

      {/* Main Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 Cols): Commercial & Account Context */}
        <div className="lg:col-span-2 space-y-6">
          {/* Key Metrics Overview Card */}
          <Card className="bg-vynexa-surface border-vynexa-border p-6 space-y-6">
            <div className="flex items-center justify-between border-b border-vynexa-border pb-4">
              <div>
                <span className="text-xs text-vynexa-text-secondary uppercase tracking-wider font-semibold">
                  Deal value
                </span>
                <div className="text-3xl font-bold font-mono text-vynexa-text-primary mt-1">
                  {formatCurrency(numValue)}
                </div>
              </div>
              <div className="text-right">
                <span className="text-xs text-vynexa-text-secondary uppercase tracking-wider font-semibold">
                  Status
                </span>
                <div className="mt-1">{getStatusBadge(opportunity.status)}</div>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-vynexa-text-muted">Pipeline</span>
                <div className="font-semibold text-vynexa-text-primary mt-1">
                  {opportunity.pipeline?.name || 'Standard'}
                </div>
              </div>

              <div>
                <span className="text-vynexa-text-muted">Stage</span>
                <div className="font-semibold text-vynexa-text-primary mt-1">
                  {opportunity.stage?.name || '—'}
                </div>
              </div>

              <div>
                <span className="text-vynexa-text-muted">Win chance</span>
                <div className="font-semibold font-mono text-vynexa-text-primary mt-1">
                  {Math.round(prob * 100)}%
                </div>
              </div>

              <div>
                <span className="text-vynexa-text-muted">Expected sales</span>
                <div className="font-semibold font-mono text-vynexa-text-primary mt-1">
                  {formatCurrency(weightedValue)}
                </div>
              </div>
            </div>

            {/* Won / Lost Status Alert Box */}
            {opportunity.status === 'WON' && (
              <div className="p-3 bg-vynexa-emerald/10 border border-vynexa-emerald/20 rounded-lg flex items-center gap-3 text-xs text-vynexa-emerald">
                <Trophy className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">Deal won</span>
                  {opportunity.closedAt && (
                    <span className="text-[11px] block text-vynexa-emerald/80 font-mono">
                      Won on {new Date(opportunity.closedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}

            {opportunity.status === 'LOST' && (
              <div className="p-3 bg-vynexa-danger/10 border border-vynexa-danger/20 rounded-lg flex items-center gap-3 text-xs text-vynexa-danger">
                <XCircle className="h-4 w-4 shrink-0" />
                <div>
                  <span className="font-semibold">Deal lost</span>
                  <p className="text-[11px] text-vynexa-danger/80 mt-0.5">
                    Reason: {opportunity.lostReason || 'No reason specified'}
                  </p>
                  {opportunity.closedAt && (
                    <span className="text-[10px] block text-vynexa-danger/70 font-mono mt-0.5">
                      Lost on {new Date(opportunity.closedAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            )}
          </Card>

          {/* Customer & Contact Card */}
          <Card className="bg-vynexa-surface border-vynexa-border p-6 space-y-4">
            <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider flex items-center gap-2">
              <Building2 className="h-4 w-4" /> Customer and contact
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
              <div className="p-3 bg-vynexa-surface-secondary rounded-lg border border-vynexa-border space-y-2">
                <span className="text-vynexa-text-muted text-[11px]">Customer</span>
                {opportunity.account ? (
                  <div>
                    <button
                      onClick={() => navigate(`/app/customers/${opportunity.account?.id}`)}
                      className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-sm"
                    >
                      {opportunity.account.name}
                    </button>
                    {opportunity.account.industry && (
                      <div className="text-vynexa-text-muted text-[11px] mt-0.5">
                        Industry: {opportunity.account.industry}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-vynexa-text-muted italic">No customer linked</div>
                )}
              </div>

              <div className="p-3 bg-vynexa-surface-secondary rounded-lg border border-vynexa-border space-y-2">
                <span className="text-vynexa-text-muted text-[11px]">Primary contact</span>
                {opportunity.contact ? (
                  <div>
                    <button
                      onClick={() => navigate(`/app/contacts/${opportunity.contact?.id}`)}
                      className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-sm"
                    >
                      {opportunity.contact.firstName} {opportunity.contact.lastName}
                    </button>
                    {opportunity.contact.email && (
                      <div className="text-vynexa-text-muted text-[11px] mt-0.5">
                        {opportunity.contact.email}
                      </div>
                    )}
                    {opportunity.contact.phone && (
                      <div className="text-vynexa-text-muted text-[11px] font-mono">
                        {opportunity.contact.phone}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-vynexa-text-muted italic">No contact linked</div>
                )}
              </div>
            </div>
          </Card>

          {/* Description / Scope Card */}
          {opportunity.description && (
            <Card className="bg-vynexa-surface border-vynexa-border p-6 space-y-3">
              <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider flex items-center gap-2">
                <FileText className="h-4 w-4" /> Notes
              </h3>
              <p className="text-xs text-vynexa-text-primary leading-relaxed whitespace-pre-wrap">
                {opportunity.description}
              </p>
            </Card>
          )}

          {/* Commercial Quotes & Fulfillment Orders */}
          <EntityQuotesOrdersCard
            accountId={opportunity.account?.id}
            opportunityId={opportunity.id}
          />

          {/* Interaction Stream & Timeline */}
          <ActivityTimeline opportunityId={opportunity.id} />

          {/* Scheduled Tasks & Follow-ups */}
          <EntityTasksCard opportunityId={opportunity.id} />
        </div>

        {/* Right Column (1 Col): Ownership & Metadata */}
        <div className="space-y-6">
          {/* Owner Assignment Card */}
          <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
                Assigned to
              </h3>
              <Button
                variant="ghost"
                size="sm"
                className="text-[11px] h-6 px-2 text-vynexa-text-secondary hover:text-vynexa-text-primary"
                onClick={() => setIsAssignOpen(true)}
              >
                Reassign
              </Button>
            </div>

            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-full bg-vynexa-surface-secondary border border-vynexa-border flex items-center justify-center font-semibold text-xs text-vynexa-text-primary">
                {opportunity.owner?.name
                  ? opportunity.owner.name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase()
                  : '—'}
              </div>
              <div>
                <div className="text-xs font-semibold text-vynexa-text-primary">
                  {opportunity.owner?.name || 'Unassigned'}
                </div>
                <div className="text-[11px] text-vynexa-text-muted">
                  {opportunity.owner?.email || 'No email associated'}
                </div>
              </div>
            </div>
          </Card>

          {/* Deal Metadata Card */}
          <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-3">
            <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
              Timeline
            </h3>

            <div className="space-y-2.5 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Expected close
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {opportunity.expectedCloseDate
                    ? new Date(opportunity.expectedCloseDate).toLocaleDateString()
                    : 'Not specified'}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Created
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {new Date(opportunity.createdAt).toLocaleDateString()}
                </span>
              </div>

              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Clock className="h-3.5 w-3.5" /> Last updated
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {new Date(opportunity.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Attached Documents Vault */}
          <EntityDocumentsCard opportunityId={opportunity.id} />
        </div>
      </div>

      {/* Modals */}
      <EditOpportunityModal
        isOpen={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchOpportunity}
        opportunity={opportunity}
      />

      <ChangeStageModal
        isOpen={isStageOpen}
        onClose={() => setIsStageOpen(false)}
        onSuccess={fetchOpportunity}
        opportunity={opportunity}
        stages={opportunity.pipeline?.stages || []}
      />

      <AssignOpportunityModal
        isOpen={isAssignOpen}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={fetchOpportunity}
        opportunity={opportunity}
      />

      <MarkWonModal
        isOpen={isWonOpen}
        onClose={() => setIsWonOpen(false)}
        onSuccess={fetchOpportunity}
        opportunity={opportunity}
      />

      <MarkLostModal
        isOpen={isLostOpen}
        onClose={() => setIsLostOpen(false)}
        onSuccess={fetchOpportunity}
        opportunity={opportunity}
      />

      {/* Delete Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete opportunity"
        maxWidth="sm"
      >
        <div className="space-y-4">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to delete <span className="font-semibold text-vynexa-text-primary">{opportunity.name}</span>? This will remove the deal from your sales pipeline.
          </p>
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button variant="outline" size="sm" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" size="sm" onClick={handleDelete} isLoading={deleting}>
              Delete opportunity
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
