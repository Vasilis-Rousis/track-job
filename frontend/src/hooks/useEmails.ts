import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { emailsApi, gmailApi, type ScheduleEmailData, type UpdateEmailData, type SendNowData } from '@/api/emails.api';

export const EMAILS_KEY = ['emails'] as const;
export const GMAIL_STATUS_KEY = ['gmail-status'] as const;

export function useScheduledEmails(params?: { applicationId?: string }) {
  return useQuery({
    queryKey: [...EMAILS_KEY, params],
    queryFn: () => emailsApi.list(params),
    staleTime: 1000 * 30,
  });
}

export function useSendNow() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: SendNowData) => emailsApi.sendNow(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMAILS_KEY });
    },
  });
}

export function useScheduleEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: ScheduleEmailData) => emailsApi.schedule(data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMAILS_KEY });
    },
  });
}

export function useUpdateEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateEmailData }) => emailsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMAILS_KEY });
    },
  });
}

export function useDeleteEmail() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => emailsApi.delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: EMAILS_KEY });
    },
  });
}

export function useGmailStatus() {
  return useQuery({
    queryKey: GMAIL_STATUS_KEY,
    queryFn: () => gmailApi.getStatus(),
    staleTime: 1000 * 60,
  });
}

export function useGmailDisconnect() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => gmailApi.disconnect(),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: GMAIL_STATUS_KEY });
    },
  });
}
