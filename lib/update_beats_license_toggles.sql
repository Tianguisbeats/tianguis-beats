-- TIANGUIS BEATS: LICENSE TOGGLES UPDATE
-- Este script agrega las columnas para activar/desactivar licencias en la tabla 'beats'.

DO $$ BEGIN
    ALTER TABLE public.beats ADD COLUMN is_mp3_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.beats ADD COLUMN is_wav_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.beats ADD COLUMN is_stems_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.beats ADD COLUMN is_exclusive_active BOOLEAN DEFAULT true;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

-- Actualizar vista para asegurar que se reflejen (si usas vistas)
-- No necesario si consultamos la tabla directa.

SELECT 'License toggles added successfully' as status;
