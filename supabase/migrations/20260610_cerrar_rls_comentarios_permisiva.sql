-- ==========================================================================
-- 🔒 FIX RLS — comentarios: cerrar la policy permisiva remanente
-- ==========================================================================
-- Contexto / bug:
--   El dump de producción tiene DOS policies de UPDATE sobre `comentarios`:
--     1. "Actualizar likes comentarios"  → FOR UPDATE USING (true) WITH CHECK (true)
--     2. "Autor puede editar su comentario" → USING (auth.uid() = usuario_id)
--
--   La migración 20260425_fix_rls_comentarios.sql creó la #2 e intentó borrar
--   las permisivas, pero sus DROPs apuntaban a otros nombres ("Actualizar
--   likes", "Permitir actualizar likes", "Update likes count") y NO al nombre
--   real "Actualizar likes comentarios". Como ambas son PERMISSIVE y Postgres
--   combina los USING con OR, la permisiva USING(true) gana → cualquier usuario
--   autenticado puede editar/forjar comentarios ajenos (defacement).
--
-- Solución:
--   Eliminar la policy permisiva. El contador de likes ya NO depende de un
--   UPDATE directo: el cliente usa la RPC `alternar_like_comentario`
--   (SECURITY DEFINER) que escribe en `likes_comentarios` y recomputa
--   likes_count de forma segura. Tras esta migración, solo el autor puede
--   actualizar su comentario.
-- ==========================================================================

BEGIN;

DROP POLICY IF EXISTS "Actualizar likes comentarios" ON public.comentarios;

COMMIT;
