-- =====================================================
-- Triggers automáticos de notificaciones — 2026-04-25
-- Tianguis Beats
-- =====================================================
-- Eventos que generan notificaciones:
--   1. nueva_venta     — productor vendió un beat
--   2. nuevo_seguidor  — alguien te siguió
--   3. nuevo_comentario — comentaron en tu beat
-- =====================================================

BEGIN;

-- =====================================================
-- 1. NOTIFICACIÓN: NUEVA VENTA
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_nueva_venta()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.tipo_producto = 'beat'
     AND NEW.estado_pago = 'completado'
     AND NEW.vendedor_id IS NOT NULL
     AND NEW.vendedor_id <> NEW.comprador_id
  THEN
    INSERT INTO public.notificaciones (usuario_id, tipo, contenido, url_destino)
    VALUES (
      NEW.vendedor_id,
      'nueva_venta',
      '💰 Vendiste "' || NEW.nombre_producto || '" por $' || ROUND(NEW.precio_total) || ' MXN',
      '/studio/sales'
    );
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_venta
  AFTER INSERT ON public.transacciones
  FOR EACH ROW EXECUTE FUNCTION public.notificar_nueva_venta();


-- =====================================================
-- 2. NOTIFICACIÓN: NUEVO SEGUIDOR
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_nuevo_seguidor()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_nombre TEXT;
  v_username TEXT;
BEGIN
  SELECT nombre_artistico, nombre_usuario
  INTO v_nombre, v_username
  FROM public.perfiles WHERE id = NEW.seguidor_id;

  INSERT INTO public.notificaciones (usuario_id, tipo, contenido, url_destino)
  VALUES (
    NEW.seguido_id,
    'nuevo_seguidor',
    '👤 ' || COALESCE(v_nombre, 'Alguien') || ' comenzó a seguirte',
    '/' || COALESCE(v_username, '')
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_seguidor
  AFTER INSERT ON public.seguidores
  FOR EACH ROW EXECUTE FUNCTION public.notificar_nuevo_seguidor();


-- =====================================================
-- 3. NOTIFICACIÓN: NUEVO COMENTARIO EN TU BEAT
-- =====================================================
CREATE OR REPLACE FUNCTION public.notificar_nuevo_comentario()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_productor_id UUID;
  v_beat_titulo  TEXT;
  v_nombre       TEXT;
BEGIN
  IF NEW.beat_id IS NULL THEN
    RETURN NEW;
  END IF;

  SELECT b.productor_id, b.titulo
  INTO v_productor_id, v_beat_titulo
  FROM public.beats b WHERE b.id = NEW.beat_id;

  -- No notificar si el productor se comenta a sí mismo
  IF v_productor_id IS NULL OR v_productor_id = NEW.usuario_id THEN
    RETURN NEW;
  END IF;

  SELECT nombre_artistico INTO v_nombre
  FROM public.perfiles WHERE id = NEW.usuario_id;

  INSERT INTO public.notificaciones (usuario_id, tipo, contenido, url_destino)
  VALUES (
    v_productor_id,
    'nuevo_comentario',
    '💬 ' || COALESCE(v_nombre, 'Alguien') || ' comentó en "' || v_beat_titulo || '"',
    '/beats/' || NEW.beat_id
  );
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_notificar_comentario
  AFTER INSERT ON public.comentarios
  FOR EACH ROW EXECUTE FUNCTION public.notificar_nuevo_comentario();

COMMIT;
