-- ==============================================================================
-- 🚀 ACTIVACIÓN AUTOMÁTICA DE MEMBRESÍAS VÍA TRIGGER
-- ==============================================================================
-- Este script crea un trigger que escucha la tabla 'transacciones'.
-- Cuando detecta un 'plan' con estado 'completado', actualiza el perfil.
-- ==============================================================================

BEGIN;

-- 1. Crear la función de activación
CREATE OR REPLACE FUNCTION public.fn_activar_membresia_desde_transaccion()
RETURNS TRIGGER AS $$
DECLARE
    v_nivel TEXT;
    v_meses_adicionales INTEGER;
    v_intervalo INTERVAL;
BEGIN
    -- Solo actuar si es un plan y está completado
    IF (NEW.tipo_producto = 'plan' AND NEW.estado_pago = 'completado') THEN
        
        RAISE NOTICE 'PROCESANDO PLAN: producto_id=%, tipo_licencia=%, comprador=%', NEW.producto_id, NEW.tipo_licencia, NEW.comprador_id;

        -- Determinar el nivel (pro o premium)
        IF (NEW.tipo_licencia = 'premium' OR NEW.producto_id ILIKE '%premium%') THEN
            v_nivel := 'premium';
        ELSE
            v_nivel := 'pro';
        END IF;

        RAISE NOTICE 'NIVEL DETECTADO: %', v_nivel;

        -- Determinar la duración (meses_duracion desde metadatos o 1 mes por defecto)
        v_meses_adicionales := COALESCE((NEW.metadatos->>'meses_duracion')::INTEGER, 1);
        
        -- Calculamos el intervalo: meses + 2 días de cortesía
        v_intervalo := (v_meses_adicionales || ' months')::INTERVAL + '2 days'::INTERVAL;

        -- Actualizar el perfil del comprador
        UPDATE public.perfiles
        SET 
            nivel_suscripcion = v_nivel,
            fecha_termino_suscripcion = COALESCE(NEW.fecha_creacion, NOW()) + v_intervalo,
            fecha_inicio_suscripcion = COALESCE(NEW.fecha_creacion, NOW()),
            stripe_cliente_id = COALESCE(NEW.metadatos->>'stripe_customer_id', stripe_cliente_id),
            es_prueba = COALESCE((NEW.metadatos->>'es_prueba')::BOOLEAN, (NEW.metadatos->>'is_trial')::BOOLEAN, false),
            fecha_fin_prueba = CASE 
                WHEN (NEW.metadatos->>'es_prueba')::BOOLEAN OR (NEW.metadatos->>'is_trial')::BOOLEAN 
                THEN COALESCE(NEW.fecha_creacion, NOW()) + v_intervalo 
                ELSE fecha_fin_prueba 
            END
        WHERE id = NEW.comprador_id;

        -- Ejecutar la lógica de upgrade de producción (activar beats/kits)
        PERFORM public.manejar_upgrade_produccion(NEW.comprador_id);
        
        RAISE NOTICE 'Membresía % activada para el usuario %', v_nivel, NEW.comprador_id;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Aplicar el vigilante a la tabla transacciones (ahora escucha cualquier actualización para soportar reenvíos)
DROP TRIGGER IF EXISTS trg_activar_membresia_auto ON public.transacciones;
CREATE TRIGGER trg_activar_membresia_auto
AFTER INSERT OR UPDATE ON public.transacciones
FOR EACH ROW EXECUTE FUNCTION public.fn_activar_membresia_desde_transaccion();

COMMIT;
