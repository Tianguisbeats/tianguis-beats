-- ==============================================================================
-- 🛒 TIANGUIS BEATS - PERSISTENCIA DE CARRITO (CART_ITEMS)
-- ==============================================================================
-- Esta tabla permite que el carrito de un usuario logueado persista
-- a través de diferentes dispositivos y sesiones.
-- ==============================================================================

BEGIN;

-- 1. CREACIÓN DE LA TABLA
CREATE TABLE IF NOT EXISTS public.cart_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    item_id TEXT NOT NULL, -- UUID de Beat, Kit, etc.
    item_type TEXT NOT NULL, -- 'beat', 'license', 'sound_kit', 'service'
    metadata JSONB DEFAULT '{}', -- Para licencias, etc.
    price NUMERIC NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, item_id, item_type) -- Evitar duplicados por accidente
);

-- 2. HABILITAR RLS
ALTER TABLE public.cart_items ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICAS DE ACCESO
DO $$ 
BEGIN
    DROP POLICY IF EXISTS "Usuarios pueden gestionar sus propios items del carrito" ON public.cart_items;
    
    CREATE POLICY "Usuarios pueden gestionar sus propios items del carrito" 
    ON public.cart_items 
    FOR ALL 
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);
END $$;

COMMIT;
