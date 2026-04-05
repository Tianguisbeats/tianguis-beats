-- ==========================================
-- 🛠️ REPARACIÓN: LLAVE COMPUESTA PARA TRANSACCIONES (MIXED ORDERS READY)
-- ==========================================
-- La restricción anterior de pago_id único impedía órdenes con múltiples productos.
-- Ahora usamos una llave compuesta (pago_id + producto_id) para permitir
-- múltiples artículos por compra pero evitar duplicados exactos.

BEGIN;

-- 1. Eliminar la restricción restrictiva anterior
ALTER TABLE public.transacciones DROP CONSTRAINT IF EXISTS unique_pago_id;
ALTER TABLE public.transacciones DROP CONSTRAINT IF EXISTS transacciones_pago_id_key;

-- 2. Añadir la restricción de llave compuesta
-- Esto permite: (Pago A, Beat 1) y (Pago A, Beat 2)
-- Pero previene: (Pago A, Beat 1) y (Pago A, Beat 1)
ALTER TABLE public.transacciones DROP CONSTRAINT IF EXISTS unique_pago_producto;
ALTER TABLE public.transacciones ADD CONSTRAINT unique_pago_producto UNIQUE (pago_id, producto_id);

COMMIT;
