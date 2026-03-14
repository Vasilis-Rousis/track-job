import { useState } from 'react';
import { Pencil, Trash2, Mail, Linkedin } from 'lucide-react';
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
import { ContactForm } from './ContactForm';
import type { Contact } from '@/types';
import { useDeleteContact } from '@/hooks/useContacts';
import { toast } from '@/hooks/use-toast';
import { getInitials } from '@/utils/helpers';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';

interface ContactCardProps {
  contact: Contact;
}

export function ContactCard({ contact }: ContactCardProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const deleteContact = useDeleteContact();

  const handleDelete = async () => {
    try {
      await deleteContact.mutateAsync(contact.id);
      toast({ title: 'Contact deleted' });
    } catch {
      toast({ variant: 'destructive', title: 'Failed to delete contact' });
    } finally {
      setDeleteOpen(false);
    }
  };

  return (
    <>
      <div className="flex items-start gap-4 rounded-lg border bg-card p-4">
        <Avatar>
          <AvatarFallback>{getInitials(contact.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="font-medium">{contact.name}</p>
          {contact.title && (
            <p className="text-sm text-muted-foreground">{contact.title}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-3">
            {contact.email && (
              <a
                href={`mailto:${contact.email}`}
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Mail className="h-3 w-3" />
                {contact.email}
              </a>
            )}
            {contact.linkedin && (
              <a
                href={contact.linkedin}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1 text-xs text-primary hover:underline"
              >
                <Linkedin className="h-3 w-3" />
                LinkedIn
              </a>
            )}
          </div>
          {contact.application && (
            <p className="mt-1 text-xs text-muted-foreground">
              {contact.application.company} — {contact.application.role}
            </p>
          )}
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" onClick={() => setEditOpen(true)}>
            <Pencil className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="icon" onClick={() => setDeleteOpen(true)}>
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </div>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Contact</DialogTitle>
          </DialogHeader>
          <ContactForm contact={contact} onSuccess={() => setEditOpen(false)} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete contact?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete {contact.name}.
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
