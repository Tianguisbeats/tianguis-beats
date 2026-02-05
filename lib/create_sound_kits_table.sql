-- Create sound_kits table
CREATE TABLE IF NOT EXISTS public.sound_kits (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    file_url TEXT NOT NULL, -- Path to the .zip / .rar file
    cover_url TEXT,         -- Optional cover image
    is_public BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- RLS Policies
ALTER TABLE public.sound_kits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access for sound kits"
ON public.sound_kits FOR SELECT
USING (true);

CREATE POLICY "Allow owners to manage their sound kits"
ON public.sound_kits FOR ALL
USING (auth.uid() = producer_id)
WITH CHECK (auth.uid() = producer_id);

-- Enable realtime
ALTER PUBLICATION supabase_realtime ADD TABLE sound_kits;
