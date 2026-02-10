-- Migración: Conteo de Comentarios para Tianguis Studio
-- Añade la columna comment_count y un trigger para gestionarla automáticamente.

-- 1. Añadir columna a la tabla beats
ALTER TABLE public.beats 
ADD COLUMN IF NOT EXISTS comment_count INTEGER DEFAULT 0;

-- 2. Función para actualizar el contador
CREATE OR REPLACE FUNCTION public.update_beat_comment_count()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.beats
    SET comment_count = COALESCE(comment_count, 0) + 1
    WHERE id = NEW.beat_id;
    RETURN NEW;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.beats
    SET comment_count = GREATEST(COALESCE(comment_count, 0) - 1, 0)
    WHERE id = OLD.beat_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Trigger en la tabla comments
DROP TRIGGER IF EXISTS trg_update_beat_comment_count ON public.comments;

CREATE TRIGGER trg_update_beat_comment_count
AFTER INSERT OR DELETE ON public.comments
FOR EACH ROW
EXECUTE FUNCTION public.update_beat_comment_count();

-- 4. Sincronización inicial (Recalcular contadores existentes)
UPDATE public.beats b
SET comment_count = (
  SELECT count(*) 
  FROM public.comments c 
  WHERE c.beat_id = b.id
);
