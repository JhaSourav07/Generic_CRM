import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { quotesService } from '@/services/quotes.service';
import { ordersService } from '@/services/orders.service';
import { Quote } from '@/types/quotes.types';
import { Order } from '@/types/orders.types';
import { CreateQuoteModal } from '@/components/quotes/CreateQuoteModal';
import { FileText, ShoppingBag, Plus, ExternalLink } from 'lucide-react';

interface EntityQuotesOrdersCardProps {
  accountId?: string;
  opportunityId?: string;
}

export const EntityQuotesOrdersCard: React.FC<EntityQuotesOrdersCardProps> = ({
  accountId,
  opportunityId
}) => {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateQuoteOpen, setIsCreateQuoteOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!accountId && !opportunityId) return;
    try {
      setLoading(true);
      const [quotesRes, ordersRes] = await Promise.all([
        quotesService.getQuotes({ accountId, opportunityId, limit: 10 }),
        ordersService.getOrders({ accountId, opportunityId, limit: 10 })
      ]);
      setQuotes(quotesRes.quotes || []);
      setOrders(ordersRes.orders || []);
    } catch (_err) {
      // Non-blocking for entity page
    } finally {
      setLoading(false);
    }
  }, [accountId, opportunityId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const formatAmount = (amt?: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amt || 0);
  };

  return (
    <Card className="bg-vynexa-surface border-vynexa-border overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between border-b border-vynexa-border pb-3">
        <div className="flex items-center gap-2">
          <FileText className="h-4 w-4 text-vynexa-text-secondary" />
          <CardTitle className="text-base font-semibold text-vynexa-text-primary">
            Quotes & Orders ({quotes.length} / {orders.length})
          </CardTitle>
        </div>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setIsCreateQuoteOpen(true)}
          className="h-7 text-xs flex items-center gap-1.5"
        >
          <Plus className="h-3 w-3" />
          <span>New Quote</span>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {loading ? (
          <div className="p-4 space-y-2">
            <Skeleton className="h-10 w-full bg-vynexa-surface-secondary" />
            <Skeleton className="h-10 w-full bg-vynexa-surface-secondary" />
          </div>
        ) : quotes.length === 0 && orders.length === 0 ? (
          <div className="p-8 text-center space-y-2">
            <FileText className="h-8 w-8 text-vynexa-text-muted mx-auto opacity-40" />
            <p className="text-xs font-semibold text-vynexa-text-primary">No quotes or orders recorded</p>
            <p className="text-[11px] text-vynexa-text-muted max-w-sm mx-auto">
              Draft formal commercial proposals, manage line-item pricing, and track fulfillment orders.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-vynexa-border/60">
            {/* Quotes Section */}
            {quotes.length > 0 && (
              <div className="p-4 space-y-2">
                <span className="text-[10px] font-mono uppercase tracking-wider text-vynexa-text-muted block">
                  Proposals ({quotes.length})
                </span>
                <div className="space-y-1.5">
                  {quotes.map((q) => (
                    <div
                      key={q.id}
                      onClick={() => navigate(`/app/quotes/${q.id}`)}
                      className="p-2.5 rounded bg-vynexa-surface-secondary/40 border border-vynexa-border/50 hover:border-primary/40 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <FileText className="h-3.5 w-3.5 text-vynexa-text-muted group-hover:text-primary transition-colors" />
                        <div>
                          <span className="font-mono text-xs font-bold text-vynexa-text-primary">
                            {q.quoteNumber}
                          </span>
                          <span className="text-[11px] text-vynexa-text-muted block">
                            {q.items?.length || 0} line item(s) • {new Date(q.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={
                            q.status === 'APPROVED' ? 'emerald' : q.status === 'SENT' ? 'blue' : 'slate'
                          }
                          className="text-[10px]"
                        >
                          {q.status}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-vynexa-text-primary">
                          {formatAmount(q.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Orders Section */}
            {orders.length > 0 && (
              <div className="p-4 space-y-2 bg-vynexa-surface-secondary/20">
                <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 block flex items-center gap-1.5">
                  <ShoppingBag className="h-3 w-3" />
                  <span>Commercial Orders ({orders.length})</span>
                </span>
                <div className="space-y-1.5">
                  {orders.map((ord) => (
                    <div
                      key={ord.id}
                      onClick={() => navigate(`/app/orders/${ord.id}`)}
                      className="p-2.5 rounded bg-vynexa-surface-secondary/40 border border-vynexa-border/50 hover:border-emerald-500/40 transition-colors flex items-center justify-between cursor-pointer group"
                    >
                      <div className="flex items-center gap-3">
                        <ShoppingBag className="h-3.5 w-3.5 text-vynexa-text-muted group-hover:text-emerald-400 transition-colors" />
                        <div>
                          <span className="font-mono text-xs font-bold text-vynexa-text-primary">
                            #{ord.orderNumber}
                          </span>
                          <span className="text-[11px] text-vynexa-text-muted block">
                            {ord.items?.length || 0} item(s) • {new Date(ord.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge
                          variant={ord.status === 'COMPLETED' ? 'emerald' : 'blue'}
                          className="text-[10px]"
                        >
                          {ord.status}
                        </Badge>
                        <span className="font-mono text-xs font-bold text-vynexa-text-primary">
                          {formatAmount(ord.total)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>

      <CreateQuoteModal
        isOpen={isCreateQuoteOpen}
        onClose={() => setIsCreateQuoteOpen(false)}
        onSuccess={fetchData}
        initialAccountId={accountId}
        initialOpportunityId={opportunityId}
      />
    </Card>
  );
};
