-- SQL Migration: Add subgenre to beats table
-- Version: 1.0 - 2026-02-04

-- 1. Add subgenre column
ALTER TABLE beats ADD COLUMN IF NOT EXISTS subgenre TEXT;

-- 2. Add index for performance on filtering
CREATE INDEX IF NOT EXISTS idx_beats_subgenre ON beats(subgenre);
CREATE INDEX IF NOT EXISTS idx_beats_genre ON beats(genre); -- Ensure genre is indexed too

-- 3. Comment for documentation
COMMENT ON COLUMN beats.subgenre IS 'Sub-categoría del género principal para filtrado avanzado.';
