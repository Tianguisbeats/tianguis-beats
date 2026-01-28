-- Add license price columns to beats table
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS price_mp3 numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_wav numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_stems numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_exclusive numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_mp3_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_wav_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stems_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exclusive_active boolean DEFAULT false;

-- Create comments table
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id bigint REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

-- Enable RLS for comments
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
CREATE POLICY "Public comments are viewable by everyone" ON public.comments
    FOR SELECT USING (true);

CREATE POLICY "Users can create comments" ON public.comments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own comments" ON public.comments
    FOR DELETE USING (auth.uid() = user_id);

-- Create likes table
CREATE TABLE IF NOT EXISTS public.likes (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id bigint REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, beat_id)
);

-- Enable RLS for likes
ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
CREATE POLICY "Public likes are viewable by everyone" ON public.likes
    FOR SELECT USING (true);

CREATE POLICY "Users can toggle likes" ON public.likes
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can remove likes" ON public.likes
    FOR DELETE USING (auth.uid() = user_id);

-- Add like_count to beats for easier sorting/display (optional but recommended)
ALTER TABLE public.beats ADD COLUMN IF NOT EXISTS like_count bigint DEFAULT 0;
