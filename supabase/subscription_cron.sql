-- ==============================================================================
-- 🕰️ SCRIPT DE AUTOMATIZACIÓN DE SUSCRIPCIONES (CRON JOB)
-- ==============================================================================
-- Este script crea una función y un trabajo programado (Cron Job) que se 
-- ejecutará automáticamente cada hora en el servidor de Supabase para revisar
-- las suscripciones vencidas y revocarlas.
-- 
-- 1. Ejecuta todo este script en el Supabase SQL Editor.
-- ==============================================================================

-- 1. Habilitar la extensión pg_cron (si no está habilitada)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- 2. Crear la función que revisa y actualiza los perfiles vencidos
CREATE OR REPLACE FUNCTION check_and_revoke_expired_subscriptions()
RETURNS void AS $$
BEGIN
    -- Actualizar perfiles donde la fecha de término ya pasó
    -- Y que aún tienen un tier de subscripción activo o son founders.
    UPDATE public.profiles
    SET 
        subscription_tier = 'free',
        is_founder = false
    WHERE 
        termina_suscripcion IS NOT NULL 
        AND termina_suscripcion <= NOW()
        AND (subscription_tier != 'free' OR is_founder = true);
        
    -- Opcional: Podrías registrar en otra tabla que la suscripción expiró
    -- INSERT INTO public.audit_logs (action, description) VALUES ('CRON', 'Suscripciones vencidas procesadas');
END;
$$ LANGUAGE plpgsql;

-- ==============================================================================
-- 3. Programar el Cron Job (Se ejecutará cada hora)
-- ==============================================================================

-- Eliminar el job si ya existe para evitar duplicados al correr el script múltiples veces
SELECT cron.unschedule('revoke-expired-subs-job');

-- Programar el job para ejecutarse en el minuto 0 de cada hora ('0 * * * *')
-- Si quieres que sea una vez al día a la medianoche usa: ('0 0 * * *')
SELECT cron.schedule(
    'revoke-expired-subs-job', -- Nombre del trabajo
    '0 * * * *',               -- Expresión cron (cada hora)
    $$ SELECT check_and_revoke_expired_subscriptions(); $$
);

-- Nota: Si tu base de datos o Supabase interfiere con los permisos del cron, 
-- quizás necesites invocar la función de la API de supabase via pg_net (Petición HTTP),
-- sin embargo, ejecutar localmente la función SQL suele ser lo más óptimo.
