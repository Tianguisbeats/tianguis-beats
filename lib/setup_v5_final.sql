-- =========================================================
-- TIANGUIS BEATS - SETUP DEFINITIVO (v5.0)
-- Limpieza total e instalación desde cero.
-- =========================================================

-- 1. LIMPIEZA TOTAL (Esquema público)
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;

-- Restaurar permisos básicos tras dropear el esquema
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO anon;
GRANT ALL ON SCHEMA public TO authenticated;
GRANT ALL ON SCHEMA public TO service_role;

-- 2. EXTENSIONES
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 3. TIPOS ENUMERADOS
CREATE TYPE public.role_enum AS ENUM ('buyer', 'producer', 'artist', 'admin');
CREATE TYPE public.subscription_tier_enum AS ENUM ('free', 'pro', 'premium');

-- 4. TABLA: PROFILES
-- Sincronizada con auth.users
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    artistic_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    social_links JSONB DEFAULT '{}'::jsonb,
    birth_date DATE,
    role public.role_enum NOT NULL DEFAULT 'artist',
    subscription_tier public.subscription_tier_enum NOT NULL DEFAULT 'free',
    is_admin BOOLEAN NOT NULL DEFAULT false,
    is_founder BOOLEAN NOT NULL DEFAULT false,
    is_verified BOOLEAN NOT NULL DEFAULT false,
    username_changes INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. TABLA: BEATS
CREATE TABLE public.beats (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    bpm INTEGER,
    musical_key TEXT,
    musical_scale TEXT DEFAULT 'Menor', -- Menor o Mayor
    description TEXT,
    price_mxn NUMERIC DEFAULT 299,
    is_public BOOLEAN NOT NULL DEFAULT true,
    
    -- Archivos (URLs de Storage)
    cover_url TEXT,
    mp3_tag_url TEXT, -- Archivo con TAG
    mp3_url TEXT NOT NULL,
    wav_url TEXT,
    stems_url TEXT,
    
    -- Estética y UI
    tag TEXT DEFAULT 'Nuevo',
    tag_emoji TEXT DEFAULT '🔥',
    tag_color TEXT DEFAULT 'bg-blue-600',
    cover_color TEXT DEFAULT 'bg-slate-100',
    
    mood TEXT,
    reference_artist TEXT,
    
    -- Estadísticas (Caché para velocidad)
    play_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    is_exclusive BOOLEAN DEFAULT false,
    tier_visibility INTEGER DEFAULT 0, -- 0: Free, 1: Pro, 2: Premium
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. INTERACCIONES
CREATE TABLE public.likes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (beat_id, user_id)
);

CREATE TABLE public.comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE public.listens (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    beat_id UUID NOT NULL REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. FUNCIONES Y TRIGGERS

-- Función para actualizar updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
CREATE TRIGGER trg_beats_updated_at BEFORE UPDATE ON public.beats FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Función para sincronizar likes
CREATE OR REPLACE FUNCTION public.sync_like_count()
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

CREATE TRIGGER trg_sync_likes AFTER INSERT OR DELETE ON public.likes FOR EACH ROW EXECUTE FUNCTION public.sync_like_count();

-- TRIGGER CRÍTICO: Crear perfil al registrarse
CREATE OR REPLACE FUNCTION public.handle_new_auth_user()
RETURNS TRIGGER AS $$
DECLARE
    is_f boolean;
BEGIN
    -- Detectar si es uno de los primeros 100 usuarios
    SELECT count(*) < 100 INTO is_f FROM public.profiles;

    INSERT INTO public.profiles (
        id, 
        email, 
        username, 
        full_name, 
        artistic_name, 
        birth_date, 
        role,
        is_founder
    )
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'username', 'user_' || substr(NEW.id::text, 1, 8)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'artistic_name',
        (NEW.raw_user_meta_data->>'birth_date')::DATE,
        COALESCE((NEW.raw_user_meta_data->>'role')::public.role_enum, 'artist'::public.role_enum),
        is_f
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_auth_user();

-- RPC para incrementar plays
CREATE OR REPLACE FUNCTION public.increment_play_count(p_beat_id UUID)
RETURNS VOID AS $$
BEGIN
    UPDATE public.beats SET play_count = play_count + 1 WHERE id = p_beat_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. SEGURIDAD (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Profiles: Público para ver" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Profiles: Solo dueño edita" ON public.profiles FOR UPDATE USING (auth.uid() = id);

ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Beats: Público para ver" ON public.beats FOR SELECT USING (is_public = true OR producer_id = auth.uid());
CREATE POLICY "Beats: Productores suben" ON public.beats FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Beats: Dueño edita/borra" ON public.beats FOR ALL USING (auth.uid() = producer_id);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Likes: Público" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Likes: User gestiona" ON public.likes FOR ALL USING (auth.uid() = user_id);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Comments: Público" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Comments: User gestiona" ON public.comments FOR ALL USING (auth.uid() = user_id);

-- 9. PERMISOS DE API
-- Asegurar que el rol anon y authenticated puedan ver tablas
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.likes TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT INSERT, UPDATE, DELETE ON public.beats TO authenticated;
GRANT UPDATE ON public.profiles TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO authenticated;

-- 10. STORAGE (Opcional - Requiere permisos de superuser en algunas nubes, pero útil de referencia)
-- Intentar crear buckets si no existen
INSERT INTO storage.buckets (id, name, public) 
VALUES ('beats-previews', 'beats-previews', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('beats-raw', 'beats-raw', false)
ON CONFLICT (id) DO NOTHING;
