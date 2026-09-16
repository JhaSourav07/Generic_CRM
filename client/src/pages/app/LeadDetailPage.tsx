import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { leadsService } from '@/services/leads.service';
import { Lead, LeadStatus } from '@/types/leads.types';

import { EditLeadModal } from '@/components/leads/EditLeadModal';
import { AssignLeadModal } from '@/components/leads/AssignLeadModal';
import { ConvertLeadDialog } from '@/components/leads/ConvertLeadDialog';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTasksCard } from '@/components/tasks/EntityTasksCard';
import { EntityDocumentsCard } from '@/components/documents/EntityDocumentsCard';

import {
  Edit2,
  UserPlus,
  UserCheck,
  Trash2,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Globe,
  Calendar,
  User,
  ArrowLeft,
  FileText
} from 'lucide-react';

export const LeadDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAssignOpen, setIsAssignOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchLead = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await leadsService.getLeadById(id);
      setLead(data);
    } catch (err: any) {
      setError(err.message || 'Could not load lead details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchLead();
  }, [fetchLead]);

  const handleDelete = async () => {
    if (!lead) return;
    try {
      setDeleting(true);
      await leadsService.deleteLead(lead.id);
      toast({
        type: 'success',
        title: 'Lead deleted',
        message: 'Lead has been removed.'
      });
      navigate('/app/leads');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not delete lead',
        message: err.message || 'An error occurred while deleting.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: LeadStatus) => {
    switch (status) {
      case 'NEW':
        return <Badge variant="slate">New</Badge>;
      case 'QUALIFIED':
        return <Badge variant="emerald">Qualified</Badge>;
      case 'CONTACTED':
        return <Badge variant="blue">Contacted</Badge>;
      case 'ASSIGNED':
        return <Badge variant="slate">Assigned</Badge>;
      case 'CONVERTED':
        return <Badge variant="emerald">Converted</Badge>;
      case 'LOST':
        return <Badge variant="red">Lost</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2" />
          <Skeleton className="h-64 col-span-1" />
        </div>
      </div>
    );
  }

  if (error || !lead) {
    return (
      <div className="p-12 text-center space-y-4">
        <h3 className="text-base font-semibold text-rose-400">{error || 'Lead not found'}</h3>
        <Button variant="outline" onClick={() => navigate('/app/leads')} leftIcon={<ArrowLeft className="h-4 w-4" />}>
          Back to leads
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <PageHeader
        title={`${lead.firstName} ${lead.lastName}`}
        description={lead.company ? `${lead.company} ${lead.jobTitle ? `• ${lead.jobTitle}` : ''}` : 'Lead details'}
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'Leads', href: '/app/leads' },
          { label: `${lead.firstName} ${lead.lastName}` }
        ]}
        actions={
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              leftIcon={<Edit2 className="h-3.5 w-3.5" />}
            >
              Edit
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsAssignOpen(true)}
              leftIcon={<UserPlus className="h-3.5 w-3.5" />}
            >
              Assign team member
            </Button>
            {lead.status !== 'CONVERTED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsConvertOpen(true)}
                leftIcon={<UserCheck className="h-3.5 w-3.5" />}
              >
                Turn into customer
              </Button>
            )}
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
            >
              Delete
            </Button>
          </div>
        }
      />

      {/* Conversion Banner */}
      {lead.status === 'CONVERTED' && (
        <Card className="bg-emerald-500/10 border-emerald-500/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
                <UserCheck className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-semibold text-emerald-300">Converted to customer</h4>
                <p className="text-xs text-emerald-400/80">
                  Converted on {lead.convertedAt ? new Date(lead.convertedAt).toLocaleDateString() : 'N/A'}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {lead.convertedAccount && (
                <Badge variant="emerald">Customer: {lead.convertedAccount.name}</Badge>
              )}
              {lead.convertedContact && (
                <Badge variant="blue">Contact: {lead.convertedContact.firstName} {lead.convertedContact.lastName}</Badge>
              )}
            </div>
          </div>
        </Card>
      )}

      {/* Detail Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Contact & Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="flex flex-row items-center justify-between border-b border-vynexa-border pb-4">
              <CardTitle className="text-sm font-semibold">Contact details</CardTitle>
              {getStatusBadge(lead.status)}
            </CardHeader>
            <CardContent className="pt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1">
                <span className="text-xs text-vynexa-text-muted flex items-center gap-1.5">
                  <User className="h-3.5 w-3.5" /> Full name
                </span>
                <p className="text-sm font-medium text-vynexa-text-primary">
                  {lead.firstName} {lead.lastName}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-vynexa-text-muted flex items-center gap-1.5">
                  <Building2 className="h-3.5 w-3.5" /> Company
                </span>
                <p className="text-sm font-mono text-vynexa-text-secondary">
                  {lead.company || '—'}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-vynexa-text-muted flex items-center gap-1.5">
                  <Mail className="h-3.5 w-3.5" /> Email
                </span>
                <p className="text-sm text-vynexa-text-primary">
                  {lead.email ? (
                    <a href={`mailto:${lead.email}`} className="hover:underline text-blue-400">
                      {lead.email}
                    </a>
                  ) : (
                    '—'
                  )}
                </p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-vynexa-text-muted flex items-center gap-1.5">
                  <Phone className="h-3.5 w-3.5" /> Phone
                </span>
                <p className="text-sm text-vynexa-text-primary">{lead.phone || '—'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-vynexa-text-muted flex items-center gap-1.5">
                  <Briefcase className="h-3.5 w-3.5" /> Job title
                </span>
                <p className="text-sm text-vynexa-text-primary">{lead.jobTitle || '—'}</p>
              </div>

              <div className="space-y-1">
                <span className="text-xs text-vynexa-text-muted flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> How they found you
                </span>
                <p className="text-sm text-vynexa-text-primary">{lead.source || 'Direct'}</p>
              </div>
            </CardContent>
          </Card>

          {/* Notes Section */}
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-4">
              <CardTitle className="text-sm font-semibold flex items-center gap-2">
                <FileText className="h-4 w-4 text-vynexa-text-muted" /> Notes
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4">
              {lead.notes ? (
                <p className="text-sm text-vynexa-text-secondary whitespace-pre-wrap leading-relaxed">
                  {lead.notes}
                </p>
              ) : (
                <p className="text-xs text-vynexa-text-muted italic">No notes added yet.</p>
              )}
            </CardContent>
          </Card>

          {/* Interaction Stream & Timeline */}
          <ActivityTimeline leadId={lead.id} />

          {/* Scheduled Tasks & Follow-ups */}
          <EntityTasksCard leadId={lead.id} />
        </div>

        {/* Sidebar Metadata */}
        <div className="space-y-6">
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-4">
              <CardTitle className="text-sm font-semibold">Score &amp; assignment</CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div>
                <span className="text-xs text-vynexa-text-muted">Lead score</span>
                <div className="mt-1 flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-vynexa-text-primary">{lead.score}</span>
                  <span className="text-xs text-vynexa-text-muted">/ 100</span>
                </div>
              </div>

              <div className="pt-3 border-t border-vynexa-border">
                <span className="text-xs text-vynexa-text-muted">Assigned to</span>
                <p className="mt-1 text-sm font-medium text-vynexa-text-primary">
                  {lead.owner ? lead.owner.name : <span className="text-vynexa-text-muted italic">Unassigned</span>}
                </p>
                {lead.owner && (
                  <p className="text-xs text-vynexa-text-muted">{lead.owner.email}</p>
                )}
              </div>

              <div className="pt-3 border-t border-vynexa-border space-y-2">
                <div className="flex justify-between text-xs">
                  <span className="text-vynexa-text-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Created
                  </span>
                  <span className="text-vynexa-text-secondary font-mono">
                    {new Date(lead.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-vynexa-text-muted flex items-center gap-1">
                    <Calendar className="h-3 w-3" /> Updated
                  </span>
                  <span className="text-vynexa-text-secondary font-mono">
                    {new Date(lead.updatedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Lead Documents Vault */}
          <EntityDocumentsCard leadId={lead.id} />
        </div>
      </div>

      {/* Modals */}
      <EditLeadModal
        isOpen={isEditOpen}
        lead={lead}
        onClose={() => setIsEditOpen(false)}
        onSuccess={fetchLead}
      />

      <AssignLeadModal
        isOpen={isAssignOpen}
        lead={lead}
        onClose={() => setIsAssignOpen(false)}
        onSuccess={fetchLead}
      />

      <ConvertLeadDialog
        isOpen={isConvertOpen}
        lead={lead}
        onClose={() => setIsConvertOpen(false)}
        onSuccess={fetchLead}
      />

      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete lead"
        description="Are you sure you want to delete this lead? This cannot be undone."
        maxWidth="sm"
      >
        <div className="flex justify-end gap-3 pt-4">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)} disabled={deleting}>
            Cancel
          </Button>
          <Button variant="danger" onClick={handleDelete} isLoading={deleting}>
            Delete lead
          </Button>
        </div>
      </Dialog>
    </div>
  );
};
