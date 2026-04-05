-- ==============================================================================
-- 🪜 LÓGICA DE ESCALERA Y FUNDADORES (VERSIÓN ESPAÑOL)
-- ==============================================================================
-- Este script implementa el conteo automático de usuarios por nivel (Free, Pro, Premium)
-- y activa automáticamente el estatus de "Fundador" para los primeros 100 usuarios
-- de los niveles Pro y Premium.
-- ==============================================================================

BEGIN;

-- 1. Asegurar la existencia de las columnas de conteo en la tabla 'perfiles'
ALTER TABLE public.perfiles 
    ADD COLUMN IF NOT EXISTS user_num_total INTEGER,
    ADD COLUMN IF NOT EXISTS user_num_free INTEGER,
    ADD COLUMN IF NOT EXISTS user_num_pro INTEGER,
    ADD COLUMN IF NOT EXISTS user_num_prem INTEGER;

-- 2. Función de lógica de escalera (Escalera de Fundadores)
CREATE OR REPLACE FUNCTION public.manejar_escalera_perfiles()
RETURNS TRIGGER AS $$
BEGIN
  -- A) NUEVO USUARIO (INSERT)
  IF (TG_OP = 'INSERT') THEN
     -- 1. Asignar Número Global Total
     SELECT COALESCE(MAX(user_num_total), 0) + 1 INTO NEW.user_num_total FROM public.perfiles;
     
     -- 2. Asignación inicial por Nivel (Tier)
     IF NEW.nivel_suscripcion = 'free' OR NEW.nivel_suscripcion IS NULL THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.perfiles;
     ELSIF NEW.nivel_suscripcion = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.perfiles;
     ELSIF NEW.nivel_suscripcion = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.perfiles;
     END IF;
  
  -- B) CAMBIO DE NIVEL (UPDATE)
  ELSIF (TG_OP = 'UPDATE' AND NEW.nivel_suscripcion IS DISTINCT FROM OLD.nivel_suscripcion) THEN
     -- Al cambiar de nivel, limpiamos los números de los otros niveles y asignamos el nuevo
     IF NEW.nivel_suscripcion = 'free' THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.perfiles;
        NEW.user_num_pro := NULL; 
        NEW.user_num_prem := NULL;
     ELSIF NEW.nivel_suscripcion = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.perfiles;
        NEW.user_num_free := NULL;
        NEW.user_num_prem := NULL;
     ELSIF NEW.nivel_suscripcion = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.perfiles;
        NEW.user_num_free := NULL;
        NEW.user_num_pro := NULL;
     END IF;
  END IF;

  -- 3. EVALUACIÓN DE FUNDADOR (Regla: Estar entre los primeros 100 de Pro o Premium)
  -- Si el usuario tiene un número de nivel Pro o Premium <= 100, es Fundador.
  -- Si baja a nivel 'free', pierde el estatus automáticamente.
  IF NEW.nivel_suscripcion = 'free' THEN
     NEW.es_fundador := false;
  ELSE
     NEW.es_fundador := (
        (COALESCE(NEW.user_num_pro, 999) <= 100) OR 
        (COALESCE(NEW.user_num_prem, 999) <= 100)
     );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Crear el Trigger en la tabla perfiles
DROP TRIGGER IF EXISTS trg_manejar_escalera_perfiles ON public.perfiles;
CREATE TRIGGER trg_manejar_escalera_perfiles
BEFORE INSERT OR UPDATE OF nivel_suscripcion
ON public.perfiles
FOR EACH ROW
EXECUTE FUNCTION public.manejar_escalera_perfiles();

-- 4. Actualizar la función de creación de usuario inicial (Sync con Auth)
-- Esta función asegura que el primer INSERT en 'perfiles' incluya los metadatos de registro.
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
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ==============================================================================
-- ✅ NOTA: Este script activa la "Escalera de Fundadores". 
-- Los números se asignarán automáticamente a partir de los nuevos registros
-- o cambios de nivel que realices.
-- ==============================================================================
