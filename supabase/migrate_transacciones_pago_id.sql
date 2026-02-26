-- ==========================================
-- 🛠️ MIGRATION: RENAME id_pago_stripe TO pago_id
-- ==========================================

-- 1. Renombrar la columna si existe
DO $$ 
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='transacciones' AND column_name='id_pago_stripe') THEN
        ALTER TABLE public.transacciones RENAME COLUMN id_pago_stripe TO pago_id;
    END IF;
END $$;

-- 2. Asegurar que las políticas de RLS siguen funcionando (no suelen depender del nombre de la columna para la condición de usuario, pero es bueno revisar)
-- Si hay vistas que dependan de esto, se actualizarán automáticamente o fallarán.
-- En nuestro caso, la vista beats_busqueda no usa transacciones.

COMMENT ON COLUMN public.transacciones.pago_id IS 'ID de Stripe (payment_intent o checkout_session)';
