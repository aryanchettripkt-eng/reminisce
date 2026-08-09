import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Supabase Client Initialization
 *
 * Exposes a client-safe Supabase instance using publishable anon keys.
 * Service role keys are NEVER exposed to the browser.
 */

let cachedClient: SupabaseClient | null = null;

export const getSupabaseConfig = () => {
  // Support both Vite browser environment (import.meta.env) and Node CLI / test runners (process.env)
  const metaEnv = typeof import.meta !== 'undefined' && (import.meta as any).env ? (import.meta as any).env : {};
  const procEnv = typeof process !== 'undefined' && process.env ? process.env : {};

  let url = ((metaEnv.VITE_SUPABASE_URL || procEnv.VITE_SUPABASE_URL || '') as string).trim();
  const anonKey = ((metaEnv.VITE_SUPABASE_ANON_KEY || procEnv.VITE_SUPABASE_ANON_KEY || '') as string).trim();

  // Sanitize URL: if user pasted the REST endpoint URL (ending with /rest/v1) or trailing slash, clean it to base origin
  if (url) {
    url = url.replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
  }

  return { url, anonKey };
};

export const isSupabaseConfigured = (): boolean => {
  const { url, anonKey } = getSupabaseConfig();
  return Boolean(
    url &&
    anonKey &&
    url !== 'your-supabase-url-here' &&
    anonKey !== 'your-supabase-anon-key-here' &&
    !url.includes('example.com') &&
    !url.includes('your-project-ref')
  );
};

export const getSupabaseClient = (): SupabaseClient => {
  if (cachedClient) {
    return cachedClient;
  }

  const { url, anonKey } = getSupabaseConfig();

  if (!url || !anonKey || url === 'your-supabase-url-here') {
    throw new Error(
      'Supabase credentials are not configured.\n\n' +
      'Please add VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY to your .env file.\n' +
      'Check .env.example for more information.'
    );
  }

  cachedClient = createClient(url, anonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });

  return cachedClient;
};

// Export pre-initialized client instance if environment allows, or lazy getter
export const supabase = {
  get instance(): SupabaseClient {
    return getSupabaseClient();
  },
};
