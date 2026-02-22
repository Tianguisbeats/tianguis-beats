-- =========================================================
-- 0) TABLAS EXTERNAS REQUERIDAS (Profiles)
-- Asegúrate de que tu tabla 'profiles' tenga estos campos:
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;
-- ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS termina_suscripcion TIMESTAMPTZ;

-- 1) TABLA DE ÓRDENES (Cabecera)
CREATE TABLE IF NOT EXISTS public.ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    usuario_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    monto_total NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN', -- Nuevo: Soporte multi-moneda
    estado TEXT NOT NULL DEFAULT 'completado', 
    stripe_id TEXT, 
    cupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL,
    recibo_url TEXT, -- Nuevo: Link al recibo de Stripe
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2) TABLA DE ITEMS DE ORDEN (Detalle)
CREATE TABLE IF NOT EXISTS public.items_orden (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    orden_id UUID NOT NULL REFERENCES public.ordenes(id) ON DELETE CASCADE,
    producto_id UUID NOT NULL, -- ID del beat, kit, servicio, etc.
    tipo_producto TEXT NOT NULL, -- 'beat', 'sound_kit', 'service', 'plan'
    nombre TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    tipo_licencia TEXT, -- Opcional: 'MP3', 'WAV', etc.
    metadatos JSONB,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3) TABLA DE VENTAS (Para Dashboard de Productores)
CREATE TABLE IF NOT EXISTS public.ventas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    comprador_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    vendedor_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    beat_id UUID REFERENCES public.beats(id) ON DELETE SET NULL,
    monto NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN', -- Nuevo: Soporte multi-moneda
    tipo_licencia TEXT,
    pago_id TEXT, 
    metodo_pago TEXT DEFAULT 'stripe',
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4) POLÍTICAS DE SEGURIDAD (RLS)
ALTER TABLE public.ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.items_orden ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ventas ENABLE ROW LEVEL SECURITY;

-- Órdenes: El usuario solo ve sus propias compras
DROP POLICY IF EXISTS "Usuarios ven sus propias ordenes" ON public.ordenes;
CREATE POLICY "Usuarios ven sus propias ordenes" ON public.ordenes 
FOR SELECT USING (auth.uid() = usuario_id);

-- Items: El usuario ve los items de sus ordenes
DROP POLICY IF EXISTS "Usuarios ven items de sus ordenes" ON public.items_orden;
CREATE POLICY "Usuarios ven items de sus ordenes" ON public.items_orden 
FOR SELECT USING (EXISTS (SELECT 1 FROM public.ordenes WHERE id = orden_id AND usuario_id = auth.uid()));

-- Ventas: El productor solo ve sus propias ventas
DROP POLICY IF EXISTS "Vendedores ven sus propias ventas" ON public.ventas;
CREATE POLICY "Vendedores ven sus propias ventas" ON public.ventas 
FOR SELECT USING (auth.uid() = vendedor_id);

-- 5) RPC PARA INCREMENTAR USO DE CUPONES
CREATE OR REPLACE FUNCTION public.incrementar_uso_cupon(cupon_uuid UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.coupons
    SET usage_count = COALESCE(usage_count, 0) + 1,
        usos_actuales = COALESCE(usos_actuales, 0) + 1
    WHERE id = cupon_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
