-- TIANGUIS BEATS - NUCLEAR RESET v5 (LIMPIEZA TOTAL + SEGURIDAD MAXIMA)
-- ADVERTENCIA: ESTE SCRIPT BORRA TODO: DATOS, USUARIOS Y ARCHIVOS DE LOS BUCKETS.
-- Soluciona las alertas "UNRESTRICTED" activando RLS en todas las tablas.

-- 1. LIMPIEZA DE ARCHIVOS (STORAGE)
-- Esto borra las referencias a los archivos. Los archivos reales se eliminarán de S3/Supabase en segundo plano.
DELETE FROM storage.objects 
WHERE bucket_id IN ('fotos-perfil', 'fotos-portada', 'portadas-beats', 'beats-muestras', 'beats-mp3-alta-calidad', 'beats-wav', 'beats-stems');

-- 2. LIMPIEZA DE TABLAS
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

-- 3. RECREACIÓN DE TABLAS (Esquema Español Optimizado)

-- A) PROFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    artistic_name TEXT,
    full_name TEXT,
    foto_perfil TEXT,          
    portada_perfil TEXT,       
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
    fecha_de_creacion TIMESTAMPTZ DEFAULT NOW(),
    ultima_actualizacion TIMESTAMPTZ DEFAULT NOW(),
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
    price_mxn NUMERIC NOT NULL DEFAULT 199,
    price_wav_mxn NUMERIC DEFAULT 499,
    price_stems_mxn NUMERIC DEFAULT 999,
    exclusive_price_mxn NUMERIC,
    is_exclusive BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    portadabeat_url TEXT,
    mp3_tag_url TEXT,
    mp3_url TEXT NOT NULL,
    wav_url TEXT,
    stems_url TEXT,
    tag TEXT,
    tag_emoji TEXT,
    tag_color TEXT,
    cover_color TEXT,
    mood TEXT,
    reference_artist TEXT,
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

-- D) SALES
CREATE TABLE public.sales (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE SET NULL,
    buyer_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    seller_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    amount NUMERIC NOT NULL,
    license_type TEXT,
    status TEXT DEFAULT 'completed',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- E) INTERACCIONES
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

-- 4. SEGURIDAD TOTAL (RLS) - SOLUCIÓN A ALERTAS ROJAS Y "UNRESTRICTED"
-- Activamos RLS en TODAS las tablas explícitamente.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.playlist_beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listens ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad (Policies)

-- PROFILES
CREATE POLICY "Public Profiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Self Update Profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Self Insert Profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- BEATS
CREATE POLICY "Public Beats" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Producer Manage Beats" ON public.beats FOR ALL USING (auth.uid() = producer_id);

-- PLAYLISTS
CREATE POLICY "Public Playlists" ON public.playlists FOR SELECT USING (true);
CREATE POLICY "Producer Manage Playlists" ON public.playlists FOR ALL USING (auth.uid() = producer_id);

-- PLAYLIST BEATS
CREATE POLICY "Public Playlist Items" ON public.playlist_beats FOR SELECT USING (true);
CREATE POLICY "Producer Manage Items" ON public.playlist_beats FOR ALL USING (
    EXISTS (SELECT 1 FROM public.playlists WHERE id = playlist_id AND producer_id = auth.uid())
);

-- SALES
CREATE POLICY "Users See Own Purchases" ON public.sales FOR SELECT USING (auth.uid() = buyer_id OR auth.uid() = seller_id);
-- (Insert usually done by server/admin function, keeping simple for now)

-- FOLLOWS
CREATE POLICY "Public Follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Auth Can Follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Auth Can Unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- COMMENTS
CREATE POLICY "Public Comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Auth Can Comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth Can Delete Own Comment" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- LIKES
CREATE POLICY "Public Likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Auth Can Like" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Auth Can Unlike" ON public.likes FOR DELETE USING (auth.uid() = user_id);

-- LISTENS
CREATE POLICY "Public Listen Stats" ON public.listens FOR SELECT USING (true);
CREATE POLICY "Auth Can Log Listen" ON public.listens FOR INSERT WITH CHECK (auth.uid() = user_id OR user_id IS NULL);


-- 5. TRIGGER DE REGISTRO
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

SELECT 'LIMPIEZA NUCLEAR COMPLETADA: Buckets Vacíos, Tablas Reiniciadas, Seguridad Activada.' as status;
