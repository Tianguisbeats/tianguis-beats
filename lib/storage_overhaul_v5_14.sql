-- Reestructuración Completa de Storage para Tianguis Beats v5.14

-- 1. Creación de Buckets con nombres en español
-- Perfiles (Avatar y Fotos de Portada de usuario)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('perfiles', 'perfiles', true, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Portadas de Beats (Artwork de canciones)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('portadas-beats', 'portadas-beats', true, 5242880, '{image/jpeg,image/png,image/webp}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 5242880;

-- Muestras de Beats (MP3 con Tag / Previews)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('beats-muestras', 'beats-muestras', true, 20971520, '{audio/mpeg}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = 20971520;

-- Archivos Maestros (Archivos finales para descarga/venta)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('beats-maestros', 'beats-maestros', false, 524288000, '{audio/wav,audio/mpeg,application/zip,application/x-zip-compressed,application/x-rar-compressed}')
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = 524288000;

-- 2. Limpieza de Políticas Previas (Evitar errores por duplicados)
DROP POLICY IF EXISTS "Lectura pública para perfiles" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública para portadas" ON storage.objects;
DROP POLICY IF EXISTS "Lectura pública para muestras" ON storage.objects;
DROP POLICY IF EXISTS "Subida para dueños" ON storage.objects;
DROP POLICY IF EXISTS "Edición para dueños" ON storage.objects;
DROP POLICY IF EXISTS "Eliminación para dueños" ON storage.objects;

-- 3. Políticas RLS (Row Level Security)

-- Lectura Pública para Buckets Públicos
CREATE POLICY "Lectura pública para perfiles" ON storage.objects FOR SELECT USING (bucket_id = 'perfiles');
CREATE POLICY "Lectura pública para portadas" ON storage.objects FOR SELECT USING (bucket_id = 'portadas-beats');
CREATE POLICY "Lectura pública para muestras" ON storage.objects FOR SELECT USING (bucket_id = 'beats-muestras');

-- Subida para Usuarios Autenticados (Carpeta propia)
CREATE POLICY "Subida para dueños" ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id IN ('perfiles', 'portadas-beats', 'beats-muestras', 'beats-maestros') AND (storage.foldername(name))[1] = auth.uid()::text);

-- Actualización/Edición para Dueños
CREATE POLICY "Edición para dueños" ON storage.objects FOR UPDATE TO authenticated
USING (bucket_id IN ('perfiles', 'portadas-beats', 'beats-muestras', 'beats-maestros') AND (storage.foldername(name))[1] = auth.uid()::text);

-- Eliminación para Dueños
CREATE POLICY "Eliminación para dueños" ON storage.objects FOR DELETE TO authenticated
USING (bucket_id IN ('perfiles', 'portadas-beats', 'beats-muestras', 'beats-maestros') AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Asegurar campos y datos de prueba
UPDATE profiles SET is_verified = true WHERE username = 'Sondemaik';
