-- TIANGUIS BEATS - v5.6 UNIFIED SYSTEM SYNC
-- PURPOSE: Fix permissions, ensure profile consistency, and unify schema.
-- WARNING: Performs a tables reset to ensure 100% consistency.

-- 1. CLEAN SLATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.listens CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. SCHEMA AND TABLES

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
    birth_date DATE,
    role TEXT DEFAULT 'producer' CHECK (role IN ('buyer', 'producer', 'artist', 'admin')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    is_admin BOOLEAN DEFAULT FALSE,
    is_founder BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    social_links JSONB DEFAULT '{}'::jsonb,
    username_changes INTEGER DEFAULT 0,
    open_collaborations BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

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
    price_mxn INTEGER DEFAULT 0,
    is_exclusive BOOLEAN DEFAULT FALSE,
    exclusive_price_mxn INTEGER DEFAULT NULL,
    tier_visibility INTEGER DEFAULT 0,
    cover_url TEXT,
    mp3_tag_url TEXT,
    mp3_url TEXT,
    wav_url TEXT,
    stems_url TEXT,
    tag TEXT,
    tag_emoji TEXT,
    tag_color TEXT,
    cover_color TEXT,
    reference_artist TEXT,
    play_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOCIALS & STATS
CREATE TABLE public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

CREATE TABLE public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(beat_id, user_id)
);

CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE public.listens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. PERMISSIONS (Crucial for the "Permission Denied" fix)
-- Grant usage on schema
GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Default permissions for all future tables
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO postgres, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO anon, authenticated;
ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT INSERT, UPDATE, DELETE ON TABLES TO authenticated;

-- Explicit grants for current tables
GRANT ALL ON ALL TABLES IN SCHEMA public TO postgres, service_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON ALL TABLES IN SCHEMA public TO authenticated;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO anon, authenticated;

-- 4. ROW LEVEL SECURITY (RLS)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listens ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Beats Policies
CREATE POLICY "Public beats are viewable by everyone" ON public.beats FOR SELECT USING (is_public = true);
CREATE POLICY "Producers can insert beats" ON public.beats FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Producers can update own beats" ON public.beats FOR UPDATE USING (auth.uid() = producer_id);
CREATE POLICY "Producers can delete own beats" ON public.beats FOR DELETE USING (auth.uid() = producer_id);

-- Follows Policies
CREATE POLICY "Everyone can see follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 5. AUTOMATION: Sync existing and new users
CREATE OR REPLACE FUNCTION public.handle_new_user() 
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, artistic_name, role)
  VALUES (
    new.id, 
    new.email, 
    COALESCE(new.raw_user_meta_data->>'username', 'user_' || substr(new.id::text, 1, 8)),
    COALESCE(new.raw_user_meta_data->>'artistic_name', 'Artista Nuevo'),
    'producer'
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- SYNC EXISTING USERS (Crucial after a reset)
INSERT INTO public.profiles (id, email, username, artistic_name, role)
SELECT 
    id, 
    email, 
    COALESCE(raw_user_meta_data->>'username', 'user_' || substr(id::text, 1, 8)),
    COALESCE(raw_user_meta_data->>'artistic_name', 'Artista Nuevo'),
    'producer'
FROM auth.users
ON CONFLICT (id) DO NOTHING;
