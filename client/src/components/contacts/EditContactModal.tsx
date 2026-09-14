import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Textarea } from '@/components/ui/textarea';
import { contactsService } from '@/services/contacts.service';
import { customersService } from '@/services/customers.service';
import { Customer } from '@/types/customers.types';
import { Contact } from '@/types/contacts.types';
import { useToast } from '@/components/ui/toast';

const editContactSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  department: z.string().trim().optional(),
  isPrimary: z.boolean().optional(),
  accountId: z.string().optional(),
  notes: z.string().optional()
});

type EditContactFormData = z.infer<typeof editContactSchema>;

interface EditContactModalProps {
  isOpen: boolean;
  contact: Contact | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditContactModal: React.FC<EditContactModalProps> = ({
  isOpen,
  contact,
  onClose,
  onSuccess
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditContactFormData>({
    resolver: zodResolver(editContactSchema)
  });

  const isPrimary = watch('isPrimary');

  useEffect(() => {
    if (isOpen && contact) {
      reset({
        firstName: contact.firstName || '',
        lastName: contact.lastName || '',
        email: contact.email || '',
        phone: contact.phone || '',
        jobTitle: contact.jobTitle || '',
        department: contact.department || '',
        isPrimary: contact.isPrimary || false,
        accountId: contact.accountId || '',
        notes: contact.notes || ''
      });
      customersService.getCustomers({ limit: 100 }).then(res => setCustomers(res.customers)).catch(() => {});
    }
  }, [isOpen, contact, reset]);

  const onSubmit = async (data: EditContactFormData) => {
    if (!contact) return;
    try {
      setLoading(true);
      await contactsService.updateContact(contact.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        jobTitle: data.jobTitle || undefined,
        department: data.department || undefined,
        isPrimary: data.isPrimary,
        accountId: data.accountId || undefined,
        notes: data.notes || undefined
      });

      toast({
        type: 'success',
        title: 'Contact Updated',
        message: `Contact '${data.firstName} ${data.lastName}' updated successfully.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'An unexpected error occurred while updating contact.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Contact"
      description="Update decision maker information and account association."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name *"
            placeholder="John"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name *"
            placeholder="Doe"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            placeholder="john.doe@acme.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Phone Number"
            placeholder="+1 (555) 019-2834"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Job Title"
            placeholder="VP of Engineering"
            {...register('jobTitle')}
            error={errors.jobTitle?.message}
          />
          <Input
            label="Department"
            placeholder="Engineering & IT"
            {...register('department')}
            error={errors.department?.message}
          />
        </div>

        <Select
          label="Associated Customer Company"
          options={[
            { value: '', label: 'None (Standalone Contact)' },
            ...customers.map(c => ({ value: c.id, label: c.name }))
          ]}
          {...register('accountId')}
          error={errors.accountId?.message}
        />

        <div className="pt-2">
          <Checkbox
            label="Primary Contact Person for Customer Company"
            checked={isPrimary}
            onCheckedChange={(checked) => setValue('isPrimary', checked)}
          />
        </div>

        <Textarea
          label="Notes / Overview"
          placeholder="Add background context, communication preferences, or background notes..."
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
