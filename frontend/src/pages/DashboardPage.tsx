import { useNavigate } from 'react-router-dom';
import { isWithinInterval, addDays, parseISO, format } from 'date-fns';
import { Calendar, Clock, Mail } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsGrid } from '@/components/stats/StatsGrid';
import { StatusBadge } from '@/components/applications/StatusBadge';
import { useStats } from '@/hooks/useStats';
import { useApplications } from '@/hooks/useApplications';
import { useScheduledEmails, useGmailStatus } from '@/hooks/useEmails';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/helpers';
import type { EmailStatus } from '@/types';

const emailStatusConfig: Record<EmailStatus, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  PENDING: { label: 'Scheduled', variant: 'default' },
  SENT: { label: 'Sent', variant: 'secondary' },
  FAILED: { label: 'Failed', variant: 'destructive' },
  CANCELLED: { label: 'Cancelled', variant: 'outline' },
};

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: recentData, isLoading: recentLoading } = useApplications({
    sort: 'appliedAt_desc',
    limit: 5,
  });
  const { data: gmailStatus } = useGmailStatus();
  const { data: rawEmails = [], isLoading: emailsLoading } = useScheduledEmails();

  const navigate = useNavigate();

  const now = new Date();
  const oneDayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const emails = rawEmails
    .filter((e) => {
      if (e.status === 'CANCELLED') return false;
      if (e.status === 'SENT') return e.sentAt ? parseISO(e.sentAt) >= oneDayAgo : false;
      return true;
    })
    .sort((a, b) => parseISO(a.scheduledFor).getTime() - parseISO(b.scheduledFor).getTime());
  const in7Days = addDays(now, 7);
  const followUps = (recentData?.data.filter(
    (app) =>
      app.followUpAt &&
      isWithinInterval(parseISO(app.followUpAt), { start: now, end: in7Days })
  ) ?? []).sort((a, b) => parseISO(a.followUpAt!).getTime() - parseISO(b.followUpAt!).getTime());

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="flex h-full flex-col gap-4">
      {/* Greeting */}
      <div>
        <h1 className="text-2xl font-bold">Good day, {firstName}!</h1>
        <p className="text-muted-foreground text-sm">Here's an overview of your job search.</p>
      </div>

      {/* Stats */}
      <StatsGrid stats={stats} isLoading={statsLoading} />

      {/* Bottom section — fills remaining height */}
      <div className="flex min-h-0 flex-1 flex-col gap-4">

      {/* Top row: Recent Applications + Follow-ups */}
      <div className="grid min-h-0 max-h-[28rem] flex-1 gap-4 md:grid-cols-2">

        {/* Recent Applications */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0 pb-3">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <button
              onClick={() => navigate('/applications')}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto show-scrollbar min-h-0 pt-0">
            {recentLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentData?.data.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                <Calendar className="mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No applications yet.{' '}
                  <button onClick={() => navigate('/applications')} className="text-primary hover:underline">
                    Add one
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-1">
                {recentData?.data.map((app) => (
                  <div
                    key={app.id}
                    className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted/50"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{app.company}</p>
                      <p className="truncate text-xs text-muted-foreground">{app.role}</p>
                    </div>
                    <div className="ml-3 flex-shrink-0 text-right">
                      <StatusBadge status={app.status} />
                      <p className="mt-0.5 text-xs text-muted-foreground">{formatDate(app.appliedAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Upcoming Follow-ups */}
        <Card className="flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 pb-3">
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto show-scrollbar min-h-0 pt-0">
            {followUps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full py-4 text-center">
                <Clock className="mb-2 h-7 w-7 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No follow-ups in the next 7 days.</p>
              </div>
            ) : (
              <div className="space-y-1">
                {followUps.map((app) => (
                  <div
                    key={app.id}
                    className="flex cursor-pointer items-center justify-between rounded-md p-2 hover:bg-muted/50"
                    onClick={() => navigate(`/applications/${app.id}`)}
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{app.company}</p>
                      <p className="truncate text-xs text-muted-foreground">{app.role}</p>
                    </div>
                    <p className="ml-3 flex-shrink-0 text-xs font-medium text-primary">
                      {formatDate(app.followUpAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

      </div>

        {/* Scheduled Emails — full width */}
        <Card className="flex flex-col overflow-hidden shrink-0 h-44">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 shrink-0 pb-3">
            <CardTitle className="text-base">Scheduled Emails</CardTitle>
            <button
              onClick={() => navigate('/emails')}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </CardHeader>
          <CardContent className="overflow-x-auto pt-0 pb-3">
            {emailsLoading ? (
              <div className="flex gap-3">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-48 shrink-0" />
                ))}
              </div>
            ) : !gmailStatus?.connected ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>
                  <button onClick={() => navigate('/settings')} className="text-primary hover:underline">Connect Gmail</button>
                  {' '}to schedule emails.
                </span>
              </div>
            ) : emails.length === 0 ? (
              <div className="flex items-center gap-2 py-2 text-sm text-muted-foreground">
                <Mail className="h-4 w-4 shrink-0" />
                <span>No emails scheduled yet.</span>
              </div>
            ) : (
              <div className="flex gap-3">
                {emails.map((email) => {
                  const cfg = emailStatusConfig[email.status];
                  return (
                    <div
                      key={email.id}
                      onClick={() => navigate('/emails')}
                      className="flex shrink-0 cursor-pointer flex-col justify-between rounded-md border p-3 hover:bg-muted/50 w-64 h-20"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium">{email.application?.company ?? '—'}</p>
                        <Badge variant={cfg.variant} className="shrink-0 text-xs">{cfg.label}</Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(parseISO(email.scheduledFor), 'dd MMM yyyy, HH:mm')}
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>

      </div>
    </div>
  );
}
