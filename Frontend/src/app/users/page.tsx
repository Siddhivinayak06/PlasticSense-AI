'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Users, ShieldCheck, User as UserIcon, RefreshCw, AlertCircle, ShieldAlert } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { api, apiErrorMessage } from '@/lib/api';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

interface UserProfileData {
  id: string;
  email: string;
  full_name: string | null;
  avatar_url: string | null;
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export default function UsersPage() {
  const { user: currentUser, isAdmin, isLoading: authLoading } = useAuth();
  const queryClient = useQueryClient();
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  // Fetch all registered users (Admin only)
  const {
    data: users = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery<UserProfileData[]>({
    queryKey: ['users'],
    queryFn: async () => {
      const res = await api.get('/auth/users');
      return res.data;
    },
    enabled: isAdmin,
  });

  // Mutation to update user role
  const roleMutation = useMutation({
    mutationFn: async ({ userId, newRole }: { userId: string; newRole: 'user' | 'admin' }) => {
      setUpdatingId(userId);
      const res = await api.patch(`/auth/users/${userId}/role`, { role: newRole });
      return res.data;
    },
    onSuccess: (updatedUser) => {
      queryClient.setQueryData<UserProfileData[]>(['users'], (old) =>
        old ? old.map((u) => (u.id === updatedUser.id ? updatedUser : u)) : []
      );
      toast.success(`Role updated to ${updatedUser.role} for ${updatedUser.email}`);
      setUpdatingId(null);
    },
    onError: (err) => {
      toast.error(apiErrorMessage(err, 'Failed to update user role'));
      setUpdatingId(null);
    },
  });

  if (authLoading) {
    return (
      <div className="py-12 flex justify-center">
        <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="max-w-xl mx-auto pt-10">
        <div className="glass rounded-3xl p-8 text-center space-y-4 border border-red-500/20 bg-red-500/5">
          <ShieldAlert className="size-10 text-red-500 mx-auto" aria-hidden="true" />
          <h1 className="text-2xl font-bold">Access Restricted</h1>
          <p className="text-muted-foreground text-sm">
            User and role administration is restricted to Municipal Administrators.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight flex items-center gap-2.5">
            <Users className="size-7 text-emerald-500" />
            <span>User & Access Management</span>
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Registered Google OAuth users, role assignments, and municipal authority permissions.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => refetch()}
          disabled={isLoading}
          className="rounded-xl flex items-center gap-2"
        >
          <RefreshCw className={`size-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </Button>
      </div>

      {/* Role explanation cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 shrink-0">
            <UserIcon className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Citizen / Viewer Role</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Standard permission granted on first Google login. Can submit waste detections, track hotspot locations, and inspect pollution analytics. Cannot dispatch cleanups or manage NGOs.
            </p>
          </div>
        </div>

        <div className="p-4 rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl flex items-start gap-3">
          <div className="p-2 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 shrink-0">
            <ShieldCheck className="size-5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-foreground">Municipal Administrator Role</h2>
            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
              Elevated municipal authority. Can create and schedule cleanup assignments, onboard NGO response teams, verify post-cleanup AI results, and manage user roles.
            </p>
          </div>
        </div>
      </div>

      {/* Users Table */}
      <div className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur-xl overflow-hidden shadow-2xs">
        {isLoading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-3">
            <div className="w-8 h-8 border-3 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-xs text-muted-foreground">Loading registered users...</span>
          </div>
        ) : isError ? (
          <div className="py-12 px-6 text-center text-red-500 space-y-2">
            <AlertCircle className="size-8 mx-auto opacity-80" />
            <p className="text-sm font-medium">Failed to load user directory.</p>
            <p className="text-xs text-muted-foreground">{apiErrorMessage(error)}</p>
          </div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-muted-foreground space-y-2">
            <Users className="size-10 mx-auto opacity-30" />
            <p className="text-sm font-medium">No registered users found.</p>
            <p className="text-xs">Users will appear here automatically on their first Google sign-in.</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead className="w-[300px]">User</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Current Role</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map((u) => {
                const isSelf = u.id === currentUser?.id;
                const isItemAdmin = u.role === 'admin';
                const isRowUpdating = updatingId === u.id;

                return (
                  <TableRow key={u.id} className="hover:bg-muted/40 transition-colors">
                    <TableCell className="font-medium">
                      <div className="flex items-center gap-3">
                        <Avatar className="size-9 border border-border/60">
                          {u.avatar_url ? <AvatarImage src={u.avatar_url} alt={u.full_name || u.email} /> : null}
                          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
                            {(u.full_name || u.email).substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-semibold text-xs text-foreground flex items-center gap-1.5">
                            <span>{u.full_name || 'Anonymous User'}</span>
                            {isSelf && (
                              <span className="text-[10px] px-1.5 py-0.2 rounded-md bg-muted text-muted-foreground font-normal">
                                You
                              </span>
                            )}
                          </div>
                          <span className="text-[10px] text-muted-foreground font-mono truncate max-w-[150px] block">
                            {u.id.substring(0, 8)}...
                          </span>
                        </div>
                      </div>
                    </TableCell>

                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {u.email}
                    </TableCell>

                    <TableCell>
                      {isItemAdmin ? (
                        <Badge variant="outline" className="text-xs bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold px-2 py-0.5">
                          <ShieldCheck className="size-3.5 mr-1" />
                          Municipal Admin
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-xs bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-medium px-2 py-0.5">
                          <UserIcon className="size-3.5 mr-1" />
                          Citizen / Viewer
                        </Badge>
                      )}
                    </TableCell>

                    <TableCell className="text-xs text-muted-foreground">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                    </TableCell>

                    <TableCell className="text-right">
                      {isSelf ? (
                        <span className="text-xs text-muted-foreground italic">Current session</span>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isRowUpdating}
                          onClick={() =>
                            roleMutation.mutate({
                              userId: u.id,
                              newRole: isItemAdmin ? 'user' : 'admin',
                            })
                          }
                          className="rounded-xl text-xs h-8 px-3"
                        >
                          {isRowUpdating ? (
                            <div className="w-3.5 h-3.5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                          ) : isItemAdmin ? (
                            'Demote to Citizen'
                          ) : (
                            'Promote to Admin'
                          )}
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
