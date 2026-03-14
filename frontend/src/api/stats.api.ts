import { api } from './axios';
import type { Stats } from '@/types';

export const statsApi = {
  get: () => api.get<Stats>('/stats').then((r) => r.data),
};
