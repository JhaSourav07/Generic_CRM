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
import { Customer } from '@/types/customers.types';
import { Contact } from '@/types/contacts.types';
import { Pipeline, PipelineStage } from '@/types/opportunities.types';
import { UserItem } from '@/types/users.types';
import { useToast } from '@/components/ui/toast';

const createOpportunityFormSchema = z.object({
  name: z.string().trim().min(1, 'Opportunity name is required').max(200),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  pipelineId: z.string().min(1, 'Sales pipeline is required'),
  stageId: z.string().min(1, 'Pipeline stage is required'),
  value: z.coerce.number().min(0, 'Value must be non-negative'),
  probability: z.coerce.number().min(0).max(100, 'Probability must be between 0 and 100'),
  expectedCloseDate: z.string().optional(),
  ownerId: z.string().optional(),
  description: z.string().optional()
});

type CreateOpportunityFormData = z.infer<typeof createOpportunityFormSchema>;

interface CreateOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialAccountId?: string;
  initialContactId?: string;
  initialPipelineId?: string;
  initialStageId?: string;
}

export const CreateOpportunityModal: React.FC<CreateOpportunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialAccountId,
  initialContactId,
  initialPipelineId,
  initialStageId
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
  } = useForm<CreateOpportunityFormData>({
    resolver: zodResolver(createOpportunityFormSchema),
    defaultValues: {
      name: '',
      accountId: initialAccountId || '',
      contactId: initialContactId || '',
      pipelineId: '',
      stageId: '',
      value: 0,
      probability: 20,
      expectedCloseDate: '',
      ownerId: '',
      description: ''
    }
  });

  const selectedAccountId = watch('accountId');
  const selectedPipelineId = watch('pipelineId');

  useEffect(() => {
    if (isOpen) {
      // Fetch initial dropdown datasets
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

        const defaultPipe = pipeRes.find((p) => p.isDefault) || pipeRes[0];
        const pipeId = initialPipelineId || defaultPipe?.id || '';
        const stageId = initialStageId || defaultPipe?.stages?.[0]?.id || '';
        const initialProb = defaultPipe?.stages?.[0]?.probability
          ? Math.round(defaultPipe.stages[0].probability * 100)
          : 20;

        reset({
          name: '',
          accountId: initialAccountId || '',
          contactId: initialContactId || '',
          pipelineId: pipeId,
          stageId: stageId,
          value: 0,
          probability: initialProb,
          expectedCloseDate: '',
          ownerId: '',
          description: ''
        });
      });
    }
  }, [isOpen, reset, initialAccountId, initialContactId, initialPipelineId, initialStageId]);

  // Filter contacts dynamically by selected customer account
  const filteredContacts = selectedAccountId
    ? contacts.filter((c) => c.accountId === selectedAccountId)
    : contacts;

  // Selected pipeline's stages
  const currentPipeline = pipelines.find((p) => p.id === selectedPipelineId);
  const currentStages = currentPipeline?.stages || [];

  const handleStageChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const stageId = e.target.value;
    setValue('stageId', stageId);
    const stage = currentStages.find((s) => s.id === stageId);
    if (stage && stage.probability !== undefined) {
      setValue('probability', Math.round(stage.probability * 100));
    }
  };

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

  const onSubmit = async (data: CreateOpportunityFormData) => {
    try {
      setLoading(true);
      await opportunitiesService.createOpportunity({
        name: data.name,
        accountId: data.accountId || undefined,
        contactId: data.contactId || undefined,
        pipelineId: data.pipelineId,
        stageId: data.stageId,
        value: data.value,
        probability: data.probability / 100,
        expectedCloseDate: data.expectedCloseDate || undefined,
        ownerId: data.ownerId || undefined,
        description: data.description || undefined
      });

      toast({
        type: 'success',
        title: 'Opportunity Created',
        message: `Opportunity '${data.name}' has been created.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to Create Opportunity',
        message: err.message || 'An error occurred while creating the opportunity.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Create New Opportunity" maxWidth="lg">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        {/* Deal Name */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Opportunity Name <span className="text-vynexa-danger">*</span>
          </label>
          <Input
            {...register('name')}
            placeholder="e.g. Acme Corp Enterprise Expansion"
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary placeholder:text-vynexa-text-muted"
          />
          {errors.name && <p className="text-xs text-vynexa-danger mt-1">{errors.name.message}</p>}
        </div>

        {/* Customer Account & Contact */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Customer Account
            </label>
            <Select {...register('accountId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              <option value="">Select Account (Optional)</option>
              {customers.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Primary Contact
            </label>
            <Select {...register('contactId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              <option value="">Select Contact (Optional)</option>
              {filteredContacts.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.firstName} {c.lastName} {c.email ? `(${c.email})` : ''}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Pipeline & Stage */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Sales Pipeline <span className="text-vynexa-danger">*</span>
            </label>
            <Select
              value={selectedPipelineId}
              onChange={handlePipelineChange}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary"
            >
              {pipelines.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} {p.isDefault ? '(Default)' : ''}
                </option>
              ))}
            </Select>
            {errors.pipelineId && <p className="text-xs text-vynexa-danger mt-1">{errors.pipelineId.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Pipeline Stage <span className="text-vynexa-danger">*</span>
            </label>
            <Select
              value={watch('stageId')}
              onChange={handleStageChange}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary"
            >
              {currentStages.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({Math.round(s.probability * 100)}%)
                </option>
              ))}
            </Select>
            {errors.stageId && <p className="text-xs text-vynexa-danger mt-1">{errors.stageId.message}</p>}
          </div>
        </div>

        {/* Value & Probability */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Deal Value ($) <span className="text-vynexa-danger">*</span>
            </label>
            <Input
              type="number"
              step="0.01"
              min="0"
              {...register('value')}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary font-mono"
            />
            {errors.value && <p className="text-xs text-vynexa-danger mt-1">{errors.value.message}</p>}
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Win Probability (%)
            </label>
            <Input
              type="number"
              min="0"
              max="100"
              {...register('probability')}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary font-mono"
            />
            {errors.probability && <p className="text-xs text-vynexa-danger mt-1">{errors.probability.message}</p>}
          </div>
        </div>

        {/* Expected Close Date & Owner */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Expected Close Date
            </label>
            <Input
              type="date"
              {...register('expectedCloseDate')}
              className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary font-mono"
            />
            {errors.expectedCloseDate && (
              <p className="text-xs text-vynexa-danger mt-1">{errors.expectedCloseDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Deal Owner
            </label>
            <Select {...register('ownerId')} className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary">
              <option value="">Current User (Default)</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name} ({u.email})
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Description & Notes
          </label>
          <Textarea
            {...register('description')}
            placeholder="Deal context, key decision makers, scope, or timeline..."
            rows={3}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary placeholder:text-vynexa-text-muted text-xs"
          />
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Create Opportunity
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
