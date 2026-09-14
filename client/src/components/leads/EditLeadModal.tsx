import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { leadsService } from '@/services/leads.service';
import { usersService } from '@/services/users.service';
import { UserItem } from '@/types/users.types';
import { Lead, LeadStatus } from '@/types/leads.types';
import { useToast } from '@/components/ui/toast';

const editLeadSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: z.enum(['NEW', 'QUALIFIED', 'ASSIGNED', 'CONTACTED', 'CONVERTED', 'LOST'] as const),
  score: z.number().int().min(0).max(100),
  notes: z.string().optional(),
  ownerId: z.string().optional()
});

type EditLeadFormData = z.infer<typeof editLeadSchema>;

interface EditLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditLeadModal: React.FC<EditLeadModalProps> = ({ isOpen, lead, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<EditLeadFormData>({
    resolver: zodResolver(editLeadSchema)
  });

  useEffect(() => {
    if (isOpen && lead) {
      reset({
        firstName: lead.firstName,
        lastName: lead.lastName,
        email: lead.email || '',
        phone: lead.phone || '',
        company: lead.company || '',
        jobTitle: lead.jobTitle || '',
        source: lead.source || '',
        status: lead.status,
        score: lead.score,
        notes: lead.notes || '',
        ownerId: lead.ownerId || ''
      });
      usersService.getUsers().then(res => setUsers(res.users)).catch(() => {});
    }
  }, [isOpen, lead, reset]);

  if (!lead) return null;

  const onSubmit = async (data: EditLeadFormData) => {
    try {
      setLoading(true);
      await leadsService.updateLead(lead.id, {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email || undefined,
        phone: data.phone || undefined,
        company: data.company || undefined,
        jobTitle: data.jobTitle || undefined,
        source: data.source || undefined,
        status: data.status as LeadStatus,
        score: Number(data.score),
        notes: data.notes || undefined,
        ownerId: data.ownerId || undefined
      });

      toast({
        type: 'success',
        title: 'Lead Updated',
        message: `Lead '${data.firstName} ${data.lastName}' updated successfully.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update Failed',
        message: err.message || 'An error occurred while updating lead.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Lead Details"
      description={`Update information for ${lead.firstName} ${lead.lastName}`}
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First Name *"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Last Name *"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email Address"
            type="email"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Phone Number"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company Name"
            {...register('company')}
            error={errors.company?.message}
          />
          <Input
            label="Job Title"
            {...register('jobTitle')}
            error={errors.jobTitle?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Lead Source"
            {...register('source')}
            error={errors.source?.message}
          />
          <Select
            label="Status"
            disabled={lead.status === 'CONVERTED'}
            options={[
              { value: 'NEW', label: 'New' },
              { value: 'QUALIFIED', label: 'Qualified' },
              { value: 'CONTACTED', label: 'Contacted' },
              { value: 'ASSIGNED', label: 'Assigned' },
              { value: 'CONVERTED', label: 'Converted' },
              { value: 'LOST', label: 'Lost' }
            ]}
            {...register('status')}
            error={errors.status?.message}
          />
          <Input
            label="Score (0-100)"
            type="number"
            min={0}
            max={100}
            {...register('score', { valueAsNumber: true })}
            error={errors.score?.message}
          />
        </div>

        <Select
          label="Assigned Owner"
          options={[
            { value: '', label: 'Unassigned (No Owner)' },
            ...users.map(u => ({ value: u.id, label: `${u.name} (${u.role.name})` }))
          ]}
          {...register('ownerId')}
          error={errors.ownerId?.message}
        />

        <Textarea
          label="Notes / Context"
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
