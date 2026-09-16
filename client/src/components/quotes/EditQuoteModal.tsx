import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { quotesService } from '@/services/quotes.service';
import { productsService } from '@/services/products.service';
import { customersService } from '@/services/customers.service';
import { opportunitiesService } from '@/services/opportunities.service';
import { Quote } from '@/types/quotes.types';
import { Product } from '@/types/products.types';
import { Customer } from '@/types/customers.types';
import { Opportunity } from '@/types/opportunities.types';
import { useToast } from '@/components/ui/toast';
import { Plus, Trash2 } from 'lucide-react';

interface LineItemDraft {
  productId: string | null;
  description: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  tax: number;
}

interface EditQuoteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  quote: Quote;
}

export const EditQuoteModal: React.FC<EditQuoteModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  quote
}) => {
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);

  const [accounts, setAccounts] = useState<Customer[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  const [accountId, setAccountId] = useState<string>(quote.accountId || '');
  const [opportunityId, setOpportunityId] = useState<string>(quote.opportunityId || '');
  const [validUntil, setValidUntil] = useState<string>(
    quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : ''
  );
  const [notes, setNotes] = useState<string>(quote.notes || '');

  const [items, setItems] = useState<LineItemDraft[]>(
    quote.items && quote.items.length > 0
      ? quote.items.map((it) => ({
          productId: it.productId,
          description: it.description,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
          discount: it.discount,
          tax: it.tax
        }))
      : [{ productId: null, description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }]
  );

  useEffect(() => {
    if (isOpen) {
      customersService.getCustomers({ limit: 100 }).then((res) => setAccounts(res.customers || [])).catch(() => {});
      opportunitiesService.getOpportunities({ limit: 100 }).then((res) => setOpportunities(res.opportunities || [])).catch(() => {});
      productsService.getProducts({ isActive: true, limit: 100 }).then((res) => setProducts(res.products || [])).catch(() => {});

      setAccountId(quote.accountId || '');
      setOpportunityId(quote.opportunityId || '');
      setValidUntil(quote.validUntil ? new Date(quote.validUntil).toISOString().split('T')[0] : '');
      setNotes(quote.notes || '');
      if (quote.items && quote.items.length > 0) {
        setItems(
          quote.items.map((it) => ({
            productId: it.productId,
            description: it.description,
            quantity: it.quantity,
            unitPrice: it.unitPrice,
            discount: it.discount,
            tax: it.tax
          }))
        );
      }
    }
  }, [isOpen, quote]);

  const handleProductSelect = (index: number, prodId: string) => {
    const updated = [...items];
    if (!prodId) {
      updated[index] = { ...updated[index], productId: null };
    } else {
      const found = products.find((p) => p.id === prodId);
      if (found) {
        updated[index] = {
          ...updated[index],
          productId: found.id,
          description: found.name,
          unitPrice: found.price
        };
      }
    }
    setItems(updated);
  };

  const handleItemChange = (index: number, field: keyof LineItemDraft, val: any) => {
    const updated = [...items];
    updated[index] = { ...updated[index], [field]: val };
    setItems(updated);
  };

  const addItem = () => {
    setItems([
      ...items,
      { productId: null, description: '', quantity: 1, unitPrice: 0, discount: 0, tax: 0 }
    ]);
  };

  const removeItem = (index: number) => {
    if (items.length <= 1) {
      toast({ type: 'warning', title: 'Cannot Remove', message: 'Quote must have at least one line item.' });
      return;
    }
    setItems(items.filter((_, i) => i !== index));
  };

  const calculatePreview = () => {
    let subtotal = 0;
    let discount = 0;
    let tax = 0;

    items.forEach((it) => {
      const lineSubtotal = (Number(it.quantity) || 0) * (Number(it.unitPrice) || 0);
      const lineDiscount = Math.min(Number(it.discount) || 0, lineSubtotal);
      const lineTax = Number(it.tax) || 0;

      subtotal += lineSubtotal;
      discount += lineDiscount;
      tax += lineTax;
    });

    const total = Math.max(0, subtotal - discount + tax);
    return { subtotal, discount, tax, total };
  };

  const preview = calculatePreview();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      setLoading(true);
      await quotesService.updateQuote(quote.id, {
        accountId: accountId || null,
        opportunityId: opportunityId || null,
        validUntil: validUntil || null,
        notes: notes.trim() ? notes.trim() : null,
        items: items.map((it) => ({
          productId: it.productId || null,
          description: it.description.trim(),
          quantity: Number(it.quantity),
          unitPrice: Number(it.unitPrice),
          discount: Number(it.discount) || 0,
          tax: Number(it.tax) || 0
        }))
      });

      toast({
        type: 'success',
        title: 'Quote updated',
        message: 'Quote updated successfully.'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not update quote',
        message: err.message || 'Could not update quote.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title={`Edit quote #${quote.quoteNumber}`} maxWidth="lg">
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Customer
            </label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)}>
              <option value="">Select customer (optional)</option>
              {accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {acc.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Deal
            </label>
            <Select value={opportunityId} onChange={(e) => setOpportunityId(e.target.value)}>
              <option value="">Select deal (optional)</option>
              {opportunities.map((opp) => (
                <option key={opp.id} value={opp.id}>
                  {opp.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Valid until
            </label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
        </div>

        {/* Line Items Editor */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between border-b border-vynexa-border pb-2">
            <span className="text-xs font-semibold text-vynexa-text-primary">
              Line items
            </span>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="h-7 text-xs flex items-center gap-1"
            >
              <Plus className="h-3 w-3" />
              <span>Add item</span>
            </Button>
          </div>

          <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
            {items.map((it, idx) => (
              <div
                key={idx}
                className="p-3 rounded-md bg-vynexa-surface-secondary/40 border border-vynexa-border/60 space-y-2"
              >
                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-12 md:col-span-4">
                    <label className="block text-[10px] text-vynexa-text-muted mb-0.5">Product / service</label>
                    <Select
                      value={it.productId || ''}
                      onChange={(e) => handleProductSelect(idx, e.target.value)}
                      className="h-8 text-xs"
                    >
                      <option value="">Custom item</option>
                      {products.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} ({p.sku || 'No SKU'}) — ${p.price}
                        </option>
                      ))}
                    </Select>
                  </div>

                  <div className="col-span-12 md:col-span-8">
                    <label className="block text-[10px] text-vynexa-text-muted mb-0.5">Description *</label>
                    <Input
                      placeholder="Item description or service details..."
                      value={it.description}
                      onChange={(e) => handleItemChange(idx, 'description', e.target.value)}
                      className="h-8 text-xs"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-12 gap-2 items-center">
                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-[10px] text-vynexa-text-muted mb-0.5">Quantity</label>
                    <Input
                      type="number"
                      min="1"
                      value={it.quantity}
                      onChange={(e) => handleItemChange(idx, 'quantity', Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-3">
                    <label className="block text-[10px] text-vynexa-text-muted mb-0.5">Unit price ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.unitPrice}
                      onChange={(e) => handleItemChange(idx, 'unitPrice', Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-[10px] text-vynexa-text-muted mb-0.5">Discount ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.discount}
                      onChange={(e) => handleItemChange(idx, 'discount', Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-6 md:col-span-2">
                    <label className="block text-[10px] text-vynexa-text-muted mb-0.5">Tax ($)</label>
                    <Input
                      type="number"
                      step="0.01"
                      min="0"
                      value={it.tax}
                      onChange={(e) => handleItemChange(idx, 'tax', Number(e.target.value))}
                      className="h-8 text-xs font-mono"
                    />
                  </div>

                  <div className="col-span-10 md:col-span-2 text-right font-mono text-xs">
                    <span className="block text-[10px] text-vynexa-text-muted">Total</span>
                    <span className="font-semibold text-vynexa-text-primary">
                      ${Math.max(0, it.quantity * it.unitPrice - (it.discount || 0) + (it.tax || 0)).toFixed(2)}
                    </span>
                  </div>

                  <div className="col-span-2 md:col-span-1 text-right">
                    <label className="block text-[10px] opacity-0 mb-0.5">Del</label>
                    <button
                      type="button"
                      onClick={() => removeItem(idx)}
                      className="p-1.5 text-vynexa-text-muted hover:text-red-400 rounded transition-colors"
                      title="Remove item"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Totals Preview */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2 border-t border-vynexa-border">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Terms & notes
            </label>
            <Textarea
              rows={3}
              placeholder="Payment terms, delivery details, or notes for the customer..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>

          <div className="bg-vynexa-surface-secondary/60 p-3 rounded-md border border-vynexa-border/60 flex flex-col justify-between">
            <div className="space-y-1.5 font-mono text-xs">
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Subtotal:</span>
                <span>${preview.subtotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Discount:</span>
                <span>-${preview.discount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-vynexa-text-secondary">
                <span>Tax:</span>
                <span>+${preview.tax.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-vynexa-text-primary pt-2 border-t border-vynexa-border">
                <span>Total:</span>
                <span className="text-primary">${preview.total.toFixed(2)}</span>
              </div>
            </div>
            <span className="text-[10px] text-vynexa-text-muted mt-2 block">
              * Final totals will be confirmed upon saving.
            </span>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Saving...' : 'Save changes'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
