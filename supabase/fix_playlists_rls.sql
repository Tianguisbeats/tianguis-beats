-- migration: fix_playlists_rls.sql
-- Description: Fixes RLS policies for 'listas_reproduccion' to allow creation and management.

-- 1. Ensure RLS is enabled
ALTER TABLE public.listas_reproduccion ENABLE ROW LEVEL SECURITY;

-- 2. Drop existing policies to avoid conflicts
DROP POLICY IF EXISTS "Proposito total listas propio" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Producers can manage their own playlists" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Everyone can view public playlists" ON public.listas_reproduccion;
DROP POLICY IF EXISTS "Control total listas propio" ON public.listas_reproduccion;

-- 3. Create comprehensive policy for owners (ALL operations)
-- Note: 'usuario_id' is the column name in the latest schema reconstruction
CREATE POLICY "Control total listas propio" 
ON public.listas_reproduccion 
FOR ALL 
TO authenticated 
USING (auth.uid() = usuario_id)
WITH CHECK (auth.uid() = usuario_id);

-- 4. Create policy for public viewing
CREATE POLICY "Lectura pública listas" 
ON public.listas_reproduccion 
FOR SELECT 
USING (es_publica = true);

-- 5. Grant permissions (just in case)
GRANT ALL ON public.listas_reproduccion TO authenticated;
GRANT SELECT ON public.listas_reproduccion TO anon;
