-- ==========================================
-- 🛡️ TIANGUIS BEATS - BLINDAJE ANTI-DUPLICADOS (LIVE READY)
-- ==========================================
-- Este script limpia duplicados de transacciones y asegura que no vuelvan a ocurrir
-- mediante una restricción de unicidad en la columna pago_id.

BEGIN;

-- 1. Limpiar duplicados existentes (deja solo el registro más reciente para cada pago_id)
DELETE FROM public.transacciones
WHERE id IN (
    SELECT id
    FROM (
        SELECT id,
               ROW_NUMBER() OVER (PARTITION BY pago_id ORDER BY fecha_creacion DESC) as row_num
        FROM public.transacciones
        WHERE pago_id IS NOT NULL AND pago_id != ''
    ) t
    WHERE t.row_num > 1
);

-- 2. Añadir restricción UNIQUE para que el sistema falle a nivel DB si hay duplicados
-- Esto permite que el comando 'upsert' de nuestro código funcione correctamente.
ALTER TABLE public.transacciones DROP CONSTRAINT IF EXISTS unique_pago_id;
ALTER TABLE public.transacciones ADD CONSTRAINT unique_pago_id UNIQUE (pago_id);

-- 3. Índice extra para velocidad de búsqueda en dashbpards
CREATE INDEX IF NOT EXISTS idx_transacciones_pago_id ON public.transacciones(pago_id);

COMMIT;
