import React, { createContext, useContext, useEffect, useState, useMemo, ReactNode } from 'react';
import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { signInWithGoogle as authSignInWithGoogle, signOut as authSignOut, getCurrentSession, subscribeToAuthChanges } from './auth';
import { isSupabaseConfigured } from './client';

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  error: string | null;
  isConfigured: boolean;
  signInWithGoogle: (redirectTo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const isConfigured = isSupabaseConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    let isMounted = true;

    // 1. Initialize session on startup
    getCurrentSession()
      .then((initialSession) => {
        if (!isMounted) return;
        setSession(initialSession);
        setUser(initialSession?.user ?? null);
        setIsLoading(false);
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Could not restore Supabase session:', err);
        setIsLoading(false);
      });

    // 2. Subscribe to auth events strictly non-recursively (no nested auth calls inside callback)
    const { unsubscribe } = subscribeToAuthChanges((_event: AuthChangeEvent, newSession: Session | null) => {
      if (!isMounted) return;
      setSession(newSession);
      setUser(newSession?.user ?? null);
      setIsLoading(false);
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, [isConfigured]);

  const signInWithGoogle = async (redirectTo?: string) => {
    setError(null);
    const result = await authSignInWithGoogle(redirectTo);
    if (result.error) {
      setError(result.error.message);
      throw result.error;
    }
  };

  const signOut = async () => {
    setError(null);
    const result = await authSignOut();
    if (result.error) {
      setError(result.error.message);
      throw result.error;
    }
    setUser(null);
    setSession(null);
  };

  const clearError = () => setError(null);

  const contextValue = useMemo<AuthContextType>(
    () => ({
      user,
      session,
      isLoading,
      error,
      isConfigured,
      signInWithGoogle,
      signOut,
      clearError,
    }),
    [user, session, isLoading, error, isConfigured]
  );

  return <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an <AuthProvider>');
  }
  return context;
}
