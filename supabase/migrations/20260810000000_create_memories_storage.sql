-- ============================================================================
-- Reminiq: Supabase Image Storage & Memories Foundation Migration
-- ============================================================================

-- 1. Create memories table
CREATE TABLE IF NOT EXISTS public.memories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    storage_bucket TEXT NOT NULL DEFAULT 'memory-images',
    storage_path TEXT NOT NULL,
    original_filename TEXT,
    mime_type TEXT NOT NULL,
    file_size BIGINT NOT NULL,
    width INTEGER,
    height INTEGER,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 2. Performance & Query Indexes
CREATE INDEX IF NOT EXISTS idx_memories_user_id_created_at 
    ON public.memories (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_memories_storage_path 
    ON public.memories (storage_path);

-- 3. Automatic updated_at trigger function
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_memories_updated_at ON public.memories;
CREATE TRIGGER set_memories_updated_at
    BEFORE UPDATE ON public.memories
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_updated_at();

-- 4. Enable Row Level Security (RLS) on memories table
ALTER TABLE public.memories ENABLE ROW LEVEL SECURITY;

-- 5. Postgres RLS Policies for public.memories
-- Ensure only authenticated users can access their own memory rows

DROP POLICY IF EXISTS "Users can view their own memories" ON public.memories;
CREATE POLICY "Users can view their own memories"
    ON public.memories
    FOR SELECT
    TO authenticated
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own memories" ON public.memories;
CREATE POLICY "Users can insert their own memories"
    ON public.memories
    FOR INSERT
    TO authenticated
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own memories" ON public.memories;
CREATE POLICY "Users can update their own memories"
    ON public.memories
    FOR UPDATE
    TO authenticated
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own memories" ON public.memories;
CREATE POLICY "Users can delete their own memories"
    ON public.memories
    FOR DELETE
    TO authenticated
    USING (auth.uid() = user_id);

-- 6. Supabase Storage: Create private memory-images bucket
-- File size limit: 20MB (20971520 bytes), restricted to common image MIME types
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'memory-images',
    'memory-images',
    false,
    20971520,
    ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
    public = false,
    file_size_limit = 20971520,
    allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

-- 7. Supabase Storage RLS Policies for memory-images bucket
-- Object path format: {user_id}/{memory_id}/original.{extension}
-- (storage.foldername(name))[1] extracts the root folder name which must match auth.uid()

-- Allow authenticated users to view/download their own images
DROP POLICY IF EXISTS "Allow authenticated users to read own memory images" ON storage.objects;
CREATE POLICY "Allow authenticated users to read own memory images"
    ON storage.objects
    FOR SELECT
    TO authenticated
    USING (
        bucket_id = 'memory-images'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Allow authenticated users to upload to their own user folder
DROP POLICY IF EXISTS "Allow authenticated users to upload own memory images" ON storage.objects;
CREATE POLICY "Allow authenticated users to upload own memory images"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'memory-images'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Allow authenticated users to update their own images
DROP POLICY IF EXISTS "Allow authenticated users to update own memory images" ON storage.objects;
CREATE POLICY "Allow authenticated users to update own memory images"
    ON storage.objects
    FOR UPDATE
    TO authenticated
    USING (
        bucket_id = 'memory-images'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    )
    WITH CHECK (
        bucket_id = 'memory-images'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

-- Allow authenticated users to delete their own images
DROP POLICY IF EXISTS "Allow authenticated users to delete own memory images" ON storage.objects;
CREATE POLICY "Allow authenticated users to delete own memory images"
    ON storage.objects
    FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'memory-images'
        AND auth.uid() IS NOT NULL
        AND (storage.foldername(name))[1] = (auth.uid())::text
    );

-- 8. Seed Confirmed Development User in auth.users and auth.identities
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    created_at,
    updated_at,
    raw_app_meta_data,
    raw_user_meta_data
) VALUES (
    '00000000-0000-0000-0000-000000000000',
    'd0000000-0000-0000-0000-000000000001',
    'authenticated',
    'authenticated',
    'developer@reminiq.local',
    crypt('Password_Reminiq123!', gen_salt('bf')),
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    '{"provider":"email","providers":["email"]}',
    '{}'
) ON CONFLICT (id) DO UPDATE SET
    encrypted_password = crypt('Password_Reminiq123!', gen_salt('bf')),
    email_confirmed_at = timezone('utc'::text, now());

INSERT INTO auth.identities (
    id,
    user_id,
    identity_data,
    provider,
    provider_id,
    last_sign_in_at,
    created_at,
    updated_at
) VALUES (
    'd0000000-0000-0000-0000-000000000001',
    'd0000000-0000-0000-0000-000000000001',
    format('{"sub":"%s","email":"%s"}', 'd0000000-0000-0000-0000-000000000001', 'developer@reminiq.local')::jsonb,
    'email',
    'developer@reminiq.local',
    timezone('utc'::text, now()),
    timezone('utc'::text, now()),
    timezone('utc'::text, now())
) ON CONFLICT (provider, provider_id) DO NOTHING;
