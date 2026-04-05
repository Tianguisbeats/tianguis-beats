-- ==============================================================================
-- 🎫 REPARACIÓN FINAL DE RLS PARA CUPONES
-- ==============================================================================
-- Este script restaura las políticas de seguridad para la tabla 'cupones',
-- permitiendo que los productores gestionen sus propias estrategias comerciales.

BEGIN;

-- 1. Habilitar RLS (por si acaso se desactivó)
ALTER TABLE public.cupones ENABLE ROW LEVEL SECURITY;

-- 2. Eliminar políticas antiguas para evitar conflictos
DROP POLICY IF EXISTS "Productores gestionan sus propios cupones" ON public.cupones;
DROP POLICY IF EXISTS "Permitir lectura pública de cupones" ON public.cupones;
DROP POLICY IF EXISTS "Admin gestiona todos los cupones" ON public.cupones;

-- 3. Crear Políticas Robustas

-- Lectura: Cualquiera puede ver cupones (necesario para validarlos en el carrito)
CREATE POLICY "Permitir lectura pública de cupones" 
ON public.cupones FOR SELECT 
USING (true);

-- Gestión: Productores pueden hacer TODO con sus propios cupones
CREATE POLICY "Productores gestionan sus propios cupones" 
ON public.cupones FOR ALL
USING (auth.uid() = productor_id)
WITH CHECK (auth.uid() = productor_id);

-- Admin: Control total para administradores y soporte
CREATE POLICY "Admin gestiona todos los cupones" 
ON public.cupones FOR ALL 
USING (
    EXISTS (
        SELECT 1 FROM public.perfiles 
        WHERE perfiles.id = auth.uid() 
        AND (perfiles.es_admin = true OR perfiles.es_soporte = true)
    )
);

COMMIT;
