-- ==========================================
-- 🗣️ UNIFICACIÓN DE LA TABLA COMENTARIOS (BEATS Y MURO)
-- ==========================================

-- 1. Asegurar que beat_id pueda ser nulo (ya que los posts de perfil no tendrán beat_id)
ALTER TABLE public.comentarios ALTER COLUMN beat_id DROP NOT NULL;

-- 2. Añadir nuevas columnas necesarias para el muro de perfiles y respuestas
ALTER TABLE public.comentarios 
ADD COLUMN IF NOT EXISTS perfil_id UUID REFERENCES public.perfiles(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comentarios(id) ON DELETE CASCADE,
ADD COLUMN IF NOT EXISTS likes_count INT NOT NULL DEFAULT 0;

-- 3. Crear índices para optimizar las consultas del muro y respuestas
CREATE INDEX IF NOT EXISTS idx_comentarios_perfil_id ON public.comentarios(perfil_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_parent_id ON public.comentarios(parent_id);

-- 4. Actualizar Políticas de Seguridad (RLS) para soportar el muro
-- Permitir a usuarios autenticados publicar en perfiles (además de en beats)
-- Asumiendo que ya hay una política de insert, podemos crear/actualizar para asegurar:
DROP POLICY IF EXISTS "Usuarios autenticados pueden publicar comentarios" ON public.comentarios;
CREATE POLICY "Usuarios autenticados pueden publicar comentarios"
ON public.comentarios FOR INSERT
WITH CHECK (auth.uid() = usuario_id);

-- Permitir a los autores o dueños del perfil eliminar el comentario
-- Eliminamos políticas anteriores similares si existieran y creamos la unificada
DROP POLICY IF EXISTS "Autor o dueño puede eliminar su comentario" ON public.comentarios;
DROP POLICY IF EXISTS "Autor puede eliminar su post" ON public.comentarios;
CREATE POLICY "Autor o dueño puede eliminar su comentario"
ON public.comentarios FOR DELETE
USING (auth.uid() = usuario_id OR auth.uid() = perfil_id);

-- Permitir actualizar likes
DROP POLICY IF EXISTS "Actualizar likes comentarios" ON public.comentarios;
CREATE POLICY "Actualizar likes comentarios"
ON public.comentarios FOR UPDATE
USING (true)
WITH CHECK (true);

-- Asegurar que la tabla está en Realtime si no lo estaba
ALTER publication supabase_realtime ADD TABLE public.comentarios;
