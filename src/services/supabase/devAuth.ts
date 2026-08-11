import { getSupabaseClient } from './client';

/**
 * TEST-ONLY Authentication Helper
 *
 * NOTE: This helper is STRICTLY for offline CLI test runners and multi-user RLS integration tests.
 * It is completely decoupled and never invoked by the Reminiq production application runtime.
 * Production application authentication is exclusively handled by real Supabase Google OAuth.
 */
export async function ensureAuthenticatedUser(): Promise<string> {
  const client = getSupabaseClient();

  // 1. Check if an active session already exists in browser / memory
  const { data: userData } = await client.auth.getUser();
  if (userData?.user?.id) {
    return userData.user.id;
  }

  // 2. Try anonymous authentication first (instant, no password, no email rate limits)
  const { data: anonData, error: anonError } = await client.auth.signInAnonymously();
  if (anonData?.user?.id) {
    return anonData.user.id;
  }

  // 3. Fallback: Try signing up a unique dev user
  const devEmail = `dev_${Date.now()}@reminiq.local`;
  const devPassword = 'Password_Reminiq123!';

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email: devEmail,
    password: devPassword,
  });

  if (signUpData?.user?.id) {
    return signUpData.user.id;
  }

  throw new Error(
    `Cannot create Supabase session. In Supabase Dashboard -> Authentication -> Providers: Enable "Anonymous sign-ins" or disable "Confirm email". (Errors: ${anonError?.message || ''}, ${signUpError?.message || ''})`
  );
}
