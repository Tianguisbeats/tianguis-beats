-- Corregir el disparador para guardar todos los metadatos del usuario al registrarse
-- Ejecutar este script en el editor SQL de Supabase

CREATE OR REPLACE FUNCTION public.crear_perfil_nuevo_usuario()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.perfiles (
    id, 
    nombre_usuario, 
    nombre_completo,
    nombre_artistico,
    fecha_nacimiento,
    correo, 
    fecha_creacion
  )
  VALUES (
    new.id, 
    COALESCE(new.raw_user_meta_data->>'nombre_usuario', 'usuario_' || substr(new.id::text, 1, 6)),
    new.raw_user_meta_data->>'nombre_completo',
    new.raw_user_meta_data->>'nombre_artistico',
    (new.raw_user_meta_data->>'fecha_nacimiento')::TIMESTAMPTZ,
    new.email, 
    now()
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Re-vincular el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crear_perfil_nuevo_usuario();
