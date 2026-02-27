-- ==========================================
-- FIX: UNIFY SEARCH VIEW PREFIXES (SPANISH)
-- ==========================================

DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.id, b.productor_id, b.titulo, b.genero, b.subgenero, b.bpm, b.tono_escala,
    b.precio_basico_mxn, b.precio_pro_mxn, b.precio_premium_mxn, b.precio_ilimitado_mxn, b.precio_exclusivo_mxn,
    b.es_publico, b.esta_vendido, b.portada_url, b.archivo_muestra_url, b.archivo_mp3_url, b.vibras,
    b.conteo_reproducciones, b.conteo_likes, b.conteo_ventas, b.visibilidad_tier, b.fecha_creacion,
    p.nombre_artistico as productor_nombre_artistico,
    p.nombre_usuario as productor_nombre_usuario,
    p.esta_verificado as productor_esta_verificado,
    p.es_fundador as productor_es_fundador,
    p.nivel_suscripcion as productor_nivel_suscripcion,
    p.foto_perfil as productor_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

GRANT SELECT ON public.beats_busqueda TO anon, authenticated;
