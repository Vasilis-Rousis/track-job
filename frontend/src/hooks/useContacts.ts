import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { contactsApi, type CreateContactData } from '@/api/contacts.api';

export const CONTACTS_KEY = ['contacts'] as const;

export function useContacts(params?: { applicationId?: string; search?: string }) {
  return useQuery({
    queryKey: [...CONTACTS_KEY, params],
    queryFn: () => contactsApi.list(params),
    staleTime: 1000 * 30,
  });
}

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: CreateContactData) => contactsApi.create(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateContactData> }) =>
      contactsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => contactsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: CONTACTS_KEY });
    },
  });
}
