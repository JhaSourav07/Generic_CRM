import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select } from '@/components/ui/select';
import { useToast } from '@/components/ui/toast';
import { supportCasesService } from '@/services/support.service';
import { customersService } from '@/services/customers.service';
import { usersService } from '@/services/users.service';
import { SupportCasePriority } from '@/types/support.types';
import { AlertCircle } from 'lucide-react';

export interface CreateSupportCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  defaultAccountId?: string;
  defaultContactId?: string;
}

export const CreateSupportCaseModal: React.FC<CreateSupportCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  defaultAccountId,
  defaultContactId
}) => {
  const { toast } = useToast();

  const [subject, setSubject] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<SupportCasePriority>('MEDIUM');
  const [accountId, setAccountId] = useState(defaultAccountId || '');
  const [contactId, setContactId] = useState(defaultContactId || '');
  const [assignedToId, setAssignedToId] = useState('');

  const [accounts, setAccounts] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      // Fetch Accounts and Users for select dropdowns
      customersService.getCustomers({ limit: 100 }).then((res: any) => {
        setAccounts(res.customers || []);
      }).catch(() => {});

      usersService.getUsers({ limit: 100 }).then((res: any) => {
        setUsers(res.users || res.data || []);
      }).catch(() => {});

      if (defaultAccountId) {
        setAccountId(defaultAccountId);
      }
      if (defaultContactId) {
        setContactId(defaultContactId);
      }
    }
  }, [isOpen, defaultAccountId, defaultContactId]);

  // When accountId changes, fetch or filter its contacts
  useEffect(() => {
    if (accountId) {
      customersService.getCustomerById(accountId).then((acc: any) => {
        setContacts(acc.contacts || []);
      }).catch(() => {
        setContacts([]);
      });
    } else {
      setContacts([]);
      setContactId('');
    }
  }, [accountId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!subject.trim()) {
      setError('Subject is required.');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      await supportCasesService.createCase({
        subject: subject.trim(),
        description: description.trim() || undefined,
        priority,
        accountId: accountId || undefined,
        contactId: contactId || undefined,
        assignedToId: assignedToId || undefined
      });

      toast({
        type: 'success',
        title: 'Support Case Created',
        message: 'Ticket has been logged and assigned to workflow queue.'
      });

      setSubject('');
      setDescription('');
      setPriority('MEDIUM');
      setAccountId(defaultAccountId || '');
      setContactId(defaultContactId || '');
      setAssignedToId('');

      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create support case.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Support Case"
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4 pt-2">
        {error && (
          <div className="p-3 rounded-md bg-red-500/10 border border-red-500/20 text-red-400 text-xs flex items-center gap-2">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Subject */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Subject *
          </label>
          <Input
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="e.g. SSL Certificate Renewal Failure on API Endpoint"
            required
            className="text-xs"
          />
        </div>

        {/* Priority & Customer Account */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Priority
            </label>
            <Select
              value={priority}
              onChange={(e) => setPriority(e.target.value as SupportCasePriority)}
              options={[
                { label: 'Low Priority', value: 'LOW' },
                { label: 'Medium Priority', value: 'MEDIUM' },
                { label: 'High Priority', value: 'HIGH' },
                { label: 'Urgent Priority', value: 'URGENT' }
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Customer Account
            </label>
            <Select
              value={accountId}
              onChange={(e) => setAccountId(e.target.value)}
              options={[
                { label: 'Select Customer Account (Optional)', value: '' },
                ...accounts.map((acc) => ({ label: acc.name, value: acc.id }))
              ]}
              className="text-xs"
            />
          </div>
        </div>

        {/* Contact & Assignee */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Contact Person
            </label>
            <Select
              value={contactId}
              onChange={(e) => setContactId(e.target.value)}
              disabled={!accountId || contacts.length === 0}
              options={[
                {
                  label: !accountId
                    ? 'Select account first'
                    : contacts.length === 0
                    ? 'No contacts on account'
                    : 'Select Contact (Optional)',
                  value: ''
                },
                ...contacts.map((c) => ({
                  label: `${c.firstName} ${c.lastName}${c.jobTitle ? ` (${c.jobTitle})` : ''}`,
                  value: c.id
                }))
              ]}
              className="text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
              Assign Support Agent
            </label>
            <Select
              value={assignedToId}
              onChange={(e) => setAssignedToId(e.target.value)}
              options={[
                { label: 'Unassigned Queue', value: '' },
                ...users.map((u) => ({
                  label: `${u.name} (${u.role?.name || 'Agent'})`,
                  value: u.id
                }))
              ]}
              className="text-xs"
            />
          </div>
        </div>

        {/* Description */}
        <div>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Description & Reproduction Steps
          </label>
          <Textarea
            rows={4}
            value={description}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setDescription(e.target.value)}
            placeholder="Detailed description of client issue, symptoms, logs, or error codes..."
            className="text-xs"
          />
        </div>

        <div className="flex justify-end gap-3 pt-3 border-t border-vynexa-border">
          <Button variant="outline" size="sm" type="button" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={loading}>
            {loading ? 'Creating...' : 'Create Case'}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
