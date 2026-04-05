-- ==============================================================================
-- 🛠️ SOLUCIÓN DEFINITIVA: SCHEMA DE TRANSACCIONES Y ACTIVACIÓN
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase para corregir los errores
-- de sincronización que impiden que las compras se registren.

BEGIN;

-- 1. Normalizar nombre de columna de recibo
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transacciones' AND column_name='url_recibo') THEN
        ALTER TABLE public.transacciones RENAME COLUMN url_recibo TO recibo_url;
    END IF;
END $$;

-- 2. Añadir todas las columnas faltantes que usa el código
ALTER TABLE public.transacciones 
ADD COLUMN IF NOT EXISTS orden_pedido TEXT,
ADD COLUMN IF NOT EXISTS codigo_cupon TEXT,
ADD COLUMN IF NOT EXISTS monto_descuento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS producto_uuid UUID,
ADD COLUMN IF NOT EXISTS contract_url TEXT,
ADD COLUMN IF NOT EXISTS recibo_url TEXT, -- Por seguridad si no existía la previa
ADD COLUMN IF NOT EXISTS conteo_descargas INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS ip_descarga TEXT;

-- 3. Asegurar tipos de datos correctos
ALTER TABLE public.transacciones ALTER COLUMN metadatos SET DEFAULT '{}'::jsonb;
ALTER TABLE public.transacciones ALTER COLUMN precio_total TYPE NUMERIC;

-- 4. Verificar Trigger de Fundadores
-- El trigger trg_sync_founder_status debe estar activo sobre la tabla perfiles
-- para que al actualizar la fecha_termino_suscripcion se active el status.

COMMIT;

-- ✅ TABLA ACTUALIZADA. Ahora el Webhook podrá insertar las compras sin errores.
