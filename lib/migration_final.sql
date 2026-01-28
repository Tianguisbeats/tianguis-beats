-- =============================================
-- TIANGUIS BEATS - Migración Final Consolidada
-- v3.0 - 2026-01-28
-- Descripción: SQL unificado para sincronizar esquema con código
-- =============================================

-- =============================================
-- 1. PROFILES: Agregar columna email
-- =============================================

-- 1.1 Agregar email (para login por username)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS email TEXT UNIQUE;

-- 1.2 Sincronizar emails de usuarios existentes
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE p.id = u.id AND p.email IS NULL;

-- 1.3 Índices para profiles
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_artistic_name ON public.profiles(artistic_name);
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_username_lower ON public.profiles(LOWER(username));

-- =============================================
-- 2. BEATS: Agregar columnas faltantes + Índices
-- =============================================

-- 2.1 Columnas que pueden faltar
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS mood TEXT,
ADD COLUMN IF NOT EXISTS reference_artist TEXT,
ADD COLUMN IF NOT EXISTS is_exclusive BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS tier_visibility INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS play_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_count INTEGER DEFAULT 0;

-- 2.2 Índices para catálogo y home
CREATE INDEX IF NOT EXISTS idx_beats_is_public_created_at ON public.beats(is_public, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_beats_genre ON public.beats(genre);
CREATE INDEX IF NOT EXISTS idx_beats_bpm ON public.beats(bpm);
CREATE INDEX IF NOT EXISTS idx_beats_mood ON public.beats(mood);
CREATE INDEX IF NOT EXISTS idx_beats_play_count ON public.beats(play_count DESC);
CREATE INDEX IF NOT EXISTS idx_beats_sale_count ON public.beats(sale_count DESC);

-- =============================================
-- 3. TRIGGER: Actualizar handle_new_user
-- =============================================

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (
    id, 
    email,
    full_name, 
    artistic_name, 
    username, 
    birth_date, 
    role
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'artistic_name',
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'birth_date')::DATE,
    COALESCE(new.raw_user_meta_data->>'role', 'artist')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. RPC: Incrementar play_count
-- =============================================

CREATE OR REPLACE FUNCTION public.increment_play_count(p_beat_id uuid)
RETURNS void AS $$
BEGIN
  UPDATE public.beats SET play_count = play_count + 1 WHERE id = p_beat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
