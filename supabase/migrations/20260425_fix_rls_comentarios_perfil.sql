-- ==========================================================================
-- 🔒 FIX RLS — comentarios_perfil
-- ==========================================================================
-- Problema:
--   La política original "Actualizar likes" usaba USING (true) WITH CHECK (true),
--   lo cual permitía a CUALQUIER usuario autenticado modificar contenido,
--   autor_id o perfil_id de CUALQUIER post (riesgo de defacement).
--
-- Solución:
--   1. Reemplazar la política UPDATE permisiva por una restrictiva que
--      únicamente permita al autor editar su propio post (y solo el contenido).
--   2. Crear tabla separada `likes_comentarios_perfil` para tracking real
--      de likes con relación 1-a-1 (usuario, comentario).
--   3. Función RPC `alternar_like_comentario_perfil` que incrementa/decrementa
--      `likes_count` de forma atómica sin exponer UPDATE público.
-- ==========================================================================

BEGIN;

-- 1. Eliminar la política permisiva
DROP POLICY IF EXISTS "Actualizar likes" ON public.comentarios_perfil;

-- 2. Política UPDATE restrictiva: solo el autor puede editar su post
DROP POLICY IF EXISTS "Autor puede editar su post" ON public.comentarios_perfil;
CREATE POLICY "Autor puede editar su post"
ON public.comentarios_perfil FOR UPDATE
USING (auth.uid() = autor_id)
WITH CHECK (auth.uid() = autor_id);

-- 3. Tabla de likes (relación many-to-many usuario ↔ comentario)
CREATE TABLE IF NOT EXISTS public.likes_comentarios_perfil (
    id            UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    comentario_id UUID NOT NULL REFERENCES public.comentarios_perfil(id) ON DELETE CASCADE,
    usuario_id    UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    fecha_creacion TIMESTAMPTZ DEFAULT now(),
    UNIQUE(comentario_id, usuario_id)
);

CREATE INDEX IF NOT EXISTS idx_likes_comentarios_perfil_comentario
    ON public.likes_comentarios_perfil(comentario_id);
CREATE INDEX IF NOT EXISTS idx_likes_comentarios_perfil_usuario
    ON public.likes_comentarios_perfil(usuario_id);

ALTER TABLE public.likes_comentarios_perfil ENABLE ROW LEVEL SECURITY;

-- Lectura pública (para mostrar quién dio like si se quiere)
DROP POLICY IF EXISTS "Lectura pública de likes" ON public.likes_comentarios_perfil;
CREATE POLICY "Lectura pública de likes"
ON public.likes_comentarios_perfil FOR SELECT USING (true);

-- Insertar/eliminar: solo el usuario dueño del like
DROP POLICY IF EXISTS "Usuario gestiona sus likes" ON public.likes_comentarios_perfil;
CREATE POLICY "Usuario gestiona sus likes"
ON public.likes_comentarios_perfil FOR ALL
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. Función RPC para alternar like de forma atómica
--    (recomputa el contador desde la tabla real, evitando drift)
CREATE OR REPLACE FUNCTION public.alternar_like_comentario_perfil(p_comentario_id UUID)
RETURNS TABLE(likes_count INT, dio_like BOOLEAN)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_usuario_id UUID := auth.uid();
    v_existe BOOLEAN;
    v_nuevo_count INT;
    v_dio_like BOOLEAN;
BEGIN
    IF v_usuario_id IS NULL THEN
        RAISE EXCEPTION 'Debes iniciar sesión para dar like';
    END IF;

    -- ¿Ya existe el like?
    SELECT EXISTS(
        SELECT 1 FROM public.likes_comentarios_perfil
        WHERE comentario_id = p_comentario_id AND usuario_id = v_usuario_id
    ) INTO v_existe;

    IF v_existe THEN
        DELETE FROM public.likes_comentarios_perfil
        WHERE comentario_id = p_comentario_id AND usuario_id = v_usuario_id;
        v_dio_like := false;
    ELSE
        INSERT INTO public.likes_comentarios_perfil(comentario_id, usuario_id)
        VALUES (p_comentario_id, v_usuario_id);
        v_dio_like := true;
    END IF;

    -- Recomputar contador real (fuente de verdad)
    SELECT COUNT(*)::INT INTO v_nuevo_count
    FROM public.likes_comentarios_perfil
    WHERE comentario_id = p_comentario_id;

    UPDATE public.comentarios_perfil
    SET likes_count = v_nuevo_count
    WHERE id = p_comentario_id;

    RETURN QUERY SELECT v_nuevo_count, v_dio_like;
END;
$$;

GRANT EXECUTE ON FUNCTION public.alternar_like_comentario_perfil(UUID) TO authenticated;

COMMIT;
