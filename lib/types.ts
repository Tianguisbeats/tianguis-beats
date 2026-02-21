/**
 * TIANGUIS BEATS - Tipos Globales
 * v1.0 - 2026-01-28
 * Centralización de interfaces para mantener consistencia entre DB y Frontend.
 */

/** Tipos de roles de usuario disponibles en la plataforma. */
export type UserRole = 'buyer' | 'producer' | 'artist' | 'admin';

/** Niveles de suscripción (Tiers) disponibles. */
export type SubscriptionTier = 'free' | 'pro' | 'premium';

/**
 * Interfaz principal para el Perfil de Usuario.
 * Representa la tabla `profiles` en la base de datos de Supabase.
 */
export interface Profile {
    id: string;
    username: string;
    artistic_name: string | null;
    full_name?: string | null;
    foto_perfil?: string | null;
    portada_perfil?: string | null;
    ajuste_portada?: number;
    bio?: string | null;
    country?: string;
    open_collaborations?: boolean;
    social_links?: {
        instagram?: string;
        youtube?: string;
        twitter?: string;
        tiktok?: string;
        spotify?: string;
        applemusic?: string;
        tidal?: string;
        amazon?: string;
    };
    birth_date?: string | null;
    subscription_tier?: SubscriptionTier;
    is_founder?: boolean;
    is_verified?: boolean;
    username_changes?: number;
    email?: string;
    fecha_de_creacion: string;
    ultima_actualizacion?: string;
    ultima_sesion?: string;
    perfil_completado?: boolean;
    tema_perfil?: string;
    color_acento?: string;
    video_destacado_url?: string;
    cta_text?: string;
    cta_url?: string;
    newsletter_active?: boolean;
    links_active?: boolean;
    verify_instagram?: string | null;
    verify_youtube?: string | null;
    verify_tiktok?: string | null;
    stripe_customer_id?: string;
    idioma_preferido?: string;
}

/**
 * Interfaz principal para la entidad Beat (Pista/Instrumental).
 * Representa la tabla `beats` en la base de datos e incluye propiedades 
 * de la interfaz de usuario que se agregan durante la obtención de datos.
 */
export interface Beat {
    /** Identificador único del beat */
    id: string;
    producer_id?: string;
    producer?: {
        artistic_name: string;
        username?: string;
        foto_perfil?: string;
        is_verified?: boolean;
        is_founder?: boolean;
    } | string;
    title: string;
    genre?: string | null;
    subgenre?: string | null;
    bpm?: number | null;
    musical_key?: string | null;
    musical_scale?: string | null;
    description?: string | null;
    price_mxn?: number;
    price_wav_mxn?: number | null;
    price_stems_mxn?: number | null;
    is_public?: boolean;
    is_verified?: boolean;
    is_founder?: boolean;

    // Archivos
    portadabeat_url?: string | null;
    mp3_url?: string;
    mp3_tag_url?: string | null;
    wav_url?: string | null;
    stems_url?: string | null;

    mood?: string | null;

    // Stats
    play_count?: number;
    sale_count?: number;
    like_count?: number;
    comment_count?: number;

    is_exclusive?: boolean;
    exclusive_price_mxn?: number | null;
    tier_visibility?: number;

    // UI-Specific flat properties (used by BeatCard)
    producer_foto_perfil?: string | null;
    producer_tier?: string | null;
    producer_is_verified?: boolean;
    producer_is_founder?: boolean;
    producer_username?: string | null;
    producer_artistic_name?: string | null;
    tag?: string | null;
    tagEmoji?: string | null;
    tagColor?: string;
    coverColor?: string;

    is_sound_kit?: boolean;
    is_mp3_active?: boolean;
    is_wav_active?: boolean;
    is_stems_active?: boolean;
    is_exclusive_active?: boolean;
    is_sold?: boolean;
    created_at: string;
}
