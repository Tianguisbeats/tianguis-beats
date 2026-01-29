-- Reestructuración Granular de Storage para Tianguis Beats v5.15

-- 1. Creación de Buckets Especializados
-- Buckets Públicos (Imágenes y Previews)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('fotos-perfil', 'fotos-perfil', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('fotos-portada', 'fotos-portada', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('portadas-beats', 'portadas-beats', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('beats-muestras', 'beats-muestras', true, 20971520, '{audio/mpeg}')
ON CONFLICT (id) DO UPDATE SET public = true, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Buckets Privados (Archivos Maestros y de Venta)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('beats-mp3-alta-calidad', 'beats-mp3-alta-calidad', false, 52428800, '{audio/mpeg}'),
('beats-wav', 'beats-wav', false, 209715200, '{audio/wav,audio/x-wav}'),
('beats-stems', 'beats-stems', false, 524288000, '{application/zip,application/x-zip-compressed,application/x-rar-compressed}')
ON CONFLICT (id) DO UPDATE SET public = false, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Limpieza de Políticas Previas para evitar conflictos
DELETE FROM storage.policies WHERE bucket_id IN (
    'fotos-perfil', 'fotos-portada', 'portadas-beats', 
    'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems'
);

-- 3. Políticas RLS (Row Level Security)
-- Lectura Pública
CREATE POLICY "Lectura pública fotos perfil" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-perfil');
CREATE POLICY "Lectura pública fotos portada" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-portada');
CREATE POLICY "Lectura pública portadas beats" ON storage.objects FOR SELECT USING (bucket_id = 'portadas-beats');
CREATE POLICY "Lectura pública muestras beats" ON storage.objects FOR SELECT USING (bucket_id = 'beats-muestras');

-- Subida/Gestión para dueños (basado en auth.uid())
CREATE POLICY "Gestión completa para dueños" ON storage.objects 
FOR ALL TO authenticated
USING (bucket_id IN (
    'fotos-perfil', 'fotos-portada', 'portadas-beats', 
    'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems'
) AND (storage.foldername(name))[1] = auth.uid()::text)
WITH CHECK (bucket_id IN (
    'fotos-perfil', 'fotos-portada', 'portadas-beats', 
    'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems'
) AND (storage.foldername(name))[1] = auth.uid()::text);

-- 4. Verificación de Usuario Sondemaik
UPDATE profiles SET is_verified = true WHERE username = 'Sondemaik';
