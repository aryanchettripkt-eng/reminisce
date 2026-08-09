import { getSupabaseClient } from './client';

/**
 * Development Authentication Helper
 *
 * Provides a seamless authenticated session for localhost development
 * until full frontend authentication UI is implemented.
 *
 * Ensures a valid user UUID exists in auth.users so that:
 * 1. Postgres foreign key (memories.user_id -> auth.users.id) is satisfied.
 * 2. Supabase Storage RLS (storage.foldername(name)[1] = auth.uid()) evaluates to true.
 * 3. Memories and images are genuinely persisted to your live Supabase project.
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
