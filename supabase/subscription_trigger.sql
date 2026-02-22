-- ==============================================================================
-- 🔄 TRIGGER DE SINCRONIZACIÓN AUTOMÁTICA DE SUSCRIPCIONES
-- ==============================================================================
-- Este script crea una función y un trigger en la tabla 'profiles'.
-- Su propósito es asegurar que CUALQUIER cambio manual (ej. desde el panel
-- de administrador de Supabase) a la fecha 'termina_suscripcion' automáticamente
-- actualice el estado de 'is_founder'.
--
-- Reglas:
-- 1. Si 'termina_suscripcion' es NULL o en el pasado -> is_founder = false
-- 2. Si 'termina_suscripcion' es en el futuro -> is_founder = true
-- ==============================================================================

-- 1. Crear la función que evalúa la fecha y actualiza is_founder
CREATE OR REPLACE FUNCTION sync_founder_status()
RETURNS TRIGGER AS $$
BEGIN
    -- Si la fecha de término es nula o ya pasó, quitamos el status founder
    IF NEW.termina_suscripcion IS NULL OR NEW.termina_suscripcion <= NOW() THEN
        NEW.is_founder = false;
        
        -- Opcional: Si quieres que también fuerce el tier a 'free' cuando expira
        -- Descomenta la siguiente línea:
        -- NEW.subscription_tier = 'free';
        
    -- Si la fecha de término es obligatoriamente en el futuro, activamos founder
    ELSIF NEW.termina_suscripcion > NOW() THEN
        NEW.is_founder = true;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Eliminar el trigger si ya existe (para evitar errores al correrlo múltiples veces)
DROP TRIGGER IF EXISTS trg_sync_founder_status ON public.profiles;

-- 3. Crear el trigger que se ejecuta ANTES (BEFORE) de cada UPDATE en la tabla profiles
-- Solo se ejecutará cuando la columna 'termina_suscripcion' sea modificada.
CREATE TRIGGER trg_sync_founder_status
BEFORE UPDATE OF termina_suscripcion
ON public.profiles
FOR EACH ROW
EXECUTE FUNCTION sync_founder_status();

-- Nota:
-- Con este Trigger, si tú entras a Supabase y le pones a un usuario "termina_suscripcion: 2026-01-01",
-- automáticamente la base de datos pondrá su "is_founder" en TRUE.  
-- Si se la borras (NULL) o la pones en el pasado, automáticamente se pone en FALSE.
