-- Fix RLS for coupons to allow support role to manage them
DROP POLICY IF EXISTS "Admin gestiona todos los cupones" ON public.cupones;
CREATE POLICY "Admin gestiona todos los cupones" 
ON public.cupones FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE perfiles.id = auth.uid() 
        AND (perfiles.es_admin = true OR perfiles.es_soporte = true)
    )
);
