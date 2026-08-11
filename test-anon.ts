import dotenv from 'dotenv';
dotenv.config();

import { getSupabaseClient } from './src/services/supabase/client';

async function testAnon() {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.signInAnonymously();
  console.log('Anon signIn result:', {
    user: data?.user?.id,
    session: Boolean(data?.session),
    error: error?.message,
  });
}

testAnon();
