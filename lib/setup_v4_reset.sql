-- =========================================================
-- TIANGUIS BEATS - RESET + SETUP COMPLETO (v4.0)
-- =========================================================

-- 0) RESET (Borra tablas existentes)
DROP TABLE IF EXISTS public.order_items CASCADE;
DROP TABLE IF EXISTS public.orders CASCADE;
DROP TABLE IF EXISTS public.beat_license_prices CASCADE;
DROP TABLE IF EXISTS public.licenses CASCADE;
DROP TABLE IF EXISTS public.beat_tags CASCADE;
DROP TABLE IF EXISTS public.assets CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.listens CASCADE;
DROP TABLE IF EXISTS public.profile_private CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 1) Extensiones
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2) Tipos (enums)
DO $$ BEGIN
  CREATE TYPE public.role_enum AS ENUM ('buyer','producer','artist','admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.subscription_tier_enum AS ENUM ('free','pro','premium');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- 3) Función para updated_at
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 4) Tablas Principales

-- PROFILES
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  username TEXT UNIQUE,
  artistic_name TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  birth_date DATE,
  role public.role_enum NOT NULL DEFAULT 'artist',
  subscription_tier public.subscription_tier_enum NOT NULL DEFAULT 'free',
  is_admin BOOLEAN NOT NULL DEFAULT false,
  email TEXT UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- BEATS
CREATE TABLE public.beats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  genre TEXT,
  bpm INTEGER,
  musical_key TEXT,
  description TEXT,
  price_mxn NUMERIC DEFAULT 299,
  is_public BOOLEAN NOT NULL DEFAULT true,
  
  -- URLs de archivos
  cover_url TEXT,
  mp3_url TEXT,
  wav_url TEXT,
  stems_url TEXT,
  
  -- Estética y Tags
  tag TEXT DEFAULT 'Nuevo',
  tag_emoji TEXT DEFAULT '🔥',
  tag_color TEXT DEFAULT 'bg-blue-600',
  cover_color TEXT DEFAULT 'bg-slate-100',
  
  mood TEXT,
  reference_artist TEXT,
  
  -- Estadísticas
  play_count INTEGER DEFAULT 0,
  sale_count INTEGER DEFAULT 0,
  like_count INTEGER DEFAULT 0, -- Cache de likes
  
  is_exclusive BOOLEAN DEFAULT false,
  tier_visibility INTEGER DEFAULT 0, -- 0: Free, 1: Pro, 2: Premium
  
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TRIGGER trg_beats_updated_at BEFORE UPDATE ON public.beats FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 5) Interacciones

-- LIKES
CREATE TABLE public.likes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (beat_id, user_id)
);

-- COMMENTS
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- LISTENS
CREATE TABLE public.listens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6) Índices para optimización
CREATE INDEX idx_beats_producer ON public.beats(producer_id);
CREATE INDEX idx_beats_genre ON public.beats(genre);
CREATE INDEX idx_beats_created_at ON public.beats(created_at DESC);
CREATE INDEX idx_beats_is_public ON public.beats(is_public);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_likes_beat ON public.likes(beat_id);
CREATE INDEX idx_comments_beat ON public.comments(beat_id);

-- 7) Triggers y Funciones de Utilidad

-- Sincronizar like_count en beats
CREATE OR REPLACE FUNCTION public.handle_beat_like()
RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE public.beats SET like_count = like_count + 1 WHERE id = NEW.beat_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE public.beats SET like_count = like_count - 1 WHERE id = OLD.beat_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_beat_like_counter
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION public.handle_beat_like();

-- Trigger para crear perfil automáticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, artistic_name, username, birth_date, role
  )
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'full_name',
    new.raw_user_meta_data->>'artistic_name',
    new.raw_user_meta_data->>'username',
    (new.raw_user_meta_data->>'birth_date')::date,
    COALESCE(new.raw_user_meta_data->>'role', 'artist')
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- RPC para incrementar plays
CREATE OR REPLACE FUNCTION public.increment_play_count(p_beat_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.beats SET play_count = play_count + 1 WHERE id = p_beat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8) Seguridad (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles are public" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public beats are visible" ON public.beats FOR SELECT USING (is_public = true OR producer_id = auth.uid());
CREATE POLICY "Producers can insert beats" ON public.beats FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Producers can update own beats" ON public.beats FOR UPDATE USING (auth.uid() = producer_id);
CREATE POLICY "Producers can delete own beats" ON public.beats FOR DELETE USING (auth.uid() = producer_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes are public" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Users can like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments are public" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- 9) Public API Permissions
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO postgres;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO postgres;

GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.likes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.beats TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
