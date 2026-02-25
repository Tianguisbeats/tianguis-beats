-- TIANGUIS BEATS - MIGRATION v5.40
-- Description: Add Pro license tier columns to beats table

-- 1. Add columns for Pro license tier if they don't exist
ALTER TABLE beats ADD COLUMN IF NOT EXISTS is_pro_active BOOLEAN DEFAULT true;
ALTER TABLE beats ADD COLUMN IF NOT EXISTS price_pro_mxn INTEGER DEFAULT 499;

-- 2. Update existing rows to have default values (optional but recommended)
UPDATE beats SET is_pro_active = true WHERE is_pro_active IS NULL;
UPDATE beats SET price_pro_mxn = 499 WHERE price_pro_mxn IS NULL;
