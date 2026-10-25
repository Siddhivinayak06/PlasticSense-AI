'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, signInWithGoogle as doGoogleSignIn, signOut as doSignOut } from '@/lib/supabase';
import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'citizen' | 'admin';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: 'user' | 'citizen' | 'admin' | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isConfigured: boolean;
  signInWithGoogle: (returnTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  role: null,
  isLoading: true,
  isAuthenticated: false,
  isAdmin: false,
  isConfigured: false,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  refreshProfile: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(isSupabaseConfigured);

  const lastSyncedUserIdRef = useRef<string | null>(null);
  const isFetchingRef = useRef<boolean>(false);

  const fetchProfile = useCallback(async (targetUser: User | null) => {
    if (!targetUser) {
      setProfile(null);
      lastSyncedUserIdRef.current = null;
      return;
    }

    if (isFetchingRef.current) return;
    isFetchingRef.current = true;

    try {
      // 1. Try to fetch existing profile from backend
      const res = await api.get('/auth/me');
      if (res.data) {
        setProfile(res.data);
        lastSyncedUserIdRef.current = targetUser.id;
        if (typeof window !== 'undefined') {
          localStorage.setItem('wastesense_user_role', res.data.role);
        }
        return;
      }
    } catch {
      // 2. If not found in DB or first-time Google login, auto-register via sync endpoint
      try {
        const meta = targetUser.user_metadata || {};
        const syncRes = await api.post('/auth/sync', {
          user_id: targetUser.id,
          email: targetUser.email || '',
          full_name: meta.full_name || meta.name || targetUser.email?.split('@')[0],
          avatar_url: meta.avatar_url || meta.picture || null,
        });
        if (syncRes.data) {
          setProfile(syncRes.data);
          lastSyncedUserIdRef.current = targetUser.id;
          if (typeof window !== 'undefined') {
            localStorage.setItem('wastesense_user_role', syncRes.data.role);
          }
        }
      } catch (err) {
        console.warn('Profile sync fallback note:', err);
        // Fallback to Google session data so the UI is NEVER stuck
        const meta = targetUser.user_metadata || {};
        const cachedRole = (typeof window !== 'undefined' ? localStorage.getItem('wastesense_user_role') : null) as 'admin' | 'user' | null;
        const assignedRole: 'admin' | 'user' =
          cachedRole || (targetUser.email?.toLowerCase() === 'siddhivinayaksawant04@gmail.com' ? 'admin' : 'user');
        
        setProfile({
          id: targetUser.id,
          email: targetUser.email || '',
          full_name: meta.full_name || meta.name || targetUser.email?.split('@')[0] || 'User',
          avatar_url: meta.avatar_url || meta.picture || null,
          role: assignedRole,
        });
      }
    } finally {
      isFetchingRef.current = false;
    }
  }, []);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        if (typeof document !== 'undefined' && session.access_token) {
          document.cookie = `wastesense_auth_session=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
        }
        setUser(session.user);
        fetchProfile(session.user).finally(() => setIsLoading(false));
      } else {
        if (typeof document !== 'undefined') {
          document.cookie = `wastesense_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
        }
        setUser(null);
        setProfile(null);
        setIsLoading(false);
      }
    }).catch(() => {
      setIsLoading(false);
    });

    // Subscribe to auth state transitions
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session: Session | null) => {
        if (session?.user) {
          if (typeof document !== 'undefined' && session.access_token) {
            document.cookie = `wastesense_auth_session=${session.access_token}; path=/; max-age=604800; SameSite=Lax`;
          }
          setUser(session.user);
          if (session.user.id !== lastSyncedUserIdRef.current) {
            await fetchProfile(session.user);
          }
        } else {
          if (typeof document !== 'undefined') {
            document.cookie = `wastesense_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
          }
          setUser(null);
          setProfile(null);
          lastSyncedUserIdRef.current = null;
          if (typeof window !== 'undefined') {
            localStorage.removeItem('wastesense_user_role');
          }
        }
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [fetchProfile]);

  const signInWithGoogle = async (returnTo?: string) => {
    await doGoogleSignIn(returnTo);
  };

  const signOut = async () => {
    if (typeof document !== 'undefined') {
      document.cookie = `wastesense_auth_session=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax`;
    }
    await doSignOut();
    setUser(null);
    setProfile(null);
  };

  const role = profile?.role || (user ? 'user' : null);
  const isAuthenticated = Boolean(user);
  const isAdmin = role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        role,
        isLoading,
        isAuthenticated,
        isAdmin,
        isConfigured: isSupabaseConfigured,
        signInWithGoogle,
        signOut,
        refreshProfile: () => fetchProfile(user),
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
