import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { opportunitiesService } from '@/services/opportunities.service';
import { usersService } from '@/services/users.service';
import { Opportunity } from '@/types/opportunities.types';
import { UserItem } from '@/types/users.types';
import { useToast } from '@/components/ui/toast';

interface AssignOpportunityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  opportunity: Opportunity | null;
}

export const AssignOpportunityModal: React.FC<AssignOpportunityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  opportunity
}) => {
  const [selectedOwnerId, setSelectedOwnerId] = useState('');
  const [users, setUsers] = useState<UserItem[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    if (isOpen && opportunity) {
      setSelectedOwnerId(opportunity.ownerId || '');
      usersService.getUsers().then((res) => setUsers(res.users)).catch(() => {});
    }
  }, [isOpen, opportunity]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!opportunity || !selectedOwnerId) return;

    try {
      setLoading(true);
      await opportunitiesService.assignOpportunity(opportunity.id, selectedOwnerId);

      const targetUser = users.find((u) => u.id === selectedOwnerId);
      toast({
        type: 'success',
        title: 'Deal Reassigned',
        message: `'${opportunity.name}' assigned to ${targetUser?.name || 'team member'}.`
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not assign opportunity.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Assign Opportunity Owner" maxWidth="sm">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <p className="text-xs text-vynexa-text-secondary mb-3">
            Select the team member who should own and drive deal <span className="font-semibold text-vynexa-text-primary">{opportunity?.name}</span>:
          </p>
          <label className="block text-xs font-medium text-vynexa-text-secondary mb-1">
            Assign To
          </label>
          <Select
            value={selectedOwnerId}
            onChange={(e) => setSelectedOwnerId(e.target.value)}
            className="w-full bg-vynexa-surface border-vynexa-border text-vynexa-text-primary"
          >
            <option value="">Select Team Member</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading} disabled={!selectedOwnerId}>
            Confirm Assignment
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
