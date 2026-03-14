import { format, parseISO, isValid } from 'date-fns';

export function formatDate(dateStr: string | undefined | null, fmt = 'MMM dd, yyyy'): string {
  if (!dateStr) return '—';
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, fmt) : '—';
}

export function formatDateInput(dateStr: string | undefined | null): string {
  if (!dateStr) return '';
  const date = parseISO(dateStr);
  return isValid(date) ? format(date, 'yyyy-MM-dd') : '';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getAxiosErrorMessage(error: unknown, fallback = 'Something went wrong'): string {
  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response?: { data?: { error?: string } } }).response;
    return response?.data?.error ?? fallback;
  }
  return fallback;
}
