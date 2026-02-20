"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Instagram, Youtube, Twitter, Globe, Music,
    Play, Share2, ShieldCheck, Mail, MapPin,
    ExternalLink, ChevronRight, Zap, Crown
} from 'lucide-react';
import Link from 'next/link';
import { Profile } from '@/lib/types';

const SOCIAL_ICONS: Record<string, any> = {
    web: { icon: Globe, color: "bg-blue-500/10 text-blue-500", label: "Website" },
    instagram: { icon: Instagram, color: "bg-pink-500/10 text-pink-500", label: "Instagram" },
    youtube: { icon: Youtube, color: "bg-red-500/10 text-red-500", label: "YouTube" },
    twitter: { icon: Twitter, color: "bg-blue-400/10 text-blue-400", label: "Twitter" },
    tiktok: {
        path: "M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77-1.52v-3.4a4.85 4.85 0 0 1-1-.1z",
        color: "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white",
        label: "TikTok"
    },
    spotify: {
        path: "M12 2a10 10 0 0 1 10 10 10 10 0 0 1-10 10A10 10 0 0 1 2 12 10 10 0 0 1 12 2m0 2a8 8 0 0 0-8 8 8 8 0 0 0 8 8 8 8 0 0 0 8-8 8 8 0 0 0-8-8m3.93 11c-.3.06-.62 0-.85-.14-2.34-1.42-5.3-1.74-8.77-1.74-.29 0-.58.07-.82.2a.57.57 0 0 1-.78-.23c-.16-.28-.06-.63.22-.79 3.86.06 7.18.42 9.9 2a1 1 0 0 1 .4.15c.29.17.38.54.21.83-.11.19-.3.29-.51.29zM12 9.04c-3.15 0-5.83.33-8.08 1.05-.38.12-.58.53-.46.9.11.33.45.52.8.52.1 0 .21-.03.31-.06 2.02-.65 4.49-.95 7.43-.95 2.81 0 5.2.28 7.15.86.1.03.2.05.3.05.28 0 .55-.13.7-.37.21-.34.11-.78-.23-.99-2.22-.69-5.11-1.01-7.92-1.01zm-7.6 2.87c2.68-.8 6.09-1.12 9.06-1.12 2.62 0 5.64.26 8.27 1.05.47.14.73.65.59 1.12-.13.43-.53.7-1.02.7-.1 0-.21-.02-.3-.05-2.29-.68-4.99-.91-7.54-.91-2.6 0-5.63.29-8.04 1.01-.1.03-.2.04-.3.04-.4 0-.8-.25-.94-.64-.2-.47.05-1 .52-1.2z",
        color: "bg-green-500/10 text-green-500",
        label: "Spotify"
    },
    applemusic: {
        icon: Music,
        color: "bg-rose-500/10 text-rose-500",
        label: "Apple Music"
    },
    tidal: {
        path: "M12.01 2.24L9.77 4.48l2.24 2.24 2.24-2.24-2.24-2.24zM5.29 6.72L3.05 8.96l2.24 2.24 2.24-2.24-2.24-2.24zM12.01 11.2l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24zM18.73 6.72l-2.24 2.24 2.24 2.24 2.24-2.24-2.24-2.24z",
        color: "bg-slate-900/10 dark:bg-white/10 text-slate-900 dark:text-white",
        label: "Tidal"
    }
};

export default function SmartLinkBioPage({ params }: { params: Promise<{ username: string }> }) {
    const resolvedParams = use(params);
    const username = resolvedParams.username;

    const [profile, setProfile] = useState<Profile | null>(null);
    const [loading, setLoading] = useState(true);
    const [isOwner, setIsOwner] = useState(false);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data } = await supabase
                .from('profiles')
                .select('*')
                .eq('username', username)
                .single();
            setProfile(data);
            setLoading(false);
        };
        fetchProfile();
    }, [username]);

    useEffect(() => {
        const checkOwner = async () => {
            if (!profile) return;
            const { data: { user } } = await supabase.auth.getUser();
            if (user && user.id === profile.id) {
                setIsOwner(true);
            }
        };
        checkOwner();
    }, [profile]);

    if (loading) return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center">
            <div className="animate-spin text-accent w-10 h-10 rounded-full border-2 border-accent/20 border-t-accent" />
        </div>
    );

    if (!profile) return (
        <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center text-white p-6">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4">Perfil no encontrado</h1>
            <Link href="/" className="text-accent hover:underline font-bold uppercase tracking-widest text-xs">Volver al Inicio</Link>
        </div>
    );

    if (!profile.links_active && !isOwner) return (
        <div className="min-h-screen bg-[#020205] flex flex-col items-center justify-center text-white p-6">
            <h1 className="text-4xl font-black uppercase tracking-tighter mb-4 text-white/20">Página no disponible</h1>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-8">El Smart Link no está habilitado actualmente</p>
            <Link href={`/${username}`} className="text-accent hover:underline font-bold uppercase tracking-widest text-xs">Ver Perfil Principal</Link>
        </div>
    );

    const socialLinks = profile.social_links || {};
    const accentColor = profile.color_acento || '#2563eb';

    // Grouping links for a more professional look
    const musicPlatforms = ['spotify', 'applemusic', 'tidal', 'youtube'];
    const socialPlatforms = ['instagram', 'tiktok', 'twitter', 'web'];

    const filteredMusicLinks = Object.entries(socialLinks).filter(([key, url]) => musicPlatforms.includes(key) && url);
    const filteredSocialLinks = Object.entries(socialLinks).filter(([key, url]) => socialPlatforms.includes(key) && url);

    return (
        <div className="min-h-screen bg-[#020205] text-white font-sans selection:bg-accent selection:text-white pb-12">
            {/* Background Elite Effects */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full opacity-20 blur-[150px] animate-pulse" style={{ backgroundColor: accentColor }} />
                <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] rounded-full opacity-10 blur-[150px]" style={{ backgroundColor: accentColor }} />
                <div className="absolute top-[30%] left-[20%] w-[40%] h-[40%] bg-white/5 rounded-full blur-[100px]" />
            </div>

            <div className="max-w-md mx-auto px-6 pt-16 relative z-10">
                {/* Admin/Owner Badge */}
                {isOwner && (
                    <div className="flex flex-col items-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
                        {!profile.links_active && (
                            <div className="bg-amber-500/10 text-amber-500 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest border border-amber-500/20 mb-2">
                                Modo Vista Previa (Desactivado para el público)
                            </div>
                        )}
                        <Link
                            href="/studio/premium"
                            className="flex items-center gap-2 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-full text-[10px] font-black uppercase tracking-widest text-slate-400 group transition-all"
                        >
                            <Zap size={12} className="text-accent" />
                            Personalizar mi Smart Link
                            <ChevronRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                        </Link>
                    </div>
                )}

                {/* Header Profile - Elite Cards Style */}
                <div className="text-center mb-10">
                    <div className="relative inline-block mb-6 group">
                        <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full scale-75 group-hover:scale-110 transition-transform duration-700" />
                        <div className="relative w-32 h-32 rounded-[3.5rem] overflow-hidden border-[6px] border-white/5 shadow-2xl mx-auto p-1.5 bg-gradient-to-br from-white/10 to-transparent backdrop-blur-sm">
                            {profile.foto_perfil ? (
                                <img src={profile.foto_perfil} className="w-full h-full object-cover rounded-[2.8rem]" alt={profile.artistic_name || ''} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[2.8rem] text-4xl font-black">
                                    {profile.artistic_name?.charAt(0) || username.charAt(0)}
                                </div>
                            )}
                        </div>
                        {profile.is_verified && (
                            <div className="absolute bottom-1 right-1 bg-accent text-white p-2 rounded-2xl border-4 border-[#020205] shadow-xl">
                                <ShieldCheck size={18} fill="currentColor" className="text-white" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-4xl font-black uppercase tracking-tighter mb-2 flex items-center justify-center gap-3">
                        {profile.artistic_name}
                        {profile.is_founder && (
                            <div className="relative h-6 w-6">
                                <Crown size={22} className="text-amber-500 absolute -top-4 -right-2 rotate-12 drop-shadow-[0_0_8px_rgba(245,158,11,0.5)]" fill="currentColor" />
                            </div>
                        )}
                    </h1>

                    <div className="flex items-center justify-center gap-4 mb-6">
                        {profile.country && (
                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] flex items-center gap-1.5">
                                <MapPin size={12} className="text-accent" /> {profile.country}
                            </span>
                        )}
                        <span className="w-1 h-1 bg-white/20 rounded-full" />
                        <span className="text-[10px] font-black text-accent uppercase tracking-[0.2em]">{profile.subscription_tier} PRODUCER</span>
                    </div>

                    <p className="text-[13px] text-slate-400 font-medium leading-relaxed max-w-xs mx-auto opacity-80 backdrop-blur-sm p-4 bg-white/5 rounded-2xl border border-white/5">
                        {profile.bio || "Producido en Tianguis Beats. Sonidos originales y calidad premium."}
                    </p>
                </div>

                {/* Primary CTA - The Beats Catalog */}
                <Link
                    href={`/${username}`}
                    className="group relative w-full h-24 bg-accent text-white rounded-[2.5rem] flex items-center px-8 mb-10 transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_20px_40px_rgba(37,99,235,0.3)] overflow-hidden"
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    <div className="flex-1">
                        <span className="block font-black text-lg uppercase tracking-tight">Ir al Catálogo de Beats</span>
                        <span className="block text-[10px] font-bold uppercase tracking-widest opacity-70">Escucha y Descarga en HD</span>
                    </div>
                    <div className="w-14 h-14 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center group-hover:bg-white/30 transition-all">
                        <Play size={24} fill="white" className="ml-1" />
                    </div>
                </Link>

                <div className="space-y-10">
                    {/* Music Platforms Section */}
                    {filteredMusicLinks.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Music Platforms</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-500/20 to-transparent" />
                            </div>
                            <div className="grid grid-cols-1 gap-3">
                                {filteredMusicLinks.map(([key, url]: [string, any]) => {
                                    const config = SOCIAL_ICONS[key];
                                    return (
                                        <a
                                            key={key}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group w-full h-18 bg-white/5 border border-white/10 rounded-3xl flex items-center px-6 transition-all hover:bg-white/10 hover:border-white/20"
                                        >
                                            <div className={`w-10 h-10 ${config.color} rounded-2xl flex items-center justify-center mr-4 group-hover:scale-110 transition-transform`}>
                                                {config.icon ? <config.icon size={20} /> : (
                                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d={config.path} />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="flex-1 font-black text-[11px] uppercase tracking-widest text-left">{config.label}</span>
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                                <ExternalLink size={14} className="text-accent" />
                                            </div>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Social Connect Section */}
                    {filteredSocialLinks.length > 0 && (
                        <div>
                            <div className="flex items-center gap-3 mb-4 px-2">
                                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-500">Social Connect</span>
                                <div className="h-px flex-1 bg-gradient-to-r from-slate-500/20 to-transparent" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                {filteredSocialLinks.map(([key, url]: [string, any]) => {
                                    const config = SOCIAL_ICONS[key];
                                    return (
                                        <a
                                            key={key}
                                            href={url}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className="group w-full h-20 bg-white/5 border border-white/10 rounded-3xl flex flex-col items-center justify-center transition-all hover:bg-white/10 hover:border-white/20"
                                        >
                                            <div className={`p-2.5 ${config.color} rounded-2xl mb-1 group-hover:scale-110 transition-transform`}>
                                                {config.icon ? <config.icon size={18} /> : (
                                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                                                        <path d={config.path} />
                                                    </svg>
                                                )}
                                            </div>
                                            <span className="font-black text-[9px] uppercase tracking-widest opacity-60 group-hover:opacity-100 transition-opacity">{config.label}</span>
                                        </a>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Featured CTA (Owner custom link) */}
                    {profile.subscription_tier === 'premium' && profile.cta_text && profile.cta_url && (
                        <a
                            href={profile.cta_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-full p-6 bg-gradient-to-br from-indigo-600 to-indigo-800 text-white rounded-[2.5rem] flex items-center justify-between transition-all hover:scale-[1.02] shadow-xl shadow-indigo-600/20 mt-8"
                        >
                            <div className="flex-1">
                                <span className="block font-black text-sm uppercase tracking-tight">{profile.cta_text}</span>
                                <span className="block text-[9px] font-bold uppercase tracking-widest opacity-60">Enlace Destacado</span>
                            </div>
                            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                                <Zap size={22} fill="white" />
                            </div>
                        </a>
                    )}
                </div>

                {/* Newsletter Section */}
                {profile.subscription_tier === 'premium' && profile.newsletter_active && (
                    <div className="mt-16 animate-in fade-in slide-in-from-bottom-8 duration-1000">
                        <div className="bg-white dark:bg-white/5 border border-white/10 rounded-[3rem] p-10 shadow-2xl relative overflow-hidden text-center backdrop-blur-md">
                            <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[60px] -mr-24 -mt-24 pointer-events-none" />
                            <div className="absolute bottom-0 left-0 w-48 h-48 bg-amber-500/10 blur-[60px] -ml-24 -mb-24 pointer-events-none" />

                            <div className="relative z-10">
                                <div className="w-16 h-16 bg-gradient-to-br from-amber-400 to-orange-600 rounded-3xl flex items-center justify-center mx-auto mb-6 text-white shadow-lg shadow-amber-500/20">
                                    <Mail size={32} />
                                </div>
                                <h3 className="text-2xl font-black uppercase tracking-tighter mb-3">Únete al <span className="text-accent">Inner Circle</span></h3>
                                <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.2em] mb-8 leading-loose px-4">
                                    Recibe beats exclusivos y acceso anticipado antes que nadie
                                </p>

                                <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                                    <div className="relative">
                                        <input
                                            type="email"
                                            placeholder="TU CORREO ELECTRÓNICO"
                                            className="w-full h-14 bg-black/40 border border-white/10 rounded-2xl px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all text-center"
                                            required
                                        />
                                    </div>
                                    <button className="w-full h-14 bg-white text-black rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95 group/btn">
                                        <span className="flex items-center justify-center gap-2">
                                            Suscribirme <Zap size={14} className="fill-current" />
                                        </span>
                                    </button>
                                </form>
                            </div>
                        </div>
                    </div>
                )}

                {/* Footer Branding */}
                <div className="mt-24 text-center">
                    <Link href="/" className="inline-flex flex-col items-center gap-4 group">
                        <div className="w-12 h-12 bg-white/5 rounded-2xl flex items-center justify-center border border-white/10 group-hover:border-accent/50 group-hover:bg-accent/5 transition-all duration-500">
                            <span className="text-2xl font-black text-accent group-hover:scale-110 transition-transform">T</span>
                        </div>
                        <div className="space-y-1">
                            <p className="text-[11px] font-black uppercase tracking-[0.5em] text-white/30 group-hover:text-white transition-all">TIANGUIS BEATS</p>
                            <p className="text-[8px] font-bold uppercase tracking-[0.2em] text-white/10">Tu Ecosistema Musical</p>
                        </div>
                    </Link>
                </div>
            </div>
        </div>
    );
}
