BEGIN;

-- ==============================================================================
-- 1. MUESTRAS KITS SONIDO (Bucket para Preview MP3)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'muestras_kits_sonido', 
    'muestras_kits_sonido', 
    true, 
    20971520, 
    ARRAY['audio/mpeg', 'audio/mp3']
)
ON CONFLICT (id) DO UPDATE SET 
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- ==============================================================================
-- 2. POLÍTICAS DE SEGURIDAD (RLS)
-- ==============================================================================
-- Eliminar políticas existentes para evitar conflictos si se vuelve a correr el script
DROP POLICY IF EXISTS "Lectura pública de muestras_kits_sonido" ON storage.objects;
DROP POLICY IF EXISTS "Gestión propia muestras_kits_sonido" ON storage.objects;

-- Crear políticas de lectura y escritura
CREATE POLICY "Lectura pública de muestras_kits_sonido" ON storage.objects FOR SELECT USING (bucket_id = 'muestras_kits_sonido');
CREATE POLICY "Gestión propia muestras_kits_sonido" ON storage.objects FOR ALL USING (
    bucket_id = 'muestras_kits_sonido' AND auth.uid()::text = (storage.foldername(name))[1]
);

COMMIT;
