-- TIANGUIS BEATS - CORRECCIÓN MASIVA Y RENOMBRAMIENTO FINAL (v3)
-- Soluciona errores de carga y aplica nombres en español definitivos.

-- 1. RENOMBRAMIENTO DE COLUMNAS A ESPAÑOL (IDEMPOTENTE)
DO $$ 
BEGIN
    -- [CORRECCIÓN] Asegurar que created_at sea fecha_de_creacion
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles RENAME COLUMN created_at TO fecha_de_creacion;
    END IF;

    -- [CORRECCIÓN] Asegurar que updated_at sea ultima_actualizacion
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles RENAME COLUMN updated_at TO ultima_actualizacion;
    END IF;

    -- [NUEVO] Renombrar avatar_url -> foto_perfil
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles RENAME COLUMN avatar_url TO foto_perfil;
    END IF;

    -- [NUEVO] Renombrar portada_perfil_url -> portada_perfil
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='portada_perfil_url') THEN
        ALTER TABLE public.profiles RENAME COLUMN portada_perfil_url TO portada_perfil;
    END IF;

    -- [NUEVO] Renombrar onboarding_completado -> perfil_completado
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completado') THEN
        ALTER TABLE public.profiles RENAME COLUMN onboarding_completado TO perfil_completado;
    END IF;
    
    -- [NUEVO] Renombrar cover_offset_y -> ajuste_portada (por si no se ejecutó el script anterior)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cover_offset_y') THEN
        ALTER TABLE public.profiles RENAME COLUMN cover_offset_y TO ajuste_portada;
    END IF;

    -- Eliminar columnas obsoletas (si aún existen, por limpieza)
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='role') THEN
        ALTER TABLE public.profiles DROP COLUMN role;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='is_admin') THEN
        ALTER TABLE public.profiles DROP COLUMN is_admin;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='fecha_creacion') THEN
        -- OJO: SOLO si existe 'fecha_de_creacion' Y 'fecha_creacion' (el duplicado antiguo), borramos el duplicado.
        -- Pero como redenominamos 'created_at' a 'fecha_de_creacion', hay que tener cuidado. 
        -- Asumiremos que si existe 'fecha_de_creacion' como columna PRINCIPAL (timestamp with time zone default now()), está bien.
        -- Si existe una columna vieja llamada 'fecha_creacion', la borramos.
        NULL; -- No hacemos nada aquí para evitar borrar la buena por error. Mejor renombrar manually si hubo confusión.
    END IF;

END $$;

-- 2. ASEGURAR COLUMNAS NUEVAS
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ultima_sesion TIMESTAMPTZ;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS perfil_completado BOOLEAN DEFAULT FALSE; -- Si no existía onboarding_completado
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idioma_preferido TEXT DEFAULT 'es';

-- 3. ACTUALIZAR TRIGGER DE REGISTRO
-- Ahora usa los nombres definitivos en español: foto_perfil, fecha_de_creacion
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
    mexico_now TIMESTAMPTZ;
BEGIN
    -- Capturar la hora actual exacta de la Ciudad de México
    mexico_now := now() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City';

    SELECT count(*) INTO found_count FROM public.profiles;
    
    INSERT INTO public.profiles (
        id, 
        username, 
        artistic_name, 
        full_name,
        email, 
        birth_date,
        is_founder,
        fecha_de_creacion,   -- [CORRECCIÓN] Nombre final
        foto_perfil,         -- [CORRECCIÓN] Nombre final (NUEVO)
        ultima_actualizacion -- [CORRECCIÓN] Nombre final
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
        (found_count < 100),
        mexico_now,
        NEW.raw_user_meta_data->>'avatar_url', -- Capturamos el avatar de Google/Auth si existe
        mexico_now
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. COMENTARIOS FINALES
COMMENT ON COLUMN public.profiles.fecha_de_creacion IS 'Fecha de registro (antes created_at)';
COMMENT ON COLUMN public.profiles.foto_perfil IS 'URL de la foto de perfil (antes avatar_url)';
COMMENT ON COLUMN public.profiles.portada_perfil IS 'URL de la portada (antes portada_perfil_url)';
COMMENT ON COLUMN public.profiles.perfil_completado IS 'Si el usuario completó el onboarding (antes onboarding_completado)';
