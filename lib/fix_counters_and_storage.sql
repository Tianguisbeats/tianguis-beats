-- 1. Fix Sound Kits Covers Bucket (Restricted User Folders)
-- Attempt to insert if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('sound_kits_covers', 'sound_kits_covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts during recreation
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update/Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;
DROP POLICY IF EXISTS "Public Access Sound Kits Covers" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads Sound Kits Covers" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update Sound Kits Covers" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete Sound Kits Covers" ON storage.objects;

-- Create Policies (Specific to sound_kits_covers with User Folder Enforcement)
-- 1. PUBLIC READ: Allow anyone to read
CREATE POLICY "Public Access Sound Kits Covers"
ON storage.objects FOR SELECT
USING ( bucket_id = 'sound_kits_covers' );

-- 2. AUTH UPLOAD: Allow upload ONLY to user's own folder
CREATE POLICY "Authenticated Uploads Sound Kits Covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    bucket_id = 'sound_kits_covers' 
    AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 3. OWNER UPDATE: Allow update ONLY if user owns folder
CREATE POLICY "Owner Update Sound Kits Covers"
ON storage.objects FOR UPDATE
TO authenticated
USING ( 
    bucket_id = 'sound_kits_covers' 
    AND (storage.foldername(name))[1] = auth.uid()::text 
);

-- 4. OWNER DELETE: Allow delete ONLY if user owns folder
CREATE POLICY "Owner Delete Sound Kits Covers"
ON storage.objects FOR DELETE
TO authenticated
USING ( 
    bucket_id = 'sound_kits_covers' 
    AND (storage.foldername(name))[1] = auth.uid()::text 
);


-- 2. Fix Play/Like Counters (RPC Functions to bypass RLS)
-- Drop if exists to ensure clean state
DROP FUNCTION IF EXISTS public.increment_play_count(uuid);
DROP FUNCTION IF EXISTS public.increment_like_count(uuid, uuid);

-- Function to increment play count
CREATE OR REPLACE FUNCTION public.increment_play_count(beat_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER -- Runs with privileges of the creator (postgres/admin)
AS $$
BEGIN
  UPDATE public.beats
  SET play_count = COALESCE(play_count, 0) + 1
  WHERE id = beat_id;
END;
$$;

-- Trigger to update like_count on Beats table when a Like is added/removed
CREATE OR REPLACE FUNCTION public.update_beat_like_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.beats
    SET like_count = like_count + 1
    WHERE id = NEW.beat_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.beats
    SET like_count = GREATEST(like_count - 1, 0)
    WHERE id = OLD.beat_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger if exists to avoid duplication
DROP TRIGGER IF EXISTS trg_update_beat_like_count ON public.likes;

-- Create trigger
CREATE TRIGGER trg_update_beat_like_count
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW
EXECUTE FUNCTION public.update_beat_like_count();
