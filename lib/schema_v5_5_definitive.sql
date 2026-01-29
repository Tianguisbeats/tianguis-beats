-- TIANGUIS BEATS - v5.5 DEFINITIVE RESET & REPRODUCTION
-- WARNING: THIS SCRIPT WILL DELETE ALL DATA AND TABLES
-- Purpose: Complete synchronization between Database and Codebase.

-- 1. CLEAN SLATE (Drop all existing objects)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP FUNCTION IF EXISTS public.handle_new_user();

DROP TABLE IF EXISTS public.comments CASCADE;
DROP TABLE IF EXISTS public.likes CASCADE;
DROP TABLE IF EXISTS public.listens CASCADE;
DROP TABLE IF EXISTS public.follows CASCADE;
DROP TABLE IF EXISTS public.beats CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 2. CORE TABLES

-- PROFILES: Linked to Supabase Auth
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

-- BEATS: The main product
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
    
    -- Pricing
    price_mxn INTEGER DEFAULT 0,
    is_exclusive BOOLEAN DEFAULT FALSE,
    exclusive_price_mxn INTEGER DEFAULT NULL,
    tier_visibility INTEGER DEFAULT 0, -- 0: Free, 1: Pro/Premium

    -- Files (Public and Private)
    cover_url TEXT,       -- From 'beats-previews'
    mp3_tag_url TEXT,     -- From 'beats-previews' (Preview with Tag)
    mp3_url TEXT,         -- From 'beats-raw' (High Quality)
    wav_url TEXT,         -- From 'beats-raw'
    stems_url TEXT,       -- From 'beats-raw'

    -- Aesthetics & Marketing
    tag TEXT,
    tag_emoji TEXT,
    tag_color TEXT,
    cover_color TEXT,
    reference_artist TEXT,

    -- Stats
    play_count INTEGER DEFAULT 0,
    sale_count INTEGER DEFAULT 0,
    like_count INTEGER DEFAULT 0,
    
    is_public BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- FOLLOWS: Social connection
CREATE TABLE public.follows (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    follower_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    following_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(follower_id, following_id)
);

-- LIKES: User favorites
CREATE TABLE public.likes (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(beat_id, user_id)
);

-- COMMENTS: Discussion
CREATE TABLE public.comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- LISTENS: Analytical history
CREATE TABLE public.listens (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    beat_id UUID REFERENCES public.beats(id) ON DELETE CASCADE NOT NULL,
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL, -- Can be anonymous
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. SECURITY (Row Level Security)

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.follows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.listens ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- Beats Policies
CREATE POLICY "Public beats are viewable by everyone" ON public.beats FOR SELECT USING (is_public = true);
CREATE POLICY "Producers can insert own beats" ON public.beats FOR INSERT WITH CHECK (auth.uid() = producer_id);
CREATE POLICY "Producers can update own beats" ON public.beats FOR UPDATE USING (auth.uid() = producer_id);
CREATE POLICY "Producers can delete own beats" ON public.beats FOR DELETE USING (auth.uid() = producer_id);

-- Follows Policies
CREATE POLICY "Everyone can see follows" ON public.follows FOR SELECT USING (true);
CREATE POLICY "Users can follow/unfollow" ON public.follows FOR ALL USING (auth.uid() = follower_id);

-- Likes Policies
CREATE POLICY "Everyone can see likes" ON public.likes FOR SELECT USING (true);
CREATE POLICY "Authenticated users can like/unlike" ON public.likes FOR ALL USING (auth.uid() = user_id);

-- Comments Policies
CREATE POLICY "Everyone can see comments" ON public.comments FOR SELECT USING (true);
CREATE POLICY "Authenticated users can comment" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);

-- Listens Policies
CREATE POLICY "Listens are public-insertable" ON public.listens FOR INSERT WITH CHECK (true);
CREATE POLICY "Admin can view all listens" ON public.listens FOR SELECT USING (true);

-- 4. AUTOMATION (Triggers & Functions)

-- Function to handle profile creation on Auth Signup
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
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- 5. OPTIMIZATION (Indexes)
CREATE INDEX IF NOT EXISTS idx_beats_producer ON public.beats(producer_id);
CREATE INDEX IF NOT EXISTS idx_beats_genre ON public.beats(genre);
CREATE INDEX IF NOT EXISTS idx_follows_following ON public.follows(following_id);
CREATE INDEX IF NOT EXISTS idx_likes_beat ON public.likes(beat_id);

-- 6. STORAGE CONFIGURATION HINTS
-- Make sure to create these buckets in Supabase UI with 'Public' access:
-- 1. 'avatars' (For profile pictures)
-- 2. 'beats-previews' (For covers and tagged MP3s)
-- 3. 'beats-raw' (For HQ MP3, WAV, and Stems. Private highly recommended)
