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

    const socialLinks = profile.social_links || {};
    const accentColor = profile.color_acento || '#2563eb';

    return (
        <div className="min-h-screen bg-[#020205] text-white font-sans selection:bg-accent selection:text-white">
            <div className="max-w-md mx-auto px-6 pt-20 pb-20 relative min-h-screen flex flex-col">
                {/* Background Glow */}
                <div className="fixed inset-0 overflow-hidden pointer-events-none">
                    <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full opacity-20 blur-[120px]" style={{ backgroundColor: accentColor }} />
                    <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full opacity-10 blur-[120px]" style={{ backgroundColor: accentColor }} />
                </div>

                {/* Header Profile */}
                <div className="text-center mb-12 relative z-10">
                    <div className="relative inline-block mb-6">
                        <div className="w-28 h-28 rounded-[2.5rem] overflow-hidden border-4 border-white/5 shadow-2xl mx-auto p-1 bg-white/5">
                            {profile.foto_perfil ? (
                                <img src={profile.foto_perfil} className="w-full h-full object-cover rounded-[2rem]" alt={profile.artistic_name || ''} />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center bg-slate-900 rounded-[2rem] text-4xl font-black">
                                    {profile.artistic_name?.charAt(0) || username.charAt(0)}
                                </div>
                            )}
                        </div>
                        {profile.is_verified && (
                            <div className="absolute bottom-1 right-1 bg-accent text-white p-1.5 rounded-full border-4 border-[#020205] shadow-lg">
                                <ShieldCheck size={16} fill="currentColor" className="text-white" />
                            </div>
                        )}
                    </div>

                    <h1 className="text-3xl font-black uppercase tracking-tighter mb-2 flex items-center justify-center gap-2">
                        {profile.artistic_name}
                        {profile.is_founder && <span className="text-[10px] bg-amber-500/20 text-amber-500 px-2 py-0.5 rounded-md border border-amber-500/20">FOUNDER</span>}
                    </h1>

                    {profile.country && (
                        <p className="text-[10px] font-black text-muted-foreground uppercase tracking-[0.3em] mb-4 flex items-center justify-center gap-2">
                            <MapPin size={10} className="text-white/40" /> {profile.country}
                        </p>
                    )}

                    <p className="text-sm text-slate-400 font-medium leading-relaxed max-w-sm mx-auto">
                        {profile.bio || "Productor y Artista Digital"}
                    </p>
                </div>

                {/* Links Container */}
                <div className="space-y-4 relative z-10 flex-1">
                    {/* Primary Link: Official Profile */}
                    <Link
                        href={`/${username}`}
                        className="group w-full h-16 bg-white dark:bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 transition-all hover:scale-[1.03] hover:bg-white/10 active:scale-95 shadow-xl shadow-black/20"
                    >
                        <div className="w-10 h-10 bg-accent/20 rounded-xl flex items-center justify-center text-accent mr-4">
                            <Music size={20} />
                        </div>
                        <span className="flex-1 font-black text-xs uppercase tracking-widest text-left">Escuchar en Tianguis Beats</span>
                        <ChevronRight size={18} className="text-white/20 group-hover:text-accent transition-all" />
                    </Link>

                    {/* Social Media Links */}
                    {Object.entries(socialLinks).map(([key, url]: [string, any]) => {
                        const config = SOCIAL_ICONS[key];
                        if (!config || !url) return null;

                        return (
                            <a
                                key={key}
                                href={url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="group w-full h-16 bg-white dark:bg-white/5 border border-white/10 rounded-2xl flex items-center px-6 transition-all hover:scale-[1.03] hover:bg-white/10 active:scale-95"
                            >
                                <div className={`w-10 h-10 ${config.color} rounded-xl flex items-center justify-center mr-4`}>
                                    {config.icon ? <config.icon size={20} /> : (
                                        <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor">
                                            <path d={config.path} />
                                        </svg>
                                    )}
                                </div>
                                <span className="flex-1 font-black text-xs uppercase tracking-widest text-left">{config.label}</span>
                                <ExternalLink size={16} className="text-white/10 group-hover:text-white transition-all underline decoration-accent" />
                            </a>
                        );
                    })}

                    {/* CTA Section from Profile */}
                    {profile.subscription_tier === 'premium' && profile.cta_text && profile.cta_url && (
                        <a
                            href={profile.cta_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="group w-full h-20 bg-accent text-white rounded-3xl flex items-center px-8 transition-all hover:scale-[1.03] active:scale-95 shadow-2xl shadow-accent/40 mt-8"
                        >
                            <div className="flex-1">
                                <span className="block font-black text-sm uppercase tracking-tighter">{profile.cta_text}</span>
                                <span className="block text-[9px] font-bold uppercase tracking-widest opacity-60">Enlace Destacado</span>
                            </div>
                            <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center">
                                <Zap size={20} fill="white" />
                            </div>
                        </a>
                    )}
                </div>

                {/* Footer Branding */}
                <div className="mt-20 text-center relative z-10">
                    <Link href="/" className="inline-flex flex-col items-center gap-2 group">
                        <div className="w-10 h-10 bg-white/5 rounded-2xl flex items-center justify-center border border-white/5 group-hover:border-accent/40 transition-all">
                            <span className="text-xl font-black text-accent">T</span>
                        </div>
                        <p className="text-[10px] font-black uppercase tracking-[0.4em] text-white/20 group-hover:text-white/40 transition-all">Tianguis beats</p>
                    </Link>
                </div>
            </div>
        </div>
    );
}
