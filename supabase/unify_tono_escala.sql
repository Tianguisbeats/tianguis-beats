-- ==========================================
-- UNIFICACIÓN DE NOTA MUSICAL Y ESCALA
-- ==========================================

-- 1. Eliminar la vista que depende de la tabla `beats` temporalmente
DROP VIEW IF EXISTS public.beats_busqueda;

-- 2. Añadir la nueva columna unificada
ALTER TABLE IF EXISTS public.beats ADD COLUMN IF NOT EXISTS tono_escala TEXT;

-- 3. Migrar los datos existentes
-- Concatenar la nota y la escala (ej. "C" y "Mayor" -> "C Mayor")
UPDATE public.beats 
SET tono_escala = CONCAT(nota_musical, ' ', escala_musical) 
WHERE nota_musical IS NOT NULL AND escala_musical IS NOT NULL;

-- En caso de que haya beats con solo nota pero sin escala
UPDATE public.beats 
SET tono_escala = nota_musical 
WHERE nota_musical IS NOT NULL AND escala_musical IS NULL;

-- 4. Eliminar las columnas viejas
ALTER TABLE IF EXISTS public.beats DROP COLUMN IF EXISTS nota_musical;
ALTER TABLE IF EXISTS public.beats DROP COLUMN IF EXISTS escala_musical;

-- 5. Recrear la vista de búsqueda actualizada
-- Al usar b.* se incluirá automáticamente la nueva columna tono_escala
CREATE OR REPLACE VIEW public.beats_busqueda AS
SELECT 
    b.*,
    p.nombre_artistico as producer_nombre_artistico,
    p.nombre_usuario as producer_nombre_usuario,
    p.esta_verificado as producer_esta_verificado,
    p.es_fundador as producer_es_fundador,
    p.nivel_suscripcion as producer_nivel_suscripcion,
    p.foto_perfil as producer_foto_perfil
FROM public.beats b
JOIN public.perfiles p ON b.productor_id = p.id
WHERE b.es_publico = true;

-- Asegurar permisos de la vista
GRANT SELECT ON public.beats_busqueda TO anon, authenticated;
