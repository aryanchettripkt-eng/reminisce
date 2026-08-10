/**
 * Reminiq - Supabase Memory & Image/Audio Storage Types
 */

import { Memory, Album } from '../lib/groq';

export type MemoryType = 'photo' | 'voice' | 'text' | 'music';

export interface MusicTrackData {
  song: string;
  artist: string;
  albumArt?: string;
}

export interface MemoryRecord {
  id: string;
  user_id: string;
  type: MemoryType;
  title: string;
  description: string;
  mood: string;
  location: string | null;
  memory_date: string;
  
  // Image Storage Metadata (Nullable for non-image memories)
  storage_bucket: string | null;
  storage_path: string | null;
  original_filename: string | null;
  mime_type: string | null;
  file_size: number | null;
  width: number | null;
  height: number | null;

  // Audio Storage Metadata (Nullable for non-voice memories)
  audio_storage_bucket: string | null;
  audio_storage_path: string | null;

  // External / AI metadata
  music_url: string | null;
  transcript: string | null;
  emotion: string | null;
  music_track: MusicTrackData | null;
  tags: string[];
  is_favorite: boolean;
  google_photos_media_id?: string | null;
  source?: 'upload' | 'google_photos';

  created_at: string;
  updated_at: string;
}

export type ImageVariant = 'thumbnail' | 'card' | 'detail' | 'original';

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  resize?: 'cover' | 'contain' | 'fill';
  quality?: number; // 1 to 100
  format?: 'origin' | 'webp';
}

export interface SignedUrlOptions {
  expiresIn?: number; // in seconds (default 3600 = 1 hour)
  variant?: ImageVariant;
  transform?: ImageTransformOptions;
}

export interface CreateMemoryInput {
  id?: string;
  type: MemoryType;
  title: string;
  desc?: string;
  mood?: string;
  location?: string;
  date?: string;
  transcript?: string;
  emotion?: string;
  musicUrl?: string;
  music?: MusicTrackData;
  tags?: string[];
  isFavorite?: boolean;
  google_photos_media_id?: string | null;
  source?: 'upload' | 'google_photos';
}

export interface UpdateMemoryInput {
  title?: string;
  desc?: string;
  mood?: string;
  location?: string;
  date?: string;
  transcript?: string;
  emotion?: string;
  musicUrl?: string;
  music?: MusicTrackData;
  tags?: string[];
  isFavorite?: boolean;
  google_photos_media_id?: string | null;
  source?: 'upload' | 'google_photos';
}

export interface ImageUploadResult {
  memory: MemoryRecord;
  signedUrl: string;
  storagePath: string;
}

export interface FileValidationResult {
  isValid: boolean;
  extension: string;
  mimeType: string;
  size: number;
  error?: string;
}

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface GooglePhotosImportResult {
  imported: Memory[];
  duplicates: string[];
  unsupported: string[];
  failed: { id: string; error: string }[];
}

export interface GooglePhotosSessionResponse {
  sessionId: string;
  pickerUri: string;
  pollingConfig?: {
    pollInterval?: string;
    timeoutIn?: string;
  };
}

export interface GooglePhotosPollResponse {
  mediaItemsSet: boolean;
  pollingConfig?: {
    pollInterval?: string;
    timeoutIn?: string;
  };
}

// ─────────────────────────────────────────────────────────────
// Mappers: Database Row <-> React Memory Object
// ─────────────────────────────────────────────────────────────

export function dbRecordToMemory(
  record: MemoryRecord,
  signedPhotoUrl?: string,
  signedAudioUrl?: string
): Memory {
  return {
    id: record.id,
    type: record.type || 'text',
    title: record.title || 'Untitled Moment',
    desc: record.description || '',
    mood: record.mood || 'joy',
    location: record.location || undefined,
    date: record.memory_date || record.created_at,
    photoUrl: signedPhotoUrl || undefined,
    audioUrl: signedAudioUrl || undefined,
    musicUrl: record.music_url || undefined,
    transcript: record.transcript || undefined,
    emotion: record.emotion || undefined,
    music: record.music_track ? {
      song: record.music_track.song,
      artist: record.music_track.artist,
      albumArt: record.music_track.albumArt,
    } : undefined,
  };
}

export function memoryInputToDbPayload(
  input: CreateMemoryInput | UpdateMemoryInput,
  userId: string
): Partial<MemoryRecord> {
  const payload: Partial<MemoryRecord> = {
    user_id: userId,
  };

  if ('type' in input && input.type) payload.type = input.type;
  if (input.title !== undefined) payload.title = input.title;
  if (input.desc !== undefined) payload.description = input.desc;
  if (input.mood !== undefined) payload.mood = input.mood;
  if (input.location !== undefined) payload.location = input.location || null;
  if (input.date !== undefined) payload.memory_date = new Date(input.date).toISOString();
  if (input.transcript !== undefined) payload.transcript = input.transcript || null;
  if (input.emotion !== undefined) payload.emotion = input.emotion || null;
  if (input.musicUrl !== undefined) payload.music_url = input.musicUrl || null;
  if (input.music !== undefined) payload.music_track = input.music || null;
  if (input.tags !== undefined) payload.tags = input.tags;
  if (input.isFavorite !== undefined) payload.is_favorite = input.isFavorite;
  if (input.google_photos_media_id !== undefined) payload.google_photos_media_id = input.google_photos_media_id;
  if (input.source !== undefined) payload.source = input.source;

  return payload;
}

// ─────────────────────────────────────────────────────────────
// Custom Error Hierarchy
// ─────────────────────────────────────────────────────────────

export class StorageError extends Error {
  constructor(message: string, public readonly code: string = 'STORAGE_ERROR', public readonly details?: unknown) {
    super(message);
    this.name = 'StorageError';
  }
}

export class ValidationError extends StorageError {
  constructor(message: string, details?: unknown) {
    super(message, 'VALIDATION_ERROR', details);
    this.name = 'ValidationError';
  }
}

export class AuthenticationRequiredError extends StorageError {
  constructor(message: string = 'Please sign in with Google to save memories.') {
    super(message, 'AUTH_REQUIRED');
    this.name = 'AuthenticationRequiredError';
  }
}

export class UploadFailedError extends StorageError {
  constructor(message: string, details?: unknown) {
    super(message, 'UPLOAD_FAILED', details);
    this.name = 'UploadFailedError';
  }
}

export class DatabaseError extends StorageError {
  constructor(message: string, details?: unknown) {
    super(message, 'DATABASE_ERROR', details);
    this.name = 'DatabaseError';
  }
}

export class MemoryNotFoundError extends StorageError {
  constructor(memoryId: string) {
    super(`Memory with ID "${memoryId}" was not found.`, 'MEMORY_NOT_FOUND');
    this.name = 'MemoryNotFoundError';
  }
}

export class AlbumNotFoundError extends StorageError {
  constructor(albumId: string) {
    super(`Album with ID "${albumId}" was not found.`, 'ALBUM_NOT_FOUND');
    this.name = 'AlbumNotFoundError';
  }
}

// ─────────────────────────────────────────────────────────────
// Album Database & Service Types
// ─────────────────────────────────────────────────────────────

export interface AlbumRecord {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  journal_text: string | null;
  voice_note_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface AlbumMemoryRecord {
  album_id: string;
  memory_id: string;
  position: number;
  created_at: string;
}

export interface CreateAlbumInput {
  id?: string;
  title: string;
  journalText?: string;
  description?: string;
  voiceNoteUrl?: string;
  memoryIds?: string[];
}

export interface UpdateAlbumInput {
  title?: string;
  journalText?: string;
  description?: string;
  voiceNoteUrl?: string;
  memoryIds?: string[];
  linkedMemoryIds?: string[];
}

export interface BatchAlbumResult {
  created: Album[];
  failed: {
    album: Omit<Album, 'id'>;
    error: string;
  }[];
}

export function dbRecordToAlbum(
  record: AlbumRecord,
  memoryIds: string[] = [],
  linkedMemoryIds?: string[]
): Album {
  return {
    id: record.id,
    title: record.title || 'Untitled Album',
    memoryIds: memoryIds,
    journalText: record.journal_text || record.description || undefined,
    linkedMemoryIds: linkedMemoryIds !== undefined ? linkedMemoryIds : memoryIds,
    voiceNoteUrl: record.voice_note_url || undefined,
  };
}

