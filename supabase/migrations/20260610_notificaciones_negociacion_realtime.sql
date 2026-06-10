-- =====================================================
-- NEGOCIACIÓN EN TIEMPO REAL + ARREGLO DE REALTIME
-- Tianguis Beats — 2026-06-10
-- =====================================================
-- Dos cosas:
--   1. La tabla `notificaciones` NO estaba en la publicación
--      `supabase_realtime`, así que el componente NotificacionesBell
--      (que se suscribe a INSERTs de `notificaciones`) nunca recibía
--      eventos en vivo: las notificaciones solo aparecían al recargar.
--      La agregamos a la publicación → TODAS las notificaciones pasan a
--      llegar en tiempo real, sin tocar el frontend.
--
--   2. Triggers en `ofertas_exclusivas` (Mesa de Negociación) para avisar
--      a la contraparte en cada movimiento:
--        - Nueva oferta del comprador  → avisa al productor.
--        - El productor acepta/rechaza/contraoferta → avisa al comprador.
--        - El comprador renegocia (nuevo monto) → avisa al productor.
--      Reutiliza la tabla `notificaciones` y su realtime, así que el aviso
--      aparece al instante en la campana del usuario.
-- =====================================================

BEGIN;

-- ---------- 1. Realtime para notificaciones ----------
-- Idempotente: solo la agrega si aún no está en la publicación.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'notificaciones'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.notificaciones;
  END IF;
END $$;

-- ---------- 2. Notificaciones de negociación ----------
CREATE OR REPLACE FUNCTION public.notificar_movimiento_negociacion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_actor          UUID := auth.uid();   -- quién hizo el cambio (null si es service role)
  v_beat_titulo    TEXT;
  v_nombre_comprador TEXT;
  v_nombre_productor TEXT;
  v_monto          TEXT := '$' || ROUND(NEW.monto_ofertado) || ' MXN';
BEGIN
  SELECT titulo INTO v_beat_titulo FROM public.beats WHERE id = NEW.beat_id;
  SELECT nombre_artistico INTO v_nombre_comprador FROM public.perfiles WHERE id = NEW.comprador_id;
  SELECT nombre_artistico INTO v_nombre_productor FROM public.perfiles WHERE id = NEW.productor_id;

  -- CASO A: nueva oferta (INSERT) → avisar al productor
  IF TG_OP = 'INSERT' THEN
    INSERT INTO public.notificaciones (usuario_id, tipo, contenido, url_destino)
    VALUES (
      NEW.productor_id,
      'negociacion_nueva',
      '🤝 ' || COALESCE(v_nombre_comprador, 'Un comprador') || ' quiere negociar "'
        || COALESCE(v_beat_titulo, 'tu beat') || '" por ' || v_monto,
      '/studio/cupones-ofertas'
    );
    RETURN NEW;
  END IF;

  -- CASO B: UPDATE. Solo notificamos si cambió el estado o el monto
  -- (los updates que solo agregan mensajes al chat no generan aviso).
  IF NEW.estado IS DISTINCT FROM OLD.estado
     OR NEW.monto_ofertado IS DISTINCT FROM OLD.monto_ofertado THEN

    IF v_actor = NEW.comprador_id THEN
      -- El comprador renegoció (nuevo monto, vuelve a 'pendiente') → avisar al productor
      INSERT INTO public.notificaciones (usuario_id, tipo, contenido, url_destino)
      VALUES (
        NEW.productor_id,
        'negociacion_respuesta',
        '🔁 ' || COALESCE(v_nombre_comprador, 'El comprador') || ' renegocia "'
          || COALESCE(v_beat_titulo, 'tu beat') || '": ahora ofrece ' || v_monto,
        '/studio/cupones-ofertas'
      );
    ELSE
      -- El productor aceptó / rechazó / contraofertó (o cambio por sistema) → avisar al comprador
      INSERT INTO public.notificaciones (usuario_id, tipo, contenido, url_destino)
      VALUES (
        NEW.comprador_id,
        'negociacion_respuesta',
        CASE NEW.estado
          WHEN 'aceptada'  THEN '✅ ' || COALESCE(v_nombre_productor, 'El productor') || ' aceptó tu oferta de ' || v_monto || ' por "' || COALESCE(v_beat_titulo, 'el beat') || '"'
          WHEN 'rechazada' THEN '❌ ' || COALESCE(v_nombre_productor, 'El productor') || ' rechazó tu oferta por "' || COALESCE(v_beat_titulo, 'el beat') || '"'
          ELSE '🔁 ' || COALESCE(v_nombre_productor, 'El productor') || ' te contraofertó ' || v_monto || ' por "' || COALESCE(v_beat_titulo, 'el beat') || '"'
        END,
        '/studio/cupones-ofertas'
      );
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_notificar_negociacion_insert ON public.ofertas_exclusivas;
CREATE TRIGGER trg_notificar_negociacion_insert
  AFTER INSERT ON public.ofertas_exclusivas
  FOR EACH ROW EXECUTE FUNCTION public.notificar_movimiento_negociacion();

DROP TRIGGER IF EXISTS trg_notificar_negociacion_update ON public.ofertas_exclusivas;
CREATE TRIGGER trg_notificar_negociacion_update
  AFTER UPDATE ON public.ofertas_exclusivas
  FOR EACH ROW EXECUTE FUNCTION public.notificar_movimiento_negociacion();

COMMIT;
