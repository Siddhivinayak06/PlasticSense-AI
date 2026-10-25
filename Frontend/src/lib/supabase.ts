import { createClient, SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mepiirlnaiacikuyofmy.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isSupabaseConfigured = Boolean(
  supabaseAnonKey &&
  supabaseAnonKey !== 'your-supabase-anon-key-here' &&
  supabaseUrl
);

// Fallback dummy key to prevent createClient throwing during build or placeholder config
const safeKey = isSupabaseConfigured
  ? supabaseAnonKey
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.e30.dummy-token-for-initialization';

export const supabase: SupabaseClient = createClient(supabaseUrl, safeKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
    storageKey: 'wastesense_auth_session',
  },
});

/**
 * Initiates the Supabase Google OAuth flow.
 * Redirects user to Google sign-in and returns to /auth/callback with target destination.
 */
export async function signInWithGoogle(returnTo: string = '/dashboard') {
  if (!isSupabaseConfigured) {
    throw new Error(
      'Supabase Auth is not fully configured. Please add your NEXT_PUBLIC_SUPABASE_ANON_KEY to Frontend/.env.local'
    );
  }

  const origin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
  const callbackUrl = `${origin}/auth/callback?returnTo=${encodeURIComponent(returnTo)}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: callbackUrl,
      queryParams: {
        access_type: 'offline',
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Sign out the current user and remove local session state.
 */
export async function signOut() {
  if (!isSupabaseConfigured) return;
  await supabase.auth.signOut();
  if (typeof window !== 'undefined') {
    localStorage.removeItem('wastesense_user_role');
  }
}

/**
 * Retrieve the current access token if a session exists.
 */
export async function getAccessToken(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token || null;
}
