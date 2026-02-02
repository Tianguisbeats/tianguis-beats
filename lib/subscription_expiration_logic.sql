-- GESTIÓN DE VENCIMIENTO DE SUSCRIPCIONES (Español)
-- Script optimizado para manejar 'termina_suscripcion' y 'comenzar_suscripcion'

-- 1. AGREGAR COLUMNAS EN ESPAÑOL
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS termina_suscripcion TIMESTAMPTZ DEFAULT NULL, -- Fecha exacta de vencimiento
ADD COLUMN IF NOT EXISTS comenzar_suscripcion TEXT DEFAULT NULL; -- El plan que iniciará automáticamente

-- 2. FUNCIÓN DE PROCESAMIENTO (Renombrada y traducida)
CREATE OR REPLACE FUNCTION public.procesar_vencimiento_suscripcion(target_user_id UUID)
RETURNS VOID AS $$
DECLARE
    v_fecha_fin TIMESTAMPTZ;
    v_prox_plan TEXT;
    v_plan_actual TEXT;
BEGIN
    -- Obtener datos usando los nombres en español
    SELECT subscription_tier, termina_suscripcion, comenzar_suscripcion 
    INTO v_plan_actual, v_fecha_fin, v_prox_plan
    FROM public.profiles
    WHERE id = target_user_id;

    -- Verificar si venció
    IF v_fecha_fin IS NOT NULL AND v_fecha_fin < NOW() THEN
        
        -- Si no hay plan siguiente definido, bajamos a 'free' por defecto
        IF v_prox_plan IS NULL THEN
            v_prox_plan := 'free';
        END IF;

        -- Aplicar cambio solo si es necesario
        IF v_plan_actual IS DISTINCT FROM v_prox_plan THEN
            UPDATE public.profiles
            SET 
                subscription_tier = v_prox_plan,
                termina_suscripcion = NULL,  -- Limpiamos fecha porque ya se aplicó
                comenzar_suscripcion = NULL, -- Limpiamos plan futuro
                ultima_actualizacion = NOW()
            WHERE id = target_user_id;
        ELSE
            -- Si ya coincide, solo limpiamos las banderas de vencimiento
            UPDATE public.profiles
            SET termina_suscripcion = NULL, comenzar_suscripcion = NULL
            WHERE id = target_user_id;
        END IF;
    END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. TRIGGER AUTOMÁTICO (Lazy Check)
CREATE OR REPLACE FUNCTION public.trigger_checar_vencimiento()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM public.procesar_vencimiento_suscripcion(NEW.id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_vencimiento_perfil ON public.profiles;
CREATE TRIGGER trigger_vencimiento_perfil
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.trigger_checar_vencimiento();

SELECT 'Sistema de vencimiento (Español) instalado.' as resultado;
