-- =============================================================
-- HARDENING + RENDIMIENTO
-- Fecha: 2026-06-10
-- 1) search_path fijo en funciones (evita escalada vía SECURITY DEFINER)
-- 2) Índices en foreign keys sin índice (joins y cascadas)
-- 3) Políticas RLS con (SELECT auth.uid()) — se evalúa una vez por
--    query en lugar de una vez por fila (initplan)
-- =============================================================

-- ---------- 1. search_path en funciones ----------
ALTER FUNCTION public.actualizar_fecha_mutacion() SET search_path = public;
ALTER FUNCTION public.crear_perfil_nuevo_usuario() SET search_path = public;
ALTER FUNCTION public.fn_activar_membresia_desde_transaccion() SET search_path = public;
ALTER FUNCTION public.handle_coupon_upsert() SET search_path = public;
ALTER FUNCTION public.incrementar_balance_productor(uuid,numeric) SET search_path = public;
ALTER FUNCTION public.incrementar_conteo_descargas(uuid,text) SET search_path = public;
ALTER FUNCTION public.incrementar_conteo_ventas_beat() SET search_path = public;
ALTER FUNCTION public.incrementar_reproduccion(uuid) SET search_path = public;
ALTER FUNCTION public.incrementar_uso_cupon(uuid) SET search_path = public;
ALTER FUNCTION public.manejar_downgrade_produccion(uuid) SET search_path = public;
ALTER FUNCTION public.manejar_escalera_perfiles() SET search_path = public;
ALTER FUNCTION public.manejar_upgrade_produccion(uuid) SET search_path = public;
ALTER FUNCTION public.notificar_nueva_venta() SET search_path = public;
ALTER FUNCTION public.notificar_nuevo_comentario() SET search_path = public;
ALTER FUNCTION public.notificar_nuevo_seguidor() SET search_path = public;
ALTER FUNCTION public.sincronizar_conteo_likes() SET search_path = public;
ALTER FUNCTION public.soy_admin() SET search_path = public;
ALTER FUNCTION public.update_oferta_exclusiva_ts() SET search_path = public;

-- ---------- 2. Índices en FKs sin índice ----------
CREATE INDEX IF NOT EXISTS idx_kits_sonido_productor_id ON public.kits_sonido (productor_id);
CREATE INDEX IF NOT EXISTS idx_servicios_productor_id ON public.servicios (productor_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_productor_id ON public.proyectos (productor_id);
CREATE INDEX IF NOT EXISTS idx_proyectos_comprador_id ON public.proyectos (comprador_id);
CREATE INDEX IF NOT EXISTS idx_mensajes_proyecto_remitente_id ON public.mensajes_proyecto (remitente_id);
CREATE INDEX IF NOT EXISTS idx_archivos_proyecto_subidor_id ON public.archivos_proyecto (subidor_id);
CREATE INDEX IF NOT EXISTS idx_cupones_productor_id ON public.cupones (productor_id);
CREATE INDEX IF NOT EXISTS idx_favoritos_beat_id ON public.favoritos (beat_id);
CREATE INDEX IF NOT EXISTS idx_comentarios_usuario_id ON public.comentarios (usuario_id);
CREATE INDEX IF NOT EXISTS idx_solicitudes_verificacion_user_id ON public.solicitudes_verificacion (user_id);
CREATE INDEX IF NOT EXISTS idx_listas_reproduccion_items_beat_id ON public.listas_reproduccion_items (beat_id);
CREATE INDEX IF NOT EXISTS idx_quejas_y_sugerencias_usuario_id ON public.quejas_y_sugerencias (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usos_cupones_usuario_id ON public.usos_cupones (usuario_id);
CREATE INDEX IF NOT EXISTS idx_usos_cupones_cupon_id ON public.usos_cupones (cupon_id);
CREATE INDEX IF NOT EXISTS idx_analiticas_eventos_beat_id ON public.analiticas_eventos (beat_id);
CREATE INDEX IF NOT EXISTS idx_analiticas_eventos_usuario_id ON public.analiticas_eventos (usuario_id);

-- ---------- 3. Políticas RLS con initplan ----------
-- Generadas desde pg_policies: mismas condiciones, auth.uid()
-- envuelto en (SELECT auth.uid()).
DROP POLICY "Productores pueden ver sus propias analíticas" ON public.analiticas_eventos;
CREATE POLICY "Productores pueden ver sus propias analíticas" ON public.analiticas_eventos FOR SELECT TO public USING ((((SELECT auth.uid()) = productor_id) OR (EXISTS ( SELECT 1
   FROM perfiles
  WHERE ((perfiles.id = (SELECT auth.uid())) AND ((perfiles.es_admin = true) OR (perfiles.es_soporte = true)))))));

DROP POLICY "Archivos para involucrados del proyecto" ON public.archivos_proyecto;
CREATE POLICY "Archivos para involucrados del proyecto" ON public.archivos_proyecto FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM proyectos p
  WHERE ((p.id = archivos_proyecto.proyecto_id) AND ((p.comprador_id = (SELECT auth.uid())) OR (p.productor_id = (SELECT auth.uid())))))));

DROP POLICY "Eliminar archivos propios" ON public.archivos_proyecto;
CREATE POLICY "Eliminar archivos propios" ON public.archivos_proyecto FOR DELETE TO public USING (((SELECT auth.uid()) = subidor_id));

DROP POLICY "Subir archivos solo involucrados" ON public.archivos_proyecto;
CREATE POLICY "Subir archivos solo involucrados" ON public.archivos_proyecto FOR INSERT TO public WITH CHECK ((((SELECT auth.uid()) = subidor_id) AND (EXISTS ( SELECT 1
   FROM proyectos p
  WHERE ((p.id = archivos_proyecto.proyecto_id) AND ((p.comprador_id = (SELECT auth.uid())) OR (p.productor_id = (SELECT auth.uid()))))))));

DROP POLICY "Gestión beats propios" ON public.beats;
CREATE POLICY "Gestión beats propios" ON public.beats FOR ALL TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY "Usuarios pueden gestionar sus propios items del carrito" ON public.cart_items;
CREATE POLICY "Usuarios pueden gestionar sus propios items del carrito" ON public.cart_items FOR ALL TO public USING (((SELECT auth.uid()) = user_id)) WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY "Autor o dueño puede eliminar su comentario" ON public.comentarios;
CREATE POLICY "Autor o dueño puede eliminar su comentario" ON public.comentarios FOR DELETE TO public USING ((((SELECT auth.uid()) = usuario_id) OR ((SELECT auth.uid()) = perfil_id)));

DROP POLICY "Autor puede editar su comentario" ON public.comentarios;
CREATE POLICY "Autor puede editar su comentario" ON public.comentarios FOR UPDATE TO public USING (((SELECT auth.uid()) = usuario_id)) WITH CHECK (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Usuarios autenticados pueden publicar comentarios" ON public.comentarios;
CREATE POLICY "Usuarios autenticados pueden publicar comentarios" ON public.comentarios FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Admins tienen acceso total a cupones" ON public.cupones;
CREATE POLICY "Admins tienen acceso total a cupones" ON public.cupones FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM perfiles
  WHERE ((perfiles.id = (SELECT auth.uid())) AND ((perfiles.es_admin = true) OR (perfiles.es_soporte = true))))));

DROP POLICY "Productores gestionan sus propios cupones" ON public.cupones;
CREATE POLICY "Productores gestionan sus propios cupones" ON public.cupones FOR ALL TO public USING (((SELECT auth.uid()) = productor_id)) WITH CHECK (((SELECT auth.uid()) = productor_id));

DROP POLICY "Productores pueden actualizar sus propios cupones" ON public.cupones;
CREATE POLICY "Productores pueden actualizar sus propios cupones" ON public.cupones FOR UPDATE TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY "Productores pueden crear sus propios cupones" ON public.cupones;
CREATE POLICY "Productores pueden crear sus propios cupones" ON public.cupones FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = productor_id));

DROP POLICY "Productores pueden eliminar sus propios cupones" ON public.cupones;
CREATE POLICY "Productores pueden eliminar sus propios cupones" ON public.cupones FOR DELETE TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY "Gestión favoritos propios" ON public.favoritos;
CREATE POLICY "Gestión favoritos propios" ON public.favoritos FOR ALL TO public USING (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Gestión kits" ON public.kits_sonido;
CREATE POLICY "Gestión kits" ON public.kits_sonido FOR ALL TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY "Productores gestionan sus propias licencias" ON public.licencias;
CREATE POLICY "Productores gestionan sus propias licencias" ON public.licencias FOR ALL TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY "Usuario gestiona sus likes_comentarios" ON public.likes_comentarios;
CREATE POLICY "Usuario gestiona sus likes_comentarios" ON public.likes_comentarios FOR ALL TO public USING (((SELECT auth.uid()) = usuario_id)) WITH CHECK (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Control total listas propietario" ON public.listas_reproduccion;
CREATE POLICY "Control total listas propietario" ON public.listas_reproduccion FOR ALL TO authenticated USING (((SELECT auth.uid()) = usuario_id)) WITH CHECK (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Users can manage items of their own playlists" ON public.listas_reproduccion_items;
CREATE POLICY "Users can manage items of their own playlists" ON public.listas_reproduccion_items FOR ALL TO public USING ((EXISTS ( SELECT 1
   FROM listas_reproduccion pl
  WHERE ((pl.id = listas_reproduccion_items.playlist_id) AND (pl.usuario_id = (SELECT auth.uid()))))));

DROP POLICY "Users can view public playlist items" ON public.listas_reproduccion_items;
CREATE POLICY "Users can view public playlist items" ON public.listas_reproduccion_items FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM listas_reproduccion pl
  WHERE ((pl.id = listas_reproduccion_items.playlist_id) AND ((pl.es_publica = true) OR (pl.usuario_id = (SELECT auth.uid())))))));

DROP POLICY "Enviar mensajes solo involucrados" ON public.mensajes_proyecto;
CREATE POLICY "Enviar mensajes solo involucrados" ON public.mensajes_proyecto FOR INSERT TO public WITH CHECK ((((SELECT auth.uid()) = remitente_id) AND (EXISTS ( SELECT 1
   FROM proyectos p
  WHERE ((p.id = mensajes_proyecto.proyecto_id) AND ((p.comprador_id = (SELECT auth.uid())) OR (p.productor_id = (SELECT auth.uid()))))))));

DROP POLICY "Mensajes para involucrados del proyecto" ON public.mensajes_proyecto;
CREATE POLICY "Mensajes para involucrados del proyecto" ON public.mensajes_proyecto FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM proyectos p
  WHERE ((p.id = mensajes_proyecto.proyecto_id) AND ((p.comprador_id = (SELECT auth.uid())) OR (p.productor_id = (SELECT auth.uid())))))));

DROP POLICY "Eliminar notificaciones propias" ON public.notificaciones;
CREATE POLICY "Eliminar notificaciones propias" ON public.notificaciones FOR DELETE TO public USING (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Lectura notificaciones propias" ON public.notificaciones;
CREATE POLICY "Lectura notificaciones propias" ON public.notificaciones FOR SELECT TO public USING (((SELECT auth.uid()) = usuario_id));

DROP POLICY "Marcar notificaciones propias como leídas" ON public.notificaciones;
CREATE POLICY "Marcar notificaciones propias como leídas" ON public.notificaciones FOR UPDATE TO public USING (((SELECT auth.uid()) = usuario_id)) WITH CHECK (((SELECT auth.uid()) = usuario_id));

DROP POLICY oe_insert ON public.ofertas_exclusivas;
CREATE POLICY oe_insert ON public.ofertas_exclusivas FOR INSERT TO public WITH CHECK ((((SELECT auth.uid()) = comprador_id) AND ((SELECT auth.uid()) <> productor_id)));

DROP POLICY oe_select ON public.ofertas_exclusivas;
CREATE POLICY oe_select ON public.ofertas_exclusivas FOR SELECT TO public USING ((((SELECT auth.uid()) = productor_id) OR ((SELECT auth.uid()) = comprador_id)));

DROP POLICY oe_update ON public.ofertas_exclusivas;
CREATE POLICY oe_update ON public.ofertas_exclusivas FOR UPDATE TO public USING (((SELECT auth.uid()) = productor_id)) WITH CHECK (((SELECT auth.uid()) = productor_id));

DROP POLICY ov_delete ON public.ofertas_volumen;
CREATE POLICY ov_delete ON public.ofertas_volumen FOR DELETE TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY ov_insert ON public.ofertas_volumen;
CREATE POLICY ov_insert ON public.ofertas_volumen FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = productor_id));

DROP POLICY ov_select_activas ON public.ofertas_volumen;
CREATE POLICY ov_select_activas ON public.ofertas_volumen FOR SELECT TO public USING (((es_activa = true) OR ((SELECT auth.uid()) = productor_id)));

DROP POLICY ov_update ON public.ofertas_volumen;
CREATE POLICY ov_update ON public.ofertas_volumen FOR UPDATE TO public USING (((SELECT auth.uid()) = productor_id)) WITH CHECK (((SELECT auth.uid()) = productor_id));

DROP POLICY "Gestión de propio perfil" ON public.perfiles;
CREATE POLICY "Gestión de propio perfil" ON public.perfiles FOR ALL TO public USING (((SELECT auth.uid()) = id));

DROP POLICY "Proyectos para involucrados" ON public.proyectos;
CREATE POLICY "Proyectos para involucrados" ON public.proyectos FOR SELECT TO public USING ((((SELECT auth.uid()) = comprador_id) OR ((SELECT auth.uid()) = productor_id)));

DROP POLICY "Permitir actualización a administradores" ON public.quejas_y_sugerencias;
CREATE POLICY "Permitir actualización a administradores" ON public.quejas_y_sugerencias FOR UPDATE TO public USING ((EXISTS ( SELECT 1
   FROM perfiles
  WHERE ((perfiles.id = (SELECT auth.uid())) AND (perfiles.es_admin = true)))));

DROP POLICY "Permitir lectura a administradores" ON public.quejas_y_sugerencias;
CREATE POLICY "Permitir lectura a administradores" ON public.quejas_y_sugerencias FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM perfiles
  WHERE ((perfiles.id = (SELECT auth.uid())) AND (perfiles.es_admin = true)))));

DROP POLICY "Gestión seguidores propios" ON public.seguidores;
CREATE POLICY "Gestión seguidores propios" ON public.seguidores FOR ALL TO public USING (((SELECT auth.uid()) = seguidor_id));

DROP POLICY "Gestión servicios" ON public.servicios;
CREATE POLICY "Gestión servicios" ON public.servicios FOR ALL TO public USING (((SELECT auth.uid()) = productor_id));

DROP POLICY "Admins gestion completa" ON public.solicitudes_verificacion;
CREATE POLICY "Admins gestion completa" ON public.solicitudes_verificacion FOR ALL TO authenticated USING ((EXISTS ( SELECT 1
   FROM perfiles
  WHERE ((perfiles.id = (SELECT auth.uid())) AND (perfiles.es_admin = true)))));

DROP POLICY "Usuarios pueden crear propias" ON public.solicitudes_verificacion;
CREATE POLICY "Usuarios pueden crear propias" ON public.solicitudes_verificacion FOR INSERT TO public WITH CHECK (((SELECT auth.uid()) = user_id));

DROP POLICY "Usuarios pueden ver propias" ON public.solicitudes_verificacion;
CREATE POLICY "Usuarios pueden ver propias" ON public.solicitudes_verificacion FOR SELECT TO public USING (((SELECT auth.uid()) = user_id));

DROP POLICY "Lectura propia comprador" ON public.transacciones;
CREATE POLICY "Lectura propia comprador" ON public.transacciones FOR SELECT TO public USING (((SELECT auth.uid()) = comprador_id));

DROP POLICY "Lectura propia vendedor" ON public.transacciones;
CREATE POLICY "Lectura propia vendedor" ON public.transacciones FOR SELECT TO public USING (((SELECT auth.uid()) = vendedor_id));

DROP POLICY "Productores ven usos de sus cupones" ON public.usos_cupones;
CREATE POLICY "Productores ven usos de sus cupones" ON public.usos_cupones FOR SELECT TO public USING ((EXISTS ( SELECT 1
   FROM cupones
  WHERE ((cupones.id = usos_cupones.cupon_id) AND ((cupones.productor_id = (SELECT auth.uid())) OR ( SELECT perfiles.es_admin
           FROM perfiles
          WHERE (perfiles.id = (SELECT auth.uid()))))))));


-- (añadida después: esta política se creó el mismo día con la migración
-- de negociación y no entró en la generación inicial)
DROP POLICY oe_update_comprador ON public.ofertas_exclusivas;
CREATE POLICY oe_update_comprador ON public.ofertas_exclusivas FOR UPDATE TO public
USING (((SELECT auth.uid()) = comprador_id))
WITH CHECK ((((SELECT auth.uid()) = comprador_id) AND (estado = ANY (ARRAY['pendiente'::text, 'rechazada'::text]))));
