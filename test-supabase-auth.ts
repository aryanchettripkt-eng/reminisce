/**
 * Reminiq - Live Multi-User Real JWT & Supabase RLS Integration Test Suite
 *
 * Requirements:
 * 1. Live Supabase project configured in .env (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY)
 * 2. Supabase Auth with Anonymous sign-ins enabled OR email signups enabled.
 *
 * Runs real JWT cross-user isolation tests verifying that Postgres RLS & Storage RLS
 * strictly prevent User B from reading, modifying, or deleting User A's data.
 *
 * Execute with: npx tsx test-supabase-auth.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from './src/services/supabase/client';
import { STORAGE_CONFIG } from './src/services/supabase/config';
import { uploadMemoryImage, getMemorySignedUrl } from './src/services/supabase/memoryStorage';
import { AuthenticationRequiredError } from './src/types/storage';

const colors = {
  green: (t: string) => `\x1b[32m${t}\x1b[0m`,
  red: (t: string) => `\x1b[31m${t}\x1b[0m`,
  cyan: (t: string) => `\x1b[36m${t}\x1b[0m`,
  yellow: (t: string) => `\x1b[33m${t}\x1b[0m`,
  bold: (t: string) => `\x1b[1m${t}\x1b[0m`,
};

let passed = 0;
let failed = 0;

function assert(condition: boolean, testName: string, detail?: string) {
  if (condition) {
    console.log(`  ${colors.green('✓')} ${testName}`);
    passed++;
  } else {
    console.error(`  ${colors.red('✗')} ${testName}${detail ? ` - ${detail}` : ''}`);
    failed++;
  }
}

async function createIsolatedUserClient(label: string) {
  const { url, anonKey } = getSupabaseConfig();
  const client = createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });

  // Try anonymous authentication first
  const { data: anonData, error: anonError } = await client.auth.signInAnonymously();
  if (anonData?.user?.id && anonData.session?.access_token) {
    return {
      client,
      user: anonData.user,
      token: anonData.session.access_token,
    };
  }

  // Fallback: create fresh test user
  const email = `test_${label.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}@reminiq-test.local`;
  const password = 'Test_Password_123!#';

  const { data: signUpData, error: signUpError } = await client.auth.signUp({
    email,
    password,
  });

  if (signUpData?.user?.id && signUpData.session?.access_token) {
    return {
      client,
      user: signUpData.user,
      token: signUpData.session.access_token,
    };
  }

  throw new Error(`Failed to create isolated session for ${label}: (Anon: ${anonError?.message}, SignUp: ${signUpError?.message})`);
}

async function runAuthAndRlsTests() {
  console.log(colors.bold('\n🔒 Reminiq: Real Multi-User JWT & Supabase RLS Test Suite\n'));

  if (!isSupabaseConfigured()) {
    console.error(colors.red('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'));
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Unauthenticated Upload Rejection Test
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('1. Testing Unauthenticated Upload Enforcement'));
  try {
    const fakeBlob = new Blob(['unauthenticated-binary-data'], { type: 'image/png' });
    // Calling uploadMemoryImage without an authenticated user in client must fail with AuthenticationRequiredError
    await uploadMemoryImage(fakeBlob);
    assert(false, 'Unauthenticated upload should be rejected');
  } catch (err: any) {
    assert(
      err instanceof AuthenticationRequiredError || err.name === 'AuthenticationRequiredError' || err.message?.includes('sign in'),
      'Unauthenticated upload strictly rejected with AuthenticationRequiredError',
      err.message
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Multi-User Session Initialization
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n2. Creating Two Real Authenticated Supabase JWT Sessions'));
  let userA: { client: any; user: any; token: string };
  let userB: { client: any; user: any; token: string };

  try {
    userA = await createIsolatedUserClient('UserA');
    console.log(`  ${colors.green('✓')} User A authenticated (UUID: ${userA.user.id})`);
  } catch (err: any) {
    console.error(colors.red('  ✗ Failed to create User A session:'), err.message);
    return;
  }

  try {
    userB = await createIsolatedUserClient('UserB');
    console.log(`  ${colors.green('✓')} User B authenticated (UUID: ${userB.user.id})`);
  } catch (err: any) {
    console.error(colors.red('  ✗ Failed to create User B session:'), err.message);
    return;
  }

  assert(userA.user.id !== userB.user.id, 'User A and User B have distinct Supabase Auth UUIDs');

  // ─────────────────────────────────────────────────────────────
  // 3. User A: Upload Memory & Create Database Record
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n3. User A: Upload Image & Register Memory'));
  const memoryIdA = crypto.randomUUID();
  const storagePathA = `${userA.user.id}/${memoryIdA}/original.png`;
  const dummyImageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');

  // Upload to User A's storage folder
  const { data: uploadDataA, error: uploadErrA } = await userA.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .upload(storagePathA, dummyImageBytes, {
      contentType: 'image/png',
      upsert: false,
    });

  assert(!uploadErrA && uploadDataA !== null, 'User A uploaded image binary to storage', uploadErrA?.message);

  // Insert memory row into public.memories as User A
  const { data: insertDataA, error: insertErrA } = await userA.client
    .from('memories')
    .insert({
      id: memoryIdA,
      user_id: userA.user.id,
      storage_bucket: STORAGE_CONFIG.BUCKET_NAME,
      storage_path: storagePathA,
      original_filename: 'polaroid-a.png',
      mime_type: 'image/png',
      file_size: dummyImageBytes.length,
    })
    .select('*')
    .single();

  assert(!insertErrA && insertDataA?.id === memoryIdA, 'User A inserted memory row in Postgres', insertErrA?.message);
  assert(insertDataA?.user_id === userA.user.id, 'Memory record user_id matches User A auth.uid()');

  // User A can read its own memory
  const { data: userARead, error: userAReadErr } = await userA.client
    .from('memories')
    .select('*')
    .eq('id', memoryIdA);

  assert(!userAReadErr && userARead?.length === 1, 'User A can SELECT its own memory row');

  // ─────────────────────────────────────────────────────────────
  // 4. User B Cross-User RLS Attack Testing
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n4. User B: Cross-User RLS Isolation Attacks against User A Data'));

  // Attack 4.1: User B attempts SELECT on User A's memory
  const { data: userBSelect, error: userBSelectErr } = await userB.client
    .from('memories')
    .select('*')
    .eq('id', memoryIdA);

  assert(
    !userBSelectErr && userBSelect?.length === 0,
    'Postgres RLS blocks User B from SELECTing User A memory (returns 0 rows)',
    `Returned ${userBSelect?.length} rows`
  );

  // Attack 4.2: User B attempts UPDATE on User A's memory
  const { data: userBUpdate, error: userBUpdateErr } = await userB.client
    .from('memories')
    .update({ original_filename: 'tampered-by-user-b.png' })
    .eq('id', memoryIdA)
    .select();

  assert(
    userBUpdate?.length === 0,
    'Postgres RLS blocks User B from UPDATING User A memory (0 rows affected)',
    `Updated ${userBUpdate?.length} rows`
  );

  // Attack 4.3: User B attempts DELETE on User A's memory
  const { data: userBDelete, error: userBDeleteErr } = await userB.client
    .from('memories')
    .delete()
    .eq('id', memoryIdA)
    .select();

  assert(
    userBDelete?.length === 0,
    'Postgres RLS blocks User B from DELETING User A memory (0 rows affected)',
    `Deleted ${userBDelete?.length} rows`
  );

  // Attack 4.4: User B attempts direct download of User A's private storage object
  const { data: userBDownload, error: userBDownloadErr } = await userB.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .download(storagePathA);

  assert(
    userBDownloadErr !== null || userBDownload === null,
    'Storage RLS blocks User B from downloading User A private storage object',
    userBDownloadErr?.message
  );

  // Attack 4.5: User B attempts to upload into User A's storage folder
  const maliciousPath = `${userA.user.id}/${crypto.randomUUID()}/malicious.png`;
  const { error: userBMaliciousUploadErr } = await userB.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .upload(maliciousPath, dummyImageBytes, { contentType: 'image/png' });

  assert(
    userBMaliciousUploadErr !== null,
    'Storage RLS blocks User B from uploading files into User A folder',
    userBMaliciousUploadErr?.message
  );

  // ─────────────────────────────────────────────────────────────
  // 5. Cleanup & Teardown
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n5. User A Cleanup & Teardown'));
  const { error: cleanupStorageErr } = await userA.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .remove([storagePathA]);

  assert(!cleanupStorageErr, 'User A cleaned up test storage object');

  const { error: cleanupDbErr } = await userA.client
    .from('memories')
    .delete()
    .eq('id', memoryIdA);

  assert(!cleanupDbErr, 'User A cleaned up test database row');

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log(colors.bold('\n======================================================'));
  console.log(`Results: ${colors.green(`${passed} passed`)}, ${failed > 0 ? colors.red(`${failed} failed`) : '0 failed'}`);
  console.log(colors.bold('======================================================\n'));

  if (failed > 0) {
    process.exit(1);
  }
}

runAuthAndRlsTests().catch((err) => {
  console.error(colors.red('Unhandled error in test runner:'), err);
  process.exit(1);
});
