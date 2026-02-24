-- =========================================================
-- TIANGUIS BEATS - BASE DE DATOS OPTIMIZADA (VERSIÓN FINAL)
-- Elimina tablas viejas (si existen) y crea la tabla "transacciones"
-- =========================================================

BEGIN;

-- 1. LIMPIEZA TOTAL
-- Usamos CASCADE para que borre automáticamente políticas y constraints de las tablas si existen.
-- Si una tabla ya no existe, el IF EXISTS evitará errores.
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.items_orden CASCADE;
DROP TABLE IF EXISTS public.ordenes CASCADE;
DROP TABLE IF EXISTS public.ventas CASCADE;


-- 2. CREACIÓN DE LA NUEVA Y ÚNICA TABLA "transacciones"
-- Esta tabla centraliza todo lo que antes estaba en 6 tablas distintas.
CREATE TABLE IF NOT EXISTS public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id TEXT, -- ID de Stripe (payment_intent o checkout_session)
    comprador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.profiles(id), -- NULL si es suscripción a la plataforma
    producto_id TEXT NOT NULL, -- ID del Beat (o string en suscripciones)
    tipo_producto TEXT NOT NULL, -- 'beat', 'sound_kit', 'service', 'plan'
    nombre_producto TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    estado_pago TEXT NOT NULL DEFAULT 'completado',
    metodo_pago TEXT NOT NULL DEFAULT 'stripe',
    tipo_licencia TEXT, -- 'basic', 'premium', etc (NULL si es plan/servicio)
    metadatos JSONB,
    cupon_id UUID, -- Referencia al cupón si se usó (opcional)
    recibo_url TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar Seguridad (RLS)
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE SEGURIDAD
-- El comprador puede ver lo que compró:
DROP POLICY IF EXISTS "Compradores pueden ver sus transacciones" ON public.transacciones;
CREATE POLICY "Compradores pueden ver sus transacciones" ON public.transacciones FOR SELECT 
USING (auth.uid() = comprador_id);

-- El productor puede ver lo que vendió:
DROP POLICY IF EXISTS "Vendedores pueden ver sus ventas" ON public.transacciones;
CREATE POLICY "Vendedores pueden ver sus ventas" ON public.transacciones FOR SELECT 
USING (auth.uid() = vendedor_id);

COMMIT;
