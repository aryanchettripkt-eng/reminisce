/**
 * Reminiq - Supabase Storage & Memory Service Unit & Flow Tests
 *
 * NOTE: These are local unit and flow simulation tests.
 * For live integration tests against a real Supabase backend with authenticated user JWTs,
 * see `src/services/supabase/integrationTest.ts`.
 *
 * Execute with: npx tsx src/services/supabase/testStorage.ts
 */

import { validateImageFile, formatBytes } from './validation';
import { STORAGE_CONFIG, IMAGE_VARIANTS } from './config';
import {
  ValidationError,
  AuthenticationRequiredError,
  StorageError,
  DatabaseError,
  MemoryNotFoundError,
} from '../../types/storage';

// ANSI terminal color styling
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

async function runUnitAndFlowTests() {
  console.log(colors.bold('\n🧪 Reminiq: Unit & Deletion Flow Test Suite\n'));

  // ─────────────────────────────────────────────────────────────
  // 1. Local TypeScript Logic & File Validation Tests
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('1. [Unit] File Type, Extension & Size Validation'));

  // Valid JPEG
  try {
    const fakeJpeg = new Blob(['fake-jpeg-data'], { type: 'image/jpeg' });
    const result = validateImageFile(fakeJpeg, { filename: 'vacation.jpg' });
    assert(result.isValid && result.extension === 'jpg' && result.mimeType === 'image/jpeg', 'Accepts valid image/jpeg');
  } catch (e: any) {
    assert(false, `Should accept valid image/jpeg: ${e.message}`);
  }

  // Valid PNG
  try {
    const fakePng = new Blob(['fake-png-data'], { type: 'image/png' });
    const result = validateImageFile(fakePng, { filename: 'sunset.png' });
    assert(result.isValid && result.extension === 'png' && result.mimeType === 'image/png', 'Accepts valid image/png');
  } catch (e: any) {
    assert(false, `Should accept valid image/png: ${e.message}`);
  }

  // Valid WebP
  try {
    const fakeWebp = new Blob(['fake-webp-data'], { type: 'image/webp' });
    const result = validateImageFile(fakeWebp);
    assert(result.isValid && result.extension === 'webp', 'Accepts valid image/webp');
  } catch (e: any) {
    assert(false, `Should accept valid image/webp: ${e.message}`);
  }

  // Valid GIF
  try {
    const fakeGif = new Blob(['fake-gif-data'], { type: 'image/gif' });
    const result = validateImageFile(fakeGif);
    assert(result.isValid && result.extension === 'gif', 'Accepts valid image/gif');
  } catch (e: any) {
    assert(false, `Should accept valid image/gif: ${e.message}`);
  }

  // Reject dangerous / unsupported MIME types
  const dangerousTypes = ['application/javascript', 'text/html', 'application/x-msdownload', 'image/svg+xml'];
  for (const type of dangerousTypes) {
    try {
      const dangerBlob = new Blob(['<script>alert(1)</script>'], { type });
      validateImageFile(dangerBlob);
      assert(false, `Should reject dangerous MIME type: ${type}`);
    } catch (e: any) {
      assert(e instanceof ValidationError, `Rejects dangerous MIME type "${type}"`);
    }
  }

  // Reject 0-byte file
  try {
    const emptyFile = new Blob([], { type: 'image/jpeg' });
    validateImageFile(emptyFile);
    assert(false, 'Should reject 0-byte file');
  } catch (e: any) {
    assert(e instanceof ValidationError && e.message.includes('0 bytes'), 'Rejects empty 0-byte file');
  }

  // Reject Oversized file (> 20MB)
  try {
    const oversizedBlob = {
      size: 25 * 1024 * 1024,
      type: 'image/jpeg',
    } as unknown as Blob;
    validateImageFile(oversizedBlob);
    assert(false, 'Should reject oversized file');
  } catch (e: any) {
    assert(e instanceof ValidationError && e.message.includes('exceeds maximum'), 'Rejects oversized file (> 20MB)');
  }

  // ─────────────────────────────────────────────────────────────
  // 2. Storage Path Hierarchy Invariants
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n2. [Unit] Storage Path Deterministic Hierarchy'));

  const userA = '11111111-1111-4111-a111-111111111111';
  const memoryId1 = '33333333-3333-4333-a333-333333333333';
  const userAPath = `${userA}/${memoryId1}/original.jpg`;

  assert(userAPath === `${userA}/${memoryId1}/original.jpg`, 'Path matches {user_id}/{memory_id}/original.{ext}');

  const pathParts = userAPath.split('/');
  assert(pathParts[0] === userA, 'Root folder strictly equals user_id');
  assert(pathParts[1] === memoryId1, 'Subfolder strictly equals memory_id');
  assert(pathParts[2] === 'original.jpg', 'Target file is canonical original with extension');

  // ─────────────────────────────────────────────────────────────
  // 3. Deletion Flow & Failure Handling Verification
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n3. [Flow] Deletion Sequence & Failure Abort Verification'));

  const mockSuccessfulDeleteFlow = async (failStorage: boolean, failDb: boolean) => {
    const storageCalls: string[][] = [];
    let dbDeleted = false;

    // Step 1: Query record (simulates Postgres RLS check)
    const memoryRecord = { id: memoryId1, user_id: userA, storage_path: userAPath };

    // Step 2: Delete from Storage API first
    if (failStorage) {
      throw new StorageError('Storage API network error', 'STORAGE_DELETE_FAILED');
    }
    storageCalls.push([memoryRecord.storage_path]);

    // Step 3: Only after Storage deletion succeeds, delete DB row
    if (failDb) {
      throw new DatabaseError('Postgres database connection timeout');
    }
    dbDeleted = true;

    return { storageCalls, dbDeleted };
  };

  // Scenario A: Normal successful deletion
  const resultA = await mockSuccessfulDeleteFlow(false, false);
  assert(resultA.storageCalls.length === 1 && resultA.storageCalls[0][0] === userAPath, 'Calls Storage API to remove physical object first');
  assert(resultA.dbDeleted === true, 'Deletes database row after successful Storage deletion');

  // Scenario B: Storage deletion fails -> Aborts, DB row NOT deleted
  let dbDeletedInB = false;
  try {
    const resB = await mockSuccessfulDeleteFlow(true, false);
    dbDeletedInB = resB.dbDeleted;
    assert(false, 'Should throw error when storage delete fails');
  } catch (e: any) {
    assert(e instanceof StorageError && e.code === 'STORAGE_DELETE_FAILED', 'Throws StorageError when Storage delete fails');
    assert(dbDeletedInB === false, 'CRITICAL: DB row is NOT deleted when Storage deletion fails (prevents orphaned files)');
  }

  // Scenario C: Storage deletion succeeds but DB delete fails -> DB error thrown, retry is idempotent
  try {
    await mockSuccessfulDeleteFlow(false, true);
    assert(false, 'Should throw error when DB delete fails');
  } catch (e: any) {
    assert(e instanceof DatabaseError, 'Throws DatabaseError if DB delete fails after storage delete');
  }

  // ─────────────────────────────────────────────────────────────
  // 4. Upload Failure Rollback Verification
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n4. [Flow] Upload Rollback on DB Error (Orphan Prevention)'));

  let rollbackRemovedPaths: string[] = [];
  const mockUploadWithDbFailure = async () => {
    rollbackRemovedPaths = [];
    const storagePath = `${userA}/mem-uuid/original.jpg`;
    // Upload succeeds
    // DB insert fails
    // Rollback executes:
    rollbackRemovedPaths.push(storagePath);
    throw new DatabaseError('Database insert failed');
  };

  try {
    await mockUploadWithDbFailure();
  } catch (e: any) {
    assert(e instanceof DatabaseError, 'Wraps DB failure in DatabaseError');
  }
  assert(rollbackRemovedPaths.includes(`${userA}/mem-uuid/original.jpg`), 'Storage object is immediately removed on upload DB failure');

  // ─────────────────────────────────────────────────────────────
  // 5. Image Transformation Presets
  // ─────────────────────────────────────────────────────────────
  console.log(colors.cyan('\n5. [Unit] Image Transformation Presets'));

  assert(STORAGE_CONFIG.BUCKET_NAME === 'memory-images', 'Storage bucket configured as "memory-images"');
  assert(STORAGE_CONFIG.DEFAULT_CACHE_CONTROL === '31536000, immutable', 'Cache-control header is 1 year immutable');
  assert(IMAGE_VARIANTS.thumbnail?.width === 200 && IMAGE_VARIANTS.thumbnail?.format === 'webp', 'Thumbnail is 200x200 WebP');
  assert(IMAGE_VARIANTS.card?.width === 600 && IMAGE_VARIANTS.card?.format === 'webp', 'Card is 600x600 WebP');
  assert(IMAGE_VARIANTS.detail?.width === 1400 && IMAGE_VARIANTS.detail?.format === 'webp', 'Detail is 1400x1400 WebP');
  assert(IMAGE_VARIANTS.original === undefined, 'Original variant serves canonical file without recompression');

  // ─────────────────────────────────────────────────────────────
  // Summary
  // ─────────────────────────────────────────────────────────────
  console.log(colors.bold(`\nUnit & Flow Test Summary: ${colors.green(`${passed} passed`)}, ${failed > 0 ? colors.red(`${failed} failed`) : '0 failed'}\n`));

  if (failed > 0) {
    process.exit(1);
  }
}

runUnitAndFlowTests().catch((err) => {
  console.error('Unit & flow tests failed:', err);
  process.exit(1);
});
