'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Sparkles } from 'lucide-react';

export default function LogoutPage() {
  const router = useRouter();

  useEffect(() => {
    async function performLogout() {
      try {
        if (typeof document !== 'undefined') {
          document.cookie = 'wastesense_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
        }
        if (typeof window !== 'undefined') {
          localStorage.removeItem('wastesense_user_role');
          localStorage.removeItem('wastesense_auth_session');
          // Clear any supabase storage keys
          for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('sb-') || key.includes('supabase'))) {
              localStorage.removeItem(key);
            }
          }
        }
        await supabase.auth.signOut();
      } catch (err) {
        console.warn('Sign out cleanup note:', err);
      } finally {
        // Redirect cleanly to login
        router.replace('/login');
      }
    }

    performLogout();
  }, [router]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-slate-50 dark:bg-[#020617] text-slate-900 dark:text-white p-6 space-y-4">
      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-emerald-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-emerald-500/20 animate-pulse">
        <Sparkles className="w-6 h-6 text-white" />
      </div>
      <div className="flex items-center gap-3">
        <div className="w-4 h-4 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold tracking-wide">
          Signing you out of WasteSense...
        </span>
      </div>
      <p className="text-xs text-muted-foreground">
        Clearing session tokens and resetting authentication state.
      </p>
    </div>
  );
}
