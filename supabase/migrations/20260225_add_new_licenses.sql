-- Migration: Add MP3 and Sound Kits license columns to beats table
ALTER TABLE public.beats 
ADD COLUMN IF NOT EXISTS es_mp3_activa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS precio_mp3_mxn int DEFAULT 0,
ADD COLUMN IF NOT EXISTS es_soundkit_activa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_soundkit_mxn int DEFAULT 0;

-- Update the search view to include new columns
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

CREATE VIEW public.beats_busqueda AS
SELECT 
    b.*,
    p.nombre_artistico as productor_nombre_artistico,
    p.nombre_usuario as productor_nombre_usuario,
    p.esta_verificado as productor_esta_verificado,
    p.es_fundador as productor_es_fundador,
    p.nivel_suscripcion as productor_nivel_suscripcion,
    p.foto_perfil as productor_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

COMMENT ON COLUMN public.beats.es_mp3_activa IS 'Indica si la licencia MP3 está activa para este beat';
COMMENT ON COLUMN public.beats.precio_mp3_mxn IS 'Precio de la licencia MP3 en MXN';
COMMENT ON COLUMN public.beats.es_soundkit_activa IS 'Indica si la licencia de Sound Kit está activa';
COMMENT ON COLUMN public.beats.precio_soundkit_mxn IS 'Precio de la licencia de Sound Kit en MXN';
