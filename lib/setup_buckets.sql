-- TIANGUIS BEATS - CONFIGURACIÓN DE BUCKETS ESTANDARIZADA
-- Ejecuta este script en el SQL Editor de Supabase

-- 1. CREACIÓN DE BUCKETS (Si no existen)
INSERT INTO storage.buckets (id, name, public) 
VALUES 
  ('fotos-perfil', 'fotos-perfil', true),
  ('fotos-portada', 'fotos-portada', true),
  ('portadas-beats', 'portadas-beats', true),
  ('beats-muestras', 'beats-muestras', true),
  ('beats-mp3-alta-calidad', 'beats-mp3-alta-calidad', false),
  ('beats-wav', 'beats-wav', false),
  ('beats-stems', 'beats-stems', false)
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public;

-- 2. POLÍTICAS DE ACCESO PÚBLICO (Lectura libre)
-- Esto permite que cualquier usuario o visitante vea las fotos y escuche los beats

-- Intentar eliminar políticas si ya existen para evitar errores duplicados
DROP POLICY IF EXISTS "Acceso Público de Lectura" ON storage.objects;

-- Crear política general para buckets públicos
CREATE POLICY "Acceso Público de Lectura"
ON storage.objects FOR SELECT
USING (bucket_id IN ('portadas-beats', 'fotos-perfil', 'fotos-portada', 'beats-muestras'));
