-- migration: fix_playlists_final.sql
-- Description: Adds 'es_privada' column and reinforces RLS policies.

BEGIN;

-- 1. Add 'es_privada' column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'listas_reproduccion' AND column_name = 'es_privada') THEN
        ALTER TABLE public.listas_reproduccion ADD COLUMN es_privada BOOLEAN DEFAULT false;
    END IF;
END $$;

-- 2. Update existing data (optional, but keep in sync)
UPDATE public.listas_reproduccion SET es_privada = NOT es_publica;

-- 3. Reinforce RLS Policies
-- First, drop ALL possible conflicting policies
DROP POLICY IF EXISTS "Control total listas propio" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Lectura pública listas" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Producers can manage their own playlists" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Everyone can view public playlists" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Proposito total listas propio" ON public.listas_reproduccion;

-- Policy: Owner can do EVERYTHING (Insert, Select, Update, Delete)
CREATE POLICY "Control total listas propietario" 
ON public.listas_reproduccion 
FOR ALL 
TO authenticated 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- Policy: Public can only see public playlists
CREATE POLICY "Lectura publica listas" 
ON public.listas_reproduccion 
FOR SELECT 
TO public
USING (es_publica = true AND es_privada = false);

-- 4. Grant explicit permissions
GRANT ALL ON public.listas_reproduccion TO authenticated;
GRANT SELECT ON public.listas_reproduccion TO anon;

COMMIT;
