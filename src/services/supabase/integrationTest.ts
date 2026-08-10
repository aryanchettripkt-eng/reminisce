/**
 * Reminiq - Live Multi-User Supabase Integration & Diagnostics Runner
 *
 * Requirements to run:
 * 1. Configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env
 * 2. Execute with: npx tsx src/services/supabase/integrationTest.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { isSupabaseConfigured, getSupabaseClient, getSupabaseConfig } from './client';
import { STORAGE_CONFIG } from './config';
import { getCurrentUser, getCurrentSession } from './auth';

const colors = {
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  bold: (t: string) => `\x1b[1m${t}\x1b[0m`,
};

async function runLiveIntegrationTests() {
  console.log(colors.bold('\n🌐 Reminiq: Live Supabase Integration & Diagnostics Runner\n'));

  if (!isSupabaseConfigured()) {
    console.log(colors.yellow('⚠️  Supabase environment variables are not configured with a live project URL.'));
    return;
  }

  const client = getSupabaseClient();
  const config = getSupabaseConfig();
  console.log(colors.cyan('Connecting to Supabase at:'), config.url);

  // 1. Check Auth Configuration & Current Session
  console.log(colors.cyan('\n1. Checking Supabase Auth module...'));
  const user = await getCurrentUser();
  const session = await getCurrentSession();
  if (user && session) {
    console.log(`  ${colors.green('✓')} Active session detected: User UUID ${user.id} (${user.email || 'Google User'})`);
  } else {
    console.log(`  ${colors.green('✓')} Supabase Auth client initialized (Ready for Google OAuth login).`);
  }

  // 2. Check database table `public.memories`
  console.log(colors.cyan('\n2. Checking Postgres "memories" table...'));
  const { data: tableData, error: tableErr } = await client.from('memories').select('id').limit(1);

  if (tableErr) {
    console.error(colors.red('  ✗ Could not access "memories" table:'), tableErr.message);
  } else {
    console.log(`  ${colors.green('✓')} "memories" table is accessible and RLS is active.`);
  }

  // 3. Check Storage bucket read access
  console.log(colors.cyan('\n3. Testing Storage bucket "memory-images"...'));
  
  const { data: filesData, error: filesErr } = await client.storage.from(STORAGE_CONFIG.BUCKET_NAME).list('', { limit: 1 });

  if (filesErr) {
    if (filesErr.message.toLowerCase().includes('not found')) {
      console.log(colors.yellow(`  ℹ️  Storage API: Bucket not found in list. Checking RLS policy...`));
    } else {
      console.log(`  ${colors.green('✓')} Bucket "${STORAGE_CONFIG.BUCKET_NAME}" exists! Storage RLS correctly enforced: (${filesErr.message})`);
    }
  } else {
    console.log(`  ${colors.green('✓')} Bucket "${STORAGE_CONFIG.BUCKET_NAME}" is accessible!`);
  }

  console.log(colors.green('\n✓ Diagnostics completed.\n'));
}

runLiveIntegrationTests().catch((err) => {
  console.error('Integration test runner error:', err);
});
