-- =====================================================
-- Optimización de base de datos — 2026-04-25
-- Tianguis Beats
-- =====================================================
-- Aplica:
-- 1. Cierre de huecos de seguridad
-- 2. Políticas RLS faltantes (proyectos, notificaciones)
-- 3. Limpieza de políticas duplicadas
-- 4. Índices de rendimiento
-- =====================================================

BEGIN;

-- =====================================================
-- 1. SEGURIDAD CRÍTICA
-- =====================================================

-- 1.1 Eliminar policy peligrosa que permitía a CUALQUIER usuario
--     autenticado modificar el contenido de comentarios ajenos
DROP POLICY IF EXISTS "Actualizar likes comentarios" ON public.comentarios;
-- Justificación: el trigger trg_recomputar_likes_count ya recalcula
-- likes_count automáticamente al INSERT/DELETE en likes_comentarios.
-- No se necesita un UPDATE abierto.

-- 1.2 Habilitar RLS en configuracion_global (estaba desactivado)
ALTER TABLE public.configuracion_global ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Lectura pública configuración"
  ON public.configuracion_global FOR SELECT USING (true);

CREATE POLICY "Solo admins modifican configuración"
  ON public.configuracion_global FOR ALL TO authenticated
  USING (public.soy_admin())
  WITH CHECK (public.soy_admin());

-- =====================================================
-- 2. POLÍTICAS RLS PARA TABLAS DE PROYECTOS (faltaban)
-- =====================================================
-- Estas tablas tenían RLS habilitado pero SIN políticas,
-- lo que rompía el flujo del cliente. Solo el productor y
-- comprador del proyecto pueden interactuar con ellas.

-- 2.1 mensajes_proyecto
CREATE POLICY "Mensajes para involucrados del proyecto"
  ON public.mensajes_proyecto FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.proyectos p
    WHERE p.id = mensajes_proyecto.proyecto_id
      AND (p.comprador_id = auth.uid() OR p.productor_id = auth.uid())
  ));

CREATE POLICY "Enviar mensajes solo involucrados"
  ON public.mensajes_proyecto FOR INSERT
  WITH CHECK (
    auth.uid() = remitente_id
    AND EXISTS (
      SELECT 1 FROM public.proyectos p
      WHERE p.id = mensajes_proyecto.proyecto_id
        AND (p.comprador_id = auth.uid() OR p.productor_id = auth.uid())
    )
  );

-- 2.2 archivos_proyecto
CREATE POLICY "Archivos para involucrados del proyecto"
  ON public.archivos_proyecto FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.proyectos p
    WHERE p.id = archivos_proyecto.proyecto_id
      AND (p.comprador_id = auth.uid() OR p.productor_id = auth.uid())
  ));

CREATE POLICY "Subir archivos solo involucrados"
  ON public.archivos_proyecto FOR INSERT
  WITH CHECK (
    auth.uid() = subidor_id
    AND EXISTS (
      SELECT 1 FROM public.proyectos p
      WHERE p.id = archivos_proyecto.proyecto_id
        AND (p.comprador_id = auth.uid() OR p.productor_id = auth.uid())
    )
  );

CREATE POLICY "Eliminar archivos propios"
  ON public.archivos_proyecto FOR DELETE
  USING (auth.uid() = subidor_id);

-- =====================================================
-- 3. NOTIFICACIONES (RLS sin políticas → bloqueado)
-- =====================================================
-- INSERT se mantiene cerrado al cliente (solo service_role
-- desde server-side puede crear notificaciones).

CREATE POLICY "Lectura notificaciones propias"
  ON public.notificaciones FOR SELECT
  USING (auth.uid() = usuario_id);

CREATE POLICY "Marcar notificaciones propias como leídas"
  ON public.notificaciones FOR UPDATE
  USING (auth.uid() = usuario_id)
  WITH CHECK (auth.uid() = usuario_id);

CREATE POLICY "Eliminar notificaciones propias"
  ON public.notificaciones FOR DELETE
  USING (auth.uid() = usuario_id);

-- =====================================================
-- 4. LIMPIEZA DE POLÍTICAS DUPLICADAS
-- =====================================================

-- 4.1 cupones — duplicada de admin
DROP POLICY IF EXISTS "Admin gestiona todos los cupones" ON public.cupones;
-- Se mantiene "Admins tienen acceso total a cupones" (más explícita)

-- 4.2 cupones — la SELECT muy permisiva mostraba cupones inactivos
DROP POLICY IF EXISTS "Cupones visibles para todos" ON public.cupones;
-- Se mantiene "Everyone can view active cupones" (filtra es_activo = true)

-- 4.3 comentarios — DELETE duplicada
DROP POLICY IF EXISTS "Permitir borrar sus propios comentarios" ON public.comentarios;
-- Se mantiene "Autor o dueño puede eliminar su comentario"
-- (cubre tanto usuario_id como perfil_id)

-- 4.4 comentarios — INSERT duplicada idéntica
DROP POLICY IF EXISTS "Permitir creación a usuarios autenticados" ON public.comentarios;
-- Se mantiene "Usuarios autenticados pueden publicar comentarios"

-- =====================================================
-- 5. ÍNDICES PARA RENDIMIENTO
-- =====================================================

-- Beats por productor (perfil de productor, dashboard)
CREATE INDEX IF NOT EXISTS idx_beats_productor_id
  ON public.beats(productor_id);

-- Catálogo público (filtra es_publico Y es_visible)
CREATE INDEX IF NOT EXISTS idx_beats_publicos
  ON public.beats(es_publico, es_visible)
  WHERE es_publico = true AND es_visible = true;

-- Comentarios por beat (sección de comentarios)
CREATE INDEX IF NOT EXISTS idx_comentarios_beat_id
  ON public.comentarios(beat_id);

-- Notificaciones no leídas (badge en navbar)
CREATE INDEX IF NOT EXISTS idx_notificaciones_usuario_no_leidas
  ON public.notificaciones(usuario_id, esta_leida)
  WHERE esta_leida = false;

-- Seguidores de un perfil (conteo de followers)
CREATE INDEX IF NOT EXISTS idx_seguidores_seguido_id
  ON public.seguidores(seguido_id);

-- Compras del usuario (página de compras)
CREATE INDEX IF NOT EXISTS idx_transacciones_comprador_estado
  ON public.transacciones(comprador_id, estado_pago);

-- Favoritos del usuario (página de favoritos)
CREATE INDEX IF NOT EXISTS idx_favoritos_usuario_id
  ON public.favoritos(usuario_id);

-- Archivos y mensajes por proyecto
CREATE INDEX IF NOT EXISTS idx_archivos_proyecto_proyecto_id
  ON public.archivos_proyecto(proyecto_id);

CREATE INDEX IF NOT EXISTS idx_mensajes_proyecto_proyecto_id
  ON public.mensajes_proyecto(proyecto_id);

-- Listas públicas
CREATE INDEX IF NOT EXISTS idx_listas_publicas
  ON public.listas_reproduccion(usuario_id)
  WHERE es_publica = true AND es_privada = false;

-- Likes a comentarios por usuario (para "mis likes")
-- Ya existe idx_likes_comentarios_usuario, OK.

COMMIT;

-- =====================================================
-- FIN
-- =====================================================
