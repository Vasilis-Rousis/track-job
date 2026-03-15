import { api } from './axios';
import type { AuthResponse, User } from '@/types';

export const authApi = {
  register: (data: { name: string; email: string; password: string }) =>
    api.post<{ message: string }>('/auth/register', data).then((r) => r.data),

  login: (data: { email: string; password: string }) =>
    api.post<AuthResponse>('/auth/login', data).then((r) => r.data),

  logout: () => api.post<{ message: string }>('/auth/logout').then((r) => r.data),

  me: () => api.get<User>('/auth/me').then((r) => r.data),

  updateProfile: (data: { name: string }) =>
    api.patch<User>('/auth/profile', data).then((r) => r.data),

  changePassword: (data: { currentPassword: string; newPassword: string }) =>
    api.post<{ message: string }>('/auth/change-password', data).then((r) => r.data),
};
