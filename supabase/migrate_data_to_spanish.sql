-- =========================================================
-- SCRIPT DE MIGRACIÓN: Tabla en Inglés a Tabla en Español
-- =========================================================
-- Dado que el frontend del Studio ahora lee las tablas `ordenes`, `items_orden` y `ventas`, 
-- necesitas migrar tu historial antiguo para que vuelva a ser visible en "Mis Compras" y "Estadísticas".

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
    currency, 
    status, 
    stripe_payment_id, -- El ID de Stripe antes solia llamarse asi o quiza stripe_id
    coupon_id, 
    created_at
FROM public.orders
ON CONFLICT (id) DO NOTHING;


-- 2) MIGRAMOS LOS ITEMS DE LA ORDEN (Detalle)
-- Asumimos que `order_items` existía con campos `name`, `price`, `product_type`, etc.
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
    COALESCE(currency, 'MXN'), 
    license_type, 
    stripe_payment_id, 
    COALESCE(payment_method, 'stripe'), 
    (amount * 0.90) - ((amount * 0.036 + 3) * 1.16), -- Formula aproximada de ganancia neta anterior
    created_at
FROM public.sales
ON CONFLICT (id) DO NOTHING;

-- Notificación de éxito:
-- Si estás corriendo esto en Supabase, debe decir "SUCCESS" o "DO NOTHING" si ya existían.
