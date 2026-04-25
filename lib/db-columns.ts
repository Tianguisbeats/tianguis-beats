/**
 * TIANGUIS BEATS — Listas de Columnas para Queries Públicas
 *
 * Centraliza qué columnas son seguras de exponer al cliente.
 * NUNCA incluir aquí: correo, stripe_*, es_admin, archivo_mp3_url,
 * archivo_wav_url, archivo_stems_url, fecha_ultima_sesion, etc.
 *
 * Si necesitas un campo sensible, créalo en una API server-side
 * con service-role key y validación de permisos.
 */

/**
 * Columnas seguras de un perfil para vistas públicas (/[username]).
 * Excluye: correo, stripe_*, es_admin, cambios_nombre_usuario,
 * fecha_ultima_sesion, fecha_inicio_suscripcion, fecha_termino_suscripcion,
 * estado_verificacion (interno de admin).
 */
export const COLUMNAS_PERFIL_PUBLICO = `
    id, nombre_usuario, nombre_artistico, foto_perfil, portada_perfil,
    ajuste_portada, biografia, pais, idioma_preferido,
    colaboraciones_abiertas, enlaces_sociales, fecha_nacimiento,
    nivel_suscripcion, es_fundador, esta_verificado,
    video_destacado_url, texto_cta, url_cta, tema_perfil, color_acento,
    boletin_activo, enlaces_activos,
    verificacion_instagram, verificacion_youtube, verificacion_tiktok,
    visitas_totales, fecha_creacion
`.replace(/\s+/g, ' ').trim();

/**
 * Columnas mínimas de un perfil para uso como autor/productor en joins.
 */
export const COLUMNAS_PERFIL_MINIMO = `
    id, nombre_usuario, nombre_artistico, foto_perfil,
    esta_verificado, es_fundador, nivel_suscripcion
`.replace(/\s+/g, ' ').trim();

/**
 * Columnas seguras de un beat para vistas públicas.
 * EXCLUYE: archivo_mp3_url, archivo_wav_url, archivo_stems_url
 * (esos solo deben servirse vía /api/download tras validar compra).
 */
export const COLUMNAS_BEAT_PUBLICO = `
    id, productor_id, titulo, genero, subgenero, bpm, tono_escala,
    descripcion, instrumentos, tipos_beat, artista_referencia,
    precio_gratis_mxn, precio_basica_mxn, precio_pro_mxn, precio_premium_mxn,
    precio_exclusiva_estandar_mxn, precio_exclusiva_premium_mxn,
    es_publico, esta_vendido,
    portada_url, archivo_muestra_url,
    conteo_reproducciones, conteo_ventas, conteo_likes,
    es_gratis_activa, es_basica_activa, es_pro_activa,
    es_premium_activa, es_exclusiva_estandar_activa, es_exclusiva_premium_activa,
    fecha_creacion
`.replace(/\s+/g, ' ').trim();

/**
 * Columnas seguras de un kit de sonido para vistas públicas.
 * EXCLUYE: url_archivo (solo vía /api/download).
 */
export const COLUMNAS_KIT_PUBLICO = `
    id, productor_id, titulo, descripcion, precio,
    url_portada, archivo_muestra_url,
    es_publico, fecha_creacion
`.replace(/\s+/g, ' ').trim();

/**
 * Columnas seguras de un servicio para vistas públicas.
 */
export const COLUMNAS_SERVICIO_PUBLICO = `
    id, productor_id, titulo, descripcion, precio,
    tipo_servicio, tiempo_entrega_dias, es_activo, fecha_creacion
`.replace(/\s+/g, ' ').trim();
