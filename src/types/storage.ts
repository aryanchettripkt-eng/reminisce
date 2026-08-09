/**
 * Reminiq - Supabase Memory & Image Storage Types
 */

export interface MemoryRecord {
  id: string;
  user_id: string;
  storage_bucket: string;
  storage_path: string;
  original_filename: string | null;
  mime_type: string;
  file_size: number;
  width: number | null;
  height: number | null;
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

export interface UploadMemoryOptions {
  userId?: string;
  memoryId?: string;
  originalFilename?: string;
  expiresIn?: number;
  variant?: ImageVariant;
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
  constructor(message: string = 'User authentication is required to access memory storage.') {
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
