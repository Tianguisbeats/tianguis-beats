-- ==============================================================================
-- 🗄️ TIANGUIS BEATS - FIX DEFINITIVO DE BUCKETS (ESPAÑOL)
-- ==============================================================================
-- Este script asegura que los buckets de fotos de perfil y portada existan
-- con el nombre correcto (con guion bajo _) y tengan las políticas RLS activas.
-- ==============================================================================

BEGIN;

-- 1. CREACIÓN DE BUCKETS (SI NO EXISTEN)
-- Fotos de Perfil
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos_perfil', 'fotos_perfil', true)
ON CONFLICT (id) DO NOTHING;

-- Fotos de Portada
INSERT INTO storage.buckets (id, name, public)
VALUES ('fotos_portada', 'fotos_portada', true)
ON CONFLICT (id) DO NOTHING;

-- Portadas de Beats
INSERT INTO storage.buckets (id, name, public)
VALUES ('portadas_beats', 'portadas_beats', true)
ON CONFLICT (id) DO NOTHING;

-- 2. LIMPIEZA Y RECREACIÓN DE POLÍTICAS RLS
-- Fotos Perfil
DROP POLICY IF EXISTS "Lectura pública de fotos_perfil" ON storage.objects;
DROP POLICY IF EXISTS "Gestión propia fotos_perfil" ON storage.objects;

CREATE POLICY "Lectura pública de fotos_perfil" ON storage.objects 
FOR SELECT USING (bucket_id = 'fotos_perfil');

CREATE POLICY "Gestión propia fotos_perfil" ON storage.objects 
FOR ALL USING (
    bucket_id = 'fotos_perfil' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Fotos Portada
DROP POLICY IF EXISTS "Lectura pública de fotos_portada" ON storage.objects;
DROP POLICY IF EXISTS "Gestión propia fotos_portada" ON storage.objects;

CREATE POLICY "Lectura pública de fotos_portada" ON storage.objects 
FOR SELECT USING (bucket_id = 'fotos_portada');

CREATE POLICY "Gestión propia fotos_portada" ON storage.objects 
FOR ALL USING (
    bucket_id = 'fotos_portada' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

-- Portadas Beats (Para el catálogo)
DROP POLICY IF EXISTS "Lectura pública de portadas_beats" ON storage.objects;
DROP POLICY IF EXISTS "Gestión propia portadas_beats" ON storage.objects;

CREATE POLICY "Lectura pública de portadas_beats" ON storage.objects 
FOR SELECT USING (bucket_id = 'portadas_beats');

CREATE POLICY "Gestión propia portadas_beats" ON storage.objects 
FOR ALL USING (
    bucket_id = 'portadas_beats' 
    AND (auth.uid())::text = (storage.foldername(name))[1]
);

COMMIT;
