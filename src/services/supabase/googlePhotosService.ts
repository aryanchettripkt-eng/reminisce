import { getSupabaseClient } from './client';
import {
  GooglePhotosSessionResponse,
  GooglePhotosPollResponse,
  GooglePhotosImportResult,
  AuthenticationRequiredError,
} from '../../types/storage';

/**
 * Reminiq - Google Photos Picker Client Service
 *
 * Facilitates initiating the Google Photos Picker session, polling with Google's
 * recommended config, and importing selected photos directly into Reminiq's private Supabase storage.
 */

async function getAuthHeader(): Promise<{ Authorization: string }> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  const token = data?.session?.access_token;

  if (error || !token) {
    throw new AuthenticationRequiredError('Please sign in to Reminiq to import photos.');
  }

  return { Authorization: `Bearer ${token}` };
}

/**
 * Fetches the Google Photos Picker OAuth authorization URL.
 */
export async function getGooglePhotosAuthUrl(): Promise<string> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/photos/auth/url', { headers });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to get Google Photos authorization URL.');
  }

  const { url } = await res.json();
  return url;
}

/**
 * Creates a new Google Photos Picker session.
 */
export async function createPickerSession(): Promise<GooglePhotosSessionResponse> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/photos/session/create', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
  });

  if (res.status === 401) {
    const data = await res.json().catch(() => ({}));
    if (data.error === 'GOOGLE_PHOTOS_AUTH_REQUIRED') {
      throw new Error('GOOGLE_PHOTOS_AUTH_REQUIRED');
    }
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to create Google Photos picker session.');
  }

  return res.json();
}

/**
 * Polls the picker session status using Google's recommended interval.
 */
export async function pollPickerSession(sessionId: string): Promise<GooglePhotosPollResponse> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/photos/session/${encodeURIComponent(sessionId)}/poll`, {
    headers,
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to poll picker session.');
  }

  return res.json();
}

/**
 * Imports the selected media items from the picker session into Reminiq.
 */
export async function importPickerMedia(
  sessionId: string,
  albumId?: string
): Promise<GooglePhotosImportResult> {
  const headers = await getAuthHeader();
  const res = await fetch(`/api/photos/session/${encodeURIComponent(sessionId)}/import`, {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ albumId }),
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.message || 'Failed to import selected photos from Google Photos.');
  }

  return res.json();
}

/**
 * Cleans up / deletes the picker session.
 */
export async function cancelPickerSession(sessionId: string): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await fetch(`/api/photos/session/${encodeURIComponent(sessionId)}`, {
      method: 'DELETE',
      headers,
    });
  } catch {
    // Best-effort cleanup
  }
}

/**
 * Orchestrates the full Google Photos Picker flow:
 * 1. Verifies/requests authorization if needed
 * 2. Creates a session & opens popup with /autoclose
 * 3. Polls until user completes selection
 * 4. Imports photos and returns per-item results
 */
export async function runGooglePhotosImportFlow(options?: {
  albumId?: string;
  onStatusChange?: (status: string) => void;
}): Promise<GooglePhotosImportResult> {
  const { albumId, onStatusChange } = options || {};

  const notify = (msg: string) => {
    if (onStatusChange) onStatusChange(msg);
  };

  notify('Connecting to Google Photos...');

  let session: GooglePhotosSessionResponse;
  try {
    session = await createPickerSession();
  } catch (err: any) {
    if (err.message === 'GOOGLE_PHOTOS_AUTH_REQUIRED') {
      notify('Waiting for Google Photos authorization...');
      const authUrl = await getGooglePhotosAuthUrl();

      await new Promise<void>((resolve, reject) => {
        const popup = window.open(authUrl, 'google_photos_auth', 'width=600,height=700');
        if (!popup) {
          return reject(new Error('Popup blocked. Please allow popups to connect Google Photos.'));
        }

        const handleAuthMessage = (event: MessageEvent) => {
          if (event.data?.type === 'GOOGLE_PHOTOS_AUTH_SUCCESS') {
            window.removeEventListener('message', handleAuthMessage);
            resolve();
          }
        };

        window.addEventListener('message', handleAuthMessage);

        const checkClosed = setInterval(() => {
          if (popup.closed) {
            clearInterval(checkClosed);
            window.removeEventListener('message', handleAuthMessage);
            resolve();
          }
        }, 800);
      });

      // Try creating session again after auth
      session = await createPickerSession();
    } else {
      throw err;
    }
  }

  // Open Google Picker in popup with fresh window name to avoid cached sessions
  notify('Please select photos in the Google Photos window...');
  const pickerUrl = `${session.pickerUri}/autoclose`;
  const windowName = `google_photos_picker_${Date.now()}`;
  const pickerPopup = window.open(pickerUrl, windowName, 'width=800,height=750');

  if (!pickerPopup) {
    await cancelPickerSession(session.sessionId);
    throw new Error('Popup was blocked by your browser! Please check the address bar (top right) and click "Always allow pop-ups for localhost:3000", then try again.');
  }

  try {
    pickerPopup.focus();
  } catch {
    // Ignore focus error
  }

  // Parse polling config with fallbacks
  let pollIntervalMs = 2000;
  if (session.pollingConfig?.pollInterval) {
    const parsed = parseInt(session.pollingConfig.pollInterval.replace('s', ''), 10);
    if (!isNaN(parsed) && parsed > 0) pollIntervalMs = parsed * 1000;
  }

  let timeoutMs = 300000; // 5 minutes default
  if (session.pollingConfig?.timeoutIn) {
    const parsedTimeout = parseInt(session.pollingConfig.timeoutIn.replace('s', ''), 10);
    if (!isNaN(parsedTimeout) && parsedTimeout > 0) timeoutMs = parsedTimeout * 1000;
  }

  const startTime = Date.now();
  let mediaReady = false;

  while (Date.now() - startTime < timeoutMs) {
    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));

    // Poll Google session status
    const pollResult = await pollPickerSession(session.sessionId).catch((e) => {
      console.warn('Poll attempt failed:', e);
      return null;
    });

    if (pollResult?.mediaItemsSet) {
      mediaReady = true;
      break;
    }

    // If popup closed without mediaItemsSet, check 2 extra poll cycles
    // to give Google's backend time to finalize the selection handoff
    if (pickerPopup && pickerPopup.closed && !mediaReady) {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const retryCheck = await pollPickerSession(session.sessionId).catch(() => null);
      if (retryCheck?.mediaItemsSet) {
        mediaReady = true;
        break;
      }
      
      await new Promise((resolve) => setTimeout(resolve, 1500));
      const finalCheck = await pollPickerSession(session.sessionId).catch(() => null);
      if (finalCheck?.mediaItemsSet) {
        mediaReady = true;
        break;
      }

      // If still not set after retries, user cancelled
      await cancelPickerSession(session.sessionId);
      throw new Error('Photo selection was cancelled.');
    }
  }

  if (!mediaReady) {
    await cancelPickerSession(session.sessionId);
    throw new Error('Google Photos picker timed out. Please try again.');
  }

  // User finished selection, import photos
  notify('Importing selected photos into Reminiq...');
  const importResult = await importPickerMedia(session.sessionId, albumId);
  return importResult;
}
