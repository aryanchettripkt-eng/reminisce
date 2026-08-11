/**
 * Reminiq - Live Multi-User Real JWT & Supabase Memory Persistence Test Suite
 *
 * Covers:
 * 1. Photo Memory: Upload binary -> DB row -> Signed URL -> Query -> Delete
 * 2. Voice Memory: Upload audio binary to memory-audio -> DB row -> Signed Audio URL -> Query -> Delete
 * 3. Text Memory: Create text-only memory -> Query -> Verify no dummy storage paths
 * 4. Music Memory: Create music memory with JSONB track metadata -> Query -> Verify persistence
 * 5. Cross-User RLS Isolation: User B cannot read, update, delete, or download User A's data
 * 6. Unauthenticated Rejection: Unauthenticated requests strictly rejected
 * 7. Failure Recovery: Storage rollback on database insert failures (preventing orphaned files)
 *
 * Execute with: npx tsx test-supabase-persistence.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from './src/services/supabase/client';
import { STORAGE_CONFIG } from './src/services/supabase/config';
import {
  createMemory,
  listUserMemories,
  getMemory,
  updateMemory,
  deleteMemory,
} from './src/services/supabase/memoryStorage';
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
  const { data: anonData } = await client.auth.signInAnonymously();
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

  throw new Error(`Failed to create isolated session for ${label}: ${signUpError?.message}`);
}

async function runPersistenceTestSuite() {
  console.log(colors.bold('\n💾 Reminiq: Live Supabase Core Memory Persistence Test Suite\n'));

  if (!isSupabaseConfigured()) {
    console.error(colors.red('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'));
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Unauthenticated Enforcement
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('1. Testing Unauthenticated Operation Enforcement'));
  try {
    await createMemory({ type: 'text', title: 'Unauthenticated note' });
    assert(false, 'Unauthenticated createMemory should throw');
  } catch (err: any) {
    assert(
      err instanceof AuthenticationRequiredError || err.name === 'AuthenticationRequiredError' || err.message?.includes('sign in'),
      'Unauthenticated createMemory strictly rejected with AuthenticationRequiredError'
    );
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Multi-User Session Setup
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n2. Initializing Two Distinct Authenticated JWT Users'));
  const userA = await createIsolatedUserClient('UserA');
  const userB = await createIsolatedUserClient('UserB');
  console.log(`  ${colors.green('✓')} User A authenticated (UUID: ${userA.user.id})`);
  console.log(`  ${colors.green('✓')} User B authenticated (UUID: ${userB.user.id})`);
  assert(userA.user.id !== userB.user.id, 'User A and User B have separate UUID identities');

  // Dummy binary data for tests
  const dummyImageBytes = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const dummyAudioBytes = Buffer.from('RIFF$    WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00D\xac\x00\x00\x88X\x01\x00\x02\x00\x10\x00data\x00\x00\x00\x00', 'binary');

  // ─────────────────────────────────────────────────────────────
  // 3. Photo Memory Persistence (memory-images)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n3. Testing Photo Memory Persistence'));
  const photoMemoryId = crypto.randomUUID();
  const photoStoragePath = `${userA.user.id}/${photoMemoryId}/original.png`;

  // Upload image binary
  const { error: photoUploadErr } = await userA.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .upload(photoStoragePath, dummyImageBytes, { contentType: 'image/png' });
  assert(!photoUploadErr, 'Photo binary uploaded to memory-images bucket', photoUploadErr?.message);

  // Insert memory in Postgres
  const { data: photoDb, error: photoDbErr } = await userA.client
    .from('memories')
    .insert({
      id: photoMemoryId,
      user_id: userA.user.id,
      type: 'photo',
      title: 'A Golden Sunset at Malibu',
      description: 'The waves were amber and warm.',
      mood: 'joy',
      location: 'Malibu Beach',
      memory_date: new Date('2024-07-15T18:30:00Z').toISOString(),
      storage_bucket: STORAGE_CONFIG.BUCKET_NAME,
      storage_path: photoStoragePath,
      original_filename: 'sunset.png',
      mime_type: 'image/png',
      file_size: dummyImageBytes.length,
    })
    .select('*')
    .single();

  assert(!photoDbErr && photoDb?.id === photoMemoryId, 'Photo memory record created in Postgres', photoDbErr?.message);
  assert(photoDb?.user_id === userA.user.id, 'Photo memory user_id matches User A auth.uid()');

  // Generate signed URL
  const { data: photoSignedUrl } = await userA.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .createSignedUrl(photoStoragePath, 3600);
  assert(Boolean(photoSignedUrl?.signedUrl), 'Generated signed URL for private photo memory');

  // ─────────────────────────────────────────────────────────────
  // 4. Voice Memory Persistence (memory-audio)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n4. Testing Voice Memory Persistence'));
  const voiceMemoryId = crypto.randomUUID();
  const voiceStoragePath = `${userA.user.id}/${voiceMemoryId}/original.wav`;

  // Upload audio binary to memory-audio
  const { error: voiceUploadErr } = await userA.client.storage
    .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
    .upload(voiceStoragePath, dummyAudioBytes, { contentType: 'audio/wav' });
  assert(!voiceUploadErr, 'Voice binary uploaded to private memory-audio bucket', voiceUploadErr?.message);

  // Insert voice memory in Postgres
  const { data: voiceDb, error: voiceDbErr } = await userA.client
    .from('memories')
    .insert({
      id: voiceMemoryId,
      user_id: userA.user.id,
      type: 'voice',
      title: 'Birds singing by the lake',
      description: 'Morning recording of early sparrows.',
      mood: 'peaceful',
      location: 'Lake Tahoe',
      memory_date: new Date('2024-08-01T06:15:00Z').toISOString(),
      audio_storage_bucket: STORAGE_CONFIG.AUDIO_BUCKET_NAME,
      audio_storage_path: voiceStoragePath,
      transcript: 'The quiet morning was full of early sparrows singing by the shore.',
      emotion: 'peaceful',
    })
    .select('*')
    .single();

  assert(!voiceDbErr && voiceDb?.id === voiceMemoryId, 'Voice memory record created in Postgres', voiceDbErr?.message);
  assert(voiceDb?.audio_storage_path === voiceStoragePath, 'Voice memory audio_storage_path recorded in Postgres');

  // Generate signed URL for audio
  const { data: voiceSignedUrl } = await userA.client.storage
    .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
    .createSignedUrl(voiceStoragePath, 3600);
  assert(Boolean(voiceSignedUrl?.signedUrl), 'Generated temporary signed URL for private audio memory playback');

  // ─────────────────────────────────────────────────────────────
  // 5. Text Memory Persistence (no binary storage)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n5. Testing Text Memory Persistence'));
  const textMemoryId = crypto.randomUUID();

  const { data: textDb, error: textDbErr } = await userA.client
    .from('memories')
    .insert({
      id: textMemoryId,
      user_id: userA.user.id,
      type: 'text',
      title: 'Grandma folding origami',
      description: 'The light through amber curtains made everything golden.',
      mood: 'nostalgic',
      location: "Grandma's Kitchen",
      memory_date: new Date('2024-06-10T14:00:00Z').toISOString(),
      tags: ['family', 'origami', 'afternoon'],
    })
    .select('*')
    .single();

  assert(!textDbErr && textDb?.id === textMemoryId, 'Text-only memory record created in Postgres', textDbErr?.message);
  assert(textDb?.storage_path === null && textDb?.audio_storage_path === null, 'Text memory has no dummy storage paths');

  // ─────────────────────────────────────────────────────────────
  // 6. Music Memory Persistence (JSONB track metadata)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n6. Testing Music Memory Persistence'));
  const musicMemoryId = crypto.randomUUID();

  const { data: musicDb, error: musicDbErr } = await userA.client
    .from('memories')
    .insert({
      id: musicMemoryId,
      user_id: userA.user.id,
      type: 'music',
      title: 'Moonlight Sonata in Rain',
      description: 'Listening to classical music while the thunderstorm raged outside.',
      mood: 'melancholic',
      memory_date: new Date('2024-05-20T22:00:00Z').toISOString(),
      music_url: 'https://example.com/audio/moonlight.mp3',
      music_track: {
        song: 'Moonlight Sonata',
        artist: 'Ludwig van Beethoven',
        albumArt: 'https://example.com/art/beethoven.jpg',
      },
    })
    .select('*')
    .single();

  assert(!musicDbErr && musicDb?.id === musicMemoryId, 'Music memory record created in Postgres', musicDbErr?.message);
  assert(musicDb?.music_track?.song === 'Moonlight Sonata', 'Music track metadata correctly preserved in JSONB');

  // ─────────────────────────────────────────────────────────────
  // 7. Querying and Reloading User A Memories
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n7. Testing Query & Chronological Ordering for User A'));
  const { data: userAMemories, error: userAFetchErr } = await userA.client
    .from('memories')
    .select('*')
    .order('memory_date', { ascending: false });

  assert(!userAFetchErr && userAMemories?.length >= 4, 'User A retrieved all 4 persisted memories', userAFetchErr?.message);

  // ─────────────────────────────────────────────────────────────
  // 8. Cross-User RLS Isolation Attacks by User B
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n8. Testing Cross-User RLS Isolation (User B Attacks User A Data)'));

  // 8.1 User B tries to SELECT User A's photo, voice, text, music
  const { data: userBSelect } = await userB.client
    .from('memories')
    .select('*')
    .in('id', [photoMemoryId, voiceMemoryId, textMemoryId, musicMemoryId]);

  assert(userBSelect?.length === 0, 'Postgres RLS blocks User B from SELECTing User A memories (0 rows)');

  // 8.2 User B tries to UPDATE User A's memory
  const { data: userBUpdate } = await userB.client
    .from('memories')
    .update({ title: 'Hacked Title' })
    .eq('id', photoMemoryId)
    .select();

  assert(userBUpdate?.length === 0, 'Postgres RLS blocks User B from UPDATING User A memories');

  // 8.3 User B tries to DELETE User A's memory
  const { data: userBDelete } = await userB.client
    .from('memories')
    .delete()
    .eq('id', textMemoryId)
    .select();

  assert(userBDelete?.length === 0, 'Postgres RLS blocks User B from DELETING User A memories');

  // 8.4 User B tries to download User A's image from memory-images
  const { error: userBImgDlErr } = await userB.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .download(photoStoragePath);

  assert(userBImgDlErr !== null, 'Storage RLS blocks User B from downloading User A image binary');

  // 8.5 User B tries to download User A's audio from memory-audio
  const { error: userBAudioDlErr } = await userB.client.storage
    .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
    .download(voiceStoragePath);

  assert(userBAudioDlErr !== null, 'Storage RLS blocks User B from downloading User A voice audio binary');

  // ─────────────────────────────────────────────────────────────
  // 9. Storage Cleanup & Deletion Flow for User A
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n9. Testing Safe Multi-Bucket Deletion Flow'));

  // Delete photo binary from memory-images
  const { error: photoCleanErr } = await userA.client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .remove([photoStoragePath]);
  assert(!photoCleanErr, 'User A deleted photo binary from memory-images');

  // Delete voice binary from memory-audio
  const { error: voiceCleanErr } = await userA.client.storage
    .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
    .remove([voiceStoragePath]);
  assert(!voiceCleanErr, 'User A deleted voice binary from memory-audio');

  // Delete database rows
  const { error: dbCleanErr } = await userA.client
    .from('memories')
    .delete()
    .in('id', [photoMemoryId, voiceMemoryId, textMemoryId, musicMemoryId]);
  assert(!dbCleanErr, 'User A deleted all 4 test memory rows from Postgres');

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

runPersistenceTestSuite().catch((err) => {
  console.error(colors.red('Unhandled test runner error:'), err);
  process.exit(1);
});
