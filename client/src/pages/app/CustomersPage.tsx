import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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

import { customersService } from '@/services/customers.service';
import { Customer, CustomerStatus, CustomerTier, GetCustomersQuery } from '@/types/customers.types';
import { CreateCustomerModal } from '@/components/customers/CreateCustomerModal';
import { EditCustomerModal } from '@/components/customers/EditCustomerModal';

import {
  Plus,
  Search,
  Building2,
  MoreVertical,
  MoreHorizontal,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  Eye,
  Globe,
  Users
} from 'lucide-react';

export const CustomersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  // Data state
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [meta, setMeta] = useState({ page: 1, limit: 10, total: 0, totalPages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter state
  const [search, setSearch] = useState('');
  const [industryFilter, setIndustryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [tierFilter, setTierFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'createdAt' | 'name' | 'annualRevenue'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [page, setPage] = useState(1);

  // Modal states
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedCustomerForEdit, setSelectedCustomerForEdit] = useState<Customer | null>(null);
  const [selectedCustomerForDelete, setSelectedCustomerForDelete] = useState<Customer | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    if (searchParams.get('action') === 'create') {
      setIsCreateOpen(true);
      searchParams.delete('action');
      setSearchParams(searchParams, { replace: true });
    }
  }, [searchParams, setSearchParams]);

  const fetchCustomers = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const query: GetCustomersQuery = {
        page,
        limit: 10,
        search: search.trim() || undefined,
        industry: industryFilter.trim() || undefined,
        status: statusFilter ? (statusFilter as CustomerStatus) : undefined,
        tier: tierFilter ? (tierFilter as CustomerTier) : undefined,
        sortBy,
        sortOrder
      };

      const res = await customersService.getCustomers(query);
      setCustomers(res.customers);
      setMeta(res.meta);
    } catch (err: any) {
      setError(err.message || 'Could not load customers. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [page, search, industryFilter, statusFilter, tierFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDelete = async () => {
    if (!selectedCustomerForDelete) return;
    try {
      setDeleting(true);
      await customersService.deleteCustomer(selectedCustomerForDelete.id);
      toast({
        type: 'success',
        title: 'Customer deleted',
        message: `${selectedCustomerForDelete.name} has been removed.`
      });
      setSelectedCustomerForDelete(null);
      fetchCustomers();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not delete customer',
        message: err.message || 'An error occurred while deleting.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const getStatusBadge = (status: CustomerStatus | string) => {
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
    if (!tier) return <span className="text-vynexa-text-muted text-xs">—</span>;
    switch (tier) {
      case 'enterprise':
        return <Badge variant="amber" className="font-mono">Enterprise</Badge>;
      case 'vip':
        return <Badge variant="blue" className="font-mono">VIP</Badge>;
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

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Manage your customers and their details."
        breadcrumbs={[
          { label: 'Workspace', href: '/app/dashboard' },
          { label: 'CRM' },
          { label: 'Customers' }
        ]}
        actions={
          <Button
            variant="primary"
            size="sm"
            leftIcon={<Plus className="h-3.5 w-3.5" />}
            onClick={() => setIsCreateOpen(true)}
          >
            Add customer
          </Button>
        }
      />

      {/* Filter and Search Bar */}
      <Card className="bg-vynexa-surface border-vynexa-border p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
          <div className="relative lg:col-span-2">
            <Input
              placeholder="Search by company name, email, or domain..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              leftIcon={<Search className="h-4 w-4 text-vynexa-text-muted" />}
            />
          </div>

          <Input
            placeholder="Filter by industry..."
            value={industryFilter}
            onChange={(e) => {
              setIndustryFilter(e.target.value);
              setPage(1);
            }}
            leftIcon={<Filter className="h-4 w-4 text-vynexa-text-muted" />}
          />

          <Select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All statuses' },
              { value: 'active', label: 'Active' },
              { value: 'onboarding', label: 'Onboarding' },
              { value: 'inactive', label: 'Inactive' },
              { value: 'churned', label: 'Churned' }
            ]}
          />

          <Select
            value={tierFilter}
            onChange={(e) => {
              setTierFilter(e.target.value);
              setPage(1);
            }}
            options={[
              { value: '', label: 'All tiers' },
              { value: 'enterprise', label: 'Enterprise' },
              { value: 'vip', label: 'VIP' },
              { value: 'premium', label: 'Premium' },
              { value: 'standard', label: 'Standard' }
            ]}
          />
        </div>
      </Card>

      {/* Accounts Directory Table */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        <CardContent className="p-0">
          {error ? (
            <div className="p-8 text-center text-vynexa-danger">
              <p className="font-medium">{error}</p>
              <Button variant="outline" size="sm" className="mt-3" onClick={() => fetchCustomers()}>
                Try again
              </Button>
            </div>
          ) : loading ? (
            <div className="p-6 space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-4">
                  <Skeleton className="h-10 w-10 rounded-lg" />
                  <div className="space-y-2 flex-1">
                    <Skeleton className="h-4 w-1/4" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-6 w-20" />
                </div>
              ))}
            </div>
          ) : customers.length === 0 ? (
            <div className="p-12 text-center">
              <Building2 className="h-10 w-10 text-vynexa-text-muted mx-auto mb-3" />
              <h3 className="text-base font-semibold text-vynexa-text-primary">No customers found</h3>
              <p className="text-sm text-vynexa-text-secondary mt-1 max-w-sm mx-auto">
                {search || statusFilter || tierFilter || industryFilter
                  ? 'No customers match your search filters.'
                  : 'Add your first customer to get started.'}
              </p>
              <Button
                variant="primary"
                size="sm"
                className="mt-4"
                leftIcon={<Plus className="h-3.5 w-3.5" />}
                onClick={() => setIsCreateOpen(true)}
              >
                Add customer
              </Button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead>Industry</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Contacts</TableHead>
                    <TableHead>Annual revenue</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {customers.map((account) => {
                    const contactsCount = account._count?.contacts ?? account.contacts?.length ?? 0;
                    return (
                      <TableRow key={account.id} className="hover:bg-vynexa-elevated/40 transition-colors">
                        <TableCell className="font-medium text-vynexa-text-primary">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-lg bg-vynexa-elevated border border-vynexa-border flex items-center justify-center text-vynexa-text-secondary font-mono text-xs">
                              {account.name.substring(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <button
                                onClick={() => navigate(`/app/customers/${account.id}`)}
                                className="font-semibold text-vynexa-text-primary hover:text-white transition-colors text-left block"
                              >
                                {account.name}
                              </button>
                              <div className="flex items-center gap-2 text-xs text-vynexa-text-muted mt-0.5">
                                {account.domain && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {account.domain}
                                  </span>
                                )}
                                {account.website && !account.domain && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {account.website.replace(/^https?:\/\//, '')}
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-vynexa-text-secondary text-xs">
                          {account.industry || <span className="text-vynexa-text-muted">—</span>}
                        </TableCell>
                        <TableCell>{getTierBadge(account.tier)}</TableCell>
                        <TableCell className="text-vynexa-text-secondary">
                          <div className="flex items-center gap-1.5 text-xs font-mono">
                            <Users className="h-3.5 w-3.5 text-vynexa-text-muted" />
                            <span>{contactsCount}</span>
                          </div>
                        </TableCell>
                        <TableCell className="font-mono text-xs text-vynexa-text-primary">
                          {formatCurrency(account.annualRevenue)}
                        </TableCell>
                        <TableCell>{getStatusBadge(account.status)}</TableCell>
                        <TableCell className="text-right">
                          <Dropdown
                            trigger={
                              <Button variant="ghost" size="sm" className="h-8 w-8 p-0 text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary" title="Customer actions">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            }
                          >
                            <DropdownItem
                              icon={<Eye className="h-3.5 w-3.5" />}
                              onClick={() => navigate(`/app/customers/${account.id}`)}
                            >
                              View details
                            </DropdownItem>
                            <DropdownItem
                              icon={<Edit2 className="h-3.5 w-3.5" />}
                              onClick={() => setSelectedCustomerForEdit(account)}
                            >
                              Edit customer
                            </DropdownItem>
                            <DropdownSeparator />
                            <DropdownItem
                              icon={<Trash2 className="h-3.5 w-3.5" />}
                              danger
                              onClick={() => setSelectedCustomerForDelete(account)}
                            >
                              Delete customer
                            </DropdownItem>
                          </Dropdown>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination Footer */}
          {meta.totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-vynexa-border text-xs text-vynexa-text-secondary">
              <div className="font-mono">
                Showing {((meta.page - 1) * meta.limit) + 1} to {Math.min(meta.page * meta.limit, meta.total)} of {meta.total} customers
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

      {/* Create Customer Modal */}
      <CreateCustomerModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={() => fetchCustomers()}
      />

      {/* Edit Customer Modal */}
      <EditCustomerModal
        isOpen={!!selectedCustomerForEdit}
        customer={selectedCustomerForEdit}
        onClose={() => setSelectedCustomerForEdit(null)}
        onSuccess={() => fetchCustomers()}
      />

      {/* Delete Confirmation Modal */}
      <Dialog
        isOpen={!!selectedCustomerForDelete}
        onClose={() => setSelectedCustomerForDelete(null)}
        title="Delete customer"
        description="Are you sure you want to delete this customer? This cannot be undone."
      >
        <div className="space-y-4 pt-2">
          {selectedCustomerForDelete && (
            <div className="p-3 bg-vynexa-elevated rounded-lg border border-vynexa-border text-xs space-y-1">
              <p className="font-semibold text-vynexa-text-primary">{selectedCustomerForDelete.name}</p>
              <p className="text-vynexa-text-secondary">Industry: {selectedCustomerForDelete.industry || 'N/A'}</p>
              <p className="text-vynexa-text-secondary">Status: {selectedCustomerForDelete.status}</p>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
            <Button
              variant="outline"
              onClick={() => setSelectedCustomerForDelete(null)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDelete}
              isLoading={deleting}
            >
              Delete customer
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
