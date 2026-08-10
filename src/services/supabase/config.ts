import { ImageTransformOptions, ImageVariant } from '../../types/storage';

/**
 * Supabase Storage Configuration for Reminiq
 */

export const STORAGE_CONFIG = {
  // Storage bucket identifier for personal image memories
  BUCKET_NAME: 'memory-images',

  // Storage bucket identifier for personal audio memories
  AUDIO_BUCKET_NAME: 'memory-audio',

  // Configurable Maximum file size limit: 20 MB default
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,

  // Allowed Image MIME types
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,

  // Allowed Audio MIME types
  ALLOWED_AUDIO_MIME_TYPES: [
    'audio/wav',
    'audio/webm',
    'audio/mpeg',
    'audio/ogg',
    'audio/mp4',
    'audio/x-m4a',
    'audio/aac',
  ] as const,

  // Default signed URL validity duration in seconds (1 hour)
  DEFAULT_SIGNED_URL_EXPIRY_SECONDS: 3600,

  // Immutable Cache-Control header (1 year, immutable)
  DEFAULT_CACHE_CONTROL: '31536000, immutable',
} as const;

export const MIME_TO_EXTENSION: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/gif': 'gif',
  'audio/wav': 'wav',
  'audio/webm': 'webm',
  'audio/mpeg': 'mp3',
  'audio/ogg': 'ogg',
  'audio/mp4': 'm4a',
  'audio/x-m4a': 'm4a',
  'audio/aac': 'aac',
};

export const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
  wav: 'audio/wav',
  webm: 'audio/webm',
  mp3: 'audio/mpeg',
  ogg: 'audio/ogg',
  m4a: 'audio/mp4',
  aac: 'audio/aac',
};

/**
 * Standard Image Transformation Presets
 * Reduces bandwidth and improves rendering speeds on card/grid/thumbnail views
 */
export const IMAGE_VARIANTS: Record<ImageVariant, ImageTransformOptions | undefined> = {
  thumbnail: {
    width: 200,
    height: 200,
    resize: 'cover',
    quality: 80,
    format: 'webp',
  },
  card: {
    width: 600,
    height: 600,
    resize: 'cover',
    quality: 82,
    format: 'webp',
  },
  detail: {
    width: 1400,
    height: 1400,
    resize: 'contain',
    quality: 88,
    format: 'webp',
  },
  original: undefined, // Serve original full resolution without transform
};
