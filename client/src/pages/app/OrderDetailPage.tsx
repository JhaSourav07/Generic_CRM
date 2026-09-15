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
import { ordersService } from '@/services/orders.service';
import { Order, OrderStatus } from '@/types/orders.types';
import {
  ShoppingBag,
  ArrowLeft,
  CheckCircle2,
  XCircle,
  Clock,
  RotateCw,
  Building2,
  TrendingUp,
  FileText,
  User,
  ShieldCheck,
  Calendar
} from 'lucide-react';

export const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isCancelOpen, setIsCancelOpen] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  const fetchOrder = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await ordersService.getOrderById(id);
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrder();
  }, [fetchOrder]);

  const handleConfirm = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await ordersService.confirmOrder(order.id);
      toast({ type: 'success', title: 'Order Confirmed', message: 'Order status updated to Confirmed.' });
      fetchOrder();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not confirm order.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleProcess = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await ordersService.processOrder(order.id);
      toast({ type: 'success', title: 'Order Processing', message: 'Order is now marked as Processing.' });
      fetchOrder();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not process order.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await ordersService.completeOrder(order.id);
      toast({ type: 'success', title: 'Order Completed', message: 'Order marked as Completed / Delivered.' });
      fetchOrder();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not complete order.' });
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!order) return;
    try {
      setActionLoading(true);
      await ordersService.cancelOrder(order.id, cancelReason.trim() ? cancelReason.trim() : undefined);
      toast({ type: 'success', title: 'Order Cancelled', message: 'Order has been cancelled.' });
      setIsCancelOpen(false);
      setCancelReason('');
      fetchOrder();
    } catch (err: any) {
      toast({ type: 'error', title: 'Action Failed', message: err.message || 'Could not cancel order.' });
    } finally {
      setActionLoading(false);
    }
  };

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

  if (error || !order) {
    return (
      <div className="space-y-6 text-center py-16">
        <p className="text-red-400 text-sm mb-4">{error || 'Order not found'}</p>
        <Button variant="outline" onClick={() => navigate('/app/orders')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Orders
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={`Order #${order.orderNumber}`}
        description={`Commercial Fulfillment Record • Created ${new Date(order.createdAt).toLocaleDateString()}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Orders', href: '/app/orders' },
          { label: order.orderNumber }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/orders')}
              className="text-xs flex items-center gap-1.5"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>

            {order.status === 'PENDING' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirm}
                disabled={actionLoading}
                className="text-xs flex items-center gap-1.5"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Confirm Order</span>
              </Button>
            )}

            {order.status === 'CONFIRMED' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleProcess}
                disabled={actionLoading}
                className="text-xs flex items-center gap-1.5"
              >
                <RotateCw className="h-3.5 w-3.5" />
                <span>Start Processing</span>
              </Button>
            )}

            {order.status === 'PROCESSING' && (
              <Button
                variant="primary"
                size="sm"
                onClick={handleComplete}
                disabled={actionLoading}
                className="text-xs flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-500 text-white"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                <span>Mark Completed</span>
              </Button>
            )}

            {(order.status === 'PENDING' || order.status === 'CONFIRMED') && (
              <Button
                variant="danger"
                size="sm"
                onClick={() => setIsCancelOpen(true)}
                disabled={actionLoading}
                className="text-xs flex items-center gap-1.5"
              >
                <XCircle className="h-3.5 w-3.5" />
                <span>Cancel</span>
              </Button>
            )}
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="md:col-span-2 space-y-6">
          {/* Overview Card */}
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold text-vynexa-text-primary flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-vynexa-text-muted" />
                  Order Overview
                </CardTitle>
                {getStatusBadge(order.status)}
              </div>
            </CardHeader>
            <CardContent className="pt-4 grid grid-cols-2 md:grid-cols-4 gap-4 text-xs">
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Customer Account
                </span>
                <span className="font-semibold text-vynexa-text-primary">
                  {order.account?.name || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Source Quote
                </span>
                {order.quote ? (
                  <span
                    onClick={() => navigate(`/app/quotes/${order.quote?.id}`)}
                    className="font-mono text-primary hover:underline cursor-pointer flex items-center gap-1 font-semibold"
                  >
                    <FileText className="h-3 w-3" />
                    <span>#{order.quote.quoteNumber}</span>
                  </span>
                ) : (
                  <span className="text-vynexa-text-muted italic">Direct Order</span>
                )}
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Opportunity
                </span>
                <span className="font-semibold text-vynexa-text-primary">
                  {order.opportunity?.name || '—'}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Ordered By
                </span>
                <span className="text-vynexa-text-primary">
                  {order.createdBy?.name || 'System'}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Items Table Card */}
          <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-sm font-semibold text-vynexa-text-primary">
                Purchased Line Items & Historical Pricing
              </CardTitle>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-muted uppercase tracking-wider font-mono text-[10px]">
                    <th className="py-2.5 px-4">Item & Description</th>
                    <th className="py-2.5 px-4">SKU</th>
                    <th className="py-2.5 px-3 text-right">Qty</th>
                    <th className="py-2.5 px-3 text-right">Unit Price</th>
                    <th className="py-2.5 px-3 text-right">Discount</th>
                    <th className="py-2.5 px-3 text-right">Tax</th>
                    <th className="py-2.5 px-4 text-right">Line Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-vynexa-border/60">
                  {order.items?.map((item) => (
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
          {order.notes && (
            <Card className="bg-vynexa-surface border-vynexa-border">
              <CardHeader className="border-b border-vynexa-border pb-3">
                <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                  Order & Fulfillment Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-3">
                <p className="text-xs text-vynexa-text-secondary whitespace-pre-wrap leading-relaxed">
                  {order.notes}
                </p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Sidebar Financials Card */}
        <div className="space-y-6">
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                Order Financial Totals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-3 font-mono text-xs">
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Subtotal:</span>
                <span className="font-semibold text-vynexa-text-primary">{formatAmount(order.subtotal)}</span>
              </div>
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Discount:</span>
                <span className="text-amber-400">-{formatAmount(order.discount)}</span>
              </div>
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Tax:</span>
                <span className="text-vynexa-text-primary">+{formatAmount(order.tax)}</span>
              </div>
              <div className="flex justify-between text-base font-bold text-vynexa-text-primary pt-3 border-t border-vynexa-border">
                <span>Order Total:</span>
                <span className="text-primary">{formatAmount(order.total)}</span>
              </div>
              <span className="text-[10px] text-vynexa-text-muted block pt-1 italic text-right">
                Preserved historical pricing
              </span>
            </CardContent>
          </Card>

          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                Audit Timeline
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 font-mono text-xs text-vynexa-text-muted">
              <div>
                <span className="text-[10px] text-vynexa-text-secondary block">Created:</span>
                <span className="text-[11px]">{new Date(order.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-secondary block">Last Updated:</span>
                <span className="text-[11px]">{new Date(order.updatedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Cancel Confirmation Dialog */}
      <Dialog
        isOpen={isCancelOpen}
        onClose={() => setIsCancelOpen(false)}
        title="Cancel Commercial Order"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary">
            Provide a reason for cancelling Order <strong>#{order.orderNumber}</strong>.
          </p>
          <Textarea
            rows={3}
            placeholder="e.g. Client cancelled agreement, payment failed, contract renegotiation..."
            value={cancelReason}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setCancelReason(e.target.value)}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsCancelOpen(false)}
              disabled={actionLoading}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleCancel}
              disabled={actionLoading}
            >
              {actionLoading ? 'Cancelling...' : 'Confirm Cancellation'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
