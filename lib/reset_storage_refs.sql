-- 🔥 TIANGUIS BEATS - REINICIO TOTAL DE DATOS DE ALMACENAMIENTO
-- ADVERTENCIA: Este script borrará los registros de los Beats de la base de datos
-- Úsalo solo después de haber limpiado tus Buckets en Supabase Storage.

-- 1. Limpiar interacciones y datos dependientes
DELETE FROM public.comments;
DELETE FROM public.likes;
DELETE FROM public.listens;

-- 2. Borrar todos los Beats
DELETE FROM public.beats;

-- 3. Resetear perfiles (quitar links a fotos que ya no existen)
UPDATE public.profiles 
SET avatar_url = NULL, 
    cover_url = NULL;

-- 4. Opcional: Si quieres reiniciar los contadores de los perfiles (si los tienes)
-- UPDATE public.profiles SET like_count = 0, follow_count = 0; -- Descomentar si aplica

-- ¡LISTO! Ahora tu base de datos está sincronizada con tus buckets vacíos.
-- Puedes empezar a subir archivos nuevos y se organizarán correctamente.
