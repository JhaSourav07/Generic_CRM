import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { quotesService } from '@/services/quotes.service';
import { Quote, QuoteStatus } from '@/types/quotes.types';
import { CreateQuoteModal } from '@/components/quotes/CreateQuoteModal';
import {
  FileText,
  Plus,
  Search,
  CheckCircle2,
  XCircle,
  Clock,
  ArrowRight,
  ChevronLeft,
  ChevronRight,
  Building2,
  TrendingUp,
  ShoppingBag,
  Send,
  Trash2
} from 'lucide-react';

export const QuotesPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'quoteNumber' | 'total' | 'validUntil' | 'createdAt'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals & Actions
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [convertingQuote, setConvertingQuote] = useState<Quote | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuotes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await quotesService.getQuotes({
        page,
        limit,
        search: search.trim() ? search.trim() : undefined,
        status: (statusFilter as QuoteStatus) || undefined,
        sortBy,
        sortOrder
      });

      setQuotes(res.quotes);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load quotes');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchQuotes();
  }, [fetchQuotes]);

  const handleSend = async (e: React.MouseEvent, quoteId: string) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await quotesService.sendQuote(quoteId);
      toast({ type: 'success', title: 'Quote Sent', message: 'Quote marked as sent.' });
      fetchQuotes();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not send quote.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async (e: React.MouseEvent, quoteId: string) => {
    e.stopPropagation();
    try {
      setActionLoading(true);
      await quotesService.approveQuote(quoteId);
      toast({ type: 'success', title: 'Quote Approved', message: 'Commercial quote approved.' });
      fetchQuotes();
    } catch (err: any) {
      toast({ type: 'error', title: 'Approval Failed', message: err.message || 'Could not approve quote.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!convertingQuote) return;
    try {
      setActionLoading(true);
      const order = await quotesService.convertToOrder(convertingQuote.id);
      toast({
        type: 'success',
        title: 'Order Generated',
        message: `Order #${order.orderNumber} created from Quote #${convertingQuote.quoteNumber}.`
      });
      setConvertingQuote(null);
      navigate(`/app/orders/${order.id}`);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Conversion Failed',
        message: err.message || 'Could not convert quote to order.'
      });
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadge = (status: QuoteStatus) => {
    switch (status) {
      case 'DRAFT':
        return <Badge variant="slate">Draft</Badge>;
      case 'SENT':
        return <Badge variant="blue">Sent</Badge>;
      case 'VIEWED':
        return <Badge variant="amber">Viewed</Badge>;
      case 'APPROVED':
        return <Badge variant="emerald">Approved</Badge>;
      case 'REJECTED':
        return <Badge variant="red">Rejected</Badge>;
      case 'EXPIRED':
        return <Badge variant="slate">Expired</Badge>;
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
        title="Quotes"
        description="Create and manage price quotes for customers."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Quotes' }
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Create quote</span>
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
                placeholder="Search quotes, customers, or deals..."
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
              <option value="DRAFT">Draft</option>
              <option value="SENT">Sent</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
              <option value="EXPIRED">Expired</option>
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
              <option value="quoteNumber">Quote number</option>
              <option value="validUntil">Expiration date</option>
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

      {/* Quotes Table Card */}
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
            <Button variant="outline" size="sm" onClick={fetchQuotes}>
              Retry
            </Button>
          </div>
        ) : quotes.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <FileText className="h-10 w-10 mx-auto text-vynexa-text-muted opacity-40" />
            <h3 className="text-sm font-semibold text-vynexa-text-primary">No quotes found</h3>
            <p className="text-xs text-vynexa-text-secondary max-w-sm mx-auto">
              {search || statusFilter
                ? 'No quotes match your search or filters.'
                : 'Create your first price quote for a customer or deal.'}
            </p>
            {!search && !statusFilter && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Create quote
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-muted uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3 px-4">Quote #</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Opportunity</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Valid until</th>
                  <th className="py-3 px-4">Created by</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vynexa-border/60">
                {quotes.map((q) => (
                  <tr
                    key={q.id}
                    className="hover:bg-vynexa-surface-secondary/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/quotes/${q.id}`)}
                  >
                    <td className="py-3 px-4 font-mono font-semibold text-vynexa-text-primary group-hover:text-primary transition-colors text-[12px]">
                      {q.quoteNumber}
                    </td>
                    <td className="py-3 px-4 font-medium text-vynexa-text-primary">
                      {q.account ? (
                        <span className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
                          <span className="truncate max-w-[180px]">{q.account.name}</span>
                        </span>
                      ) : (
                        <span className="text-vynexa-text-muted italic">No customer</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-vynexa-text-secondary">
                      {q.opportunity ? (
                        <span className="flex items-center gap-1.5">
                          <TrendingUp className="h-3.5 w-3.5 text-vynexa-text-muted shrink-0" />
                          <span className="truncate max-w-[180px]">{q.opportunity.name}</span>
                        </span>
                      ) : (
                        <span className="text-vynexa-text-muted italic">—</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      {getStatusBadge(q.status)}
                    </td>
                    <td className="py-3 px-4 font-mono font-bold text-vynexa-text-primary text-[12px]">
                      {formatAmount(q.total)}
                    </td>
                    <td className="py-3 px-4 font-mono text-vynexa-text-muted text-[11px]">
                      {q.validUntil ? new Date(q.validUntil).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3 px-4 text-vynexa-text-secondary truncate max-w-[120px]">
                      {q.createdBy?.name || '—'}
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1.5">
                        {q.status === 'DRAFT' && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleSend(e, q.id)}
                            disabled={actionLoading}
                            className="h-7 px-2 text-[11px] flex items-center gap-1"
                          >
                            <Send className="h-3 w-3" />
                            <span>Send</span>
                          </Button>
                        )}
                        {(q.status === 'SENT' || q.status === 'VIEWED' || q.status === 'DRAFT') && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={(e) => handleApprove(e, q.id)}
                            disabled={actionLoading}
                            className="h-7 px-2 text-[11px] text-emerald-400 hover:text-emerald-300 flex items-center gap-1"
                          >
                            <CheckCircle2 className="h-3 w-3" />
                            <span>Approve</span>
                          </Button>
                        )}
                        {q.status === 'APPROVED' && (
                          <Button
                            variant="primary"
                            size="sm"
                            onClick={() => setConvertingQuote(q)}
                            disabled={actionLoading || (q.orders && q.orders.length > 0)}
                            className="h-7 px-2 text-[11px] flex items-center gap-1"
                          >
                            <ShoppingBag className="h-3 w-3" />
                            <span>{q.orders && q.orders.length > 0 ? 'Converted' : 'Create order'}</span>
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && quotes.length > 0 && (
          <div className="p-3 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-text-muted">
            <span className="font-mono">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} quotes
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

      {/* Create Quote Modal */}
      <CreateQuoteModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchQuotes}
      />

      {/* Convert to Order Confirmation Dialog */}
      <Dialog
        isOpen={!!convertingQuote}
        onClose={() => setConvertingQuote(null)}
        title="Turn quote into order"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            You are turning approved quote{' '}
            <strong className="text-vynexa-text-primary">#{convertingQuote?.quoteNumber}</strong>{' '}
            into a new customer order.
          </p>
          <div className="p-3 bg-vynexa-surface-secondary/60 rounded border border-vynexa-border/60 font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-vynexa-text-muted">Customer:</span>
              <span className="text-vynexa-text-primary font-semibold">{convertingQuote?.account?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-vynexa-text-muted">Approved total:</span>
              <span className="text-primary font-bold">${convertingQuote?.total ? Number(convertingQuote.total).toFixed(2) : '0.00'}</span>
            </div>
          </div>
          <p className="text-[11px] text-vynexa-text-muted">
            The order will keep all approved items, prices, and quantities from this quote.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setConvertingQuote(null)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleConvertToOrder}
              disabled={actionLoading}
            >
              {actionLoading ? 'Creating order...' : 'Create order'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
