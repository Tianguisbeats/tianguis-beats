-- ==========================================================================
-- 🔒 VALIDACIÓN SERVER-SIDE DE BEATS (Defensa en Profundidad)
-- ==========================================================================
-- Problema:
--   El formulario de upload inserta directamente a la tabla `beats` con el
--   anon key + RLS. El cliente controla precios y banderas de licencia
--   (precio_*_mxn, es_*_activa). Un atacante puede:
--     - Setear precio_premium_mxn = 0 y vender Premium gratis
--     - Activar es_exclusiva_premium_activa sin tener tier que lo permita
--     - Spoofear productor_id apuntando a otro usuario
--
-- Solución:
--   Trigger BEFORE INSERT/UPDATE que valida:
--     1. productor_id = auth.uid()                    (anti-spoof)
--     2. Precios no negativos                         (sanidad)
--     3. Tier de suscripción del productor habilita
--        las licencias activadas                      (anti-bypass)
--     4. Si una licencia está activa, su precio > 0
--        (excepto la licencia gratuita)
-- ==========================================================================

BEGIN;

CREATE OR REPLACE FUNCTION public.validar_beat_antes_insertar()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_uid UUID := auth.uid();
    v_tier TEXT;
    v_es_admin BOOLEAN;
BEGIN
    -- 0. Si la operación viene del service-role (sin auth.uid()), permitir.
    --    Esto deja pasar las inserciones desde APIs server-side (que ya validan).
    IF v_uid IS NULL THEN
        RETURN NEW;
    END IF;

    -- 1. Anti-spoof: productor_id debe coincidir con el usuario autenticado
    IF NEW.productor_id <> v_uid THEN
        -- Excepción: admins pueden corregir/migrar beats
        SELECT es_admin INTO v_es_admin FROM public.perfiles WHERE id = v_uid;
        IF NOT COALESCE(v_es_admin, false) THEN
            RAISE EXCEPTION 'No puedes crear/editar beats a nombre de otro productor';
        END IF;
    END IF;

    -- 2. Sanidad de precios (no negativos)
    IF COALESCE(NEW.precio_gratis_mxn, 0) < 0
       OR COALESCE(NEW.precio_basica_mxn, 0) < 0
       OR COALESCE(NEW.precio_pro_mxn, 0) < 0
       OR COALESCE(NEW.precio_premium_mxn, 0) < 0
       OR COALESCE(NEW.precio_exclusiva_estandar_mxn, 0) < 0
       OR COALESCE(NEW.precio_exclusiva_premium_mxn, 0) < 0 THEN
        RAISE EXCEPTION 'Los precios no pueden ser negativos';
    END IF;

    -- 3. Tier de suscripción del productor
    SELECT COALESCE(LOWER(nivel_suscripcion), 'free') INTO v_tier
    FROM public.perfiles WHERE id = NEW.productor_id;

    -- Si activa licencias Pro o Premium o Exclusivas, debe ser productor pro/premium.
    -- Free pueden vender solo: gratis, básica.
    IF v_tier = 'free' THEN
        IF COALESCE(NEW.es_pro_activa, false)
           OR COALESCE(NEW.es_premium_activa, false)
           OR COALESCE(NEW.es_exclusiva_estandar_activa, false)
           OR COALESCE(NEW.es_exclusiva_premium_activa, false) THEN
            RAISE EXCEPTION 'Tu plan Free no permite vender licencias Pro, Premium o Exclusivas. Activa Pro o Premium en /pricing.';
        END IF;
    END IF;

    -- Solo Premium puede vender Exclusiva Premium (regla del marketplace)
    IF COALESCE(NEW.es_exclusiva_premium_activa, false) AND v_tier <> 'premium' THEN
        RAISE EXCEPTION 'Solo productores Premium pueden vender la licencia Exclusiva Premium';
    END IF;

    -- 4. Si una licencia paga está activa, su precio debe ser > 0
    IF COALESCE(NEW.es_basica_activa, false) AND COALESCE(NEW.precio_basica_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Básica está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_pro_activa, false) AND COALESCE(NEW.precio_pro_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Pro está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_premium_activa, false) AND COALESCE(NEW.precio_premium_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Premium está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_exclusiva_estandar_activa, false) AND COALESCE(NEW.precio_exclusiva_estandar_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Exclusiva Estándar está activa pero su precio es 0';
    END IF;
    IF COALESCE(NEW.es_exclusiva_premium_activa, false) AND COALESCE(NEW.precio_exclusiva_premium_mxn, 0) <= 0 THEN
        RAISE EXCEPTION 'La licencia Exclusiva Premium está activa pero su precio es 0';
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_validar_beat ON public.beats;
CREATE TRIGGER trg_validar_beat
    BEFORE INSERT OR UPDATE ON public.beats
    FOR EACH ROW
    EXECUTE FUNCTION public.validar_beat_antes_insertar();

COMMIT;

-- ==========================================================================
-- NOTA OPERATIVA:
-- El trigger rechaza la operación con RAISE EXCEPTION. PostgREST devuelve
-- 400 con el mensaje (en español), que el frontend ya muestra como toast.
-- Para bypassear durante migraciones manuales: SET LOCAL session_replication_role = replica;
-- ==========================================================================
