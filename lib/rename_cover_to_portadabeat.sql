-- TIANGUIS BEATS - MIGRACIÓN DE RENOMBRADO DE COLUMNA
-- v1.0 - Renombrar cover_url a portadabeat_url para evitar conflictos con perfiles

DO $$
BEGIN
    if EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'beats' AND column_name = 'cover_url') THEN
        ALTER TABLE public.beats RENAME COLUMN cover_url TO portadabeat_url;
    END IF;
END $$;

-- Asegurar que la columna sea seleccionable para el rol público
GRANT SELECT (portadabeat_url) ON public.beats TO anon, authenticated;
