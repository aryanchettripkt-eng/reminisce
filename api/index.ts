import express, { Request, Response } from 'express';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const app = express();
app.use(express.json());

// Server-side State & Token Stores
const oauthStateMap = new Map<string, { userId: string; redirectUri: string; createdAt: number }>();
const userGoogleTokens = new Map<string, { accessToken: string; refreshToken?: string; expiresAt: number }>();
const userPickerSessions = new Map<string, { userId: string; sessionId: string; createdAt: number }>();

const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

const SPOTIFY_CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

// Helper to determine the accurate active origin (Vercel domain, custom domain, or localhost)
function getRequestOrigin(req: Request): string {
  const clientOrigin = (req.query.origin as string) || (req.headers['x-client-origin'] as string);
  if (clientOrigin && (clientOrigin.startsWith('http://') || clientOrigin.startsWith('https://'))) {
    return clientOrigin.replace(/\/+$/, '');
  }

  if (req.headers.origin && typeof req.headers.origin === 'string') {
    return req.headers.origin.replace(/\/+$/, '');
  }

  if (req.headers.referer && typeof req.headers.referer === 'string') {
    try {
      const parsed = new URL(req.headers.referer);
      return parsed.origin.replace(/\/+$/, '');
    } catch {}
  }

  const proto = (req.headers['x-forwarded-proto'] as string) || 'https';
  const host = (req.headers['x-forwarded-host'] as string) || req.headers.host;
  if (host && !host.includes('localhost')) {
    return `${proto}://${host}`.replace(/\/+$/, '');
  }

  if (process.env.APP_URL && !process.env.APP_URL.includes('localhost')) {
    return process.env.APP_URL.replace(/\/+$/, '');
  }

  return host ? `${proto}://${host}`.replace(/\/+$/, '') : (process.env.APP_URL || 'http://localhost:3000').replace(/\/+$/, '');
}

// Helper to authenticate Supabase user
async function authenticateUser(req: Request): Promise<{ user: any; token: string; userClient: SupabaseClient }> {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    throw new Error('AUTH_REQUIRED');
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    throw new Error('AUTH_REQUIRED');
  }

  const userClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: { Authorization: `Bearer ${token}` }
    },
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    }
  });

  const { data: { user }, error } = await userClient.auth.getUser(token);
  if (error || !user) {
    throw new Error('INVALID_TOKEN');
  }

  return { user, token, userClient };
}

// Helper to retrieve valid Google access token with automatic refresh
async function getValidGoogleAccessToken(userId: string): Promise<string> {
  const tokenData = userGoogleTokens.get(userId);
  if (!tokenData) {
    throw new Error('GOOGLE_PHOTOS_AUTH_REQUIRED');
  }

  if (Date.now() >= tokenData.expiresAt - 60000) {
    if (tokenData.refreshToken) {
      try {
        const refreshRes = await axios.post('https://oauth2.googleapis.com/token', {
          client_id: GOOGLE_CLIENT_ID,
          client_secret: GOOGLE_CLIENT_SECRET,
          refresh_token: tokenData.refreshToken,
          grant_type: 'refresh_token',
        });

        const newAccessToken = refreshRes.data.access_token;
        const expiresIn = refreshRes.data.expires_in || 3600;
        tokenData.accessToken = newAccessToken;
        tokenData.expiresAt = Date.now() + expiresIn * 1000;
        userGoogleTokens.set(userId, tokenData);
        return newAccessToken;
      } catch (refreshErr) {
        userGoogleTokens.delete(userId);
        throw new Error('GOOGLE_PHOTOS_AUTH_REQUIRED');
      }
    } else {
      userGoogleTokens.delete(userId);
      throw new Error('GOOGLE_PHOTOS_AUTH_REQUIRED');
    }
  }

  return tokenData.accessToken;
}

// ─────────────────────────────────────────────────────────────
// Google Photos Picker OAuth Endpoints
// ─────────────────────────────────────────────────────────────

app.get('/api/photos/auth/url', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    const origin = getRequestOrigin(req);
    const redirectUri = `${origin}/auth/google-photos/callback`;
    const scope = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';

    const stateToken = crypto.randomUUID();
    oauthStateMap.set(stateToken, { userId: user.id, redirectUri, createdAt: Date.now() });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${stateToken}&access_type=offline&prompt=consent`;

    res.json({ url });
  } catch (err: any) {
    const status = err.message === 'AUTH_REQUIRED' || err.message === 'INVALID_TOKEN' ? 401 : 500;
    res.status(status).json({ error: err.message || 'Authentication failed' });
  }
});

app.get(['/auth/google-photos/callback', '/auth/google/callback', '/auth/google-photos/callback/', '/auth/google/callback/'], async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state.');
  }

  const stateData = oauthStateMap.get(state as string);
  if (!stateData) {
    return res.status(400).send('Invalid or expired OAuth state parameter. Please try again.');
  }

  oauthStateMap.delete(state as string);
  const userId = stateData.userId;
  const redirectUri = stateData.redirectUri || `${getRequestOrigin(req)}/auth/google-photos/callback`;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;

    userGoogleTokens.set(userId, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt: Date.now() + (expires_in || 3600) * 1000,
    });

    res.send(`
      <html>
        <head><title>Google Photos Connected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #fdfaf6; color: #4a342a;">
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'GOOGLE_PHOTOS_AUTH_SUCCESS' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <h3>Google Photos connected successfully.</h3>
          <p>This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Google Photos OAuth Token Error:', error?.response?.data || error.message);
    res.status(500).send('Failed to exchange Google Photos authorization code.');
  }
});

app.post('/api/photos/session/create', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    let accessToken: string;
    try {
      accessToken = await getValidGoogleAccessToken(user.id);
    } catch {
      return res.status(401).json({
        error: 'GOOGLE_PHOTOS_AUTH_REQUIRED',
        message: 'Google Photos authorization required.',
      });
    }

    try {
      const response = await axios.post(
        'https://photospicker.googleapis.com/v1/sessions',
        {},
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const { id: sessionId, pickerUri, pollingConfig } = response.data;
      userPickerSessions.set(sessionId, {
        userId: user.id,
        sessionId,
        createdAt: Date.now(),
      });

      res.json({
        sessionId,
        pickerUri,
        pollingConfig,
      });
    } catch (postErr: any) {
      if (postErr?.response?.status === 401) {
        userGoogleTokens.delete(user.id);
        return res.status(401).json({
          error: 'GOOGLE_PHOTOS_AUTH_REQUIRED',
          message: 'Google Photos session expired. Please re-authorize.',
        });
      }
      throw postErr;
    }
  } catch (err: any) {
    console.error('Create Picker Session Error:', err?.response?.data || err.message);
    const status = err.message === 'AUTH_REQUIRED' ? 401 : 500;
    res.status(status).json({
      error: 'SESSION_CREATE_FAILED',
      message: err?.response?.data?.error?.message || err.message,
    });
  }
});

app.get('/api/photos/session/:sessionId/poll', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    const { sessionId } = req.params;

    const sessionOwnership = userPickerSessions.get(sessionId);
    if (!sessionOwnership || sessionOwnership.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Session not found or access denied.' });
    }

    let accessToken: string;
    try {
      accessToken = await getValidGoogleAccessToken(user.id);
    } catch {
      return res.status(401).json({ error: 'GOOGLE_PHOTOS_AUTH_REQUIRED' });
    }

    const response = await axios.get(
      `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(sessionId)}`,
      {
        headers: { Authorization: `Bearer ${accessToken}` },
      }
    );

    res.json({
      mediaItemsSet: Boolean(response.data.mediaItemsSet),
      pollingConfig: response.data.pollingConfig,
    });
  } catch (err: any) {
    console.error('Poll Picker Session Error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'POLL_FAILED', message: err.message });
  }
});

app.post('/api/photos/session/:sessionId/import', async (req: Request, res: Response) => {
  try {
    const { user, userClient } = await authenticateUser(req);
    const { sessionId } = req.params;
    const { albumId } = req.body || {};

    const sessionOwnership = userPickerSessions.get(sessionId);
    if (!sessionOwnership || sessionOwnership.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this picker session.' });
    }

    let accessToken: string;
    try {
      accessToken = await getValidGoogleAccessToken(user.id);
    } catch {
      return res.status(401).json({ error: 'GOOGLE_PHOTOS_AUTH_REQUIRED' });
    }

    const MAX_IMPORT_ITEMS = 100;
    const allPickedItems: any[] = [];
    let pageToken: string | undefined = undefined;

    do {
      const listUrl: string = `https://photospicker.googleapis.com/v1/mediaItems?sessionId=${encodeURIComponent(sessionId)}&pageSize=50${pageToken ? `&pageToken=${encodeURIComponent(pageToken)}` : ''}`;
      const listRes = await axios.get(listUrl, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      const items = listRes.data.mediaItems || [];
      allPickedItems.push(...items);
      pageToken = listRes.data.nextPageToken;
    } while (pageToken && allPickedItems.length < MAX_IMPORT_ITEMS);

    const imported: any[] = [];
    const duplicates: string[] = [];
    const unsupported: string[] = [];
    const failed: { id: string; error: string }[] = [];

    await Promise.allSettled(
      allPickedItems.map(async (item) => {
        const mimeType = item.mediaFile?.mimeType || 'image/jpeg';
        const isVideo = mimeType.startsWith('video/') || item.type === 'VIDEO';

        if (isVideo) {
          unsupported.push(item.id || item.mediaFile?.filename || 'Video item');
          return;
        }

        const { data: existing } = await userClient
          .from('memories')
          .select('id, title')
          .eq('google_photos_media_id', item.id)
          .limit(1);

        if (existing && existing.length > 0) {
          duplicates.push(item.id);
          return;
        }

        const memoryId = crypto.randomUUID();
        const ext = mimeType.includes('png') ? 'png' : mimeType.includes('webp') ? 'webp' : 'jpg';
        const storagePath = `${user.id}/${memoryId}/original.${ext}`;

        try {
          const downloadUrl = `${item.mediaFile.baseUrl}=d`;
          const imageRes = await axios.get(downloadUrl, {
            responseType: 'arraybuffer',
            headers: { Authorization: `Bearer ${accessToken}` },
            timeout: 30000,
          });

          const imageBuffer = Buffer.from(imageRes.data);

          const { error: uploadErr } = await userClient.storage
            .from('memory-images')
            .upload(storagePath, imageBuffer, {
              contentType: mimeType,
              cacheControl: '31536000, immutable',
              upsert: false,
            });

          if (uploadErr) {
            throw new Error(`Storage upload failed: ${uploadErr.message}`);
          }

          const memoryDate = item.createTime ? new Date(item.createTime).toISOString() : new Date().toISOString();
          const memoryTitle = item.mediaFile?.filename || 'Google Photo';

          const { data: memRecord, error: dbErr } = await userClient
            .from('memories')
            .insert({
              id: memoryId,
              user_id: user.id,
              type: 'photo',
              title: memoryTitle,
              description: '',
              mood: 'joy',
              memory_date: memoryDate,
              storage_bucket: 'memory-images',
              storage_path: storagePath,
              original_filename: item.mediaFile?.filename || `google-photo.${ext}`,
              mime_type: mimeType,
              file_size: imageBuffer.length,
              google_photos_media_id: item.id,
              source: 'google_photos',
              tags: ['google-photos'],
              is_favorite: false,
            })
            .select()
            .single();

          if (dbErr || !memRecord) {
            await userClient.storage.from('memory-images').remove([storagePath]).catch(() => {});
            throw new Error(`Database record creation failed: ${dbErr?.message}`);
          }

          if (albumId) {
            const { error: linkErr } = await userClient.from('album_memories').insert({
              album_id: albumId,
              memory_id: memoryId,
              position: 0,
            });
            if (linkErr) {
              console.warn('Failed to link imported photo to album:', linkErr.message);
            }
          }

          const { data: signedData } = await userClient.storage
            .from('memory-images')
            .createSignedUrl(storagePath, 3600);

          imported.push({
            id: memRecord.id,
            type: 'photo',
            title: memRecord.title,
            desc: memRecord.description,
            mood: memRecord.mood,
            date: memRecord.memory_date,
            photoUrl: signedData?.signedUrl || undefined,
          });
        } catch (err: any) {
          console.error(`Failed to import item ${item.id}:`, err.message);
          failed.push({
            id: item.id || 'unknown',
            error: err.message || 'Import failed',
          });
        }
      })
    );

    try {
      await axios.delete(
        `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(sessionId)}`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    } catch {
      // Best effort
    }
    userPickerSessions.delete(sessionId);

    res.json({
      imported,
      duplicates,
      unsupported,
      failed,
    });
  } catch (err: any) {
    console.error('Import Media Error:', err?.response?.data || err.message);
    res.status(500).json({ error: 'IMPORT_FAILED', message: err.message });
  }
});

app.delete('/api/photos/session/:sessionId', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    const { sessionId } = req.params;

    const tokenData = userGoogleTokens.get(user.id);
    if (tokenData) {
      await axios.delete(
        `https://photospicker.googleapis.com/v1/sessions/${encodeURIComponent(sessionId)}`,
        { headers: { Authorization: `Bearer ${tokenData.accessToken}` } }
      ).catch(() => {});
    }

    userPickerSessions.delete(sessionId);
    res.json({ success: true });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ─────────────────────────────────────────────────────────────
// Spotify Endpoints
// ─────────────────────────────────────────────────────────────

app.get('/api/auth/spotify/url', (req, res) => {
  const origin = getRequestOrigin(req);
  const redirectUri = `${origin}/auth/spotify/callback`;
  const scope = 'user-read-private user-read-email';
  const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&show_dialog=true`;
  res.json({ url });
});

app.get(['/auth/spotify/callback', '/auth/spotify/callback/'], async (req, res) => {
  const { code } = req.query;
  const origin = getRequestOrigin(req);
  const redirectUri = `${origin}/auth/spotify/callback`;

  try {
    const response = await axios.post('https://accounts.spotify.com/api/token', new URLSearchParams({
      code: code as string,
      client_id: SPOTIFY_CLIENT_ID!,
      client_secret: SPOTIFY_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    }).toString(), {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });

    const { access_token } = response.data;

    res.send(`
      <html>
        <body>
          <script>
            if (window.opener) {
              window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', token: '${access_token}' }, '*');
              window.close();
            } else {
              window.location.href = '/';
            }
          </script>
          <p>Authentication successful. This window should close automatically.</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error('Spotify OAuth Error:', error);
    res.status(500).send('Authentication failed');
  }
});

app.get('/api/spotify/search', async (req, res) => {
  const token = req.headers.authorization;
  const { q } = req.query;
  if (!token) return res.status(401).json({ error: 'No token' });

  try {
    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: token },
      params: { q, type: 'track', limit: 10 }
    });
    res.json(response.data);
  } catch (error) {
    console.error('Spotify Search Error:', error);
    res.status(500).json({ error: 'Failed to search tracks' });
  }
});

export default app;
