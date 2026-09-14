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
import { usersService } from '@/services/users.service';
import { Task, TaskPriority, TaskStatus } from '@/types/tasks.types';
import { UserItem } from '@/types/users.types';
import { useToast } from '@/components/ui/toast';

const formSchema = z.object({
  title: z.string().trim().min(1, 'Task title is required').max(200),
  description: z.string().optional(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']),
  status: z.enum(['TODO', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED']),
  dueDate: z.string().optional(),
  assignedToId: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface EditTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  task: Task | null;
}

export const EditTaskModal: React.FC<EditTaskModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  task
}) => {
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors }
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: '',
      description: '',
      priority: 'MEDIUM',
      status: 'TODO',
      dueDate: '',
      assignedToId: ''
    }
  });

  useEffect(() => {
    if (!isOpen || !task) return;

    reset({
      title: task.title,
      description: task.description || '',
      priority: task.priority,
      status: task.status,
      dueDate: task.dueDate ? new Date(task.dueDate).toISOString().slice(0, 10) : '',
      assignedToId: task.assignedToId || ''
    });

    const loadUsers = async () => {
      try {
        const res = await usersService.getUsers({ limit: 100, isActive: true });
        setUsers(res.users || []);
      } catch (err) {
        console.error('Failed to load users', err);
      }
    };
    loadUsers();
  }, [isOpen, task, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!task) return;
    try {
      setLoading(true);

      await tasksService.updateTask(task.id, {
        title: data.title,
        description: data.description || null,
        priority: data.priority as TaskPriority,
        status: data.status as TaskStatus,
        dueDate: data.dueDate ? new Date(data.dueDate).toISOString() : null,
        assignedToId: data.assignedToId || null
      });

      toast({
        type: 'success',
        title: 'Task Updated',
        message: 'Task details updated successfully.'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to Update Task',
        message: err.message || 'An error occurred while saving the task.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit Task Details" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Title */}
        <div>
          <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
            Task Title *
          </label>
          <Input
            {...register('title')}
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
          {errors.title && (
            <p className="text-vynexa-danger text-[11px] mt-1">{errors.title.message}</p>
          )}
        </div>

        {/* Status & Priority */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
              Status *
            </label>
            <Select
              {...register('status')}
              className="w-full bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
            >
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
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
        </div>

        {/* Due Date & Assignee */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
              Due Date
            </label>
            <Input
              type="date"
              {...register('dueDate')}
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
              Assigned To
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

        {/* Description */}
        <div>
          <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
            Task Description
          </label>
          <Textarea
            {...register('description')}
            rows={3}
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
        </div>

        {/* Action Buttons */}
        <div className="flex items-center justify-end gap-3 pt-3 border-t border-vynexa-border">
          <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" isLoading={loading}>
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
