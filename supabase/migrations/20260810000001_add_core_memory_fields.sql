-- ============================================================================
-- Reminiq: Core Memory Fields, Voice Storage & Safe Backfill Migration
-- ============================================================================

-- 1. Create private 'memory-audio' bucket for persistent voice memos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'memory-audio',
    'memory-audio',
    false,
    20971520, -- 20MB limit
    ARRAY['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['audio/wav', 'audio/webm', 'audio/mpeg', 'audio/ogg', 'audio/mp4', 'audio/x-m4a', 'audio/aac'];

-- 2. Storage RLS Policies for 'memory-audio' bucket
-- Object path format: {user_id}/{memory_id}/original.{extension}

DROP POLICY IF EXISTS "Allow authenticated users to read own memory audio" ON storage.objects;
CREATE POLICY "Allow authenticated users to read own memory audio"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'memory-audio'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

DROP POLICY IF EXISTS "Allow authenticated users to upload own memory audio" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload own memory audio"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'memory-audio'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

DROP POLICY IF EXISTS "Allow authenticated users to update own memory audio" ON storage.objects;
CREATE POLICY "Allow authenticated users to update own memory audio"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'memory-audio'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    )
    WITH CHECK (
        bucket_id = 'memory-audio'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

DROP POLICY IF EXISTS "Allow authenticated users to delete own memory audio" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete own memory audio"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'memory-audio'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

-- 3. Relax NOT NULL on storage columns for text/voice/music memories
ALTER TABLE public.memories
    ALTER COLUMN storage_bucket DROP NOT NULL,
    ALTER COLUMN storage_path DROP NOT NULL,
    ALTER COLUMN mime_type DROP NOT NULL,
    ALTER COLUMN file_size DROP NOT NULL;

-- 4. Add core memory columns with sensible defaults
ALTER TABLE public.memories
    ADD COLUMN IF NOT EXISTS type TEXT DEFAULT 'text',
    ADD COLUMN IF NOT EXISTS title TEXT DEFAULT 'Untitled Moment',
    ADD COLUMN IF NOT EXISTS description TEXT DEFAULT '',
    ADD COLUMN IF NOT EXISTS mood TEXT DEFAULT 'joy',
    ADD COLUMN IF NOT EXISTS location TEXT,
    ADD COLUMN IF NOT EXISTS memory_date TIMESTAMPTZ DEFAULT timezone('utc'::text, now()),
    ADD COLUMN IF NOT EXISTS audio_storage_bucket TEXT DEFAULT 'memory-audio',
    ADD COLUMN IF NOT EXISTS audio_storage_path TEXT,
    ADD COLUMN IF NOT EXISTS music_url TEXT,
    ADD COLUMN IF NOT EXISTS transcript TEXT,
    ADD COLUMN IF NOT EXISTS emotion TEXT,
    ADD COLUMN IF NOT EXISTS music_track JSONB,
    ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}',
    ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT false;

-- 5. Safe Backfill: Ensure all existing rows have valid values
UPDATE public.memories
SET
    type = CASE 
        WHEN storage_path IS NOT NULL THEN 'photo'
        WHEN audio_storage_path IS NOT NULL THEN 'voice'
        WHEN music_track IS NOT NULL THEN 'music'
        ELSE 'text'
    END,
    title = COALESCE(title, original_filename, 'Photo Memory'),
    description = COALESCE(description, ''),
    mood = COALESCE(mood, 'joy'),
    memory_date = COALESCE(memory_date, created_at, timezone('utc'::text, now())),
    tags = COALESCE(tags, '{}'),
    is_favorite = COALESCE(is_favorite, false)
WHERE title IS NULL OR type IS NULL OR memory_date IS NULL;

-- 6. Now enforce NOT NULL constraints on core fields
ALTER TABLE public.memories
    ALTER COLUMN type SET NOT NULL,
    ALTER COLUMN title SET NOT NULL,
    ALTER COLUMN description SET NOT NULL,
    ALTER COLUMN mood SET NOT NULL,
    ALTER COLUMN memory_date SET NOT NULL,
    ALTER COLUMN tags SET NOT NULL,
    ALTER COLUMN is_favorite SET NOT NULL;

-- 7. Add Check Constraint on memory type
ALTER TABLE public.memories
    DROP CONSTRAINT IF EXISTS chk_memory_type;
ALTER TABLE public.memories
    ADD CONSTRAINT chk_memory_type CHECK (type IN ('photo', 'voice', 'text', 'music'));

-- 8. Composite performance index for chronological queries per user
CREATE INDEX IF NOT EXISTS idx_memories_user_id_memory_date 
    ON public.memories (user_id, memory_date DESC);
