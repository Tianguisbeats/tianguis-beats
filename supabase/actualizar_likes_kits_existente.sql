-- [TIANGUIS BEATS] - Integración de Likes en Tablas Existentes (100% Español)
-- Este script adapta la tabla 'favoritos' y 'kits_sonido' para manejar los likes de kits sin crear nuevas tablas.

BEGIN;

-- 1. Asegurar que la tabla de kits se llame 'kits_sonido' y tenga la columna de conteo
-- (Si ya existe, el script es inofensivo)
ALTER TABLE IF EXISTS public.sound_kits RENAME TO kits_sonido;

DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'kits_sonido' AND column_name = 'conteo_likes') THEN
        ALTER TABLE public.kits_sonido ADD COLUMN conteo_likes INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Adaptar la tabla 'favoritos' para que sea polimórfica (Beats o Kits)
ALTER TABLE public.favoritos ADD COLUMN IF NOT EXISTS kit_id UUID REFERENCES public.kits_sonido(id) ON DELETE CASCADE;
ALTER TABLE public.favoritos ALTER COLUMN beat_id DROP NOT NULL;

-- 3. Restricción de integridad: debe ser uno u otro, no ambos
ALTER TABLE public.favoritos DROP CONSTRAINT IF EXISTS favoritos_check_one_target;
ALTER TABLE public.favoritos ADD CONSTRAINT favoritos_check_one_target 
CHECK ((beat_id IS NOT NULL AND kit_id IS NULL) OR (beat_id IS NULL AND kit_id IS NOT NULL));

-- 4. Índice único para evitar likes duplicados en kits
DROP INDEX IF EXISTS idx_favoritos_usuario_kit;
CREATE UNIQUE INDEX idx_favoritos_usuario_kit ON public.favoritos (usuario_id, kit_id) WHERE kit_id IS NOT NULL;

-- 5. Trigger global de conteo de likes (actualiza beats o kits según corresponda)
CREATE OR REPLACE FUNCTION public.actualizar_conteo_likes_global()
RETURNS TRIGGER AS $$
BEGIN
    IF (TG_OP = 'INSERT') THEN
        IF NEW.beat_id IS NOT NULL THEN
            UPDATE public.beats SET conteo_likes = conteo_likes + 1 WHERE id = NEW.beat_id;
        ELSIF NEW.kit_id IS NOT NULL THEN
            UPDATE public.kits_sonido SET conteo_likes = conteo_likes + 1 WHERE id = NEW.kit_id;
        END IF;
    ELSIF (TG_OP = 'DELETE') THEN
        IF OLD.beat_id IS NOT NULL THEN
            UPDATE public.beats SET conteo_likes = conteo_likes - 1 WHERE id = OLD.beat_id;
        ELSIF OLD.kit_id IS NOT NULL THEN
            UPDATE public.kits_sonido SET conteo_likes = conteo_likes - 1 WHERE id = OLD.kit_id;
        END IF;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Eliminar triggers antiguos si existieran y aplicar el nuevo
DROP TRIGGER IF EXISTS tr_actualizar_conteo_likes_beat ON public.favoritos;
DROP TRIGGER IF EXISTS tr_actualizar_conteo_likes_global ON public.favoritos;

CREATE TRIGGER tr_actualizar_conteo_likes_global
AFTER INSERT OR DELETE ON public.favoritos
FOR EACH ROW EXECUTE FUNCTION public.actualizar_conteo_likes_global();

-- 6. Borrar la tabla que propuse anteriormente para no dejar basura
DROP TABLE IF EXISTS public.likes_soundkits CASCADE;

COMMIT;

COMMENT ON COLUMN public.favoritos.kit_id IS 'Referencia opcional al Sound Kit marcado como favorito.';
COMMENT ON COLUMN public.kits_sonido.conteo_likes IS 'Total de usuarios que han marcado este kit como favorito.';
