-- TIANGUIS BEATS - OPTIMIZACIÓN QUIRÚRGICA DE PROFILES (v2)
-- Unifica campos de fecha a español, elimina redundancias y prepara para el futuro.

-- 1. LIMPIEZA Y RENOMBRAMIENTO DE COLUMNAS
DO $$ 
BEGIN
    -- Eliminar columnas obsoletas confirmadas por el usuario
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles DROP COLUMN role;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE public.profiles DROP COLUMN is_admin;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fecha_creacion') THEN
        ALTER TABLE public.profiles DROP COLUMN fecha_creacion;
    END IF;

    -- Renombrar fechas a Español para mayor claridad
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles RENAME COLUMN created_at TO fecha_de_creacion;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles RENAME COLUMN updated_at TO ultima_actualizacion;
    END IF;

END $$;

-- 2. AGREGAR CAMPOS PARA EL FUTURO
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN DEFAULT FALSE;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idioma_preferido TEXT DEFAULT 'es';

-- 3. ACTUALIZAR TRIGGER DE REGISTRO PARA COMPATIBILIDAD
-- Ahora el trigger debe apuntar a 'fecha_de_creacion' en lugar de 'created_at'
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
    mexico_now TIMESTAMPTZ;
BEGIN
    -- Capturar la hora actual exacta de la Ciudad de México
    mexico_now := now() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City';

    -- NOTA: Mantenemos los contadores user_num ya que el usuario los usa para sus propios procesos
    SELECT count(*) INTO found_count FROM public.profiles;
    
    INSERT INTO public.profiles (
        id, 
        username, 
        artistic_name, 
        full_name,
        email, 
        birth_date,
        is_founder,
        fecha_de_creacion -- Nombre de columna actualizado
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
        (found_count < 100),
        mexico_now
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. DOCUMENTACIÓN
COMMENT ON COLUMN public.profiles.fecha_de_creacion IS 'Fecha de registro del usuario (Horario CDMX)';
COMMENT ON COLUMN public.profiles.ultima_actualizacion IS 'Última vez que se modificó el perfil';
COMMENT ON COLUMN public.profiles.onboarding_completado IS 'Indica si el usuario completó la configuración inicial';
