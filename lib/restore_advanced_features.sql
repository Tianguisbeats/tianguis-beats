-- TIANGUIS BEATS: RESTORE ADVANCED FEATURES
-- Este script restaura las tablas y columnas necesarias para Servicios, Cupones y Personalización de Perfil.
-- Ejecutar en el Editor SQL de Supabase.

-- 1. MARKETPLACE DE SERVICIOS
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

ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Public Services View" ON public.services FOR SELECT USING (is_active = true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Owners Manage Services" ON public.services FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- 2. CUPONES (MARKETING CENTER)
CREATE TABLE IF NOT EXISTS public.coupons (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    codigo TEXT NOT NULL, 
    porcentaje_descuento INT NOT NULL CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    usos_maximos INT, -- NULL = Ilimitado
    usos_actuales INT DEFAULT 0,
    fecha_expiracion TIMESTAMPTZ,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    model_restriction TEXT DEFAULT 'all',
    CONSTRAINT unique_code_per_user UNIQUE (user_id, codigo)
);

ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    CREATE POLICY "Owners Manage Coupons" ON public.coupons FOR ALL USING (auth.uid() = user_id);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
    CREATE POLICY "Public Validate Coupons" ON public.coupons FOR SELECT USING (true);
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;


-- 3. ACTUALIZACIONES DE PERFIL (PERSONALIZACIÓN)
DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN tema_perfil TEXT DEFAULT 'light';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN color_acento TEXT DEFAULT '#2563eb';
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;

DO $$ BEGIN
    ALTER TABLE public.profiles ADD COLUMN video_destacado_url TEXT;
EXCEPTION
    WHEN duplicate_column THEN NULL;
END $$;


-- 4. FUNCIÓN DE VALIDACIÓN DE CUPONES
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

SELECT 'Funcionalidades avanzadas restauradas correctamente' as status;
