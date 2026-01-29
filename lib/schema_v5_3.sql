-- TIANGUIS BEATS - v5.3 Pricing Refinement
-- Actualización para soportar Ventas Exclusivas y diferenciación de planes

-- 1. Agregar columna para precio exclusivo si no existe
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beats' AND column_name='exclusive_price_mxn') THEN
        ALTER TABLE public.beats ADD COLUMN exclusive_price_mxn INTEGER DEFAULT NULL;
    END IF;
END $$;

-- 2. Asegurar que is_exclusive existe (por si acaso)
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='beats' AND column_name='is_exclusive') THEN
        ALTER TABLE public.beats ADD COLUMN is_exclusive BOOLEAN DEFAULT FALSE;
    END IF;
END $$;

-- 3. Comentar para documentación
COMMENT ON COLUMN public.beats.exclusive_price_mxn IS 'Precio para la venta completa del beat (100% derechos).';
COMMENT ON COLUMN public.beats.is_exclusive IS 'Define si el beat está marcado para venta exclusiva (Premium only).';

-- 4. Indice de performance para búsqueda de exclusivos
CREATE INDEX IF NOT EXISTS idx_beats_exclusive ON public.beats(is_exclusive) WHERE is_exclusive = TRUE;
