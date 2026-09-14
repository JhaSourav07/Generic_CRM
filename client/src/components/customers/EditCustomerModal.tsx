import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { customersService } from '@/services/customers.service';
import { usersService } from '@/services/users.service';
import { UserItem } from '@/types/users.types';
import { Customer } from '@/types/customers.types';
import { useToast } from '@/components/ui/toast';

const editCustomerSchema = z.object({
  name: z.string().trim().min(1, 'Customer name is required'),
  industry: z.string().trim().optional(),
  website: z.string().trim().optional(),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  address: z.string().trim().optional(),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  country: z.string().trim().optional(),
  postalCode: z.string().trim().optional(),
  status: z.string().optional(),
  notes: z.string().optional(),
  ownerId: z.string().optional()
});

type EditCustomerFormData = z.infer<typeof editCustomerSchema>;

interface EditCustomerModalProps {
  isOpen: boolean;
  customer: Customer | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditCustomerModal: React.FC<EditCustomerModalProps> = ({ isOpen, customer, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditCustomerFormData>({
    resolver: zodResolver(editCustomerSchema)
  });

  useEffect(() => {
    if (isOpen && customer) {
      reset({
        name: customer.name,
        industry: customer.industry || '',
        website: customer.website || '',
        email: customer.email || '',
        phone: customer.phone || '',
        address: customer.address || '',
        city: customer.city || '',
        state: customer.state || '',
        country: customer.country || '',
        postalCode: customer.postalCode || '',
        status: customer.status || 'ACTIVE',
        notes: customer.notes || '',
        ownerId: customer.ownerId || ''
      });
      usersService.getUsers().then(res => setUsers(res.users)).catch(() => {});
    }
  }, [isOpen, customer, reset]);

  if (!customer) return null;

  const onSubmit = async (data: EditCustomerFormData) => {
    try {
      setLoading(true);
      await customersService.updateCustomer(customer.id, {
        name: data.name,
        industry: data.industry || undefined,
        website: data.website || undefined,
        email: data.email || undefined,
        phone: data.phone || undefined,
        address: data.address || undefined,
        city: data.city || undefined,
        state: data.state || undefined,
        country: data.country || undefined,
        postalCode: data.postalCode || undefined,
        status: (data.status as any) || 'active',
        notes: data.notes || undefined,
        ownerId: data.ownerId || undefined
      });

      toast({
        type: 'success',
        title: 'Customer Updated',
        message: `Customer '${data.name}' updated successfully.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'An error occurred while updating customer account.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Customer Account"
      description={`Update information for customer '${customer.name}'`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Customer Name *"
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Industry / Sector"
            {...register('industry')}
            error={errors.industry?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Corporate Email"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Main Phone"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Website URL"
            {...register('website')}
            error={errors.website?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            {...register('city')}
            error={errors.city?.message}
          />
          <Input
            label="State / Province"
            {...register('state')}
            error={errors.state?.message}
          />
          <Input
            label="Country"
            {...register('country')}
            error={errors.country?.message}
          />
        </div>

        <Select
          label="Account Owner"
          options={[
            { value: '', label: 'Select an owner...' },
            ...users.map(u => ({ value: u.id, label: `${u.name} (${u.role.name})` }))
          ]}
          {...register('ownerId')}
          error={errors.ownerId?.message}
        />

        <Textarea
          label="Notes / Overview"
          rows={3}
          {...register('notes')}
          error={errors.notes?.message}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
