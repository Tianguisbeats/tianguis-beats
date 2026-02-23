-- =========================================================
-- TIANGUIS BEATS - BASE DE DATOS OPTIMIZADA (1 TABLA)
-- Elimina todo rastro anterior y crea la tabla "transacciones"
-- =========================================================

BEGIN;

-- 1. ELIMINACIÓN DE TABLAS VIEJAS (Inglés y Español)
-- Quitamos políticas y llaves foráneas primero
DROP POLICY IF EXISTS "Users can see own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can see own order items" ON public.order_items;
ALTER TABLE IF EXISTS public.service_projects DROP CONSTRAINT IF EXISTS service_projects_order_item_id_fkey;

-- Borramos las 6 tablas con CASCADE para limpiar dependencias
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.items_orden CASCADE;
DROP TABLE IF EXISTS public.ordenes CASCADE;
DROP TABLE IF EXISTS public.ventas CASCADE;


-- 2. CREACIÓN DE LA NUEVA Y ÚNICA TABLA "transacciones"
CREATE TABLE public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id TEXT, -- ID de Stripe (payment_intent o checkout_session)
    comprador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.profiles(id), -- NULL si es compra de suscripción a la plataforma
    producto_id TEXT NOT NULL, -- ID del Beat (o string 'price_xxx' en suscripciones)
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
CREATE POLICY "Compradores pueden ver sus transacciones" ON public.transacciones FOR SELECT 
USING (auth.uid() = comprador_id);

-- El productor puede ver lo que vendió:
CREATE POLICY "Vendedores pueden ver sus ventas" ON public.transacciones FOR SELECT 
USING (auth.uid() = vendedor_id);

COMMIT;
