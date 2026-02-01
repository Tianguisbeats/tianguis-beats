-- TIANGUIS BEATS - SQL DEFINITIVO PARA REGISTRO (CON DATOS LEGALES Y HORA CDMX)
-- Sincroniza Frontend (Signup) con la tabla Profiles

-- 1. ASEGURARNOS QUE LA TABLA TIENE LAS COLUMNAS NECESARIAS
-- (Ejecutamos esto por si acaso no existen)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS full_name TEXT;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS birth_date DATE;

-- 2. ELIMINAMOS EL TRIGGER ANTIGUO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 3. FUNCIÓN DE REGISTRO ACTUALIZADA
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
    mexico_now TIMESTAMPTZ;
BEGIN
    -- Capturar la hora actual en tiempo de Ciudad de México
    mexico_now := now() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City';

    -- Contar para estatus de Founder
    SELECT count(*) INTO found_count FROM public.profiles;
    
    INSERT INTO public.profiles (
        id, 
        username, 
        artistic_name, 
        full_name,
        email, 
        birth_date,
        role,
        is_founder,
        created_at -- Guardamos explícitamente la creación
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name', -- Nombre real para contratos PDF
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
        COALESCE(NEW.raw_user_meta_data->>'role', 'artist'),
        (found_count < 100),
        mexico_now -- Fecha/Hora en horario de México
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en registro: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. RE-ACTIVAR EL DISPARADOR
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
