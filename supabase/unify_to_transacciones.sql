-- =========================================================
-- TIANGUIS BEATS - UNIFICACIÓN DE BASE DE DATOS A 1 TABLA 
-- Crea la tabla "transacciones" y migra datos viejos (Inglés y Español)
-- =========================================================

-- 1. CREACIÓN DE LA TABLA MAESTRA "transacciones"
CREATE TABLE IF NOT EXISTS public.transacciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pago_id TEXT, -- ID de Stripe (payment_intent o checkout_session)
    comprador_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    vendedor_id UUID REFERENCES public.profiles(id), -- NULL si es suscripción
    producto_id UUID NOT NULL, -- ID del Beat, Kit, Servicio o Plan
    tipo_producto TEXT NOT NULL, -- 'beat', 'sound_kit', 'service', 'plan'
    nombre_producto TEXT NOT NULL,
    precio NUMERIC NOT NULL,
    moneda TEXT NOT NULL DEFAULT 'MXN',
    estado_pago TEXT NOT NULL DEFAULT 'completado',
    metodo_pago TEXT NOT NULL DEFAULT 'stripe',
    tipo_licencia TEXT, -- 'basic', 'premium', etc (NULL si es plan/servicio)
    metadatos JSONB,
    cupon_id UUID, -- Referencia al cupón si se usó
    recibo_url TEXT,
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Habilitar RLS (Seguridad)
ALTER TABLE public.transacciones ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad
CREATE POLICY "Users can see own purchases" ON public.transacciones FOR SELECT 
USING (auth.uid() = comprador_id);

CREATE POLICY "Producers can see own sales" ON public.transacciones FOR SELECT 
USING (auth.uid() = vendedor_id);

-- =========================================================
-- 2. MIGRACIÓN DE DATOS - DESDE TABLAS EN INGLÉS (orders, order_items, sales)
-- =========================================================
-- Insertamos cada ítem comprado como una fila independiente.
-- Cruzamos order_items con orders para obtener el comprador y estado.
-- Cruzamos con sales para obtener al vendedor.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'orders') AND 
       EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'order_items') THEN
       
        INSERT INTO public.transacciones (
            id, pago_id, comprador_id, vendedor_id, producto_id, tipo_producto, 
            nombre_producto, precio, moneda, estado_pago, metodo_pago, 
            tipo_licencia, metadatos, cupon_id, fecha_creacion
        )
        SELECT 
            oi.id, -- Mantenemos el ID del item para evitar duplicados si se corre 2 veces
            o.payment_intent_id,
            o.user_id,
            (SELECT seller_id FROM public.sales s WHERE s.beat_id = oi.product_id AND s.buyer_id = o.user_id LIMIT 1), -- Intentamos deducir el vendedor
            oi.product_id,
            oi.product_type,
            oi.name,
            oi.price,
            'MXN',
            o.status,
            'stripe',
            COALESCE(oi.license_type, oi.metadata->>'licenseType', oi.metadata->>'license'),
            oi.metadata,
            NULL, -- no existia cupon en orders viejo
            oi.created_at
        FROM public.order_items oi
        JOIN public.orders o ON oi.order_id = o.id
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- =========================================================
-- 3. MIGRACIÓN DE DATOS - DESDE TABLAS EN ESPAÑOL (ordenes, items_orden)
-- =========================================================
-- Si el usuario ya había nuevas compras en las tablas en español, las move.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'ordenes') AND 
       EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'items_orden') THEN
       
        INSERT INTO public.transacciones (
            id, pago_id, comprador_id, vendedor_id, producto_id, tipo_producto, 
            nombre_producto, precio, moneda, estado_pago, metodo_pago, 
            tipo_licencia, metadatos, cupon_id, recibo_url, fecha_creacion
        )
        SELECT 
            io.id, 
            o.stripe_id,
            o.usuario_id,
            (SELECT vendedor_id FROM public.ventas v WHERE v.beat_id = io.producto_id AND v.comprador_id = o.usuario_id LIMIT 1), 
            io.producto_id,
            io.tipo_producto,
            io.nombre,
            io.precio,
            o.moneda,
            o.estado,
            'stripe',
            io.tipo_licencia,
            io.metadatos,
            o.cupon_id,
            o.recibo_url,
            io.fecha_creacion
        FROM public.items_orden io
        JOIN public.ordenes o ON io.orden_id = o.id
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;

-- NOTA: No borramos las tablas viejas aquí por precaución. 
-- Primero verifica que la tabla "transacciones" tenga todos tus datos correctamente.
