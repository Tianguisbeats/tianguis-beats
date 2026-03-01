-- ==============================================================================
-- 🎫 ACTUALIZACIÓN SISTEMA DE CUPONES (VERSIÓN 2.0)
-- ==============================================================================
-- Este script actualiza la tabla de cupones para soportar segmentación por:
-- 1. Nivel de usuario (Free, Pro, Premium)
-- 2. Tipo de producto (Beats, Kits, Servicios, Suscripciones)
-- 3. Límites de uso y expiración

BEGIN;

-- 1. Agregar las columnas faltantes si no existen
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cupones' AND column_name = 'aplica_a') THEN
        ALTER TABLE public.cupones ADD COLUMN aplica_a TEXT DEFAULT 'todos';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cupones' AND column_name = 'nivel_objetivo') THEN
        ALTER TABLE public.cupones ADD COLUMN nivel_objetivo TEXT DEFAULT 'todos';
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cupones' AND column_name = 'fecha_expiracion') THEN
        ALTER TABLE public.cupones ADD COLUMN fecha_expiracion TIMESTAMPTZ;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cupones' AND column_name = 'usos_maximos') THEN
        ALTER TABLE public.cupones ADD COLUMN usos_maximos INTEGER;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cupones' AND column_name = 'usos_actuales') THEN
        ALTER TABLE public.cupones ADD COLUMN usos_actuales INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Asegurar que los cupones de administrador (productor_id IS NULL)
--    por defecto apliquen solo a suscripciones si no se especifica.
UPDATE public.cupones SET aplica_a = 'suscripciones' WHERE productor_id IS NULL AND aplica_a = 'todos';

-- 3. Habilitar RLS si no está habilitado
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acceso
DROP POLICY IF EXISTS "Permitir lectura pública de cupones" ON public.cupones;
CREATE POLICY "Permitir lectura pública de cupones" 
ON public.cupones FOR SELECT 
USING (true); -- Cualquiera puede leer cupones para validarlos en el carrito

DROP POLICY IF EXISTS "Productores gestionan sus propios cupones" ON public.cupones;
CREATE POLICY "Productores gestionan sus propios cupones" 
ON public.cupones FOR ALL
USING (auth.uid() = productor_id);

DROP POLICY IF EXISTS "Admin gestiona todos los cupones" ON public.cupones;
CREATE POLICY "Admin gestiona todos los cupones" 
ON public.cupones FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE perfiles.id = auth.uid() 
        AND perfiles.es_admin = true
    )
);

COMMIT;
