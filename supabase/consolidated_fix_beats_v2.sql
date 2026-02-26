-- ==========================================
-- FIX: MISSING BEAT COLUMNS & MUSICAL KEYS
-- ==========================================

-- 1. Add MP3 and Sound Kit license columns
ALTER TABLE public.beats 
ADD COLUMN IF NOT EXISTS es_mp3_activa boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS precio_mp3_mxn int DEFAULT 349,
ADD COLUMN IF NOT EXISTS es_soundkit_activa boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS precio_soundkit_mxn int DEFAULT 499;

-- 2. Unify tono_escala (Musical Keys)
-- Check if column exists, if not add it
ALTER TABLE public.beats ADD COLUMN IF NOT EXISTS tono_escala TEXT;

-- Migrate data if old columns exist
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beats' AND column_name='nota_musical') THEN
        UPDATE public.beats 
        SET tono_escala = CONCAT(nota_musical, ' ', COALESCE(escala_musical, ''))
        WHERE tono_escala IS NULL;
        
        -- Optional: Drop old columns if you want to clean up
        -- ALTER TABLE public.beats DROP COLUMN IF EXISTS nota_musical;
        -- ALTER TABLE public.beats DROP COLUMN IF EXISTS escala_musical;
    END IF;
END $$;

-- 3. Recreate the search view to include ALL columns automatically
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.*,
    p.nombre_artistico as producer_nombre_artistico,
    p.nombre_usuario as producer_nombre_usuario,
    p.esta_verificado as producer_esta_verificado,
    p.es_fundador as producer_es_fundador,
    p.nivel_suscripcion as producer_nivel_suscripcion,
    p.foto_perfil as producer_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

-- Grant permissions
GRANT SELECT ON public.beats_busqueda TO anon, authenticated;

COMMENT ON TABLE public.beats IS 'Tabla de beats con soporte para 5 tiers de licencias y campos unificados.';
