/**
 * TIANGUIS BEATS - Tipos Globales
 * v2.0 - 2026-02-24 (Reset Absoluto en Español)
 * Centralización de interfaces para mantener consistencia entre DB y Frontend.
 */

export type UserRole = 'comprador' | 'productor' | 'artista' | 'admin';

export type SubscriptionTier = 'free' | 'pro' | 'premium';

export type JsonValue =
    | string
    | number
    | boolean
    | null
    | { [key: string]: JsonValue | undefined }
    | JsonValue[];

export interface TransaccionMetadatos {
    [key: string]: JsonValue | undefined;
    checkout_session_id?: string;
    stripe_session_id?: string;
    stripe_receipt_url?: string;
    contract_pdf_url?: string;
    contractPdfUrl?: string;
    contract_url?: string;
    recibo_url?: string;
    expiry_date?: string;
    tipo_licencia?: string;
    licenseType?: string;
    license?: string;
    tier?: string;
    cycle?: string;
    productId?: string;
    product_id?: string;
    productor_id?: string;
    producer_id?: string;
    producerId?: string;
    seller_id?: string;
    product_name?: string;
    producer_name?: string;
    nombre_productor?: string;
    portada_url?: string;
    url_portada?: string;
    image?: string;
    cover?: string;
    archivo_muestra_url?: string;
    preview_url?: string;
    previewUrl?: string;
    url_audio?: string;
    archivo_mp3_url?: string;
    mp3_url?: string;
    archivo_wav_url?: string;
    wav_url?: string;
    archivo_stems_url?: string;
    stems_url?: string;
    completion_percent?: number;
    ip_compra?: string;
    audit_log?: string;
}

/**
 * Tabla `perfiles`
 */
export interface Profile {
    id: string;
    nombre_usuario: string;
    nombre_artistico: string | null;
    nombre_completo?: string | null;
    foto_perfil?: string | null;
    portada_perfil?: string | null;
    ajuste_portada?: number;
    biografia?: string | null;
    pais?: string;
    idioma_preferido?: string;
    colaboraciones_abiertas?: boolean;
    enlaces_sociales?: {
        instagram?: string;
        youtube?: string;
        twitter?: string;
        tiktok?: string;
        spotify?: string;
        applemusic?: string;
        tidal?: string;
        amazon?: string;
    };
    fecha_nacimiento?: string | null;
    nivel_suscripcion?: SubscriptionTier;
    es_fundador?: boolean;
    esta_verificado?: boolean;
    es_admin?: boolean;
    estado_verificacion?: string;
    cambios_nombre_usuario?: number;
    correo?: string;

    // UI
    esta_completado?: boolean;
    tema_perfil?: string;
    color_acento?: string;
    video_destacado_url?: string;
    texto_cta?: string;
    url_cta?: string;

    // Ajustes
    boletin_activo?: boolean;
    enlaces_activos?: boolean;

    // Verificaciones
    verificacion_instagram?: string | null;
    verificacion_youtube?: string | null;
    verificacion_tiktok?: string | null;

    // Stripe
    stripe_cliente_id?: string;
    stripe_suscripcion_id?: string | null;
    fecha_inicio_suscripcion?: string | null;
    fecha_termino_suscripcion?: string | null;

    visitas_totales?: number;

    fecha_creacion: string;
    fecha_actualizacion?: string;
    fecha_ultima_sesion?: string;
}

/**
 * Tabla `beats`
 */
export interface Beat {
    id: string;
    productor_id: string;
    // Agregados a través de la vista o joins (antes producer)
    productor_nombre_artistico?: string | null;
    productor_nombre_usuario?: string | null;
    productor_foto_perfil?: string | null;
    productor_esta_verificado?: boolean;
    productor_es_fundador?: boolean;
    productor_nivel_suscripcion?: string | null;

    titulo: string;
    genero?: string | null;
    subgenero?: string | null;
    bpm?: number | null;
    tono_escala?: string | null;
    descripcion?: string | null;
    vibras?: string | null;
    moods?: string[];
    instrumentos?: string[];
    tipos_beat?: string[];
    artista_referencia?: string | null;

    // Precios
    precio_gratis_mxn?: number;
    precio_basica_mxn?: number | null;
    precio_pro_mxn?: number | null;
    precio_premium_mxn?: number | null;
    precio_exclusiva_estandar_mxn?: number | null;
    precio_exclusiva_premium_mxn?: number | null;

    es_publico?: boolean;
    esta_vendido?: boolean;

    // Archivos
    portada_url?: string | null;
    archivo_mp3_url?: string;
    archivo_muestra_url?: string | null;
    archivo_wav_url?: string | null;
    archivo_stems_url?: string | null;

    // Estadísticas
    conteo_reproducciones?: number;
    conteo_ventas?: number;
    conteo_likes?: number;
    visibilidad_tier?: number;

    // Interruptores
    es_gratis_activa?: boolean;
    es_basica_activa?: boolean;
    es_mp3_activa?: boolean;
    es_pro_activa?: boolean;
    es_premium_activa?: boolean;
    es_exclusiva_estandar_activa?: boolean;
    es_exclusiva_premium_activa?: boolean;

    fecha_creacion: string;
}

/**
 * Tabla `servicios`
 */
export interface Servicio {
    id: string;
    productor_id: string;
    titulo: string;
    descripcion?: string;
    precio: number;
    tipo_servicio?: string;
    tiempo_entrega_dias?: number;
    es_activo?: boolean;
    fecha_creacion: string;
}

/**
 * Tabla `kits_sonido`
 */
export interface KitSonido {
    id: string;
    productor_id: string;
    titulo: string;
    descripcion?: string;
    precio: number;
    precio_mxn?: number | null;
    url_archivo: string;
    url_portada?: string;
    archivo_muestra_url?: string;
    es_publico?: boolean;
    fecha_creacion: string;
}

/**
 * Tabla `transacciones`
 */
export interface Transaccion {
    id: string;
    id_pago_stripe?: string;
    comprador_id: string;
    vendedor_id?: string;
    producto_id: string;
    tipo_producto: 'beat' | 'kit_sonido' | 'servicio' | 'suscripcion_app';
    nombre_producto: string;
    precio_total: number;
    moneda: string;
    estado_pago: string;
    metodo_pago: string;
    tipo_licencia?: string;
    metadatos?: TransaccionMetadatos | null;
    cupon_id?: string;
    codigo_cupon?: string;
    monto_descuento?: number;
    orden_pedido?: string;
    url_recibo?: string;
    contract_url?: string;
    fecha_creacion: string;
    producto_uuid?: string;
}
