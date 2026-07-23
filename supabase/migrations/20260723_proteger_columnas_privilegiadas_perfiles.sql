-- ============================================================================
-- FIX DE SEGURIDAD (CRÍTICO) — 2026-07-23
-- Escalada de privilegios vía la política RLS "Gestión de propio perfil".
--
-- Problema: la política `FOR ALL USING (auth.uid() = id)` sobre `perfiles` no
-- tiene WITH CHECK ni restricción de columnas, y ningún trigger protegía los
-- campos sensibles. Cualquier usuario autenticado podía ejecutar desde el
-- navegador:
--     supabase.from('perfiles')
--       .update({ es_admin: true, nivel_suscripcion: 'premium' })
--       .eq('id', <su propio id>)
-- y volverse administrador / darse una suscripción premium gratis.
--
-- Solución: un trigger BEFORE UPDATE que, cuando quien hace el cambio NO es
-- administrador, revierte cualquier modificación de las columnas privilegiadas
-- a su valor anterior. Los administradores (soy_admin()) pasan sin restricción,
-- de modo que el Panel Admin sigue funcionando igual. Las actualizaciones
-- normales de perfil (nombre, foto, bio, etc.) no se ven afectadas.
-- ============================================================================

CREATE OR REPLACE FUNCTION public.proteger_columnas_privilegiadas_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- La service_role (webhooks de Stripe, tareas de backend con la
  -- SERVICE_ROLE_KEY) puede cambiar cualquier columna: es la vía legítima por
  -- la que se aplican suscripciones, balances y bajas. Sin esta excepción el
  -- trigger revertiría los cambios del webhook y rompería las suscripciones.
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  -- Los administradores reales (sesión de usuario con es_admin) también pasan.
  IF public.soy_admin() THEN
    RETURN NEW;
  END IF;

  -- Para todos los demás (incluido el dueño del perfil y el rol de soporte),
  -- se preservan los valores anteriores de las columnas sensibles.
  NEW.es_admin            := OLD.es_admin;
  NEW.es_soporte          := OLD.es_soporte;
  NEW.es_fundador         := OLD.es_fundador;
  NEW.nivel_suscripcion   := OLD.nivel_suscripcion;
  NEW.balance_pendiente   := OLD.balance_pendiente;
  NEW.balance_disponible  := OLD.balance_disponible;

  RETURN NEW;
END;
$$;

-- Se ejecuta antes que el trigger de escalera de niveles para que éste vea el
-- nivel_suscripcion ya saneado.
DROP TRIGGER IF EXISTS trg_proteger_columnas_privilegiadas_perfil ON public.perfiles;
CREATE TRIGGER trg_proteger_columnas_privilegiadas_perfil
  BEFORE UPDATE ON public.perfiles
  FOR EACH ROW
  EXECUTE FUNCTION public.proteger_columnas_privilegiadas_perfil();

-- Nota: si el rol de soporte necesitara gestionar suscripciones sin ser admin,
-- añádelo explícitamente al IF de arriba SOLO para las columnas de suscripción
-- — pero NUNCA para es_admin/es_soporte, o se reabre la escalada de privilegios.
