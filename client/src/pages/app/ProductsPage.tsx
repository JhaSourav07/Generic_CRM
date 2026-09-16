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
import { productsService } from '@/services/products.service';
import { Product, ProductType } from '@/types/products.types';
import { CreateProductModal } from '@/components/products/CreateProductModal';
import { EditProductModal } from '@/components/products/EditProductModal';
import {
  Package,
  Plus,
  Search,
  Tag,
  DollarSign,
  Layers,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  XCircle,
  ExternalLink
} from 'lucide-react';

export const ProductsPage: React.FC = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Pagination & Filtering
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('');
  const [activeFilter, setActiveFilter] = useState<string>('');
  const [sortBy, setSortBy] = useState<'name' | 'price' | 'createdAt' | 'sku'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [selectedForEdit, setSelectedForEdit] = useState<Product | null>(null);
  const [selectedForDelete, setSelectedForDelete] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await productsService.getProducts({
        page,
        limit,
        search: search.trim() ? search.trim() : undefined,
        type: (typeFilter as ProductType) || undefined,
        isActive: activeFilter === '' ? undefined : activeFilter === 'true',
        sortBy,
        sortOrder
      });

      setProducts(res.products);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err: any) {
      setError(err.message || 'Failed to load products');
    } finally {
      setLoading(false);
    }
  }, [page, limit, search, typeFilter, activeFilter, sortBy, sortOrder]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const handleDelete = async () => {
    if (!selectedForDelete) return;
    try {
      setDeleting(true);
      const res = await productsService.deleteProduct(selectedForDelete.id);
      toast({
        type: 'success',
        title: res.deactivated ? 'Product Deactivated' : 'Product Deleted',
        message: res.message
      });
      setSelectedForDelete(null);
      fetchProducts();
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

  const formatPrice = (val: number, cur: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: cur,
      minimumFractionDigits: 2
    }).format(val);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Products"
        description="Manage products, services, and pricing for your sales quotes."
        breadcrumbs={[
          { label: 'Application', href: '/app/dashboard' },
          { label: 'Products' }
        ]}
        actions={
          <Button
            variant="primary"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            <span>Add product</span>
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
                placeholder="Search products by name, SKU, or description..."
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
                className="pl-9 h-9 text-xs"
              />
            </div>

            <Select
              value={typeFilter}
              onChange={(e) => {
                setTypeFilter(e.target.value);
                setPage(1);
              }}
              className="w-36 shrink-0 h-9 text-xs"
            >
              <option value="">All types</option>
              <option value="PRODUCT">Products</option>
              <option value="SERVICE">Services</option>
            </Select>

            <Select
              value={activeFilter}
              onChange={(e) => {
                setActiveFilter(e.target.value);
                setPage(1);
              }}
              className="w-36 shrink-0 h-9 text-xs"
            >
              <option value="">All statuses</option>
              <option value="true">Active only</option>
              <option value="false">Inactive only</option>
            </Select>
          </div>

          <div className="flex items-center gap-2 shrink-0 self-end md:self-auto">
            <span className="text-xs text-vynexa-text-muted whitespace-nowrap">Sort:</span>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="w-32 shrink-0 h-9 text-xs"
            >
              <option value="createdAt">Date created</option>
              <option value="name">Name</option>
              <option value="price">Price</option>
              <option value="sku">SKU</option>
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

      {/* Products Table Card */}
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
            <Button variant="outline" size="sm" onClick={fetchProducts}>
              Retry
            </Button>
          </div>
        ) : products.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <Package className="h-10 w-10 mx-auto text-vynexa-text-muted opacity-40" />
            <h3 className="text-sm font-semibold text-vynexa-text-primary">No products found</h3>
            <p className="text-xs text-vynexa-text-secondary max-w-sm mx-auto">
              {search || typeFilter || activeFilter
                ? 'No items match your search or filters.'
                : 'Add your first product or service.'}
            </p>
            {!search && !typeFilter && !activeFilter && (
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateOpen(true)}
                className="mt-2"
              >
                <Plus className="h-3.5 w-3.5 mr-1" />
                Add product
              </Button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-vynexa-border bg-vynexa-surface-secondary/50 text-vynexa-text-muted uppercase tracking-wider font-mono text-[10px]">
                  <th className="py-3 px-4">Product name</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Type</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Created</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-vynexa-border/60">
                {products.map((prod) => (
                  <tr
                    key={prod.id}
                    className="hover:bg-vynexa-surface-secondary/40 transition-colors group cursor-pointer"
                    onClick={() => navigate(`/app/products/${prod.id}`)}
                  >
                    <td className="py-3 px-4 font-medium text-vynexa-text-primary">
                      <div className="flex flex-col">
                        <span className="font-semibold text-vynexa-text-primary group-hover:text-primary transition-colors">
                          {prod.name}
                        </span>
                        {prod.description && (
                          <span className="text-[11px] text-vynexa-text-muted truncate max-w-md">
                            {prod.description}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 font-mono text-vynexa-text-secondary text-[11px]">
                      {prod.sku || '—'}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={prod.type === 'SERVICE' ? 'blue' : 'slate'} className="text-[10px]">
                        {prod.type}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono font-medium text-vynexa-text-primary text-[12px]">
                      {formatPrice(prod.price, prod.currency)}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={prod.isActive ? 'emerald' : 'red'} className="text-[10px]">
                        {prod.isActive ? 'Active' : 'Inactive'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 font-mono text-vynexa-text-muted text-[11px]">
                      {new Date(prod.createdAt).toLocaleDateString()}
                    </td>
                    <td
                      className="py-3 px-4 text-right"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => setSelectedForEdit(prod)}
                          className="p-1 rounded text-vynexa-text-muted hover:text-vynexa-text-primary hover:bg-vynexa-surface-secondary transition-colors"
                          title="Edit product"
                        >
                          <Edit2 className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setSelectedForDelete(prod)}
                          className="p-1 rounded text-vynexa-text-muted hover:text-red-400 hover:bg-vynexa-surface-secondary transition-colors"
                          title="Delete product"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Footer */}
        {!loading && products.length > 0 && (
          <div className="p-3 border-t border-vynexa-border flex items-center justify-between text-xs text-vynexa-text-muted">
            <span className="font-mono">
              Showing {(page - 1) * limit + 1}–{Math.min(page * limit, totalCount)} of {totalCount} items
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

      {/* Modals */}
      <CreateProductModal
        isOpen={isCreateOpen}
        onClose={() => setIsCreateOpen(false)}
        onSuccess={fetchProducts}
      />

      {selectedForEdit && (
        <EditProductModal
          isOpen={true}
          product={selectedForEdit}
          onClose={() => setSelectedForEdit(null)}
          onSuccess={fetchProducts}
        />
      )}

      {/* Delete / Deactivate Confirmation Dialog */}
      <Dialog
        isOpen={!!selectedForDelete}
        onClose={() => setSelectedForDelete(null)}
        title="Delete product"
        maxWidth="sm"
      >
        <div className="space-y-4 pt-2">
          <p className="text-xs text-vynexa-text-secondary leading-relaxed">
            Are you sure you want to delete{' '}
            <strong className="text-vynexa-text-primary">{selectedForDelete?.name}</strong>?
          </p>
          <div className="rounded border border-vynexa-border bg-vynexa-surface-secondary/60 p-3 text-[11px] text-vynexa-text-muted leading-relaxed">
            If this product is linked to past quotes or orders, it will be deactivated rather than deleted so your sales records remain accurate.
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedForDelete(null)}
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
              {deleting ? 'Deleting...' : 'Delete product'}
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
