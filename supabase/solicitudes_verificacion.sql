-- ==============================================================================
-- 🛡️ TIANGUIS BEATS - INFRAESTRUCTURA DE SOLICITUDES DE VERIFICACIÓN
-- ==============================================================================

BEGIN;

-- 1. Crear tabla de solicitudes
CREATE TABLE IF NOT EXISTS public.solicitudes_verificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    nombre_real TEXT NOT NULL,
    nombre_artistico TEXT NOT NULL,
    url_red_social TEXT NOT NULL,
    motivacion TEXT,
    url_documento TEXT NOT NULL,
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    mensaje_feedback TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.solicitudes_verificacion ENABLE ROW LEVEL SECURITY;

-- 3. Políticas
CREATE POLICY "Usuarios pueden ver sus propias solicitudes" 
ON public.solicitudes_verificacion FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias solicitudes" 
ON public.solicitudes_verificacion FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- 4. Trigger para actualizar fecha de modificación
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_updated_at
BEFORE UPDATE ON public.solicitudes_verificacion
FOR EACH ROW
EXECUTE FUNCTION public.handle_updated_at();

-- 5. Comentarios
COMMENT ON TABLE public.solicitudes_verificacion IS 'Almacena las solicitudes formales de verificación de productores.';

COMMIT;
