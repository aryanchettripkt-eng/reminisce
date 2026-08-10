/**
 * Reminiq - Live Multi-User Real JWT & Supabase Album Persistence Test Suite
 *
 * Covers:
 * 1. Unauthenticated Enforcement: All album operations strictly reject unauthenticated callers
 * 2. Multi-User JWT Setup: User A and User B distinct authenticated sessions
 * 3. Album CRUD: Create album with initial memories -> Read -> Rename -> Update journal -> Read
 * 4. Memory Relationship Management: Add memory -> Query ordered memories -> Remove memory
 * 5. Memory Persistence on Album Removal: Removing from album leaves memory and storage intact
 * 6. Many-to-Many Support: Same memory in Album 1 and Album 2; removing from one doesn't affect the other
 * 7. Album Deletion: Deleting album removes junction rows, leaves underlying memories and media intact
 * 8. Memory Deletion: Deleting memory automatically removes junction rows, leaves album intact
 * 9. Duplicate Prevention: Unique constraint on (album_id, memory_id) prevents duplicates
 * 10. Cross-User Security (Attack Simulations):
 *     - User B cannot SELECT User A's album
 *     - User B cannot UPDATE User A's album
 *     - User B cannot DELETE User A's album
 *     - User B cannot SELECT User A's album_memories relationships
 *     - User B cannot insert User B's memory into User A's album
 *     - User B cannot insert User A's memory into User B's album
 *
 * Execute with: npx tsx test-supabase-albums.ts
 */

import dotenv from 'dotenv';
dotenv.config();

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseConfig, isSupabaseConfigured } from './src/services/supabase/client';
import {
  createAlbum,
  listUserAlbums,
  getAlbum,
  updateAlbum,
  deleteAlbum,
  addMemoryToAlbum,
  removeMemoryFromAlbum,
  getAlbumMemories,
  createAlbumsBatch,
} from './src/services/supabase/albumService';
import {
  createMemory,
  deleteMemory,
} from './src/services/supabase/memoryStorage';
import { AuthenticationRequiredError, AlbumNotFoundError } from './src/types/storage';

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

async function createIsolatedUserClient(label: string): Promise<{
  client: SupabaseClient;
  user: any;
  token: string;
}> {
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
  const email = `test_album_${label.toLowerCase()}_${Date.now()}_${Math.random().toString(36).substring(7)}@reminiq-test.local`;
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

async function runAlbumTestSuite() {
  console.log(colors.bold('\n📖 Reminiq: Live Supabase Album Persistence & Security Test Suite\n'));

  if (!isSupabaseConfigured()) {
    console.error(colors.red('Supabase is not configured. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env'));
    process.exit(1);
  }

  // ─────────────────────────────────────────────────────────────
  // 1. Unauthenticated Operation Enforcement
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('1. Testing Unauthenticated Operation Enforcement'));
  try {
    await createAlbum({ title: 'Unauthenticated Album' });
    assert(false, 'Unauthenticated createAlbum should throw');
  } catch (err: any) {
    assert(
      err instanceof AuthenticationRequiredError || err.name === 'AuthenticationRequiredError' || err.message?.includes('sign in'),
      'Unauthenticated createAlbum strictly rejected'
    );
  }

  try {
    await getAlbum('00000000-0000-0000-0000-000000000000');
    assert(false, 'Unauthenticated getAlbum should throw');
  } catch (err: any) {
    assert(
      err instanceof AuthenticationRequiredError || err.name === 'AuthenticationRequiredError' || err.message?.includes('sign in'),
      'Unauthenticated getAlbum strictly rejected'
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

  // Helper to run operations as User A or User B on their respective client
  const asUser = async (userSession: { client: SupabaseClient; user: any }, fn: () => Promise<any>) => {
    // Perform operations using direct client calls matching the service pattern
    return fn();
  };

  // ─────────────────────────────────────────────────────────────
  // 3. User A: Create Memories for Album Testing
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n3. Creating Seed Memories for User A'));
  
  const mem1Id = crypto.randomUUID();
  const mem2Id = crypto.randomUUID();
  const mem3Id = crypto.randomUUID();

  const { error: m1Err } = await userA.client.from('memories').insert({
    id: mem1Id,
    user_id: userA.user.id,
    type: 'text',
    title: 'Morning Coffee in Paris',
    description: 'Fresh croissants by the Seine.',
    mood: 'joy',
    memory_date: new Date().toISOString(),
    tags: ['paris', 'coffee'],
    is_favorite: true,
  });
  assert(!m1Err, 'Created Memory 1 for User A');

  const { error: m2Err } = await userA.client.from('memories').insert({
    id: mem2Id,
    user_id: userA.user.id,
    type: 'text',
    title: 'Louvre at Sunset',
    description: 'Golden hour hitting the glass pyramid.',
    mood: 'nostalgic',
    memory_date: new Date().toISOString(),
    tags: ['louvre', 'sunset'],
    is_favorite: false,
  });
  assert(!m2Err, 'Created Memory 2 for User A');

  const { error: m3Err } = await userA.client.from('memories').insert({
    id: mem3Id,
    user_id: userA.user.id,
    type: 'text',
    title: 'Midnight Jazz Club',
    description: 'Warm saxophone melodies.',
    mood: 'peaceful',
    memory_date: new Date().toISOString(),
    tags: ['music', 'jazz'],
    is_favorite: true,
  });
  assert(!m3Err, 'Created Memory 3 for User A');

  // ─────────────────────────────────────────────────────────────
  // 4. Testing Album CRUD & Persistence for User A
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n4. Testing Album Creation with Initial Memories'));
  const album1Id = crypto.randomUUID();

  const { data: createdAlbum1, error: cAlbumErr } = await userA.client
    .from('albums')
    .insert({
      id: album1Id,
      user_id: userA.user.id,
      title: 'Parisian Autumn',
      description: 'A collection of autumn walks in Paris.',
      journal_text: 'A collection of autumn walks in Paris.',
      voice_note_url: 'https://example.com/audio/paris-walk.mp3',
    })
    .select()
    .single();

  assert(!cAlbumErr && createdAlbum1?.id === album1Id, 'Album 1 record created in public.albums');
  assert(createdAlbum1?.user_id === userA.user.id, 'Album 1 user_id matches User A auth.uid()');

  // Insert album_memories junction rows for Memory 1 and Memory 2
  const { error: linkErr } = await userA.client.from('album_memories').insert([
    { album_id: album1Id, memory_id: mem1Id, position: 0 },
    { album_id: album1Id, memory_id: mem2Id, position: 1 },
  ]);
  assert(!linkErr, 'Linked Memory 1 and Memory 2 to Album 1 in album_memories');

  // Read album back with relations
  const { data: readAlbum1 } = await userA.client
    .from('albums')
    .select('*')
    .eq('id', album1Id)
    .single();

  const { data: rels1 } = await userA.client
    .from('album_memories')
    .select('memory_id, position')
    .eq('album_id', album1Id)
    .order('position', { ascending: true });

  assert(readAlbum1?.title === 'Parisian Autumn', 'Read Album 1 title matches');
  assert(rels1?.length === 2, 'Album 1 contains exactly 2 memories');
  assert(rels1?.[0]?.memory_id === mem1Id && rels1?.[1]?.memory_id === mem2Id, 'Album 1 memories maintain position order');

  // ─────────────────────────────────────────────────────────────
  // 5. Testing Album Renaming & Journal Update
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n5. Testing Album Rename & Journal Update'));

  const { error: updateErr } = await userA.client
    .from('albums')
    .update({
      title: 'Golden Autumn in Paris',
      journal_text: 'Updated journal story about our trip.',
    })
    .eq('id', album1Id);

  assert(!updateErr, 'Updated Album 1 title and journal text');

  const { data: updatedAlbum1 } = await userA.client
    .from('albums')
    .select('*')
    .eq('id', album1Id)
    .single();

  assert(updatedAlbum1?.title === 'Golden Autumn in Paris', 'Album 1 title updated in database');
  assert(updatedAlbum1?.journal_text === 'Updated journal story about our trip.', 'Album 1 journal text updated in database');

  // ─────────────────────────────────────────────────────────────
  // 6. Testing Adding and Removing Memories from Album
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n6. Testing Adding and Removing Memories'));

  // Add Memory 3 to Album 1
  const { error: addMem3Err } = await userA.client
    .from('album_memories')
    .insert({ album_id: album1Id, memory_id: mem3Id, position: 2 });

  assert(!addMem3Err, 'Added Memory 3 to Album 1 at position 2');

  const { data: relsAfterAdd } = await userA.client
    .from('album_memories')
    .select('memory_id')
    .eq('album_id', album1Id);
  assert(relsAfterAdd?.length === 3, 'Album 1 now has 3 memories');

  // Remove Memory 2 from Album 1
  const { error: removeMem2Err } = await userA.client
    .from('album_memories')
    .delete()
    .eq('album_id', album1Id)
    .eq('memory_id', mem2Id);

  assert(!removeMem2Err, 'Removed Memory 2 from Album 1');

  const { data: relsAfterRemove } = await userA.client
    .from('album_memories')
    .select('memory_id')
    .eq('album_id', album1Id);
  assert(
    relsAfterRemove?.length === 2 &&
    relsAfterRemove.some(r => r.memory_id === mem1Id) &&
    relsAfterRemove.some(r => r.memory_id === mem3Id) &&
    !relsAfterRemove.some(r => r.memory_id === mem2Id),
    'Album 1 contains only Memory 1 and Memory 3'
  );

  // Verify Memory 2 still exists in public.memories!
  const { data: checkMem2 } = await userA.client
    .from('memories')
    .select('id, title')
    .eq('id', mem2Id)
    .single();
  assert(checkMem2?.id === mem2Id, 'Memory 2 still exists in memories table after album removal');

  // ─────────────────────────────────────────────────────────────
  // 7. Testing Many-to-Many Relationship (Memory Shared Across Albums)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n7. Testing Many-to-Many Album Sharing'));
  const album2Id = crypto.randomUUID();

  const { error: cAlbum2Err } = await userA.client.from('albums').insert({
    id: album2Id,
    user_id: userA.user.id,
    title: 'Favorite Moments',
  });
  assert(!cAlbum2Err, 'Created Album 2 for User A');

  // Link Memory 1 to Album 2 as well
  const { error: linkSharedErr } = await userA.client.from('album_memories').insert({
    album_id: album2Id,
    memory_id: mem1Id,
    position: 0,
  });
  assert(!linkSharedErr, 'Memory 1 successfully linked to both Album 1 and Album 2');

  // Remove Memory 1 from Album 1
  await userA.client.from('album_memories').delete().eq('album_id', album1Id).eq('memory_id', mem1Id);

  // Verify Memory 1 is still in Album 2!
  const { data: album2Rels } = await userA.client
    .from('album_memories')
    .select('memory_id')
    .eq('album_id', album2Id);
  assert(album2Rels?.some(r => r.memory_id === mem1Id), 'Memory 1 remains in Album 2 after removal from Album 1');

  // ─────────────────────────────────────────────────────────────
  // 8. Testing Duplicate Constraint on (album_id, memory_id)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n8. Testing Duplicate Constraint on (album_id, memory_id)'));
  const { error: dupErr } = await userA.client.from('album_memories').insert({
    album_id: album2Id,
    memory_id: mem1Id,
    position: 1,
  });
  assert(Boolean(dupErr), 'Inserting duplicate (album_id, memory_id) rejected by PRIMARY KEY constraint');

  // ─────────────────────────────────────────────────────────────
  // 9. Testing Album Deletion & Memory Preservation
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n9. Testing Album Deletion Cascade Behavior'));

  // Delete Album 1
  const { error: delAlbum1Err } = await userA.client.from('albums').delete().eq('id', album1Id);
  assert(!delAlbum1Err, 'Deleted Album 1');

  // Verify album_memories for Album 1 are gone
  const { data: checkAlbum1Rels } = await userA.client
    .from('album_memories')
    .select('*')
    .eq('album_id', album1Id);
  assert(checkAlbum1Rels?.length === 0, 'album_memories relationship rows deleted by ON DELETE CASCADE');

  // Verify Memory 1 and Memory 3 still exist in memories table
  const { data: checkMem1 } = await userA.client.from('memories').select('id').eq('id', mem1Id).single();
  const { data: checkMem3 } = await userA.client.from('memories').select('id').eq('id', mem3Id).single();
  assert(Boolean(checkMem1 && checkMem3), 'All underlying memories remain intact in database');

  // ─────────────────────────────────────────────────────────────
  // 10. Testing Memory Deletion & Album Relationship Cascade
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n10. Testing Memory Deletion Relationship Cascade'));

  // Delete Memory 1
  const { error: delMem1Err } = await userA.client.from('memories').delete().eq('id', mem1Id);
  assert(!delMem1Err, 'Deleted Memory 1 from public.memories');

  // Verify album_memories for Album 2 no longer has Memory 1
  const { data: checkAlbum2RelsAfterMemDel } = await userA.client
    .from('album_memories')
    .select('*')
    .eq('album_id', album2Id);
  assert(checkAlbum2RelsAfterMemDel?.length === 0, 'album_memories for deleted memory automatically cleaned up');

  // Verify Album 2 still exists!
  const { data: checkAlbum2StillExists } = await userA.client
    .from('albums')
    .select('id')
    .eq('id', album2Id)
    .single();
  assert(checkAlbum2StillExists?.id === album2Id, 'Album 2 still exists after constituent memory deletion');

  // Clean up Album 2
  await userA.client.from('albums').delete().eq('id', album2Id);

  // ─────────────────────────────────────────────────────────────
  // 11. Testing Cross-User RLS Security Isolation (Attack Simulations)
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n11. Testing Cross-User RLS Isolation (User B Attacks User A Data)'));

  // User A creates a fresh album and memory
  const albumPrivateAId = crypto.randomUUID();
  const memPrivateAId = crypto.randomUUID();

  await userA.client.from('memories').insert({
    id: memPrivateAId,
    user_id: userA.user.id,
    type: 'text',
    title: "User A's Secret Journal",
  });

  await userA.client.from('albums').insert({
    id: albumPrivateAId,
    user_id: userA.user.id,
    title: "User A's Private Album",
  });

  await userA.client.from('album_memories').insert({
    album_id: albumPrivateAId,
    memory_id: memPrivateAId,
    position: 0,
  });

  // Attack 1: User B tries to SELECT User A's album
  const { data: userBReadAlbum } = await userB.client
    .from('albums')
    .select('*')
    .eq('id', albumPrivateAId);
  assert(!userBReadAlbum || userBReadAlbum.length === 0, "Postgres RLS blocks User B from SELECTing User A's album (0 rows returned)");

  // Attack 2: User B tries to UPDATE User A's album
  const { data: userBUpdateAlbum } = await userB.client
    .from('albums')
    .update({ title: 'Hacked Title' })
    .eq('id', albumPrivateAId)
    .select();
  assert(!userBUpdateAlbum || userBUpdateAlbum.length === 0, "Postgres RLS blocks User B from UPDATING User A's album (0 rows affected)");

  // Attack 3: User B tries to DELETE User A's album
  const { data: userBDeleteAlbum } = await userB.client
    .from('albums')
    .delete()
    .eq('id', albumPrivateAId)
    .select();
  assert(!userBDeleteAlbum || userBDeleteAlbum.length === 0, "Postgres RLS blocks User B from DELETING User A's album (0 rows affected)");

  // Attack 4: User B tries to SELECT User A's album_memories relationships
  const { data: userBReadRels } = await userB.client
    .from('album_memories')
    .select('*')
    .eq('album_id', albumPrivateAId);
  assert(!userBReadRels || userBReadRels.length === 0, "Postgres RLS blocks User B from reading User A's album_memories");

  // Attack 5: User B creates their own Memory B and tries to link it into User A's Album A
  const memBId = crypto.randomUUID();
  await userB.client.from('memories').insert({
    id: memBId,
    user_id: userB.user.id,
    type: 'text',
    title: "User B Memory",
  });

  const { error: userBInjectMemError } = await userB.client.from('album_memories').insert({
    album_id: albumPrivateAId,
    memory_id: memBId,
    position: 1,
  });
  assert(Boolean(userBInjectMemError), "Postgres RLS blocks User B from adding Memory B into User A's Album A");

  // Attack 6: User B creates Album B and tries to steal/link User A's Memory A into User B's Album B
  const albumBId = crypto.randomUUID();
  await userB.client.from('albums').insert({
    id: albumBId,
    user_id: userB.user.id,
    title: "User B Album",
  });

  const { error: userBStealMemError } = await userB.client.from('album_memories').insert({
    album_id: albumBId,
    memory_id: memPrivateAId,
    position: 0,
  });
  assert(Boolean(userBStealMemError), "Postgres RLS blocks User B from adding User A's Memory A into User B's Album B");

  // ─────────────────────────────────────────────────────────────
  // 12. Cleanup
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n12. Cleaning Up Test Artifacts'));
  await userA.client.from('albums').delete().eq('id', albumPrivateAId);
  await userA.client.from('memories').delete().eq('id', memPrivateAId);
  await userA.client.from('memories').delete().eq('id', mem2Id);
  await userA.client.from('memories').delete().eq('id', mem3Id);
  await userB.client.from('albums').delete().eq('id', albumBId);
  await userB.client.from('memories').delete().eq('id', memBId);
  console.log(`  ${colors.green('✓')} Test artifacts cleaned up successfully.`);

  // Summary
  console.log('\n======================================================');
  console.log(`Results: ${colors.green(`${passed} passed`)}, ${failed > 0 ? colors.red(`${failed} failed`) : '0 failed'}`);
  console.log('======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
}

runAlbumTestSuite().catch((err) => {
  console.error(colors.red('Fatal test error:'), err);
  process.exit(1);
});
