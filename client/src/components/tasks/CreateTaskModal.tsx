import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { tasksService } from '@/services/tasks.service';
import { customersService } from '@/services/customers.service';
import { contactsService } from '@/services/contacts.service';
import { opportunitiesService } from '@/services/opportunities.service';
import { leadsService } from '@/services/leads.service';
import { usersService } from '@/services/users.service';
import { Customer } from '@/types/customers.types';
import { Contact } from '@/types/contacts.types';
import { Opportunity } from '@/types/opportunities.types';
import { Lead } from '@/types/leads.types';
import { UserItem } from '@/types/users.types';
import { TaskPriority, TaskStatus } from '@/types/tasks.types';
import { useToast } from '@/components/ui/toast';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']).default('TODO'),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional(),
  targetKind: z.enum(['ACCOUNT', 'LEAD']).default('ACCOUNT'),
  leadId: z.string().optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CreateTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string;
  initialAccountId?: string;
  initialContactId?: string;
  initialOpportunityId?: string;
  defaultPriority?: TaskPriority;
  defaultDueDate?: string;
}

export const CreateTaskModal: React.FC<CreateTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLeadId,
  initialAccountId,
  initialContactId,
  initialOpportunityId,
  defaultPriority = 'MEDIUM',
  defaultDueDate
}) => {
  const [loading, setLoading] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const tomorrowStr = defaultDueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: defaultPriority,
      status: 'TODO',
      dueDate: tomorrowStr,
      assignedToId: '',
      targetKind: initialLeadId ? 'LEAD' : 'ACCOUNT',
      leadId: initialLeadId || '',
      accountId: initialAccountId || '',
      contactId: initialContactId || '',
      opportunityId: initialOpportunityId || ''
    }
  });

  const selectedTargetKind = watch('targetKind');
  const selectedAccountId = watch('accountId');

  useEffect(() => {
    if (!isOpen) return;

    reset({
      title: '',
      description: '',
      priority: defaultPriority,
      status: 'TODO',
      dueDate: defaultDueDate || new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
      assignedToId: '',
      targetKind: initialLeadId ? 'LEAD' : 'ACCOUNT',
      leadId: initialLeadId || '',
      accountId: initialAccountId || '',
      contactId: initialContactId || '',
      opportunityId: initialOpportunityId || ''
    });

    const loadData = async () => {
      try {
        const [accRes, leadRes, userRes] = await Promise.all([
          customersService.getCustomers({ limit: 100 }),
          leadsService.getLeads({ limit: 100, status: 'QUALIFIED' }),
          usersService.getUsers({ limit: 100, isActive: true })
        ]);
        setCustomers(accRes.customers || []);
        setLeads(leadRes.leads || []);
        setUsers(userRes.users || []);
      } catch (err) {
        console.error('Failed to load form dropdown data', err);
      }
    };
    loadData();
  }, [isOpen, initialLeadId, initialAccountId, initialContactId, initialOpportunityId, defaultPriority, defaultDueDate, reset]);

  // When account changes, load related contacts & deals
  useEffect(() => {
    if (!selectedAccountId) {
      setContacts([]);
      setOpportunities([]);
      return;
    }

    const loadAccountRelations = async () => {
      try {
        const [contactRes, oppRes] = await Promise.all([
          contactsService.getContacts({ accountId: selectedAccountId, limit: 100 }),
          opportunitiesService.getOpportunities({ accountId: selectedAccountId, limit: 100 })
        ]);
        setContacts(contactRes.contacts || []);
        setOpportunities(oppRes.opportunities || []);
      } catch (err) {
        console.error('Failed to load account relations', err);
      }
    };
    loadAccountRelations();
  }, [selectedAccountId]);

  const onSubmit = async (data: FormValues) => {
    try {
      setLoading(true);

      const isLead = data.targetKind === 'LEAD';

      await tasksService.createTask({
        title: data.title,
        description: data.description || null,
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        assignedToId: data.assignedToId || null,
        leadId: isLead ? (data.leadId || null) : null,
        accountId: !isLead ? (data.accountId || null) : null,
        contactId: !isLead ? (data.contactId || null) : null,
        opportunityId: !isLead ? (data.opportunityId || null) : null
      });

      toast({
        type: 'success',
        title: 'Task created',
        message: `'${data.title}' added to tasks.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not create task',
        message: err.message || 'An error occurred while creating the task.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Add task" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Task title *
          </label>
          <Input
            {...register('title')}
            placeholder="e.g. Follow up regarding contract"
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
          {errors.title && (
            <p className="text-vynexa-danger text-[11px] mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Priority & Due Date & Assignee */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Priority *
            </label>
            <Select
              {...register('priority')}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
            >
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Due date
            </label>
            <Input
              type="date"
              {...register('dueDate')}
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Assigned to
            </label>
            <Select
              {...register('assignedToId')}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
            >
              <option value="">Unassigned</option>
              {users.map((u) => (
                <option key={u.id} value={u.id}>
                  {u.name}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {/* Target Kind: Account vs Lead */}
        {!initialLeadId && !initialAccountId && (
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Link to
            </label>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 cursor-pointer text-vynexa-text-secondary">
                <input
                  type="radio"
                  value="ACCOUNT"
                  checked={selectedTargetKind === 'ACCOUNT'}
                  onChange={() => setValue('targetKind', 'ACCOUNT')}
                  className="text-vynexa-blue focus:ring-0"
                />
                Customer, contact, or deal
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-vynexa-text-secondary">
                <input
                  type="radio"
                  value="LEAD"
                  checked={selectedTargetKind === 'LEAD'}
                  onChange={() => setValue('targetKind', 'LEAD')}
                  className="text-vynexa-blue focus:ring-0"
                />
                Lead
              </label>
            </div>
          </div>
        )}

        {/* Lead Selector */}
        {selectedTargetKind === 'LEAD' ? (
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Lead
            </label>
            <Select
              {...register('leadId')}
              disabled={Boolean(initialLeadId)}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
            >
              <option value="">Select a lead...</option>
              {leads.map((l) => (
                <option key={l.id} value={l.id}>
                  {l.firstName} {l.lastName} {l.company ? `(${l.company})` : ''}
                </option>
              ))}
            </Select>
          </div>
        ) : (
          <div className="space-y-3">
            {/* Account Selector */}
            <div>
              <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
                Customer
              </label>
              <Select
                {...register('accountId')}
                disabled={Boolean(initialAccountId)}
                className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
              >
                <option value="">Select customer...</option>
                {customers.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </Select>
            </div>

            {/* Sub-selectors: Contact & Opportunity */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
                  Contact person
                </label>
                <Select
                  {...register('contactId')}
                  disabled={Boolean(initialContactId)}
                  className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
                >
                  <option value="">Select contact...</option>
                  {contacts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.firstName} {c.lastName}
                    </option>
                  ))}
                </Select>
              </div>

              <div>
                <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
                  Deal
                </label>
                <Select
                  {...register('opportunityId')}
                  disabled={Boolean(initialOpportunityId)}
                  className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
                >
                  <option value="">Select deal...</option>
                  {opportunities.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>
        )}

        {/* Description / Instructions */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Notes
          </label>
          <Textarea
            {...register('description')}
            rows={3}
            placeholder="Add context, instructions, or notes..."
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Add task
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
