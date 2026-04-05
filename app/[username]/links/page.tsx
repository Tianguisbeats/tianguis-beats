"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Instagram, Youtube, Twitter, Globe, Music,
    Play, ShieldCheck, Mail, MapPin,
    ExternalLink, Zap, Crown, ArrowUpRight, Music2,
    Headphones, Mic2, Package, Clock, ChevronRight,
    Star, Users, BarChart2, Disc, Layers, Sparkles,
    X
} from 'lucide-react';
import Link from 'next/link';
import { Profile } from '@/lib/types';

/* ═══════════════════════════════════════════════════════════
   PLATAFORMAS
════════════════════════════════════════════════════════════ */

const SOCIAL_META: Record<string, { label: string; hex: string; gradient: string; icon?: any; svgPath?: string }> = {
    spotify: {
        label: 'Spotify', hex: '#1DB954', gradient: 'from-[#1DB954] to-[#158940]',
        svgPath: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8m3.93 11c-.3.06-.62 0-.85-.14-2.34-1.42-5.3-1.74-8.77-1.74-.29 0-.58.07-.82.2a.57.57 0 0 1-.78-.23c-.16-.28-.06-.63.22-.79 3.86.06 7.18.42 9.9 2a1 1 0 0 1 .4.15c.29.17.38.54.21.83-.11.19-.3.29-.51.29zM12 9.04c-3.15 0-5.83.33-8.08 1.05-.38.12-.58.53-.46.9.11.33.45.52.8.52.1 0 .21-.03.31-.06 2.02-.65 4.49-.95 7.43-.95 2.81 0 5.2.28 7.15.86.1.03.2.05.3.05.28 0 .55-.13.7-.37.21-.34.11-.78-.23-.99-2.22-.69-5.11-1.01-7.92-1.01zm-7.6 2.87c2.68-.8 6.09-1.12 9.06-1.12 2.62 0 5.64.26 8.27 1.05.47.14.73.65.59 1.12-.13.43-.53.7-1.02.7-.1 0-.21-.02-.3-.05-2.29-.68-4.99-.91-7.54-.91-2.6 0-5.63.29-8.04 1.01-.1.03-.2.04-.3.04-.4 0-.8-.25-.94-.64-.2-.47.05-1 .52-1.2z"
    },
    applemusic: { label: 'Apple Music', hex: '#fc3c44', gradient: 'from-[#fc3c44] to-[#c5202a]', icon: Music },
    youtube: { label: 'YouTube', hex: '#FF0000', gradient: 'from-[#FF0000] to-[#b00000]', icon: Youtube },
    tidal: {
        label: 'Tidal', hex: '#00FFFF', gradient: 'from-[#00b4ff] to-[#0040ff]',
        svgPath: "M12.01 2.24L9.77 4.48l2.24 2.24 2.24-2.24-2.24-2.24zM5.29 6.72L3.05 8.96l2.24 2.24 2.24-2.24-2.24-2.24zM12.01 11.2l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24zM18.73 6.72l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24z"
    },
    instagram: { label: 'Instagram', hex: '#E1306C', gradient: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]', icon: Instagram },
    tiktok: {
        label: 'TikTok', hex: '#ff0050', gradient: 'from-[#010101] to-[#69C9D0]',
        svgPath: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77-1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
    },
    twitter: {
        label: 'X / Twitter', hex: '#000000', gradient: 'from-[#111] to-[#333]',
        svgPath: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.213 5.567zm-1.161 17.52h1.833L7.084 4.126H5.117z"
    },
    web: { label: 'Sitio Web', hex: '#6366f1', gradient: 'from-[#6366f1] to-[#4f46e5]', icon: Globe },
};

const MUSIC_PLATFORMS = ['spotify', 'applemusic', 'tidal', 'youtube'];
const SOCIAL_PLATFORMS = ['instagram', 'tiktok', 'twitter', 'web'];

/* ═══════════════════════════════════════════════════════════
   HELPERS
════════════════════════════════════════════════════════════ */

function formatNum(n?: number | null) {
    if (!n) return '0';
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return String(n);
}

function formatPriceMXN(v?: number | null) {
    if (v === null || v === undefined) return '—';
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v);
}

/* ═══════════════════════════════════════════════════════════
   COMPONENTES PEQUEÑOS
════════════════════════════════════════════════════════════ */

function PlatformIcon({ meta }: { meta: typeof SOCIAL_META[string] }) {
    if (meta.icon) return <meta.icon size={18} className="text-white" />;
    if (meta.svgPath) return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
            <path d={meta.svgPath} />
        </svg>
    );
    return null;
}

function SectionDivider({ icon: Icon, label }: { icon: any; label: string }) {
    return (
        <div className="flex items-center gap-3 mb-4">
            <Icon size={11} className="shrink-0" style={{ color: 'rgba(255,255,255,0.3)' }} />
            <span className="text-[8px] font-black uppercase tracking-[0.4em]" style={{ color: 'rgba(255,255,255,0.3)' }}>
                {label}
            </span>
            <div className="h-px flex-1" style={{ background: 'rgba(255,255,255,0.07)' }} />
        </div>
    );
}

/* ═══════════════════════════════════════════════════════════
   PAGE
════════════════════════════════════════════════════════════ */

export default function ProducerLinksPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [beats, setBeats] = useState<any[]>([]);
    const [kits, setKits] = useState<any[]>([]);
    const [services, setServices] = useState<any[]>([]);
    const [followersCount, setFollowersCount] = useState(0);
    const [totalPlays, setTotalPlays] = useState(0);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);
    const [emailInput, setEmailInput] = useState('');

    useEffect(() => {
        const load = async () => {
            const { data: profileData } = await supabase
                .from('perfiles')
                .select('*')
                .eq('nombre_usuario', username)
                .single();

            if (!profileData) { setLoading(false); return; }
            setProfile(profileData);

            // Fetch everything in parallel
            const [beatsR, kitsR, serviciosR, followsR, { data: { user } }] = await Promise.all([
                supabase
                    .from('beats')
                    .select('id, titulo, portada_url, genero, bpm, precio_basica_mxn, conteo_reproducciones')
                    .eq('productor_id', profileData.id)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false })
                    .limit(6),
                supabase
                    .from('kits_sonido')
                    .select('id, titulo, url_portada, precio')
                    .eq('productor_id', profileData.id)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false })
                    .limit(4),
                supabase
                    .from('servicios')
                    .select('id, titulo, descripcion, precio, tipo_servicio, tiempo_entrega_dias')
                    .eq('productor_id', profileData.id)
                    .eq('es_activo', true)
                    .order('fecha_creacion', { ascending: false })
                    .limit(4),
                supabase
                    .from('seguidores')
                    .select('*', { count: 'exact', head: true })
                    .eq('seguido_id', profileData.id),
                supabase.auth.getUser(),
            ]);

            setBeats(beatsR.data || []);
            setKits(kitsR.data || []);
            setServices(serviciosR.data || []);
            setFollowersCount(followsR.count || 0);

            const plays = (beatsR.data || []).reduce((acc: number, b: any) => acc + (b.conteo_reproducciones || 0), 0);
            setTotalPlays(plays);

            if (user && user.id === profileData.id) setIsOwner(true);

            setLoading(false);
        };
        load();
    }, [username]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-[#050508]">
                <div className="relative w-12 h-12">
                    <div className="absolute inset-0 border-4 border-white/10 rounded-full" />
                    <div className="absolute inset-0 border-4 border-white border-t-transparent rounded-full animate-spin" />
                </div>
            </div>
        );
    }

    if (!profile) return (
        <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center text-white p-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-4 opacity-30">Perfil no encontrado</h1>
            <Link href="/" className="text-xs font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">← Inicio</Link>
        </div>
    );

    if (!profile.enlaces_activos && !isOwner) return (
        <div className="min-h-screen bg-[#050508] flex flex-col items-center justify-center text-white p-6">
            <h1 className="text-3xl font-black uppercase tracking-tighter mb-3 opacity-20">Sin Acceso</h1>
            <p className="text-[10px] font-bold uppercase tracking-widest opacity-30 mb-8">Smart Link no habilitado</p>
            <Link href={`/${username}`} className="text-[10px] font-black uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity">Ver Perfil →</Link>
        </div>
    );

    const acc = profile.color_acento || '#2563eb';
    const socialLinks = (profile.enlaces_sociales || {}) as Record<string, string>;
    const musicLinks = MUSIC_PLATFORMS.filter(k => socialLinks[k]).map(k => ({ key: k, url: socialLinks[k], meta: SOCIAL_META[k] }));
    const socialArr = SOCIAL_PLATFORMS.filter(k => socialLinks[k]).map(k => ({ key: k, url: socialLinks[k], meta: SOCIAL_META[k] }));

    return (
        <div className="min-h-screen bg-[#050508] text-white font-sans overflow-x-hidden selection:bg-white/20">

            {/* ── AMBIENT GLOWS ── */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[120%] h-[50vh] blur-[120px] opacity-[0.12] rounded-full"
                    style={{ background: `radial-gradient(ellipse, ${acc}, transparent 70%)` }} />
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[80%] h-[30vh] blur-[100px] opacity-[0.07] rounded-full"
                    style={{ backgroundColor: acc }} />
            </div>

            {/* ── OWNER BAR ── */}
            {isOwner && (
                <div className="sticky top-0 z-50 flex items-center justify-center gap-3 py-2.5 px-4"
                    style={{ background: 'rgba(5,5,8,0.85)', backdropFilter: 'blur(12px)', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
                    {!profile.enlaces_activos && (
                        <span className="text-amber-400 text-[8px] font-black uppercase tracking-widest">
                            Vista previa · Oculto al público
                        </span>
                    )}
                    <Link href="/studio/premium"
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest transition-all"
                        style={{ background: `${acc}20`, color: acc, border: `1px solid ${acc}40` }}>
                        <Zap size={10} /> Personalizar
                    </Link>
                    <Link href={`/${username}`}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10 hover:text-white/70 transition-colors">
                        Ver Perfil
                    </Link>
                </div>
            )}

            <div className="max-w-[420px] mx-auto px-4 pt-10 pb-20">

                {/* ════════════════════════════════
                    1. PROFILE HERO
                ════════════════════════════════ */}
                <div className="relative mb-6">
                    {/* Banner */}
                    {profile.portada_perfil ? (
                        <div className="w-full h-28 rounded-[2rem] overflow-hidden mb-0 relative">
                            <img src={profile.portada_perfil} className="w-full h-full object-cover" alt="banner" />
                            <div className="absolute inset-0" style={{ background: 'linear-gradient(to bottom, transparent 40%, #050508 100%)' }} />
                        </div>
                    ) : (
                        <div className="w-full h-20 rounded-[2rem] overflow-hidden mb-0"
                            style={{ background: `linear-gradient(135deg, ${acc}30, ${acc}08, transparent)`, border: `1px solid ${acc}15` }} />
                    )}

                    {/* Avatar */}
                    <div className="flex flex-col items-center -mt-10 relative z-10">
                        <div className="relative mb-4">
                            <div className="absolute inset-0 rounded-[2rem] blur-2xl scale-75 opacity-50"
                                style={{ backgroundColor: acc }} />
                            <div className="relative w-24 h-24 rounded-[2rem] overflow-hidden border-2 shadow-2xl"
                                style={{ borderColor: `${acc}50`, boxShadow: `0 0 40px ${acc}30` }}>
                                {profile.foto_perfil ? (
                                    <img src={profile.foto_perfil} className="w-full h-full object-cover" alt={profile.nombre_artistico || ''} />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-3xl font-black"
                                        style={{ background: `${acc}20` }}>
                                        {(profile.nombre_artistico || username).charAt(0).toUpperCase()}
                                    </div>
                                )}
                            </div>
                            {profile.esta_verificado && (
                                <div className="absolute -bottom-1 -right-1 w-7 h-7 rounded-full flex items-center justify-center border-2 border-[#050508] shadow-xl"
                                    style={{ background: acc }}>
                                    <ShieldCheck size={13} className="text-white" />
                                </div>
                            )}
                        </div>

                        {/* Name */}
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-white text-center mb-1 flex items-center gap-2">
                            {profile.nombre_artistico || username}
                            {profile.es_fundador && (
                                <Crown size={18} className="text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.7)] rotate-6" fill="currentColor" />
                            )}
                        </h1>
                        <p className="text-[10px] font-bold uppercase tracking-widest mb-3" style={{ color: acc }}>
                            @{username}
                        </p>

                        {/* Badges row */}
                        <div className="flex items-center justify-center gap-2 flex-wrap mb-4">
                            {/* Tier badge */}
                            {profile.nivel_suscripcion && profile.nivel_suscripcion !== 'free' && (
                                <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest"
                                    style={{ background: `${acc}20`, color: acc, border: `1px solid ${acc}30` }}>
                                    <Star size={9} fill="currentColor" />
                                    {profile.nivel_suscripcion === 'premium' ? 'Premium' : 'Pro'} Producer
                                </span>
                            )}
                            {profile.pais && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-white/40 border border-white/10">
                                    <MapPin size={9} /> {profile.pais}
                                </span>
                            )}
                            {profile.colaboraciones_abiertas && (
                                <span className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-emerald-400 border border-emerald-400/20 bg-emerald-400/10">
                                    <Mic2 size={9} /> Acepta Colabs
                                </span>
                            )}
                        </div>

                        {/* Bio */}
                        {profile.biografia && (
                            <p className="text-[12px] text-white/50 font-medium leading-relaxed text-center max-w-[280px] mb-4">
                                {profile.biografia}
                            </p>
                        )}

                        {/* Stats */}
                        <div className="flex items-center justify-center gap-0 w-full max-w-[280px]">
                            {[
                                { icon: Music2, label: 'Beats', value: formatNum(beats.length) },
                                { icon: Users, label: 'Seguidores', value: formatNum(followersCount) },
                                { icon: BarChart2, label: 'Plays', value: formatNum(totalPlays) },
                            ].map(({ icon: Icon, label, value }, i) => (
                                <div key={label} className="flex-1 flex flex-col items-center py-3 relative">
                                    {i > 0 && <div className="absolute left-0 top-1/2 -translate-y-1/2 h-6 w-px bg-white/10" />}
                                    <span className="text-lg font-black text-white leading-none">{value}</span>
                                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/30 mt-0.5">{label}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ════════════════════════════════
                    2. CTA PRINCIPAL — TIENDA DE BEATS
                ════════════════════════════════ */}
                <Link href={`/${username}`}
                    className="group relative w-full flex items-center gap-4 p-5 rounded-[1.75rem] mb-3 overflow-hidden transition-all active:scale-[0.97]"
                    style={{
                        background: `linear-gradient(135deg, ${acc}f0, ${acc}90)`,
                        boxShadow: `0 16px 48px ${acc}35`
                    }}>
                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-[1.75rem]"
                        style={{ background: 'rgba(255,255,255,0.08)' }} />
                    <div className="relative w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                        <Play size={20} fill="white" className="text-white ml-0.5" />
                    </div>
                    <div className="relative flex-1 min-w-0">
                        <span className="block text-white font-black text-base uppercase tracking-tight leading-none mb-0.5">
                            {profile.texto_cta || 'Tienda de Beats'}
                        </span>
                        <span className="block text-white/60 text-[9px] font-black uppercase tracking-widest">
                            Escucha · Descarga · Licencias
                        </span>
                    </div>
                    <ArrowUpRight size={18} className="relative text-white/60 group-hover:text-white group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                </Link>

                {/* Custom CTA adicional */}
                {profile.url_cta && profile.texto_cta && profile.url_cta !== `/${username}` && (
                    <a href={profile.url_cta} target="_blank" rel="noopener noreferrer"
                        className="group w-full flex items-center justify-center gap-3 py-4 rounded-[1.75rem] mb-3 text-[11px] font-black uppercase tracking-widest transition-all active:scale-[0.97]"
                        style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid ${acc}30`, color: acc }}>
                        <ExternalLink size={14} />
                        {profile.texto_cta}
                    </a>
                )}

                <div className="mt-8 space-y-8">

                    {/* ════════════════════════════════
                        3. BEATS DESTACADOS
                    ════════════════════════════════ */}
                    {beats.length > 0 && (
                        <section>
                            <SectionDivider icon={Music2} label="Mis Beats" />
                            <div className="space-y-2.5">
                                {beats.map((beat) => (
                                    <Link
                                        key={beat.id}
                                        href={`/beats/${beat.id}`}
                                        className="group flex items-center gap-3.5 p-3 rounded-[1.25rem] transition-all active:scale-[0.98]"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        {/* Artwork */}
                                        <div className="w-12 h-12 rounded-xl overflow-hidden shrink-0 relative"
                                            style={{ border: `1px solid ${acc}20` }}>
                                            {beat.portada_url ? (
                                                <img src={beat.portada_url} loading="lazy" className="w-full h-full object-cover" alt={beat.titulo} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ background: `${acc}15` }}>
                                                    <Music2 size={18} style={{ color: acc }} />
                                                </div>
                                            )}
                                            {/* Play overlay */}
                                            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                                                style={{ background: `${acc}cc` }}>
                                                <Play size={14} fill="white" className="text-white ml-0.5" />
                                            </div>
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-[12px] uppercase tracking-tight text-white truncate leading-tight">
                                                {beat.titulo}
                                            </p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                {beat.genero && (
                                                    <span className="text-[8px] font-bold uppercase tracking-widest text-white/30 truncate">
                                                        {beat.genero}
                                                    </span>
                                                )}
                                                {beat.bpm && (
                                                    <span className="text-[8px] font-bold text-white/20">· {beat.bpm} bpm</span>
                                                )}
                                            </div>
                                        </div>

                                        {/* Price */}
                                        <div className="flex items-center gap-2 shrink-0">
                                            <span className="text-[11px] font-black" style={{ color: acc }}>
                                                {formatPriceMXN(beat.precio_basica_mxn)}
                                            </span>
                                            <ChevronRight size={14} className="text-white/20 group-hover:text-white/50 transition-colors" />
                                        </div>
                                    </Link>
                                ))}
                            </div>

                            {beats.length >= 6 && (
                                <Link href={`/${username}`}
                                    className="mt-3 w-full flex items-center justify-center gap-2 py-3.5 rounded-[1.25rem] text-[9px] font-black uppercase tracking-widest transition-all"
                                    style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)', color: acc }}>
                                    Ver todos los beats <ArrowUpRight size={12} />
                                </Link>
                            )}
                        </section>
                    )}

                    {/* ════════════════════════════════
                        4. SOUND KITS
                    ════════════════════════════════ */}
                    {kits.length > 0 && (
                        <section>
                            <SectionDivider icon={Layers} label="Sound Kits" />
                            <div className="grid grid-cols-2 gap-2.5">
                                {kits.map((kit) => (
                                    <Link
                                        key={kit.id}
                                        href={`/sound-kits/${kit.id}`}
                                        className="group flex flex-col rounded-[1.25rem] overflow-hidden transition-all active:scale-[0.97]"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        {/* Cover */}
                                        <div className="w-full aspect-square relative overflow-hidden">
                                            {kit.url_portada ? (
                                                <img src={kit.url_portada} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" alt={kit.titulo} />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center" style={{ background: `${acc}15` }}>
                                                    <Package size={28} style={{ color: acc }} />
                                                </div>
                                            )}
                                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                                                style={{ background: `${acc}aa` }}>
                                                <ExternalLink size={20} className="text-white" />
                                            </div>
                                        </div>
                                        {/* Info */}
                                        <div className="p-3">
                                            <p className="font-black text-[10px] uppercase tracking-tight text-white truncate">{kit.titulo}</p>
                                            <p className="text-[9px] font-black mt-0.5" style={{ color: acc }}>
                                                {formatPriceMXN(kit.precio)}
                                            </p>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════
                        5. SERVICIOS
                    ════════════════════════════════ */}
                    {services.length > 0 && (
                        <section>
                            <SectionDivider icon={Mic2} label="Servicios" />
                            <div className="space-y-2.5">
                                {services.map((srv) => (
                                    <div
                                        key={srv.id}
                                        className="flex items-start gap-3.5 p-4 rounded-[1.25rem]"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                                    >
                                        {/* Icon */}
                                        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
                                            style={{ background: `${acc}20`, border: `1px solid ${acc}30` }}>
                                            <Mic2 size={16} style={{ color: acc }} />
                                        </div>
                                        {/* Info */}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-black text-[11px] uppercase tracking-tight text-white leading-tight">{srv.titulo}</p>
                                            {srv.descripcion && (
                                                <p className="text-[9px] text-white/40 mt-0.5 line-clamp-2 leading-relaxed">{srv.descripcion}</p>
                                            )}
                                            <div className="flex items-center gap-3 mt-1.5">
                                                {srv.tiempo_entrega_dias && (
                                                    <span className="flex items-center gap-1 text-[8px] font-bold text-white/30 uppercase tracking-widest">
                                                        <Clock size={8} /> {srv.tiempo_entrega_dias}d
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                        {/* Price */}
                                        <div className="shrink-0 text-right">
                                            <p className="font-black text-sm" style={{ color: acc }}>
                                                {formatPriceMXN(srv.precio)}
                                            </p>
                                            <Link href={`/${username}`}
                                                className="text-[8px] font-black uppercase tracking-widest text-white/25 hover:text-white/60 transition-colors">
                                                Contactar →
                                            </Link>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════
                        6. PLATAFORMAS MUSICALES
                    ════════════════════════════════ */}
                    {musicLinks.length > 0 && (
                        <section>
                            <SectionDivider icon={Headphones} label="Escúchame en" />
                            <div className="space-y-2.5">
                                {musicLinks.map(({ key, url, meta }) => (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                        className="group relative w-full flex items-center gap-4 p-4 rounded-[1.25rem] transition-all active:scale-[0.98] overflow-hidden"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        {/* Hover tint */}
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[1.25rem]"
                                            style={{ background: `${meta.hex}10` }} />
                                        {/* Platform icon */}
                                        <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <PlatformIcon meta={meta} />
                                        </div>
                                        <span className="relative flex-1 font-black text-[11px] uppercase tracking-widest text-white">{meta.label}</span>
                                        <ExternalLink size={13} className="relative text-white/20 group-hover:text-white/60 transition-colors" />
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════
                        7. REDES SOCIALES
                    ════════════════════════════════ */}
                    {socialArr.length > 0 && (
                        <section>
                            <SectionDivider icon={Sparkles} label="Sígueme en" />
                            <div className="grid grid-cols-2 gap-2.5">
                                {socialArr.map(({ key, url, meta }) => (
                                    <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                        className="group relative flex flex-col items-center justify-center gap-2.5 py-5 rounded-[1.25rem] transition-all active:scale-[0.97] overflow-hidden"
                                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}>
                                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-[1.25rem]"
                                            style={{ background: `${meta.hex}15` }} />
                                        <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                            <PlatformIcon meta={meta} />
                                        </div>
                                        <span className="relative font-black text-[9px] uppercase tracking-widest text-white/40 group-hover:text-white/80 transition-colors">
                                            {meta.label}
                                        </span>
                                    </a>
                                ))}
                            </div>
                        </section>
                    )}

                    {/* ════════════════════════════════
                        8. NEWSLETTER (Premium)
                    ════════════════════════════════ */}
                    {profile.nivel_suscripcion === 'premium' && profile.boletin_activo && (
                        <section>
                            <div className="relative rounded-[1.75rem] p-6 overflow-hidden"
                                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                                <div className="absolute top-0 right-0 w-48 h-48 blur-[80px] -mr-16 -mt-16 pointer-events-none opacity-30"
                                    style={{ backgroundColor: acc }} />
                                <div className="relative text-center">
                                    <div className="w-11 h-11 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-lg"
                                        style={{ background: `linear-gradient(135deg, ${acc}, ${acc}80)`, boxShadow: `0 8px 24px ${acc}40` }}>
                                        <Mail size={18} className="text-white" />
                                    </div>
                                    <h3 className="text-lg font-black uppercase tracking-tighter text-white mb-1">Inner Circle</h3>
                                    <p className="text-[9px] font-bold uppercase tracking-[0.2em] text-white/40 mb-5">
                                        Beats Exclusivos · Acceso Anticipado
                                    </p>
                                    <form className="space-y-2.5" onSubmit={(e) => e.preventDefault()}>
                                        <input
                                            type="email"
                                            placeholder="tu@correo.com"
                                            value={emailInput}
                                            onChange={e => setEmailInput(e.target.value)}
                                            required
                                            className="w-full h-12 rounded-xl px-4 text-[11px] font-bold text-center text-white placeholder-white/20 outline-none transition-all"
                                            style={{
                                                background: 'rgba(255,255,255,0.06)',
                                                border: '1px solid rgba(255,255,255,0.1)',
                                            }}
                                        />
                                        <button
                                            className="w-full h-12 rounded-xl font-black text-[10px] uppercase tracking-widest text-white transition-all active:scale-95"
                                            style={{ background: `linear-gradient(135deg, ${acc}, ${acc}80)`, boxShadow: `0 8px 24px ${acc}30` }}>
                                            Suscribirme <Zap size={11} className="inline-block ml-1" />
                                        </button>
                                    </form>
                                </div>
                            </div>
                        </section>
                    )}

                </div>

                {/* ════════════════════════════════
                    FOOTER
                ════════════════════════════════ */}
                <div className="text-center pt-12 pb-4">
                    <Link href="/" className="inline-flex flex-col items-center gap-2.5 group">
                        <div className="w-9 h-9 rounded-[0.875rem] flex items-center justify-center transition-all"
                            style={{ background: `${acc}15`, border: `1px solid ${acc}25` }}>
                            <span className="text-lg font-black" style={{ color: acc }}>T</span>
                        </div>
                        <div>
                            <p className="text-[8px] font-black uppercase tracking-[0.5em] text-white/20 group-hover:text-white/40 transition-colors">
                                Tianguis Beats
                            </p>
                            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-white/10">
                                Tu Ecosistema Musical
                            </p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
