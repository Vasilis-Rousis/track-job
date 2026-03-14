import { useNavigate } from 'react-router-dom';
import { isWithinInterval, addDays, parseISO } from 'date-fns';
import { Calendar, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { StatsGrid } from '@/components/stats/StatsGrid';
import { StatusBadge } from '@/components/applications/StatusBadge';
import { useStats } from '@/hooks/useStats';
import { useApplications } from '@/hooks/useApplications';
import { useAuthStore } from '@/store/authStore';
import { formatDate } from '@/utils/helpers';

export function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: recentData, isLoading: recentLoading } = useApplications({
    sort: 'appliedAt_desc',
    limit: 5,
  });

  const navigate = useNavigate();

  const now = new Date();
  const in7Days = addDays(now, 7);
  const followUps = (recentData?.data.filter(
    (app) =>
      app.followUpAt &&
      isWithinInterval(parseISO(app.followUpAt), { start: now, end: in7Days })
  ) ?? []).sort((a, b) => parseISO(a.followUpAt!).getTime() - parseISO(b.followUpAt!).getTime());

  const firstName = user?.name.split(' ')[0] ?? 'there';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Good day, {firstName}!</h1>
        <p className="text-muted-foreground">Here's an overview of your job search.</p>
      </div>

      <StatsGrid stats={stats} isLoading={statsLoading} />

      <div className="grid gap-6 md:grid-cols-2">
        {/* Recent Applications */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0">
            <CardTitle className="text-base">Recent Applications</CardTitle>
            <button
              onClick={() => navigate('/applications')}
              className="text-xs text-primary hover:underline"
            >
              View all
            </button>
          </CardHeader>
          <CardContent>
            {recentLoading ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-10 w-full" />
                ))}
              </div>
            ) : recentData?.data.length === 0 ? (
              <div className="py-6 text-center">
                <Calendar className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No applications yet.{' '}
                  <button
                    onClick={() => navigate('/applications')}
                    className="text-primary hover:underline"
                  >
                    Add your first one
                  </button>
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div className="ml-4 flex-shrink-0 text-right">
                      <StatusBadge status={app.status} />
                      <p className="mt-1 text-xs text-muted-foreground">
                        {formatDate(app.appliedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Follow-ups */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Upcoming Follow-ups</CardTitle>
          </CardHeader>
          <CardContent>
            {followUps.length === 0 ? (
              <div className="py-6 text-center">
                <Clock className="mx-auto mb-2 h-8 w-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">
                  No follow-ups in the next 7 days.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
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
                    <div className="ml-4 flex-shrink-0 text-right">
                      <p className="text-xs font-medium text-primary">
                        {formatDate(app.followUpAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
