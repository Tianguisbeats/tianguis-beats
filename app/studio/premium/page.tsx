"use client";

import React, { useEffect, useState } from 'react';
import { Crown, Video, Loader2, Check, MessageSquare, Mail, ShieldCheck, Zap, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PremiumHubPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userTier, setUserTier] = useState<string | null>(null);
    const [isVerified, setIsVerified] = useState(false);

    const [preferences, setPreferences] = useState({
        is_video_active: false,
        video_destacado_url: '',
        newsletter_active: false,
        is_links_active: false
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, video_destacado_url, newsletter_active, is_verified, links_active')
            .eq('id', user.id)
            .single();

        if (profile) {
            setUserTier(profile.subscription_tier);
            setIsVerified(profile.is_verified || false);
            setPreferences({
                is_video_active: !!profile.video_destacado_url,
                video_destacado_url: profile.video_destacado_url || '',
                newsletter_active: profile.newsletter_active || false,
                is_links_active: profile.links_active || false
            });
        }
        setLoading(false);
    };

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('profiles')
            .update({
                video_destacado_url: preferences.is_video_active ? preferences.video_destacado_url : '',
                newsletter_active: preferences.newsletter_active,
                links_active: preferences.is_links_active
            })
            .eq('id', user.id);

        setSaving(false);
    };

    useEffect(() => {
        if (!loading) {
            const timer = setTimeout(() => {
                handleSave();
            }, 1000);
            return () => clearTimeout(timer);
        }
    }, [preferences]);

    if (loading) return <div className="flex justify-center p-12 text-muted"><Loader2 className="animate-spin" /></div>;

    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-blue-600/10 p-8 rounded-[2.5rem] mb-8 text-blue-600 shadow-2xl shadow-blue-600/10">
                    <Crown size={64} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4">Hub de Beneficios <span className="text-accent">Premium</span></h1>
                <p className="text-muted max-w-md mb-10 font-medium leading-relaxed">
                    Eleva tu perfil al siguiente nivel con video destacado y herramientas de marketing exclusivas.
                </p>
                <Link href="/pricing" className="bg-accent text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">
                    <Zap size={16} fill="currentColor" className="inline mr-2" /> Mejorar a Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-12">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tighter uppercase mb-2">Hub <span className="text-accent">Premium</span></h1>
                    <div className="flex items-center gap-3">
                        <span className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                            <ShieldCheck size={12} /> Estado: {isVerified ? 'Verificado' : 'Miembro Gold'}
                        </span>
                        <span className="text-accent font-black text-[10px] uppercase tracking-[0.4em]">Control Maestro de Marca</span>
                    </div>
                </div>
                {saving && (
                    <div className="flex items-center gap-2 text-muted animate-pulse">
                        <Loader2 size={12} className="animate-spin" />
                        <span className="text-[9px] font-black uppercase tracking-widest">Sincronizando...</span>
                    </div>
                )}
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* Featured Video */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden transition-all">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-all ${preferences.is_video_active ? 'bg-red-500/10 text-red-600' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                    <Video size={24} />
                                </div>
                                <div>
                                    <h3 className={`font-black uppercase tracking-tight transition-all ${preferences.is_video_active ? 'text-foreground' : 'text-slate-400'}`}>Video de Bienvenida</h3>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Highlight tu mejor trabajo</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferences({ ...preferences, is_video_active: !preferences.is_video_active })}
                                className={`w-12 h-6 rounded-full transition-all relative ${preferences.is_video_active ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${preferences.is_video_active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className={`space-y-4 transition-all duration-500 ${preferences.is_video_active ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale blur-[2px]'}`}>
                            <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">YouTube URL</label>
                            <input
                                value={preferences.video_destacado_url}
                                onChange={e => setPreferences({ ...preferences, video_destacado_url: e.target.value })}
                                placeholder="https://youtube.com/watch?v=..."
                                className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                            />
                            <p className="text-[10px] text-muted font-medium italic opacity-60">
                                * Se reproducirá automáticamente en tu perfil.
                            </p>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Smart Link Bio & Fan Capture Card */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm relative overflow-hidden transition-all">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className={`p-3 rounded-2xl transition-all ${preferences.is_links_active ? 'bg-indigo-500/10 text-indigo-500' : 'bg-slate-100 dark:bg-white/5 text-slate-400'}`}>
                                    <Zap size={24} />
                                </div>
                                <div>
                                    <h3 className={`font-black uppercase tracking-tight transition-all ${preferences.is_links_active ? 'text-foreground' : 'text-slate-400'}`}>Smart Link Bio</h3>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Tu tarjeta de presentación digital</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferences({ ...preferences, is_links_active: !preferences.is_links_active })}
                                className={`w-12 h-6 rounded-full transition-all relative ${preferences.is_links_active ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${preferences.is_links_active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <div className={`transition-all duration-500 ${preferences.is_links_active ? 'opacity-100' : 'opacity-20 pointer-events-none grayscale blur-[2px]'}`}>
                            <p className="text-sm text-muted font-medium mb-6">
                                Activa una página dedicada con todos tus enlaces importantes optimizada para redes sociales.
                            </p>

                            {/* Newsletter Toggle integrated within Smart Link */}
                            <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-100 dark:border-white/5 mb-6">
                                <div className="flex items-center justify-between mb-4">
                                    <div className="flex items-center gap-3">
                                        <Mail size={18} className={preferences.newsletter_active ? 'text-amber-500' : 'text-muted'} />
                                        <span className={`text-[11px] font-black uppercase tracking-widest ${preferences.newsletter_active ? 'text-foreground' : 'text-muted'}`}>Captura de Fans</span>
                                    </div>
                                    <button
                                        onClick={() => setPreferences({ ...preferences, newsletter_active: !preferences.newsletter_active })}
                                        className={`w-10 h-5 rounded-full transition-all relative ${preferences.newsletter_active ? 'bg-amber-500' : 'bg-slate-200 dark:bg-white/10'}`}
                                    >
                                        <div className={`absolute top-1 w-3 h-3 rounded-full bg-white shadow-sm transition-all ${preferences.newsletter_active ? 'left-6' : 'left-1'}`} />
                                    </button>
                                </div>
                                <p className="text-[10px] text-muted font-medium italic">
                                    Si se activa, se mostrará un formulario de newsletter en tu Smart Link.
                                </p>
                            </div>

                            <Link href={`/${preferences.is_links_active ? 'links' : ''}`} className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent hover:underline cursor-pointer opacity-80">
                                Ver mi Smart Link <ChevronRight size={14} />
                            </Link>
                        </div>
                    </div>

                    {/* Verification Section */}
                    {!isVerified && (
                        <div className="bg-slate-900 border border-white/5 p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden group">
                            <div className="absolute inset-0 bg-accent/5 blur-3xl pointer-events-none" />
                            <div className="relative z-10">
                                <h3 className="text-white font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                                    <ShieldCheck className="text-accent" /> Identidad Verificada
                                </h3>
                                <p className="text-slate-400 text-xs font-medium leading-relaxed mb-8">
                                    Solicita el sello de Productor Verificado para aumentar la confianza en tus ventas.
                                </p>
                                <div className="flex flex-col sm:flex-row gap-3">
                                    <button className="bg-accent text-white px-4 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-widest hover:scale-105 transition-all flex-1">
                                        Solicitar
                                    </button>
                                    <div className="bg-white/5 border border-white/10 px-4 py-2.5 rounded-xl flex items-center gap-2 flex-1">
                                        <Clock size={12} className="text-slate-500" />
                                        <span className="text-[9px] text-slate-500 font-bold uppercase tracking-widest truncate">Pendiente</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
