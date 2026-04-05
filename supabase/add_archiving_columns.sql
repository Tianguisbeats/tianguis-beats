-- Añadir columnas para el archivado inteligente de beats
ALTER TABLE beats ADD COLUMN IF NOT EXISTS esta_archivado BOOLEAN DEFAULT false;
ALTER TABLE beats ADD COLUMN IF NOT EXISTS es_visible BOOLEAN DEFAULT true;

COMMENT ON COLUMN beats.esta_archivado IS 'Indica si el beat ha sido retirado por el productor pero se mantiene para compradores';
COMMENT ON COLUMN beats.es_visible IS 'Indica si el beat debe aparecer en el catálogo público';
