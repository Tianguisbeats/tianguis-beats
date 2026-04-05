-- Añadir columnas para gestión inteligente de suscripciones
ALTER TABLE perfiles 
ADD COLUMN IF NOT EXISTS es_prueba BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS es_regalo BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS stripe_suscripcion_id TEXT;

-- Comentario para documentación
COMMENT ON COLUMN perfiles.es_prueba IS 'Indica si el usuario está en un periodo de prueba (trial) de Stripe';
COMMENT ON COLUMN perfiles.es_regalo IS 'Indica si la suscripción fue otorgada como regalo o cupón del 100%';
COMMENT ON COLUMN perfiles.stripe_suscripcion_id IS 'ID técnico de la suscripcion en Stripe (sub_...)';
