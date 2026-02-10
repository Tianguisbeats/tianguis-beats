-- SQL para habilitar Smart Link Bio y Fan Capture en Tianguis Beats

-- 1. Añadir columna para el estado de los enlaces sociales (Smart Link Bio)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS links_active BOOLEAN DEFAULT false;

-- 2. Asegurarse de que las columnas de marketing premium existan y tengan valores por defecto
-- (video destacado, llamada a la acción y newsletter)
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = 'profiles' AND COLUMN_NAME = 'links_active') THEN
        ALTER TABLE public.profiles ADD COLUMN links_active BOOLEAN DEFAULT false;
    END IF;

    -- Podríamos añadir índices aquí si fuera necesario para búsquedas rápidas por username
END $$;

-- Comentario informativo: 
-- Ejecuta este script en el SQL Editor de Supabase para que los toggles de "Smart Link Bio" 
-- en el Hub Premium puedan guardar su estado correctamente en la base de datos.
