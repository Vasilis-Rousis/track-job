import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Pencil, Trash2, ChevronLeft, ChevronRight, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
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
import { Skeleton } from '@/components/ui/skeleton';
import { StatusBadge } from './StatusBadge';
import { ApplicationForm } from './ApplicationForm';
import type { Application, PaginationMeta } from '@/types';
import { formatDate } from '@/utils/helpers';
import { useDeleteApplication } from '@/hooks/useApplications';
import { toast } from '@/hooks/use-toast';
import { FollowUpEmailModal } from '@/components/emails/FollowUpEmailModal';

interface ApplicationTableProps {
  applications: Application[];
  pagination: PaginationMeta;
  isLoading: boolean;
  page: number;
  onPageChange: (page: number) => void;
}

export function ApplicationTable({
  applications,
  pagination,
  isLoading,
  page,
  onPageChange,
}: ApplicationTableProps) {
  const navigate = useNavigate();
  const [editApp, setEditApp] = useState<Application | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [emailApp, setEmailApp] = useState<Application | null>(null);
  const deleteApplication = useDeleteApplication();

  const handleDelete = async () => {
    if (!deleteId) return;
    try {
      await deleteApplication.mutateAsync(deleteId);
      toast({ title: 'Application deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete application' });
    } finally {
      setDeleteId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-12 w-full" />
        ))}
      </div>
    );
  }

  if (applications.length === 0) {
    return (
      <div className="rounded-lg border border-dashed p-12 text-center">
        <p className="text-muted-foreground">No applications found.</p>
      </div>
    );
  }

  return (
    <>
      <div className="rounded-md border">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-muted/50">
              <th className="px-4 py-3 text-left font-medium">Company</th>
              <th className="px-4 py-3 text-left font-medium">Role</th>
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Location</th>
              <th className="px-4 py-3 text-left font-medium">Status</th>
              <th className="hidden px-4 py-3 text-left font-medium md:table-cell">Applied</th>
              <th className="hidden px-4 py-3 text-left font-medium lg:table-cell">Follow-up</th>
              <th className="px-4 py-3 text-right font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {applications.map((app) => (
              <tr
                key={app.id}
                className="border-b cursor-pointer transition-colors hover:bg-muted/25"
                onClick={() => navigate(`/applications/${app.id}`)}
              >
                <td className="px-4 py-3 font-medium">{app.company}</td>
                <td className="px-4 py-3 text-muted-foreground">{app.role}</td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {app.location ?? '—'}
                </td>
                <td className="px-4 py-3">
                  <StatusBadge status={app.status} />
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground md:table-cell">
                  {formatDate(app.appliedAt)}
                </td>
                <td className="hidden px-4 py-3 text-muted-foreground lg:table-cell">
                  {formatDate(app.followUpAt)}
                </td>
                <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-end gap-1">
                    {app.status === 'APPLIED' && (
                      <Button
                        variant="ghost"
                        size="icon"
                        title="Schedule follow-up email"
                        onClick={() => setEmailApp(app)}
                      >
                        <Mail className="h-4 w-4" />
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditApp(app)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteId(app.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="grid grid-cols-3 items-center">
          <p className="text-sm text-muted-foreground">
            Showing {(page - 1) * pagination.limit + 1}–
            {Math.min(page * pagination.limit, pagination.total)} of{' '}
            {pagination.total}
          </p>
          <div className="flex justify-center gap-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 1}
              onClick={() => onPageChange(page - 1)}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              disabled={page >= pagination.totalPages}
              onClick={() => onPageChange(page + 1)}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editApp} onOpenChange={() => setEditApp(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          {editApp && (
            <ApplicationForm
              application={editApp}
              onSuccess={() => setEditApp(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Follow-up Email Modal */}
      {emailApp && (
        <FollowUpEmailModal
          application={emailApp}
          open={!!emailApp}
          onOpenChange={(v) => { if (!v) setEmailApp(null); }}
        />
      )}

      {/* Delete Confirm */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the application and all its history.
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
