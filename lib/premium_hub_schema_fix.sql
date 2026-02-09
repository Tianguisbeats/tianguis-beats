-- ==============================================================================
-- BASE_DATOS v6.5: SOPORTE PARA PREMIUM HUB & MARKETING TOOLS
-- Fecha: 2026-02-09
-- ==============================================================================

-- 1. AGREGAR CAMPOS DE PERSONALIZACIÓN SI NO EXISTEN
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tema_perfil TEXT DEFAULT 'dark',
ADD COLUMN IF NOT EXISTS color_acento TEXT DEFAULT '#2563eb',
ADD COLUMN IF NOT EXISTS video_destacado_url TEXT;

-- 2. AGREGAR NUEVAS HERRAMIENTAS DE MARKETING (PREMIUM HUB)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS cta_text TEXT,
ADD COLUMN IF NOT EXISTS cta_url TEXT,
ADD COLUMN IF NOT EXISTS newsletter_active BOOLEAN DEFAULT FALSE;

-- 3. NOTA PARA EL DESARROLLADOR
-- Estos campos permiten que el perfil público renderice el Video Destacado,
-- el Botón de Acción Directa (CTA) y el formulario de Newsletter.
-- Sin estos campos, las consultas de perfil fallarán con error 42703 (columna indefinida).
