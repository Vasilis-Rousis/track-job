import { api } from './axios';
import type { Contact } from '@/types';

export interface CreateContactData {
  name: string;
  title?: string;
  email?: string;
  linkedin?: string;
  applicationId?: string;
  notes?: string;
}

export const contactsApi = {
  list: (params?: { applicationId?: string; search?: string }) =>
    api
      .get<{ data: Contact[] }>('/contacts', { params })
      .then((r) => r.data.data),

  create: (data: CreateContactData) =>
    api.post<Contact>('/contacts', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateContactData>) =>
    api.patch<Contact>(`/contacts/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<{ message: string }>(`/contacts/${id}`)
      .then((r) => r.data),
};
