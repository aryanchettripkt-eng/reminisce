import { ImageTransformOptions, ImageVariant } from '../../types/storage';

/**
 * Supabase Storage Configuration for Reminiq
 */

export const STORAGE_CONFIG = {
  // Storage bucket identifier for personal image memories
  BUCKET_NAME: 'memory-images',

  // Configurable Maximum file size limit: 20 MB default
  MAX_FILE_SIZE_BYTES: 20 * 1024 * 1024,

  // Allowed MIME types
  ALLOWED_MIME_TYPES: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
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
};

export const EXTENSION_TO_MIME: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
  gif: 'image/gif',
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
