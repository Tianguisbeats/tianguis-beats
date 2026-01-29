-- Optimización de Storage para Tianguis Beats v5.13

-- 1. Crear Buckets con nombres claros y en español (descripción)
-- Nota: Supabase no permite cambiar el nombre del bucket una vez creado fácilmente, 
-- pero podemos configurar las descripciones y políticas.

-- Bucket para archivos maestros (WAV, MP3 HQ, Stems)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('beats-raw', 'beats-raw', false, 524288000, '{audio/wav,audio/mpeg,application/zip,application/x-zip-compressed}')
ON CONFLICT (id) DO UPDATE SET 
    public = false,
    file_size_limit = 524288000;

-- Bucket para previsualizaciones (MP3 con Tag)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('beats-previews', 'beats-previews', true, 20971520, '{audio/mpeg,image/jpeg,image/png}')
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 20971520;

-- Bucket para Avatares y Portadas
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('avatars', 'avatars', true, 2097152, '{image/jpeg,image/png}')
ON CONFLICT (id) DO UPDATE SET 
    public = true,
    file_size_limit = 2097152;

-- 2. Políticas de Seguridad (RLS)

-- Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Users can upload their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their own files" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their own files" ON storage.objects;

-- Política de Lectura Pública para Previews y Avatares
CREATE POLICY "Acceso de lectura pública para previsualizaciones y perfiles"
ON storage.objects FOR SELECT
USING (bucket_id IN ('beats-previews', 'avatars'));

-- Política de Subida para Usuarios Autenticados
CREATE POLICY "Soporte de subida para dueños"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
    (auth.uid()::text = (storage.foldername(name))[1])
);

-- Política de Actualización para Dueños
CREATE POLICY "Edición para dueños"
ON storage.objects FOR UPDATE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- Política de Eliminación para Dueños
CREATE POLICY "Eliminación para dueños"
ON storage.objects FOR DELETE
TO authenticated
USING (auth.uid()::text = (storage.foldername(name))[1]);

-- 3. Verificación de Usuario SonDeMaik
UPDATE profiles 
SET is_verified = true 
WHERE username = 'SonDeMaik';

-- 4. Asegurar campos de país y fecha
DO $$ 
BEGIN 
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'country') THEN
        ALTER TABLE profiles ADD COLUMN country TEXT;
    END IF;
END $$;
