-- TIANGUIS BEATS - v5.7 DEFINITIVE RESET & REPRODUCTION
-- WARNING: THIS SCRIPT WILL DELETE ALL DATA AND TABLES
-- Purpose: 100% Sync between Frontend v5.7 and Supabase Backend.

-- 1. CLEAN SLATE
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.listens CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. TABLES
CREATE TABLE public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    artistic_name TEXT,
    full_name TEXT,
    avatar_url TEXT,
    cover_url TEXT,
    bio TEXT,
    country TEXT,
    open_collaborations BOOLEAN DEFAULT TRUE,
    social_links JSONB DEFAULT '{}'::jsonb,
    birth_date DATE,
    role TEXT CHECK (role IN ('buyer', 'producer', 'artist', 'admin')) DEFAULT 'producer',
    subscription_tier TEXT CHECK (subscription_tier IN ('free', 'pro', 'premium')) DEFAULT 'free',
    is_admin BOOLEAN DEFAULT FALSE,
    is_founder BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    username_changes INTEGER DEFAULT 0,
    email TEXT UNIQUE,
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
    description TEXT,
    
    -- Licencias (Nuevos campos v5.7)
    price_mxn NUMERIC NOT NULL DEFAULT 199,
    price_wav_mxn NUMERIC DEFAULT 499,
    price_stems_mxn NUMERIC DEFAULT 999,
    exclusive_price_mxn NUMERIC,
    
    is_exclusive BOOLEAN DEFAULT FALSE,
    is_public BOOLEAN DEFAULT TRUE,
    
    -- Archivos (Paths y URLs)
    cover_url TEXT,
    mp3_tag_url TEXT,
    mp3_url TEXT NOT NULL,
    wav_url TEXT,
    stems_url TEXT,
    
    -- Estetica Custom
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

-- 3. RLS (Row Level Security)
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Beats Policies
CREATE POLICY "Beats are viewable by everyone" ON public.beats FOR SELECT USING (true);
CREATE POLICY "Users can insert own beats" ON public.beats FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Users can update own beats" ON public.beats FOR UPDATE USING (auth.uid() = producer_id);
CREATE POLICY "Users can delete own beats" ON public.beats FOR DELETE USING (auth.uid() = producer_id);

-- Follows Policies
CREATE POLICY "Follows are viewable by everyone" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow others" ON public.follows FOR INSERT WITH CHECK (auth.uid() = follower_id);
CREATE POLICY "Users can unfollow" ON public.follows FOR DELETE USING (auth.uid() = follower_id);

-- 4. FUNCTIONS & TRIGGERS
-- Handle New User Registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
    found_count INTEGER;
BEGIN
    -- Check if this user should be a Founder (first 100)
    SELECT count(*) INTO found_count FROM public.profiles;
    
    INSERT INTO public.profiles (id, username, artistic_name, email, is_founder)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data->>'username',
        NEW.raw_user_meta_data->>'username',
        NEW.email,
        (found_count < 100) -- Automatic Founder status
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 5. STORAGE BUCKETS
-- NOTE: Manual creation in Supabase UI might be needed, but these policies help.
-- Buckets: 'avatars', 'beats-previews', 'beats-raw'

-- 6. INDEXES
CREATE INDEX idx_beats_genre ON public.beats(genre);
CREATE INDEX idx_beats_producer ON public.beats(producer_id);
CREATE INDEX idx_profiles_username ON public.profiles(username);
CREATE INDEX idx_follows_following ON public.follows(following_id);
