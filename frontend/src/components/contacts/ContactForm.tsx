import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { DialogFooter } from '@/components/ui/dialog';
import type { Contact } from '@/types';
import { useCreateContact, useUpdateContact } from '@/hooks/useContacts';
import { toast } from '@/hooks/use-toast';
import { getAxiosErrorMessage } from '@/utils/helpers';

const schema = z.object({
  name: z.string().min(1, 'Name is required'),
  title: z.string().optional(),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  phone: z.string().optional(),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

interface ContactFormProps {
  contact?: Contact;
  applicationId?: string;
  onSuccess?: () => void;
}

export function ContactForm({ contact, applicationId, onSuccess }: ContactFormProps) {
  const isEdit = !!contact;
  const create = useCreateContact();
  const update = useUpdateContact();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', title: '', email: '', phone: '', linkedin: '', notes: '' },
  });

  useEffect(() => {
    if (contact) {
      reset({
        name: contact.name,
        title: contact.title ?? '',
        email: contact.email ?? '',
        phone: contact.phone ?? '',
        linkedin: contact.linkedin ?? '',
        notes: contact.notes ?? '',
      });
    }
  }, [contact, reset]);

  const onSubmit = async (data: FormData) => {
    const payload = {
      name: data.name,
      title: data.title || undefined,
      email: data.email,
      phone: data.phone || undefined,
      linkedin: data.linkedin || undefined,
      notes: data.notes || undefined,
      applicationId,
    };

    try {
      if (isEdit && contact) {
        await update.mutateAsync({ id: contact.id, data: payload });
        toast({ title: 'Contact updated' });
      } else {
        await create.mutateAsync(payload);
        toast({ title: 'Contact added' });
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
          <Label htmlFor="name">Name *</Label>
          <Input id="name" placeholder="John Smith" {...register('name')} />
          {errors.name && (
            <p className="text-xs text-destructive">{errors.name.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input id="title" placeholder="Engineering Manager" {...register('title')} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="email">Email *</Label>
          <Input id="email" type="email" placeholder="john@acme.com" {...register('email')} />
          {errors.email && (
            <p className="text-xs text-destructive">{errors.email.message}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+1 555 000 0000" {...register('phone')} />
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="linkedin">LinkedIn</Label>
        <Input
          id="linkedin"
          type="url"
          placeholder="https://linkedin.com/in/..."
          {...register('linkedin')}
        />
        {errors.linkedin && (
          <p className="text-xs text-destructive">{errors.linkedin.message}</p>
        )}
      </div>
      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Met at tech meetup..." rows={3} {...register('notes')} />
      </div>
      <DialogFooter>
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          {isEdit ? 'Save changes' : 'Add contact'}
        </Button>
      </DialogFooter>
    </form>
  );
}
