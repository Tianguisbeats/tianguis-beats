-- ==============================================================================
-- 📝 TABLA DE QUEJAS Y SUGERENCIAS (TIANGUIS BEATS)
-- ==============================================================================

-- 1. Crear la tabla con los nombres de campos solicitados
CREATE TABLE IF NOT EXISTS public.quejas_y_sugerencias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo_mensaje VARCHAR, -- 'queja' o 'sugerencia'
    nombre_usuario VARCHAR,
    email VARCHAR,
    descripcion_queja TEXT,
    user_id UUID REFERENCES public.profiles(id),
    estado VARCHAR DEFAULT 'pendiente', -- 'pendiente', 'leído', 'resuelto'
    fecha_creacion TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- 2. Activar Seguridad de Nivel de Fila (RLS)
ALTER TABLE public.quejas_y_sugerencias ENABLE ROW LEVEL SECURITY;

-- 3. Políticas de Acceso
-- Permitir que CUALQUIER usuario (autenticado o no, según lógica de app) inserte
CREATE POLICY "Permitir inserción pública" 
    ON public.quejas_y_sugerencias 
    FOR INSERT 
    WITH CHECK (true);

-- Permitir que solo los administradores vean los mensajes
CREATE POLICY "Permitir lectura a administradores" 
    ON public.quejas_y_sugerencias 
    FOR SELECT 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );

-- Permitir que solo los administradores actualicen el estado (ej. de pendiente a resuelto)
CREATE POLICY "Permitir actualización a administradores" 
    ON public.quejas_y_sugerencias 
    FOR UPDATE 
    USING (
        EXISTS (
            SELECT 1 FROM public.profiles 
            WHERE profiles.id = auth.uid() AND profiles.is_admin = true
        )
    );
