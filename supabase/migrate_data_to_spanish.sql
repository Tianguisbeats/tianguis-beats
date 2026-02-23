-- =========================================================
-- SCRIPT DE MIGRACIÓN DEFINITIVO (v3) - SEGURO
-- Tablas en base a las imágenes de Supabase provistas.
-- =========================================================

-- 1) MIGRAMOS LAS ÓRDENES (Cabecera)
-- Solo usamos insertamos en las columnas estrictamente necesarias
INSERT INTO public.ordenes (
    id, 
    usuario_id, 
    monto_total, 
    estado, 
    fecha_creacion
)
SELECT 
    id, 
    user_id, 
    total_amount, 
    status, 
    created_at
FROM public.orders
ON CONFLICT (id) DO NOTHING;

-- 2) MIGRAMOS LOS ITEMS DE LA ORDEN (Detalle)
-- Coincide exactamente con la imagen de 'items_orden'
INSERT INTO public.items_orden (
    id, 
    orden_id, 
    producto_id, 
    tipo_producto, 
    nombre, 
    precio, 
    tipo_licencia,
    metadatos, 
    fecha_creacion
)
SELECT 
    id, 
    order_id, 
    COALESCE(product_id, '00000000-0000-0000-0000-000000000000'), 
    COALESCE(product_type, 'beat'), 
    COALESCE(name, 'Producto Migrado'), 
    price, 
    COALESCE(metadata->>'licenseType', metadata->>'license', 'basic'),
    metadata, 
    created_at
FROM public.order_items
ON CONFLICT (id) DO NOTHING;

-- 3) MIGRAMOS LAS VENTAS 
-- Coincide exactamente con las imágenes de 'ventas' y 'sales'
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
            created_at
        FROM public.sales
        ON CONFLICT (id) DO NOTHING;
    END IF;
END $$;
