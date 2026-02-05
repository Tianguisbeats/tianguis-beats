-- Create sound_kits_covers bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('sound_kits_covers', 'sound_kits_covers', true)
ON CONFLICT (id) DO NOTHING;

-- Policy to allow public read access
CREATE POLICY "Public Access"
ON storage.objects FOR SELECT
USING ( bucket_id = 'sound_kits_covers' );

-- Policy to allow authenticated uploads for sound kits covers
CREATE POLICY "Authenticated Uploads"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK ( bucket_id = 'sound_kits_covers' );

-- Policy to allow owners to update/delete their covers
CREATE POLICY "Owner Update/Delete"
ON storage.objects FOR UPDATE
TO authenticated
USING ( bucket_id = 'sound_kits_covers' AND auth.uid()::text = (storage.foldername(name))[1] );

CREATE POLICY "Owner Delete"
ON storage.objects FOR DELETE
TO authenticated
USING ( bucket_id = 'sound_kits_covers' AND auth.uid()::text = (storage.foldername(name))[1] );

-- Ensure Realtime if needed (optional for storage)
