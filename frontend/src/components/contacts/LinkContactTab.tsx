import { useState } from 'react';
import { Search, Loader2, Link } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { DialogFooter } from '@/components/ui/dialog';
import { useContacts, useUpdateContact } from '@/hooks/useContacts';
import { toast } from '@/hooks/use-toast';
import { getAxiosErrorMessage } from '@/utils/helpers';
import type { Contact } from '@/types';

interface LinkContactTabProps {
  applicationId: string;
  alreadyLinked: Contact[];
  onSuccess?: () => void;
}

export function LinkContactTab({ applicationId, alreadyLinked, onSuccess }: LinkContactTabProps) {
  const [search, setSearch] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: allContacts = [], isLoading } = useContacts({ search: search || undefined });
  const update = useUpdateContact();

  const alreadyLinkedIds = new Set(alreadyLinked.map((c) => c.id));
  const available = allContacts.filter((c) => !alreadyLinkedIds.has(c.id));

  const handleLink = async () => {
    if (!selectedId) return;
    try {
      await update.mutateAsync({ id: selectedId, data: { applicationId } });
      toast({ title: 'Contact linked' });
      onSuccess?.();
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: getAxiosErrorMessage(err) });
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search contacts..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      <div className="max-h-64 overflow-y-auto space-y-1 rounded-md border p-1">
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : available.length === 0 ? (
          <p className="py-8 text-center text-sm text-muted-foreground">
            {search ? 'No contacts match your search.' : 'No contacts available to link.'}
          </p>
        ) : (
          available.map((contact) => (
            <button
              key={contact.id}
              type="button"
              onClick={() => setSelectedId(contact.id === selectedId ? null : contact.id)}
              className={`w-full rounded-md px-3 py-2 text-left transition-colors hover:bg-accent ${
                selectedId === contact.id ? 'bg-accent ring-2 ring-ring' : ''
              }`}
            >
              <p className="text-sm font-medium">{contact.name}</p>
              <div className="flex items-center gap-2">
                {contact.title && (
                  <p className="text-xs text-muted-foreground">{contact.title}</p>
                )}
                {contact.application && (
                  <p className="text-xs text-muted-foreground">
                    · linked to {contact.application.company}
                  </p>
                )}
              </div>
            </button>
          ))
        )}
      </div>

      <DialogFooter>
        <Button onClick={handleLink} disabled={!selectedId || update.isPending}>
          {update.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Link className="mr-2 h-4 w-4" />
          )}
          Link contact
        </Button>
      </DialogFooter>
    </div>
  );
}
