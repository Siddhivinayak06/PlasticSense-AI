'use client';

import { Suspense, useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { api } from '@/lib/api';
import { Sparkles } from 'lucide-react';

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo') || '/dashboard';
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    let timeoutId: NodeJS.Timeout;

    async function handleAuth() {
      try {
        // 1. Check if Supabase returned an error in the query parameters
        const error = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (error || errorCode || errorDescription) {
          const formattedMsg =
            errorDescription?.replace(/\+/g, ' ') ||
            errorCode ||
            error ||
            'OAuth sign-in was rejected by authentication provider.';
          throw new Error(formattedMsg);
        }

        // 2. Also check URL hash for error fragments (e.g., #error=...)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const hashError = hashParams.get('error');
          const hashErrorDesc = hashParams.get('error_description');
          if (hashError || hashErrorDesc) {
            throw new Error(
              hashErrorDesc?.replace(/\+/g, ' ') || hashError || 'Authentication failed'
            );
          }
        }

        // 3. Check for PKCE exchange code
        const code = searchParams.get('code');
        let session = null;

        if (code) {
          const { data, error: exchangeErr } = await supabase.auth.exchangeCodeForSession(code);
          if (exchangeErr) {
            console.error('Code exchange error:', exchangeErr);
            throw exchangeErr;
          }
          session = data?.session;
        }

        // 4. If no code or already exchanged, retrieve current session
        if (!session) {
          const { data, error: sessionErr } = await supabase.auth.getSession();
          if (sessionErr) throw sessionErr;
          session = data?.session;
        }

        // 5. If session is ready, establish cookies and sync profile
        if (session?.user && isMounted) {
          if (typeof document !== 'undefined' && session.access_token) {
            document.cookie = `wastesense_auth_session=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          }

          try {
            const meta = session.user.user_metadata || {};
            await api.post('/auth/sync', {
              user_id: session.user.id,
              email: session.user.email || '',
              full_name: meta.full_name || meta.name || session.user.email?.split('@')[0],
              avatar_url: meta.avatar_url || meta.picture || null,
            });
          } catch (syncErr) {
            console.warn('Backend profile sync note:', syncErr);
          }

          router.replace(returnTo);
          return;
        }

        // 6. Listen for auth state change if session is still settling
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, newSession) => {
            if (newSession?.user && isMounted) {
              if (typeof document !== 'undefined' && newSession.access_token) {
                document.cookie = `wastesense_auth_session=${newSession.access_token}; path=/; max-age=604800; SameSite=Lax`;
              }
              try {
                const meta = newSession.user.user_metadata || {};
                await api.post('/auth/sync', {
                  user_id: newSession.user.id,
                  email: newSession.user.email || '',
                  full_name: meta.full_name || meta.name || newSession.user.email?.split('@')[0],
                  avatar_url: meta.avatar_url || meta.picture || null,
                });
              } catch (syncErr) {
                console.warn('Backend profile sync note:', syncErr);
              }
              authListener.subscription.unsubscribe();
              router.replace(returnTo);
            }
          }
        );

        // 7. Safety timeout: if after 6 seconds no session resolved, notify user
        timeoutId = setTimeout(() => {
          if (isMounted) {
            setErrorMsg(
              'Authentication timed out. Your session could not be established. Please try signing in again.'
            );
          }
        }, 6000);
      } catch (err: unknown) {
        console.error('OAuth callback error:', err);
        if (isMounted) {
          setErrorMsg(err instanceof Error ? err.message : 'Authentication handshake failed');
        }
      }
    }

    handleAuth();

    return () => {
      isMounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [returnTo, router, searchParams]);

  if (errorMsg) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6 text-center">
        <div className="max-w-md p-8 rounded-3xl border border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 space-y-4">
          <h2 className="text-xl font-bold">Authentication Failed</h2>
          <p className="text-sm">{errorMsg}</p>
          <button
            onClick={() => router.replace('/login')}
            className="px-6 py-2.5 rounded-xl bg-emerald-500 text-white font-semibold text-sm hover:bg-emerald-600 transition-colors"
          >
            Return to Sign-In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wide">
          Verifying Google authentication with Supabase...
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Securing session and loading your WasteSense profile.
      </p>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-8 h-8 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <AuthCallbackContent />
    </Suspense>
  );
}
