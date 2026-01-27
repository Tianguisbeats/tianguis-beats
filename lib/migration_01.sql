-- Migración: Actualización de metadatos para algoritmo y ChatBot AI

-- 1. Agregar nuevos campos a la tabla de beats
ALTER TABLE public.beats 
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS reference_artist TEXT,
ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tier_visibility INTEGER DEFAULT 0;

-- 2. Asegurar que bpm y musical_key existen (ya estaban en el schema original pero por si acaso)
-- bpm ya es INTEGER en el original
-- musical_key ya es TEXT en el original

-- 3. Índices para mejorar el performance del algoritmo de búsqueda
CREATE INDEX IF NOT EXISTS idx_beats_genre ON public.beats(genre);
CREATE INDEX IF NOT EXISTS idx_beats_mood ON public.beats(mood);
CREATE INDEX IF NOT EXISTS idx_beats_bpm ON public.beats(bpm);
CREATE INDEX IF NOT EXISTS idx_beats_tier_visibility ON public.beats(tier_visibility);

-- 4. Tabla de historial para el algoritmo de recomendación
CREATE TABLE IF NOT EXISTS public.listens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.listens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Usuarios pueden ver su propio historial" ON public.listens
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Usuarios pueden registrar sus propios listens" ON public.listens
    FOR INSERT WITH CHECK (auth.uid() = user_id);
