import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { PageHeader } from '@/components/ui/page-header';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog } from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { productsService } from '@/services/products.service';
import { Product } from '@/types/products.types';
import { EditProductModal } from '@/components/products/EditProductModal';
import {
  Package,
  ArrowLeft,
  Edit2,
  Trash2,
  Tag,
  DollarSign,
  Calendar,
  Layers,
  FileText,
  ShoppingBag,
  CheckCircle2,
  XCircle
} from 'lucide-react';

export const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const fetchProduct = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await productsService.getProductById(id);
      setProduct(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleDelete = async () => {
    if (!product) return;
    try {
      setDeleting(true);
      const res = await productsService.deleteProduct(product.id);
      toast({
        type: 'success',
        title: res.deactivated ? 'Product Deactivated' : 'Product Removed',
        message: res.message
      });
      navigate('/app/products');
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Action Failed',
        message: err.message || 'Could not delete/deactivate product.'
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatPrice = (val?: number, cur: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2
    }).format(val || 0);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-10 w-64 bg-vynexa-surface-secondary" />
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Skeleton className="h-64 col-span-2 bg-vynexa-surface-secondary" />
          <Skeleton className="h-64 bg-vynexa-surface-secondary" />
        </div>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="space-y-6 text-center py-16">
        <p className="text-red-400 text-sm mb-4">{error || 'Product not found'}</p>
        <Button variant="outline" onClick={() => navigate('/app/products')}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Back to Products Catalog
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title={product.name}
        description={`Catalog item SKU: ${product.sku || 'N/A'}`}
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Products', href: '/app/products' },
          { label: product.name }
        ]}
        actions={
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => navigate('/app/products')}
              className="flex items-center gap-1.5 text-xs"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back</span>
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsEditOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Edit2 className="h-3.5 w-3.5" />
              <span>Edit</span>
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={() => setIsDeleteOpen(true)}
              className="flex items-center gap-1.5 text-xs"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Remove</span>
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Main Details Card */}
        <Card className="md:col-span-2 bg-vynexa-surface border-vynexa-border">
          <CardHeader className="border-b border-vynexa-border pb-4">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base font-semibold text-vynexa-text-primary flex items-center gap-2">
                <Package className="h-4 w-4 text-vynexa-text-muted" />
                Product Specification
              </CardTitle>
              <Badge variant={product.isActive ? 'emerald' : 'red'}>
                {product.isActive ? 'Active in Catalog' : 'Inactive / Deactivated'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="pt-4 space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Catalog Type
                </span>
                <Badge variant={product.type === 'SERVICE' ? 'blue' : 'slate'} className="text-xs">
                  {product.type}
                </Badge>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  SKU Code
                </span>
                <span className="font-mono text-xs text-vynexa-text-primary">
                  {product.sku || 'None assigned'}
                </span>
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                Description & Deliverables
              </span>
              <p className="text-xs text-vynexa-text-secondary leading-relaxed bg-vynexa-surface-secondary/40 p-3 rounded border border-vynexa-border/40">
                {product.description || 'No detailed description provided for this catalog item.'}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-vynexa-border/60">
              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Unit Price
                </span>
                <span className="font-mono text-lg font-bold text-vynexa-text-primary">
                  {formatPrice(product.price, product.currency)}
                </span>
              </div>

              <div>
                <span className="text-[10px] font-mono text-vynexa-text-muted uppercase tracking-wider block mb-1">
                  Default Currency
                </span>
                <span className="font-mono text-xs text-vynexa-text-primary">
                  {product.currency}
                </span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Commercial Context & Metadata Card */}
        <div className="space-y-6">
          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                Commercial Activity
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <div className="flex items-center justify-between p-2.5 rounded bg-vynexa-surface-secondary/50 border border-vynexa-border/40">
                <div className="flex items-center gap-2">
                  <FileText className="h-4 w-4 text-vynexa-text-muted" />
                  <span className="text-xs text-vynexa-text-secondary">Quotes Included</span>
                </div>
                <span className="font-mono text-xs font-bold text-vynexa-text-primary">
                  {product._count?.quoteItems || 0}
                </span>
              </div>

              <div className="flex items-center justify-between p-2.5 rounded bg-vynexa-surface-secondary/50 border border-vynexa-border/40">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="h-4 w-4 text-vynexa-text-muted" />
                  <span className="text-xs text-vynexa-text-secondary">Orders Fulfilled</span>
                </div>
                <span className="font-mono text-xs font-bold text-vynexa-text-primary">
                  {product._count?.orderItems || 0}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-vynexa-surface border-vynexa-border">
            <CardHeader className="border-b border-vynexa-border pb-3">
              <CardTitle className="text-xs font-mono uppercase tracking-wider text-vynexa-text-muted">
                System Audit Metadata
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-4 space-y-2 text-xs font-mono text-vynexa-text-muted">
              <div>
                <span className="text-[10px] text-vynexa-text-secondary block">Record ID:</span>
                <span className="text-[11px] select-all truncate block">{product.id}</span>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-secondary block">Created:</span>
                <span className="text-[11px]">{new Date(product.createdAt).toLocaleString()}</span>
              </div>
              <div>
                <span className="text-[10px] text-vynexa-text-secondary block">Last Updated:</span>
                <span className="text-[11px]">{new Date(product.updatedAt).toLocaleString()}</span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {isEditOpen && (
        <EditProductModal
          isOpen={isEditOpen}
          product={product}
          onClose={() => setIsEditOpen(false)}
          onSuccess={fetchProduct}
        />
      )}

      {/* Delete/Deactivate Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        title="Remove Catalog Product"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to remove{' '}
            <strong className="text-vynexa-text-primary">{product.name}</strong>?
          </p>
          <div className="rounded border border-vynexa-border bg-vynexa-surface-secondary/60 p-3 text-[11px] text-vynexa-text-muted leading-relaxed">
            <span className="font-semibold text-vynexa-text-primary">Historical Protection Policy:</span> If this product is referenced by historical commercial quotes or orders, it will be safely deactivated (<code className="font-mono text-xs">isActive = false</code>) rather than physically deleted, maintaining full audit trail integrity.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? 'Removing...' : 'Confirm Remove'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
