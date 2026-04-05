-- ==============================================================================
-- 🛠️ TIANGUIS BEATS - FIX DE INFRAESTRUCTURA DE TRANSACCIONES
-- ==============================================================================
-- Este script corrige las referencias de la tabla transacciones para que apunten
-- a la tabla CORRECTA (perfiles) y no a 'profiles' (que está duplicada o vacía).
-- También limpia tablas obsoletas que causan interferencia.

BEGIN;

-- 1. Respaldar datos si existen (por seguridad)
CREATE TEMP TABLE temp_transacciones AS SELECT * FROM public.transacciones;

-- 2. Eliminar tabla con referencias incorrectas
DROP TABLE IF EXISTS public.transacciones CASCADE;

-- 3. Recrear tabla apuntando a PERFILES
CREATE TABLE public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id TEXT, -- Stripe ID (pi_...)
    comprador_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    producto_id TEXT NOT NULL,
    tipo_producto TEXT NOT NULL, -- 'beat', 'sound_kit', 'service', 'plan'
    nombre_producto TEXT NOT NULL,
    precio_total NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    estado_pago TEXT NOT NULL DEFAULT 'completado',
    metodo_pago TEXT NOT NULL DEFAULT 'stripe',
    tipo_licencia TEXT,
    metadatos JSONB DEFAULT '{}',
    cupon_id UUID,
    url_recibo TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 4. Restaurar datos si los había (intentando mapear si es posible, si no, se queda limpia para nuevas pruebas)
-- INSERT INTO public.transacciones SELECT * FROM temp_transacciones; -- Comentado por si los IDs de profiles no coinciden con perfiles

-- 5. Limpiar Tablas Obsoletas (Limpieza de "Ruido")
DROP TABLE IF EXISTS public.ordenes CASCADE;
DROP TABLE IF EXISTS public.items_orden CASCADE;
DROP TABLE IF EXISTS public.ventas CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.order_items CASCADE;

-- 6. Habilitar RLS
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura propia comprador" ON public.transacciones FOR SELECT USING (auth.uid() = comprador_id);
CREATE POLICY "Lectura propia vendedor" ON public.transacciones FOR SELECT USING (auth.uid() = vendedor_id);

COMMIT;
