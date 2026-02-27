"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Instagram, Youtube, Twitter, Globe, Music,
    Play, ShieldCheck, Mail, MapPin,
    ExternalLink, Zap, Crown, ArrowUpRight, Music2, Headphones
} from 'lucide-react';
import Link from 'next/link';
import { Profile } from '@/lib/types';

const SOCIAL_META: Record<string, { label: string; hex: string; gradient: string; icon?: any; svgPath?: string }> = {
    spotify: {
        label: 'Spotify', hex: '#1DB954', gradient: 'from-[#1DB954] to-[#158940]',
        svgPath: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8m3.93 11c-.3.06-.62 0-.85-.14-2.34-1.42-5.3-1.74-8.77-1.74-.29 0-.58.07-.82.2a.57.57 0 0 1-.78-.23c-.16-.28-.06-.63.22-.79 3.86.06 7.18.42 9.9 2a1 1 0 0 1 .4.15c.29.17.38.54.21.83-.11.19-.3.29-.51.29zM12 9.04c-3.15 0-5.83.33-8.08 1.05-.38.12-.58.53-.46.9.11.33.45.52.8.52.1 0 .21-.03.31-.06 2.02-.65 4.49-.95 7.43-.95 2.81 0 5.2.28 7.15.86.1.03.2.05.3.05.28 0 .55-.13.7-.37.21-.34.11-.78-.23-.99-2.22-.69-5.11-1.01-7.92-1.01zm-7.6 2.87c2.68-.8 6.09-1.12 9.06-1.12 2.62 0 5.64.26 8.27 1.05.47.14.73.65.59 1.12-.13.43-.53.7-1.02.7-.1 0-.21-.02-.3-.05-2.29-.68-4.99-.91-7.54-.91-2.6 0-5.63.29-8.04 1.01-.1.03-.2.04-.3.04-.4 0-.8-.25-.94-.64-.2-.47.05-1 .52-1.2z"
    },
    applemusic: { label: 'Apple Music', hex: '#fc3c44', gradient: 'from-[#fc3c44] to-[#c5202a]', icon: Music },
    youtube: { label: 'YouTube', hex: '#FF0000', gradient: 'from-[#FF0000] to-[#b00000]', icon: Youtube },
    tidal: {
        label: 'Tidal', hex: '#00FFFF', gradient: 'from-[#00FFFF] to-[#0080ff]',
        svgPath: "M12.01 2.24L9.77 4.48l2.24 2.24 2.24-2.24-2.24-2.24zM5.29 6.72L3.05 8.96l2.24 2.24 2.24-2.24-2.24-2.24zM12.01 11.2l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24zM18.73 6.72l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24z"
    },
    instagram: { label: 'Instagram', hex: '#E1306C', gradient: 'from-[#833ab4] via-[#fd1d1d] to-[#fcb045]', icon: Instagram },
    tiktok: {
        label: 'TikTok', hex: '#010101', gradient: 'from-[#010101] to-[#333]',
        svgPath: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77-1.52v-3.4a4.85 4.85 0 0 1-1-.1z"
    },
    twitter: { label: 'Twitter / X', hex: '#1DA1F2', gradient: 'from-[#1DA1F2] to-[#0d8cd4]', icon: Twitter },
    web: { label: 'Website', hex: '#6366f1', gradient: 'from-[#6366f1] to-[#4f46e5]', icon: Globe },
};

const PLATFORM_ORDER = ['spotify', 'applemusic', 'tidal', 'youtube', 'instagram', 'tiktok', 'twitter', 'web'];

function TierBadge({ tier }: { tier: string }) {
    const cfg: Record<string, { label: string; gradient: string; glow: string }> = {
        premium: { label: 'Premium', gradient: 'from-cyan-400 to-blue-500', glow: 'shadow-cyan-500/30' },
        pro: { label: 'Pro', gradient: 'from-amber-400 to-orange-500', glow: 'shadow-amber-500/30' },
        free: { label: 'Free', gradient: 'from-slate-400 to-slate-500', glow: '' },
    };
    const c = cfg[tier] || cfg.free;
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-gradient-to-r ${c.gradient} text-white shadow-lg ${c.glow}`}>
            <span className="w-1 h-1 rounded-full bg-white/70 animate-pulse" />{c.label} Producer
        </span>
    );
}

export default function SmartLinkBioPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;
    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase.from('perfiles').select('*').eq('nombre_usuario', username).single();
            setProfile(data);
            setLoading(false);
        };
        fetchProfile();
    }, [username]);

    useEffect(() => {
        const checkOwner = async () => {
            if (!profile) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === profile.id) setIsOwner(true);
        };
        checkOwner();
    }, [profile]);

    if (loading) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="animate-spin w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent" />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Perfil no encontrado</h1>
            <Link href="/" className="text-accent hover:underline font-bold uppercase tracking-widest text-xs">Volver al Inicio</Link>
        </div>
    );

    if (!profile.enlaces_activos && !isOwner) return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center text-foreground p-6">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 opacity-20">Página no disponible</h1>
            <p className="text-xs font-bold text-muted uppercase tracking-widest mb-8">El Smart Link no está habilitado</p>
            <Link href={`/${username}`} className="text-accent hover:underline font-bold uppercase tracking-widest text-xs">Ver Perfil Principal</Link>
        </div>
    );

    const socialLinks = profile.enlaces_sociales || {};
    const accentColor = profile.color_acento || '#2563eb';

    const allLinks = PLATFORM_ORDER
        .filter(k => (socialLinks as any)[k])
        .map(k => ({ key: k, url: (socialLinks as any)[k], meta: SOCIAL_META[k] }));

    const musicLinks = allLinks.filter(l => ['spotify', 'applemusic', 'tidal', 'youtube'].includes(l.key));
    const socialLinksArr = allLinks.filter(l => ['instagram', 'tiktok', 'twitter', 'web'].includes(l.key));

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white overflow-x-hidden">

            {/* ── 1. EFECTOS AMBIENTALES (GLOWS) ── 
                Crea una atmósfera premium con colores suaves que dependen del color de acento del productor.
            */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
                <div className="absolute top-[-15%] left-[-10%] w-[60%] h-[60%] rounded-full opacity-[0.06] blur-[180px] transition-all" style={{ backgroundColor: accentColor }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-[0.04] blur-[160px]" style={{ backgroundColor: accentColor }} />
            </div>

            <div className="max-w-sm mx-auto px-5 pt-16 pb-20 relative z-10">

                {/* Barra de Propietario: Visible solo si el usuario está viendo su propia página */}
                {isOwner && (
                    <div className="flex flex-col items-center gap-2 mb-8">
                        {!profile.enlaces_activos && (
                            <div className="bg-amber-500/10 text-amber-400 px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-500/20">
                                Vista previa · Desactivado para el público
                            </div>
                        )}
                        <Link href="/studio/premium"
                            className="flex items-center gap-2 px-5 py-2.5 bg-card border border-border rounded-full text-[9px] font-black uppercase tracking-widest text-muted hover:text-accent hover:border-accent/30 transition-all">
                            <Zap size={11} className="text-accent" /> Personalizar Smart Link
                        </Link>
                    </div>
                )}

                {/* ── 2. CABECERA DE PERFIL (HERO) ── 
                    Presenta la identidad visual del productor: foto, nombre y badges.
                */}
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-5">
                        <div className="absolute inset-0 rounded-[3rem] blur-2xl scale-90 opacity-40 transition-all duration-700"
                            style={{ backgroundColor: accentColor }} />
                        <div className="relative w-28 h-28 rounded-[2.5rem] overflow-hidden border-2 border-border shadow-2xl mx-auto"
                            style={{ boxShadow: `0 0 40px ${accentColor}25` }}>
                            {profile.foto_perfil ? (
                                <img src={profile.foto_perfil} className="w-full h-full object-cover" alt={profile.nombre_artistico || ''} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-card text-4xl font-black text-foreground">
                                    {profile.nombre_artistico?.charAt(0) || username.charAt(0)}
                                </div>
                            )}
                        </div>
                        {profile.esta_verificado && (
                            <div className="absolute -bottom-1.5 -right-1.5 w-8 h-8 rounded-full flex items-center justify-center border-2 border-background shadow-xl"
                                style={{ background: accentColor }}>
                                <ShieldCheck size={14} className="text-white" fill="white" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-1 flex items-center justify-center gap-2">
                        {profile.nombre_artistico}
                        {profile.es_fundador && (
                            <Crown size={20} className="text-amber-500 -mt-1 rotate-12 drop-shadow-[0_0_8px_rgba(245,158,11,0.6)]" fill="currentColor" />
                        )}
                    </h1>

                    <div className="flex items-center justify-center gap-3 mb-4 flex-wrap">
                        <TierBadge tier={profile.nivel_suscripcion || 'free'} />
                        {profile.pais && (
                            <span className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest text-muted">
                                <MapPin size={10} className="text-accent" />{profile.pais}
                            </span>
                        )}
                    </div>

                    {profile.biografia && (
                        <p className="text-[12px] text-muted font-medium leading-relaxed mx-auto max-w-[260px] opacity-80">
                            "{profile.biografia}"
                        </p>
                    )}
                </div>

                {/* ── 3. CTA PRINCIPAL: CATÁLOGO ── 
                    Botón destacado con el color de acento para redirigir al perfil principal.
                */}
                <Link href={`/${username}`}
                    className="group relative w-full flex items-center gap-5 p-5 rounded-[2rem] mb-8 overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-2xl"
                    style={{ background: `linear-gradient(135deg, ${accentColor}ee, ${accentColor}99)`, boxShadow: `0 20px 50px ${accentColor}30` }}>
                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <div className="relative w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shrink-0">
                        <Play size={22} fill="white" className="text-white ml-1" />
                    </div>
                    <div className="relative flex-1">
                        <span className="block text-white font-black text-base uppercase tracking-tight leading-none mb-0.5">Tienda de Beats</span>
                        <span className="block text-white/60 text-[9px] font-black uppercase tracking-widest">Escucha y Descarga</span>
                    </div>
                    <ArrowUpRight size={20} className="relative text-white/60 group-hover:text-white group-hover:rotate-45 transition-all" />
                </Link>

                {/* ── 4. PLATAFORMAS MUSICALES ── 
                    Enlaces a Spotify, Apple Music, etc., con diseño de tarjeta táctil.
                */}
                {musicLinks.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Headphones size={12} className="text-muted" />
                            <span className="text-[8px] font-black uppercase tracking-[0.35em] text-muted">Escúchame en</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="space-y-3">
                            {musicLinks.map(({ key, url, meta }) => (
                                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                    className="group relative w-full flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                        style={{ background: `linear-gradient(135deg, ${meta.hex}08, transparent)` }} />
                                    <div className={`relative w-11 h-11 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shrink-0 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {meta.icon ? (
                                            <meta.icon size={18} className="text-white" />
                                        ) : (
                                            <svg width="18" height="18" viewBox="0 0 24 24" fill="white">
                                                <path d={meta.svgPath} />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="relative flex-1 font-black text-[11px] uppercase tracking-widest text-foreground">{meta.label}</span>
                                    <ExternalLink size={13} className="relative text-muted group-hover:text-foreground opacity-0 group-hover:opacity-100 transition-all" />
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 5. REDES SOCIALES ── 
                    Grid de iconos para acceso rápido a perfiles sociales.
                */}
                {socialLinksArr.length > 0 && (
                    <div className="mb-8">
                        <div className="flex items-center gap-3 mb-4">
                            <Music2 size={12} className="text-muted" />
                            <span className="text-[8px] font-black uppercase tracking-[0.35em] text-muted">Sígueme en</span>
                            <div className="h-px flex-1 bg-border" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            {socialLinksArr.map(({ key, url, meta }) => (
                                <a key={key} href={url} target="_blank" rel="noopener noreferrer"
                                    className="group relative flex flex-col items-center justify-center gap-2.5 py-5 rounded-2xl border border-border bg-card hover:border-foreground/20 transition-all duration-300 hover:-translate-y-0.5 overflow-hidden">
                                    <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                                        style={{ background: `linear-gradient(135deg, ${meta.hex}08, transparent)` }} />
                                    <div className={`relative w-12 h-12 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300`}>
                                        {meta.icon ? (
                                            <meta.icon size={20} className="text-white" />
                                        ) : (
                                            <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
                                                <path d={meta.svgPath} />
                                            </svg>
                                        )}
                                    </div>
                                    <span className="relative font-black text-[9px] uppercase tracking-widest text-muted group-hover:text-foreground transition-colors">{meta.label}</span>
                                </a>
                            ))}
                        </div>
                    </div>
                )}

                {/* ── 6. BOLETÍN DE NOTICIAS (NEWSLETTER) ── 
                    Permite a los suscriptores premium recolectar correos electrónicos de sus fans.
                */}
                {profile.nivel_suscripcion === 'premium' && profile.boletin_activo && (
                    <div className="relative rounded-[2rem] border border-border bg-card p-7 mb-8 overflow-hidden">
                        <div className="absolute top-0 right-0 w-40 h-40 bg-accent/5 blur-[60px] -mr-16 -mt-16 pointer-events-none" />
                        <div className="relative text-center">
                            <div className="w-12 h-12 bg-gradient-to-br from-amber-400 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/20">
                                <Mail size={22} className="text-white" />
                            </div>
                            <h3 className="text-xl font-black uppercase tracking-tighter text-foreground mb-1">Inner Circle</h3>
                            <p className="text-muted text-[10px] font-bold uppercase tracking-[0.2em] mb-5 leading-loose">Acceso anticipado + Beats Exclusivos</p>
                            <form className="space-y-3" onSubmit={(e) => e.preventDefault()}>
                                <input type="email" placeholder="Tu correo electrónico" required
                                    className="w-full h-12 bg-background border border-border rounded-xl px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent transition-all text-center" />
                                <button className="w-full h-12 bg-foreground text-background rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all active:scale-95">
                                    Suscribirme <Zap size={12} className="inline-block ml-1" />
                                </button>
                            </form>
                        </div>
                    </div>
                )}

                {/* Pie de página con enlace al inicio */}
                <div className="text-center pt-8">
                    <Link href="/" className="inline-flex flex-col items-center gap-3 group">
                        <div className="w-10 h-10 rounded-2xl bg-card border border-border flex items-center justify-center group-hover:border-accent/40 group-hover:bg-accent/5 transition-all">
                            <span className="text-xl font-black text-accent">T</span>
                        </div>
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.5em] text-muted group-hover:text-foreground transition-colors">Tianguis Beats</p>
                            <p className="text-[7px] font-bold uppercase tracking-[0.2em] text-muted/40">Tu Ecosistema Musical</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
