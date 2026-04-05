-- ==============================================================================
-- 🛠️ TIANGUIS BEATS - ADICIÓN DE COLUMNAS FALTANTES EN TRANSACCIONES
-- ==============================================================================
-- Este script añade las columnas necesarias para el correcto funcionamiento del
-- webhook de Stripe y la visualización de contratos/cupones en My Purchases.

BEGIN;

-- 1. Arreglar inconsistencia de recibo_url / url_recibo
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transacciones' AND column_name='url_recibo') THEN
        ALTER TABLE public.transacciones RENAME COLUMN url_recibo TO recibo_url;
    END IF;
END $$;

-- 2. Añadir columnas faltantes si no existen
ALTER TABLE public.transacciones 
ADD COLUMN IF NOT EXISTS contract_url TEXT,
ADD COLUMN IF NOT EXISTS codigo_cupon TEXT,
ADD COLUMN IF NOT EXISTS monto_descuento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS producto_uuid UUID;

-- 3. Asegurar que recibo_url existe (por si se borró o no existía url_recibo)
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS recibo_url TEXT;

-- 4. Actualizar metadatos default
ALTER TABLE public.transacciones ALTER COLUMN metadatos SET DEFAULT '{}'::jsonb;

COMMIT;
