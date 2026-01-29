-- TIANGUIS BEATS - MASTER SCHEMA V5.17 (GOLDEN RECORD)
-- ADVERTENCIA: Este script borrará TODA la información existente para un reinicio profesional.
-- Ejecutar en el Editor SQL de Supabase.

-- 1. LIMPIEZA TOTAL (Reset)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.listens CASCADE;
DROP TABLE IF EXISTS public.notifications CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CREACIÓN DE TABLAS

-- PERFILES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    email TEXT,
    artistic_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    country TEXT,
    role TEXT DEFAULT 'producer' CHECK (role IN ('buyer', 'producer', 'artist', 'admin')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    is_admin BOOLEAN DEFAULT FALSE,
    is_founder BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    social_links JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- BEATS
CREATE TABLE public.beats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    title TEXT NOT NULL,
    genre TEXT,
    bpm INTEGER,
    musical_key TEXT,
    musical_scale TEXT,
    mood TEXT,
    description TEXT,
    
    -- Precios
    price_mxn INTEGER DEFAULT 0,
    price_wav_mxn INTEGER DEFAULT 0,
    price_stems_mxn INTEGER DEFAULT 0,
    is_exclusive BOOLEAN DEFAULT FALSE,
    exclusive_price_mxn INTEGER DEFAULT NULL,
    tier_visibility INTEGER DEFAULT 0, -- 0: Free, 1: Pro/Premium

    -- Archivos (Rutas de Storage)
    cover_url TEXT,
    mp3_tag_url TEXT, -- Preview/Muestra
    mp3_url TEXT,     -- HQ
    wav_url TEXT,
    stems_url TEXT,

    -- Stats
    play_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEGUIDORES (FOLLOWS)
CREATE TABLE public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- NOTIFICACIONES
CREATE TABLE public.notifications (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL, -- 'follow', 'like', 'sale', 'system'
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LIKES
CREATE TABLE public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(beat_id, user_id)
);

-- 3. STORAGE INFRASTRUCTURE (7 BUCKETS)

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types) VALUES 
('fotos-perfil', 'fotos-perfil', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('fotos-portada', 'fotos-portada', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('portadas-beats', 'portadas-beats', true, 5242880, '{image/jpeg,image/png,image/webp}'),
('beats-muestras', 'beats-muestras', true, 20971520, '{audio/mpeg}'),
('beats-mp3-alta-calidad', 'beats-mp3-alta-calidad', false, 52428800, '{audio/mpeg}'),
('beats-wav', 'beats-wav', false, 209715200, '{audio/wav,audio/x-wav}'),
('beats-stems', 'beats-stems', false, 524288000, '{application/zip,application/x-zip-compressed,application/x-rar-compressed}')
ON CONFLICT (id) DO UPDATE SET public = EXCLUDED.public, file_size_limit = EXCLUDED.file_size_limit, allowed_mime_types = EXCLUDED.allowed_mime_types;

-- 4. ROW LEVEL SECURITY (RLS)

-- Tablas Públicas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Edición propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Lectura pública beats" ON public.beats FOR SELECT USING (is_public = true);
CREATE POLICY "Gestión propia beats" ON public.beats FOR ALL TO authenticated USING (auth.uid() = producer_id);

CREATE POLICY "Lectura pública follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Gestión propia follows" ON public.follows FOR ALL TO authenticated USING (auth.uid() = follower_id);

CREATE POLICY "Lectura privada notificaciones" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Storage Policies (Basadas en Username)

-- Lectura Pública
CREATE POLICY "Acceso público fotos perfil" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-perfil');
CREATE POLICY "Acceso público fotos portada" ON storage.objects FOR SELECT USING (bucket_id = 'fotos-portada');
CREATE POLICY "Acceso público portadas beats" ON storage.objects FOR SELECT USING (bucket_id = 'portadas-beats');
CREATE POLICY "Acceso público muestras" ON storage.objects FOR SELECT USING (bucket_id = 'beats-muestras');

-- Gestión por Carpeta (Username)
CREATE POLICY "Gestión por Carpeta Username" ON storage.objects 
FOR ALL TO authenticated
USING (
    (storage.foldername(name))[1] IN (SELECT username FROM profiles WHERE id = auth.uid())
)
WITH CHECK (
    (storage.foldername(name))[1] IN (SELECT username FROM profiles WHERE id = auth.uid())
);

-- 5. AUTOMATIZACIÓN (Triggers)

CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, artistic_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'artistic_name', 'Artista Nuevo')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6. VERIFICACIÓN MANUAL (Ejemplo para Sondemaik)
-- UPDATE profiles SET is_verified = true, is_founder = true WHERE username = 'sondemaik';
