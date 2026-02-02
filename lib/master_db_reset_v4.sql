-- TIANGUIS BEATS - MASTER RESET v4 (DEFINITIVO & ROBUSTO)
-- Soluciona error "relation does not exist" y recrea toda la BD en ESPAÑOL.
-- NO BORRA BUCKETS DE STORAGE.

-- 1. LIMPIEZA TOTAL (DROP IF EXISTS para evitar errores)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.playlist_beats CASCADE;
DROP TABLE IF EXISTS public.playlists CASCADE;
DROP TABLE IF EXISTS public.sales CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.listens CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. RECREACIÓN DE TABLAS (Esquema Español Optimizado)

-- A) PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    artistic_name TEXT,
    full_name TEXT,
    
    -- Campos Nuevos (Español)
    foto_perfil TEXT,          -- Antes avatar_url
    portada_perfil TEXT,       -- Antes portada_perfil_url
    bio TEXT,
    country TEXT,
    
    open_collaborations BOOLEAN DEFAULT TRUE,
    social_links JSONB DEFAULT '{}'::jsonb,
    birth_date DATE,
    
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'premium')) DEFAULT 'free',
    
    is_founder BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    username_changes INTEGER DEFAULT 0,
    email TEXT UNIQUE,
    
    -- Fechas (Español)
    fecha_de_creacion TIMESTAMPTZ DEFAULT NOW(),   -- Antes created_at
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(), -- Antes updated_at
    
    -- Extras
    ultima_sesion TIMESTAMPTZ,
    perfil_completado BOOLEAN DEFAULT FALSE,
    stripe_customer_id TEXT,
    idioma_preferido TEXT DEFAULT 'es',
    ajuste_portada INTEGER DEFAULT 0
);

-- B) BEATS
CREATE TABLE public.beats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    bpm INTEGER,
    musical_key TEXT,
    musical_scale TEXT,
    description TEXT,
    
    -- Precios
    price_mxn NUMERIC NOT NULL DEFAULT 199,
    price_wav_mxn NUMERIC DEFAULT 499,
    price_stems_mxn NUMERIC DEFAULT 999,
    exclusive_price_mxn NUMERIC,
    
    is_exclusive BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- URLs
    portadabeat_url TEXT,
    mp3_tag_url TEXT,
    mp3_url TEXT NOT NULL,
    wav_url TEXT,
    stems_url TEXT,
    
    -- Estetica
    tag TEXT,
    tag_emoji TEXT,
    tag_color TEXT,
    cover_color TEXT,
    mood TEXT,
    reference_artist TEXT,
    
    -- Stats
    play_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    tier_visibility INTEGER DEFAULT 0,
    
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- C) PLAYLISTS
CREATE TABLE public.playlists (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    is_public BOOLEAN DEFAULT TRUE,
    cover_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.playlist_beats (
    playlist_id UUID REFERENCES public.playlists(id) ON DELETE CASCADE,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    order_index INTEGER DEFAULT 0,
    added_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (playlist_id, beat_id)
);

-- D) SALES (Estructura Base para evitar errores futuros)
CREATE TABLE public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    license_type TEXT, -- MP3, WAV, STEMS, EXCLUSIVE
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E) SOCIAL & INTERACTIONS
CREATE TABLE public.follows (
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    PRIMARY KEY (follower_id, following_id)
);

CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(beat_id, user_id)
);

CREATE TABLE public.listens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SEGURIDAD (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;

-- Políticas Simples (Public Read, Owner Write)
CREATE POLICY "Public profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "User update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Public beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Producer modify beats" ON public.beats FOR ALL USING (auth.uid() = producer_id);
CREATE POLICY "Public playlists" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "Producer modify playlists" ON public.playlists FOR ALL USING (auth.uid() = producer_id);

-- 4. TRIGGER DE REGISTRO
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
    mexico_now TIMESTAMPTZ;
BEGIN
    mexico_now := now() AT TIME ZONE 'UTC' AT TIME ZONE 'America/Mexico_City';
    SELECT count(*) INTO found_count FROM public.profiles;
    
    INSERT INTO public.profiles (
        id, 
        username, 
        artistic_name, 
        full_name,
        email, 
        birth_date,
        is_founder,
        fecha_de_creacion,
        foto_perfil,
        ultima_actualizacion
    )
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        COALESCE(NEW.raw_user_meta_data->>'artistic_name', NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
        NEW.raw_user_meta_data->>'full_name',
        NEW.email,
        NULLIF(NEW.raw_user_meta_data->>'birth_date', '')::DATE,
        (found_count < 100),
        mexico_now,
        NEW.raw_user_meta_data->>'avatar_url',
        mexico_now
    );
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        RAISE WARNING 'Error en handle_new_user: %', SQLERRM;
        RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
AFTER INSERT ON auth.users
FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

SELECT 'Base de datos reiniciada correctamente' as status;
