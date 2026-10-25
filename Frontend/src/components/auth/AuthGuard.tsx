'use client';

import React, { useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import { useAuth } from '@/providers/AuthProvider';
import { ShieldAlert, ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

interface AuthGuardProps {
  children: React.ReactNode;
  adminOnly?: boolean;
}

export function AuthGuard({ children, adminOnly = false }: AuthGuardProps) {
  const { isAuthenticated, isLoading, isAdmin, isConfigured } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // If Supabase is configured and initial session resolution has finished
    if (!isLoading && !isAuthenticated && isConfigured) {
      router.replace(`/login?returnTo=${encodeURIComponent(pathname)}`);
    }
  }, [isAuthenticated, isLoading, isConfigured, pathname, router]);

  // While checking session state
  if (isLoading && isConfigured) {
    return (
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-xs font-medium text-muted-foreground animate-pulse">
          Verifying authorization...
        </p>
      </div>
    );
  }

  // Not authenticated
  if (!isAuthenticated && isConfigured) {
    return (
      <div className="h-full min-h-[60vh] flex flex-col items-center justify-center p-8 space-y-4">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-sm font-medium text-muted-foreground">
          Redirecting to Google Sign-In...
        </p>
        <Link href={`/login?returnTo=${encodeURIComponent(pathname)}`}>
          <Button variant="outline" size="sm" className="rounded-xl text-xs">
            Click here if not redirected
          </Button>
        </Link>
      </div>
    );
  }

  // If page requires Admin privileges and current user is not admin
  if (adminOnly && !isAdmin && isConfigured) {
    return (
      <div className="max-w-xl mx-auto py-16 px-4">
        <div className="rounded-3xl border border-red-500/20 bg-red-500/5 dark:bg-red-950/20 p-8 text-center space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-red-500/10 text-red-600 dark:text-red-400 flex items-center justify-center mx-auto">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">
            Municipal Administrator Access Required
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Your current account has standard citizen/viewer permissions. Access to municipal cleanup dispatch, NGO management, and policy verification requires an authorized municipal administrator role.
          </p>
          <div className="pt-2 flex justify-center gap-3">
            <Link href="/dashboard">
              <Button variant="outline" className="rounded-xl flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Return to Dashboard
              </Button>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
