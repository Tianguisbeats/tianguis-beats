-- =========================================================
-- SCRIPT DE LIMPIEZA DEFINITIVA - ELIMINACIÓN DE TABLAS VIEJAS
-- =========================================================
-- ADVERTENCIA: Este script borrará los datos antiguos en INGLES.
-- ¡Solo ejecuta esto si ya corriste el script de migración y
-- puedes ver tus compras antiguas en el Tianguis Studio!

BEGIN; -- Inicia bloque de transacción segura

-- 1. Eliminación de políticas RLS antiguas
DROP POLICY IF EXISTS "Users can see own orders" ON public.orders;
DROP POLICY IF EXISTS "Users can see own order items" ON public.order_items;

-- 2. Eliminación temporal de llaves foráneas antiguas (Si existen)
ALTER TABLE IF EXISTS public.service_projects DROP CONSTRAINT IF EXISTS service_projects_order_item_id_fkey;

-- 3. Borrado definitivo de las tablas en inglés (Eliminación en cadena segura)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;

COMMIT; -- Fija los cambios de borrado de forma permanente
