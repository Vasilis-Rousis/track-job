import { api } from './axios';
import type { User } from '@/types';

export const adminApi = {
  getUsers: (status?: string) =>
    api.get<User[]>('/admin/users', { params: status ? { status } : {} }).then((r) => r.data),

  approveUser: (id: string) =>
    api.patch<User>(`/admin/users/${id}/approve`).then((r) => r.data),

  rejectUser: (id: string) =>
    api.patch<User>(`/admin/users/${id}/reject`).then((r) => r.data),
};
