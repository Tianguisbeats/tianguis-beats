-- ============================================================================
-- FIX DE SEGURIDAD (CRÍTICO) — 2026-07-23 (segunda pasada)
--
-- 1) Funciones RPC SECURITY DEFINER expuestas sin restricción a `anon` y
--    `authenticated`, que solo deberían invocarse desde el backend
--    (service_role). Confirmado en el código: `incrementar_balance_productor`,
--    `manejar_upgrade_produccion` y `manejar_downgrade_produccion` solo se
--    llaman desde app/api/webhooks/stripe/route.ts con supabaseAdmin
--    (service_role). Cualquier usuario podía llamarlas directo:
--        supabase.rpc('incrementar_balance_productor', { id_productor: '<otro-uuid>', monto_ganancia: 999999 })
--    y sumarse saldo falso, o reactivar contenido desactivado por plan de
--    otro productor. `incrementar_conteo_descargas` e `incrementar_uso_cupon`
--    tampoco se usan desde el cliente (verificado por grep en todo el repo)
--    y quedaban igualmente expuestas.
--
--    NO se tocan `incrementar_reproduccion` ni `alternar_like_comentario`:
--    ambas se llaman legítimamente desde el navegador (context/PlayerContext.tsx
--    y app/[username]/page.tsx respectivamente) y deben seguir siendo públicas.
--
-- 2) Se amplía la lista de columnas protegidas por el trigger
--    trg_00_proteger_columnas_privilegiadas_perfil (creado en la migración
--    previa) a las columnas de Stripe/suscripción que, verificado en el
--    código, NUNCA se escriben desde el cliente (solo desde
--    app/api/**/route.ts con service_role):
--        stripe_cliente_id, stripe_suscripcion_id, stripe_connect_id,
--        stripe_connect_onboarded, cancela_al_final, es_prueba,
--        fecha_fin_prueba, fecha_termino_suscripcion, es_regalo,
--        estado_verificacion
--    Deliberadamente NO se incluyen `esta_verificado` ni
--    `fecha_inicio_suscripcion`: ambas SÍ se escriben desde el navegador
--    (panel admin / app/pricing/page.tsx) y protegerlas ahora las rompería
--    en silencio. Quedan pendientes de una revisión aparte del código antes
--    de poder protegerlas sin romper flujos existentes.
-- ============================================================================

-- Postgres otorga EXECUTE a PUBLIC por defecto al crear una función; un
-- REVOKE dirigido solo a `anon`/`authenticated` no basta porque heredan el
-- permiso vía PUBLIC. Hay que revocar de PUBLIC y re-otorgar explícitamente
-- solo a los roles que sí deben poder invocarlas.
REVOKE EXECUTE ON FUNCTION public.incrementar_balance_productor(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.manejar_upgrade_produccion(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.manejar_downgrade_produccion(uuid) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.incrementar_conteo_descargas(uuid, text) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.incrementar_uso_cupon(uuid) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.incrementar_balance_productor(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.manejar_upgrade_produccion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.manejar_downgrade_produccion(uuid) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_conteo_descargas(uuid, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.incrementar_uso_cupon(uuid) TO service_role;

CREATE OR REPLACE FUNCTION public.proteger_columnas_privilegiadas_perfil()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF (SELECT auth.role()) = 'service_role' THEN
    RETURN NEW;
  END IF;

  IF public.soy_admin() THEN
    RETURN NEW;
  END IF;

  NEW.es_admin                := OLD.es_admin;
  NEW.es_soporte               := OLD.es_soporte;
  NEW.es_fundador              := OLD.es_fundador;
  NEW.nivel_suscripcion        := OLD.nivel_suscripcion;
  NEW.balance_pendiente        := OLD.balance_pendiente;
  NEW.balance_disponible       := OLD.balance_disponible;
  NEW.stripe_cliente_id        := OLD.stripe_cliente_id;
  NEW.stripe_suscripcion_id    := OLD.stripe_suscripcion_id;
  NEW.stripe_connect_id        := OLD.stripe_connect_id;
  NEW.stripe_connect_onboarded := OLD.stripe_connect_onboarded;
  NEW.cancela_al_final         := OLD.cancela_al_final;
  NEW.es_prueba                := OLD.es_prueba;
  NEW.fecha_fin_prueba         := OLD.fecha_fin_prueba;
  NEW.fecha_termino_suscripcion := OLD.fecha_termino_suscripcion;
  NEW.es_regalo                := OLD.es_regalo;
  NEW.estado_verificacion      := OLD.estado_verificacion;

  RETURN NEW;
END;
$$;

-- Nota: `esta_verificado` (panel admin, incluye personal de soporte) y
-- `fecha_inicio_suscripcion` (app/pricing/page.tsx, cualquier usuario) se
-- escriben hoy desde el navegador y quedan fuera de esta protección a
-- propósito. También pendiente: soy_admin() solo reconoce es_admin, no
-- es_soporte, así que el personal de soporte ya no puede guardar cambios de
-- columnas protegidas desde el panel admin (gap preexistente a esta
-- migración, no introducido por ella).
