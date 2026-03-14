import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Pencil,
  Trash2,
  ExternalLink,
  MapPin,
  Calendar,
  DollarSign,
  Clock,
  Plus,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import { StatusBadge } from '@/components/applications/StatusBadge';
import { ApplicationForm } from '@/components/applications/ApplicationForm';
import { ContactForm } from '@/components/contacts/ContactForm';
import { LinkContactTab } from '@/components/contacts/LinkContactTab';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { useApplication, useDeleteApplication } from '@/hooks/useApplications';
import { useContacts, useDeleteContact } from '@/hooks/useContacts';
import { formatDate } from '@/utils/helpers';
import { toast } from '@/hooks/use-toast';

export function ApplicationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);

  const { data: app, isLoading } = useApplication(id!);
  const { data: contacts } = useContacts({ applicationId: id });
  const deleteApplication = useDeleteApplication();
  const deleteContact = useDeleteContact();

  const handleDelete = async () => {
    if (!id) return;
    try {
      await deleteApplication.mutateAsync(id);
      toast({ title: 'Application deleted' });
      navigate('/applications');
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete' });
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!app) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Application not found.</p>
        <Button variant="link" onClick={() => navigate('/applications')}>
          Back to applications
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/applications')}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{app.company}</h1>
              <StatusBadge status={app.status} />
            </div>
            <p className="text-lg text-muted-foreground">{app.role}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setEditOpen(true)}>
            <Pencil className="mr-2 h-4 w-4" />
            Edit
          </Button>
          <Button
            variant="outline"
            className="text-destructive"
            onClick={() => setDeleteOpen(true)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            Delete
          </Button>
        </div>
      </div>

      {/* Details */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            {app.location && (
              <div className="flex items-center gap-2 text-sm">
                <MapPin className="h-4 w-4 text-muted-foreground" />
                <span>{app.location}</span>
              </div>
            )}
            {app.salary && (
              <div className="flex items-center gap-2 text-sm">
                <DollarSign className="h-4 w-4 text-muted-foreground" />
                <span>{app.salary}</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              <span>Applied {formatDate(app.appliedAt)}</span>
            </div>
            {app.followUpAt && (
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <span>Follow-up {formatDate(app.followUpAt)}</span>
              </div>
            )}
            {app.jobUrl && (
              <div className="flex items-center gap-2 text-sm col-span-full">
                <ExternalLink className="h-4 w-4 text-muted-foreground" />
                <a
                  href={app.jobUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline truncate"
                >
                  {app.jobUrl}
                </a>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Notes */}
      {app.notes && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Notes</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="whitespace-pre-wrap font-sans text-sm text-muted-foreground">
              {app.notes}
            </pre>
          </CardContent>
        </Card>
      )}

      {/* Status History */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Status History</CardTitle>
        </CardHeader>
        <CardContent>
          {app.statusHistory && app.statusHistory.length > 0 ? (
            <div className="max-h-64 overflow-y-auto show-scrollbar space-y-3">
              {app.statusHistory.map((h, i) => (
                <div key={h.id} className="flex items-start gap-3">
                  <div className="mt-1 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-primary/10">
                    <div
                      className={`h-2 w-2 rounded-full ${i === 0 ? 'bg-primary' : 'bg-muted-foreground'}`}
                    />
                  </div>
                  <div>
                    <p className="text-sm font-medium">
                      {h.fromStatus
                        ? `${h.fromStatus.replace('_', ' ')} → ${h.toStatus.replace('_', ' ')}`
                        : `Started as ${h.toStatus.replace('_', ' ')}`}
                    </p>
                    <p className="text-xs text-muted-foreground">{formatDate(h.changedAt, 'MMM dd, yyyy HH:mm')}</p>
                    {h.note && <p className="text-xs text-muted-foreground mt-1">{h.note}</p>}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-base">Contacts</CardTitle>
            <Button size="sm" variant="outline" onClick={() => setAddContactOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Add Contact
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {contacts && contacts.length > 0 ? (
            <div className="space-y-3">
              {contacts.map((contact) => (
                <div key={contact.id} className="flex items-start justify-between gap-3 rounded-md border p-3">
                  <div>
                    <p className="font-medium text-sm">{contact.name}</p>
                    {contact.title && (
                      <p className="text-xs text-muted-foreground">{contact.title}</p>
                    )}
                    {contact.email && (
                      <a
                        href={`mailto:${contact.email}`}
                        className="text-xs text-primary hover:underline"
                      >
                        {contact.email}
                      </a>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
                    title="Delete contact"
                    onClick={async () => {
                      try {
                        await deleteContact.mutateAsync(contact.id);
                        toast({ title: 'Contact deleted' });
                      } catch {
                        toast({ variant: 'destructive', title: 'Failed to delete contact' });
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No contacts linked yet.</p>
          )}
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Application</DialogTitle>
          </DialogHeader>
          <ApplicationForm application={app} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete application?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this application and all its history.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDelete}
            >
              {deleteApplication.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Contact Dialog */}
      <Dialog open={addContactOpen} onOpenChange={setAddContactOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Contact</DialogTitle>
          </DialogHeader>
          <Tabs defaultValue="new">
            <TabsList className="w-full">
              <TabsTrigger value="new" className="flex-1">Create New</TabsTrigger>
              <TabsTrigger value="link" className="flex-1">Link Existing</TabsTrigger>
            </TabsList>
            <TabsContent value="new">
              <ContactForm
                applicationId={id}
                onSuccess={() => setAddContactOpen(false)}
              />
            </TabsContent>
            <TabsContent value="link">
              <LinkContactTab
                applicationId={id!}
                alreadyLinked={contacts ?? []}
                onSuccess={() => setAddContactOpen(false)}
              />
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
}
