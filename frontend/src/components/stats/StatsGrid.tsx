import { TrendingUp, Briefcase, BarChart2, Award } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import type { Stats } from '@/types';

interface StatsGridProps {
  stats?: Stats;
  isLoading: boolean;
}

export function StatsGrid({ stats, isLoading }: StatsGridProps) {
  const inProgress = stats
    ? (stats.byStatus.APPLIED ?? 0) +
      (stats.byStatus.PHONE_SCREEN ?? 0) +
      (stats.byStatus.INTERVIEW ?? 0)
    : 0;

  const cards = [
    {
      title: 'Total Applications',
      value: stats?.total ?? 0,
      icon: Briefcase,
      description: 'All time',
    },
    {
      title: 'In Progress',
      value: inProgress,
      icon: TrendingUp,
      description: 'Applied + Screening + Interview',
    },
    {
      title: 'Response Rate',
      value: `${stats?.responseRate ?? 0}%`,
      icon: BarChart2,
      description: 'Applications that got a response',
    },
    {
      title: 'Offers',
      value: stats?.byStatus.OFFER ?? 0,
      icon: Award,
      description: `${stats?.offerRate ?? 0}% offer rate`,
    },
  ];

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-28 w-full" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {cards.map(({ title, value, icon: Icon, description }) => (
        <Card key={title}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{title}</CardTitle>
            <Icon className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
