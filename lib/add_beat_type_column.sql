-- Script para añadir la columna 'reference_artist' (Beat Type) a la tabla 'beats'
-- Copia y corre este script en el Editor SQL de Supabase

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM information_schema.columns
        WHERE table_schema = 'public'
        AND table_name = 'beats'
        AND column_name = 'reference_artist'
    ) THEN
        ALTER TABLE public.beats
        ADD COLUMN reference_artist TEXT;
    END IF;
END $$;

-- Opcional: Crear índice para búsquedas por referencia
CREATE INDEX IF NOT EXISTS idx_beats_reference_artist ON public.beats(reference_artist);

-- Comentario explicativo
COMMENT ON COLUMN public.beats.reference_artist IS 'Almacena el campo Beat Type (Artist Type) ej. Junior H, Travis Scott';
