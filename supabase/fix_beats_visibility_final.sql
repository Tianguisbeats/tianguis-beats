-- Final fix for beats visibility: include all columns from beats table plus producer info.
-- This ensures filters like 'moods' or any new columns don't break the view.

BEGIN;

DROP VIEW IF EXISTS public.beats_busqueda CASCADE;

CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.*,
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
