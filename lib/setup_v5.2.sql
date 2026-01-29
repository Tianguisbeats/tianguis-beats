-- =========================================================
-- TIANGUIS BEATS - SETUP DEFINITIVO (v5.2)
-- Actualización con Campos de Perfil y Estética Pro
-- =========================================================

-- 1. Extensiones Necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. Limpieza (Opcional, pero recomendado para fresh start)
-- DROP SCHEMA IF EXISTS public CASCADE;
-- CREATE SCHEMA public;
-- GRANT ALL ON SCHEMA public TO postgres;
-- GRANT ALL ON SCHEMA public TO anon;
-- GRANT ALL ON SCHEMA public TO authenticated;
-- GRANT ALL ON SCHEMA public TO service_role;

-- 3. Tipos ENUM
DO $$ BEGIN
    CREATE TYPE role_enum AS ENUM ('buyer', 'producer', 'artist', 'admin');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE subscription_tier_enum AS ENUM ('free', 'pro', 'premium');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 4. Tablas Principales
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    full_name TEXT,
    artistic_name TEXT,
    email TEXT UNIQUE,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    country TEXT DEFAULT 'México',
    open_collaborations BOOLEAN DEFAULT true,
    birth_date DATE,
    role role_enum DEFAULT 'artist',
    subscription_tier subscription_tier_enum DEFAULT 'free',
    is_founder BOOLEAN DEFAULT false,
    is_verified BOOLEAN DEFAULT false,
    social_links JSONB DEFAULT '{}'::jsonb,
    username_changes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.beats (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT NOT NULL,
    bpm INTEGER,
    musical_key TEXT,
    musical_scale TEXT, -- 'Menor' o 'Mayor'
    description TEXT,
    price_mxn DECIMAL(10,2) DEFAULT 299.00,
    cover_url TEXT,
    mp3_tag_url TEXT, -- Preview con marca de agua
    mp3_url TEXT NOT NULL, -- Master MP3
    wav_url TEXT, -- Master WAV
    stems_url TEXT, -- Archivo ZIP/RAR
    play_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    tier_visibility INTEGER DEFAULT 0, -- 0: All, 1: Pro+, 2: Premium only
    tag TEXT DEFAULT 'Nuevo',
    mood TEXT, -- Ahora puede ser un string separado por comas o JSON
    reference_artist TEXT,
    is_exclusive BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. Interacciones
CREATE TABLE IF NOT EXISTS public.likes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, beat_id)
);

CREATE TABLE IF NOT EXISTS public.comments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.listens (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 6. Funciones y Triggers
-- Incrementar likes en la tabla beats
CREATE OR REPLACE FUNCTION sync_like_count()
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

DROP TRIGGER IF EXISTS on_like_change ON public.likes;
CREATE TRIGGER on_like_change
AFTER INSERT OR DELETE ON public.likes
FOR EACH ROW EXECUTE FUNCTION sync_like_count();

-- Manejar nuevos usuarios de Auth
CREATE OR REPLACE FUNCTION handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    u_count INTEGER;
BEGIN
    SELECT count(*) INTO u_count FROM public.profiles;
    
    INSERT INTO public.profiles (
        id, 
        username, 
        full_name, 
        artistic_name, 
        email, 
        avatar_url, 
        role,
        is_founder
    )
    VALUES (
        NEW.id, 
        COALESCE(NEW.raw_user_meta_data->>'username', split_part(NEW.email, '@', 1)), 
        NEW.raw_user_meta_data->>'full_name', 
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username'), 
        NEW.email, 
        NEW.raw_user_meta_data->>'avatar_url',
        'artist',
        (u_count < 100) -- Primeros 100 son Founders
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION handle_new_auth_user();

-- Función RPC para incrementar plays
CREATE OR REPLACE FUNCTION increment_play_count(p_beat_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.beats SET play_count = play_count + 1 WHERE id = p_beat_id;
END;
$$ LANGUAGE plpgsql;

-- 7. RLS Policies
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Profiles: Todos pueden ver perfiles, solo dueño edita
CREATE POLICY "Public profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);

-- Beats: Todos pueden ver beats, solo productor edita
CREATE POLICY "Beats are viewable by everyone" ON beats FOR SELECT USING (true);
CREATE POLICY "Producers can insert own beats" ON beats FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Producers can update own beats" ON beats FOR UPDATE USING (auth.uid() = producer_id);
CREATE POLICY "Producers can delete own beats" ON beats FOR DELETE USING (auth.uid() = producer_id);

-- Likes
CREATE POLICY "Likes are viewable by everyone" ON likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like" ON likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can unlike" ON likes FOR DELETE USING (auth.uid() = user_id);

-- Comments
CREATE POLICY "Comments are viewable by everyone" ON comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update/delete own comments" ON comments FOR ALL USING (auth.uid() = user_id);

-- 8. Permisos API Pública
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres;
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.beats TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;
GRANT INSERT, DELETE ON public.likes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT INSERT ON public.listens TO authenticated, anon;

-- 9. Storage Buckets (Execute this via Supabase UI or if supported by API)
-- insert into storage.buckets (id, name, public) values ('beats-previews', 'beats-previews', true);
-- insert into storage.buckets (id, name, public) values ('avatars', 'avatars', true);
-- insert into storage.buckets (id, name, public) values ('beats-raw', 'beats-raw', false); -- Private for buyers
