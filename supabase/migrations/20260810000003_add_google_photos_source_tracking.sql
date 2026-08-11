-- ============================================================================
-- Reminiq: Google Photos Source Tracking & Duplicate Prevention Migration
-- ============================================================================

-- 1. Add google_photos_media_id and source columns to public.memories
ALTER TABLE public.memories
    ADD COLUMN IF NOT EXISTS google_photos_media_id TEXT,
    ADD COLUMN IF NOT EXISTS source TEXT DEFAULT 'upload';

-- 2. Add check constraint on source column
ALTER TABLE public.memories
    DROP CONSTRAINT IF EXISTS chk_memory_source;
ALTER TABLE public.memories
    ADD CONSTRAINT chk_memory_source CHECK (source IN ('upload', 'google_photos'));

-- 3. Composite unique index per user to prevent duplicate imports of the same Google Photo
-- Note: Partial index applies only when google_photos_media_id IS NOT NULL,
-- leaving regular manual uploads unrestricted.
CREATE UNIQUE INDEX IF NOT EXISTS idx_memories_user_google_media_id 
    ON public.memories (user_id, google_photos_media_id) 
    WHERE google_photos_media_id IS NOT NULL;
