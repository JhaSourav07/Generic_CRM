import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/components/ui/toast';
import { ordersService } from '@/services/orders.service';
import { Order, OrderStatus } from '@/types/orders.types';
import { CreateOrderModal } from '@/components/orders/CreateOrderModal';
import {
  ShoppingBag,
  Plus,
  Search,
  Building2,
  FileText,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  CheckCircle2,
  Clock,
  RotateCw
} from 'lucide-react';

export const OrdersPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'orderNumber' | 'total' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const fetchOrders = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await ordersService.getOrders({
        page,
        limit,
        search: search.trim() ? search.trim() : undefined,
        status: (statusFilter as OrderStatus) || undefined,
        sortBy,
        sortOrder
      });

      setOrders(res.orders);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const getStatusBadge = (status: OrderStatus) => {
    switch (status) {
      case 'PENDING':
        return <Badge variant="slate">Pending</Badge>;
      case 'CONFIRMED':
        return <Badge variant="blue">Confirmed</Badge>;
      case 'PROCESSING':
        return <Badge variant="amber">Processing</Badge>;
      case 'COMPLETED':
        return <Badge variant="emerald">Completed</Badge>;
      case 'CANCELLED':
        return <Badge variant="red">Cancelled</Badge>;
      default:
        return <Badge variant="slate">{status}</Badge>;
    }
  };

  const formatAmount = (amt: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amt);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Orders"
        description="Track customer orders from start to finish."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Orders' }
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create order</span>
          </Button>
        }
      />

      {/* Filter Toolbar */}
      <Card className="p-4 bg-vynexa-surface border-vynexa-border">
        <div className="flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
          <div className="flex flex-wrap flex-1 items-center gap-3 w-full">
            <div className="relative flex-1 min-w-[200px] max-w-md">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-vynexa-text-muted" />
              <Input
                placeholder="Search orders, customers, or quotes..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              className="w-40 shrink-0 h-9 text-xs"
            >
              <option value="">All statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="PROCESSING">Processing</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span className="text-xs text-vynexa-text-muted whitespace-nowrap">Sort:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-36 shrink-0 h-9 text-xs"
            >
              <option value="createdAt">Date created</option>
              <option value="total">Total value</option>
              <option value="orderNumber">Order number</option>
            </Select>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="h-9 px-2 text-xs shrink-0"
              title="Toggle sort order"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>
      </Card>

      {/* Orders Table */}
      <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
        {loading ? (
          <div className="p-6 space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-12 w-full bg-vynexa-surface-secondary" />
            ))}
          </div>
        ) : error ? (
          <div className="p-8 text-center text-vynexa-text-muted">
            <p className="text-red-400 text-sm mb-2">{error}</p>
            <Button variant="outline" size="sm" onClick={fetchOrders}>
              Retry
            </Button>
          </div>
        ) : orders.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <ShoppingBag className="h-10 w-10 mx-auto text-vynexa-text-muted opacity-40" />
            <h3 className="text-sm font-semibold text-vynexa-text-primary">No orders found</h3>
            <p className="text-xs text-vynexa-text-secondary max-w-sm mx-auto">
              {search || statusFilter
                ? 'No orders match your search or filters.'
                : 'Create your first order or generate one from an approved quote.'}
            </p>
            {!search && !statusFilter && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create order
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-muted uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3 px-4">Order #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Quote</th>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Date created</th>
                  <th className="py-3 px-4">Created by</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vynexa-border/60">
                {orders.map((o) => (
                  <tr
                    key={o.id}
                    className="hover:bg-vynexa-surface-secondary/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/orders/${o.id}`)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-vynexa-text-primary group-hover:text-primary transition-colors text-[12px]">
                      {o.orderNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-vynexa-text-primary">
                      {o.account ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
                          <span className="truncate max-w-[180px]">{o.account.name}</span>
                        </span>
                      ) : (
                        <span className="text-vynexa-text-muted italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4 font-mono text-vynexa-text-secondary text-[11px]">
                      {o.quote ? (
                        <span className="flex items-center gap-1 text-primary hover:underline">
                          <FileText className="h-3 w-3" />
                          <span>{o.quote.quoteNumber}</span>
                        </span>
                      ) : (
                        <span className="text-vynexa-text-muted italic">Direct order</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-vynexa-text-secondary">
                      {o.opportunity ? (
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
                          <span className="truncate max-w-[160px]">{o.opportunity.name}</span>
                        </span>
                      ) : (
                        <span className="text-vynexa-text-muted italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(o.status)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-vynexa-text-primary text-[12px]">
                      {formatAmount(o.total)}
                    </td>
                    <td className="py-3 px-4 font-mono text-vynexa-text-muted text-[11px]">
                      {new Date(o.createdAt).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-vynexa-text-secondary truncate max-w-[120px]">
                      {o.createdBy?.name || 'System'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && orders.length > 0 && (
          <div className="p-3 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-text-muted">
            <span className="font-mono">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} orders
            </span>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(page - 1)}
                className="h-7 px-2 text-xs"
              >
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="font-mono px-2">
                {page} / {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= totalPages}
                onClick={() => setPage(page + 1)}
                className="h-7 px-2 text-xs"
              >
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        )}
      </Card>

      {/* Manual Order Creation Modal */}
      <CreateOrderModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchOrders}
      />
    </div>
  );
};
