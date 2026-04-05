-- ==============================================================================
-- 🚀 TIANGUIS BEATS: CONSOLIDATED SQL FIX (v2)
-- ==============================================================================

BEGIN;

-- 1. Limpieza de Tabla BEATS (Mover lógica de Sound Kits a su propia tabla)
ALTER TABLE public.beats DROP COLUMN IF EXISTS es_soundkit_activa;
ALTER TABLE public.beats DROP COLUMN IF EXISTS precio_soundkit_mxn;

-- 2. Asegurar Columnas en BEATS
ALTER TABLE public.beats 
ADD COLUMN IF NOT EXISTS instrumentos TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS vibras TEXT,
ADD COLUMN IF NOT EXISTS tipos_beat TEXT[] DEFAULT '{}';

-- 3. Asegurar Robustez de Tabla KITS_SONIDO
ALTER TABLE public.kits_sonido 
ADD COLUMN IF NOT EXISTS archivo_muestra_url TEXT;

-- 4. Vista de Búsqueda de Beats (Sincronizada)
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
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

GRANT SELECT ON public.beats_busqueda TO anon, authenticated;

-- 5. Configuración de Buckets para Sound Kits
CREATE OR REPLACE FUNCTION public.crear_bucket_seguro(p_bucket_id TEXT, is_public BOOLEAN)
RETURNS void AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (p_bucket_id, p_bucket_id, is_public)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
END;
$$ LANGUAGE plpgsql;

-- Crear los 3 buckets solicitados
SELECT public.crear_bucket_seguro('muestra_soundkit', true);      -- MP3 Previews
SELECT public.crear_bucket_seguro('portadas_kits_sonido', true);  -- Portadas JPG/PNG
SELECT public.crear_bucket_seguro('archivos_kits_sonido', false); -- Archivos ZIP/RAR (Privado)

-- Políticas RLS: Lectura Pública
DROP POLICY IF EXISTS "Select_muestra_soundkit" ON storage.objects;
CREATE POLICY "Select_muestra_soundkit" ON storage.objects FOR SELECT USING (bucket_id = 'muestra_soundkit');

DROP POLICY IF EXISTS "Select_portadas_kits_sonido" ON storage.objects;
CREATE POLICY "Select_portadas_kits_sonido" ON storage.objects FOR SELECT USING (bucket_id = 'portadas_kits_sonido');

-- Políticas RLS: Gestión por Usuario (Carpeta: nombre_usuario)
DO $$
BEGIN
    -- Muestra
    DROP POLICY IF EXISTS "All_muestra_soundkit" ON storage.objects;
    CREATE POLICY "All_muestra_soundkit" ON storage.objects FOR ALL USING (
        bucket_id = 'muestra_soundkit' AND (storage.foldername(name))[1] = (SELECT nombre_usuario FROM public.perfiles WHERE id = auth.uid())
    );

    -- Portadas
    DROP POLICY IF EXISTS "All_portadas_kits_sonido" ON storage.objects;
    CREATE POLICY "All_portadas_kits_sonido" ON storage.objects FOR ALL USING (
        bucket_id = 'portadas_kits_sonido' AND (storage.foldername(name))[1] = (SELECT nombre_usuario FROM public.perfiles WHERE id = auth.uid())
    );

    -- ZIPs
    DROP POLICY IF EXISTS "All_archivos_kits_sonido" ON storage.objects;
    CREATE POLICY "All_archivos_kits_sonido" ON storage.objects FOR ALL USING (
        bucket_id = 'archivos_kits_sonido' AND (storage.foldername(name))[1] = (SELECT nombre_usuario FROM public.perfiles WHERE id = auth.uid())
    );
END $$;

COMMIT;
