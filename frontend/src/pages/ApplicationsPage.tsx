import { useState } from 'react';
import { Plus, Search, LayoutList, LayoutGrid } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { ApplicationTable } from '@/components/applications/ApplicationTable';
import { KanbanBoard } from '@/components/applications/KanbanBoard';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { useApplications } from '@/hooks/useApplications';
import type { ApplicationStatus } from '@/types';
import { ALL_STATUSES, STATUS_LABELS } from '@/utils/constants';

type ViewMode = 'table' | 'kanban';
type SortOption = 'appliedAt_desc' | 'appliedAt_asc' | 'company_asc' | 'updatedAt_desc';

export function ApplicationsPage() {
  const [view, setView] = useState<ViewMode>(
    () => (localStorage.getItem('applications-view') as ViewMode) ?? 'table'
  );
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState<ApplicationStatus | ''>('');
  const [sort, setSort] = useState<SortOption>('appliedAt_desc');
  const [page, setPage] = useState(1);
  const [addOpen, setAddOpen] = useState(false);

  const { data, isLoading } = useApplications({
    search: search || undefined,
    status: status || undefined,
    sort,
    page,
    limit: view === 'kanban' ? 100 : 20,
  });

  const applications = data?.data ?? [];
  const pagination = data?.pagination ?? { total: 0, page: 1, limit: 20, totalPages: 0 };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Applications</h1>
          <p className="text-muted-foreground">
            {pagination.total} total application{pagination.total !== 1 ? 's' : ''}
          </p>
        </div>
        <Dialog open={addOpen} onOpenChange={setAddOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Add Application
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add Application</DialogTitle>
            </DialogHeader>
            <ApplicationForm onSuccess={() => setAddOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-48">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Search company or role..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="pl-9"
          />
        </div>

        <Select
          value={status || 'all'}
          onValueChange={(v) => { setStatus(v === 'all' ? '' : (v as ApplicationStatus)); setPage(1); }}
        >
          <SelectTrigger className="w-40">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            {ALL_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>{STATUS_LABELS[s]}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
          <SelectTrigger className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="appliedAt_desc">Newest first</SelectItem>
            <SelectItem value="appliedAt_asc">Oldest first</SelectItem>
            <SelectItem value="company_asc">Company A–Z</SelectItem>
            <SelectItem value="updatedAt_desc">Recently updated</SelectItem>
          </SelectContent>
        </Select>

        <div className="flex gap-1 rounded-md border p-1">
          <Button
            variant={view === 'table' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setView('table'); localStorage.setItem('applications-view', 'table'); }}
          >
            <LayoutList className="h-4 w-4" />
          </Button>
          <Button
            variant={view === 'kanban' ? 'secondary' : 'ghost'}
            size="sm"
            onClick={() => { setView('kanban'); localStorage.setItem('applications-view', 'kanban'); }}
          >
            <LayoutGrid className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {view === 'table' ? (
        <ApplicationTable
          applications={applications}
          pagination={pagination}
          isLoading={isLoading}
          page={page}
          onPageChange={setPage}
        />
      ) : (
        <KanbanBoard applications={applications} isLoading={isLoading} />
      )}
    </div>
  );
}
