-- Fix for beats visibility: Change JOIN to LEFT JOIN to ensure beats show up even if profile data is missing or out of sync.
-- Also ensures GRANTs are reapplied.

BEGIN;

DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

CREATE OR REPLACE VIEW public.beats_busqueda AS
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
LEFT JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

GRANT SELECT ON public.beats_busqueda TO anon, authenticated;

COMMIT;
