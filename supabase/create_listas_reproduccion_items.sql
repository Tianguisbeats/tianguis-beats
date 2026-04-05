-- Create the missing 'listas_reproduccion_items' table

CREATE TABLE IF NOT EXISTS public.listas_reproduccion_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    playlist_id UUID NOT NULL REFERENCES public.listas_reproduccion(id) ON DELETE CASCADE,
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    indice_orden INTEGER NOT NULL DEFAULT 0,
    fecha_agregado TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(playlist_id, beat_id) -- A beat shouldn't be twice in the same playlist usually
);

-- Enable RLS
ALTER TABLE public.listas_reproduccion_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist to avoid 42710 error
DROP POLICY IF EXISTS "Users can view public playlist items" ON public.listas_reproduccion_items;
DROP POLICY IF EXISTS "Users can manage items of their own playlists" ON public.listas_reproduccion_items;

-- Policies for listas_reproduccion_items
-- View items: Users can view items if the parent playlist is public or if they own it
CREATE POLICY "Users can view public playlist items" 
ON public.listas_reproduccion_items FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.listas_reproduccion pl 
        WHERE pl.id = listas_reproduccion_items.playlist_id 
        AND (pl.es_publica = true OR pl.usuario_id = auth.uid())
    )
);

-- Insert/Update/Delete items: Only playlist owner can modify
CREATE POLICY "Users can manage items of their own playlists" 
ON public.listas_reproduccion_items FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.listas_reproduccion pl 
        WHERE pl.id = listas_reproduccion_items.playlist_id 
        AND pl.usuario_id = auth.uid()
    )
);

-- Add index for performance on fetching items by playlist
CREATE INDEX IF NOT EXISTS idx_playlist_items_playlist_id ON public.listas_reproduccion_items(playlist_id);
