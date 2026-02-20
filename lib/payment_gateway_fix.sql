-- =========================================================
-- TIANGUIS BEATS - PAYMENT GATEWAY INTEGRATION (v6.1)
-- =========================================================

-- 1) ACTUALIZAR TABLA SALES PARA SOPORTAR PAGOS REALES
-- Añadimos campos para rastrear la pasarela y el ID de transacción.
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS payment_id TEXT, -- ID de Stripe/PayPal
ADD COLUMN IF NOT EXISTS payment_method TEXT DEFAULT 'credit_card', -- 'stripe', 'paypal'
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed'; -- 'completed', 'pending', 'refunded'

-- 2) ACTUALIZAR TABLA ORDERS PARA VÍNCULO CON CUPONES
-- Importante para saber qué cupón se usó en qué orden.
ALTER TABLE public.orders
ADD COLUMN IF NOT EXISTS coupon_id UUID REFERENCES public.coupons(id) ON DELETE SET NULL;

-- 3) POLÍTICAS DE RLS PARA ORDERS (Asegurar que el usuario solo vea sus compras)
-- (Ya existen algunas en migrations previas, pero reforzamos)
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'orders' AND policyname = 'Users can see own orders'
    ) THEN
        CREATE POLICY "Users can see own orders" ON public.orders FOR SELECT USING (auth.uid() = user_id);
    END IF;
END $$;

-- 4) VISTA DE CONSOLIDACIÓN (Para el Dashboard del Productor)
-- Si el sistema usa 'sales', nos aseguramos que refleje tanto ventas de beats como de servicios.
-- (Opcional, pero recomendado en el futuro)
