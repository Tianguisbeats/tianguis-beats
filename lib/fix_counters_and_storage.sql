-- 1. Fix Sound Kits Covers Bucket
-- Attempt to insert if not exists
INSERT INTO storage.buckets (id, name, public)
VALUES ('sound_kits_covers', 'sound_kits_covers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies to avoid conflicts during recreation
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated Uploads" ON storage.objects;
DROP POLICY IF EXISTS "Owner Update/Delete" ON storage.objects;
DROP POLICY IF EXISTS "Owner Delete" ON storage.objects;

-- Create Policies (Specific to sound_kits_covers)
CREATE POLICY "Public Access Sound Kits Covers"
ON storage.objects FOR SELECT
USING ( bucket_id = 'sound_kits_covers' );

CREATE POLICY "Authenticated Uploads Sound Kits Covers"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'sound_kits_covers' );

CREATE POLICY "Owner Update Sound Kits Covers"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'sound_kits_covers' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Owner Delete Sound Kits Covers"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'sound_kits_covers' AND auth.uid()::text = (storage.foldername(name))[1] );


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

-- Function to handle likes (toggle) - though frontend logic seems to separate insert/delete
-- Let's just create an incrementer helper if needed, but usually insert/delete on 'likes' table is enough.
-- However, if 'beats' table has a 'like_count' column that needs to be kept in sync, prompts triggers.
-- But user asked to "debug play/like counting". If like_count on beats table isn't updating, we need a trigger.

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
