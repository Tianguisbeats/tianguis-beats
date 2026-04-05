-- Upgrade coupons table with advanced rules
-- We will add new columns and keep existing ones temporarily to avoid breaking the current UI
-- during the transition, then we can clean up if needed.

ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS discount_type text DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
ADD COLUMN IF NOT EXISTS discount_value numeric NOT NULL DEFAULT 0,
ADD COLUMN IF NOT EXISTS usage_limit integer DEFAULT NULL,
ADD COLUMN IF NOT EXISTS usage_count integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS target_tier text DEFAULT 'all' CHECK (target_tier IN ('all', 'free', 'pro', 'premium')),
ADD COLUMN IF NOT EXISTS min_purchase numeric DEFAULT 0;

-- Sync existing data to new columns if they exist
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='porcentaje_descuento') THEN
        UPDATE coupons SET discount_value = porcentaje_descuento, discount_type = 'percent' WHERE discount_value = 0;
    END IF;
    
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='usos_maximos') THEN
        UPDATE coupons SET usage_limit = usos_maximos WHERE usage_limit IS NULL;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='usos_actuales') THEN
        UPDATE coupons SET usage_count = usos_actuales WHERE usage_count = 0;
    END IF;

    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='coupons' AND column_name='fecha_expiracion') THEN
        UPDATE coupons SET valid_until = CAST(fecha_expiracion AS timestamp with time zone) WHERE valid_until IS NULL;
    END IF;
END $$;
