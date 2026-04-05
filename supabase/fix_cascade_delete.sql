-- ==============================================================================
-- 🛠️ FIX: AGREGAR ON DELETE CASCADE A TODAS LAS LLAVES FORÁNEAS
-- ==============================================================================
-- Ejecuta este script para corregir las referencias que pueden estar bloqueando
-- la eliminación de usuarios en Supabase Auth.
-- ==============================================================================

BEGIN;

-- 1. TRANSACCIONES
ALTER TABLE public.transacciones DROP CONSTRAINT IF EXISTS transacciones_vendedor_id_fkey;
ALTER TABLE public.transacciones ADD CONSTRAINT transacciones_vendedor_id_fkey 
    FOREIGN KEY (vendedor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

-- 2. PROYECTOS DE SERVICIO
ALTER TABLE public.proyectos_servicio DROP CONSTRAINT IF EXISTS proyectos_servicio_comprador_id_fkey;
ALTER TABLE public.proyectos_servicio ADD CONSTRAINT proyectos_servicio_comprador_id_fkey 
    FOREIGN KEY (comprador_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

ALTER TABLE public.proyectos_servicio DROP CONSTRAINT IF EXISTS proyectos_servicio_productor_id_fkey;
ALTER TABLE public.proyectos_servicio ADD CONSTRAINT proyectos_servicio_productor_id_fkey 
    FOREIGN KEY (productor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

-- 3. MENSAJES Y ARCHIVOS DE PROYECTO
ALTER TABLE public.mensajes_proyecto DROP CONSTRAINT IF EXISTS mensajes_proyecto_remitente_id_fkey;
ALTER TABLE public.mensajes_proyecto ADD CONSTRAINT mensajes_proyecto_remitente_id_fkey 
    FOREIGN KEY (remitente_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

ALTER TABLE public.archivos_proyecto DROP CONSTRAINT IF EXISTS archivos_proyecto_subidor_id_fkey;
ALTER TABLE public.archivos_proyecto ADD CONSTRAINT archivos_proyecto_subidor_id_fkey 
    FOREIGN KEY (subidor_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

-- 4. QUEJAS Y SUGERENCIAS
ALTER TABLE public.quejas_y_sugerencias DROP CONSTRAINT IF EXISTS quejas_y_sugerencias_user_id_fkey;
ALTER TABLE public.quejas_y_sugerencias ADD CONSTRAINT quejas_y_sugerencias_user_id_fkey 
    FOREIGN KEY (user_id) REFERENCES public.perfiles(id) ON DELETE CASCADE;

COMMIT;

-- ==============================================================================
-- 🔍 DIAGNÓSTICO (Opcional)
-- Si después de ejecutar lo anterior sigue marcando error, 
-- ejecuta esta consulta para ver qué tabla está bloqueando:
-- ==============================================================================
/*
SELECT
    tc.table_schema, 
    tc.table_name, 
    kcu.column_name 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' 
  AND ccu.table_schema = 'auth' 
  AND ccu.table_name = 'users';
*/
