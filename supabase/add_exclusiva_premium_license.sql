-- =====================================================
-- MIGRACIÓN: Exclusiva Estándar + Exclusiva Premium
-- La licencia "exclusiva" que ya existía se convierte en Premium (WAV+MP3+Stems)
-- Se crean nuevas columnas para Exclusiva Estándar (WAV+MP3, sin stems)
-- Fecha: 2026-04-04
-- =====================================================

-- ─── TABLA: beats ────────────────────────────────────

-- 1. Renombrar columnas existentes → ahora son de la licencia Premium
ALTER TABLE beats
    RENAME COLUMN es_exclusiva_activa TO es_exclusiva_premium_activa;

ALTER TABLE beats
    RENAME COLUMN precio_exclusivo_mxn TO precio_exclusiva_premium_mxn;

-- 2. Crear nuevas columnas para Exclusiva Estándar (WAV + MP3, sin stems)
ALTER TABLE beats
    ADD COLUMN IF NOT EXISTS es_exclusiva_estandar_activa boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS precio_exclusiva_estandar_mxn integer NOT NULL DEFAULT 0;

-- ─── TABLA: licencias (plantillas de contratos del productor) ────────────────

-- 3. Renombrar columna existente del contrato exclusivo → ahora es de Premium
ALTER TABLE licencias
    RENAME COLUMN licencia_exclusiva TO licencia_exclusiva_premium;

-- 4. Crear nueva columna de plantilla para Exclusiva Estándar
ALTER TABLE licencias
    ADD COLUMN IF NOT EXISTS licencia_exclusiva_estandar text,
    ADD COLUMN IF NOT EXISTS exclusiva_estandar_activa boolean NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS exclusiva_premium_activa boolean NOT NULL DEFAULT false;

-- ─── ÍNDICES ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_beats_exclusiva_estandar
    ON beats (es_exclusiva_estandar_activa)
    WHERE es_exclusiva_estandar_activa = true;

CREATE INDEX IF NOT EXISTS idx_beats_exclusiva_premium
    ON beats (es_exclusiva_premium_activa)
    WHERE es_exclusiva_premium_activa = true;

-- ─── VERIFICACIÓN ────────────────────────────────────
-- SELECT column_name, data_type, column_default
-- FROM information_schema.columns
-- WHERE table_name = 'beats'
--   AND column_name LIKE '%exclusiva%'
-- ORDER BY column_name;
