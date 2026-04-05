-- ==========================================
-- 🛠️ FIX: UNIQUE CONSTRAINT FOR TRANSACCIONES
-- ==========================================
-- Este script asegura que exista una restricción UNIQUE en pago_id
-- para que las operaciones de upsert del webhook no fallen.

BEGIN;

-- 1. Limpiar duplicados si existen (por si acaso antes de crear el índice)
-- Si hay dos transacciones con el mismo pago_id, nos quedamos con la más reciente.
DELETE FROM public.transacciones a
USING public.transacciones b
WHERE a.id < b.id 
  AND a.pago_id = b.pago_id;

-- 2. Añadir la restricción UNIQUE
ALTER TABLE public.transacciones 
DROP CONSTRAINT IF EXISTS transacciones_pago_id_key;

ALTER TABLE public.transacciones 
ADD CONSTRAINT transacciones_pago_id_key UNIQUE (pago_id);

-- 3. Asegurar que las columnas básicas existen
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS orden_pedido TEXT;

COMMIT;
