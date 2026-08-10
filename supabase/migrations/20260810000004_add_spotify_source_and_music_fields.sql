-- ============================================================================
-- Reminiq: Spotify Music Source & Metadata Migration
-- ============================================================================

-- 1. Update source check constraint on public.memories to support 'spotify'
ALTER TABLE public.memories
    DROP CONSTRAINT IF EXISTS chk_memory_source;
ALTER TABLE public.memories
    ADD CONSTRAINT chk_memory_source CHECK (source IN ('upload', 'google_photos', 'spotify'));

-- 2. Add provider-neutral index for fast music track lookups by provider track ID
CREATE INDEX IF NOT EXISTS idx_memories_music_provider_track 
    ON public.memories ((music_track->>'providerTrackId')) 
    WHERE music_track IS NOT NULL;

-- 3. Composite index for user music memories
CREATE INDEX IF NOT EXISTS idx_memories_user_source_type
    ON public.memories (user_id, source, type);

-- 4. Server-side Spotify Tokens Table (for secure, persistent user token management)
CREATE TABLE IF NOT EXISTS public.user_spotify_tokens (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    access_token TEXT NOT NULL,
    refresh_token TEXT,
    expires_at BIGINT NOT NULL,
    scope TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Enable RLS on user_spotify_tokens
ALTER TABLE public.user_spotify_tokens ENABLE ROW LEVEL SECURITY;

-- Drop and recreate RLS policies
DROP POLICY IF EXISTS "Users can manage their own Spotify tokens" ON public.user_spotify_tokens;
CREATE POLICY "Users can manage their own Spotify tokens"
    ON public.user_spotify_tokens
    FOR ALL
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
