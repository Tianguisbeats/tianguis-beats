-- ==============================================================================
-- 🚀 TIANGUIS BEATS: REFINAMIENTO DE LÓGICA DE FUNDADORES (V2)
-- ==============================================================================
-- Este script mejora la función manejar_escalera_perfiles() para:
-- 1. Asegurar que una vez que alguien es Fundador, se mantenga así.
-- 2. Permitir cambios entre Pro y Premium sin perder el número de escalera.
-- 3. Unificar la lógica de los primeros 100.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.manejar_escalera_perfiles()
RETURNS TRIGGER AS $$
BEGIN
  -- 1. NUEVO USUARIO (INSERT)
  IF (TG_OP = 'INSERT') THEN
     SELECT COALESCE(MAX(user_num_total), 0) + 1 INTO NEW.user_num_total FROM public.perfiles;
     
     IF NEW.nivel_suscripcion = 'free' OR NEW.nivel_suscripcion IS NULL THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.perfiles;
     ELSIF NEW.nivel_suscripcion = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.perfiles;
     ELSIF NEW.nivel_suscripcion = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.perfiles;
     END IF;
  
  -- 2. CAMBIO DE NIVEL (UPDATE)
  ELSIF (TG_OP = 'UPDATE' AND NEW.nivel_suscripcion IS DISTINCT FROM OLD.nivel_suscripcion) THEN
     -- Lógica de RECORRIDO (Sliding Window) para el nivel ANTERIOR
     IF OLD.nivel_suscripcion = 'free' OR OLD.nivel_suscripcion IS NULL THEN
        UPDATE public.perfiles SET user_num_free = user_num_free - 1 WHERE user_num_free > OLD.user_num_free;
     ELSIF OLD.nivel_suscripcion = 'pro' THEN
        UPDATE public.perfiles SET user_num_pro = user_num_pro - 1 WHERE user_num_pro > OLD.user_num_pro;
     ELSIF OLD.nivel_suscripcion = 'premium' THEN
        UPDATE public.perfiles SET user_num_prem = user_num_prem - 1 WHERE user_num_prem > OLD.user_num_prem;
     END IF;

     -- Asignar nuevo número en el nivel ACTUAL
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

  -- 3. EVALUACIÓN DE FUNDADOR (Primeros 100 de Pro o Premium)
  -- El estatus se actualiza automáticamente al re-ordenar (trigger BEFORE UPDATE)
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

-- Re-aplicar el trigger por si acaso
DROP TRIGGER IF EXISTS trg_manejar_escalera_perfiles ON public.perfiles;
CREATE TRIGGER trg_manejar_escalera_perfiles
BEFORE INSERT OR UPDATE OF nivel_suscripcion
ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.manejar_escalera_perfiles();
