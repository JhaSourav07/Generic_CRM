import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { leadsService } from '@/services/leads.service';
import { usersService } from '@/services/users.service';
import { UserItem } from '@/types/users.types';
import { Lead } from '@/types/leads.types';
import { useToast } from '@/components/ui/toast';

interface AssignLeadModalProps {
  isOpen: boolean;
  lead: Lead | null;
  onClose: () => void;
  onSuccess: () => void;
}

export const AssignLeadModal: React.FC<AssignLeadModalProps> = ({ isOpen, lead, onClose, onSuccess }) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState<string>('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && lead) {
      setSelectedOwnerId(lead.ownerId || '');
      usersService.getUsers().then(res => setUsers(res.users)).catch(() => {});
    }
  }, [isOpen, lead]);

  if (!lead) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedOwnerId) {
      toast({
        type: 'warning',
        title: 'Selection Required',
        message: 'Please select an owner to assign this lead.'
      });
      return;
    }

    try {
      setLoading(true);
      await leadsService.assignLead(lead.id, selectedOwnerId);
      toast({
        type: 'success',
        title: 'Lead Assigned',
        message: 'Lead assigned successfully.'
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Failed to assign lead.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Assign Lead Owner"
      description={`Reassign ownership for lead '${lead.firstName} ${lead.lastName}'`}
      maxWidth="md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <Select
          label="Select New Owner"
          value={selectedOwnerId}
          onChange={(e) => setSelectedOwnerId(e.target.value)}
          options={[
            { value: '', label: 'Select a user...' },
            ...users.map(u => ({ value: u.id, label: `${u.name} (${u.role.name})` }))
          ]}
        />

        <div className="flex justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" isLoading={loading}>
            Assign Owner
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
