-- Script para agregar columnas de evidencia a la tabla de quejas_y_sugerencias
-- Ejecuta esto en el Editor SQL de Supabase

ALTER TABLE quejas_y_sugerencias 
ADD COLUMN IF NOT EXISTS evidencia_1 TEXT,
ADD COLUMN IF NOT EXISTS evidencia_2 TEXT,
ADD COLUMN IF NOT EXISTS evidencia_3 TEXT;

-- Asegurarse de que los permisos permitan lectura/escritura (opcional si ya está configurado)
-- GRANT ALL ON TABLE quejas_y_sugerencias TO authenticated;
-- GRANT ALL ON TABLE quejas_y_sugerencias TO service_role;
