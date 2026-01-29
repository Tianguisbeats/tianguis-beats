-- TIANGUIS BEATS - CLEAN START V5.16 (GOLDEN SCHEMA)

-- 1. Buckets Granulares
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('fotos-perfil', 'fotos-perfil', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('fotos-portada', 'fotos-portada', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('portadas-beats', 'portadas-beats', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('beats-muestras', 'beats-muestras', true, 20971520, '{audio/mpeg}'),
('beats-mp3-alta-calidad', 'beats-mp3-alta-calidad', false, 52428800, '{audio/mpeg}'),
('beats-wav', 'beats-wav', false, 209715200, '{audio/wav,audio/x-wav}'),
('beats-stems', 'beats-stems', false, 524288000, '{application/zip,application/x-zip-compressed,application/x-rar-compressed}')
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 2. Limpieza de Políticas Previas
DELETE FROM storage.policies WHERE bucket_id IN (
    'fotos-perfil', 'fotos-portada', 'portadas-beats', 
    'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems'
);

-- 3. Políticas RLS Basadas en USERNAME (Carpeta Legible)

-- Lectura Pública
CREATE POLICY "Lectura pública fotos perfil" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-perfil');
CREATE POLICY "Lectura pública fotos portada" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-portada');
CREATE POLICY "Lectura pública portadas beats" ON storage.objects FOR SELECT USING (bucket_id = 'portadas-beats');
CREATE POLICY "Lectura pública muestras beats" ON storage.objects FOR SELECT USING (bucket_id = 'beats-muestras');

-- ACCESO PRIVADO (Solo el dueño puede leer sus archivos maestros)
CREATE POLICY "Lectura privada para dueños" ON storage.objects FOR SELECT TO authenticated
USING (
    bucket_id IN ('beats-mp3-alta-calidad', 'beats-wav', 'beats-stems')
    AND (storage.foldername(name))[1] IN (SELECT username FROM profiles WHERE id = auth.uid())
);

-- GESTIÓN COMPLETA (Subida, Edición, Eliminación)
-- Verificamos que el nombre de la primera carpeta (storage.foldername(name)[1]) coincida con el username del usuario autenticado
CREATE POLICY "Gestión por Username" ON storage.objects 
FOR ALL TO authenticated
USING (
    bucket_id IN ('fotos-perfil', 'fotos-portada', 'portadas-beats', 'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems')
    AND (storage.foldername(name))[1] IN (SELECT username FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    bucket_id IN ('fotos-perfil', 'fotos-portada', 'portadas-beats', 'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems')
    AND (storage.foldername(name))[1] IN (SELECT username FROM profiles WHERE id = auth.uid())
);

-- 4. Soporte para Insignia de Verificación y Founder
-- Aseguramos que los campos existen y tienen valores por defecto
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_founder BOOLEAN DEFAULT false;

-- 5. Inicialización de Usuario Propietario (Sondemaik)
-- Ejecutar esto después de registrarse para obtener los beneficios de inmediato
-- UPDATE profiles SET is_verified = true, is_founder = true, subscription_tier = 'premium' WHERE username = 'Sondemaik';
