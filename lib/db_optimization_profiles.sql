-- TIANGUIS BEATS - OPTIMIZACIÓN DE BASE DE DATOS (PROFILES & SYSTEM STATS)
-- Este script limpia redundancias en la tabla de perfiles y crea una estructura para estadísticas globales.

-- 1. CREAR TABLA DE ESTADÍSTICAS DEL SISTEMA (Para evitar redundancia en Profiles)
CREATE TABLE IF NOT EXISTS public.system_stats (
    id TEXT PRIMARY KEY, -- Ej: 'total_user_counts'
    values JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Insertar valores iniciales si no existen
INSERT INTO public.system_stats (id, values)
VALUES ('global_counters', '{
    "user_num_total": 0,
    "user_num_free": 0,
    "user_num_pro": 0,
    "user_num_prem": 0
}'::jsonb)
ON CONFLICT (id) DO NOTHING;

-- 2. LIMPIEZA DE TABLA PROFILES
-- Eliminamos campos redundantes, duplicados o no estándar según el análisis.
DO $$ 
BEGIN
    -- Eliminar columnas de contadores globales (repetidas en cada fila)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_num_total') THEN
        ALTER TABLE public.profiles DROP COLUMN user_num_total;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_num_free') THEN
        ALTER TABLE public.profiles DROP COLUMN user_num_free;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_num_pro') THEN
        ALTER TABLE public.profiles DROP COLUMN user_num_pro;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='user_num_prem') THEN
        ALTER TABLE public.profiles DROP COLUMN user_num_prem;
    END IF;

    -- Eliminar fechas duplicadas
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fecha_creacion') THEN
        ALTER TABLE public.profiles DROP COLUMN fecha_creacion;
    END IF;

    -- Eliminar campo de suscripción duplicado (usamos subscription_tier)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='subscription') THEN
        ALTER TABLE public.profiles DROP COLUMN subscription;
    END IF;

    -- Renombrar/Consolidar campos de imagen si es necesario
    -- Nota: En la imagen se ve 'portada_perf', lo consolidamos a 'cover_url' si existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='portada_perf') THEN
        -- Si cover_url está vacío, intentamos rescatar el dato de portada_perf
        UPDATE public.profiles SET cover_url = portada_perf WHERE cover_url IS NULL;
        ALTER TABLE public.profiles DROP COLUMN portada_perf;
    END IF;

END $$;

-- 3. AGREGAR CAMPOS FURETOS (ONBOARDING)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;

-- 4. COMENTARIOS PARA DOCUMENTACIÓN
COMMENT ON COLUMN public.profiles.full_name IS 'Nombre legal para contratos PDF';
COMMENT ON COLUMN public.profiles.onboarding_completed IS 'Indica si el usuario completó la configuración inicial';

-- 5. RE-VINCULAR TRIGGER PARA ESTADÍSTICAS (OPCIONAL - PARA FUTURO)
-- Aquí podrías agregar un trigger que actualice system_stats cada vez que entra un usuario nuevo.
