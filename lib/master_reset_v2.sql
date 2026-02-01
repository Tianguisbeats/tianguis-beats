-- 🔥 TIANGUIS BEATS: MASTER RESET & DB OPTIMIZATION SCRIPT
-- ADVERTENCIA: Este script ELIMINARÁ todos los datos de Beats, Comentarios, Likes y Objetos de Storage.
-- También renombra campos críticos para la nueva estructura.

-- 1. RENOMBRAR CAMPOS DE PERFIL (Si no se ha hecho)
DO $$ 
BEGIN 
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='profiles' AND column_name='cover_url') THEN
        ALTER TABLE profiles RENAME COLUMN cover_url TO portada_perfil_url;
    END IF;
END $$;

-- 2. LIMPIEZA DE TABLAS (Truncado en cascada para reiniciar IDs)
TRUNCATE TABLE public.comments RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.likes RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.listens RESTART IDENTITY CASCADE;
TRUNCATE TABLE public.beats RESTART IDENTITY CASCADE;

-- 3. RESET DE PERFILES (Limpiar referencias de fotos)
UPDATE public.profiles 
SET avatar_url = NULL, 
    portada_perfil_url = NULL;

-- 4. LIMPIEZA DE STORAGE (Eliminar todos los archivos de los buckets)
-- Esto limpia los metadatos de los archivos en Supabase Storage
DELETE FROM storage.objects 
WHERE bucket_id IN (
    'fotos-perfil', 
    'fotos-portada', 
    'portadas-beats', 
    'beats-muestras', 
    'beats-mp3-alta-calidad', 
    'beats-wav', 
    'beats-stems'
);

-- 5. ASEGURAR QUE LOS BUCKETS EXISTAN Y SEAN CONFIGURADOS CORRECTAMENTE
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) 
VALUES 
  ('fotos-perfil', 'fotos-perfil', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg']), -- 10MB
  ('fotos-portada', 'fotos-portada', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg']), -- 10MB
  ('portadas-beats', 'portadas-beats', true, 10485760, ARRAY['image/png', 'image/jpeg', 'image/jpg']), -- 10MB
  ('beats-muestras', 'beats-muestras', true, 20971520, ARRAY['audio/mpeg']), -- 20MB
  ('beats-mp3-alta-calidad', 'beats-mp3-alta-calidad', false, 2147483648, ARRAY['audio/mpeg']), -- 2GB
  ('beats-wav', 'beats-wav', false, 2147483648, ARRAY['audio/wav', 'audio/vnd.wave', 'audio/x-wav']), -- 2GB
  ('beats-stems', 'beats-stems', false, 2147483648, ARRAY['application/zip', 'application/x-rar-compressed', 'application/octet-stream']) -- 2GB
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 6. POLÍTICAS DE ACCESO (Asegurar que sean públicos donde corresponde)
DROP POLICY IF EXISTS "Acceso Público de Lectura" ON storage.objects;
CREATE POLICY "Acceso Público de Lectura"
ON storage.objects FOR SELECT
USING (bucket_id IN ('portadas-beats', 'fotos-perfil', 'fotos-portada', 'beats-muestras'));

-- 7. PERMISOS DE TABLAS
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;

COMMIT;
