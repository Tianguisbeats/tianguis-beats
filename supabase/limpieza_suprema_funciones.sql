-- ==============================================================================
-- 🧹 LIMPIEZA SUPREMA DE FUNCIONES Y TIPOS EN INGLÉS
-- ==============================================================================
-- Este script purga toda la "basura" que quedó volando de la base de datos anterior:
-- triggers huérfanos, funciones obsoletas y Enumerated Types viejos.
-- Luego, crea las nuevas funciones esenciales 100% en español.
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. PURGA DE ENUMERATED TYPES VIEJOS
-- ==============================================================================
DROP TYPE IF EXISTS public.role_enum CASCADE;
DROP TYPE IF EXISTS public.subscription_tier_enum CASCADE;


-- ==============================================================================
-- 2. PURGA DE FUNCIONES Y TRIGGERS VIEJOS (Basado en el screenshot)
-- ==============================================================================
-- Usamos CASCADE para que cualquier trigger que aún exista atado a ellas también muera.

-- Funciones genéricas o de timestamp
DROP FUNCTION IF EXISTS public.actualizar_timestamp_plantillas() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;
DROP FUNCTION IF EXISTS public.update_updated_at_column() CASCADE;

-- Funciones de Auth y Perfiles
DROP FUNCTION IF EXISTS public.handle_new_auth_user() CASCADE;
DROP FUNCTION IF EXISTS public.sync_founder_status() CASCADE;
DROP FUNCTION IF EXISTS public.trigger_checar_vencimiento() CASCADE;
DROP FUNCTION IF EXISTS public.procesar_vencimiento_suscripcion(uuid) CASCADE;

-- Funciones del juego de las sillas (Musical Chairs)
DROP FUNCTION IF EXISTS public.assign_musical_chairs() CASCADE;
DROP FUNCTION IF EXISTS public.resequence_musical_chairs() CASCADE;

-- Funciones de Beats y Estadísticas
DROP FUNCTION IF EXISTS public.increment_play_count(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.sync_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.update_beat_like_count() CASCADE;
DROP FUNCTION IF EXISTS public.track_beat_activity(uuid, text) CASCADE;
DROP FUNCTION IF EXISTS public.reset_weekly_stats() CASCADE;

-- Funciones Económicas
DROP FUNCTION IF EXISTS public.incrementar_balance_productor(uuid, numeric) CASCADE;
DROP FUNCTION IF EXISTS public.incrementar_uso_cupon(uuid) CASCADE;
DROP FUNCTION IF EXISTS public.validate_coupon(text, uuid) CASCADE;


-- ==============================================================================
-- 3. CREACIÓN DE NUEVAS FUNCIONES Y TRIGGERS EN ESPAÑOL
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- A) Función genérica para auto-actualizar la columna `fecha_actualizacion`
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.actualizar_fecha_mutacion()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers de actualización de fecha
CREATE TRIGGER trg_perfiles_actualizacion
BEFORE UPDATE ON public.perfiles
FOR EACH ROW EXECUTE PROCEDURE public.actualizar_fecha_mutacion();

CREATE TRIGGER trg_licencias_actualizacion
BEFORE UPDATE ON public.licencias
FOR EACH ROW EXECUTE PROCEDURE public.actualizar_fecha_mutacion();

CREATE TRIGGER trg_proyectos_actualizacion
BEFORE UPDATE ON public.proyectos
FOR EACH ROW EXECUTE PROCEDURE public.actualizar_fecha_mutacion();


-- ------------------------------------------------------------------------------
-- B) Función para Sincronizar Likes (Favoritos -> Beats.conteo_likes)
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sincronizar_conteo_likes()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' THEN
        UPDATE public.beats 
        SET conteo_likes = conteo_likes + 1 
        WHERE id = NEW.beat_id;
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        UPDATE public.beats 
        SET conteo_likes = GREATEST(conteo_likes - 1, 0)
        WHERE id = OLD.beat_id;
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_sincronizar_likes
AFTER INSERT OR DELETE ON public.favoritos
FOR EACH ROW EXECUTE PROCEDURE public.sincronizar_conteo_likes();


-- ------------------------------------------------------------------------------
-- C) RPC (Remote Procedure Call) para incrementar reproducciones de un Beat
-- ------------------------------------------------------------------------------
-- Se puede llamar desde Next.js usando supabase.rpc('incrementar_reproduccion', { id_beat: '...' })
CREATE OR REPLACE FUNCTION public.incrementar_reproduccion(id_beat UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.beats
    SET conteo_reproducciones = conteo_reproducciones + 1
    WHERE id = id_beat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- D) RPC para incrementar cantidad de venta cuando alguien compra un Beat
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.incrementar_venta_beat(id_beat UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.beats
    SET conteo_ventas = conteo_ventas + 1
    WHERE id = id_beat;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- ------------------------------------------------------------------------------
-- E) RPC para validar un cupón de descuento activo
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.validar_cupon_descuento(codigo_cupon TEXT, id_productor UUID)
RETURNS TABLE (es_valido BOOLEAN, descuento INTEGER, id_del_cupon UUID) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es_activo AS es_valido, 
        porcentaje_descuento AS descuento, 
        id AS id_del_cupon
    FROM public.cupones
    WHERE codigo = codigo_cupon 
      AND productor_id = id_productor
      AND es_activo = true
    LIMIT 1;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

COMMIT;
