-- ==========================================
-- 💬 FIX: RLS PARA TABLA DE COMENTARIOS
-- ==========================================

-- 1. Habilitar RLS si no lo está
ALTER TABLE public.comentarios ENABLE ROW LEVEL SECURITY;

-- 2. Limpiar políticas antiguas para evitar duplicados
DROP POLICY IF EXISTS "Permitir lectura pública de comentarios" ON public.comentarios;
DROP POLICY IF EXISTS "Permitir creación a usuarios autenticados" ON public.comentarios;
DROP POLICY IF EXISTS "Permitir borrar sus propios comentarios" ON public.comentarios;

-- 3. Crear nuevas políticas
CREATE POLICY "Permitir lectura pública de comentarios" 
ON public.comentarios FOR SELECT 
USING (true);

CREATE POLICY "Permitir creación a usuarios autenticados" 
ON public.comentarios FOR INSERT 
WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Permitir borrar sus propios comentarios" 
ON public.comentarios FOR DELETE 
USING (auth.uid() = usuario_id);

-- 4. Asegurar Realtime
ALTER publication supabase_realtime ADD TABLE public.comentarios;
