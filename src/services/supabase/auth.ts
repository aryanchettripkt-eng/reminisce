import { User, Session, AuthChangeEvent } from '@supabase/supabase-js';
import { getSupabaseClient, isSupabaseConfigured } from './client';

/**
 * Reminiq - Supabase Google Authentication Service
 *
 * Implements real Google OAuth authentication using Supabase Auth as the single source of truth.
 * Session state is persisted and derived directly from auth.uid().
 */

export interface AuthResult {
  error: Error | null;
  data?: {
    user: User | null;
    session: Session | null;
  };
}

/**
 * Initiates the Google OAuth sign-in flow via Supabase Auth.
 * Supabase handles redirecting to Google's consent screen and returning the user with an authenticated session.
 *
 * @param redirectTo Optional custom post-login redirect URL (defaults to current window.location.origin, e.g. http://localhost:3000)
 */
export async function signInWithGoogle(redirectTo?: string): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return {
      error: new Error('Supabase is not configured. Please check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file.'),
    };
  }

  const client = getSupabaseClient();
  const targetRedirect = redirectTo || (typeof window !== 'undefined' ? window.location.origin : undefined);

  try {
    const { error } = await client.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: targetRedirect,
        queryParams: {
          access_type: 'offline',
          prompt: 'select_account',
        },
      },
    });

    if (error) {
      return { error: mapAuthError(error) };
    }

    return { error: null };
  } catch (err: any) {
    return { error: mapAuthError(err) };
  }
}

/**
 * Signs out the currently authenticated user and clears local Supabase session storage.
 */
export async function signOut(): Promise<AuthResult> {
  if (!isSupabaseConfigured()) {
    return { error: null };
  }

  const client = getSupabaseClient();

  try {
    const { error } = await client.auth.signOut();
    if (error) {
      return { error: mapAuthError(error) };
    }
    return { error: null };
  } catch (err: any) {
    return { error: mapAuthError(err) };
  }
}

/**
 * Retrieves the currently active authenticated user from the local Supabase session.
 */
export async function getCurrentUser(): Promise<User | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getUser();
    if (error || !data?.user) return null;
    return data.user;
  } catch {
    return null;
  }
}

/**
 * Retrieves the current Supabase session.
 */
export async function getCurrentSession(): Promise<Session | null> {
  if (!isSupabaseConfigured()) return null;

  try {
    const client = getSupabaseClient();
    const { data, error } = await client.auth.getSession();
    if (error || !data?.session) return null;
    return data.session;
  } catch {
    return null;
  }
}

/**
 * Subscribes to Supabase authentication state changes.
 * The returned object contains an `unsubscribe` method to cleanly remove the subscription on component unmount.
 */
export function subscribeToAuthChanges(
  callback: (event: AuthChangeEvent, session: Session | null) => void
): { unsubscribe: () => void } {
  if (!isSupabaseConfigured()) {
    return { unsubscribe: () => {} };
  }

  const client = getSupabaseClient();
  const { data: { subscription } } = client.auth.onAuthStateChange(callback);

  return {
    unsubscribe: () => {
      subscription.unsubscribe();
    },
  };
}

/**
 * Maps raw Supabase or network errors to friendly user-facing messages.
 */
function mapAuthError(error: unknown): Error {
  if (!error) return new Error('An unexpected authentication error occurred.');

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();
    if (msg.includes('user cancelled') || msg.includes('access_denied')) {
      return new Error('Sign in was cancelled.');
    }
    if (msg.includes('network') || msg.includes('fetch')) {
      return new Error('Network error during authentication. Please check your internet connection.');
    }
    if (msg.includes('provider is not enabled') || msg.includes('unsupported provider')) {
      return new Error('Google sign-in is not enabled in your Supabase Dashboard -> Authentication -> Providers.');
    }
    return error;
  }

  return new Error(String(error));
}
