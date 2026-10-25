'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  Leaf,
  ShieldCheck,
  Users,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Sparkles,
  Lock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/providers/AuthProvider';
import { ThemeToggle } from '@/components/layout/ThemeToggle';
import { toast } from 'sonner';

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';

  const { user, isAuthenticated, isLoading, isConfigured, signInWithGoogle, signOut } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleGoogleLogin = async () => {
    if (!isConfigured) {
      toast.error(
        'Supabase configuration pending. Please add NEXT_PUBLIC_SUPABASE_ANON_KEY to Frontend/.env'
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithGoogle(returnTo);
    } catch (err: unknown) {
      setIsSubmitting(false);
      const msg = err instanceof Error ? err.message : 'Google sign-in could not be initiated';
      toast.error(msg);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out. You can now sign in with another account.');
    } catch {
      toast.error('Failed to sign out');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-slate-100 to-emerald-50/30 dark:from-[#020617] dark:via-[#090d16] dark:to-[#041a14] flex flex-col justify-between p-4 sm:p-6 lg:p-8 selection:bg-emerald-500/30">
      {/* Header Bar */}
      <header className="max-w-7xl mx-auto w-full flex items-center justify-between py-2">
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300">
            <Leaf className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">
            Plastic<span className="text-emerald-600 dark:text-emerald-400">Sense</span> AI
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="text-xs sm:text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </header>

      {/* Main Login Card */}
      <main className="max-w-md w-full mx-auto my-auto py-8">
        <div
          className="rounded-3xl border border-slate-200/80 dark:border-slate-800/80 bg-white/90 dark:bg-slate-950/90 backdrop-blur-2xl p-6 sm:p-8 shadow-2xl shadow-emerald-500/5 dark:shadow-black/60 relative overflow-hidden"
        >
          {/* Subtle top decorative bar */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-emerald-500 via-teal-500 to-cyan-500" />

          {/* Heading */}
          <div className="text-center space-y-2 mb-8">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Production Supabase Auth</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 dark:text-white">
              {isAuthenticated ? 'Active Session' : 'Welcome to WasteSense'}
            </h1>
            <p className="text-sm text-slate-600 dark:text-slate-400">
              {isAuthenticated
                ? 'You are currently authenticated. Continue to the monitoring dashboard or switch accounts.'
                : 'Sign in with your Google account to access waste detection, real-time hotspot tracking, and cleanup intelligence.'}
            </p>
          </div>

          {!isConfigured && (
            <div className="mb-6 p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 text-xs flex gap-2.5 items-start">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5 text-amber-500" />
              <div>
                <strong className="font-semibold block mb-0.5">Configuration Step Required</strong>
                Add your Supabase project keys in <code className="bg-amber-500/20 px-1 py-0.5 rounded font-mono">Frontend/.env</code> to activate Google OAuth.
              </div>
            </div>
          )}

          {/* If already authenticated, show session status & switch account buttons */}
          {isAuthenticated ? (
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-center space-y-1">
                <span className="text-xs text-muted-foreground block">Signed in as</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white block truncate">
                  {user?.email}
                </span>
              </div>

              <div className="space-y-2.5">
                <Button
                  type="button"
                  onClick={() => router.replace(returnTo)}
                  className="w-full h-12 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-semibold flex items-center justify-center gap-2"
                >
                  <span>Continue to Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSignOut}
                  className="w-full h-12 rounded-2xl border-slate-300 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:text-red-600 dark:hover:text-red-400 font-semibold"
                >
                  Sign Out & Switch Account
                </Button>
              </div>
            </div>
          ) : (
            /* Google Sign-In Action */
            <div className="space-y-4">
              <Button
                type="button"
                onClick={handleGoogleLogin}
                disabled={isSubmitting || isLoading}
                className="w-full h-12 rounded-2xl bg-white hover:bg-slate-50 dark:bg-slate-900 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-100 border border-slate-300 dark:border-slate-700 shadow-sm hover:shadow-md transition-all font-semibold flex items-center justify-center gap-3 active:scale-[0.99]"
              >
                {isSubmitting ? (
                  <div className="w-5 h-5 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24" aria-hidden="true">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                )}
                <span>Continue with Google</span>
              </Button>

              <div className="text-center text-xs text-muted-foreground flex items-center justify-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                <span>Instant auto-registration — no manual sign-up form needed</span>
              </div>
            </div>
          )}

          {/* Role Separation Details */}
          <div className="mt-8 pt-6 border-t border-slate-200/60 dark:border-slate-800/60 space-y-3.5 text-xs">
            <span className="font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
              <Lock className="w-3.5 h-3.5 text-emerald-500" />
              Access Permissions & Roles:
            </span>

            <div className="grid grid-cols-1 gap-2.5">
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                <Users className="w-4 h-4 text-cyan-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">Citizen / User Access</span>
                  <span className="text-muted-foreground leading-relaxed">
                    Submit dumpsite images, run AI detection, inspect pollution maps, view environmental analytics.
                  </span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/60 dark:border-slate-800/60 flex items-start gap-2.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
                <div>
                  <span className="font-semibold text-slate-900 dark:text-slate-100 block">Municipal Administrator</span>
                  <span className="text-muted-foreground leading-relaxed">
                    Authorize cleanup assignments, dispatch NGO crews, verify post-cleanup outcomes, and manage policy.
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl mx-auto w-full text-center text-xs text-slate-400 dark:text-slate-500 py-4">
        WasteSense AI &copy; 2026. Protected by Supabase Auth with Row Level Security.
      </footer>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
