-- migration: unify_playlists.sql
-- Description: Consolidates playlists and playlist_beats into a single table 'listas_reproduccion' with Spanish column names.

-- 1. Create the new unified table
CREATE TABLE IF NOT EXISTS listas_reproduccion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    playlist_id UUID NOT NULL,                -- Identifier to group beats in the same playlist
    productor_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
    nombre TEXT NOT NULL,
    descripcion TEXT,
    es_publica BOOLEAN DEFAULT true,
    portada_url TEXT,
    indice_orden_playlist INTEGER DEFAULT 0,  -- For ordering playlists in the producer profile
    beat_id UUID REFERENCES beats(id) ON DELETE CASCADE,
    indice_orden_beat INTEGER DEFAULT 0,      -- For ordering beats inside the playlist
    fecha_creacion TIMESTAMPTZ DEFAULT NOW(),
    fecha_adicion_beat TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Migrate data
-- Insert playlists that have beats
INSERT INTO listas_reproduccion (
    playlist_id,
    productor_id,
    nombre,
    descripcion,
    es_publica,
    portada_url,
    indice_orden_playlist,
    beat_id,
    indice_orden_beat,
    fecha_creacion,
    fecha_adicion_beat
)
SELECT 
    p.id as playlist_id,
    p.producer_id as productor_id,
    p.name as nombre,
    p.description as descripcion,
    COALESCE(p.is_public, true) as es_publica,
    p.cover_url as portada_url,
    0 as indice_orden_playlist, -- Default 0 if we don't find it in old table schema easily, or we can check p.order_index if it exists
    pb.beat_id as beat_id,
    pb.order_index as indice_orden_beat,
    p.created_at as fecha_creacion,
    pb.added_at as fecha_adicion_beat
FROM playlists p
JOIN playlist_beats pb ON p.id = pb.playlist_id;

-- Insert playlists that have NO beats (to preserve them)
INSERT INTO listas_reproduccion (
    playlist_id,
    productor_id,
    nombre,
    descripcion,
    es_publica,
    portada_url,
    indice_orden_playlist,
    beat_id,
    indice_orden_beat,
    fecha_creacion
)
SELECT 
    p.id as playlist_id,
    p.producer_id as productor_id,
    p.name as nombre,
    p.description as descripcion,
    COALESCE(p.is_public, true) as es_publica,
    p.cover_url as portada_url,
    0 as indice_orden_playlist,
    NULL as beat_id,
    0 as indice_orden_beat,
    p.created_at as fecha_creacion
FROM playlists p
LEFT JOIN playlist_beats pb ON p.id = pb.playlist_id
WHERE pb.playlist_id IS NULL;

-- 3. Configure RLS (Row Level Security)
ALTER TABLE listas_reproduccion ENABLE ROW LEVEL SECURITY;

-- Policy: Producers can manage their own playlists
DROP POLICY IF EXISTS "Producers can manage their own playlists" ON listas_reproduccion;
CREATE POLICY "Producers can manage their own playlists" 
ON listas_reproduccion 
FOR ALL 
TO authenticated 
USING (auth.uid() = productor_id)
WITH CHECK (auth.uid() = productor_id);

-- Policy: Everyone can view public playlists
DROP POLICY IF EXISTS "Everyone can view public playlists" ON listas_reproduccion;
CREATE POLICY "Everyone can view public playlists" 
ON listas_reproduccion 
FOR SELECT 
USING (es_publica = true);

-- 4. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_listas_reproduccion_productor ON listas_reproduccion(productor_id);
CREATE INDEX IF NOT EXISTS idx_listas_reproduccion_playlist_id ON listas_reproduccion(playlist_id);

-- 5. Final Cleanup: Delete old tables
-- Solo ejecuta esto una vez que hayas verificado que los datos están en listas_reproduccion
DROP TABLE IF EXISTS playlist_beats CASCADE;
DROP TABLE IF EXISTS playlists CASCADE;
