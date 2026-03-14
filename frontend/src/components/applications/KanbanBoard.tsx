import type { Application } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/utils/constants';
import { ApplicationCard } from './ApplicationCard';
import { Skeleton } from '@/components/ui/skeleton';

interface KanbanBoardProps {
  applications: Application[];
  isLoading: boolean;
}

export function KanbanBoard({ applications, isLoading }: KanbanBoardProps) {
  if (isLoading) {
    return (
      <div className="flex gap-4 overflow-x-auto pb-4">
        {ALL_STATUSES.map((s) => (
          <div key={s} className="w-60 flex-shrink-0 space-y-2">
            <Skeleton className="h-6 w-24" />
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        ))}
      </div>
    );
  }

  const byStatus = ALL_STATUSES.reduce<Record<string, Application[]>>((acc, s) => {
    acc[s] = applications.filter((a) => a.status === s);
    return acc;
  }, {});

  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {ALL_STATUSES.map((status) => (
        <div key={status} className="w-60 flex-shrink-0">
          <div className="mb-2 flex items-center justify-between">
            <h3 className="text-sm font-semibold">{STATUS_LABELS[status]}</h3>
            <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
              {byStatus[status].length}
            </span>
          </div>
          <div className="space-y-2">
            {byStatus[status].length === 0 ? (
              <div className="rounded-md border border-dashed p-4 text-center text-xs text-muted-foreground">
                Empty
              </div>
            ) : (
              byStatus[status].map((app) => (
                <ApplicationCard key={app.id} application={app} />
              ))
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
