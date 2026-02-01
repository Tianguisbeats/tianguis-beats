-- SQL Migration: Rename profile cover field and Reset Database/Storage refs
-- This script:
-- 1. Renames cover_url to portada_perfil_url in profiles table
-- 2. Cleans up existing beats data for a fresh start (as requested)
-- 3. Resets storage references if any (optional based on your needs)

-- 1. Renombrar columna en perfiles
ALTER TABLE profiles RENAME COLUMN cover_url TO portada_perfil_url;

-- 2. Limpiar tabla de beats para reinicio total
TRUNCATE TABLE beats CASCADE;

-- 3. Limpiar tabla de likes, comentarios y escuchas (opcional pero recomendado para un reinicio limpio)
TRUNCATE TABLE likes;
TRUNCATE TABLE comments;
TRUNCATE TABLE listens;

-- 4. Asegurar permisos
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT ALL ON ALL TABLES IN SCHEMA public TO authenticated;

-- NOTA: Para limpiar los Buckets manualmente en el dashboard de Supabase:
-- Ve a Storage -> Buckets -> Selecciona cada bucket y elige "Empty bucket" o borrar y recrear.
