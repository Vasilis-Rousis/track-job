import { z } from 'zod';
import { Status } from '@prisma/client';

const crossFieldCheck = (data: { appliedAt?: Date; followUpAt?: Date }, ctx: z.RefinementCtx) => {
  if (data.appliedAt && data.followUpAt) {
    const minFollowUp = new Date(data.appliedAt);
    minFollowUp.setDate(minFollowUp.getDate() + 1);
    if (data.followUpAt < minFollowUp) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['followUpAt'],
        message: 'Follow-up must be at least one day after the applied date',
      });
    }
  }
};

const applicationFields = {
  company: z.string().min(1, 'Company is required').max(200),
  role: z.string().min(1, 'Role is required').max(200),
  location: z.string().max(200).optional(),
  jobUrl: z
    .string()
    .url('Invalid URL')
    .optional()
    .or(z.literal('').transform(() => undefined)),
  status: z.nativeEnum(Status).default('APPLIED'),
  salary: z.string().max(100).optional(),
  notes: z.string().max(10000).optional(),
  appliedAt: z
    .string()
    .datetime()
    .optional()
    .refine((v) => !v || new Date(v) <= new Date(), 'Applied date cannot be in the future')
    .transform((v) => (v ? new Date(v) : undefined)),
  followUpAt: z
    .string()
    .datetime()
    .optional()
    .refine((v) => {
      if (!v) return true;
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      tomorrow.setHours(0, 0, 0, 0);
      return new Date(v) >= tomorrow;
    }, 'Follow-up date must be tomorrow or later')
    .transform((v) => (v ? new Date(v) : undefined)),
};

export const createApplicationSchema = z.object(applicationFields).superRefine(crossFieldCheck);
export const updateApplicationSchema = z.object(applicationFields).partial().superRefine(crossFieldCheck);

export const applicationQuerySchema = z.object({
  status: z.nativeEnum(Status).optional(),
  search: z.string().optional(),
  sort: z
    .enum(['appliedAt_desc', 'appliedAt_asc', 'company_asc', 'updatedAt_desc'])
    .default('appliedAt_desc'),
  page: z.string().optional(),
  limit: z.string().optional(),
});

export type CreateApplicationInput = z.infer<typeof createApplicationSchema>;
export type UpdateApplicationInput = z.infer<typeof updateApplicationSchema>;
export type ApplicationQueryInput = z.infer<typeof applicationQuerySchema>;
