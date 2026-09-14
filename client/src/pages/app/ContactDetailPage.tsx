import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { contactsService } from '@/services/contacts.service';
import { Contact } from '@/types/contacts.types';
import { EditContactModal } from '@/components/contacts/EditContactModal';
import { CreateOpportunityModal } from '@/components/opportunities/CreateOpportunityModal';
import { ActivityTimeline } from '@/components/activities/ActivityTimeline';
import { EntityTasksCard } from '@/components/tasks/EntityTasksCard';

import {
  Users,
  Building2,
  Mail,
  Phone,
  Briefcase,
  Edit2,
  Trash2,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  UserCheck,
  TrendingUp,
  Plus
} from 'lucide-react';

export const ContactDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [contact, setContact] = useState<Contact | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateOpportunityOpen, setIsCreateOpportunityOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchContactDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await contactsService.getContact(id);
      setContact(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load contact record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchContactDetails();
  }, [fetchContactDetails]);

  const handleDeleteContact = async () => {
    if (!contact) return;
    try {
      setDeleting(true);
      await contactsService.deleteContact(contact.id);
      toast({
        type: 'success',
        title: 'Contact Deleted',
        message: `Contact '${contact.firstName} ${contact.lastName}' deleted.`
      });
      navigate('/app/contacts');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete contact.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatCurrency = (amount?: number | null) => {
    if (amount === undefined || amount === null) return '—';
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      maximumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="grid grid-cols-3 gap-6">
          <Skeleton className="h-48 col-span-2 rounded-xl" />
          <Skeleton className="h-48 rounded-xl" />
        </div>
      </div>
    );
  }

  if (error || !contact) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/contacts')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Contacts
        </Button>
        <Card className="bg-vynexa-surface border-vynexa-border p-8 text-center">
          <p className="text-vynexa-danger font-medium mb-4">{error || 'Contact record not found'}</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/contacts')}>
            Return to Contact Directory
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title={`${contact.firstName} ${contact.lastName}`}
        description={`Contact Record ID: ${contact.id}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Contacts', href: '/app/contacts' },
          { label: `${contact.firstName} ${contact.lastName}` }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Contact
            </Button>
            <Button
              variant="danger"
              size="sm"
              leftIcon={<Trash2 className="h-3.5 w-3.5" />}
              onClick={() => setIsDeleteModalOpen(true)}
            >
              Delete
            </Button>
          </div>
        }
      />

      {/* Main Grid Context */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Contact Overview */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="bg-vynexa-surface border-vynexa-border p-6">
            <div className="flex items-start justify-between border-b border-vynexa-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-full bg-vynexa-elevated border border-vynexa-border flex items-center justify-center text-vynexa-text-primary font-mono text-base font-bold">
                  {contact.firstName[0]}
                  {contact.lastName[0]}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-vynexa-text-primary flex items-center gap-2">
                    {contact.firstName} {contact.lastName}
                    {contact.isPrimary && (
                      <Badge variant="emerald" className="text-[10px]">Primary Contact</Badge>
                    )}
                  </h2>
                  <p className="text-xs text-vynexa-text-secondary">
                    {contact.jobTitle || 'No Title'} {contact.department ? `(${contact.department})` : ''}
                  </p>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 text-vynexa-text-secondary">
                <Mail className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Email:</span>
                <span>{contact.email || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-vynexa-text-secondary">
                <Phone className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Phone:</span>
                <span className="font-mono">{contact.phone || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-vynexa-text-secondary sm:col-span-2">
                <Building2 className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Associated Customer Company:</span>
                {contact.account ? (
                  <button
                    onClick={() => navigate(`/app/customers/${contact.account!.id}`)}
                    className="font-medium text-vynexa-text-primary hover:underline hover:text-white transition-colors"
                  >
                    {contact.account.name}
                  </button>
                ) : (
                  <span className="text-vynexa-text-muted">Standalone Contact</span>
                )}
              </div>
            </div>

            {contact.notes && (
              <div className="mt-4 pt-4 border-t border-vynexa-border">
                <h4 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
                  Notes & Context
                </h4>
                <p className="text-xs text-vynexa-text-primary bg-vynexa-elevated/50 p-3 rounded-lg border border-vynexa-border whitespace-pre-wrap">
                  {contact.notes}
                </p>
              </div>
            )}
          </Card>

          {/* Linked Opportunities Table Card */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-vynexa-border pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-vynexa-text-secondary" />
                  Associated Opportunities ({contact.opportunities?.length || 0})
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsCreateOpportunityOpen(true)}
              >
                New Opportunity
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!contact.opportunities || contact.opportunities.length === 0 ? (
                <div className="p-8 text-center">
                  <Briefcase className="h-8 w-8 text-vynexa-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-vynexa-text-primary">No Opportunities Linked</p>
                  <p className="text-xs text-vynexa-text-secondary mt-1">
                    Associate this contact with deal opportunities in your pipeline.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>OPPORTUNITY</TableHead>
                      <TableHead>STAGE</TableHead>
                      <TableHead>VALUE</TableHead>
                      <TableHead>STATUS</TableHead>
                      <TableHead>CLOSE DATE</TableHead>
                      <TableHead className="text-right">ACTION</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {contact.opportunities.map((opp: any) => (
                      <TableRow key={opp.id} className="hover:bg-vynexa-elevated/40 transition-colors">
                        <TableCell className="font-medium text-vynexa-text-primary">
                          <button
                            onClick={() => navigate(`/app/opportunities/${opp.id}`)}
                            className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-left"
                          >
                            {opp.name}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-vynexa-text-secondary">
                          <span className="inline-flex items-center gap-1.5">
                            <span
                              className="h-2 w-2 rounded-full"
                              style={{ backgroundColor: opp.stage?.color || '#3B82F6' }}
                            />
                            {opp.stage?.name || 'Unassigned'}
                          </span>
                        </TableCell>
                        <TableCell className="font-mono text-xs font-semibold text-vynexa-text-primary">
                          {formatCurrency(opp.value)}
                        </TableCell>
                        <TableCell>
                          {opp.status === 'WON' && <Badge variant="emerald">Won</Badge>}
                          {opp.status === 'LOST' && <Badge variant="red">Lost</Badge>}
                          {opp.status === 'OPEN' && <Badge variant="blue">Open</Badge>}
                        </TableCell>
                        <TableCell className="font-mono text-xs text-vynexa-text-muted">
                          {opp.expectedCloseDate
                            ? new Date(opp.expectedCloseDate).toLocaleDateString()
                            : '—'}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-7 text-xs"
                            onClick={() => navigate(`/app/opportunities/${opp.id}`)}
                          >
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* Interaction Stream & Timeline */}
          <ActivityTimeline contactId={contact.id} />

          {/* Scheduled Tasks & Follow-ups */}
          <EntityTasksCard contactId={contact.id} />
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-6">
          <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-4">
            <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
              Contact Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Created Date
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {new Date(contact.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Last Updated
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {new Date(contact.updatedAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          </Card>

          {/* Converted Lead Origin Card */}
          {contact.convertedFromLeads && contact.convertedFromLeads.length > 0 && (
            <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-3">
              <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-vynexa-emerald" /> Converted Lead Origin
              </h3>
              {contact.convertedFromLeads.map((lead: any) => (
                <div key={lead.id} className="p-3 bg-vynexa-elevated rounded-lg border border-vynexa-border text-xs space-y-1">
                  <p className="font-semibold text-vynexa-text-primary">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-vynexa-text-secondary">Company: {lead.company}</p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={isEditModalOpen}
        contact={contact}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchContactDetails()}
      />

      {/* Create Opportunity Modal */}
      {contact && (
        <CreateOpportunityModal
          isOpen={isCreateOpportunityOpen}
          initialAccountId={contact.accountId || undefined}
          initialContactId={contact.id}
          onClose={() => setIsCreateOpportunityOpen(false)}
          onSuccess={() => fetchContactDetails()}
        />
      )}

      {/* Delete Contact Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Contact Record"
        description="Are you sure you want to soft-delete this contact record?"
      >
        <div className="space-y-4 pt-2">
          <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteContact} isLoading={deleting}>
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
