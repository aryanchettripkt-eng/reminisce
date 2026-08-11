-- ============================================================================
-- Reminiq: Albums and Album-Memories Foundation Migration
-- ============================================================================

-- 1. Create albums table
CREATE TABLE IF NOT EXISTS public.albums (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT 'Untitled Album',
    description TEXT DEFAULT '',
    journal_text TEXT DEFAULT '',
    voice_note_url TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Create album_memories junction table (Many-to-Many relationship)
CREATE TABLE IF NOT EXISTS public.album_memories (
    album_id UUID NOT NULL REFERENCES public.albums(id) ON DELETE CASCADE,
    memory_id UUID NOT NULL REFERENCES public.memories(id) ON DELETE CASCADE,
    position INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    PRIMARY KEY (album_id, memory_id)
);

-- 3. Performance & Ordering Indexes
CREATE INDEX IF NOT EXISTS idx_albums_user_id_created_at 
    ON public.albums (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_album_memories_album_id_pos 
    ON public.album_memories (album_id, position ASC, created_at ASC);

CREATE INDEX IF NOT EXISTS idx_album_memories_memory_id 
    ON public.album_memories (memory_id);

-- 4. Automatic updated_at trigger on public.albums
DROP TRIGGER IF EXISTS set_albums_updated_at ON public.albums;
CREATE TRIGGER set_albums_updated_at
    BEFORE UPDATE ON public.albums
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 5. Enable Row Level Security (RLS)
ALTER TABLE public.albums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.album_memories ENABLE ROW LEVEL SECURITY;

-- 6. Postgres RLS Policies for public.albums
DROP POLICY IF EXISTS "Users can view their own albums" ON public.albums;
CREATE POLICY "Users can view their own albums"
    ON public.albums
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own albums" ON public.albums;
CREATE POLICY "Users can insert their own albums"
    ON public.albums
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own albums" ON public.albums;
CREATE POLICY "Users can update their own albums"
    ON public.albums
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own albums" ON public.albums;
CREATE POLICY "Users can delete their own albums"
    ON public.albums
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 7. Postgres RLS Policies for public.album_memories
-- Ensure strict dual ownership: user must own BOTH the album AND the memory
DROP POLICY IF EXISTS "Users can view their own album memories" ON public.album_memories;
CREATE POLICY "Users can view their own album memories"
    ON public.album_memories
    FOR SELECT
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE albums.id = album_memories.album_id
            AND albums.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can insert their own album memories" ON public.album_memories;
CREATE POLICY "Users can insert their own album memories"
    ON public.album_memories
    FOR INSERT
    TO authenticated
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE albums.id = album_memories.album_id
            AND albums.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.memories
            WHERE memories.id = album_memories.memory_id
            AND memories.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can update their own album memories" ON public.album_memories;
CREATE POLICY "Users can update their own album memories"
    ON public.album_memories
    FOR UPDATE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE albums.id = album_memories.album_id
            AND albums.user_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE albums.id = album_memories.album_id
            AND albums.user_id = auth.uid()
        )
        AND
        EXISTS (
            SELECT 1 FROM public.memories
            WHERE memories.id = album_memories.memory_id
            AND memories.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Users can delete their own album memories" ON public.album_memories;
CREATE POLICY "Users can delete their own album memories"
    ON public.album_memories
    FOR DELETE
    TO authenticated
    USING (
        EXISTS (
            SELECT 1 FROM public.albums
            WHERE albums.id = album_memories.album_id
            AND albums.user_id = auth.uid()
        )
    );
