import { z } from 'zod';
import { Status } from '@prisma/client';

export const createApplicationSchema = z.object({
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
    .transform((v) => (v ? new Date(v) : undefined)),
  followUpAt: z
    .string()
    .datetime()
    .optional()
    .transform((v) => (v ? new Date(v) : undefined)),
});

export const updateApplicationSchema = createApplicationSchema.partial();

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
