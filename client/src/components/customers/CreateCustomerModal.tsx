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
import { useToast } from '@/components/ui/toast';

const createCustomerSchema = z.object({
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
  status: z.string().optional().default('ACTIVE'),
  notes: z.string().optional(),
  ownerId: z.string().optional()
});

type CreateCustomerFormData = z.infer<typeof createCustomerSchema>;

interface CreateCustomerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateCustomerModal: React.FC<CreateCustomerModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateCustomerFormData>({
    resolver: zodResolver(createCustomerSchema),
    defaultValues: {
      name: '',
      industry: '',
      website: '',
      email: '',
      phone: '',
      address: '',
      city: '',
      state: '',
      country: '',
      postalCode: '',
      status: 'ACTIVE',
      notes: '',
      ownerId: ''
    }
  });

  useEffect(() => {
    if (isOpen) {
      reset();
      usersService.getUsers().then(res => setUsers(res.users)).catch(() => {});
    }
  }, [isOpen, reset]);

  const onSubmit = async (data: CreateCustomerFormData) => {
    try {
      setLoading(true);
      await customersService.createCustomer({
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
        title: 'Customer Account Created',
        message: `Customer '${data.name}' created successfully.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Creation Failed',
        message: err.message || 'An unexpected error occurred.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create New Customer Account"
      description="Add a new customer organization record to your enterprise CRM database."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Customer Name *"
            placeholder="Acme Global Inc."
            {...register('name')}
            error={errors.name?.message}
          />
          <Input
            label="Industry / Sector"
            placeholder="e.g. Technology, Healthcare"
            {...register('industry')}
            error={errors.industry?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Corporate Email"
            type="email"
            placeholder="info@acme.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Main Phone"
            placeholder="+1 (555) 019-2834"
            {...register('phone')}
            error={errors.phone?.message}
          />
          <Input
            label="Website URL"
            placeholder="https://acme.com"
            {...register('website')}
            error={errors.website?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="City"
            placeholder="San Francisco"
            {...register('city')}
            error={errors.city?.message}
          />
          <Input
            label="State / Province"
            placeholder="CA"
            {...register('state')}
            error={errors.state?.message}
          />
          <Input
            label="Country"
            placeholder="United States"
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
          placeholder="Add relationship history, contract context, or corporate profile background..."
          rows={3}
          {...register('notes')}
          error={errors.notes?.message}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Create Customer
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
