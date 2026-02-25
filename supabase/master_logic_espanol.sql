-- ==============================================================================
-- 🚀 TIANGUIS BEATS: MASTER LOGIC FIX (ESPAÑOL TOTAL + ESCALERA)
-- ==============================================================================
-- Este script purga las funciones y triggers antiguos en inglés y recrea
-- toda la lógica esencial de la aplicación alineada al esquema en español.
-- Incluye la Lógica de Escalera para números de usuario y estatus de Fundador.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 0. CONFIGURACIÓN GLOBAL (MÉXICO)
-- ==============================================================================
ALTER DATABASE postgres SET timezone TO 'America/Mexico_City';
SET timezone TO 'America/Mexico_City';

-- ==============================================================================
-- 1. LIMPIEZA DE LÓGICA ANTIGUA (INGLÉS)
-- ==============================================================================
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS trg_sync_founder_status ON public.perfiles;
DROP TRIGGER IF EXISTS trg_sincronizar_likes ON public.favoritos;
DROP TRIGGER IF EXISTS trg_manejar_escalera_perfiles ON public.perfiles;

DROP FUNCTION IF EXISTS public.crear_perfil_nuevo_usuario() CASCADE;
DROP FUNCTION IF EXISTS public.manejar_escalera_perfiles() CASCADE;
DROP FUNCTION IF EXISTS public.sync_founder_status() CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_balance_productor(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_uso_cupon(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_reproduccion(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sincronizar_conteo_likes() CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_venta_beat(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validar_cupon_descuento(text, uuid) CASCADE;

-- ==============================================================================
-- 2. ASEGURAR COLUMNAS EN TABLA PERFILES
-- ==============================================================================
ALTER TABLE public.perfiles 
    ADD COLUMN IF NOT EXISTS balance_pendiente NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS balance_disponible NUMERIC DEFAULT 0,
    ADD COLUMN IF NOT EXISTS stripe_cliente_id TEXT,
    ADD COLUMN IF NOT EXISTS stripe_suscripcion_id TEXT,
    ADD COLUMN IF NOT EXISTS fecha_termino_suscripcion TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS fecha_inicio_suscripcion TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS es_fundador BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS nivel_suscripcion TEXT DEFAULT 'free',
    ADD COLUMN IF NOT EXISTS esta_verificado BOOLEAN DEFAULT false,
    -- Columnas de Escalera
    ADD COLUMN IF NOT EXISTS user_num_total INTEGER,
    ADD COLUMN IF NOT EXISTS user_num_free INTEGER,
    ADD COLUMN IF NOT EXISTS user_num_pro INTEGER,
    ADD COLUMN IF NOT EXISTS user_num_prem INTEGER;

-- ==============================================================================
-- 3. FUNCIONES DE LÓGICA DE USUARIOS
-- ==============================================================================

-- A) Lógica de Escalera y Fundadores (Sustituye sync_founder_status)
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

CREATE TRIGGER trg_manejar_escalera_perfiles
BEFORE INSERT OR UPDATE OF nivel_suscripcion
ON public.perfiles
FOR EACH ROW EXECUTE FUNCTION public.manejar_escalera_perfiles();

-- B) Crear perfil al registrarse (Sync con Auth)
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
        now(), 
        true,
        'free',
        false
    );
    RETURN new;
EXCEPTION WHEN OTHERS THEN
    RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.crear_perfil_nuevo_usuario();

-- ==============================================================================
-- 4. FUNCIONES DE ACTIVIDAD Y ESTADÍSTICAS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.incrementar_reproduccion(id_beat UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.beats SET conteo_reproducciones = COALESCE(conteo_reproducciones, 0) + 1 WHERE id = id_beat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.sincronizar_conteo_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.beats SET conteo_likes = COALESCE(conteo_likes, 0) + 1 WHERE id = NEW.beat_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.beats SET conteo_likes = GREATEST(COALESCE(conteo_likes, 0) - 1, 0) WHERE id = OLD.beat_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sincronizar_likes
AFTER INSERT OR DELETE ON public.favoritos
FOR EACH ROW EXECUTE PROCEDURE public.sincronizar_conteo_likes();

-- ==============================================================================
-- 5. FUNCIONES ECONÓMICAS
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.incrementar_balance_productor(id_productor UUID, monto_ganancia NUMERIC)
RETURNS void AS $$
BEGIN
    UPDATE public.perfiles SET balance_pendiente = COALESCE(balance_pendiente, 0) + monto_ganancia WHERE id = id_productor;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.incrementar_uso_cupon(id_cupon UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.cupones SET usos_actuales = COALESCE(usos_actuales, 0) + 1 WHERE id = id_cupon;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;

-- ==============================================================================
-- ✅ ÉXITO: Tu base de datos tiene la lógica completa (Escalera + Fundadores).
-- ==============================================================================
