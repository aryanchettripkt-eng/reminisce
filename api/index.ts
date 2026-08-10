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

const SPOTIFY_CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
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

// Helper to encrypt a payload into an opaque token using GOOGLE_CLIENT_SECRET
function encryptTokenPayload(payload: any, secret: string): string {
  const key = crypto.createHash('sha256').update(secret || 'default-secret-key-reminiq').digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const json = JSON.stringify(payload);
  const encrypted = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return `${iv.toString('base64url')}.${tag.toString('base64url')}.${encrypted.toString('base64url')}`;
}

// Helper to decrypt an opaque token
function decryptTokenPayload(token: string, secret: string): any {
  const parts = token.split('.');
  if (parts.length !== 3) throw new Error('INVALID_TICKET_FORMAT');
  const [ivB64, tagB64, encB64] = parts;
  const key = crypto.createHash('sha256').update(secret || 'default-secret-key-reminiq').digest();
  const iv = Buffer.from(ivB64, 'base64url');
  const tag = Buffer.from(tagB64, 'base64url');
  const encrypted = Buffer.from(encB64, 'base64url');
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, iv);
  decipher.setAuthTag(tag);
  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return JSON.parse(decrypted.toString('utf8'));
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

// Helper to retrieve valid Google access token with automatic refresh & stateless ticket support
async function getValidGoogleAccessToken(req: Request, res: Response, userId: string): Promise<string> {
  let tokenData: { accessToken: string; refreshToken?: string; expiresAt: number; userId?: string } | undefined;

  // 1. Try reading stateless encrypted ticket from header
  const ticketHeader = req.headers['x-google-auth-ticket'] as string;
  if (ticketHeader) {
    try {
      const decrypted = decryptTokenPayload(ticketHeader, GOOGLE_CLIENT_SECRET || 'secret');
      if (decrypted && decrypted.userId === userId && decrypted.accessToken) {
        tokenData = decrypted;
      }
    } catch (err) {
      console.warn('Failed to decrypt x-google-auth-ticket:', err);
    }
  }

  // 2. Fallback to in-memory store
  if (!tokenData) {
    tokenData = userGoogleTokens.get(userId);
  }

  if (!tokenData) {
    throw new Error('GOOGLE_PHOTOS_AUTH_REQUIRED');
  }

  // 3. Refresh token if expired or about to expire in 60 seconds
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

        const newTicket = encryptTokenPayload({
          userId,
          accessToken: newAccessToken,
          refreshToken: tokenData.refreshToken,
          expiresAt: tokenData.expiresAt,
        }, GOOGLE_CLIENT_SECRET || 'secret');

        res.setHeader('x-new-auth-ticket', newTicket);
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
    const origin = getRequestOrigin(req).replace(/\/+$/, '');
    const redirectUri = `${origin}/auth/google-photos/callback`;
    const scope = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';

    const stateData = { userId: user.id, redirectUri, timestamp: Date.now() };
    const stateToken = encryptTokenPayload(stateData, GOOGLE_CLIENT_SECRET || 'secret');

    // Also cache in memory for local fallback
    oauthStateMap.set(stateToken, { userId: user.id, redirectUri, createdAt: Date.now() });

    const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(stateToken)}&access_type=offline&prompt=consent`;

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

  let stateData: any;
  try {
    stateData = decryptTokenPayload(state as string, GOOGLE_CLIENT_SECRET || 'secret');
  } catch {
    stateData = oauthStateMap.get(state as string);
  }

  if (!stateData || !stateData.userId) {
    return res.status(400).send('Invalid or expired OAuth state parameter. Please try again.');
  }

  oauthStateMap.delete(state as string);
  const userId = stateData.userId;
  const redirectUri = stateData.redirectUri || `${getRequestOrigin(req).replace(/\/+$/, '')}/auth/google-photos/callback`;

  try {
    const response = await axios.post('https://oauth2.googleapis.com/token', {
      code,
      client_id: GOOGLE_CLIENT_ID,
      client_secret: GOOGLE_CLIENT_SECRET,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = Date.now() + (expires_in || 3600) * 1000;

    userGoogleTokens.set(userId, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
    });

    const authTicket = encryptTokenPayload({
      userId,
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
    }, GOOGLE_CLIENT_SECRET || 'secret');

    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.send(`
      <html>
        <head><title>Google Photos Connected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #fdfaf6; color: #4a342a;">
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_PHOTOS_AUTH_SUCCESS', authTicket: ${JSON.stringify(authTicket)} }, '*');
                setTimeout(function() { window.close(); }, 300);
              } else {
                window.location.href = '/';
              }
            } catch (e) {
              window.location.href = '/';
            }
          </script>
          <h3>Google Photos connected successfully.</h3>
          <p>Closing window...</p>
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
      accessToken = await getValidGoogleAccessToken(req, res, user.id);
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
    if (sessionOwnership && sessionOwnership.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Session not found or access denied.' });
    }

    let accessToken: string;
    try {
      accessToken = await getValidGoogleAccessToken(req, res, user.id);
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
    if (sessionOwnership && sessionOwnership.userId !== user.id) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'Access denied to this picker session.' });
    }

    let accessToken: string;
    try {
      accessToken = await getValidGoogleAccessToken(req, res, user.id);
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
// Spotify Token Store & Helpers (2026 Web API)
// ─────────────────────────────────────────────────────────────

const userSpotifyTokens = new Map<string, { accessToken: string; refreshToken?: string; expiresAt: number }>();

async function getValidSpotifyAccessToken(req: Request, res: Response, userId: string): Promise<string> {
  let tokenData: { accessToken: string; refreshToken?: string; expiresAt: number; userId?: string } | undefined;

  // 1. Try reading stateless encrypted ticket from header
  const ticketHeader = req.headers['x-spotify-auth-ticket'] as string;
  if (ticketHeader) {
    try {
      const decrypted = decryptTokenPayload(ticketHeader, SPOTIFY_CLIENT_SECRET || 'spotify-secret');
      if (decrypted && decrypted.userId === userId && decrypted.accessToken) {
        tokenData = decrypted;
      }
    } catch (err) {
      console.warn('Failed to decrypt x-spotify-auth-ticket:', err);
    }
  }

  // 2. Fallback to in-memory store
  if (!tokenData) {
    tokenData = userSpotifyTokens.get(userId);
  }

  if (!tokenData) {
    throw new Error('SPOTIFY_AUTH_REQUIRED');
  }

  // 3. Refresh token if expired or about to expire in 60 seconds
  if (Date.now() >= tokenData.expiresAt - 60000) {
    if (tokenData.refreshToken) {
      try {
        const refreshRes = await axios.post(
          'https://accounts.spotify.com/api/token',
          new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: tokenData.refreshToken,
            client_id: SPOTIFY_CLIENT_ID!,
            client_secret: SPOTIFY_CLIENT_SECRET!,
          }).toString(),
          {
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          }
        );

        const newAccessToken = refreshRes.data.access_token;
        const expiresIn = refreshRes.data.expires_in || 3600;
        const newRefreshToken = refreshRes.data.refresh_token || tokenData.refreshToken;

        tokenData.accessToken = newAccessToken;
        tokenData.refreshToken = newRefreshToken;
        tokenData.expiresAt = Date.now() + expiresIn * 1000;
        userSpotifyTokens.set(userId, tokenData);

        const newTicket = encryptTokenPayload(
          {
            userId,
            accessToken: newAccessToken,
            refreshToken: newRefreshToken,
            expiresAt: tokenData.expiresAt,
          },
          SPOTIFY_CLIENT_SECRET || 'spotify-secret'
        );

        res.setHeader('x-new-spotify-ticket', newTicket);
        return newAccessToken;
      } catch (refreshErr: any) {
        userSpotifyTokens.delete(userId);
        throw new Error('SPOTIFY_AUTH_REQUIRED');
      }
    } else {
      userSpotifyTokens.delete(userId);
      throw new Error('SPOTIFY_AUTH_REQUIRED');
    }
  }

  return tokenData.accessToken;
}

// ─────────────────────────────────────────────────────────────
// Spotify OAuth & Endpoints (2026 Web API)
// ─────────────────────────────────────────────────────────────

// 1. Generate Spotify OAuth Authorization URL
app.get('/api/auth/spotify/url', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);

    // Always use APP_URL (canonical domain) as the redirect base to avoid
    // Vercel preview deployment URLs breaking the registered redirect URI.
    const canonicalBase = (process.env.APP_URL || getRequestOrigin(req)).replace(/\/+$/, '');
    const redirectUri = `${canonicalBase}/auth/spotify/callback`;
    const scope = 'playlist-read-private playlist-read-collaborative user-read-private';

    console.log(`[Spotify OAuth] redirect_uri = ${redirectUri}`);

    const stateData = { userId: user.id, redirectUri, timestamp: Date.now() };
    const stateToken = encryptTokenPayload(stateData, SPOTIFY_CLIENT_SECRET || 'spotify-secret');

    const url = `https://accounts.spotify.com/authorize?client_id=${SPOTIFY_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(stateToken)}&show_dialog=true`;

    res.json({ url });
  } catch (err: any) {
    const status = err.message === 'AUTH_REQUIRED' || err.message === 'INVALID_TOKEN' ? 401 : 500;
    res.status(status).json({ error: err.message || 'Authentication failed' });
  }
});

// 2. Spotify OAuth Callback
app.get(['/auth/spotify/callback', '/auth/spotify/callback/'], async (req: Request, res: Response) => {
  const { code, state } = req.query;

  if (!code || !state) {
    return res.status(400).send('Missing authorization code or state.');
  }

  let stateData: any;
  try {
    stateData = decryptTokenPayload(state as string, SPOTIFY_CLIENT_SECRET || 'spotify-secret');
  } catch {
    return res.status(400).send('Invalid or expired Spotify OAuth state parameter.');
  }

  if (!stateData || !stateData.userId) {
    return res.status(400).send('Invalid Spotify state parameter.');
  }

  const userId = stateData.userId;
  // Use the redirectUri stored in state (set at auth URL generation time)
  // so the token exchange always uses the same canonical URI.
  const redirectUri = stateData.redirectUri || `${(process.env.APP_URL || getRequestOrigin(req)).replace(/\/+$/, '')}/auth/spotify/callback`;

  try {
    const response = await axios.post(
      'https://accounts.spotify.com/api/token',
      new URLSearchParams({
        code: code as string,
        client_id: SPOTIFY_CLIENT_ID!,
        client_secret: SPOTIFY_CLIENT_SECRET!,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }).toString(),
      {
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      }
    );

    const { access_token, refresh_token, expires_in } = response.data;
    const expiresAt = Date.now() + (expires_in || 3600) * 1000;

    userSpotifyTokens.set(userId, {
      accessToken: access_token,
      refreshToken: refresh_token,
      expiresAt,
    });

    const authTicket = encryptTokenPayload(
      {
        userId,
        accessToken: access_token,
        refreshToken: refresh_token,
        expiresAt,
      },
      SPOTIFY_CLIENT_SECRET || 'spotify-secret'
    );

    res.setHeader('Cross-Origin-Opener-Policy', 'unsafe-none');
    res.send(`
      <html>
        <head><title>Spotify Connected</title></head>
        <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #0e1e12; color: #a3e635;">
          <script>
            try {
              if (window.opener) {
                window.opener.postMessage({ type: 'SPOTIFY_AUTH_SUCCESS', authTicket: ${JSON.stringify(authTicket)} }, '*');
                setTimeout(function() { window.close(); }, 300);
              } else {
                window.location.href = '/';
              }
            } catch (e) {
              window.location.href = '/';
            }
          </script>
          <h3>Spotify connected successfully.</h3>
          <p>Closing window...</p>
        </body>
      </html>
    `);
  } catch (error: any) {
    console.error('Spotify OAuth Error:', error?.response?.data || error.message);
    res.status(500).send('Failed to exchange Spotify authorization code.');
  }
});

// 3. Get Connected Spotify Profile
app.get('/api/spotify/me', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    let accessToken: string;
    try {
      accessToken = await getValidSpotifyAccessToken(req, res, user.id);
    } catch {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }

    const response = await axios.get('https://api.spotify.com/v1/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    res.json({
      id: response.data.id,
      displayName: response.data.display_name,
      images: response.data.images || [],
    });
  } catch (err: any) {
    if (err?.response?.status === 401) {
      userSpotifyTokens.delete(req.headers['x-user-id'] as string);
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }
    const status = err.message === 'AUTH_REQUIRED' ? 401 : 500;
    res.status(status).json({ error: err.message });
  }
});

// 4. Get Current User's Playlists
app.get('/api/spotify/playlists', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    let accessToken: string;
    try {
      accessToken = await getValidSpotifyAccessToken(req, res, user.id);
    } catch {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const response = await axios.get('https://api.spotify.com/v1/me/playlists', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: { limit, offset },
    });

    const items = (response.data.items || []).map((pl: any) => ({
      id: pl.id,
      name: pl.name,
      description: pl.description || null,
      images: pl.images || [],
      tracksCount: pl.items?.total ?? pl.tracks?.total ?? 0,
      ownerDisplayName: pl.owner?.display_name || 'Spotify User',
      isCollaborative: Boolean(pl.collaborative),
      isPublic: pl.public ?? null,
    }));

    res.json({
      playlists: items,
      total: response.data.total || 0,
      limit: response.data.limit || limit,
      offset: response.data.offset || offset,
      next: Boolean(response.data.next),
    });
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }
    if (err?.response?.status === 429) {
      const reason = err?.response?.data?.reason || 'RATE_LIMITED';
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS', reason });
    }
    res.status(500).json({ error: err?.response?.data?.error?.message || err.message });
  }
});

// 5. Get Playlist Items (2026 Endpoint: GET /v1/playlists/{playlist_id}/items)
app.get('/api/spotify/playlists/:playlistId/items', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    const { playlistId } = req.params;

    let accessToken: string;
    try {
      accessToken = await getValidSpotifyAccessToken(req, res, user.id);
    } catch {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 50, 1), 50);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    let response: any;
    try {
      // 2026 Primary Endpoint: /items
      response = await axios.get(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items`, {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: {
          limit,
          offset,
          fields: 'items(item(id,name,artists(name),album(name,images),uri,external_urls,duration_ms,type),track(id,name,artists(name),album(name,images),uri,external_urls,duration_ms,type)),total,limit,offset,next',
        },
      });
    } catch (apiErr: any) {
      if (apiErr?.response?.status === 403) {
        return res.status(403).json({
          error: 'FORBIDDEN_PLAYLIST_ACCESS',
          message: "Access to this playlist's items is restricted by Spotify. You can view tracks from playlists you own or collaborate on.",
        });
      }
      if (apiErr?.response?.status === 404) {
        // Fallback for older API versions if needed
        response = await axios.get(`https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/tracks`, {
          headers: { Authorization: `Bearer ${accessToken}` },
          params: { limit, offset },
        });
      } else {
        throw apiErr;
      }
    }

    const rawItems = response.data.items || [];
    const tracks: any[] = [];
    const unsupported: string[] = [];

    for (const entry of rawItems) {
      // Handle both modern entry.item and fallback entry.track
      const track = entry.item || entry.track;
      if (!track || !track.id) continue;

      if (track.type && track.type !== 'track') {
        unsupported.push(track.name || 'Non-music item');
        continue;
      }

      const artists = Array.isArray(track.artists)
        ? track.artists.map((a: any) => a.name).join(', ')
        : 'Unknown Artist';

      const albumArt = track.album?.images?.[0]?.url || track.album?.images?.[1]?.url || undefined;

      tracks.push({
        id: track.id,
        name: track.name,
        artists,
        album: track.album?.name || 'Unknown Album',
        albumArt,
        uri: track.uri || `spotify:track:${track.id}`,
        externalUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
        durationMs: track.duration_ms || 0,
        isPlayable: true,
      });
    }

    res.json({
      tracks,
      unsupported,
      total: response.data.total || tracks.length,
      limit: response.data.limit || limit,
      offset: response.data.offset || offset,
      next: Boolean(response.data.next),
    });
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }
    if (err?.response?.status === 429) {
      const reason = err?.response?.data?.reason || 'RATE_LIMITED';
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS', reason });
    }
    res.status(500).json({ error: err?.response?.data?.error?.message || err.message });
  }
});

// 6. Spotify Track Search (Max Limit: 10 as per 2026 API)
app.get('/api/spotify/search', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    const { q } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({ error: 'Query parameter "q" is required.' });
    }

    let accessToken: string;
    try {
      accessToken = await getValidSpotifyAccessToken(req, res, user.id);
    } catch {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }

    const limit = Math.min(Math.max(parseInt(req.query.limit as string) || 10, 1), 10);
    const offset = Math.max(parseInt(req.query.offset as string) || 0, 0);

    const response = await axios.get('https://api.spotify.com/v1/search', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        q,
        type: 'track',
        limit,
        offset,
      },
    });

    const rawTracks = response.data.tracks?.items || [];
    const tracks = rawTracks.map((track: any) => ({
      id: track.id,
      name: track.name,
      artists: (track.artists || []).map((a: any) => a.name).join(', '),
      album: track.album?.name || '',
      albumArt: track.album?.images?.[0]?.url || track.album?.images?.[1]?.url,
      uri: track.uri,
      externalUrl: track.external_urls?.spotify || `https://open.spotify.com/track/${track.id}`,
      durationMs: track.duration_ms || 0,
    }));

    res.json({
      tracks,
      total: response.data.tracks?.total || 0,
      limit,
      offset,
    });
  } catch (err: any) {
    if (err?.response?.status === 401) {
      return res.status(401).json({ error: 'SPOTIFY_AUTH_REQUIRED' });
    }
    if (err?.response?.status === 429) {
      const reason = err?.response?.data?.reason || 'RATE_LIMITED';
      return res.status(429).json({ error: 'TOO_MANY_REQUESTS', reason });
    }
    res.status(500).json({ error: err?.response?.data?.error?.message || err.message });
  }
});

// 7. Batch Import Selected Spotify Tracks as Music Memories
app.post('/api/spotify/import', async (req: Request, res: Response) => {
  try {
    const { user, userClient } = await authenticateUser(req);
    const { tracks, albumId } = req.body || {};

    if (!Array.isArray(tracks) || tracks.length === 0) {
      return res.status(400).json({ error: 'No tracks provided for import.' });
    }

    const imported: any[] = [];
    const duplicates: string[] = [];
    const unsupported: string[] = [];
    const failed: { id: string; error: string }[] = [];

    for (const track of tracks) {
      if (!track.id || !track.name) {
        unsupported.push(track.name || 'Invalid track data');
        continue;
      }

      try {
        const memoryId = crypto.randomUUID();
        const musicTrackData = {
          song: track.name,
          artist: track.artists || 'Unknown Artist',
          album: track.album || '',
          albumArt: track.albumArt || null,
          provider: 'spotify',
          providerTrackId: track.id,
          uri: track.uri || `spotify:track:${track.id}`,
          externalUrl: track.externalUrl || `https://open.spotify.com/track/${track.id}`,
          durationMs: track.durationMs || 0,
        };

        let { data: insertedMemory, error: insertError } = await userClient
          .from('memories')
          .insert({
            id: memoryId,
            user_id: user.id,
            type: 'music',
            source: 'spotify',
            title: track.name,
            description: `Imported from Spotify • ${track.artists || 'Unknown Artist'}`,
            mood: 'nostalgic',
            memory_date: new Date().toISOString(),
            music_url: track.externalUrl || `https://open.spotify.com/track/${track.id}`,
            music_track: musicTrackData,
            tags: ['spotify', 'music'],
            is_favorite: false,
          })
          .select()
          .single();

        if (insertError && insertError.message.includes('chk_memory_source')) {
          const fallbackRes = await userClient
            .from('memories')
            .insert({
              id: memoryId,
              user_id: user.id,
              type: 'music',
              source: 'upload',
              title: track.name,
              description: `Imported from Spotify • ${track.artists || 'Unknown Artist'}`,
              mood: 'nostalgic',
              memory_date: new Date().toISOString(),
              music_url: track.externalUrl || `https://open.spotify.com/track/${track.id}`,
              music_track: musicTrackData,
              tags: ['spotify', 'music'],
              is_favorite: false,
            })
            .select()
            .single();

          insertedMemory = fallbackRes.data;
          insertError = fallbackRes.error;
        }

        if (insertError) {
          throw insertError;
        }

        // If an album was selected, link the new memory to album_memories
        if (albumId) {
          try {
            await userClient
              .from('album_memories')
              .insert({
                album_id: albumId,
                memory_id: memoryId,
              });
          } catch (albErr: any) {
            console.warn('Failed to associate memory with album:', albErr?.message);
          }
        }

        imported.push({
          id: insertedMemory.id,
          type: 'music',
          title: insertedMemory.title,
          desc: insertedMemory.description,
          mood: insertedMemory.mood,
          date: insertedMemory.memory_date,
          musicUrl: insertedMemory.music_url,
          music: musicTrackData,
        });
      } catch (err: any) {
        console.error(`Failed to import track ${track.id}:`, err.message);
        failed.push({
          id: track.id,
          error: err.message || 'Import failed',
        });
      }
    }

    res.json({
      imported,
      duplicates,
      unsupported,
      failed,
    });
  } catch (err: any) {
    const status = err.message === 'AUTH_REQUIRED' ? 401 : 500;
    res.status(status).json({ error: err.message });
  }
});

// 8. Disconnect Spotify
app.post('/api/spotify/disconnect', async (req: Request, res: Response) => {
  try {
    const { user } = await authenticateUser(req);
    userSpotifyTokens.delete(user.id);
    res.json({ success: true, message: 'Spotify disconnected.' });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default app;

