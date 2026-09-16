import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableHead, TableBody, TableRow, TableCell } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Dropdown, DropdownItem, DropdownSeparator } from '@/components/ui/dropdown';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';

import { contactsService } from '@/services/contacts.service';
import { customersService } from '@/services/customers.service';
import { Contact, GetContactsQuery } from '@/types/contacts.types';
import { Customer } from '@/types/customers.types';
import { CreateContactModal } from '@/components/contacts/CreateContactModal';
import { EditContactModal } from '@/components/contacts/EditContactModal';

import {
  Plus,
  Search,
  Users,
  Building2,
  MoreVertical,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Mail,
  Phone,
  Briefcase
} from 'lucide-react';

export const ContactsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('');
  const [jobTitleFilter, setJobTitleFilter] = useState('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'firstName' | 'lastName' | 'email'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedContactForEdit, setSelectedContactForEdit] = useState<Contact | null>(null);
  const [selectedContactForDelete, setSelectedContactForDelete] = useState<Contact | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    customersService.getCustomers({ limit: 100 }).then(res => setCustomers(res.customers)).catch(() => {});
  }, []);

  const fetchContacts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query: GetContactsQuery = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        accountId: accountFilter || undefined,
        jobTitle: jobTitleFilter.trim() || undefined,
        sortBy,
        sortOrder
      };

      const res = await contactsService.getContacts(query);
      setContacts(res.contacts);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || 'Could not load contacts. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, accountFilter, jobTitleFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchContacts();
  }, [fetchContacts]);

  const handleDelete = async () => {
    if (!selectedContactForDelete) return;
    try {
      setDeleting(true);
      await contactsService.deleteContact(selectedContactForDelete.id);
      toast({
        type: 'success',
        title: 'Contact deleted',
        message: `${selectedContactForDelete.firstName} ${selectedContactForDelete.lastName} has been removed.`
      });
      setSelectedContactForDelete(null);
      fetchContacts();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not delete contact',
        message: err.message || 'An error occurred while deleting.'
      });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Contacts"
        description="Keep all your customer contacts in one place."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'CRM' },
          { label: 'Contacts' }
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Add contact
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="bg-vynexa-surface border-vynexa-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative lg:col-span-2">
            <Input
              placeholder="Search by name, email, phone, or title..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4 text-vynexa-text-muted" />}
            />
          </div>

          <Select
            value={accountFilter}
            onChange={(e) => {
              setAccountFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All customers' },
              ...customers.map(c => ({ value: c.id, label: c.name }))
            ]}
          />

          <Input
            placeholder="Filter by title..."
            value={jobTitleFilter}
            onChange={(e) => {
              setJobTitleFilter(e.target.value);
              setPage(1);
            }}
            leftIcon={<Filter className="h-4 w-4 text-vynexa-text-muted" />}
          />
        </div>
      </Card>

      {/* Contact Directory Table */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-vynexa-danger">
              <p className="font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchContacts()}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : contacts.length === 0 ? (
            <div className="p-12 text-center">
              <Users className="h-10 w-10 text-vynexa-text-muted mx-auto mb-3" />
              <h3 className="text-base font-semibold text-vynexa-text-primary">No contacts found</h3>
              <p className="text-sm text-vynexa-text-secondary mt-1 max-w-sm mx-auto">
                {search || accountFilter || jobTitleFilter
                  ? 'No contacts match your search filters.'
                  : 'Add your first contact to get started.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsCreateOpen(true)}
              >
                Add contact
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Customer</TableHead>
                    <TableHead>Title &amp; department</TableHead>
                    <TableHead>Email &amp; phone</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contacts.map((contact) => (
                    <TableRow key={contact.id} className="hover:bg-vynexa-elevated/40 transition-colors">
                      <TableCell className="font-medium text-vynexa-text-primary">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-vynexa-elevated border border-vynexa-border flex items-center justify-center text-vynexa-text-primary font-mono text-xs font-semibold">
                            {contact.firstName[0]}
                            {contact.lastName[0]}
                          </div>
                          <div>
                            <button
                              onClick={() => navigate(`/app/contacts/${contact.id}`)}
                              className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-left flex items-center gap-2"
                            >
                              <span>{contact.firstName} {contact.lastName}</span>
                              {contact.isPrimary && (
                                <Badge variant="emerald" className="text-[10px] px-1.5 py-0">Primary</Badge>
                              )}
                            </button>
                          </div>
                        </div>
                      </TableCell>

                      <TableCell className="text-vynexa-text-secondary text-xs">
                        {contact.account ? (
                          <button
                            onClick={() => navigate(`/app/customers/${contact.account!.id}`)}
                            className="flex items-center gap-1.5 hover:text-white transition-colors text-left font-medium"
                          >
                            <Building2 className="h-3.5 w-3.5 text-vynexa-text-muted" />
                            {contact.account.name}
                          </button>
                        ) : (
                          <span className="text-vynexa-text-muted">No company</span>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-vynexa-text-secondary">
                        <div className="font-medium text-vynexa-text-primary">{contact.jobTitle || '—'}</div>
                        {contact.department && (
                          <div className="text-vynexa-text-muted">{contact.department}</div>
                        )}
                      </TableCell>

                      <TableCell className="text-xs text-vynexa-text-secondary">
                        {contact.email && (
                          <div className="flex items-center gap-1 text-vynexa-text-primary">
                            <Mail className="h-3 w-3 text-vynexa-text-muted" />
                            <span>{contact.email}</span>
                          </div>
                        )}
                        {contact.phone && (
                          <div className="flex items-center gap-1 font-mono text-vynexa-text-muted mt-0.5">
                            <Phone className="h-3 w-3 text-vynexa-text-muted" />
                            <span>{contact.phone}</span>
                          </div>
                        )}
                        {!contact.email && !contact.phone && <span className="text-vynexa-text-muted">—</span>}
                      </TableCell>

                      <TableCell className="text-right">
                        <Dropdown
                          trigger={
                            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary" title="Contact actions">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          }
                        >
                          <DropdownItem
                            icon={<Eye className="h-3.5 w-3.5" />}
                            onClick={() => navigate(`/app/contacts/${contact.id}`)}
                          >
                            View details
                          </DropdownItem>
                          <DropdownItem
                            icon={<Edit2 className="h-3.5 w-3.5" />}
                            onClick={() => setSelectedContactForEdit(contact)}
                          >
                            Edit contact
                          </DropdownItem>
                          <DropdownSeparator />
                          <DropdownItem
                            icon={<Trash2 className="h-3.5 w-3.5" />}
                            danger
                            onClick={() => setSelectedContactForDelete(contact)}
                          >
                            Delete contact
                          </DropdownItem>
                        </Dropdown>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-vynexa-border text-xs text-vynexa-text-secondary">
              <div className="font-mono">
                Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} contacts
              </div>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  leftIcon={<ChevronLeft className="h-3.5 w-3.5" />}
                >
                  Previous
                </Button>
                <span className="font-mono px-2">
                  Page {meta.page} of {meta.totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= meta.totalPages}
                  onClick={() => setPage((p) => Math.min(meta.totalPages, p + 1))}
                  rightIcon={<ChevronRight className="h-3.5 w-3.5" />}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Contact Modal */}
      <CreateContactModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchContacts()}
      />

      {/* Edit Contact Modal */}
      <EditContactModal
        isOpen={!!selectedContactForEdit}
        contact={selectedContactForEdit}
        onClose={() => setSelectedContactForEdit(null)}
        onSuccess={() => fetchContacts()}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={!!selectedContactForDelete}
        onClose={() => setSelectedContactForDelete(null)}
        title="Delete contact"
        description="Are you sure you want to delete this contact? This cannot be undone."
      >
        <div className="space-y-4 pt-2">
          {selectedContactForDelete && (
            <div className="p-3 bg-vynexa-elevated rounded-lg border border-vynexa-border text-xs space-y-1">
              <p className="font-semibold text-vynexa-text-primary">
                {selectedContactForDelete.firstName} {selectedContactForDelete.lastName}
              </p>
              <p className="text-vynexa-text-secondary">Title: {selectedContactForDelete.jobTitle || 'N/A'}</p>
              <p className="text-vynexa-text-secondary">Customer: {selectedContactForDelete.account?.name || 'None'}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button
              variant="outline"
              onClick={() => setSelectedContactForDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Delete contact
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
