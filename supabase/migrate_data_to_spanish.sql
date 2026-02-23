-- =========================================================
-- SCRIPT DE MIGRACIÓN CORREGIDO (v2)
-- Inglés a Español (orders -> ordenes, sales -> ventas)
-- =========================================================
-- Este script copia los datos viejos a las tablas nuevas
-- Evitando errores de columnas faltantes como "currency".

-- 1) MIGRAMOS LAS ÓRDENES (Cabecera)
INSERT INTO public.ordenes (
    id, 
    usuario_id, 
    monto_total, 
    moneda, 
    estado, 
    stripe_id, 
    cupon_id, 
    fecha_creacion
)
SELECT 
    id, 
    user_id, 
    total_amount, 
    'MXN', -- Moneda por defecto para órdenes antiguas
    status, 
    payment_intent_id, -- Era payment_intent_id en inglés
    NULL, -- No existía coupon_id en el schema original 
    created_at
FROM public.orders
ON CONFLICT (id) DO NOTHING;


-- 2) MIGRAMOS LOS ITEMS DE LA ORDEN (Detalle)
INSERT INTO public.items_orden (
    id, 
    orden_id, 
    producto_id, 
    tipo_producto, 
    nombre, 
    precio, 
    metadatos, 
    fecha_creacion,
    tipo_licencia
)
SELECT 
    id, 
    order_id, 
    COALESCE(product_id, '00000000-0000-0000-0000-000000000000'), 
    COALESCE(product_type, 'beat'), 
    COALESCE(name, 'Producto Migrado'), 
    price, 
    metadata, 
    created_at,
    COALESCE(metadata->>'licenseType', metadata->>'license', 'basic') 
FROM public.order_items
ON CONFLICT (id) DO NOTHING;


-- 3) MIGRAMOS LAS VENTAS (Para Dashboard de Productores)
-- Si la tabla 'sales' vieja no existe o tiene otros nombres, esto podría fallar, 
-- pero usamos las columnas básicas conocidas.
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'sales') THEN
        INSERT INTO public.ventas (
            id, 
            comprador_id, 
            vendedor_id, 
            beat_id, 
            monto, 
            moneda, 
            tipo_licencia, 
            pago_id, 
            metodo_pago, 
            ganancia_neta, 
            fecha_creacion
        )
        SELECT 
            id, 
            buyer_id, 
            seller_id, 
            beat_id, 
            amount, 
            'MXN', 
            license_type, 
            NULL, -- payment_intent_id o stripe_payment_id (evitamos error dejándolo nulo)
            'stripe', 
            GREATEST((amount * 0.90) - ((amount * 0.036 + 3) * 1.16), 0), -- Ganancia neta calculada
            created_at
        FROM public.sales
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
