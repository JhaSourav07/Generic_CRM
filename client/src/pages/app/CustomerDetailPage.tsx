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

import { customersService } from '@/services/customers.service';
import { contactsService } from '@/services/contacts.service';
import { Customer, CustomerStatus, CustomerTier } from '@/types/customers.types';
import { Contact } from '@/types/contacts.types';

import { EditCustomerModal } from '@/components/customers/EditCustomerModal';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { EditContactModal } from '@/components/contacts/EditContactModal';

import {
  Building2,
  Globe,
  Mail,
  Phone,
  MapPin,
  Users,
  DollarSign,
  Briefcase,
  Edit2,
  Trash2,
  Plus,
  ArrowLeft,
  Calendar,
  CheckCircle2,
  UserCheck
} from 'lucide-react';

export const CustomerDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modals
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const [isCreateContactOpen, setIsCreateContactOpen] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<Contact | null>(null);
  const [deletingContact, setDeletingContact] = useState(false);

  const fetchCustomerDetails = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await customersService.getCustomer(id);
      setCustomer(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load customer record');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchCustomerDetails();
  }, [fetchCustomerDetails]);

  const handleDeleteCustomer = async () => {
    if (!customer) return;
    try {
      setDeleting(true);
      await customersService.deleteCustomer(customer.id);
      toast({
        type: 'success',
        title: 'Customer Deleted',
        message: `Account '${customer.name}' deleted.`
      });
      navigate('/app/customers');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete customer account.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const handleDeleteContact = async () => {
    if (!selectedContactForDelete) return;
    try {
      setDeletingContact(true);
      await contactsService.deleteContact(selectedContactForDelete.id);
      toast({
        type: 'success',
        title: 'Contact Deleted',
        message: `Contact '${selectedContactForDelete.firstName} ${selectedContactForDelete.lastName}' soft-deleted.`
      });
      setSelectedContactForDelete(null);
      fetchCustomerDetails();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Deletion Failed',
        message: err.message || 'Failed to delete contact.'
      });
    } finally {
      setDeletingContact(false);
    }
  };

  const getStatusBadge = (status?: CustomerStatus | string) => {
    if (!status) return null;
    switch (status) {
      case 'active':
        return <Badge variant="emerald">Active</Badge>;
      case 'onboarding':
        return <Badge variant="blue">Onboarding</Badge>;
      case 'inactive':
        return <Badge variant="slate">Inactive</Badge>;
      case 'churned':
        return <Badge variant="red">Churned</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const getTierBadge = (tier?: CustomerTier | null) => {
    if (!tier) return null;
    switch (tier) {
      case 'enterprise':
        return <Badge variant="amber" className="font-mono">Enterprise</Badge>;
      case 'vip':
        return <Badge variant="blue" className="font-mono">VIP Tier</Badge>;
      case 'premium':
        return <Badge variant="emerald" className="font-mono">Premium</Badge>;
      case 'standard':
        return <Badge variant="outline" className="font-mono">Standard</Badge>;
      default:
        return <Badge variant="slate" className="font-mono">{tier}</Badge>;
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
          <Skeleton className="h-10 w-10 rounded-lg" />
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

  if (error || !customer) {
    return (
      <div className="space-y-6">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/app/customers')}
          leftIcon={<ArrowLeft className="h-4 w-4" />}
        >
          Back to Customers
        </Button>
        <Card className="bg-vynexa-surface border-vynexa-border p-8 text-center">
          <p className="text-vynexa-danger font-medium mb-4">{error || 'Customer record not found'}</p>
          <Button variant="primary" size="sm" onClick={() => navigate('/app/customers')}>
            Return to Customers Directory
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Bar */}
      <PageHeader
        title={customer.name}
        description={`Organization Account ID: ${customer.id}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Customers', href: '/app/customers' },
          { label: customer.name }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              leftIcon={<Edit2 className="h-3.5 w-3.5" />}
              onClick={() => setIsEditModalOpen(true)}
            >
              Edit Account
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
        {/* Left Column: Account Details & Overview */}
        <div className="lg:col-span-2 space-y-6">
          {/* Account Overview Card */}
          <Card className="bg-vynexa-surface border-vynexa-border p-6">
            <div className="flex items-start justify-between border-b border-vynexa-border pb-4 mb-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-vynexa-elevated border border-vynexa-border flex items-center justify-center text-vynexa-text-primary font-mono text-base font-bold">
                  {customer.name.substring(0, 2).toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-vynexa-text-primary flex items-center gap-2">
                    {customer.name}
                  </h2>
                  <p className="text-xs text-vynexa-text-secondary">
                    {customer.industry || 'Industry unspecified'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {getTierBadge(customer.tier)}
                {getStatusBadge(customer.status)}
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="flex items-center gap-2 text-vynexa-text-secondary">
                <Globe className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Website / Domain:</span>
                <span>{customer.domain || customer.website || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-vynexa-text-secondary">
                <Phone className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Phone:</span>
                <span>{customer.phone || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-vynexa-text-secondary">
                <Mail className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Email:</span>
                <span>{customer.email || 'N/A'}</span>
              </div>

              <div className="flex items-center gap-2 text-vynexa-text-secondary">
                <DollarSign className="h-4 w-4 text-vynexa-text-muted" />
                <span className="font-semibold text-vynexa-text-primary">Annual Revenue:</span>
                <span className="font-mono text-vynexa-text-primary">{formatCurrency(customer.annualRevenue)}</span>
              </div>

              <div className="flex items-center gap-2 text-vynexa-text-secondary sm:col-span-2">
                <MapPin className="h-4 w-4 text-vynexa-text-muted shrink-0" />
                <span className="font-semibold text-vynexa-text-primary">Address:</span>
                <span>
                  {[customer.address, customer.city, customer.state, customer.postalCode, customer.country]
                    .filter(Boolean)
                    .join(', ') || 'Address unspecified'}
                </span>
              </div>
            </div>

            {customer.notes && (
              <div className="mt-4 pt-4 border-t border-vynexa-border">
                <h4 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
                  Account Notes
                </h4>
                <p className="text-xs text-vynexa-text-primary bg-vynexa-elevated/50 p-3 rounded-lg border border-vynexa-border whitespace-pre-wrap">
                  {customer.notes}
                </p>
              </div>
            )}
          </Card>

          {/* Account Contacts Table Card */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="flex flex-row items-center justify-between border-b border-vynexa-border pb-4">
              <div>
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="h-4 w-4 text-vynexa-text-secondary" />
                  Key Account Contacts ({customer.contacts?.length || 0})
                </CardTitle>
              </div>
              <Button
                variant="outline"
                size="sm"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsCreateContactOpen(true)}
              >
                Add Contact
              </Button>
            </CardHeader>
            <CardContent className="p-0">
              {!customer.contacts || customer.contacts.length === 0 ? (
                <div className="p-8 text-center">
                  <UserCheck className="h-8 w-8 text-vynexa-text-muted mx-auto mb-2" />
                  <p className="text-sm font-medium text-vynexa-text-primary">No Contacts Linked</p>
                  <p className="text-xs text-vynexa-text-secondary mt-1">
                    Add decision makers and primary points of contact for this company.
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>NAME</TableHead>
                      <TableHead>TITLE / DEPT</TableHead>
                      <TableHead>EMAIL / PHONE</TableHead>
                      <TableHead>ROLE</TableHead>
                      <TableHead className="text-right">ACTIONS</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {customer.contacts.map((c) => (
                      <TableRow key={c.id} className="hover:bg-vynexa-elevated/40 transition-colors">
                        <TableCell className="font-medium text-vynexa-text-primary">
                          <button
                            onClick={() => navigate(`/app/contacts/${c.id}`)}
                            className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-left"
                          >
                            {c.firstName} {c.lastName}
                          </button>
                        </TableCell>
                        <TableCell className="text-xs text-vynexa-text-secondary">
                          <div>{c.jobTitle || '—'}</div>
                          {c.department && <div className="text-vynexa-text-muted">{c.department}</div>}
                        </TableCell>
                        <TableCell className="text-xs text-vynexa-text-secondary">
                          <div>{c.email || '—'}</div>
                          {c.phone && <div className="text-vynexa-text-muted font-mono">{c.phone}</div>}
                        </TableCell>
                        <TableCell>
                          {c.isPrimary ? (
                            <Badge variant="emerald" className="text-[10px]">Primary Contact</Badge>
                          ) : (
                            <span className="text-xs text-vynexa-text-muted">Standard</span>
                          )}
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex items-center justify-end gap-1">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0"
                              onClick={() => setSelectedContactForEdit(c as any)}
                            >
                              <Edit2 className="h-3.5 w-3.5 text-vynexa-text-secondary" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-7 w-7 p-0 text-vynexa-danger"
                              onClick={() => setSelectedContactForDelete(c as any)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Right Column: Metadata & Converted Context */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-4">
            <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider">
              Account Metadata
            </h3>
            <div className="space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Created Date
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {new Date(customer.createdAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Calendar className="h-3.5 w-3.5" /> Last Updated
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {new Date(customer.updatedAt).toLocaleDateString()}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-vynexa-text-muted flex items-center gap-1.5">
                  <Users className="h-3.5 w-3.5" /> Total Contacts
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {customer.contacts?.length || 0}
                </span>
              </div>
            </div>
          </Card>

          {/* Converted Lead Origin Card */}
          {customer.convertedFromLeads && customer.convertedFromLeads.length > 0 && (
            <Card className="bg-vynexa-surface border-vynexa-border p-5 space-y-3">
              <h3 className="text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider flex items-center gap-1.5">
                <CheckCircle2 className="h-3.5 w-3.5 text-vynexa-emerald" /> Converted Lead Origin
              </h3>
              {customer.convertedFromLeads.map((lead: any) => (
                <div key={lead.id} className="p-3 bg-vynexa-elevated rounded-lg border border-vynexa-border text-xs space-y-1">
                  <p className="font-semibold text-vynexa-text-primary">
                    {lead.firstName} {lead.lastName}
                  </p>
                  <p className="text-vynexa-text-secondary">Company: {lead.company}</p>
                  <p className="text-vynexa-text-muted text-[10px] font-mono">
                    Converted on {new Date(lead.convertedAt || lead.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            </Card>
          )}
        </div>
      </div>

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={isEditModalOpen}
        customer={customer}
        onClose={() => setIsEditModalOpen(false)}
        onSuccess={() => fetchCustomerDetails()}
      />

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={isCreateContactOpen}
        defaultAccountId={customer.id}
        onClose={() => setIsCreateContactOpen(false)}
        onSuccess={() => fetchCustomerDetails()}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={!!selectedContactForEdit}
        contact={selectedContactForEdit}
        onClose={() => setSelectedContactForEdit(null)}
        onSuccess={() => fetchCustomerDetails()}
      />

      {/* Delete Customer Confirmation Modal */}
      <Dialog
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        title="Delete Customer Account"
        description="Are you sure you want to delete this customer account? Linked contacts and lead history will remain intact for compliance."
      >
        <div className="space-y-4 pt-2">
          <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)} disabled={deleting}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteCustomer} isLoading={deleting}>
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Contact Confirmation Modal */}
      <Dialog
        isOpen={!!selectedContactForDelete}
        onClose={() => setSelectedContactForDelete(null)}
        title="Delete Contact"
        description="Are you sure you want to soft-delete this contact record?"
      >
        <div className="space-y-4 pt-2">
          {selectedContactForDelete && (
            <p className="text-xs text-vynexa-text-primary font-semibold">
              {selectedContactForDelete.firstName} {selectedContactForDelete.lastName} ({selectedContactForDelete.jobTitle || 'No Title'})
            </p>
          )}
          <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button variant="outline" onClick={() => setSelectedContactForDelete(null)} disabled={deletingContact}>
              Cancel
            </Button>
            <Button variant="danger" onClick={handleDeleteContact} isLoading={deletingContact}>
              Confirm Deletion
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
