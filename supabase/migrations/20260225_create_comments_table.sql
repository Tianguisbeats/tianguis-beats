-- ==========================================
-- 💬 TABLA DE COMENTARIOS (REAL-TIME)
-- ==========================================

-- 1. Crear la tabla si no existe
CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Habilitar RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- 3. Políticas
DROP POLICY IF EXISTS "Permitir lectura pública de comentarios" ON public.comments;
CREATE POLICY "Permitir lectura pública de comentarios" 
ON public.comments FOR SELECT 
USING (true);

DROP POLICY IF EXISTS "Permitir creación a usuarios autenticados" ON public.comments;
CREATE POLICY "Permitir creación a usuarios autenticados" 
ON public.comments FOR INSERT 
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Permitir borrar sus propios comentarios" ON public.comments;
CREATE POLICY "Permitir borrar sus propios comentarios" 
ON public.comments FOR DELETE 
USING (auth.uid() = user_id);

-- 4. Habilitar Realtime para esta tabla
ALTER publication supabase_realtime ADD TABLE public.comments;
