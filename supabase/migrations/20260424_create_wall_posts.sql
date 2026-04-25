-- ==========================================
-- 🗣️ MURO DE PERFIL (WALL POSTS)
-- ==========================================

CREATE TABLE IF NOT EXISTS public.comentarios_perfil (
    id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    perfil_id   UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    autor_id    UUID NOT NULL REFERENCES public.perfiles(id) ON DELETE CASCADE,
    contenido   TEXT NOT NULL CHECK (char_length(contenido) BETWEEN 1 AND 1000),
    likes_count INT  NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_comentarios_perfil_perfil_id ON public.comentarios_perfil(perfil_id);

ALTER TABLE public.comentarios_perfil ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública del muro"
ON public.comentarios_perfil FOR SELECT USING (true);

CREATE POLICY "Usuarios autenticados pueden publicar"
ON public.comentarios_perfil FOR INSERT
WITH CHECK (auth.uid() = autor_id);

CREATE POLICY "Autor puede eliminar su post"
ON public.comentarios_perfil FOR DELETE
USING (auth.uid() = autor_id OR auth.uid() = perfil_id);

CREATE POLICY "Actualizar likes"
ON public.comentarios_perfil FOR UPDATE
USING (true)
WITH CHECK (true);

ALTER publication supabase_realtime ADD TABLE public.comentarios_perfil;
