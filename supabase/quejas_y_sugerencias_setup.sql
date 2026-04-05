-- ==============================================================================
-- 📝 TABLA DE QUEJAS Y SUGERENCIAS (VERSIÓN ROBUSTA)
-- ==============================================================================
-- Nota: Usamos gen_random_uuid() para mayor compatibilidad sin extensiones.

CREATE TABLE IF NOT EXISTS public.quejas_y_sugerencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo_mensaje VARCHAR, -- 'queja' o 'sugerencia'
    nombre_usuario VARCHAR,
    email VARCHAR,
    descripcion_queja TEXT,
    user_id UUID REFERENCES public.profiles(id),
    estado VARCHAR DEFAULT 'pendiente',
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Habilitar RLS
ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;

-- Borrar políticas previas para evitar conflictos al re-ejecutar
DROP POLICY IF EXISTS "Permitir inserción pública" ON public.quejas_y_sugerencias;
DROP POLICY IF EXISTS "Permitir lectura a administradores" ON public.quejas_y_sugerencias;

-- Políticas
CREATE POLICY "Permitir inserción pública" ON public.quejas_y_sugerencias FOR INSERT WITH CHECK (true);

CREATE POLICY "Permitir lectura a administradores" ON public.quejas_y_sugerencias FOR SELECT 
USING (EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.is_admin = true));
