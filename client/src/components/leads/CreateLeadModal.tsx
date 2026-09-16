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
import { LeadStatus } from '@/types/leads.types';
import { useToast } from '@/components/ui/toast';

const createLeadSchema = z.object({
  firstName: z.string().trim().min(1, 'First name is required'),
  lastName: z.string().trim().min(1, 'Last name is required'),
  email: z.string().trim().email('Invalid email address').optional().or(z.literal('')),
  phone: z.string().trim().optional(),
  company: z.string().trim().optional(),
  jobTitle: z.string().trim().optional(),
  source: z.string().trim().optional(),
  status: z.enum(['NEW', 'QUALIFIED', 'ASSIGNED', 'CONTACTED', 'CONVERTED', 'LOST'] as const).default('NEW'),
  score: z.number().int().min(0).max(100).default(0),
  notes: z.string().optional(),
  ownerId: z.string().optional()
});

type CreateLeadFormData = z.infer<typeof createLeadSchema>;

interface CreateLeadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const CreateLeadModal: React.FC<CreateLeadModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<CreateLeadFormData>({
    resolver: zodResolver(createLeadSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      jobTitle: '',
      source: 'Inbound Webform',
      status: 'NEW',
      score: 0,
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

  const onSubmit = async (data: CreateLeadFormData) => {
    try {
      setLoading(true);
      await leadsService.createLead({
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
        title: 'Lead added',
        message: `Lead '${data.firstName} ${data.lastName}' added.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not add lead',
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
      title="Add lead"
      description="Enter details to add a new lead."
      maxWidth="lg"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="First name *"
            placeholder="e.g. Sarah"
            {...register('firstName')}
            error={errors.firstName?.message}
          />
          <Input
            label="Last name *"
            placeholder="e.g. Connor"
            {...register('lastName')}
            error={errors.lastName?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Email address"
            type="email"
            placeholder="sarah@acme.com"
            {...register('email')}
            error={errors.email?.message}
          />
          <Input
            label="Phone number"
            placeholder="+1 (555) 019-2834"
            {...register('phone')}
            error={errors.phone?.message}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Company name"
            placeholder="Acme Corporation"
            {...register('company')}
            error={errors.company?.message}
          />
          <Input
            label="Job title"
            placeholder="VP of Procurement"
            {...register('jobTitle')}
            error={errors.jobTitle?.message}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Input
            label="Lead source"
            placeholder="e.g. Website, Referral"
            {...register('source')}
            error={errors.source?.message}
          />
          <Select
            label="Status"
            options={[
              { value: 'NEW', label: 'New' },
              { value: 'QUALIFIED', label: 'Qualified' },
              { value: 'CONTACTED', label: 'Contacted' },
              { value: 'ASSIGNED', label: 'Assigned' }
            ]}
            {...register('status')}
            error={errors.status?.message}
          />
          <Input
            label="Lead score (0-100)"
            type="number"
            min={0}
            max={100}
            {...register('score', { valueAsNumber: true })}
            error={errors.score?.message}
          />
        </div>

        <Select
          label="Assigned to"
          options={[
            { value: '', label: 'Unassigned' },
            ...users.map(u => ({ value: u.id, label: `${u.name} (${u.role.name})` }))
          ]}
          {...register('ownerId')}
          error={errors.ownerId?.message}
        />

        <Textarea
          label="Notes"
          placeholder="Add any background notes or context..."
          rows={3}
          {...register('notes')}
          error={errors.notes?.message}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Add lead
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
