import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { activitiesService } from '@/services/activities.service';
import { customersService } from '@/services/customers.service';
import { contactsService } from '@/services/contacts.service';
import { opportunitiesService } from '@/services/opportunities.service';
import { leadsService } from '@/services/leads.service';
import { Customer } from '@/types/customers.types';
import { Contact } from '@/types/contacts.types';
import { Opportunity } from '@/types/opportunities.types';
import { Lead } from '@/types/leads.types';
import { ActivityType } from '@/types/activities.types';
import { useToast } from '@/components/ui/toast';
import { PhoneCall, Video, Mail, FileText, MoreHorizontal } from 'lucide-react';

const formSchema = z.object({
  type: z.enum(['CALL', 'MEETING', 'EMAIL', 'NOTE', 'OTHER']),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  description: z.string().optional(),
  activityDate: z.string().min(1, 'Activity date is required'),
  duration: z.coerce.number().min(0).max(10080).optional(),
  targetKind: z.enum(['ACCOUNT', 'LEAD']).default('ACCOUNT'),
  leadId: z.string().optional(),
  accountId: z.string().optional(),
  contactId: z.string().optional(),
  opportunityId: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface CreateActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  initialLeadId?: string;
  initialAccountId?: string;
  initialContactId?: string;
  initialOpportunityId?: string;
  defaultType?: ActivityType;
}

export const CreateActivityModal: React.FC<CreateActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  initialLeadId,
  initialAccountId,
  initialContactId,
  initialOpportunityId,
  defaultType = 'CALL'
}) => {
  const [loading, setLoading] = useState(false);
  const [loadingEntities, setLoadingEntities] = useState(false);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [opportunities, setOpportunities] = useState<Opportunity[]>([]);
  const [leads, setLeads] = useState<Lead[]>([]);
  const { toast } = useToast();

  const nowIso = new Date().toISOString().slice(0, 16);

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
      type: defaultType,
      subject: '',
      description: '',
      activityDate: nowIso,
      duration: 30,
      targetKind: initialLeadId ? 'LEAD' : 'ACCOUNT',
      leadId: initialLeadId || '',
      accountId: initialAccountId || '',
      contactId: initialContactId || '',
      opportunityId: initialOpportunityId || ''
    }
  });

  const selectedTargetKind = watch('targetKind');
  const selectedAccountId = watch('accountId');
  const selectedType = watch('type');

  useEffect(() => {
    if (!isOpen) return;

    reset({
      type: defaultType,
      subject: '',
      description: '',
      activityDate: new Date().toISOString().slice(0, 16),
      duration: defaultType === 'NOTE' ? undefined : 30,
      targetKind: initialLeadId ? 'LEAD' : 'ACCOUNT',
      leadId: initialLeadId || '',
      accountId: initialAccountId || '',
      contactId: initialContactId || '',
      opportunityId: initialOpportunityId || ''
    });

    const loadData = async () => {
      try {
        setLoadingEntities(true);
        const [accRes, leadRes] = await Promise.all([
          customersService.getCustomers({ limit: 100 }),
          leadsService.getLeads({ limit: 100 })
        ]);
        setCustomers(accRes.customers || []);
        setLeads(leadRes.leads || []);
      } catch (err) {
        console.error('Failed to load entity dropdowns', err);
      } finally {
        setLoadingEntities(false);
      }
    };
    loadData();
  }, [isOpen, initialLeadId, initialAccountId, initialContactId, initialOpportunityId, defaultType, reset]);

  // When account changes, load related contacts & opportunities
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

      await activitiesService.createActivity({
        type: data.type,
        subject: data.subject,
        description: data.description || null,
        activityDate: new Date(data.activityDate).toISOString(),
        duration: data.duration !== undefined ? Number(data.duration) : null,
        leadId: isLead ? (data.leadId || null) : null,
        accountId: !isLead ? (data.accountId || null) : null,
        contactId: !isLead ? (data.contactId || null) : null,
        opportunityId: !isLead ? (data.opportunityId || null) : null
      });

      toast({
        type: 'success',
        title: 'Activity logged',
        message: `'${data.subject}' added.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Could not log activity',
        message: err.message || 'An error occurred while saving the activity.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Log activity" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Activity Type Selection Tabs */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1.5">
            Activity type *
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[
              { type: 'CALL', label: 'Call', icon: PhoneCall },
              { type: 'MEETING', label: 'Meeting', icon: Video },
              { type: 'EMAIL', label: 'Email', icon: Mail },
              { type: 'NOTE', label: 'Note', icon: FileText },
              { type: 'OTHER', label: 'Other', icon: MoreHorizontal }
            ].map((item) => {
              const Icon = item.icon;
              const isSelected = selectedType === item.type;
              return (
                <button
                  type="button"
                  key={item.type}
                  onClick={() => setValue('type', item.type as any)}
                  className={`flex flex-col items-center justify-center p-2 rounded-lg border transition-all ${
                    isSelected
                      ? 'bg-vynexa-surface-elevated border-vynexa-text-primary text-vynexa-text-primary shadow-sm'
                      : 'bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-muted hover:text-vynexa-text-secondary hover:border-vynexa-border/80'
                  }`}
                >
                  <Icon className="h-4 w-4 mb-1" />
                  <span className="text-[11px] font-medium">{item.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Subject *
          </label>
          <Input
            {...register('subject')}
            placeholder="e.g. Intro call regarding licensing"
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
          {errors.subject && (
            <p className="text-vynexa-danger text-[11px] mt-1">{errors.subject.message}</p>
          )}
        </div>

        {/* Date & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Date & time *
            </label>
            <Input
              type="datetime-local"
              {...register('activityDate')}
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
            />
            {errors.activityDate && (
              <p className="text-vynexa-danger text-[11px] mt-1">{errors.activityDate.message}</p>
            )}
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Duration (minutes)
            </label>
            <Input
              type="number"
              {...register('duration')}
              placeholder="30"
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
            />
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
              disabled={Boolean(initialLeadId) || loadingEntities}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
            >
              <option value="">
                {loadingEntities
                  ? 'Loading leads...'
                  : leads.length === 0
                  ? 'No leads available'
                  : 'Select a lead...'}
              </option>
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

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Notes
          </label>
          <Textarea
            {...register('description')}
            rows={3}
            placeholder="Add details, outcome, or notes..."
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Log activity
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
