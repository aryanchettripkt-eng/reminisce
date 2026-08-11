import { getSupabaseClient } from './client';
import {
  SpotifyPlaylistSummary,
  SpotifyTrackItem,
  SpotifyImportResult,
  AuthenticationRequiredError,
} from '../../types/storage';

/**
 * Reminiq - Spotify Web API Client Service (2026)
 *
 * Implements secure OAuth handshake, playlist discovery, track pagination using /items,
 * and metadata-only music memory persistence in Supabase.
 */

const SPOTIFY_TICKET_STORAGE_KEY = 'reminiq_spotify_auth_ticket';

export function getSavedSpotifyAuthTicket(): string | null {
  try {
    return sessionStorage.getItem(SPOTIFY_TICKET_STORAGE_KEY);
  } catch {
    return null;
  }
}

export function saveSpotifyAuthTicket(ticket: string | null): void {
  try {
    if (ticket) {
      sessionStorage.setItem(SPOTIFY_TICKET_STORAGE_KEY, ticket);
    } else {
      sessionStorage.removeItem(SPOTIFY_TICKET_STORAGE_KEY);
    }
  } catch {}
}

export function isSpotifyConnected(): boolean {
  return Boolean(getSavedSpotifyAuthTicket());
}

async function getAuthHeader(): Promise<{ Authorization: string; 'x-spotify-auth-ticket'?: string }> {
  const client = getSupabaseClient();
  const { data, error } = await client.auth.getSession();
  const token = data?.session?.access_token;

  if (error || !token) {
    throw new AuthenticationRequiredError('Please sign in to Reminiq to connect Spotify.');
  }

  const headers: { Authorization: string; 'x-spotify-auth-ticket'?: string } = {
    Authorization: `Bearer ${token}`,
  };

  const ticket = getSavedSpotifyAuthTicket();
  if (ticket) {
    headers['x-spotify-auth-ticket'] = ticket;
  }

  return headers;
}

function checkAndSaveNewSpotifyTicket(res: Response): void {
  const newTicket = res.headers.get('x-new-spotify-ticket');
  if (newTicket) {
    saveSpotifyAuthTicket(newTicket);
  }
}

function isWindowClosed(win: Window | null): boolean {
  if (!win) return true;
  try {
    return Boolean(win.closed);
  } catch {
    return false;
  }
}

/**
 * Fetches the Spotify OAuth authorization URL.
 */
export async function getSpotifyAuthUrl(): Promise<string> {
  const headers = await getAuthHeader();
  let clientOrigin = typeof window !== 'undefined' ? window.location.origin : '';
  // Spotify rejects http://localhost as insecure — use 127.0.0.1 which is accepted
  clientOrigin = clientOrigin.replace('localhost', '127.0.0.1');
  const urlParam = clientOrigin ? `?origin=${encodeURIComponent(clientOrigin)}` : '';
  const res = await fetch(`/api/auth/spotify/url${urlParam}`, {
    headers: {
      ...headers,
      'x-client-origin': clientOrigin,
    },
  });

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || data.message || 'Failed to get Spotify authorization URL.');
  }

  const { url } = await res.json();
  return url;
}

/**
 * Initiates the Spotify Connect flow.
 * Uses a popup — if postMessage fails (COOP), falls back to full-page redirect.
 */
export async function connectSpotify(): Promise<void> {
  const authUrl = await getSpotifyAuthUrl();

  // Store intent so the callback page can detect we wanted Spotify auth
  try { sessionStorage.setItem('reminiq_spotify_connecting', '1'); } catch {}

  return new Promise<void>((resolve, reject) => {
    let authCompleted = false;

    // Try popup first
    const popup = window.open(authUrl, 'spotify_auth_popup', 'width=600,height=700,noopener=0');

    // If popup is blocked, fall back to full-page redirect
    if (!popup || popup.closed) {
      try { sessionStorage.removeItem('reminiq_spotify_connecting'); } catch {}
      window.location.href = authUrl;
      return resolve(); // navigation will handle the rest
    }

    const handleAuthMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SPOTIFY_AUTH_SUCCESS') {
        authCompleted = true;
        if (event.data?.authTicket) {
          saveSpotifyAuthTicket(event.data.authTicket);
        }
        try { sessionStorage.removeItem('reminiq_spotify_connecting'); } catch {}
        window.removeEventListener('message', handleAuthMessage);
        resolve();
      }
    };

    window.addEventListener('message', handleAuthMessage);

    const checkClosed = setInterval(() => {
      if (isWindowClosed(popup)) {
        clearInterval(checkClosed);
        window.removeEventListener('message', handleAuthMessage);
        try { sessionStorage.removeItem('reminiq_spotify_connecting'); } catch {}

        // Check if the ticket was saved (postMessage succeeded before close detection)
        if (authCompleted || getSavedSpotifyAuthTicket()) {
          resolve();
        } else {
          reject(new Error('Spotify authorization was not completed. Please grant permissions in the Spotify window.'));
        }
      }
    }, 500);
  });
}

/**
 * Disconnects the user's Spotify account.
 */
export async function disconnectSpotify(): Promise<void> {
  try {
    const headers = await getAuthHeader();
    await fetch('/api/spotify/disconnect', {
      method: 'POST',
      headers,
    });
  } catch {
    // Best effort
  } finally {
    saveSpotifyAuthTicket(null);
  }
}

/**
 * Retrieves the connected Spotify user profile.
 */
export async function getSpotifyProfile(): Promise<{ id: string; displayName?: string; images?: any[] }> {
  const headers = await getAuthHeader();
  const res = await fetch('/api/spotify/me', { headers });
  checkAndSaveNewSpotifyTicket(res);

  if (res.status === 401) {
    saveSpotifyAuthTicket(null);
    throw new Error('SPOTIFY_AUTH_REQUIRED');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch Spotify profile.');
  }

  return res.json();
}

/**
 * Fetches the user's accessible Spotify playlists.
 */
export async function getSpotifyPlaylists(options?: {
  limit?: number;
  offset?: number;
}): Promise<{
  playlists: SpotifyPlaylistSummary[];
  total: number;
  limit: number;
  offset: number;
  next: boolean;
}> {
  const headers = await getAuthHeader();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const res = await fetch(`/api/spotify/playlists?limit=${limit}&offset=${offset}`, { headers });
  checkAndSaveNewSpotifyTicket(res);

  if (res.status === 401) {
    saveSpotifyAuthTicket(null);
    throw new Error('SPOTIFY_AUTH_REQUIRED');
  }

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    if (data.reason === 'QUOTA_EXCEEDED') {
      throw new Error('Spotify API rate limit quota exceeded for this developer account.');
    }
    throw new Error('Spotify is receiving too many requests. Please wait a moment.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch Spotify playlists.');
  }

  return res.json();
}

/**
 * Fetches tracks from a Spotify playlist using the 2026 GET /v1/playlists/{id}/items endpoint.
 */
export async function getPlaylistItems(
  playlistId: string,
  options?: {
    limit?: number;
    offset?: number;
  }
): Promise<{
  tracks: SpotifyTrackItem[];
  unsupported: string[];
  total: number;
  limit: number;
  offset: number;
  next: boolean;
}> {
  const headers = await getAuthHeader();
  const limit = options?.limit || 50;
  const offset = options?.offset || 0;

  const res = await fetch(
    `/api/spotify/playlists/${encodeURIComponent(playlistId)}/items?limit=${limit}&offset=${offset}`,
    { headers }
  );
  checkAndSaveNewSpotifyTicket(res);

  if (res.status === 401) {
    saveSpotifyAuthTicket(null);
    throw new Error('SPOTIFY_AUTH_REQUIRED');
  }

  if (res.status === 403) {
    const data = await res.json().catch(() => ({}));
    throw new Error(
      data.message ||
        "Access to this playlist's items is restricted by Spotify. You can view tracks from playlists you own or collaborate on."
    );
  }

  if (res.status === 429) {
    const data = await res.json().catch(() => ({}));
    if (data.reason === 'QUOTA_EXCEEDED') {
      throw new Error('Spotify API rate limit quota exceeded for this developer account.');
    }
    throw new Error('Spotify rate limit reached. Please wait a moment.');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to fetch playlist tracks.');
  }

  return res.json();
}

/**
 * Searches Spotify for tracks (Max Limit = 10 as per 2026 API).
 */
export async function searchSpotifyTracks(
  query: string,
  options?: { limit?: number; offset?: number }
): Promise<{ tracks: SpotifyTrackItem[]; total: number }> {
  if (!query.trim()) return { tracks: [], total: 0 };

  const headers = await getAuthHeader();
  const limit = Math.min(options?.limit || 10, 10);
  const offset = options?.offset || 0;

  const res = await fetch(
    `/api/spotify/search?q=${encodeURIComponent(query.trim())}&limit=${limit}&offset=${offset}`,
    { headers }
  );
  checkAndSaveNewSpotifyTicket(res);

  if (res.status === 401) {
    saveSpotifyAuthTicket(null);
    throw new Error('SPOTIFY_AUTH_REQUIRED');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to search Spotify.');
  }

  return res.json();
}

/**
 * Batch imports selected Spotify tracks into Supabase public.memories (and optional album).
 */
export async function importSpotifyTracks(
  tracks: SpotifyTrackItem[],
  albumId?: string
): Promise<SpotifyImportResult> {
  if (!tracks || tracks.length === 0) {
    return { imported: [], duplicates: [], unsupported: [], failed: [] };
  }

  const headers = await getAuthHeader();
  const res = await fetch('/api/spotify/import', {
    method: 'POST',
    headers: {
      ...headers,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ tracks, albumId }),
  });
  checkAndSaveNewSpotifyTicket(res);

  if (res.status === 401) {
    saveSpotifyAuthTicket(null);
    throw new Error('SPOTIFY_AUTH_REQUIRED');
  }

  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error || 'Failed to import Spotify tracks.');
  }

  return res.json();
}
