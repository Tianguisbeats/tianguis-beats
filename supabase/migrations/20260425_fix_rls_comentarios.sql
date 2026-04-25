-- ==========================================================================
-- 🔒 FIX RLS — comentarios (TABLA UNIFICADA: muro de perfil + comentarios de beats)
-- ==========================================================================
-- Contexto:
--   La tabla `comentarios` unifica:
--     - Comentarios en beats        (beat_id IS NOT NULL)
--     - Posts del muro de perfil    (perfil_id IS NOT NULL)
--   Ambos casos comparten autor (usuario_id), contenido, parent_id (replies)
--   y likes_count.
--
-- Problemas que cierra esta migración:
--   1. Existían policies UPDATE permisivas (USING/WITH CHECK = true) que
--      permitían a cualquier autenticado editar el contenido o autoría de
--      cualquier comentario ajeno (riesgo de defacement).
--   2. El contador likes_count se podía manipular libremente desde el
--      cliente; no había integridad real ni anti doble-like.
--
-- Solución unificada:
--   1. UPDATE en `comentarios` solo permitido al autor (auth.uid = usuario_id).
--   2. Tabla `likes_comentarios` (unificada para beats y muro), con
--      UNIQUE(comentario_id, usuario_id) → no se puede dar like dos veces.
--   3. Función RPC `alternar_like_comentario(p_comentario_id)`:
--        - Valida sesión.
--        - Toggle atómico (insert si no existe, delete si existe).
--        - Recomputa likes_count desde la tabla real (fuente de verdad).
--        - Devuelve (likes_count, dio_like) para optimistic UI.
-- ==========================================================================

BEGIN;

-- 1. Eliminar policies permisivas antiguas (idempotente: nombres tanto del
--    esquema viejo como del nuevo, en caso de migraciones parciales)
DROP POLICY IF EXISTS "Actualizar likes" ON public.comentarios;
DROP POLICY IF EXISTS "Permitir actualizar likes" ON public.comentarios;
DROP POLICY IF EXISTS "Update likes count" ON public.comentarios;

-- 2. UPDATE solo para el autor del comentario
DROP POLICY IF EXISTS "Autor puede editar su comentario" ON public.comentarios;
CREATE POLICY "Autor puede editar su comentario"
ON public.comentarios FOR UPDATE
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 3. Tabla unificada de likes (sirve para beats y muro de perfil)
CREATE TABLE IF NOT EXISTS public.likes_comentarios (
    id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comentario_id  UUID NOT NULL REFERENCES public.comentarios(id) ON DELETE CASCADE,
    usuario_id     UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE (comentario_id, usuario_id)  -- 🔐 evita doble-like
);

CREATE INDEX IF NOT EXISTS idx_likes_comentarios_comentario
    ON public.likes_comentarios(comentario_id);
CREATE INDEX IF NOT EXISTS idx_likes_comentarios_usuario
    ON public.likes_comentarios(usuario_id);

ALTER TABLE public.likes_comentarios ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para mostrar quién dio like, conteos, etc.)
DROP POLICY IF EXISTS "Lectura pública de likes_comentarios" ON public.likes_comentarios;
CREATE POLICY "Lectura pública de likes_comentarios"
ON public.likes_comentarios FOR SELECT
USING (true);

-- INSERT/DELETE: solo el dueño del like puede manipularlo
DROP POLICY IF EXISTS "Usuario gestiona sus likes_comentarios" ON public.likes_comentarios;
CREATE POLICY "Usuario gestiona sus likes_comentarios"
ON public.likes_comentarios FOR ALL
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. Función RPC unificada (sirve para likes en beats y en muro de perfil)
--    Devuelve (likes_count, dio_like) para que el cliente actualice la UI
--    de forma optimista sin tener que recontar.
CREATE OR REPLACE FUNCTION public.alternar_like_comentario(p_comentario_id UUID)
RETURNS TABLE(likes_count INT, dio_like BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id  UUID := auth.uid();
    v_existe      BOOLEAN;
    v_nuevo_count INT;
    v_dio_like    BOOLEAN;
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para dar like';
    END IF;

    -- Verificar que el comentario exista (también previene leak de IDs por error)
    IF NOT EXISTS (SELECT 1 FROM public.comentarios WHERE id = p_comentario_id) THEN
        RAISE EXCEPTION 'El comentario no existe';
    END IF;

    -- ¿Ya tiene like del usuario?
    SELECT EXISTS(
        SELECT 1 FROM public.likes_comentarios
        WHERE comentario_id = p_comentario_id
          AND usuario_id    = v_usuario_id
    ) INTO v_existe;

    IF v_existe THEN
        DELETE FROM public.likes_comentarios
        WHERE comentario_id = p_comentario_id
          AND usuario_id    = v_usuario_id;
        v_dio_like := false;
    ELSE
        INSERT INTO public.likes_comentarios(comentario_id, usuario_id)
        VALUES (p_comentario_id, v_usuario_id);
        v_dio_like := true;
    END IF;

    -- Recomputar contador real (fuente de verdad)
    SELECT COUNT(*)::INT INTO v_nuevo_count
    FROM public.likes_comentarios
    WHERE comentario_id = p_comentario_id;

    -- Sincronizar el cache desnormalizado en la tabla comentarios.
    -- Este UPDATE bypassa la policy "Autor puede editar su comentario"
    -- porque la función corre como SECURITY DEFINER (rol del owner).
    UPDATE public.comentarios
    SET likes_count = v_nuevo_count
    WHERE id = p_comentario_id;

    RETURN QUERY SELECT v_nuevo_count, v_dio_like;
END;
$$;

GRANT EXECUTE ON FUNCTION public.alternar_like_comentario(UUID) TO authenticated;

-- 5. (Opcional) Trigger para mantener `likes_count` sincronizado incluso si
--    alguien manipula `likes_comentarios` por fuera de la RPC (p.ej. CASCADE
--    al borrar usuarios o comentarios padre).
CREATE OR REPLACE FUNCTION public.recomputar_likes_count_comentario()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_target_id UUID;
BEGIN
    v_target_id := COALESCE(NEW.comentario_id, OLD.comentario_id);

    UPDATE public.comentarios
    SET likes_count = (
        SELECT COUNT(*) FROM public.likes_comentarios WHERE comentario_id = v_target_id
    )
    WHERE id = v_target_id;

    RETURN COALESCE(NEW, OLD);
END;
$$;

DROP TRIGGER IF EXISTS trg_recomputar_likes_count ON public.likes_comentarios;
CREATE TRIGGER trg_recomputar_likes_count
    AFTER INSERT OR DELETE ON public.likes_comentarios
    FOR EACH ROW
    EXECUTE FUNCTION public.recomputar_likes_count_comentario();

COMMIT;

-- ==========================================================================
-- USO DESDE EL CLIENTE
-- ==========================================================================
-- const { data, error } = await supabase.rpc('alternar_like_comentario', {
--     p_comentario_id: postId
-- });
-- if (data) {
--     // data[0].likes_count ← contador actualizado
--     // data[0].dio_like    ← true si quedó con like, false si se quitó
-- }
-- ==========================================================================
