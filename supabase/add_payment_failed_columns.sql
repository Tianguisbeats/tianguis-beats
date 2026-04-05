-- ==============================================================================
-- 💳 COLUMNAS PARA MANEJAR ESTADOS DE PAGO FALLIDOS EN SUSCRIPCIONES
-- ==============================================================================
-- Este script agrega las columnas necesarias de seguimiento para cuando
-- Stripe reporta un \`invoice.payment_failed\` o un status \`past_due\`.

BEGIN;

-- 1. Agregamos flag para indicar un fallo de pago y fecha del primer fallo
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS pago_pendiente BOOLEAN DEFAULT false;
ALTER TABLE public.perfiles ADD COLUMN IF NOT EXISTS fecha_pago_fallido TIMESTAMP WITH TIME ZONE;

-- (Opcional) Si quieres tener una vista en el administrador, 
-- ahora es posible ver quiénes están en estado \`past_due\` filtrando por pago_pendiente = true

COMMIT;
