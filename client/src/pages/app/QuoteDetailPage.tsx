import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/toast';
import { quotesService } from '@/services/quotes.service';
import { Quote, QuoteStatus } from '@/types/quotes.types';
import { EditQuoteModal } from '@/components/quotes/EditQuoteModal';
import {
  FileText,
  ArrowLeft,
  Edit2,
  Trash2,
  Send,
  CheckCircle2,
  XCircle,
  Clock,
  ShoppingBag,
  Building2,
  TrendingUp,
  User,
  Calendar,
  Lock,
  DollarSign
} from 'lucide-react';

export const QuoteDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [quote, setQuote] = useState<Quote | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Actions
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isRejectOpen, setIsRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isConvertOpen, setIsConvertOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  const fetchQuote = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await quotesService.getQuoteById(id);
      setQuote(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load quote details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchQuote();
  }, [fetchQuote]);

  const handleSend = async () => {
    if (!quote) return;
    try {
      setActionLoading(true);
      await quotesService.sendQuote(quote.id);
      toast({ type: 'success', title: 'Quote Sent', message: 'Quote marked as sent.' });
      fetchQuote();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not send quote.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleApprove = async () => {
    if (!quote) return;
    try {
      setActionLoading(true);
      await quotesService.approveQuote(quote.id);
      toast({ type: 'success', title: 'Quote Approved', message: 'Quote has been approved.' });
      fetchQuote();
    } catch (err: any) {
      toast({ type: 'error', title: 'Approval Failed', message: err.message || 'Could not approve quote.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async () => {
    if (!quote) return;
    try {
      setActionLoading(true);
      await quotesService.rejectQuote(quote.id, rejectReason.trim() ? rejectReason.trim() : undefined);
      toast({ type: 'success', title: 'Quote Rejected', message: 'Quote marked as rejected.' });
      setIsRejectOpen(false);
      setRejectReason('');
      fetchQuote();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not reject quote.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!quote) return;
    try {
      setActionLoading(true);
      await quotesService.deleteQuote(quote.id);
      toast({ type: 'success', title: 'Quote Deleted', message: 'Quote proposal deleted.' });
      navigate('/app/quotes');
    } catch (err: any) {
      toast({ type: 'error', title: 'Delete Failed', message: err.message || 'Could not delete quote.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleConvertToOrder = async () => {
    if (!quote) return;
    try {
      setActionLoading(true);
      const order = await quotesService.convertToOrder(quote.id);
      toast({
        type: 'success',
        title: 'Order Generated',
        message: `Order #${order.orderNumber} successfully generated from Quote #${quote.quoteNumber}.`
      });
      setIsConvertOpen(false);
      navigate(`/app/orders/${order.id}`);
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Conversion Failed',
        message: err.message || 'Failed to convert quote to order.'
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

  const formatAmount = (val?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-vynexa-surface-secondary" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-96 col-span-2 bg-vynexa-surface-secondary" />
          <Skeleton className="h-96 bg-vynexa-surface-secondary" />
        </div>
      </div>
    );
  }

  if (error || !quote) {
    return (
      <div className="space-y-6 text-center py-16">
        <p className="text-red-400 text-sm mb-4">{error || 'Quote not found'}</p>
        <Button variant="outline" onClick={() => navigate('/app/quotes')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Quotes List
        </Button>
      </div>
    );
  }

  const isApproved = quote.status === 'APPROVED';
  const hasOrders = quote.orders && quote.orders.length > 0;

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Quote #${quote.quoteNumber}`}
        description={`Commercial Proposal • Issued ${new Date(quote.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Quotes', href: '/app/quotes' },
          { label: quote.quoteNumber }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/quotes')}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>

            {!isApproved && quote.status !== 'REJECTED' && quote.status !== 'EXPIRED' && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setIsEditOpen(true)}
                className="text-xs flex items-center gap-1.5"
              >
                <Edit2 className="h-3.5 w-3.5" />
                <span>Edit</span>
              </Button>
            )}

            {quote.status === 'DRAFT' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleSend}
                disabled={actionLoading}
                className="text-xs flex items-center gap-1.5"
              >
                <Send className="h-3.5 w-3.5" />
                <span>Send</span>
              </Button>
            )}

            {(quote.status === 'DRAFT' || quote.status === 'SENT' || quote.status === 'VIEWED') && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleApprove}
                  disabled={actionLoading}
                  className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1.5"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Approve</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setIsRejectOpen(true)}
                  disabled={actionLoading}
                  className="text-xs text-red-400 hover:text-red-300 flex items-center gap-1.5"
                >
                  <XCircle className="h-3.5 w-3.5" />
                  <span>Reject</span>
                </Button>
              </>
            )}

            {isApproved && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsConvertOpen(true)}
                disabled={actionLoading || hasOrders}
                className="text-xs flex items-center gap-1.5"
              >
                <ShoppingBag className="h-3.5 w-3.5" />
                <span>{hasOrders ? 'Converted to Order' : 'Convert to Order'}</span>
              </Button>
            )}

            {!isApproved && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsDeleteOpen(true)}
                disabled={actionLoading}
                className="text-xs flex items-center gap-1.5"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </Button>
            )}
          </div>
        }
      />

      {isApproved && (
        <div className="flex items-center gap-2 p-3 rounded-md bg-emerald-950/30 border border-emerald-800/40 text-xs text-emerald-300">
          <Lock className="h-4 w-4 shrink-0" />
          <span>
            <strong>Approved Commercial Proposal:</strong> Financial terms and line items are strictly immutable to maintain legal and auditing integrity.
          </span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Line Items and Details */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-vynexa-text-primary flex items-center gap-2">
                  <FileText className="h-4 w-4 text-vynexa-text-muted" />
                  Proposal Overview
                </CardTitle>
                {getStatusBadge(quote.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Customer
                </span>
                <span className="font-semibold text-vynexa-text-primary">
                  {quote.account?.name || 'No account attached'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Opportunity
                </span>
                <span className="font-semibold text-vynexa-text-primary">
                  {quote.opportunity?.name || '—'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Valid Until
                </span>
                <span className="font-mono text-vynexa-text-primary">
                  {quote.validUntil ? new Date(quote.validUntil).toLocaleDateString() : 'No expiry'}
                </span>
              </div>
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Created By
                </span>
                <span className="text-vynexa-text-primary">
                  {quote.createdBy?.name || 'System'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Line Items Table */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-sm font-semibold text-vynexa-text-primary">
                Line Items & Commercial Deliverables
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-muted uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-4">Catalog SKU</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vynexa-border/60">
                  {quote.items?.map((item) => (
                    <tr key={item.id} className="hover:bg-vynexa-surface-secondary/20 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-vynexa-text-primary">
                            {item.product?.name || item.description}
                          </span>
                          {item.product?.name && item.description !== item.product.name && (
                            <span className="text-[11px] text-vynexa-text-muted">{item.description}</span>
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-vynexa-text-secondary">
                        {item.product?.sku || '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-medium text-vynexa-text-primary">
                        {item.quantity}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-vynexa-text-secondary">
                        {formatAmount(item.unitPrice)}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-vynexa-text-secondary">
                        {item.discount > 0 ? `-${formatAmount(item.discount)}` : '—'}
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-vynexa-text-secondary">
                        {item.tax > 0 ? `+${formatAmount(item.tax)}` : '—'}
                      </td>
                      <td className="py-3 px-4 text-right font-mono font-bold text-vynexa-text-primary text-[12px]">
                        {formatAmount(item.total)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>

          {/* Notes Card */}
          {quote.notes && (
            <Card className="bg-vynexa-surface border-vynexa-border">
              <CardHeader className="border-b border-vynexa-border pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                  Commercial Terms & Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-xs text-vynexa-text-secondary whitespace-pre-wrap leading-relaxed">
                  {quote.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Cards: Financial Summary & Converted Orders */}
        <div className="space-y-6">
          {/* Financial Totals Card */}
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                Financial Summary
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Subtotal:</span>
                <span className="font-semibold text-vynexa-text-primary">{formatAmount(quote.subtotal)}</span>
              </div>
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Total Discount:</span>
                <span className="text-amber-400">-{formatAmount(quote.discount)}</span>
              </div>
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Applicable Tax:</span>
                <span className="text-vynexa-text-primary">+{formatAmount(quote.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-vynexa-text-primary pt-3 border-t border-vynexa-border">
                <span>Final Proposal:</span>
                <span className="text-primary">{formatAmount(quote.total)}</span>
              </div>
              <span className="text-[10px] text-vynexa-text-muted block pt-1 italic text-right">
                All prices in USD
              </span>
            </CardContent>
          </Card>

          {/* Converted Orders Card */}
          {hasOrders && (
            <Card className="bg-vynexa-surface border-vynexa-border">
              <CardHeader className="border-b border-vynexa-border pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-1.5">
                  <ShoppingBag className="h-3.5 w-3.5" />
                  <span>Associated Orders</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3 space-y-2">
                {quote.orders?.map((ord) => (
                  <div
                    key={ord.id}
                    onClick={() => navigate(`/app/orders/${ord.id}`)}
                    className="p-2.5 rounded bg-vynexa-surface-secondary/50 border border-vynexa-border/60 hover:border-primary/50 transition-colors cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <span className="font-mono text-xs font-bold text-vynexa-text-primary block">
                        #{ord.orderNumber}
                      </span>
                      <span className="text-[10px] text-vynexa-text-muted">
                        {ord.createdAt ? new Date(ord.createdAt).toLocaleDateString() : ''}
                      </span>
                    </div>
                    <Badge variant="emerald" className="text-[10px]">
                      {ord.status}
                    </Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {isEditOpen && (
        <EditQuoteModal
          isOpen={isEditOpen}
          quote={quote}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchQuote}
        />
      )}

      {/* Reject Modal */}
      <Dialog
        isOpen={isRejectOpen}
        onClose={() => setIsRejectOpen(false)}
        title="Reject Quote Proposal"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary">
            Provide an optional reason for rejecting proposal <strong>#{quote.quoteNumber}</strong>.
          </p>
          <Textarea
            rows={3}
            placeholder="e.g. Budget constraints, scope reduction, vendor change..."
            value={rejectReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setRejectReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsRejectOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleReject}
              disabled={actionLoading}
            >
              {actionLoading ? 'Rejecting...' : 'Reject Quote'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Delete Quote Proposal"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary">
            Are you sure you want to delete draft Quote <strong>#{quote.quoteNumber}</strong>? This action cannot be undone.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Confirm Delete'}
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Convert Confirmation Dialog */}
      <Dialog
        isOpen={isConvertOpen}
        onClose={() => setIsConvertOpen(false)}
        title="Convert Quote to Official Order"
        maxWidth="md"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Convert approved Quote <strong className="text-vynexa-text-primary">#{quote.quoteNumber}</strong> into a commercial Order.
          </p>
          <div className="p-3 bg-vynexa-surface-secondary/60 rounded border border-vynexa-border/60 font-mono text-xs space-y-1">
            <div className="flex justify-between">
              <span className="text-vynexa-text-muted">Customer:</span>
              <span className="text-vynexa-text-primary font-semibold">{quote.account?.name || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-vynexa-text-muted">Order Total:</span>
              <span className="text-primary font-bold">{formatAmount(quote.total)}</span>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsConvertOpen(false)}
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
              {actionLoading ? 'Generating Order...' : 'Generate Order'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
