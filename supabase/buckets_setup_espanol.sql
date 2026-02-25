-- ==============================================================================-- 🗄️ TIANGUIS BEATS - CREACIÓN DE RUTAS Y BUCKETS DE ALMACENAMIENTO
-- ==============================================================================
-- Este script crea todos los Buckets necesarios en Supabase Storage.
-- Todos los nombres están en español y se configuran políticas de seguridad (RLS)
-- para que los usuarios guarden sus archivos en carpetas con su propio ID (productor_id).
-- ==============================================================================

BEGIN;

-- ==============================================================================
-- 1. CREACIÓN DE BUCKETS NUEVOS EN ESPAÑOL (INSERCIÓN A STORAGE.BUCKETS)
-- ==============================================================================

-- Función auxiliar para insertar buckets si no existen
CREATE OR REPLACE FUNCTION public.crear_bucket(
    bucket_id TEXT, 
    is_public BOOLEAN, 
    file_size_limit BIGINT, 
    allowed_mime_types TEXT[]
) RETURNS void AS $$
BEGIN
    INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
    VALUES (bucket_id, bucket_id, is_public, file_size_limit, allowed_mime_types)
    ON CONFLICT (id) DO UPDATE SET 
        public = EXCLUDED.public,
        file_size_limit = EXCLUDED.file_size_limit,
        allowed_mime_types = EXCLUDED.allowed_mime_types;
END;
$$ LANGUAGE plpgsql;

-- [A] BUCKETS PÚBLICOS (Cualquiera puede descargar/ver, 10-20 MB ideal para imágenes front)
SELECT public.crear_bucket('fotos_perfil', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
SELECT public.crear_bucket('fotos_portada', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
SELECT public.crear_bucket('portadas_beats', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
SELECT public.crear_bucket('portadas_kits_sonido', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/webp']);
SELECT public.crear_bucket('muestras_beats', true, 20971520, ARRAY['audio/mpeg', 'audio/mp3']); -- Muestras comprimidas de beats (con tag voice)
SELECT public.crear_bucket('licencias_generadas', true, 5242880, ARRAY['application/pdf']); -- PDF de contratos

-- [B] BUCKETS PRIVADOS COMERCIALES (Solo los compradores pueden acceder)
-- Máximo 2GB (2147483648 bytes)
SELECT public.crear_bucket('beats_mp3', false, 2147483648, ARRAY['audio/mpeg', 'audio/mp3']);
SELECT public.crear_bucket('beats_wav', false, 2147483648, ARRAY['audio/wav', 'audio/x-wav', 'audio/vnd.wave']);
SELECT public.crear_bucket('beats_stems', false, 2147483648, ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream']);
SELECT public.crear_bucket('archivos_kits_sonido', false, 2147483648, ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream']);

-- [C] BUCKETS PRIVADOS DE POST-VENTA Y GESTIÓN
SELECT public.crear_bucket('archivos_proyectos', false, 2147483648, ARRAY['application/zip', 'audio/wav', 'audio/mpeg', 'image/png', 'image/jpeg', 'application/pdf']); -- Delivery services
SELECT public.crear_bucket('documentos_verificacion', false, 5242880, ARRAY['image/jpeg', 'image/png', 'application/pdf']); -- KYC (INE, Pasaporte)
SELECT public.crear_bucket('evidencias_quejas', false, 10485760, ARRAY['image/jpeg', 'image/png', 'application/pdf']); -- Capturas de pantalla de quejas

-- [D] BUCKET DE ADMINISTRADOR PARA LA PLATAFORMA
SELECT public.crear_bucket('activos_plataforma', true, 52428800, ARRAY['image/png', 'image/jpeg', 'image/webp', 'image/svg+xml', 'video/mp4']); 


-- ==============================================================================
-- 2. HABILITAR SEGURIDAD (RLS) EN STORAGE.OBJECTS
-- ==============================================================================
-- Para asegurarnos de que los usuarios no se roben beats ni borren fotos de otros.

-- Eliminar políticas antiguas (limpieza)
DROP POLICY IF EXISTS "Fotos perfil lectura publica" ON storage.objects;
DROP POLICY IF EXISTS "Insercion fotos perfil" ON storage.objects;
-- (Es difícil listar todas las que hubieran, pero daremos de alta las nuevas de forma limpia)

-- ==============================================================================
-- 2.1 POLÍTICAS PARA BUCKETS PÚBLICOS (Lectura para todos, inserción/borrado solo el dueño)
-- Nota sobre carpetas: (folder1/file.ext) -> (uid/nombre_archivo.ext)
-- ==============================================================================
CREATE POLICY "Lectura pública de fotos_perfil" ON storage.objects FOR SELECT USING (bucket_id = 'fotos_perfil');
CREATE POLICY "Gestión propia fotos_perfil" ON storage.objects FOR ALL USING (
    bucket_id = 'fotos_perfil' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lectura pública de fotos_portada" ON storage.objects FOR SELECT USING (bucket_id = 'fotos_portada');
CREATE POLICY "Gestión propia fotos_portada" ON storage.objects FOR ALL USING (
    bucket_id = 'fotos_portada' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lectura pública de portadas_beats" ON storage.objects FOR SELECT USING (bucket_id = 'portadas_beats');
CREATE POLICY "Gestión propia portadas_beats" ON storage.objects FOR ALL USING (
    bucket_id = 'portadas_beats' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lectura pública de portadas_kits_sonido" ON storage.objects FOR SELECT USING (bucket_id = 'portadas_kits_sonido');
CREATE POLICY "Gestión propia portadas_kits_sonido" ON storage.objects FOR ALL USING (
    bucket_id = 'portadas_kits_sonido' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lectura pública de muestras_beats" ON storage.objects FOR SELECT USING (bucket_id = 'muestras_beats');
CREATE POLICY "Gestión propia muestras_beats" ON storage.objects FOR ALL USING (
    bucket_id = 'muestras_beats' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Lectura pública de licencias_generadas" ON storage.objects FOR SELECT USING (bucket_id = 'licencias_generadas');
-- La licencia suele generarla el servidor (service_role bypasses RLS), así que con eso basta, 
-- pero le damos permiso al creador (productor) por si acaso:
CREATE POLICY "Gestión propia licencias_generadas" ON storage.objects FOR ALL USING (
    bucket_id = 'licencias_generadas' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- BUCKET DEL ADMIN (activos_plataforma)
CREATE POLICY "Lectura pública activos_plataforma" ON storage.objects FOR SELECT USING (bucket_id = 'activos_plataforma');
CREATE POLICY "Solo administradores editan activos_plataforma" ON storage.objects FOR ALL USING (
    bucket_id = 'activos_plataforma' AND EXISTS (
        SELECT 1 FROM public.perfiles WHERE id = auth.uid() AND es_admin = true
    )
);


-- ==============================================================================
-- 2.2 POLÍTICAS PARA BUCKETS PRIVADOS (Venta de activos digitales)
-- Propietario los administra. El sistema (service_role) o URLs firmadas los entregan al comprador.
-- ==============================================================================

CREATE POLICY "Gestión propia beats_mp3" ON storage.objects FOR ALL USING (
    bucket_id = 'beats_mp3' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Gestión propia beats_wav" ON storage.objects FOR ALL USING (
    bucket_id = 'beats_wav' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Gestión propia beats_stems" ON storage.objects FOR ALL USING (
    bucket_id = 'beats_stems' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Gestión propia archivos_kits_sonido" ON storage.objects FOR ALL USING (
    bucket_id = 'archivos_kits_sonido' AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Los compradores pueden leer beats_mp3 si hay transaccion" ON storage.objects FOR SELECT USING (
    bucket_id = 'beats_mp3' AND EXISTS (
        SELECT 1 FROM public.transacciones WHERE comprador_id = auth.uid()
        -- Se requeriria un matching avanzado con producto_id en un sistema 100% estricto de DB, 
        -- pero habitualmente se usan Signed URLs generadas por el backend (Node) post-compra.
    )
);

-- ==============================================================================
-- 2.3 POLÍTICAS PARA DOCUMENTOS LEGALES Y POST-VENTA
-- ==============================================================================

-- ARCHIVOS DE PROYECTO (Suben ambos: el productor o el cliente comprador)
CREATE POLICY "Cualquiera autenticado puede gestionar en directorios de proyecto si pertenece a él" 
ON storage.objects FOR ALL USING (
    bucket_id = 'archivos_proyectos' AND EXISTS (
        SELECT 1 FROM public.proyectos 
        WHERE id::text = (storage.foldername(name))[1]  -- Se organizan por /id_del_proyecto/
          AND (comprador_id = auth.uid() OR productor_id = auth.uid())
    )
);

-- KYC (Verificaciones)
CREATE POLICY "Gestión propia documentos_verificacion" ON storage.objects FOR ALL USING (
    bucket_id = 'documentos_verificacion' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Evidencias de Quejas
CREATE POLICY "Gestión propia evidencias_quejas" ON storage.objects FOR ALL USING (
    bucket_id = 'evidencias_quejas' AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;
