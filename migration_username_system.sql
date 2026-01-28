-- =============================================
-- TIANGUIS BEATS - Migración Optimizada v2.0
-- Fecha: 2026-01-28
-- Descripción: Sincroniza el esquema de la base de datos
--              con el código actualizado (username/display_name system)
-- =============================================

-- =============================================
-- PARTE 1: ACTUALIZAR TABLA PROFILES
-- =============================================

-- 1.1 Renombrar artistic_name → display_name
ALTER TABLE public.profiles 
RENAME COLUMN artistic_name TO display_name;

-- 1.2 Agregar columna email
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT;

-- 1.3 Índice único para username (búsqueda case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower 
ON public.profiles (LOWER(username));

-- 1.4 Índice para búsqueda por email
CREATE INDEX IF NOT EXISTS idx_profiles_email 
ON public.profiles (email);

-- 1.5 Sincronizar emails de usuarios existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- =============================================
-- PARTE 2: ACTUALIZAR TABLA BEATS
-- =============================================

-- 2.1 Agregar columnas de metadata
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS reference_artist TEXT,
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tier_visibility INT DEFAULT 0;

-- 2.2 Agregar contadores
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS play_count BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_count BIGINT DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count BIGINT DEFAULT 0;

-- 2.3 Agregar precios por licencia
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS price_mp3 NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_wav NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_stems NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_exclusive NUMERIC DEFAULT NULL;

-- 2.4 Agregar flags de licencia activa
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS is_mp3_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS is_wav_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stems_active BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exclusive_active BOOLEAN DEFAULT false;

-- 2.5 Índices para ordenamiento
CREATE INDEX IF NOT EXISTS idx_beats_play_count ON public.beats (play_count DESC);
CREATE INDEX IF NOT EXISTS idx_beats_sale_count ON public.beats (sale_count DESC);
CREATE INDEX IF NOT EXISTS idx_beats_created_at ON public.beats (created_at DESC);

-- =============================================
-- PARTE 3: CREAR TABLA COMMENTS
-- =============================================

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    content TEXT NOT NULL,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS para comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "comments_select_public" ON public.comments;
DROP POLICY IF EXISTS "comments_insert_auth" ON public.comments;
DROP POLICY IF EXISTS "comments_delete_own" ON public.comments;

CREATE POLICY "comments_select_public" ON public.comments 
FOR SELECT USING (true);

CREATE POLICY "comments_insert_auth" ON public.comments 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "comments_delete_own" ON public.comments 
FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PARTE 4: CREAR TABLA LIKES
-- =============================================

CREATE TABLE IF NOT EXISTS public.likes (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (user_id, beat_id)
);

-- RLS para likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "likes_select_public" ON public.likes;
DROP POLICY IF EXISTS "likes_insert_auth" ON public.likes;
DROP POLICY IF EXISTS "likes_delete_own" ON public.likes;

CREATE POLICY "likes_select_public" ON public.likes 
FOR SELECT USING (true);

CREATE POLICY "likes_insert_auth" ON public.likes 
FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "likes_delete_own" ON public.likes 
FOR DELETE USING (auth.uid() = user_id);

-- =============================================
-- PARTE 5: ACTUALIZAR TRIGGER handle_new_user
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    username, 
    display_name, 
    full_name, 
    birth_date, 
    role
  )
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'username',
    NEW.raw_user_meta_data->>'display_name',
    NEW.raw_user_meta_data->>'full_name',
    (NEW.raw_user_meta_data->>'birth_date')::DATE,
    COALESCE(NEW.raw_user_meta_data->>'role', 'artist')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
