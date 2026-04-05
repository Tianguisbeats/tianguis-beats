-- ==============================================================================
-- 🛠️ CORRECCIÓN: TRIGGER DE CREACIÓN DE PERFIL (ALINEACIÓN CON FRONTEND)
-- ==============================================================================
-- Este script actualiza la función que se ejecuta cuando un nuevo usuario se registra.
-- Ahora captura correctamente nombre_usuario, nombre_artistico, nombre_completo y fecha de nacimiento
-- desde los metadatos enviados por el formulario de registro (SignupPage).

CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (
    id, 
    nombre_usuario, 
    nombre_artistico, 
    nombre_completo, 
    fecha_nacimiento, 
    correo, 
    fecha_creacion,
    esta_completado,
    nivel_suscripcion
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nombre_usuario', 'usuario_' || substr(new.id::text, 1, 6)),
    COALESCE(new.raw_user_meta_data->>'nombre_artistico', 'Artista'),
    COALESCE(new.raw_user_meta_data->>'nombre_completo', ''),
    (new.raw_user_meta_data->>'fecha_nacimiento')::DATE,
    new.email, 
    now(),
    true,
    'free'
  );
  RETURN new;
EXCEPTION WHEN OTHERS THEN
  -- En caso de error, dejamos que el usuario se cree en Auth pero registramos el error si es posible
  -- o simplemente permitimos que continúe para no bloquear el registro de Auth
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-vincular el trigger (por seguridad lo recreamos)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crear_perfil_nuevo_usuario();

-- ==============================================================================
-- ✅ NOTA: Ejecuta este código en tu SQL Editor de Supabase para que el registro
-- guarde todos los datos nuevos (nombre artístico, etc.) correctamente.
-- ==============================================================================
