import { getSupabaseClient } from './client';
import { STORAGE_CONFIG, IMAGE_VARIANTS } from './config';
import { validateImageFile, getImageDimensions } from './validation';
import {
  MemoryRecord,
  ImageVariant,
  SignedUrlOptions,
  UploadMemoryOptions,
  ImageUploadResult,
  AuthenticationRequiredError,
  UploadFailedError,
  DatabaseError,
  MemoryNotFoundError,
  StorageError,
  ValidationError,
} from '../../types/storage';

/**
 * Upload an image memory to Supabase Storage and register metadata in Postgres.
 *
 * Security & Failure Handling:
 * 1. Validates MIME type, file size, and extension before upload.
 * 2. Directly uploads from browser to private Supabase Storage bucket.
 * 3. Enforces deterministic path: {user_id}/{memory_id}/original.{extension}
 * 4. Inserts metadata into public.memories table.
 * 5. If database insertion fails, automatically deletes the uploaded Storage object
 *    to prevent orphaned files.
 */
export async function uploadMemoryImage(
  file: File | Blob,
  options?: UploadMemoryOptions
): Promise<ImageUploadResult> {
  const client = getSupabaseClient();

  // 1. Validate file
  const originalFilename = options?.originalFilename || (file instanceof File ? file.name : undefined);
  const validation = validateImageFile(file, { filename: originalFilename });

  // 2. Read dimensions (width/height)
  const dimensions = await getImageDimensions(file);

  // 3. Resolve user_id (from explicit parameter, active Supabase Auth session, or dev auth helper)
  let userId = options?.userId;
  if (!userId) {
    const { data: authData } = await client.auth.getUser();
    if (authData?.user?.id) {
      userId = authData.user.id;
    } else {
      const { ensureAuthenticatedUser } = await import('./devAuth');
      userId = await ensureAuthenticatedUser();
    }
  }

  // 4. Generate deterministic memory UUID and storage path
  const memoryId = options?.memoryId || crypto.randomUUID();
  const storagePath = `${userId}/${memoryId}/original.${validation.extension}`;

  // 5. Upload binary directly to private Supabase Storage bucket
  const { error: uploadError } = await client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .upload(storagePath, file, {
      contentType: validation.mimeType,
      cacheControl: STORAGE_CONFIG.DEFAULT_CACHE_CONTROL,
      upsert: false,
    });

  if (uploadError) {
    throw new UploadFailedError(
      `Failed to upload image to Supabase Storage: ${uploadError.message}`,
      uploadError
    );
  }

  // 6. Insert metadata into Postgres memories table
  try {
    const { data: memoryRecord, error: dbError } = await client
      .from('memories')
      .insert({
        id: memoryId,
        user_id: userId,
        storage_bucket: STORAGE_CONFIG.BUCKET_NAME,
        storage_path: storagePath,
        original_filename: originalFilename || null,
        mime_type: validation.mimeType,
        file_size: validation.size,
        width: dimensions?.width ?? null,
        height: dimensions?.height ?? null,
      })
      .select('*')
      .single();

    if (dbError || !memoryRecord) {
      throw new DatabaseError(
        `Failed to save memory record in database: ${dbError?.message || 'Unknown database error'}`,
        dbError
      );
    }

    // 7. Generate initial signed URL for immediate presentation
    const signedUrl = await getMemorySignedUrl(
      storagePath,
      options?.variant || 'card',
      options?.expiresIn
    );

    return {
      memory: memoryRecord as MemoryRecord,
      signedUrl,
      storagePath,
    };
  } catch (error) {
    // 8. Rollback: delete storage object on database failure to prevent orphans
    console.error('Database insertion failed. Rolling back uploaded storage object:', storagePath);
    await client.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([storagePath])
      .catch((cleanupErr) => {
        console.error('Failed to clean up orphaned storage object during rollback:', cleanupErr);
      });

    if (error instanceof StorageError) {
      throw error;
    }
    throw new DatabaseError(
      `Database error occurred during memory registration: ${(error as any)?.message || error}`,
      error
    );
  }
}

/**
 * Generate a temporary signed URL for viewing a private memory image by storage path.
 * Supports image transformations (e.g. thumbnail, card, detail).
 */
export async function getMemorySignedUrl(
  storagePath: string,
  variantOrOptions?: ImageVariant | SignedUrlOptions,
  explicitExpiresIn?: number
): Promise<string> {
  const client = getSupabaseClient();

  if (!storagePath || typeof storagePath !== 'string') {
    throw new ValidationError('Invalid storage path provided for signed URL generation.');
  }

  let expiresIn = explicitExpiresIn || STORAGE_CONFIG.DEFAULT_SIGNED_URL_EXPIRY_SECONDS;
  let transform: any = undefined;

  if (typeof variantOrOptions === 'string') {
    transform = IMAGE_VARIANTS[variantOrOptions];
  } else if (variantOrOptions && typeof variantOrOptions === 'object') {
    if (variantOrOptions.expiresIn) {
      expiresIn = variantOrOptions.expiresIn;
    }
    if (variantOrOptions.transform) {
      transform = variantOrOptions.transform;
    } else if (variantOrOptions.variant) {
      transform = IMAGE_VARIANTS[variantOrOptions.variant];
    }
  }

  const { data, error } = await client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn, transform ? { transform } : undefined);

  if (error || !data?.signedUrl) {
    throw new StorageError(
      `Failed to generate signed URL for image at "${storagePath}": ${error?.message || 'Unknown error'}`,
      'SIGNED_URL_FAILED',
      error
    );
  }

  return data.signedUrl;
}

/**
 * Generate a signed URL for a memory by its Database Memory ID.
 * First verifies ownership via Postgres RLS before requesting the signed URL from Storage.
 */
export async function getMemorySignedUrlById(
  memoryId: string,
  variantOrOptions?: ImageVariant | SignedUrlOptions,
  expiresIn?: number
): Promise<string> {
  // 1. Verify memory exists and user owns it via Postgres RLS
  const memory = await getMemory(memoryId);

  // 2. Generate signed URL
  return getMemorySignedUrl(memory.storage_path, variantOrOptions, expiresIn);
}

/**
 * Batch generate signed URLs for multiple storage paths.
 */
export async function batchGetMemorySignedUrls(
  storagePaths: string[],
  expiresIn = STORAGE_CONFIG.DEFAULT_SIGNED_URL_EXPIRY_SECONDS
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {};

  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .createSignedUrls(storagePaths, expiresIn);

  if (error || !data) {
    throw new StorageError(
      `Failed to generate batch signed URLs: ${error?.message || 'Unknown error'}`,
      'BATCH_SIGNED_URL_FAILED',
      error
    );
  }

  const urlMap: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap[item.path] = item.signedUrl;
    }
  }

  return urlMap;
}

/**
 * Retrieve a memory record by its ID from Postgres.
 * Enforces ownership via Postgres Row-Level Security.
 */
export async function getMemory(memoryId: string): Promise<MemoryRecord> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('memories')
    .select('*')
    .eq('id', memoryId)
    .single();

  if (error || !data) {
    throw new MemoryNotFoundError(memoryId);
  }

  return data as MemoryRecord;
}

/**
 * List all memories for the authenticated user (or specified userId) ordered by created_at DESC.
 */
export async function listUserMemories(options?: {
  userId?: string;
  limit?: number;
  offset?: number;
}): Promise<MemoryRecord[]> {
  const client = getSupabaseClient();
  let query = client
    .from('memories')
    .select('*')
    .order('created_at', { ascending: false });

  if (options?.userId) {
    query = query.eq('user_id', options.userId);
  }

  if (options?.limit) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }

  const { data, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch memories: ${error.message}`, error);
  }

  return (data || []) as MemoryRecord[];
}

/**
 * Delete a memory following the safe sequence:
 * 1. Verify memory ownership and fetch storage_path through Postgres RLS.
 * 2. Delete the physical Storage object via Supabase Storage API:
 *    supabase.storage.from('memory-images').remove([storage_path])
 * 3. Only after successful Storage deletion, delete the memories database row.
 *
 * If Storage deletion fails:
 * - Does NOT delete the database row.
 * - Throws a StorageError.
 *
 * Idempotency:
 * - If Storage deletion succeeds but DB delete fails, retrying deleteMemory() will
 *   safely delete the DB row without error (Supabase storage remove is idempotent).
 */
export async function deleteMemory(
  memoryId: string
): Promise<{ success: boolean }> {
  const client = getSupabaseClient();

  // 1. Verify ownership and existence through Postgres RLS (throws MemoryNotFoundError if unauthorized)
  const memory = await getMemory(memoryId);
  const storagePath = memory.storage_path;

  // 2. Delete physical storage object using Supabase Storage API
  const { error: storageError } = await client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .remove([storagePath]);

  if (storageError) {
    // ABORT: Do NOT delete the database row if Storage deletion fails
    throw new StorageError(
      `Failed to delete image object from Supabase Storage: ${storageError.message}`,
      'STORAGE_DELETE_FAILED',
      storageError
    );
  }

  // 3. Only after successful Storage deletion, delete the database row
  const { error: dbError } = await client
    .from('memories')
    .delete()
    .eq('id', memoryId);

  if (dbError) {
    throw new DatabaseError(
      `Image deleted from storage, but failed to delete memory record from database: ${dbError.message}`,
      dbError
    );
  }

  return { success: true };
}
