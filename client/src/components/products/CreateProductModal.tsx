import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { productsService } from '@/services/products.service';
import { ProductType } from '@/types/products.types';
import { useToast } from '@/components/ui/toast';

const productSchema = z.object({
  name: z.string().min(1, 'Product name is required').max(255),
  sku: z.string().max(100).optional(),
  type: z.enum(['PRODUCT', 'SERVICE']),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  currency: z.string().min(1).default('USD'),
  description: z.string().max(2000).optional(),
  isActive: z.boolean().default(true)
});

type ProductFormData = z.infer<typeof productSchema>;

interface CreateProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateProductModal: React.FC<CreateProductModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: '',
      sku: '',
      type: 'PRODUCT',
      price: 0,
      currency: 'USD',
      description: '',
      isActive: true
    }
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      setLoading(true);
      await productsService.createProduct({
        ...data,
        sku: data.sku?.trim() ? data.sku.trim() : null,
        description: data.description?.trim() ? data.description.trim() : null
      });

      toast({
        type: 'success',
        title: 'Product Created',
        message: `Product '${data.name}' has been added to the catalog.`
      });

      reset();
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'Could not create product.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create Catalog Product" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
        <div>
          <label className="block text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
            Product Name *
          </label>
          <Input
            placeholder="e.g. Enterprise Cloud License"
            {...register('name')}
            error={errors.name?.message}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
              SKU (Stock Keeping Unit)
            </label>
            <Input
              placeholder="e.g. VYN-ENT-01"
              {...register('sku')}
              error={errors.sku?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
              Catalog Type *
            </label>
            <Select {...register('type')}>
              <option value="PRODUCT">Product (Physical/Digital Goods)</option>
              <option value="SERVICE">Service (Implementation, Consulting)</option>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
              Unit Price *
            </label>
            <Input
              type="number"
              step="0.01"
              placeholder="0.00"
              {...register('price')}
              error={errors.price?.message}
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
              Currency
            </label>
            <Input
              placeholder="USD"
              {...register('currency')}
              error={errors.currency?.message}
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-semibold text-vynexa-text-secondary uppercase tracking-wider mb-1">
            Description
          </label>
          <Textarea
            rows={3}
            placeholder="Commercial terms, deliverables, and package details..."
            {...register('description')}
          />
        </div>

        <div className="flex items-center gap-2 pt-2">
          <input
            type="checkbox"
            id="isActive"
            className="rounded border-vynexa-border bg-vynexa-surface-secondary text-primary focus:ring-0"
            {...register('isActive')}
          />
          <label htmlFor="isActive" className="text-xs font-medium text-vynexa-text-primary cursor-pointer">
            Active in catalog (can be added to commercial quotes)
          </label>
        </div>

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" disabled={loading}>
            {loading ? 'Creating Product...' : 'Save Product'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
