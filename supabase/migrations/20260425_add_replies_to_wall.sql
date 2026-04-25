-- Add parent_id for nested replies in wall posts
ALTER TABLE public.comentarios_perfil
ADD COLUMN IF NOT EXISTS parent_id UUID REFERENCES public.comentarios_perfil(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS idx_comentarios_perfil_parent_id ON public.comentarios_perfil(parent_id);
