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
    user_num SERIAL,
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

-- COMENTARIOS
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- REPRODUCCIONES (Analytics)
CREATE TABLE public.listens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
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

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listens ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública perfiles" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Edición propio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Lectura pública beats" ON public.beats FOR SELECT USING (is_public = true);
CREATE POLICY "Gestión propia beats" ON public.beats FOR ALL TO authenticated USING (auth.uid() = producer_id);

CREATE POLICY "Lectura pública follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Gestión propia follows" ON public.follows FOR ALL TO authenticated USING (auth.uid() = follower_id);

CREATE POLICY "Lectura privada notificaciones" ON public.notifications FOR SELECT USING (auth.uid() = user_id);

-- Likes Policies
CREATE POLICY "Lectura pública likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Gestión propia likes" ON public.likes FOR ALL TO authenticated USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Lectura pública comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Insertar comments autenticado" ON public.comments FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Borrar propio comment" ON public.comments FOR DELETE TO authenticated USING (auth.uid() = user_id);

-- Listens Policies (Analytics)
CREATE POLICY "Lectura pública listens" ON public.listens FOR SELECT USING (true);
CREATE POLICY "Insertar listens" ON public.listens FOR INSERT WITH CHECK (true);

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
  INSERT INTO public.profiles (id, email, username, artistic_name, full_name)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'artistic_name', 'Artista Nuevo'),
    new.raw_user_meta_data->>'full_name'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 6 founder 
-- v5.23: LÓGICA DE 'SILLAS MUSICALES' (4 CONTADORES & RE-SECUENCIA)
-- Borramos triggers anteriores
DROP TRIGGER IF EXISTS check_founder_on_insert ON public.profiles;
DROP TRIGGER IF EXISTS on_profile_deleted ON public.profiles;
DROP TRIGGER IF EXISTS on_tier_change_before ON public.profiles;
DROP TRIGGER IF EXISTS on_tier_change_after ON public.profiles;
DROP FUNCTION IF EXISTS public.auto_founder_check();
DROP FUNCTION IF EXISTS public.resequence_users_after_delete();
DROP FUNCTION IF EXISTS public.manage_tier_identity();
DROP FUNCTION IF EXISTS public.resequence_tiers_after();

-- 1. Modificación de Columnas
-- Renombramos user_num a user_num_total si existe (para preservar data)
DO $$
BEGIN
  IF EXISTS(SELECT 1 FROM information_schema.columns WHERE table_name = 'profiles' AND column_name = 'user_num') THEN
     ALTER TABLE public.profiles RENAME COLUMN user_num TO user_num_total;
  ELSE
     ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS user_num_total INTEGER;
  END IF;
END $$;

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS user_num_free INTEGER,
ADD COLUMN IF NOT EXISTS user_num_pro INTEGER,
ADD COLUMN IF NOT EXISTS user_num_prem INTEGER;

-- 2. Función Trigger: ASIGNACIÓN DE ASIENTOS (BEFORE INSERT/UPDATE)
CREATE OR REPLACE FUNCTION public.assign_musical_chairs()
RETURNS TRIGGER AS $$
BEGIN
  -- CASO: NUEVO USUARIO (INSERT)
  IF (TG_OP = 'INSERT') THEN
     -- 1. Asignar Global Total
     SELECT COALESCE(MAX(user_num_total), 0) + 1 INTO NEW.user_num_total FROM public.profiles;
     
     -- 2. Asignar Asiento según Tier
     IF NEW.subscription_tier = 'free' OR NEW.subscription_tier IS NULL THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.profiles;
     ELSIF NEW.subscription_tier = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.profiles;
     ELSIF NEW.subscription_tier = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.profiles;
     END IF;
  
  -- CASO: CAMBIO DE TIER (UPDATE)
  ELSIF (TG_OP = 'UPDATE' AND NEW.subscription_tier IS DISTINCT FROM OLD.subscription_tier) THEN
     -- 1. Asignar NUEVO asiento al final de la fila destino
     IF NEW.subscription_tier = 'free' THEN
        SELECT COALESCE(MAX(user_num_free), 0) + 1 INTO NEW.user_num_free FROM public.profiles;
        NEW.user_num_pro := NULL; 
        NEW.user_num_prem := NULL;
     ELSIF NEW.subscription_tier = 'pro' THEN
        SELECT COALESCE(MAX(user_num_pro), 0) + 1 INTO NEW.user_num_pro FROM public.profiles;
        NEW.user_num_free := NULL;
        NEW.user_num_prem := NULL;
     ELSIF NEW.subscription_tier = 'premium' THEN
        SELECT COALESCE(MAX(user_num_prem), 0) + 1 INTO NEW.user_num_prem FROM public.profiles;
        NEW.user_num_free := NULL;
        NEW.user_num_pro := NULL;
     END IF;
  END IF;

  -- 3. EVALUAR FOUNDER IMPLÍCITO (Solo Pro/Prem primeros 100)
  NEW.is_founder := (
     (COALESCE(NEW.user_num_pro, 999) <= 100) OR 
     (COALESCE(NEW.user_num_prem, 999) <= 100)
  );

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chairs_assignment
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.assign_musical_chairs();

-- 3. Función Trigger: RE-SECUENCIA (AFTER DELETE/UPDATE)
-- "Cierra los huecos"
CREATE OR REPLACE FUNCTION public.resequence_musical_chairs()
RETURNS TRIGGER AS $$
DECLARE
  v_old_tier TEXT;
  v_old_free INT;
  v_old_pro INT;
  v_old_prem INT;
  v_old_total INT;
BEGIN
  -- Obtener valores viejos
  IF (TG_OP = 'DELETE') THEN
     v_old_tier := OLD.subscription_tier;
     v_old_free := OLD.user_num_free;
     v_old_pro := OLD.user_num_pro;
     v_old_prem := OLD.user_num_prem;
     v_old_total := OLD.user_num_total;
  ELSE -- UPDATE
     v_old_tier := OLD.subscription_tier;
     v_old_free := OLD.user_num_free;
     v_old_pro := OLD.user_num_pro;
     v_old_prem := OLD.user_num_prem;
     v_old_total := NULL; -- En update no cambia el total global
  END IF;

  -- 1. CASO GLOBAL: Si se borra, recorre el total
  IF (TG_OP = 'DELETE') AND v_old_total IS NOT NULL THEN
     UPDATE public.profiles SET user_num_total = user_num_total - 1 WHERE user_num_total > v_old_total;
  END IF;

  -- 2. CASO TIERS: Si dejó un hueco (por Delete o cambio de Tier)
  IF (TG_OP = 'DELETE') OR (TG_OP = 'UPDATE' AND OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier) THEN
     
     -- Hueco en FREE
     IF v_old_tier = 'free' AND v_old_free IS NOT NULL THEN
        UPDATE public.profiles SET user_num_free = user_num_free - 1 WHERE user_num_free > v_old_free;
     END IF;

     -- Hueco en PRO
     IF v_old_tier = 'pro' AND v_old_pro IS NOT NULL THEN
        UPDATE public.profiles SET user_num_pro = user_num_pro - 1 WHERE user_num_pro > v_old_pro;
        -- Checar nuevo Founder (el que cayó al 100)
        UPDATE public.profiles SET is_founder = true WHERE user_num_pro = 100 AND subscription_tier = 'pro';
     END IF;

     -- Hueco en PREMIUM
     IF v_old_tier = 'premium' AND v_old_prem IS NOT NULL THEN
        UPDATE public.profiles SET user_num_prem = user_num_prem - 1 WHERE user_num_prem > v_old_prem;
        -- Checar nuevo Founder
        UPDATE public.profiles SET is_founder = true WHERE user_num_prem = 100 AND subscription_tier = 'premium';
     END IF;

  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER on_chairs_resequence
  AFTER DELETE OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.resequence_musical_chairs();

-- 7. VERIFICACIÓN MANUAL (Ejemplo para Sondemaik)
-- UPDATE profiles SET is_verified = true, is_founder = true WHERE username = 'sondemaik';
