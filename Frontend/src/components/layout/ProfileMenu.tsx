'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Settings, ShieldCheck, Users, LogOut, LogIn, User as UserIcon } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/providers/AuthProvider';
import { toast } from 'sonner';

export function ProfileMenu() {
  const router = useRouter();
  const { user, profile, role, isAdmin, isAuthenticated, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      router.push('/login');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold transition-colors"
      >
        <LogIn className="size-3.5" />
        <span>Sign In</span>
      </Link>
    );
  }

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'User';
  const email = profile?.email || user?.email || '';
  const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture || '';
  const initials = displayName.substring(0, 2).toUpperCase();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        className="flex items-center gap-2 rounded-xl px-2 py-1.5 hover:bg-muted/60 transition-colors cursor-pointer outline-none"
        aria-label="User account menu"
      >
        <Avatar className="size-8 border border-border/60 shadow-2xs">
          {avatarUrl ? <AvatarImage src={avatarUrl} alt={displayName} /> : null}
          <AvatarFallback className="bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-xs font-bold">
            {initials}
          </AvatarFallback>
        </Avatar>

        <div className="hidden lg:flex flex-col items-start min-w-0 max-w-[120px]">
          <span className="text-xs font-semibold text-foreground truncate w-full text-left">
            {displayName}
          </span>
          <span className="text-[10px] text-muted-foreground flex items-center gap-1">
            {isAdmin ? (
              <span className="text-emerald-600 dark:text-emerald-400 font-medium">Admin</span>
            ) : (
              <span>Citizen</span>
            )}
          </span>
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-64 p-2" sideOffset={8}>
        {/* User Identity Header */}
        <div className="p-2 space-y-1">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-bold text-foreground truncate">{displayName}</span>
            {isAdmin ? (
              <Badge variant="outline" className="text-[10px] bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30 font-semibold px-1.5 py-0">
                <ShieldCheck className="size-3 mr-1" />
                Admin
              </Badge>
            ) : (
              <Badge variant="outline" className="text-[10px] bg-slate-500/10 text-slate-600 dark:text-slate-400 border-slate-500/30 font-medium px-1.5 py-0">
                <UserIcon className="size-3 mr-1" />
                Citizen
              </Badge>
            )}
          </div>
          <p className="text-[11px] text-muted-foreground truncate">{email}</p>
        </div>

        <DropdownMenuSeparator />

        {/* Navigation Items */}
        <Link href="/settings">
          <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs py-2 rounded-lg">
            <Settings className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>System Status</span>
          </DropdownMenuItem>
        </Link>

        {isAdmin && (
          <Link href="/users">
            <DropdownMenuItem className="flex items-center gap-2 cursor-pointer text-xs py-2 rounded-lg">
              <Users className="size-4 text-emerald-500" aria-hidden="true" />
              <span>User & Role Management</span>
            </DropdownMenuItem>
          </Link>
        )}

        <DropdownMenuSeparator />

        {/* Sign Out Button */}
        <DropdownMenuItem
          onClick={handleSignOut}
          className="flex items-center gap-2 cursor-pointer text-xs py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-500/10 focus:bg-red-500/10"
        >
          <LogOut className="size-4" aria-hidden="true" />
          <span>Sign Out</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
