import { z } from 'zod';

export const scheduleEmailSchema = z.object({
  applicationId: z.string().cuid(),
  contactIds: z.array(z.string().cuid()).min(1, 'Select at least one contact'),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required').max(50000),
  scheduledFor: z
    .string()
    .datetime()
    .refine((v) => {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return new Date(v) >= tomorrow;
    }, 'Scheduled date must be tomorrow or later')
    .transform((v) => new Date(v)),
});

export type ScheduleEmailInput = z.infer<typeof scheduleEmailSchema>;

const tomorrowRefine = (v: string) => {
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(0, 0, 0, 0);
  return new Date(v) >= tomorrow;
};

export const updateEmailSchema = z.object({
  contactIds: z.array(z.string().cuid()).min(1, 'Select at least one contact'),
  subject: z.string().min(1, 'Subject is required').max(500),
  body: z.string().min(1, 'Body is required').max(50000),
  scheduledFor: z
    .string()
    .datetime()
    .refine(tomorrowRefine, 'Scheduled date must be tomorrow or later')
    .transform((v) => new Date(v)),
});

export type UpdateEmailInput = z.infer<typeof updateEmailSchema>;
