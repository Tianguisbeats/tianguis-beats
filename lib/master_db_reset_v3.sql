-- TIANGUIS BEATS - MASTER RESET (v3 Definitiva)
-- Resetea la base de datos aplicando TODAS las optimizaciones y nombres en español.
-- Mantiene buckets de almacenamiento (no borra archivos).
-- CUIDADO: BORRA TODOS LOS DATOS DE LAS TABLAS (Usuarios, Beats, Liz, etc).

-- 1. LIMPIEZA TOTAL DE TABLAS (Orden correcto por dependencias)
TRUNCATE TABLE public.playlist_beats CASCADE;
TRUNCATE TABLE public.playlists CASCADE;
TRUNCATE TABLE public.comments CASCADE;
TRUNCATE TABLE public.likes CASCADE;
TRUNCATE TABLE public.listens CASCADE;
TRUNCATE TABLE public.sales CASCADE;
TRUNCATE TABLE public.follows CASCADE;
TRUNCATE TABLE public.beats CASCADE;
TRUNCATE TABLE public.profiles CASCADE;
-- No borramos storage.objects para no perder las imágenes/audios subidos.

-- 2. RECREACIÓN DE TABLA PROFILES (Esquema Oficial Español)
-- Aseguramos que la tabla tenga las columnas con los nombres nuevos.
-- Si la tabla ya existe (que sí), alteramos para garantizar estructura.

DO $$ 
BEGIN
    -- Eliminar columnas viejas si revivieron
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='avatar_url') THEN
        ALTER TABLE public.profiles RENAME COLUMN avatar_url TO foto_perfil;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='created_at') THEN
        ALTER TABLE public.profiles RENAME COLUMN created_at TO fecha_de_creacion;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='updated_at') THEN
        ALTER TABLE public.profiles RENAME COLUMN updated_at TO ultima_actualizacion;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='portada_perfil_url') THEN
        ALTER TABLE public.profiles RENAME COLUMN portada_perfil_url TO portada_perfil;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='onboarding_completado') THEN
        ALTER TABLE public.profiles RENAME COLUMN onboarding_completado TO perfil_completado;
    END IF;
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cover_offset_y') THEN
        ALTER TABLE public.profiles RENAME COLUMN cover_offset_y TO ajuste_portada;
    END IF;
    
    -- Agregar columnas nuevas si faltan (por si acaso)
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS ultima_sesion TIMESTAMPTZ;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS perfil_completado BOOLEAN DEFAULT FALSE;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT;
    ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS idioma_preferido TEXT DEFAULT 'es';
    
END $$;

-- 3. RESETEO DE TRIGGERS DE REGISTRO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
    mexico_now TIMESTAMPTZ;
BEGIN
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
        fecha_de_creacion,   -- Nuevo nombre
        foto_perfil,         -- Nuevo nombre
        ultima_actualizacion -- Nuevo nombre    
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
        (found_count < 100), -- Primeros 100 son Founders
        mexico_now,
        NEW.raw_user_meta_data->>'avatar_url', -- Google manda 'avatar_url' en metadata
        mexico_now
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 4. VINCULACIÓN DE IMÁGENES (Referencia a los Buckets existentes)
-- El usuario confirmó que los buckets son: fotos-perfil, fotos-portada, portadas-beats.
-- No necesitamos crear buckets nuevos, solo asegurar que las políticas permitan acceso (aunque esto usualmente persiste).
-- Reiniciamos las políticas de Storage por seguridad y correcta referencia.

-- (Opcional, si quieres asegurar acceso público)
-- DROP POLICY IF EXISTS "Public Profile Pictures" ON storage.objects;
-- CREATE POLICY "Public Profile Pictures" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-perfil'); 
-- (Repetir para otros buckets si es necesario, pero mejor no tocar si ya funcionan).

-- CONFIRMACIÓN
SELECT 'Sistema reseteado y optimizado a Español' as status;
