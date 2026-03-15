import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Loader2, Link as LinkIcon, Trash2, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useScheduledEmails, useDeleteEmail, useGmailStatus } from '@/hooks/useEmails';
import { useContacts } from '@/hooks/useContacts';
import { toast } from '@/hooks/use-toast';
import { getAxiosErrorMessage } from '@/utils/helpers';
import type { ScheduledEmail, EmailStatus } from '@/types';
import { EmailDetailModal } from '@/components/emails/EmailDetailModal';

const statusConfig: Record<EmailStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Scheduled', variant: 'default' },
  SENT: { label: 'Sent', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

type SortField = 'scheduledFor' | 'company';
type SortDir = 'asc' | 'desc';

function SortIcon({ field, current, dir }: { field: SortField; current: SortField; dir: SortDir }) {
  if (field !== current) return <ArrowUpDown className="ml-1 h-3.5 w-3.5 text-muted-foreground/50" />;
  return dir === 'asc'
    ? <ArrowUp className="ml-1 h-3.5 w-3.5" />
    : <ArrowDown className="ml-1 h-3.5 w-3.5" />;
}

export default function ScheduledEmailsPage() {
  const navigate = useNavigate();
  const { data: gmailStatus, isLoading: gmailLoading } = useGmailStatus();
  const { data: emails = [], isLoading } = useScheduledEmails();
  const { data: allContacts = [] } = useContacts();
  const deleteEmail = useDeleteEmail();

  const [selectedEmail, setSelectedEmail] = useState<ScheduledEmail | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<ScheduledEmail | null>(null);

  const [statusFilter, setStatusFilter] = useState<EmailStatus | 'ALL'>('ALL');
  const [sortField, setSortField] = useState<SortField>('scheduledFor');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (field: SortField) => {
    if (field === sortField) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  const displayed = useMemo(() => {
    let list = statusFilter === 'ALL' ? emails : emails.filter((e) => e.status === statusFilter);
    list = [...list].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'scheduledFor') {
        cmp = new Date(a.scheduledFor).getTime() - new Date(b.scheduledFor).getTime();
      } else {
        cmp = (a.application?.company ?? '').localeCompare(b.application?.company ?? '');
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
    return list;
  }, [emails, statusFilter, sortField, sortDir]);

  const handleRowClick = (email: ScheduledEmail) => {
    setSelectedEmail(email);
    setModalOpen(true);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteEmail.mutateAsync(deleteTarget.id);
      toast({ title: 'Email deleted' });
      setDeleteTarget(null);
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: getAxiosErrorMessage(err) });
    }
  };

  if (gmailLoading) {
    return (
      <div className="flex items-center justify-center py-24">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!gmailStatus?.connected) {
    return (
      <div className="flex flex-col items-center justify-center py-24 space-y-4">
        <div className="rounded-md border border-dashed p-8 text-center space-y-3 max-w-sm w-full">
          <p className="text-sm font-medium">Gmail not connected</p>
          <p className="text-sm text-muted-foreground">
            Connect your Gmail account in Settings to send scheduled emails.
          </p>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <LinkIcon className="mr-2 h-4 w-4" />
            Go to Settings
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Scheduled Emails</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and manage your scheduled follow-up emails.
        </p>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3">
        <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as EmailStatus | 'ALL')}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ALL">All statuses</SelectItem>
            <SelectItem value="PENDING">Scheduled</SelectItem>
            <SelectItem value="SENT">Sent</SelectItem>
            <SelectItem value="FAILED">Failed</SelectItem>
            <SelectItem value="CANCELLED">Cancelled</SelectItem>
          </SelectContent>
        </Select>

        {statusFilter !== 'ALL' && (
          <Button variant="ghost" size="sm" onClick={() => setStatusFilter('ALL')} className="text-muted-foreground">
            Clear filter
          </Button>
        )}

        <span className="ml-auto text-sm text-muted-foreground">
          {displayed.length} {displayed.length === 1 ? 'email' : 'emails'}
        </span>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : displayed.length === 0 ? (
        <div className="rounded-md border border-dashed p-10 text-center">
          <p className="text-sm text-muted-foreground">
            {statusFilter === 'ALL'
              ? <>No scheduled emails yet. Schedule one from any application with status <span className="font-medium">Applied</span>.</>
              : 'No emails match this filter.'}
          </p>
        </div>
      ) : (
        <div className="rounded-md border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b">
              <tr>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button
                    type="button"
                    className="inline-flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('company')}
                  >
                    Application
                    <SortIcon field="company" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Sending to</th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">
                  <button
                    type="button"
                    className="inline-flex items-center hover:text-foreground transition-colors"
                    onClick={() => handleSort('scheduledFor')}
                  >
                    Scheduled for
                    <SortIcon field="scheduledFor" current={sortField} dir={sortDir} />
                  </button>
                </th>
                <th className="text-left px-4 py-3 font-medium text-muted-foreground">Status</th>
                <th className="px-4 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {displayed.map((email) => {
                const cfg = statusConfig[email.status];
                return (
                  <tr
                    key={email.id}
                    className="hover:bg-muted/30 cursor-pointer transition-colors"
                    onClick={() => handleRowClick(email)}
                  >
                    <td className="px-4 py-3">
                      {email.application ? (
                        <div>
                          <p className="font-medium">{email.application.company}</p>
                          <p className="text-xs text-muted-foreground">{email.application.role}</p>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3 max-w-[220px]">
                      {(() => {
                        const recipients = email.contactIds
                          .map((id) => allContacts.find((c) => c.id === id))
                          .filter(Boolean)
                          .map((c) => c!.email ?? c!.name);
                        return recipients.length > 0 ? (
                          <p className="truncate text-sm">{recipients.join(', ')}</p>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        );
                      })()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                      {format(parseISO(email.scheduledFor), 'dd MMM yyyy, HH:mm')}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeleteTarget(email);
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      <EmailDetailModal
        email={selectedEmail}
        open={modalOpen}
        onOpenChange={(v) => {
          setModalOpen(v);
          if (!v) setSelectedEmail(null);
        }}
      />

      <AlertDialog open={!!deleteTarget} onOpenChange={(v) => { if (!v) setDeleteTarget(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete scheduled email?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.status === 'PENDING'
                ? 'This will cancel the scheduled send and permanently remove it.'
                : 'This will permanently remove the email record.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
