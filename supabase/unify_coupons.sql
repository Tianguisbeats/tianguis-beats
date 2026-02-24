-- migration: unify_coupons.sql
-- Description: Translates coupons table to Spanish 'cupones' and adds scope restriction 'aplica_a'.

-- 1. Create the new cupones table
CREATE TABLE IF NOT EXISTS cupones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    productor_id UUID REFERENCES profiles(id) ON DELETE CASCADE, -- NULL means it's an Admin coupon
    codigo TEXT NOT NULL UNIQUE,
    porcentaje_descuento INTEGER NOT NULL CHECK (porcentaje_descuento > 0 AND porcentaje_descuento <= 100),
    usos_maximos INTEGER, -- NULL means unlimited
    usos_actuales INTEGER DEFAULT 0,
    fecha_expiracion TIMESTAMPTZ, -- NULL means it never expires
    es_activo BOOLEAN DEFAULT true,
    nivel_objetivo TEXT DEFAULT 'todos', -- 'todos', 'gratis', 'pro', 'premium' (or 'gratis', but let's map 'all' -> 'todos' and keep the rest)
    fecha_creacion TIMESTAMPTZ DEFAULT NOW()
);

-- 1.1 Ensure columns exist if table was already created
ALTER TABLE cupones ADD COLUMN IF NOT EXISTS aplica_a TEXT DEFAULT 'todos';
ALTER TABLE cupones ADD COLUMN IF NOT EXISTS nivel_objetivo TEXT DEFAULT 'todos';

-- 2. Migrate data from old coupons table
-- Assuming the old table has: id, user_id, code, discount_value, usage_limit, usage_count, valid_until, is_active, created_at
-- We map user_id -> productor_id. If a user_id doesn't exist in profiles, we assume it's an old admin coupon and set productor_id = NULL
INSERT INTO cupones (
    id,
    productor_id,
    codigo,
    porcentaje_descuento,
    usos_maximos,
    usos_actuales,
    fecha_expiracion,
    es_activo,
    aplica_a,
    nivel_objetivo,
    fecha_creacion
)
SELECT 
    c.id,
    p.id as productor_id,
    UPPER(c.codigo) as codigo,
    c.porcentaje_descuento as porcentaje_descuento,
    c.usos_maximos as usos_maximos,
    COALESCE(c.usos_actuales, 0) as usos_actuales,
    c.fecha_expiracion as fecha_expiracion,
    COALESCE(c.is_active, true) as es_activo,
    CASE WHEN p.id IS NULL THEN 'suscripciones' ELSE 'todos' END as aplica_a,
    CASE 
        WHEN c.model_restriction = 'all' THEN 'todos' 
        WHEN c.model_restriction = 'free' OR c.model_restriction = 'gratis' THEN 'gratis'
        WHEN c.model_restriction = 'pro' THEN 'pro'
        WHEN c.model_restriction = 'premium' THEN 'premium'
        ELSE 'todos' 
    END as nivel_objetivo,
    COALESCE(c.created_at, NOW()) as fecha_creacion
FROM coupons c
LEFT JOIN profiles p ON c.user_id = p.id
ON CONFLICT (id) DO NOTHING;

-- 3. Configure RLS (Row Level Security)
ALTER TABLE cupones ENABLE ROW LEVEL SECURITY;

-- Policy: Producers can manage their own coupons
DROP POLICY IF EXISTS "Producers can manage their own cupones" ON cupones;
CREATE POLICY "Producers can manage their own cupones" 
ON cupones 
FOR ALL 
TO authenticated 
USING (auth.uid() = productor_id)
WITH CHECK (auth.uid() = productor_id);

-- Policy: Everyone can view public active coupons to validate them in cart (Read Only)
DROP POLICY IF EXISTS "Everyone can view active cupones" ON cupones;
CREATE POLICY "Everyone can view active cupones" 
ON cupones 
FOR SELECT 
USING (es_activo = true);

-- Policy: Admins can manage all coupons (Assuming is_founder = true is admin)
DROP POLICY IF EXISTS "Admins can manage all cupones" ON cupones;
CREATE POLICY "Admins can manage all cupones" 
ON cupones 
FOR ALL 
TO authenticated 
USING (
    EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() AND is_founder = true
    )
);

-- 4. Create Index for performance
CREATE INDEX IF NOT EXISTS idx_cupones_productor ON cupones(productor_id);
CREATE INDEX IF NOT EXISTS idx_cupones_codigo ON cupones(codigo);

-- 5. Final Cleanup
DROP TABLE IF EXISTS coupons CASCADE;
