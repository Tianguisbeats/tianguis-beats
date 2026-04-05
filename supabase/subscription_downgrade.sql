-- ==============================================================================
-- 📉 LÓGICA DE DOWNGRADE DE SUSCRIPCIÓN (7 DÍAS)
-- ==============================================================================
-- Este script agrega las columnas necesarias y crea los procedimientos para
-- manejar el downgrade (a plan Free) y upgrade de suscripciones.

BEGIN;

-- 1. Agregar columnas de desactivación
ALTER TABLE public.beats ADD COLUMN IF NOT EXISTS esta_desactivado_por_plan BOOLEAN DEFAULT false;
ALTER TABLE public.kits_sonido ADD COLUMN IF NOT EXISTS esta_desactivado_por_plan BOOLEAN DEFAULT false;
ALTER TABLE public.servicios ADD COLUMN IF NOT EXISTS esta_desactivado_por_plan BOOLEAN DEFAULT false;

-- 2. Procedimiento para manejar el Downgrade (Premium -> Free)
CREATE OR REPLACE FUNCTION public.manejar_downgrade_produccion(p_usuario_id UUID)
RETURNS void AS $$
DECLARE
    v_beat_count INTEGER;
BEGIN
    -- A. Desactivar todos los Sound Kits y Servicios (Son funciones Premium)
    UPDATE public.kits_sonido 
    SET esta_desactivado_por_plan = true,
        es_publico = false
    WHERE productor_id = p_usuario_id;
    
    UPDATE public.servicios 
    SET esta_desactivado_por_plan = true,
        es_activo = false
    WHERE productor_id = p_usuario_id;

    -- B. Manejar límite de Beats (Límite Free = 5)
    SELECT count(*) INTO v_beat_count FROM public.beats WHERE productor_id = p_usuario_id;
    
    IF v_beat_count > 5 THEN
        -- Desactivar los beats más antiguos que excedan el límite de 5
        UPDATE public.beats SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
        
        UPDATE public.beats
        SET esta_desactivado_por_plan = true,
            es_publico = false
        WHERE id IN (
            SELECT id FROM public.beats 
            WHERE productor_id = p_usuario_id
            ORDER BY fecha_creacion ASC 
            OFFSET 5
        );
    ELSE
        UPDATE public.beats SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
    END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Procedimiento para manejar el Upgrade (Free -> Pro/Premium)
CREATE OR REPLACE FUNCTION public.manejar_upgrade_produccion(p_usuario_id UUID)
RETURNS void AS $$
BEGIN
    UPDATE public.beats SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
    UPDATE public.kits_sonido SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
    UPDATE public.servicios SET esta_desactivado_por_plan = false WHERE productor_id = p_usuario_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Actualizar vista de búsqueda para excluir desactivados
DROP VIEW IF EXISTS public.beats_busqueda CASCADE;
CREATE VIEW public.beats_busqueda AS
SELECT 
    b.id, b.productor_id, b.titulo, b.genero, b.subgenero, b.bpm, b.tono_escala,
    b.descripcion, b.vibras, b.tipos_beat, b.artista_referencia,
    b.instrumentos,
    b.precio_basico_mxn, b.precio_mp3_mxn, b.precio_pro_mxn, 
    b.precio_premium_mxn, b.precio_ilimitado_mxn, b.precio_exclusivo_mxn,
    b.es_publico, b.esta_vendido, b.portada_url, 
    b.archivo_mp3_url, b.archivo_muestra_url, b.archivo_wav_url, b.archivo_stems_url,
    b.conteo_reproducciones, b.conteo_ventas, b.conteo_likes, b.visibilidad_tier,
    b.es_basica_activa, b.es_mp3_activa, b.es_pro_activa, 
    b.es_premium_activa, b.es_ilimitada_activa, b.es_exclusiva_activa,
    b.fecha_creacion,
    p.nombre_artistico as productor_nombre_artistico,
    p.nombre_usuario as productor_nombre_usuario,
    p.esta_verificado as productor_esta_verificado,
    p.es_fundador as productor_es_fundador,
    p.nivel_suscripcion as productor_nivel_suscripcion,
    p.foto_perfil as productor_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true 
  AND b.esta_desactivado_por_plan = false;

GRANT SELECT ON public.beats_busqueda TO anon, authenticated;

COMMIT;
