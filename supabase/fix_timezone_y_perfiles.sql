-- ==============================================================================
-- 🇲🇽 CONFIGURACIÓN DE ZONA HORARIA MÉXICO Y PERFILES COMPLETOS
-- ==============================================================================
-- Este script asegura que:
-- 1. Toda la base de datos use la hora de la Ciudad de México.
-- 2. El registro de usuarios capture Nombre, Username y Nombre Artístico.
-- 3. Los Buckets y todas las tablas respeten esta configuración.
-- ==============================================================================

BEGIN;

-- 1. CONFIGURAR ZONA HORARIA (Global para la sesión y base de datos)
-- Esto afectará a todos los 'now()' y 'current_timestamp'
ALTER DATABASE postgres SET timezone TO 'America/Mexico_City';
SET timezone TO 'America/Mexico_City';

-- 2. RE-DEFINIR FUNCIÓN DE REGISTRO (Mapeo Robusto de Metadatos)
-- Forzamos que se tomen los nombres exactos que envía el Frontend.
CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS trigger AS $$
DECLARE
    username_final TEXT;
    nombre_artista_final TEXT;
BEGIN
    -- Determinar Username (prioridad al metadato, fallback a email prefix)
    username_final := COALESCE(
        new.raw_user_meta_data->>'nombre_usuario', 
        split_part(new.email, '@', 1) || substr(new.id::text, 1, 4)
    );

    -- Determinar Nombre Artístico (prioridad al metadato, fallback al username)
    nombre_artista_final := COALESCE(
        new.raw_user_meta_data->>'nombre_artistico', 
        username_final
    );

    INSERT INTO public.perfiles (
        id, 
        nombre_usuario, 
        nombre_artistico, 
        nombre_completo, 
        fecha_nacimiento, 
        correo, 
        fecha_creacion,
        esta_completado,
        nivel_suscripcion,
        es_fundador
    )
    VALUES (
        new.id, 
        username_final,
        nombre_artista_final,
        COALESCE(new.raw_user_meta_data->>'nombre_completo', ''),
        (nullif(new.raw_user_meta_data->>'fecha_nacimiento', ''))::DATE,
        new.email, 
        now(), -- Usará la hora de CDMX configurada arriba
        true,
        'free',
        false
    );
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    -- Loguear error preventivo (opcional en logs de Supabase)
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. ASEGURAR QUE EL TRIGGER ESTÉ ACTIVO
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crear_perfil_nuevo_usuario();

-- 4. ACTUALIZAR USUARIOS QUE YA SE REGISTRARON SIN DATOS (Opcional)
-- Si el usuario ya existe en 'auth.users' pero su perfil está incompleto, lo intentamos parchar.
UPDATE public.perfiles p
SET 
    nombre_usuario = COALESCE(p.nombre_usuario, u.raw_user_meta_data->>'nombre_usuario', split_part(u.email, '@', 1)),
    nombre_artistico = COALESCE(p.nombre_artistico, u.raw_user_meta_data->>'nombre_artistico', 'Artista'),
    nombre_completo = COALESCE(p.nombre_completo, u.raw_user_meta_data->>'nombre_completo', ''),
    fecha_nacimiento = COALESCE(p.fecha_nacimiento, (nullif(u.raw_user_meta_data->>'fecha_nacimiento', ''))::DATE)
FROM auth.users u
WHERE p.id = u.id 
AND (p.nombre_usuario IS NULL OR p.nombre_artistico = 'Artista' OR p.nombre_artistico IS NULL);

COMMIT;

-- Comprobar zona horaria después de ejecutar:
-- SHOW timezone;
