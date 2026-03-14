import { api } from './axios';
import type { Application, PaginatedResponse, ApplicationStatus } from '@/types';

export interface ApplicationsListParams {
  status?: ApplicationStatus;
  search?: string;
  sort?: 'appliedAt_desc' | 'appliedAt_asc' | 'company_asc' | 'updatedAt_desc';
  page?: number;
  limit?: number;
}

export interface CreateApplicationData {
  company: string;
  role: string;
  location?: string;
  jobUrl?: string;
  status?: ApplicationStatus;
  salary?: string;
  notes?: string;
  appliedAt?: string;
  followUpAt?: string;
}

export const applicationsApi = {
  list: (params?: ApplicationsListParams) =>
    api
      .get<PaginatedResponse<Application>>('/applications', { params })
      .then((r) => r.data),

  getById: (id: string) =>
    api.get<Application>(`/applications/${id}`).then((r) => r.data),

  create: (data: CreateApplicationData) =>
    api.post<Application>('/applications', data).then((r) => r.data),

  update: (id: string, data: Partial<CreateApplicationData>) =>
    api.patch<Application>(`/applications/${id}`, data).then((r) => r.data),

  delete: (id: string) =>
    api
      .delete<{ message: string }>(`/applications/${id}`)
      .then((r) => r.data),
};
