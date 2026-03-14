import { useEffect } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DialogFooter } from '@/components/ui/dialog';
import type { Application, ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/utils/constants';
import { formatDateInput } from '@/utils/helpers';
import { useCreateApplication, useUpdateApplication } from '@/hooks/useApplications';
import { toast } from '@/hooks/use-toast';
import { getAxiosErrorMessage } from '@/utils/helpers';

const schema = z.object({
  company: z.string().min(1, 'Company is required'),
  role: z.string().min(1, 'Role is required'),
  location: z.string().optional(),
  jobUrl: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  status: z.string().min(1),
  salary: z.string().optional(),
  appliedAt: z.string().min(1, 'Applied date is required').refine(
    (v) => !v || new Date(v) <= new Date(),
    'Applied date cannot be in the future'
  ),
  followUpAt: z.string().optional(),
  notes: z.string().optional(),
}).superRefine((data, ctx) => {
  if (!data.followUpAt) return;
  const followUp = new Date(data.followUpAt);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  if (followUp < tomorrow) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['followUpAt'], message: 'Follow-up date must be tomorrow or later' });
    return;
  }
  if (data.appliedAt) {
    const minFollowUp = new Date(data.appliedAt);
    minFollowUp.setDate(minFollowUp.getDate() + 1);
    if (followUp < minFollowUp) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['followUpAt'], message: 'Follow-up must be at least one day after the applied date' });
    }
  }
});

type FormData = z.infer<typeof schema>;

interface ApplicationFormProps {
  application?: Application;
  onSuccess?: () => void;
}

export function ApplicationForm({ application, onSuccess }: ApplicationFormProps) {
  const isEdit = !!application;
  const create = useCreateApplication();
  const update = useUpdateApplication();

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      company: '',
      role: '',
      status: 'WISHLIST',
      appliedAt: formatDateInput(new Date().toISOString()),
    },
  });

  const appliedAt = watch('appliedAt');
  const followUpMin = (() => {
    const toLocalDateStr = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = toLocalDateStr(tomorrow);
    if (appliedAt) {
      const d = new Date(`${appliedAt}T00:00:00`);
      d.setDate(d.getDate() + 1);
      const dayAfterApplied = toLocalDateStr(d);
      return dayAfterApplied > tomorrowStr ? dayAfterApplied : tomorrowStr;
    }
    return tomorrowStr;
  })();

  useEffect(() => {
    if (application) {
      reset({
        company: application.company,
        role: application.role,
        location: application.location ?? '',
        jobUrl: application.jobUrl ?? '',
        status: application.statusHistory?.[0]?.toStatus ?? application.status,
        salary: application.salary ?? '',
        appliedAt: formatDateInput(application.appliedAt),
        followUpAt: formatDateInput(application.followUpAt),
        notes: application.notes ?? '',
      });
    }
  }, [application, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      company: data.company,
      role: data.role,
      location: data.location || undefined,
      jobUrl: data.jobUrl || undefined,
      status: data.status as ApplicationStatus,
      salary: data.salary || undefined,
      notes: data.notes || undefined,
      appliedAt: data.appliedAt
        ? new Date(data.appliedAt).toISOString()
        : undefined,
      followUpAt: data.followUpAt
        ? new Date(data.followUpAt).toISOString()
        : undefined,
    };

    try {
      if (isEdit && application) {
        await update.mutateAsync({ id: application.id, data: payload });
        toast({ title: 'Application updated' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Application added' });
      }
      onSuccess?.();
    } catch (err) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: getAxiosErrorMessage(err),
      });
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="company">Company *</Label>
          <Input id="company" placeholder="Acme Corp" {...register('company')} />
          {errors.company && (
            <p className="text-xs text-destructive">{errors.company.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="role">Role *</Label>
          <Input id="role" placeholder="Senior Engineer" {...register('role')} />
          {errors.role && (
            <p className="text-xs text-destructive">{errors.role.message}</p>
          )}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input id="location" placeholder="Remote" {...register('location')} />
        </div>
        <div className="space-y-2">
          <Label>Status *</Label>
          <Controller
            control={control}
            name="status"
            render={({ field }) => (
              <Select value={field.value} onValueChange={field.onChange}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ALL_STATUSES.map((s) => (
                    <SelectItem key={s} value={s}>
                      {STATUS_LABELS[s]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="appliedAt">Applied Date *</Label>
          <Input
            id="appliedAt"
            type="date"
            max={(() => { const d = new Date(); return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`; })()}
            onKeyDown={(e) => e.preventDefault()}
            onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }}
            {...register('appliedAt')}
          />
          {errors.appliedAt && (
            <p className="text-xs text-destructive">{errors.appliedAt.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="followUpAt">Follow-Up Date</Label>
          <Input
            id="followUpAt"
            type="date"
            min={followUpMin}
            onKeyDown={(e) => e.preventDefault()}
            onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }}
            {...register('followUpAt')}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="salary">Salary</Label>
          <Input id="salary" placeholder="€60,000 - €75,000" {...register('salary')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="jobUrl">Job URL</Label>
          <Input id="jobUrl" type="url" placeholder="https://..." {...register('jobUrl')} />
          {errors.jobUrl && (
            <p className="text-xs text-destructive">{errors.jobUrl.message}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea
          id="notes"
          placeholder="Any notes about this application..."
          rows={3}
          {...register('notes')}
        />
      </div>

      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add application'}
        </Button>
      </DialogFooter>
    </form>
  );
}
