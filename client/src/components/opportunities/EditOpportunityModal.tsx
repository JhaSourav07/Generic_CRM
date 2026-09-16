import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { opportunitiesService } from '@/services/opportunities.service';
import { customersService } from '@/services/customers.service';
import { contactsService } from '@/services/contacts.service';
import { usersService } from '@/services/users.service';
import { Opportunity, Pipeline } from '@/types/opportunities.types';
import { Customer } from '@/types/customers.types';
import { Contact } from '@/types/contacts.types';
import { UserItem } from '@/types/users.types';
import { useToast } from '@/components/ui/toast';

const editOpportunityFormSchema = z.object({
  name: z.string().trim().min(1, 'Opportunity name is required').max(200),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  pipelineId: z.string().min(1, 'Pipeline is required'),
  stageId: z.string().min(1, 'Stage is required'),
  value: z.coerce.number().min(0, 'Value must be non-negative'),
  probability: z.coerce.number().min(0).max(100, 'Probability must be between 0 and 100'),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().optional(),
  description: z.string().optional()
});

type EditOpportunityFormData = z.infer<typeof editOpportunityFormSchema>;

interface EditOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: Opportunity | null;
}

export const EditOpportunityModal: React.FC<EditOpportunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors }
  } = useForm<EditOpportunityFormData>({
    resolver: zodResolver(editOpportunityFormSchema)
  });

  const selectedAccountId = watch('accountId');
  const selectedPipelineId = watch('pipelineId');

  useEffect(() => {
    if (isOpen && opportunity) {
      Promise.all([
        customersService.getCustomers({ limit: 100 }).catch(() => ({ customers: [] })),
        contactsService.getContacts({ limit: 100 }).catch(() => ({ contacts: [] })),
        opportunitiesService.getPipelines().catch(() => []),
        usersService.getUsers().catch(() => ({ users: [] }))
      ]).then(([custRes, contactRes, pipeRes, userRes]) => {
        setCustomers(custRes.customers || []);
        setContacts(contactRes.contacts || []);
        setPipelines(pipeRes || []);
        setUsers(userRes.users || []);

        const closeDateStr = opportunity.expectedCloseDate
          ? new Date(opportunity.expectedCloseDate).toISOString().split('T')[0]
          : '';

        reset({
          name: opportunity.name,
          accountId: opportunity.accountId || '',
          contactId: opportunity.contactId || '',
          pipelineId: opportunity.pipelineId,
          stageId: opportunity.stageId,
          value: Number(opportunity.value || 0),
          probability: Math.round((opportunity.probability || 0) * 100),
          expectedCloseDate: closeDateStr,
          ownerId: opportunity.ownerId || '',
          description: opportunity.description || ''
        });
      });
    }
  }, [isOpen, opportunity, reset]);

  const filteredContacts = selectedAccountId
    ? contacts.filter((c) => c.accountId === selectedAccountId)
    : contacts;

  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const currentStages = currentPipeline?.stages || [];

  const handlePipelineChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const pipeId = e.target.value;
    setValue('pipelineId', pipeId);
    const pipe = pipelines.find((p) => p.id === pipeId);
    if (pipe && pipe.stages.length > 0) {
      setValue('stageId', pipe.stages[0].id);
      if (pipe.stages[0].probability !== undefined) {
        setValue('probability', Math.round(pipe.stages[0].probability * 100));
      }
    }
  };

  const onSubmit = async (data: EditOpportunityFormData) => {
    if (!opportunity) return;
    try {
      setLoading(true);
      await opportunitiesService.updateOpportunity(opportunity.id, {
        name: data.name,
        accountId: data.accountId || null,
        contactId: data.contactId || null,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        value: data.value,
        probability: data.probability / 100,
        expectedCloseDate: data.expectedCloseDate || null,
        ownerId: data.ownerId || null,
        description: data.description || null
      });

      toast({
        type: 'success',
        title: 'Deal updated',
        message: `Deal '${data.name}' updated successfully.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Update failed',
        message: err.message || 'Failed to update deal.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit deal" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Deal name <span className="text-vynexa-danger">*</span>
          </label>
          <Input
            {...register('name')}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary"
          />
          {errors.name && <p className="text-xs text-vynexa-danger mt-1">{errors.name.message}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Customer
            </label>
            <Select {...register('accountId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              <option value="">Select customer (optional)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Contact person
            </label>
            <Select {...register('contactId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              <option value="">Select contact (optional)</option>
              {filteredContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Pipeline
            </label>
            <Select
              value={selectedPipelineId}
              onChange={handlePipelineChange}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Stage
            </label>
            <Select {...register('stageId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              {currentStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({Math.round(s.probability * 100)}%)
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Value ($)
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('value')}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Win probability (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              {...register('probability')}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary font-mono"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Target close date
            </label>
            <Input
              type="date"
              {...register('expectedCloseDate')}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary font-mono"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Assigned to
            </label>
            <Select {...register('ownerId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Notes
          </label>
          <Textarea
            {...register('description')}
            rows={3}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Save changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
