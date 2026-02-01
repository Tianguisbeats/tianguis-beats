-- TIANGUIS BEATS: ACTIVACIÓN DE PLAYLIST PARA USUARIO
-- Permite a los productores organizar sus beats en colecciones/playlists.

-- 1. Crear Tabla de Playlists
CREATE TABLE IF NOT EXISTS public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Crear Tabla de Relación (Beats en Playlist)
CREATE TABLE IF NOT EXISTS public.playlist_beats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE NOT NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    order_index INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(playlist_id, beat_id)
);

-- 3. Row Level Security (RLS)
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_beats ENABLE ROW LEVEL SECURITY;

-- Políticas para Playlists
CREATE POLICY "Playlists publicas visibles por todos" ON public.playlists 
FOR SELECT USING (is_public = true);

CREATE POLICY "Duenos pueden gestionar sus playlists" ON public.playlists 
FOR ALL USING (auth.uid() = producer_id);

-- Políticas para Playlist Beats
CREATE POLICY "Contenido de playlists visible por todos" ON public.playlist_beats 
FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.playlists 
        WHERE id = public.playlist_beats.playlist_id 
        AND is_public = true
    )
);

CREATE POLICY "Duenos pueden gestionar beats en sus playlists" ON public.playlist_beats 
FOR ALL USING (
    EXISTS (
        SELECT 1 FROM public.playlists 
        WHERE id = public.playlist_beats.playlist_id 
        AND producer_id = auth.uid()
    )
);

-- 4. Indices para Performance
CREATE INDEX IF NOT EXISTS idx_playlists_producer ON public.playlists(producer_id);
CREATE INDEX IF NOT EXISTS idx_playlist_beats_relation ON public.playlist_beats(playlist_id, beat_id);
