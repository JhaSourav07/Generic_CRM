import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { activitiesService } from '@/services/activities.service';
import { Activity } from '@/types/activities.types';
import { useToast } from '@/components/ui/toast';
import { PhoneCall, Video, Mail, FileText, MoreHorizontal } from 'lucide-react';

const formSchema = z.object({
  type: z.enum(['CALL', 'MEETING', 'EMAIL', 'NOTE', 'OTHER']),
  subject: z.string().trim().min(1, 'Subject is required').max(200),
  description: z.string().optional(),
  activityDate: z.string().min(1, 'Activity date is required'),
  duration: z.coerce.number().min(0).max(10080).optional()
});

type FormValues = z.infer<typeof formSchema>;

interface EditActivityModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  activity: Activity | null;
}

export const EditActivityModal: React.FC<EditActivityModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  activity
}) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

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
      type: 'CALL',
      subject: '',
      description: '',
      activityDate: '',
      duration: 30
    }
  });

  const selectedType = watch('type');

  useEffect(() => {
    if (!isOpen || !activity) return;

    reset({
      type: activity.type,
      subject: activity.subject,
      description: activity.description || '',
      activityDate: new Date(activity.activityDate).toISOString().slice(0, 16),
      duration: activity.duration || undefined
    });
  }, [isOpen, activity, reset]);

  const onSubmit = async (data: FormValues) => {
    if (!activity) return;
    try {
      setLoading(true);

      await activitiesService.updateActivity(activity.id, {
        type: data.type,
        subject: data.subject,
        description: data.description || null,
        activityDate: new Date(data.activityDate).toISOString(),
        duration: data.duration !== undefined ? Number(data.duration) : null
      });

      toast({
        type: 'success',
        title: 'Activity Updated',
        message: 'Interaction details updated successfully.'
      });

      onSuccess();
      onClose();
    } catch (err: any) {
      toast({
        type: 'error',
        title: 'Failed to Update Activity',
        message: err.message || 'An error occurred while updating the activity.'
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose} title="Edit Activity Record" maxWidth="md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 text-xs">
        {/* Type Selector */}
        <div>
          <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1.5">
            Activity Type *
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
                      : 'bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-muted hover:text-vynexa-text-secondary'
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
          <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
            Subject / Title *
          </label>
          <Input
            {...register('subject')}
            className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary"
          />
          {errors.subject && (
            <p className="text-vynexa-danger text-[11px] mt-1">{errors.subject.message}</p>
          )}
        </div>

        {/* Date & Duration */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
              Date & Time *
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
            <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
              Duration (Minutes)
            </label>
            <Input
              type="number"
              {...register('duration')}
              className="bg-vynexa-surface-secondary border-vynexa-border text-vynexa-text-primary font-mono text-xs"
            />
          </div>
        </div>

        {/* Description / Notes */}
        <div>
          <label className="block text-xs font-semibold text-vynexa-text-secondary mb-1">
            Notes / Details
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
