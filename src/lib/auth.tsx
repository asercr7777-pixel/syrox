import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import { supabase, isSupabaseConfigured } from './supabase';

interface AuthContextValue {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: string | null }>;
  signUp: (email: string, password: string, username: string) => Promise<{ error: string | null; needsEmailConfirmation?: boolean }>;
  signInWithGoogle: () => Promise<{ error: string | null }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

function authErrorMessage(message: string, mode: 'login' | 'signup'): string {
  const value = message.toLowerCase();
  if (value.includes('invalid login credentials') || value.includes('invalid credentials')) return 'Incorrect email or password.';
  if (value.includes('user already registered') || value.includes('already registered')) return 'An account with this email already exists. Sign in instead.';
  if (value.includes('email not confirmed')) return 'Your email has not been confirmed yet. Check your inbox.';
  if (value.includes('password')) return mode === 'signup' ? 'This password cannot be used. Try a stronger password.' : 'Incorrect password.';
  if (value.includes('email')) return 'Please check your email address and try again.';
  return message;
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let authEventSeen = false;

    if (!isSupabaseConfigured()) {
      try {
        const saved = localStorage.getItem('stryven-offline-user');
        if (saved) {
          const parsed = JSON.parse(saved);
          const offlineUser = {
            id: parsed.id || 'offline-hunter',
            app_metadata: {},
            user_metadata: { username: parsed.username || 'Hunter' },
            aud: 'authenticated',
            created_at: new Date().toISOString(),
            email: parsed.email || 'hunter@system.com',
            role: 'authenticated',
          } as unknown as User;
          setSession({
            access_token: 'offline-token',
            token_type: 'bearer',
            expires_in: 3600,
            refresh_token: 'offline-refresh',
            user: offlineUser,
          } as Session);
        }
      } catch {
        setSession(null);
      }
      setLoading(false);
      return;
    }

    const { data: sub } = supabase.auth.onAuthStateChange((_event, sess) => {
      authEventSeen = true;
      if (!mounted) return;
      setSession(sess);
      setLoading(false);
    });

    void supabase.auth.getSession()
      .then(({ data, error }) => {
        if (error) throw error;
        if (mounted && !authEventSeen) setSession(data.session);
      })
      .catch((error: unknown) => {
        console.error('[auth] initial session lookup failed:', error);
        if (mounted && !authEventSeen) setSession(null);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    if (!isSupabaseConfigured()) {
      const username = email.split('@')[0] || 'Hunter';
      const offlineUser = {
        id: 'offline-hunter',
        app_metadata: {},
        user_metadata: { username },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
        role: 'authenticated',
      } as unknown as User;
      localStorage.setItem('stryven-offline-user', JSON.stringify({ id: offlineUser.id, email, username }));
      setSession({
        access_token: 'offline-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'offline-refresh',
        user: offlineUser,
      } as Session);
      return { error: null };
    }
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return { error: error ? authErrorMessage(error.message, 'login') : null };
  };

  const signUp = async (email: string, password: string, username: string) => {
    if (!isSupabaseConfigured()) {
      const resolvedName = username || email.split('@')[0] || 'Hunter';
      const offlineUser = {
        id: 'offline-hunter',
        app_metadata: {},
        user_metadata: { username: resolvedName },
        aud: 'authenticated',
        created_at: new Date().toISOString(),
        email,
        role: 'authenticated',
      } as unknown as User;
      localStorage.setItem('stryven-offline-user', JSON.stringify({ id: offlineUser.id, email, username: resolvedName }));
      setSession({
        access_token: 'offline-token',
        token_type: 'bearer',
        expires_in: 3600,
        refresh_token: 'offline-refresh',
        user: offlineUser,
      } as Session);
      return { error: null, needsEmailConfirmation: false };
    }
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: { username } },
    });
    if (error) return { error: authErrorMessage(error.message, 'signup') };

    // Supabase can intentionally return a user with no identities for an
    // already-registered email when email enumeration protection is enabled.
    if (data.user && Array.isArray(data.user.identities) && data.user.identities.length === 0) {
      return { error: 'An account with this email already exists. Sign in instead.' };
    }

    if (data.user && data.session) {
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ username })
        .eq('id', data.user.id);
      if (profileError) {
        console.error('[auth] profile username sync failed:', profileError);
        return { error: 'Account was created, but the username could not be saved. Please try again.' };
      }
    }
    return { error: null, needsEmailConfirmation: Boolean(data.user && !data.session) };
  };

  const signInWithGoogle = async () => {
    if (!isSupabaseConfigured()) {
      return signIn('hunter@system.com', 'offline');
    }
    const origin = window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: origin,
        queryParams: { access_type: 'offline', prompt: 'consent' },
      },
    });
    return { error: error ? authErrorMessage(error.message, 'login') : null };
  };

  const signOut = async () => {
    localStorage.removeItem('stryven-offline-user');
    if (isSupabaseConfigured()) {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } else {
      setSession(null);
    }
  };

  return (
    <AuthContext.Provider value={{ user: session?.user ?? null, session, loading, signIn, signUp, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}