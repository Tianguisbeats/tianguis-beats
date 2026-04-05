-- Migración para Stripe Connect Express
-- Añade campos para gestionar la cuenta conectada del productor

ALTER TABLE public.perfiles 
ADD COLUMN IF NOT EXISTS stripe_connect_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_connect_onboarded BOOLEAN DEFAULT false;

-- Comentario para documentación
COMMENT ON COLUMN public.perfiles.stripe_connect_id IS 'ID de la cuenta conectada de Stripe Express';
COMMENT ON COLUMN public.perfiles.stripe_connect_onboarded IS 'Indica si el productor ha completado el onboarding de Stripe';
