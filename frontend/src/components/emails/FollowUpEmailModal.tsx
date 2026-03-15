import { useEffect, useRef } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2, Link as LinkIcon } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DialogFooter } from '@/components/ui/dialog';
import type { Application } from '@/types';
import { useContacts } from '@/hooks/useContacts';
import { useGmailStatus, useScheduleEmail } from '@/hooks/useEmails';
import { useAuthStore } from '@/store/authStore';
import { formatDate, formatDateInput, getAxiosErrorMessage } from '@/utils/helpers';
import { toast } from '@/hooks/use-toast';

const schema = z.object({
  contactIds: z.array(z.string()).min(1, 'Select at least one contact'),
  scheduledFor: z.string().min(1, 'Scheduled date is required'),
  scheduledTime: z.string().min(1, 'Send time is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
}).superRefine((data, ctx) => {
  if (!data.scheduledFor) return;
  const d = new Date(`${data.scheduledFor}T00:00:00`);
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  if (d < tomorrow) {
    ctx.addIssue({ code: z.ZodIssueCode.custom, path: ['scheduledFor'], message: 'Date must be tomorrow or later' });
  }
});

type FormData = z.infer<typeof schema>;

interface FollowUpEmailModalProps {
  application: Application;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const toLocalDateStr = (d: Date) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

export function FollowUpEmailModal({ application, open, onOpenChange }: FollowUpEmailModalProps) {
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const { data: gmailStatus, isLoading: gmailLoading } = useGmailStatus();
  const { data: allContacts = [] } = useContacts();
  const scheduleEmail = useScheduleEmail();

  // Contacts linked to this application (for pre-selection and labelling)
  const linkedIds = new Set(
    allContacts.filter((c) => c.applicationId === application.id).map((c) => c.id)
  );
  const defaultContactIds = allContacts
    .filter((c) => !!c.email && linkedIds.has(c.id))
    .map((c) => c.id);

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = toLocalDateStr(tomorrow);

  const followUpMin = (() => {
    if (application.appliedAt) {
      const d = new Date(`${formatDateInput(application.appliedAt)}T00:00:00`);
      d.setDate(d.getDate() + 1);
      const dayAfter = toLocalDateStr(d);
      return dayAfter > tomorrowStr ? dayAfter : tomorrowStr;
    }
    return tomorrowStr;
  })();

  const defaultBody = `Dear [contact.name],

I hope this message finds you well. I am writing to follow up on my application for the ${application.role} position at ${application.company}, which I submitted on ${formatDate(application.appliedAt)}.

I remain very interested in this opportunity and would love to learn about any updates regarding the hiring process.

Please let me know if you need any additional information from my end.

Best regards,
${user?.name ?? ''}`;

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isValid },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    mode: 'onChange',
    defaultValues: {
      contactIds: defaultContactIds,
      scheduledFor: application.followUpAt ? formatDateInput(application.followUpAt) : '',
      scheduledTime: '09:00',
      subject: `Following up on my application — ${application.role} at ${application.company}`,
      body: defaultBody,
    },
  });

  // Re-initialise when contacts load
  useEffect(() => {
    if (allContacts.length > 0) {
      reset((prev) => ({
        ...prev,
        contactIds: allContacts
          .filter((c) => !!c.email && linkedIds.has(c.id))
          .map((c) => c.id),
      }));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allContacts.length]);

  const selectedIds = watch('contactIds');

  // Replace [contact.name] in body when single contact selected, revert when multiple
  const prevSingleNameRef = useRef<string | null>(null);
  useEffect(() => {
    if (selectedIds.length === 1) {
      const contact = allContacts.find((c) => c.id === selectedIds[0]);
      if (!contact) return;
      const currentBody = watch('body');
      const prev = prevSingleNameRef.current;
      // Replace previous single name or placeholder with new name
      const updated = prev
        ? currentBody.replace(prev, contact.name)
        : currentBody.replace('[contact.name]', contact.name);
      setValue('body', updated);
      prevSingleNameRef.current = contact.name;
    } else {
      // Revert single name back to placeholder
      const prev = prevSingleNameRef.current;
      if (prev) {
        const currentBody = watch('body');
        setValue('body', currentBody.replace(prev, '[contact.name]'));
        prevSingleNameRef.current = null;
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedIds.join(',')]);

  const toggleContact = (id: string, current: string[], onChange: (v: string[]) => void) => {
    if (current.includes(id)) {
      onChange(current.filter((x) => x !== id));
    } else {
      onChange([...current, id]);
    }
  };

  const onSubmit = async (data: FormData) => {
    try {
      await scheduleEmail.mutateAsync({
        applicationId: application.id,
        contactIds: data.contactIds,
        subject: data.subject,
        body: data.body,
        scheduledFor: new Date(`${data.scheduledFor}T${data.scheduledTime}:00`).toISOString(),
      });
      toast({ title: 'Follow-up email scheduled' });
      onOpenChange(false);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: getAxiosErrorMessage(err) });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto show-scrollbar">
        <DialogHeader>
          <DialogTitle>Schedule Follow-up Email</DialogTitle>
        </DialogHeader>

        {gmailLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : !gmailStatus?.connected ? (
          <div className="rounded-md border border-dashed p-6 text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              You need to connect your Gmail account before scheduling emails.
            </p>
            <Button variant="outline" size="sm" onClick={() => { onOpenChange(false); navigate('/settings'); }}>
              <LinkIcon className="mr-2 h-4 w-4" />
              Go to Settings
            </Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            {/* Contact multi-select */}
            <div className="space-y-2">
              <Label>Send to</Label>
              {allContacts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No contacts found. Add contacts first.</p>
              ) : (
                <Controller
                  control={control}
                  name="contactIds"
                  render={({ field }) => (
                    <div className="max-h-40 overflow-y-auto show-scrollbar space-y-1 rounded-md border p-1 mr-0.5">
                      {[...allContacts].sort((a, b) => {
                        const aLinked = linkedIds.has(a.id) ? 0 : 1;
                        const bLinked = linkedIds.has(b.id) ? 0 : 1;
                        if (aLinked !== bLinked) return aLinked - bLinked;
                        return a.name.localeCompare(b.name);
                      }).map((contact) => {
                        const hasEmail = !!contact.email;
                        const isSelected = field.value.includes(contact.id);
                        const isLinked = linkedIds.has(contact.id);
                        return (
                          <button
                            key={contact.id}
                            type="button"
                            disabled={!hasEmail}
                            onClick={() => hasEmail && toggleContact(contact.id, field.value, field.onChange)}
                            className={`w-full rounded-md px-3 py-2 text-left transition-colors ${
                              !hasEmail
                                ? 'opacity-40 cursor-not-allowed'
                                : isSelected
                                ? 'bg-accent ring-2 ring-ring'
                                : 'hover:bg-accent'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <p className="text-sm font-medium">{contact.name}</p>
                              {isLinked && (
                                <span className="text-xs text-muted-foreground bg-muted px-1.5 py-0.5 rounded shrink-0">linked</span>
                              )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {contact.email ?? 'No email address'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              )}
              {selectedIds.length > 0 && (
                <Controller
                  control={control}
                  name="contactIds"
                  render={({ field }) => (
                    <div className="flex flex-wrap gap-1.5">
                      {field.value.map((id) => {
                        const contact = allContacts.find((c) => c.id === id);
                        if (!contact) return null;
                        return (
                          <span
                            key={id}
                            className="inline-flex items-center gap-1 rounded-full bg-accent px-2.5 py-1 text-xs font-medium"
                          >
                            {contact.name}
                            <button
                              type="button"
                              onClick={() => field.onChange(field.value.filter((x) => x !== id))}
                              className="ml-0.5 rounded-full hover:text-destructive transition-colors"
                              aria-label={`Remove ${contact.name}`}
                            >
                              ×
                            </button>
                          </span>
                        );
                      })}
                    </div>
                  )}
                />
              )}
              {errors.contactIds && (
                <p className="text-xs text-destructive">{errors.contactIds.message}</p>
              )}
              {selectedIds.length > 1 && (
                <p className="text-xs text-muted-foreground">
                  Each selected contact will receive a personalised email with their name.
                </p>
              )}
            </div>

            {/* Scheduled date */}
            <div className="space-y-2">
              <Label htmlFor="scheduledFor">Send on date *</Label>
              <Input
                id="scheduledFor"
                type="date"
                min={followUpMin}
                onKeyDown={(e) => e.preventDefault()}
                onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }}
                {...register('scheduledFor')}
              />
              {errors.scheduledFor && (
                <p className="text-xs text-destructive">{errors.scheduledFor.message}</p>
              )}
            </div>

            {/* Send time */}
            <div className="space-y-2">
              <Label htmlFor="scheduledTime">Send at time *</Label>
              <Input
                id="scheduledTime"
                type="time"
                onClick={(e) => { try { (e.currentTarget as HTMLInputElement).showPicker(); } catch {} }}
                {...register('scheduledTime')}
              />
              {errors.scheduledTime && (
                <p className="text-xs text-destructive">{errors.scheduledTime.message}</p>
              )}
            </div>

            {/* Subject */}
            <div className="space-y-2">
              <Label htmlFor="subject">Subject *</Label>
              <Input id="subject" {...register('subject')} />
              {errors.subject && (
                <p className="text-xs text-destructive">{errors.subject.message}</p>
              )}
            </div>

            {/* Body */}
            <div className="space-y-2">
              <Label htmlFor="body">Email body *</Label>
              <Textarea id="body" rows={10} className="show-scrollbar resize-none" {...register('body')} />
              {errors.body && (
                <p className="text-xs text-destructive">{errors.body.message}</p>
              )}
            </div>

            <DialogFooter>
              <Button type="submit" disabled={isSubmitting || !isValid}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Schedule email
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
