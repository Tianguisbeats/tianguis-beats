/**
 * TIANGUIS BEATS - Tipos Globales
 * v1.0 - 2026-01-28
 * Centralización de interfaces para mantener consistencia entre DB y Frontend.
 */

export type UserRole = 'buyer' | 'producer' | 'artist' | 'admin';
export type SubscriptionTier = 'free' | 'pro' | 'premium';

export interface Profile {
    id: string;
    username: string;
    artistic_name: string | null;
    full_name: string | null;
    avatar_url: string | null;
    cover_url: string | null;
    bio: string | null;
    country: string | null;
    open_collaborations: boolean;
    social_links: {
        instagram?: string;
        youtube?: string;
        twitter?: string;
        tiktok?: string;
    };
    birth_date: string | null;
    role: UserRole;
    subscription_tier: SubscriptionTier;
    is_admin: boolean;
    is_founder: boolean;
    is_verified: boolean;
    username_changes: number;
    email: string;
    created_at: string;
    updated_at: string;
}

export interface Beat {
    id: string;
    producer_id: string;
    producer?: {
        artistic_name: string;
    } | string;
    title: string;
    genre: string | null;
    bpm: number | null;
    musical_key: string | null;
    musical_scale: string | null;
    description: string | null;
    price_mxn: number;
    is_public: boolean;

    // Archivos
    cover_url: string | null;
    mp3_tag_url: string | null;
    mp3_url: string;
    wav_url: string | null;
    stems_url: string | null;

    // Estética
    tag: string | null;
    tag_emoji: string | null;
    tag_color: string | null;
    cover_color: string | null;

    mood: string | null;
    reference_artist: string | null;

    // Stats
    play_count: number;
    sale_count: number;
    like_count: number;

    is_exclusive: boolean;
    tier_visibility: number;

    created_at: string;
}

export interface Comment {
    id: string;
    beat_id: string;
    user_id: string;
    content: string;
    created_at: string;
    profile?: {
        username: string;
        artistic_name: string;
    };
}

export interface Like {
    id: string;
    beat_id: string;
    user_id: string;
    created_at: string;
}

export interface Listen {
    id: string;
    beat_id: string;
    user_id: string | null;
    created_at: string;
}
