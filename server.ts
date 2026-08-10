import express, { Request, Response } from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import dotenv from 'dotenv';
import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Server-side State & Token Stores
// Server-side State & Token Stores
const oauthStateMap = new Map<string, { userId: string; redirectUri: string; createdAt: number }>();
const userGoogleTokens = new Map<string, { accessToken: string; refreshToken?: string; expiresAt: number }>();
const userPickerSessions = new Map<string, { userId: string; sessionId: string; createdAt: number }>();

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

// Clean up stale state every 15 minutes
setInterval(() => {
  const now = Date.now();
  for (const [state, data] of oauthStateMap.entries()) {
    if (now - data.createdAt > 15 * 60 * 1000) oauthStateMap.delete(state);
  }
  for (const [sessId, data] of userPickerSessions.entries()) {
    if (now - data.createdAt > 60 * 60 * 1000) userPickerSessions.delete(sessId);
  }
}, 15 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  const GOOGLE_CLIENT_ID = process.env.VITE_GOOGLE_CLIENT_ID || process.env.GOOGLE_CLIENT_ID;
  const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
  
  const SPOTIFY_CLIENT_ID = process.env.VITE_SPOTIFY_CLIENT_ID;
  const SPOTIFY_CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
  
  const SUPABASE_URL = process.env.VITE_SUPABASE_URL || '';
  const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

  app.use(express.json());

  // Helper to extract & authenticate Supabase user from Bearer JWT
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

  // 1. Generate Google Photos OAuth Authorization URL
  app.get('/api/photos/auth/url', async (req: Request, res: Response) => {
    try {
      const { user } = await authenticateUser(req);
      const origin = getRequestOrigin(req).replace(/\/+$/, '');
      const redirectUri = `${origin}/auth/google-photos/callback`;
      const scope = 'https://www.googleapis.com/auth/photospicker.mediaitems.readonly';

      const stateData = { userId: user.id, redirectUri, timestamp: Date.now() };
      const stateToken = encryptTokenPayload(stateData, GOOGLE_CLIENT_SECRET || 'secret');

      oauthStateMap.set(stateToken, { userId: user.id, redirectUri, createdAt: Date.now() });

      const url = `https://accounts.google.com/o/oauth2/v2/auth?client_id=${GOOGLE_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&response_type=code&scope=${encodeURIComponent(scope)}&state=${encodeURIComponent(stateToken)}&access_type=offline&prompt=consent`;

      res.json({ url });
    } catch (err: any) {
      const status = err.message === 'AUTH_REQUIRED' || err.message === 'INVALID_TOKEN' ? 401 : 500;
      res.status(status).json({ error: err.message || 'Authentication failed' });
    }
  });

  // 2. Google Photos OAuth Callback Endpoint
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

      // Store token server-side only mapped to the Reminiq user ID
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

      // Emit event to opener window and close popup (DO NOT expose token to client)
      res.send(`
        <html>
          <head><title>Google Photos Connected</title></head>
          <body style="font-family: sans-serif; text-align: center; padding: 40px; background: #fdfaf6; color: #4a342a;">
            <script>
              if (window.opener) {
                window.opener.postMessage({ type: 'GOOGLE_PHOTOS_AUTH_SUCCESS', authTicket: ${JSON.stringify(authTicket)} }, '*');
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

  // 3. Create Google Photos Picker Session
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
          // Invalidate stale token so user re-authenticates smoothly
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

  // 4. Poll Google Photos Picker Session
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

  // 5. Import Selected Photos from Picker Session
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

      // Step A: Paginate & fetch selected media items from Google
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

      // Step B: Import each selected item with per-item isolation
      await Promise.allSettled(
        allPickedItems.map(async (item) => {
          const mimeType = item.mediaFile?.mimeType || 'image/jpeg';
          const isVideo = mimeType.startsWith('video/') || item.type === 'VIDEO';

          // Photo-only constraint: reject video files gracefully
          if (isVideo) {
            unsupported.push(item.id || item.mediaFile?.filename || 'Video item');
            return;
          }

          // Check duplicate media ID in Postgres
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
            // Download image stream from Google baseUrl
            const downloadUrl = `${item.mediaFile.baseUrl}=d`;
            const imageRes = await axios.get(downloadUrl, {
              responseType: 'arraybuffer',
              headers: { Authorization: `Bearer ${accessToken}` },
              timeout: 30000,
            });

            const imageBuffer = Buffer.from(imageRes.data);

            // Upload binary to Supabase Storage 'memory-images'
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

            // Insert into public.memories table
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
              // Roll back storage upload if database insertion fails
              await userClient.storage.from('memory-images').remove([storagePath]).catch(() => {});
              throw new Error(`Database record creation failed: ${dbErr?.message}`);
            }

            // Link to album if albumId provided
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

            // Create signed URL for instant display
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

      // Clean up Google Picker Session
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

  // 6. Delete Picker Session
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
  // Spotify OAuth & Search Endpoints
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

  // ─────────────────────────────────────────────────────────────
  // Static / Vite Middleware Setup
  // ─────────────────────────────────────────────────────────────

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
