-- ==============================================================================
-- 📝 FIJAR TABLA DE QUEJAS Y SUGERENCIAS (VERSIÓN 2.0)
-- ==============================================================================
-- Este script recrea la tabla para que coincida con los nombres usados en el frontend.
-- Además, habilita las políticas RLS para lectura por parte de administradores.

BEGIN;

-- 1. Eliminar la tabla actual para evitar conflictos de nombres
DROP TABLE IF EXISTS public.quejas_y_sugerencias CASCADE;

-- 2. Recrear la tabla con los nombres de columna que espera el frontend
CREATE TABLE public.quejas_y_sugerencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_mensaje TEXT, -- 'queja' o 'sugerencia'
    usuario_q TEXT, -- Nombre del usuario que envía (según frontend)
    correo TEXT,
    descripcion_problema TEXT, -- Descripción detallada (según frontend)
    usuario_id UUID REFERENCES public.perfiles(id) ON DELETE SET NULL, -- ID del usuario autenticado
    estado TEXT DEFAULT 'pendiente', -- 'pendiente', 'leido', 'resuelto'
    evidencia_1 TEXT, -- Ruta en storage
    evidencia_2 TEXT,
    evidencia_3 TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;

-- 4. Políticas de Acceso
-- Permitir que cualquier persona (vía API pública/anon) inserte registros
CREATE POLICY "Permitir inserción pública" 
ON public.quejas_y_sugerencias 
FOR INSERT 
WITH CHECK (true);

-- Permitir que solo administradores puedan VER los registros
CREATE POLICY "Permitir lectura a administradores" 
ON public.quejas_y_sugerencias 
FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE perfiles.id = auth.uid() 
        AND perfiles.es_admin = true
    )
);

-- Permitir que solo administradores puedan ACTUALIZAR registros (ej. cambiar estado)
CREATE POLICY "Permitir actualización a administradores" 
ON public.quejas_y_sugerencias 
FOR UPDATE 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE perfiles.id = auth.uid() 
        AND perfiles.es_admin = true
    )
);

COMMIT;
