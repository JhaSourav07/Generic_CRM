import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { tasksService } from '@/services/tasks.service';
import { usersService } from '@/services/users.service';
import { Task } from '@/types/tasks.types';
import { UserItem } from '@/types/users.types';
import { useToast } from '@/components/ui/toast';

interface AssignTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
}

export const AssignTaskModal: React.FC<AssignTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    if (!isOpen || !task) return;
    setSelectedUserId(task.assignedToId || '');

    const loadUsers = async () => {
      try {
        const res = await usersService.getUsers({ limit: 100, isActive: true });
        setUsers(res.users || []);
      } catch (err) {
        console.error('Failed to load active users for assignment', err);
      }
    };
    loadUsers();
  }, [isOpen, task]);

  const handleAssign = async () => {
    if (!task) return;
    try {
      setLoading(true);
      await tasksService.assignTask(task.id, selectedUserId || null);
      toast({
        type: 'success',
        title: 'Task Assigned',
        message: selectedUserId ? 'Task assigned to team member.' : 'Task is now unassigned.'
      });
      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Assignment Failed',
        message: err.message || 'Could not assign task.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Assign Task" maxWidth="sm">
      <div className="space-y-4 text-xs">
        <div>
          <p className="text-vynexa-text-secondary mb-2">
            Assign <span className="font-semibold text-white">"{task?.title}"</span> to:
          </p>
          <Select
            value={selectedUserId}
            onChange={(e) => setSelectedUserId(e.target.value)}
            className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          >
            <option value="">Unassigned</option>
            {users.map((u) => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.role?.name || 'User'})
              </option>
            ))}
          </Select>
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border">
          <Button variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" onClick={handleAssign} isLoading={loading}>
            Save Assignment
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
