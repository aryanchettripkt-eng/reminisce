import { getSupabaseClient } from './client';
import { getMemorySignedUrl, getAudioSignedUrl } from './memoryStorage';
import {
  AlbumRecord,
  AlbumMemoryRecord,
  CreateAlbumInput,
  UpdateAlbumInput,
  BatchAlbumResult,
  AuthenticationRequiredError,
  DatabaseError,
  AlbumNotFoundError,
  dbRecordToAlbum,
  dbRecordToMemory,
  MemoryRecord,
} from '../../types/storage';
import { Album, Memory } from '../../lib/groq';

/**
 * Reminiq - Supabase Persistent Album & Album-Memories Service
 *
 * Implements complete CRUD and many-to-many relationship management for albums.
 * All operations enforce user ownership through Supabase Auth sessions and Postgres RLS.
 */

/**
 * Creates and persists a new album in Supabase.
 * Optionally associates an initial list of memory IDs.
 */
export async function createAlbum(
  input: CreateAlbumInput,
  memoryIds?: string[]
): Promise<Album> {
  const client = getSupabaseClient();

  // 1. Resolve authenticated user from session
  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google to create albums.');
  }

  const albumId = input.id || crypto.randomUUID();
  const title = input.title?.trim() || 'Untitled Album';
  const journalText = input.journalText || input.description || '';
  const voiceNoteUrl = input.voiceNoteUrl || null;

  // 2. Insert album record into public.albums
  const { data: albumRecord, error: albumError } = await client
    .from('albums')
    .insert({
      id: albumId,
      user_id: userId,
      title,
      description: journalText,
      journal_text: journalText,
      voice_note_url: voiceNoteUrl,
    })
    .select()
    .single();

  if (albumError || !albumRecord) {
    throw new DatabaseError(
      `Failed to create album: ${albumError?.message || 'Unknown database error'}`,
      albumError
    );
  }

  // 3. Associate initial memories if provided
  const targetMemoryIds = memoryIds || input.memoryIds || [];
  const validMemoryIds: string[] = [];

  if (targetMemoryIds.length > 0) {
    // Deduplicate memory IDs
    const uniqueIds = Array.from(new Set(targetMemoryIds));
    const junctionRows = uniqueIds.map((memId, idx) => ({
      album_id: albumId,
      memory_id: memId,
      position: idx,
    }));

    const { error: junctionError } = await client
      .from('album_memories')
      .insert(junctionRows);

    if (junctionError) {
      // If junction insertion fails (e.g. invalid memory or RLS failure),
      // roll back the created album to maintain atomic integrity
      await client.from('albums').delete().eq('id', albumId);
      throw new DatabaseError(
        `Failed to link memories to album: ${junctionError.message}`,
        junctionError
      );
    }

    validMemoryIds.push(...uniqueIds);
  }

  return dbRecordToAlbum(albumRecord as AlbumRecord, validMemoryIds);
}

/**
 * Batch creates multiple albums (e.g. from AI album generation).
 * Returns clear per-album success and failure details without swallowing errors.
 */
export async function createAlbumsBatch(
  albums: Omit<Album, 'id'>[]
): Promise<BatchAlbumResult> {
  const created: Album[] = [];
  const failed: { album: Omit<Album, 'id'>; error: string }[] = [];

  for (const albumInput of albums) {
    try {
      const persisted = await createAlbum(
        {
          title: albumInput.title,
          journalText: albumInput.journalText,
          voiceNoteUrl: albumInput.voiceNoteUrl,
        },
        albumInput.memoryIds
      );
      created.push(persisted);
    } catch (err: any) {
      failed.push({
        album: albumInput,
        error: err.message || 'Failed to create album in batch.',
      });
    }
  }

  return { created, failed };
}

/**
 * Lists all albums belonging to the authenticated user.
 * Populates each album with its ordered list of associated memory IDs.
 */
export async function listUserAlbums(): Promise<Album[]> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    return [];
  }

  // 1. Fetch user's albums
  const { data: albumsData, error: albumsError } = await client
    .from('albums')
    .select('*')
    .order('created_at', { ascending: false });

  if (albumsError) {
    throw new DatabaseError(`Failed to fetch albums: ${albumsError.message}`, albumsError);
  }

  if (!albumsData || albumsData.length === 0) {
    return [];
  }

  const albumIds = albumsData.map((a) => a.id);

  // 2. Fetch all album-memory relationships for these albums
  const { data: relationsData, error: relationsError } = await client
    .from('album_memories')
    .select('album_id, memory_id, position, created_at')
    .in('album_id', albumIds)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (relationsError) {
    throw new DatabaseError(
      `Failed to fetch album relationships: ${relationsError.message}`,
      relationsError
    );
  }

  // 3. Map memory IDs to their respective albums
  const albumMemoriesMap: Record<string, string[]> = {};
  for (const aId of albumIds) {
    albumMemoriesMap[aId] = [];
  }

  if (relationsData) {
    for (const rel of relationsData as AlbumMemoryRecord[]) {
      if (albumMemoriesMap[rel.album_id]) {
        albumMemoriesMap[rel.album_id].push(rel.memory_id);
      }
    }
  }

  return albumsData.map((record) =>
    dbRecordToAlbum(record as AlbumRecord, albumMemoriesMap[record.id] || [])
  );
}

/**
 * Retrieves a single album by ID along with its associated memory IDs.
 */
export async function getAlbum(albumId: string): Promise<Album> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google to view albums.');
  }

  const { data: albumRecord, error: albumError } = await client
    .from('albums')
    .select('*')
    .eq('id', albumId)
    .single();

  if (albumError || !albumRecord) {
    throw new AlbumNotFoundError(albumId);
  }

  // Fetch memory relationships
  const { data: relationsData, error: relationsError } = await client
    .from('album_memories')
    .select('memory_id, position, created_at')
    .eq('album_id', albumId)
    .order('position', { ascending: true })
    .order('created_at', { ascending: true });

  if (relationsError) {
    throw new DatabaseError(
      `Failed to fetch album memories: ${relationsError.message}`,
      relationsError
    );
  }

  const memoryIds = (relationsData || []).map((r) => r.memory_id);
  return dbRecordToAlbum(albumRecord as AlbumRecord, memoryIds);
}

/**
 * Updates an album's metadata (title, journal text, voice note) and/or its memory list.
 */
export async function updateAlbum(
  albumId: string,
  input: UpdateAlbumInput
): Promise<Album> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google to update albums.');
  }

  // 1. Update album record if metadata fields are provided
  const updatePayload: Partial<AlbumRecord> = {};
  if (input.title !== undefined) updatePayload.title = input.title.trim() || 'Untitled Album';
  if (input.journalText !== undefined) {
    updatePayload.journal_text = input.journalText;
    updatePayload.description = input.journalText;
  } else if (input.description !== undefined) {
    updatePayload.description = input.description;
    updatePayload.journal_text = input.description;
  }
  if (input.voiceNoteUrl !== undefined) updatePayload.voice_note_url = input.voiceNoteUrl || null;

  if (Object.keys(updatePayload).length > 0) {
    const { error: updateError } = await client
      .from('albums')
      .update(updatePayload)
      .eq('id', albumId);

    if (updateError) {
      throw new DatabaseError(`Failed to update album: ${updateError.message}`, updateError);
    }
  }

  // 2. Update memory associations if memoryIds provided
  if (input.memoryIds !== undefined) {
    const desiredMemoryIds = Array.from(new Set(input.memoryIds));

    // Get current relationships
    const { data: currentRels, error: relsError } = await client
      .from('album_memories')
      .select('memory_id')
      .eq('album_id', albumId);

    if (relsError) {
      throw new DatabaseError(
        `Failed to read album memories during update: ${relsError.message}`,
        relsError
      );
    }

    const currentIds = (currentRels || []).map((r) => r.memory_id);
    const toRemove = currentIds.filter((id) => !desiredMemoryIds.includes(id));
    const toAdd = desiredMemoryIds.filter((id) => !currentIds.includes(id));

    if (toRemove.length > 0) {
      const { error: deleteError } = await client
        .from('album_memories')
        .delete()
        .eq('album_id', albumId)
        .in('memory_id', toRemove);

      if (deleteError) {
        throw new DatabaseError(
          `Failed to remove memories from album: ${deleteError.message}`,
          deleteError
        );
      }
    }

    if (toAdd.length > 0) {
      const newRows = toAdd.map((memId, idx) => ({
        album_id: albumId,
        memory_id: memId,
        position: currentIds.length + idx,
      }));

      const { error: insertError } = await client
        .from('album_memories')
        .insert(newRows);

      if (insertError) {
        throw new DatabaseError(
          `Failed to add memories to album: ${insertError.message}`,
          insertError
        );
      }
    }
  }

  return getAlbum(albumId);
}

/**
 * Deletes an album.
 * Cascades to delete album_memories relationships, leaving underlying memories and files intact.
 */
export async function deleteAlbum(albumId: string): Promise<void> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google to delete albums.');
  }

  const { error } = await client.from('albums').delete().eq('id', albumId);

  if (error) {
    throw new DatabaseError(`Failed to delete album: ${error.message}`, error);
  }
}

/**
 * Adds a single memory to an album.
 * Enforces RLS: user must own both the album and the memory.
 */
export async function addMemoryToAlbum(
  albumId: string,
  memoryId: string,
  position?: number
): Promise<void> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google.');
  }

  const pos = position ?? 0;

  const { error } = await client.from('album_memories').upsert(
    {
      album_id: albumId,
      memory_id: memoryId,
      position: pos,
    },
    {
      onConflict: 'album_id,memory_id',
      ignoreDuplicates: true,
    }
  );

  if (error) {
    throw new DatabaseError(`Failed to add memory to album: ${error.message}`, error);
  }
}

/**
 * Removes a memory from an album.
 * Deletes only the album_memories relationship row. The underlying memory and media remain intact.
 */
export async function removeMemoryFromAlbum(
  albumId: string,
  memoryId: string
): Promise<void> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google.');
  }

  const { error } = await client
    .from('album_memories')
    .delete()
    .eq('album_id', albumId)
    .eq('memory_id', memoryId);

  if (error) {
    throw new DatabaseError(`Failed to remove memory from album: ${error.message}`, error);
  }
}

/**
 * Retrieves full Memory objects for an album in position order,
 * with signed URLs for image and audio media.
 */
export async function getAlbumMemories(albumId: string): Promise<Memory[]> {
  const client = getSupabaseClient();

  const { data: authData, error: authError } = await client.auth.getUser();
  const userId = authData?.user?.id;

  if (authError || !userId) {
    throw new AuthenticationRequiredError('Please sign in with Google.');
  }

  // 1. Fetch relations in position order
  const { data: relations, error: relError } = await client
    .from('album_memories')
    .select('memory_id, position')
    .eq('album_id', albumId)
    .order('position', { ascending: true });

  if (relError) {
    throw new DatabaseError(`Failed to fetch album memories: ${relError.message}`, relError);
  }

  if (!relations || relations.length === 0) {
    return [];
  }

  const memoryIds = relations.map((r) => r.memory_id);

  // 2. Fetch memory records
  const { data: memoryRecords, error: memError } = await client
    .from('memories')
    .select('*')
    .in('id', memoryIds);

  if (memError) {
    throw new DatabaseError(`Failed to fetch memories: ${memError.message}`, memError);
  }

  if (!memoryRecords || memoryRecords.length === 0) {
    return [];
  }

  // 3. Generate signed URLs and map to Memory objects
  const recordsMap = new Map<string, MemoryRecord>();
  for (const rec of memoryRecords as MemoryRecord[]) {
    recordsMap.set(rec.id, rec);
  }

  const result: Memory[] = [];

  for (const mId of memoryIds) {
    const rec = recordsMap.get(mId);
    if (!rec) continue;

    let signedPhotoUrl: string | undefined;
    let signedAudioUrl: string | undefined;

    if (rec.storage_path) {
      try {
        signedPhotoUrl = await getMemorySignedUrl(rec.storage_path, { variant: 'card' });
      } catch (e) {
        console.warn(`Failed to sign image for memory ${rec.id}:`, e);
      }
    }

    if (rec.audio_storage_path) {
      try {
        signedAudioUrl = await getAudioSignedUrl(rec.audio_storage_path);
      } catch (e) {
        console.warn(`Failed to sign audio for memory ${rec.id}:`, e);
      }
    }

    result.push(dbRecordToMemory(rec, signedPhotoUrl, signedAudioUrl));
  }

  return result;
}
