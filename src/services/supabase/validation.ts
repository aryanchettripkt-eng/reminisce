import {
  STORAGE_CONFIG,
  MIME_TO_EXTENSION,
  EXTENSION_TO_MIME,
} from './config';
import {
  FileValidationResult,
  ImageDimensions,
  ValidationError,
} from '../../types/storage';

/**
 * Format bytes to a human-readable string (e.g. 15.4 MB)
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Validate an image file or blob before uploading to Supabase Storage
 */
export function validateImageFile(
  file: File | Blob,
  customOptions?: {
    maxSizeBytes?: number;
    allowedMimeTypes?: readonly string[];
    filename?: string;
  }
): FileValidationResult {
  const maxSizeBytes = customOptions?.maxSizeBytes ?? STORAGE_CONFIG.MAX_FILE_SIZE_BYTES;
  const allowedMimeTypes = customOptions?.allowedMimeTypes ?? STORAGE_CONFIG.ALLOWED_MIME_TYPES;

  if (!file) {
    throw new ValidationError('No file provided for upload.');
  }

  const size = file.size;
  let mimeType = file.type?.toLowerCase() || '';
  const originalFilename = (file instanceof File ? file.name : customOptions?.filename) || '';

  // Infer MIME type from filename extension if blob type is empty
  if (!mimeType && originalFilename) {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
    mimeType = EXTENSION_TO_MIME[ext] || '';
  }

  // 1. Check MIME type
  if (!mimeType || !allowedMimeTypes.includes(mimeType as any)) {
    const allowedList = allowedMimeTypes.join(', ');
    throw new ValidationError(
      `Unsupported image format: "${mimeType || 'unknown'}". Allowed formats: ${allowedList}`
    );
  }

  // 2. Check File Size
  if (size > maxSizeBytes) {
    throw new ValidationError(
      `File size (${formatBytes(size)}) exceeds maximum allowed limit of ${formatBytes(maxSizeBytes)}.`
    );
  }

  if (size === 0) {
    throw new ValidationError('The selected file is empty (0 bytes).');
  }

  const extension = MIME_TO_EXTENSION[mimeType] || 'jpg';

  return {
    isValid: true,
    extension,
    mimeType,
    size,
  };
}

/**
 * Validate an audio file or blob before uploading to Supabase Storage
 */
export function validateAudioFile(
  file: File | Blob,
  customOptions?: {
    maxSizeBytes?: number;
    allowedMimeTypes?: readonly string[];
    filename?: string;
  }
): FileValidationResult {
  const maxSizeBytes = customOptions?.maxSizeBytes ?? STORAGE_CONFIG.MAX_FILE_SIZE_BYTES;
  const allowedMimeTypes = customOptions?.allowedMimeTypes ?? STORAGE_CONFIG.ALLOWED_AUDIO_MIME_TYPES;

  if (!file) {
    throw new ValidationError('No audio file provided for upload.');
  }

  const size = file.size;
  let mimeType = file.type?.toLowerCase() || '';
  const originalFilename = (file instanceof File ? file.name : customOptions?.filename) || '';

  // Normalize codecs parameter e.g. audio/webm;codecs=opus -> audio/webm
  if (mimeType.includes(';')) {
    mimeType = mimeType.split(';')[0].trim();
  }

  if (!mimeType && originalFilename) {
    const ext = originalFilename.split('.').pop()?.toLowerCase() || '';
    mimeType = EXTENSION_TO_MIME[ext] || '';
  }

  // Fallback for MediaRecorder output where type might be audio/wav or audio/webm
  if (!mimeType) {
    mimeType = 'audio/wav';
  }

  if (!allowedMimeTypes.includes(mimeType as any)) {
    const allowedList = allowedMimeTypes.join(', ');
    throw new ValidationError(
      `Unsupported audio format: "${mimeType || 'unknown'}". Allowed formats: ${allowedList}`
    );
  }

  if (size > maxSizeBytes) {
    throw new ValidationError(
      `Audio file size (${formatBytes(size)}) exceeds maximum allowed limit of ${formatBytes(maxSizeBytes)}.`
    );
  }

  if (size === 0) {
    throw new ValidationError('The audio recording is empty (0 bytes).');
  }

  const extension = MIME_TO_EXTENSION[mimeType] || 'wav';

  return {
    isValid: true,
    extension,
    mimeType,
    size,
  };
}

/**
 * Read image pixel dimensions (width & height) in browser environment
 */
export async function getImageDimensions(
  file: File | Blob
): Promise<ImageDimensions | null> {
  if (typeof window === 'undefined' || typeof Image === 'undefined') {
    return null;
  }

  return new Promise((resolve) => {
    try {
      const objectUrl = URL.createObjectURL(file);
      const img = new Image();

      img.onload = () => {
        const dimensions = {
          width: img.naturalWidth || img.width,
          height: img.naturalHeight || img.height,
        };
        URL.revokeObjectURL(objectUrl);
        resolve(dimensions);
      };

      img.onerror = () => {
        URL.revokeObjectURL(objectUrl);
        resolve(null);
      };

      img.src = objectUrl;
    } catch {
      resolve(null);
    }
  });
}
