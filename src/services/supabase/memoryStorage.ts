import { getSupabaseClient } from './client';
import { STORAGE_CONFIG, IMAGE_VARIANTS } from './config';
import { validateImageFile, validateAudioFile, getImageDimensions } from './validation';
import {
  MemoryRecord,
  ImageVariant,
  SignedUrlOptions,
  CreateMemoryInput,
  UpdateMemoryInput,
  ImageUploadResult,
  AuthenticationRequiredError,
  UploadFailedError,
  DatabaseError,
  MemoryNotFoundError,
  StorageError,
  ValidationError,
  dbRecordToMemory,
  memoryInputToDbPayload,
} from '../../types/storage';
import { Memory } from '../../lib/groq';

/**
 * Reminiq - Supabase Persistent Memory & Storage Service
 *
 * Implements complete CRUD for memories (photo, voice, text, music) in PostgreSQL
 * and binary storage across 'memory-images' and 'memory-audio' private buckets.
 */

export interface CreateMemoryOptions {
  imageFile?: File | Blob;
  audioFile?: File | Blob;
  originalFilename?: string;
  expiresIn?: number;
  variant?: ImageVariant;
}

/**
 * Create and persist a new Memory in Supabase (PostgreSQL & Storage).
 * Supports text stories, photos (with binary upload to memory-images),
 * voice memos (with binary upload to memory-audio), and music memories.
 *
 * Atomic Rollback: If database insertion fails, any uploaded binary objects
 * are automatically deleted from Storage to prevent orphaned files.
 */
export async function createMemory(
  input: CreateMemoryInput,
  options?: CreateMemoryOptions
): Promise<{ memory: Memory; record: MemoryRecord }> {
  const client = getSupabaseClient();

  // 1. Strictly resolve authenticated user from Supabase session
  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google to save memories.');
  }

  const memoryId = input.id || crypto.randomUUID();
  let imageStoragePath: string | null = null;
  let imageVal: ReturnType<typeof validateImageFile> | null = null;
  let imageDimensions: { width: number; height: number } | null = null;
  let audioStoragePath: string | null = null;
  let audioVal: ReturnType<typeof validateAudioFile> | null = null;

  // 2. Upload Image Binary if provided (Photo Memory)
  if (options?.imageFile) {
    const originalFilename = options.originalFilename || (options.imageFile instanceof File ? options.imageFile.name : undefined);
    imageVal = validateImageFile(options.imageFile, { filename: originalFilename });
    imageDimensions = await getImageDimensions(options.imageFile);
    imageStoragePath = `${userId}/${memoryId}/original.${imageVal.extension}`;

    const { error: uploadError } = await client.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .upload(imageStoragePath, options.imageFile, {
        contentType: imageVal.mimeType,
        cacheControl: STORAGE_CONFIG.DEFAULT_CACHE_CONTROL,
        upsert: false,
      });

    if (uploadError) {
      throw new UploadFailedError(
        `Failed to upload image to Supabase Storage: ${uploadError.message}`,
        uploadError
      );
    }
  }

  // 3. Upload Audio Binary if provided (Voice Memory)
  if (options?.audioFile) {
    audioVal = validateAudioFile(options.audioFile);
    audioStoragePath = `${userId}/${memoryId}/original.${audioVal.extension}`;

    const { error: audioUploadError } = await client.storage
      .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
      .upload(audioStoragePath, options.audioFile, {
        contentType: audioVal.mimeType,
        cacheControl: STORAGE_CONFIG.DEFAULT_CACHE_CONTROL,
        upsert: false,
      });

    if (audioUploadError) {
      // Rollback image if image was uploaded before audio failed
      if (imageStoragePath) {
        await client.storage.from(STORAGE_CONFIG.BUCKET_NAME).remove([imageStoragePath]).catch(() => {});
      }
      throw new UploadFailedError(
        `Failed to upload audio to Supabase Storage: ${audioUploadError.message}`,
        audioUploadError
      );
    }
  }

  // 4. Insert complete record into Postgres public.memories table
  try {
    const originalFilename = options?.originalFilename || (options?.imageFile instanceof File ? options.imageFile.name : null);
    const dateToUse = input.date ? new Date(input.date).toISOString() : new Date().toISOString();

    const { data: memoryRecord, error: dbError } = await client
      .from('memories')
      .insert({
        id: memoryId,
        user_id: userId,
        type: input.type,
        title: input.title || 'Untitled Moment',
        description: input.desc || '',
        mood: input.mood || 'joy',
        location: input.location || null,
        memory_date: dateToUse,
        
        // Image metadata
        storage_bucket: imageStoragePath ? STORAGE_CONFIG.BUCKET_NAME : null,
        storage_path: imageStoragePath,
        original_filename: originalFilename,
        mime_type: imageVal?.mimeType || null,
        file_size: imageVal?.size || null,
        width: imageDimensions?.width ?? null,
        height: imageDimensions?.height ?? null,

        // Audio metadata
        audio_storage_bucket: audioStoragePath ? STORAGE_CONFIG.AUDIO_BUCKET_NAME : null,
        audio_storage_path: audioStoragePath,

        // External / Music / AI metadata
        music_url: input.musicUrl || null,
        transcript: input.transcript || null,
        emotion: input.emotion || null,
        music_track: input.music || null,
        tags: input.tags || [],
        is_favorite: input.isFavorite ?? false,
      })
      .select('*')
      .single();

    if (dbError || !memoryRecord) {
      throw new DatabaseError(
        `Failed to save memory in database: ${dbError?.message || 'Unknown database error'}`,
        dbError
      );
    }

    // 5. Generate initial signed URLs for immediate UI presentation
    let signedPhotoUrl: string | undefined = undefined;
    if (imageStoragePath) {
      signedPhotoUrl = await getMemorySignedUrl(imageStoragePath, options?.variant || 'card', options?.expiresIn);
    }

    let signedAudioUrl: string | undefined = undefined;
    if (audioStoragePath) {
      signedAudioUrl = await getAudioSignedUrl(audioStoragePath, options?.expiresIn);
    }

    const mappedMemory = dbRecordToMemory(memoryRecord as MemoryRecord, signedPhotoUrl, signedAudioUrl);

    return {
      memory: mappedMemory,
      record: memoryRecord as MemoryRecord,
    };
  } catch (error) {
    // 6. Rollback: delete storage binaries on database failure to prevent orphans
    console.error('Database insertion failed. Rolling back uploaded binaries.');
    if (imageStoragePath) {
      await client.storage.from(STORAGE_CONFIG.BUCKET_NAME).remove([imageStoragePath]).catch(() => {});
    }
    if (audioStoragePath) {
      await client.storage.from(STORAGE_CONFIG.AUDIO_BUCKET_NAME).remove([audioStoragePath]).catch(() => {});
    }

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
 * Legacy alias for image-only memory upload
 */
export async function uploadMemoryImage(
  file: File | Blob,
  options?: {
    userId?: string;
    memoryId?: string;
    originalFilename?: string;
    expiresIn?: number;
    variant?: ImageVariant;
  }
): Promise<ImageUploadResult> {
  const result = await createMemory(
    {
      id: options?.memoryId,
      type: 'photo',
      title: options?.originalFilename || 'Photo Memory',
    },
    {
      imageFile: file,
      originalFilename: options?.originalFilename,
      expiresIn: options?.expiresIn,
      variant: options?.variant,
    }
  );

  return {
    memory: result.record,
    signedUrl: result.memory.photoUrl || '',
    storagePath: result.record.storage_path || '',
  };
}

/**
 * List all memories for the authenticated user ordered by memory_date DESC.
 * Resolves ownership strictly from auth.uid() without taking arbitrary client userId.
 * Automatically batch-generates signed URLs for photos and voice recordings.
 */
export async function listUserMemories(options?: {
  limit?: number;
  offset?: number;
}): Promise<Memory[]> {
  const client = getSupabaseClient();

  const { data: authData } = await client.auth.getUser();
  if (!authData?.user) {
    return [];
  }

  let query = client
    .from('memories')
    .select('*')
    .order('memory_date', { ascending: false });

  if (options?.limit) {
    const from = options.offset || 0;
    const to = from + options.limit - 1;
    query = query.range(from, to);
  }

  const { data: records, error } = await query;

  if (error) {
    throw new DatabaseError(`Failed to fetch memories: ${error.message}`, error);
  }

  if (!records || records.length === 0) {
    return [];
  }

  const typedRecords = records as MemoryRecord[];

  // 1. Collect storage paths for batch signed URLs
  const imagePaths = typedRecords
    .map((r) => r.storage_path)
    .filter((p): p is string => Boolean(p));

  const audioPaths = typedRecords
    .map((r) => r.audio_storage_path)
    .filter((p): p is string => Boolean(p));

  // 2. Batch resolve signed URLs
  const [signedImageMap, signedAudioMap] = await Promise.all([
    imagePaths.length > 0 ? batchGetMemorySignedUrls(imagePaths) : Promise.resolve({}),
    audioPaths.length > 0 ? batchGetAudioSignedUrls(audioPaths) : Promise.resolve({}),
  ]);

  // 3. Map database rows to frontend Memory interfaces
  return typedRecords.map((r) => {
    const photoUrl = r.storage_path ? signedImageMap[r.storage_path] : undefined;
    const audioUrl = r.audio_storage_path ? signedAudioMap[r.audio_storage_path] : undefined;
    return dbRecordToMemory(r, photoUrl, audioUrl);
  });
}

/**
 * Retrieve a single memory by ID from Postgres and resolve signed URLs.
 * Enforces ownership via Postgres Row-Level Security.
 */
export async function getMemory(memoryId: string): Promise<Memory> {
  const client = getSupabaseClient();
  const { data, error } = await client
    .from('memories')
    .select('*')
    .eq('id', memoryId)
    .single();

  if (error || !data) {
    throw new MemoryNotFoundError(memoryId);
  }

  const record = data as MemoryRecord;
  let signedPhotoUrl: string | undefined = undefined;
  let signedAudioUrl: string | undefined = undefined;

  if (record.storage_path) {
    signedPhotoUrl = await getMemorySignedUrl(record.storage_path, 'detail').catch(() => undefined);
  }
  if (record.audio_storage_path) {
    signedAudioUrl = await getAudioSignedUrl(record.audio_storage_path).catch(() => undefined);
  }

  return dbRecordToMemory(record, signedPhotoUrl, signedAudioUrl);
}

/**
 * Update memory fields in PostgreSQL enforcing auth.uid() ownership via RLS.
 */
export async function updateMemory(
  memoryId: string,
  updates: UpdateMemoryInput
): Promise<Memory> {
  const client = getSupabaseClient();
  const { data: authData } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (!userId) {
    throw new AuthenticationRequiredError('Please sign in to update memories.');
  }

  const payload = memoryInputToDbPayload(updates, userId);
  delete payload.user_id; // user_id cannot be changed

  const { data, error } = await client
    .from('memories')
    .update(payload)
    .eq('id', memoryId)
    .select('*')
    .single();

  if (error || !data) {
    throw new DatabaseError(`Failed to update memory "${memoryId}": ${error?.message || 'Not found'}`, error);
  }

  return getMemory(memoryId);
}

/**
 * Delete a memory following the safe multi-bucket sequence:
 * 1. Verify memory ownership and inspect storage paths through Postgres RLS.
 * 2. Delete physical image object from 'memory-images' via Storage API (if present).
 * 3. Delete physical audio object from 'memory-audio' via Storage API (if present).
 * 4. Only after Storage deletions succeed, delete the database row from public.memories.
 *
 * If Storage deletion fails:
 * - Does NOT delete the database row.
 * - Throws a StorageError.
 */
export async function deleteMemory(
  memoryId: string
): Promise<{ success: boolean }> {
  const client = getSupabaseClient();

  // 1. Verify existence and retrieve storage paths via Postgres RLS
  const { data, error: fetchErr } = await client
    .from('memories')
    .select('id, storage_path, audio_storage_path')
    .eq('id', memoryId)
    .single();

  if (fetchErr || !data) {
    throw new MemoryNotFoundError(memoryId);
  }

  const record = data as { id: string; storage_path: string | null; audio_storage_path: string | null };

  // 2. Delete image from 'memory-images' if present
  if (record.storage_path) {
    const { error: imageErr } = await client.storage
      .from(STORAGE_CONFIG.BUCKET_NAME)
      .remove([record.storage_path]);

    if (imageErr) {
      throw new StorageError(
        `Failed to delete image from Supabase Storage: ${imageErr.message}`,
        'STORAGE_DELETE_FAILED',
        imageErr
      );
    }
  }

  // 3. Delete audio from 'memory-audio' if present
  if (record.audio_storage_path) {
    const { error: audioErr } = await client.storage
      .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
      .remove([record.audio_storage_path]);

    if (audioErr) {
      throw new StorageError(
        `Failed to delete audio from Supabase Storage: ${audioErr.message}`,
        'AUDIO_DELETE_FAILED',
        audioErr
      );
    }
  }

  // 4. Delete database row only after Storage cleanup succeeds
  const { error: dbError } = await client
    .from('memories')
    .delete()
    .eq('id', memoryId);

  if (dbError) {
    throw new DatabaseError(
      `Files deleted from storage, but failed to delete database row: ${dbError.message}`,
      dbError
    );
  }

  return { success: true };
}

// ─────────────────────────────────────────────────────────────
// Signed URL Generation Utilities
// ─────────────────────────────────────────────────────────────

/**
 * Generate a temporary signed URL for viewing an image in 'memory-images'.
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
 * Generate a temporary signed URL for playing audio in 'memory-audio'.
 */
export async function getAudioSignedUrl(
  storagePath: string,
  expiresIn: number = STORAGE_CONFIG.DEFAULT_SIGNED_URL_EXPIRY_SECONDS
): Promise<string> {
  const client = getSupabaseClient();

  if (!storagePath || typeof storagePath !== 'string') {
    throw new ValidationError('Invalid audio storage path provided.');
  }

  const { data, error } = await client.storage
    .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
    .createSignedUrl(storagePath, expiresIn);

  if (error || !data?.signedUrl) {
    throw new StorageError(
      `Failed to generate signed URL for audio at "${storagePath}": ${error?.message || 'Unknown error'}`,
      'AUDIO_SIGNED_URL_FAILED',
      error
    );
  }

  return data.signedUrl;
}

/**
 * Batch generate signed URLs for multiple image storage paths.
 */
export async function batchGetMemorySignedUrls(
  storagePaths: string[],
  expiresIn: number = STORAGE_CONFIG.DEFAULT_SIGNED_URL_EXPIRY_SECONDS
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {};

  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(STORAGE_CONFIG.BUCKET_NAME)
    .createSignedUrls(storagePaths, expiresIn);

  if (error || !data) {
    return {};
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
 * Batch generate signed URLs for multiple audio storage paths.
 */
export async function batchGetAudioSignedUrls(
  storagePaths: string[],
  expiresIn: number = STORAGE_CONFIG.DEFAULT_SIGNED_URL_EXPIRY_SECONDS
): Promise<Record<string, string>> {
  if (storagePaths.length === 0) return {};

  const client = getSupabaseClient();
  const { data, error } = await client.storage
    .from(STORAGE_CONFIG.AUDIO_BUCKET_NAME)
    .createSignedUrls(storagePaths, expiresIn);

  if (error || !data) {
    return {};
  }

  const urlMap: Record<string, string> = {};
  for (const item of data) {
    if (item.signedUrl && item.path) {
      urlMap[item.path] = item.signedUrl;
    }
  }

  return urlMap;
}
