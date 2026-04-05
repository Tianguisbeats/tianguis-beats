-- 🚀 TIANGUIS BEATS: Agregar columnas _activa a la tabla licencias
-- Este script agrega las columnas de activación de licencias que faltan tras la refactorización.

BEGIN;

ALTER TABLE public.licencias
    ADD COLUMN IF NOT EXISTS gratis_activa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS basica_activa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS pro_activa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS premium_activa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS exclusiva_activa BOOLEAN DEFAULT false,
    ADD COLUMN IF NOT EXISTS soundkits_activa BOOLEAN DEFAULT false;

COMMIT;

-- ✅ ÉXITO: Columnas de activación agregadas a la tabla licencias.
