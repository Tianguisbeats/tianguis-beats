-- TIANGUIS BEATS: ADVANCED FEATURES SCHEMA
-- Services Marketplace, Marketing Center (Coupons), and Pro Customization

-- 1. SERVICES TABLE (Marketplace de Servicios)
CREATE TABLE IF NOT EXISTS public.services (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    titulo TEXT NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    tipo_servicio TEXT NOT NULL CHECK (tipo_servicio IN ('mixing', 'mastering', 'beat_custom', 'mentoria', 'sound_kit', 'other')),
    tiempo_entrega_dias INT DEFAULT 3,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS for Services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view active services (Catalog)
CREATE POLICY "Public Services View" ON public.services
    FOR SELECT USING (is_active = true);

-- Policy: Owners can manage their own services
CREATE POLICY "Owners Manage Services" ON public.services
    FOR ALL USING (auth.uid() = user_id);

-- 2. COUPONS TABLE (Marketing Center)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    codigo TEXT NOT NULL, -- Producer defined code e.g. "SUMMER20"
    porcentaje_descuento INT NOT NULL CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    usos_maximos INT, -- NULL requires infinite uses
    usos_actuales INT DEFAULT 0,
    fecha_expiracion TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    model_restriction TEXT DEFAULT 'all', -- 'all', 'beat', 'service'
    CONSTRAINT unique_code_per_user UNIQUE (user_id, codigo) -- Each producer can have their own "SUMMER" code
);

-- RLS for Coupons
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- Policy: Owners can manage their coupons
CREATE POLICY "Owners Manage Coupons" ON public.coupons
    FOR ALL USING (auth.uid() = user_id);

-- Policy: Public can read coupons to validate them (Simplified for MVP, ideally RPC)
CREATE POLICY "Public Validate Coupons" ON public.coupons
    FOR SELECT USING (true); -- Client-side validation for now

-- 3. PROFILES UPDATES (Pro Customization)
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS tema_perfil TEXT DEFAULT 'light' CHECK (tema_perfil IN ('light', 'dark', 'neon', 'minimal')),
ADD COLUMN IF NOT EXISTS color_acento TEXT DEFAULT '#2563eb', -- Default blue-600
ADD COLUMN IF NOT EXISTS video_destacado_url TEXT;

-- 4. FUNCTION TO VALIDATE COUPON (Optional but recommended security)
CREATE OR REPLACE FUNCTION validate_coupon(p_code TEXT, p_producer_id UUID)
RETURNS TABLE (
    valid BOOLEAN,
    discount INT,
    message TEXT
) AS $$
DECLARE
    v_coupon RECORD;
BEGIN
    SELECT * INTO v_coupon FROM public.coupons 
    WHERE codigo = p_code AND user_id = p_producer_id AND is_active = true;

    IF v_coupon IS NULL THEN
        RETURN QUERY SELECT false, 0, 'Cupón no encontrado.';
        RETURN;
    END IF;

    IF v_coupon.fecha_expiracion IS NOT NULL AND v_coupon.fecha_expiracion < NOW() THEN
        RETURN QUERY SELECT false, 0, 'El cupón ha expirado.';
        RETURN;
    END IF;

    IF v_coupon.usos_maximos IS NOT NULL AND v_coupon.usos_actuales >= v_coupon.usos_maximos THEN
        RETURN QUERY SELECT false, 0, 'El cupón ha agotado sus usos.';
        RETURN;
    END IF;

    RETURN QUERY SELECT true, v_coupon.porcentaje_descuento, 'Cupón aplicado correctamente.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
