import { z } from 'zod';

export const createContactSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200),
  title: z.string().max(200).optional(),
  email: z.string().email('Invalid email').min(1, 'Email is required'),
  phone: z.string().max(50).optional().or(z.literal('')).transform(v => v || undefined),
  linkedin: z.string().url('Invalid URL').optional().or(z.literal('')).transform(v => v || undefined),
  applicationId: z.string().optional(),
  notes: z.string().max(5000).optional(),
});

export const updateContactSchema = createContactSchema.partial().extend({
  applicationId: z.string().nullish(),
});

export type CreateContactInput = z.infer<typeof createContactSchema>;
export type UpdateContactInput = z.infer<typeof updateContactSchema>;
