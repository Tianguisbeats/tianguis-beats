
-- REPARACIÓN INTEGRAL DE TABLA TRANSACCIONES
-- Ejecuta este script en el SQL Editor de Supabase para asegurar que todas las columnas existan.

-- 1. Asegurar que la tabla existe con su estructura base
CREATE TABLE IF NOT EXISTS public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id TEXT,
    comprador_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
    producto_id TEXT,
    tipo_producto TEXT,
    nombre_producto TEXT,
    precio_total NUMERIC,
    moneda TEXT DEFAULT 'MXN',
    estado_pago TEXT DEFAULT 'completado',
    metodo_pago TEXT DEFAULT 'stripe',
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 2. Añadir todas las columnas nuevas usadas por el Webhook moderno
ALTER TABLE public.transacciones 
ADD COLUMN IF NOT EXISTS orden_pedido TEXT,
ADD COLUMN IF NOT EXISTS tipo_licencia TEXT,
ADD COLUMN IF NOT EXISTS metadatos JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS cupon_id UUID,
ADD COLUMN IF NOT EXISTS codigo_cupon TEXT,
ADD COLUMN IF NOT EXISTS monto_descuento NUMERIC DEFAULT 0,
ADD COLUMN IF NOT EXISTS producto_uuid UUID;

-- 3. Manejar inconsistencias de nombres de URL (recibo_url / contract_url)
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS recibo_url TEXT;
ALTER TABLE public.transacciones ADD COLUMN IF NOT EXISTS contract_url TEXT;

-- 4. Crear índices para optimizar la carga de "Mis Compras"
CREATE INDEX IF NOT EXISTS idx_transacciones_comprador_id ON public.transacciones(comprador_id);
CREATE INDEX IF NOT EXISTS idx_transacciones_orden_pedido ON public.transacciones(orden_pedido);

-- 5. Asegurar RLS (Seguridad)
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura propia comprador' AND tablename = 'transacciones') THEN
        CREATE POLICY "Lectura propia comprador" ON public.transacciones FOR SELECT USING (auth.uid() = comprador_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Lectura propia vendedor' AND tablename = 'transacciones') THEN
        CREATE POLICY "Lectura propia vendedor" ON public.transacciones FOR SELECT USING (auth.uid() = vendedor_id);
    END IF;
END $$;
