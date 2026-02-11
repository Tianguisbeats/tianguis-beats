-- Migración: Habilitar Políticas de RLS para Comentarios
-- Permite que los comentarios sean visibles para todos y que los usuarios autenticados puedan comentar.

-- 1. Habilitar RLS (por si acaso no está activo)
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas existentes para evitar conflictos
DROP POLICY IF EXISTS "Comments are viewable by everyone" ON public.comments;
DROP POLICY IF EXISTS "Users can post comments" ON public.comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.comments;

-- 3. Crear nuevas políticas
-- SELECT: Todos pueden ver comentarios
CREATE POLICY "Comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

-- INSERT: Usuarios autenticados pueden comentar
CREATE POLICY "Users can post comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- DELETE: Usuarios pueden borrar sus propios comentarios
CREATE POLICY "Users can delete own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);
    
-- [OPCIONAL] Sincronizar conteo inicial de beats
UPDATE public.beats b
SET comment_count = (
  SELECT count(*) 
  FROM public.comments c 
  WHERE c.beat_id = b.id
);
