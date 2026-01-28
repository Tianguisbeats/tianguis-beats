-- =============================================
-- TIANGUIS BEATS - Database Migration
-- Fecha: 2026-01-28
-- Descripción: Sincroniza el esquema de la base de datos con
--              el nuevo sistema de Username / Display Name.
-- =============================================

-- =============================================
-- PASO 1: Actualizar tabla PROFILES
-- =============================================

-- Renombrar 'artistic_name' a 'display_name'
ALTER TABLE public.profiles RENAME COLUMN artistic_name TO display_name;

-- Agregar columna 'email' (necesaria para login con username)
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email text;

-- Crear índice único para username (case-insensitive)
CREATE UNIQUE INDEX IF NOT EXISTS profiles_username_unique ON public.profiles (lower(username));

-- Crear índice para búsqueda rápida por email
CREATE INDEX IF NOT EXISTS profiles_email_idx ON public.profiles (email);

-- =============================================
-- PASO 2: Actualizar tabla BEATS (columnas faltantes)
-- =============================================
ALTER TABLE public.beats
ADD COLUMN IF NOT EXISTS mood text,
ADD COLUMN IF NOT EXISTS reference_artist text,
ADD COLUMN IF NOT EXISTS is_exclusive boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS tier_visibility int DEFAULT 0,
ADD COLUMN IF NOT EXISTS play_count bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS sale_count bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS like_count bigint DEFAULT 0,
ADD COLUMN IF NOT EXISTS price_mp3 numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_wav numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_stems numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS price_exclusive numeric DEFAULT NULL,
ADD COLUMN IF NOT EXISTS is_mp3_active boolean DEFAULT true,
ADD COLUMN IF NOT EXISTS is_wav_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_stems_active boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS is_exclusive_active boolean DEFAULT false;

-- Índices para ordenamiento
CREATE INDEX IF NOT EXISTS beats_play_count_idx ON public.beats (play_count DESC);
CREATE INDEX IF NOT EXISTS beats_sale_count_idx ON public.beats (sale_count DESC);

-- =============================================
-- PASO 3: Crear tabla COMMENTS (si no existe)
-- =============================================
CREATE TABLE IF NOT EXISTS public.comments (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    content text NOT NULL,
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id bigint REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Public comments are viewable by everyone') THEN
        CREATE POLICY "Public comments are viewable by everyone" ON public.comments FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can create comments') THEN
        CREATE POLICY "Users can create comments" ON public.comments FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'comments' AND policyname = 'Users can delete their own comments') THEN
        CREATE POLICY "Users can delete their own comments" ON public.comments FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =============================================
-- PASO 4: Crear tabla LIKES (si no existe)
-- =============================================
CREATE TABLE IF NOT EXISTS public.likes (
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
    beat_id bigint REFERENCES public.beats(id) ON DELETE CASCADE,
    created_at timestamptz DEFAULT now(),
    PRIMARY KEY (user_id, beat_id)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Public likes are viewable by everyone') THEN
        CREATE POLICY "Public likes are viewable by everyone" ON public.likes FOR SELECT USING (true);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can toggle likes') THEN
        CREATE POLICY "Users can toggle likes" ON public.likes FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'likes' AND policyname = 'Users can remove likes') THEN
        CREATE POLICY "Users can remove likes" ON public.likes FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;

-- =============================================
-- PASO 5: Trigger para sincronizar email en profiles
-- =============================================
-- Este trigger copia el email de auth.users a profiles cuando se crea un usuario.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (id, email, username, display_name, full_name, birth_date, role)
  VALUES (
    new.id,
    new.email,
    new.raw_user_meta_data->>'username',
    new.raw_user_meta_data->>'display_name',
    new.raw_user_meta_data->>'full_name',
    (new.raw_user_meta_data->>'birth_date')::date,
    new.raw_user_meta_data->>'role'
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Recrear el trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- PASO 6 (Opcional): Migrar email para usuarios existentes
-- =============================================
-- Si ya tienes usuarios, puedes correr esto para copiar sus emails:
-- UPDATE public.profiles p
-- SET email = u.email
-- FROM auth.users u
-- WHERE p.id = u.id AND p.email IS NULL;
