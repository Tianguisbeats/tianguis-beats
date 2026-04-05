-- ==============================================================================
-- 🛡️ TIANGUIS BEATS - INFRAESTRUCTURA DE SOLICITUDES DE VERIFICACIÓN (FINAL V3)
-- ==============================================================================

BEGIN;

-- 1. Eliminar tabla si existe para recrear con soporte de doble imagen
DROP TABLE IF EXISTS public.solicitudes_verificacion CASCADE;

-- 2. Crear tabla de solicitudes corregida
CREATE TABLE public.solicitudes_verificacion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    nombre_completo TEXT NOT NULL,
    nombre_usuario TEXT NOT NULL,
    correo TEXT NOT NULL,
    url_red_social TEXT NOT NULL,
    motivacion TEXT,
    url_doc_frontal TEXT NOT NULL, -- Identificación frente
    url_doc_trasero TEXT NOT NULL, -- Identificación vuelta (obligatorio)
    estado TEXT NOT NULL DEFAULT 'pendiente', -- 'pendiente', 'aprobado', 'rechazado'
    mensaje_feedback TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now()
);

-- 3. Habilitar RLS
ALTER TABLE public.solicitudes_verificacion ENABLE ROW LEVEL SECURITY;

-- 4. Políticas
-- Borrar políticas viejas si existen
DROP POLICY IF EXISTS "Usuarios pueden ver sus propias solicitudes" ON public.solicitudes_verificacion;
DROP POLICY IF EXISTS "Usuarios pueden crear sus propias solicitudes" ON public.solicitudes_verificacion;
DROP POLICY IF EXISTS "Admins pueden gestionar todo" ON public.solicitudes_verificacion;

CREATE POLICY "Usuarios pueden ver sus propias solicitudes" 
ON public.solicitudes_verificacion FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden crear sus propias solicitudes" 
ON public.solicitudes_verificacion FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins pueden gestionar todo" 
ON public.solicitudes_verificacion FOR ALL
TO authenticated
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE id = auth.uid() AND es_admin = true
    )
);

-- 5. Trigger para actualizar fecha de modificación
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

-- 6. Comentarios
COMMENT ON TABLE public.solicitudes_verificacion IS 'Almacena las solicitudes de verificación con soporte para identificación frontal y trasera.';

COMMIT;
