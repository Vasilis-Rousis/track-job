import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, Check, X, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { adminApi } from '@/api/admin.api';
import { toast } from '@/hooks/use-toast';
import { getAxiosErrorMessage } from '@/utils/helpers';
import type { User } from '@/types';

function statusBadge(status?: string) {
  switch (status) {
    case 'PENDING':
      return <Badge variant="outline" className="border-yellow-500 text-yellow-600 dark:text-yellow-400">Pending</Badge>;
    case 'APPROVED':
      return <Badge className="bg-green-600 hover:bg-green-600">Approved</Badge>;
    case 'REJECTED':
      return <Badge variant="destructive">Rejected</Badge>;
    default:
      return <Badge variant="secondary">{status}</Badge>;
  }
}

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

export function AdminPage() {
  const [tab, setTab] = useState('PENDING');
  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['admin-users', tab],
    queryFn: () => adminApi.getUsers(tab === 'ALL' ? undefined : tab),
  });

  const approveMutation = useMutation({
    mutationFn: adminApi.approveUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User approved' });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Failed to approve', description: getAxiosErrorMessage(err) });
    },
  });

  const rejectMutation = useMutation({
    mutationFn: adminApi.rejectUser,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      toast({ title: 'User rejected' });
    },
    onError: (err) => {
      toast({ variant: 'destructive', title: 'Failed to reject', description: getAxiosErrorMessage(err) });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Manage user registrations</p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="PENDING">Pending</TabsTrigger>
          <TabsTrigger value="APPROVED">Approved</TabsTrigger>
          <TabsTrigger value="REJECTED">Rejected</TabsTrigger>
          <TabsTrigger value="ALL">All</TabsTrigger>
        </TabsList>

        <TabsContent value={tab}>
          {isLoading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-20 w-full" />
              ))}
            </div>
          ) : !users?.length ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <Shield className="mb-3 h-10 w-10 text-muted-foreground/50" />
                <p className="text-muted-foreground">No {tab.toLowerCase()} users</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {users.map((user: User) => (
                <Card key={user.id}>
                  <CardContent className="flex items-center justify-between py-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="font-medium">{user.name}</p>
                        {statusBadge(user.status)}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Registered {formatDate(user.createdAt)}
                      </p>
                    </div>
                    {user.status === 'PENDING' && (
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={() => approveMutation.mutate(user.id)}
                          disabled={approveMutation.isPending}
                        >
                          {approveMutation.isPending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <Check className="mr-1 h-3 w-3" />
                          )}
                          Approve
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => rejectMutation.mutate(user.id)}
                          disabled={rejectMutation.isPending}
                        >
                          {rejectMutation.isPending ? (
                            <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                          ) : (
                            <X className="mr-1 h-3 w-3" />
                          )}
                          Reject
                        </Button>
                      </div>
                    )}
                    {user.status === 'REJECTED' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => approveMutation.mutate(user.id)}
                        disabled={approveMutation.isPending}
                      >
                        {approveMutation.isPending ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : (
                          <Check className="mr-1 h-3 w-3" />
                        )}
                        Approve
                      </Button>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
