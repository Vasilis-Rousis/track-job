import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  applicationsApi,
  type ApplicationsListParams,
  type CreateApplicationData,
} from '@/api/applications.api';

export const APPLICATIONS_KEY = ['applications'] as const;
export const STATS_KEY = ['stats'] as const;

export function useApplications(params?: ApplicationsListParams) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, params],
    queryFn: () => applicationsApi.list(params),
    staleTime: 1000 * 30,
  });
}

export function useApplication(id: string) {
  return useQuery({
    queryKey: [...APPLICATIONS_KEY, id],
    queryFn: () => applicationsApi.getById(id),
    enabled: !!id,
  });
}

export function useCreateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateApplicationData) => applicationsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}

export function useUpdateApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({
      id,
      data,
    }: {
      id: string;
      data: Partial<CreateApplicationData>;
    }) => applicationsApi.update(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      qc.invalidateQueries({ queryKey: [...APPLICATIONS_KEY, id] });
      qc.invalidateQueries({ queryKey: STATS_KEY });
    },
  });
}

export function useDeleteApplication() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => applicationsApi.delete(id),
    onSuccess: (_, id) => {
      qc.invalidateQueries({ queryKey: APPLICATIONS_KEY });
      qc.invalidateQueries({ queryKey: STATS_KEY });
      try {
        const raw = localStorage.getItem('kanban-order');
        if (raw) {
          const order = JSON.parse(raw);
          for (const col of Object.keys(order)) {
            order[col] = order[col].filter((itemId: string) => itemId !== id);
          }
          localStorage.setItem('kanban-order', JSON.stringify(order));
        }
      } catch {}
    },
  });
}
