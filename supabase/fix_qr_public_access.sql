-- ==============================================================================
-- 🛠️ TIANGUIS BEATS - HABILITAR VERIFICACIÓN PÚBLICA (QR) 
-- ==============================================================================
-- Este script permite que cualquier persona (incluso sin estar logueada) pueda 
-- consultar una transacción específica por su ID o ID de Pedido, lo cual es 
-- necesario para que el escaneo del código QR funcione correctamente.

BEGIN;

-- 1. Eliminar política previa si existe (para evitar conflictos)
DROP POLICY IF EXISTS "Lectura pública para verificación QR" ON public.transacciones;

-- 2. Crear nueva política que permite lectura anónima (public)
-- Restringimos la lectura solo a transacciones con estados válidos.
CREATE POLICY "Lectura pública para verificación QR" 
ON public.transacciones 
FOR SELECT 
TO public
USING (
    estado_pago IN ('completado', 'completed', 'valido')
);

-- Nota: No es necesario quitar las políticas anteriores de "Lectura propia",
-- ya que las políticas en Supabase son permisivas (OR). 
-- Esta nueva política simplemente amplía el acceso a CUALQUIER USUARIO
-- bajo la condición de que el pago esté completado.

COMMIT;
