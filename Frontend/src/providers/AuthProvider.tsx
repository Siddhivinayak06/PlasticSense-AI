'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import type { User, Session } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured, signInWithGoogle as doGoogleSignIn, signOut as doSignOut } from '@/lib/supabase';
import { api } from '@/lib/api';

export interface UserProfile {
  id: string;
  email: string;
  full_name?: string | null;
  avatar_url?: string | null;
  role: 'user' | 'admin';
  created_at?: string;
  updated_at?: string;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  role: 'user' | 'admin' | null;
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

  const fetchProfile = useCallback(async (sessionUser?: User | null) => {
    const targetUser = sessionUser || user;
    if (!targetUser) {
      setProfile(null);
      return;
    }

    try {
      // 1. Try to fetch existing profile from backend
      const res = await api.get('/auth/me');
      if (res.data) {
        setProfile(res.data);
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
          if (typeof window !== 'undefined') {
            localStorage.setItem('wastesense_user_role', syncRes.data.role);
          }
        }
      } catch (err) {
        console.warn('Profile sync fallback error:', err);
      }
    }
  }, [user]);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      return;
    }

    // Check initial active session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(session.user);
        fetchProfile(session.user).finally(() => setIsLoading(false));
      } else {
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
          setUser(session.user);
          await fetchProfile(session.user);
        } else {
          setUser(null);
          setProfile(null);
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
