-- ==============================================================================
-- 🗄️ TIANGUIS BEATS - CONFIGURACIÓN MAESTRA DE STORAGE (ESPAÑOL)
-- ==============================================================================
-- Este script crea todos los Buckets necesarios y configura sus políticas RLS.
-- Alineado al 100% con el esquema de base de datos en español.
-- ==============================================================================

BEGIN;

-- 1. FUNCIÓN AUXILIAR PARA CREAR BUCKETS
CREATE OR REPLACE FUNCTION public.crear_bucket_seguro(id TEXT, is_public BOOLEAN)
RETURNS void AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public)
    VALUES (id, id, is_public)
    ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;
END;
$$ LANGUAGE plpgsql;

-- 2. CREACIÓN DE BUCKETS (PÚBLICOS)
SELECT public.crear_bucket_seguro('fotos_perfil', true);
SELECT public.crear_bucket_seguro('fotos_portada', true);
SELECT public.crear_bucket_seguro('portadas_beats', true);
SELECT public.crear_bucket_seguro('portadas_kits_sonido', true);
SELECT public.crear_bucket_seguro('muestras_beats', true);
SELECT public.crear_bucket_seguro('licencias_generadas', true);
SELECT public.crear_bucket_seguro('activos_plataforma', true);

-- 3. CREACIÓN DE BUCKETS (PRIVADOS)
SELECT public.crear_bucket_seguro('beats_mp3', false);
SELECT public.crear_bucket_seguro('beats_wav', false);
SELECT public.crear_bucket_seguro('beats_stems', false);
SELECT public.crear_bucket_seguro('archivos_kits_sonido', false);
SELECT public.crear_bucket_seguro('archivos_proyectos', false);
SELECT public.crear_bucket_seguro('documentos_verificacion', false);
SELECT public.crear_bucket_seguro('evidencias_quejas', false);

-- 4. CONFIGURACIÓN DE POLÍTICAS RLS (Limpieza y Recreación)
-- Función para limpiar políticas de un bucket
CREATE OR REPLACE FUNCTION public.limpiar_politicas_bucket(target_bucket_id TEXT)
RETURNS void AS $$
BEGIN
    EXECUTE 'DROP POLICY IF EXISTS "Select_' || target_bucket_id || '" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Insert_' || target_bucket_id || '" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Update_' || target_bucket_id || '" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "Delete_' || target_bucket_id || '" ON storage.objects';
    EXECUTE 'DROP POLICY IF EXISTS "All_' || target_bucket_id || '" ON storage.objects';
END;
$$ LANGUAGE plpgsql;

-- [A] POLÍTICAS PARA BUCKETS PÚBLICOS
-- (Cualquiera lee, solo el dueño gestiona por su ID de carpeta)
DO $$
DECLARE
    b TEXT;
    public_buckets TEXT[] := ARRAY['fotos_perfil', 'fotos_portada', 'portadas_beats', 'portadas_kits_sonido', 'muestras_beats', 'licencias_generadas'];
BEGIN
    FOREACH b IN ARRAY public_buckets LOOP
        PERFORM public.limpiar_politicas_bucket(b);
        
        EXECUTE 'CREATE POLICY "Select_' || b || '" ON storage.objects FOR SELECT USING (bucket_id = ''' || b || ''')';
        EXECUTE 'CREATE POLICY "All_' || b || '" ON storage.objects FOR ALL USING (bucket_id = ''' || b || ''' AND (auth.uid())::text = (storage.foldername(name))[1])';
    END LOOP;
END $$;

-- [B] POLÍTICAS PARA BUCKETS PRIVADOS
-- (Solo el dueño gestiona)
DO $$
DECLARE
    b TEXT;
    private_buckets TEXT[] := ARRAY['beats_mp3', 'beats_wav', 'beats_stems', 'archivos_kits_sonido', 'documentos_verificacion', 'evidencias_quejas'];
BEGIN
    FOREACH b IN ARRAY private_buckets LOOP
        PERFORM public.limpiar_politicas_bucket(b);
        
        EXECUTE 'CREATE POLICY "All_' || b || '" ON storage.objects FOR ALL USING (bucket_id = ''' || b || ''' AND (auth.uid())::text = (storage.foldername(name))[1])';
    END LOOP;
END $$;

-- [C] CASOS ESPECIALES
-- Activos Plataforma (Solo Admin)
PERFORM public.limpiar_politicas_bucket('activos_plataforma');
CREATE POLICY "Select_activos_plataforma" ON storage.objects FOR SELECT USING (bucket_id = 'activos_plataforma');
CREATE POLICY "All_admin_activos_plataforma" ON storage.objects FOR ALL USING (
    bucket_id = 'activos_plataforma' AND EXISTS (SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true)
);

-- Archivos Proyectos (Dueño o Cliente)
PERFORM public.limpiar_politicas_bucket('archivos_proyectos');
CREATE POLICY "All_proyectos" ON storage.objects FOR ALL USING (
    bucket_id = 'archivos_proyectos' AND EXISTS (
        SELECT 1 FROM public.proyectos 
        WHERE id::text = (storage.foldername(name))[1] 
        AND (productor_id = auth.uid() OR comprador_id = auth.uid())
    )
);

COMMIT;
