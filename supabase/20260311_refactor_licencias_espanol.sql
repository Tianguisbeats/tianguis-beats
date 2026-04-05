-- 🚀 TIANGUIS BEATS: REFACTORIZACIÓN DEFINITIVA DE LICENCIAS (VERSIÓN ESPAÑOL)
-- Este script elimina tablas viejas y crea la estructura final para contratos personalizados.

BEGIN;

-- 1. Eliminar tablas antiguas y respaldos previos para empezar de cero
DROP TABLE IF EXISTS public.licencias_plantillas CASCADE;
DROP TABLE IF EXISTS public.licencias_plantillas_respaldo_2026 CASCADE;
DROP TABLE IF EXISTS public.licencias_respaldo_2026 CASCADE;
DROP TABLE IF EXISTS public.licencias CASCADE;

-- 2. Crear nueva tabla de Licencias en Español (Una fila por productor)
CREATE TABLE public.licencias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    productor_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE NOT NULL,
    licencia_gratis TEXT,
    licencia_basica TEXT,
    licencia_pro TEXT,
    licencia_premium TEXT,
    licencia_exclusiva TEXT,
    licencia_soundkits TEXT,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    fecha_actualizacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(productor_id)
);

-- 3. Habilitar RLS (Seguridad a nivel de fila)
ALTER TABLE public.licencias ENABLE ROW LEVEL SECURITY;

-- Política para que cualquier usuario autenticado o anónimo pueda LEER (necesario para generar PDFs)
CREATE POLICY "Permitir lectura de licencias para todos" 
ON public.licencias FOR SELECT USING (true);

-- Política para que los productores gestionen sus propios textos
CREATE POLICY "Productores gestionan sus propias licencias" 
ON public.licencias FOR ALL USING (auth.uid() = productor_id);

-- 4. Trigger para actualizar fecha_actualizacion automáticamente
CREATE OR REPLACE FUNCTION public.actualizar_timestamp_licencias()
RETURNS TRIGGER AS $$
BEGIN
    NEW.fecha_actualizacion = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_actualizar_licencias_final
BEFORE UPDATE ON public.licencias
FOR EACH ROW EXECUTE FUNCTION public.actualizar_timestamp_licencias();

COMMIT;

-- ✅ ÉXITO: Sistema de licencias reiniciado y configurado en español.
