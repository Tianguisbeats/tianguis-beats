-- =====================================================
-- Cleanup de funciones duplicadas y no usadas — 2026-04-25
-- Tianguis Beats
-- =====================================================

BEGIN;

-- =====================================================
-- 1. CONSOLIDAR FUNCIONES DE TIMESTAMP DUPLICADAS
-- =====================================================
-- Antes: 4 funciones haciendo lo mismo (NEW.fecha_actualizacion = now())
-- Después: solo actualizar_fecha_mutacion (la canónica que ya se usa
--          en triggers de perfiles y proyectos)

-- Apuntar el trigger de licencias a la función canónica
DROP TRIGGER IF EXISTS trg_actualizar_licencias_final ON public.licencias;

CREATE TRIGGER trg_actualizar_licencias_final
  BEFORE UPDATE ON public.licencias
  FOR EACH ROW EXECUTE FUNCTION public.actualizar_fecha_mutacion();

-- Eliminar las 3 funciones redundantes
DROP FUNCTION IF EXISTS public.actualizar_timestamp_licencias();
DROP FUNCTION IF EXISTS public.actualizar_timestamp_licencias_final();
DROP FUNCTION IF EXISTS public.handle_updated_at();

-- =====================================================
-- 2. ELIMINAR FUNCIONES DE BUCKET NO USADAS
-- =====================================================
-- Cero referencias en el código TypeScript

DROP FUNCTION IF EXISTS public.crear_bucket(text, boolean, bigint, text[]);
DROP FUNCTION IF EXISTS public.crear_bucket_seguro(text, boolean);
DROP FUNCTION IF EXISTS public.limpiar_politicas_bucket(text);

COMMIT;
