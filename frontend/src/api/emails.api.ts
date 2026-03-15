import { api } from './axios';
import type { ScheduledEmail, GmailStatus } from '@/types';

export interface ScheduleEmailData {
  applicationId: string;
  contactIds: string[];
  subject: string;
  body: string;
  scheduledFor: string; // ISO datetime
}

export interface UpdateEmailData {
  contactIds: string[];
  subject: string;
  body: string;
  scheduledFor: string;
}

export const emailsApi = {
  schedule: (data: ScheduleEmailData) =>
    api.post<ScheduledEmail>('/emails', data).then((r) => r.data),

  list: (params?: { applicationId?: string }) =>
    api.get<{ data: ScheduledEmail[] }>('/emails', { params }).then((r) => r.data.data),

  update: (id: string, data: UpdateEmailData) =>
    api.patch<ScheduledEmail>(`/emails/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api.delete<{ message: string }>(`/emails/${id}`).then((r) => r.data),
};

export const gmailApi = {
  getStatus: () =>
    api.get<GmailStatus>('/gmail/status').then((r) => r.data),

  getAuthUrl: () =>
    api.get<{ url: string }>('/gmail/url').then((r) => r.data),

  disconnect: () =>
    api.delete<{ message: string }>('/gmail/disconnect').then((r) => r.data),
};
