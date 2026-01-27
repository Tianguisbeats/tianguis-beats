-- Tablas principales para TianguisBeats

-- 1. Perfiles de Usuario (Extensión de Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
    username TEXT UNIQUE, -- Se mantiene por compatibilidad, pero usaremos artistic_name
    artistic_name TEXT UNIQUE,
    full_name TEXT,
    avatar_url TEXT,
    birth_date DATE,
    role TEXT CHECK (role IN ('producer', 'artist')),
    subscription_tier TEXT DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'premium')),
    is_admin BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Los perfiles son públicos" ON public.profiles
    FOR SELECT USING (true);

CREATE POLICY "Los usuarios pueden editar su propio perfil" ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- 2. Beats (Actualizada con campos de archivos)
CREATE TABLE IF NOT EXISTS public.beats (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    producer_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    genre TEXT,
    bpm INTEGER,
    musical_key TEXT,
    price_mxn NUMERIC DEFAULT 299,
    is_public BOOLEAN DEFAULT true,
    
    -- Archivos (URLs de Supabase Storage)
    cover_url TEXT,
    mp3_url TEXT,
    wav_url TEXT,
    stems_url TEXT, -- Exclusivo para Premium
    
    -- Etiquetas
    tag TEXT,
    tag_emoji TEXT,
    tag_color TEXT,
    cover_color TEXT,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Habilitar RLS en beats
ALTER TABLE public.beats ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Beats públicos son visibles para todos" ON public.beats
    FOR SELECT USING (is_public = true);

CREATE POLICY "Productores pueden gestionar sus propios beats" ON public.beats
    FOR ALL USING (auth.uid() = producer_id);

-- Función para crear perfil automáticamente al registrarse (Opcional pero recomendado)
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, artistic_name, birth_date, role)
  VALUES (
    new.id, 
    new.raw_user_meta_data->>'full_name', 
    new.raw_user_meta_data->>'artistic_name',
    (new.raw_user_meta_data->>'birth_date')::DATE,
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger para handle_new_user
-- CREATE TRIGGER on_auth_user_created
--   AFTER INSERT ON auth.users
--   FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
