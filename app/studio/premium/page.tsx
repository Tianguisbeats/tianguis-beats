"use client";

import React, { useEffect, useState } from 'react';
import { Crown, Video, Loader2, Check, MessageSquare, Mail, ShieldCheck, Zap, Clock, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Switch from '@/components/ui/Switch';

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

    useEffect(() => {
        fetchData();
    }, []);

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
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 dark:bg-card/10 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-border/50">
                <div className="bg-blue-600/10 p-8 rounded-[2.5rem] mb-8 text-blue-600 shadow-2xl shadow-blue-600/10 animate-bounce-slow">
                    <Crown size={64} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4">Hub de Beneficios <span className="text-accent">Premium</span></h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-10 font-medium leading-relaxed">
                    Eleva tu perfil al siguiente nivel con video destacado y herramientas de marketing exclusivas.
                </p>
                <Link href="/pricing" className="bg-accent text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-105 active:scale-95 transition-all shadow-xl shadow-accent/20">
                    <Zap size={16} fill="currentColor" className="inline mr-2" /> Mejorar a Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-5xl space-y-16 pb-20">
            {/* Master Branding Suite Header */}
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-end gap-10">
                <div className="space-y-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                        <Crown size={14} className="text-accent" />
                        <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Suite de Marca v3.4</span>
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground leading-[1] flex flex-col">
                            Características
                            <span className="text-accent">Premium.</span>
                        </h1>
                        <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] opacity-60 ml-1">
                            Control centralizado de identidad y alcance
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${saving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-foreground">
                            {saving ? 'Sincronizando' : 'Sincronizado'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                    {/* Video Spotlight Card */}
                    <div className={`group relative bg-white dark:bg-[#020205] backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] transition-all duration-700 hover:shadow-2xl dark:hover:shadow-black/60 overflow-hidden shadow-xl dark:shadow-none ${!preferences.is_video_active && 'opacity-60'}`}>
                        {/* Red Accent Aura */}
                        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-red-500/5 blur-[80px] rounded-full transition-all duration-1000 group-hover:scale-125 ${preferences.is_video_active ? 'opacity-100' : 'opacity-0'}`} />

                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${preferences.is_video_active ? 'bg-red-50 dark:bg-red-500/10 text-red-500 ring-4 ring-red-500/5' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-muted/40'}`}>
                                        <Video size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-foreground uppercase tracking-tight">Video Destacado</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-red-500" />
                                            <p className="text-[9px] text-slate-500 dark:text-muted font-black uppercase tracking-widest opacity-60">Impacto Visual</p>
                                        </div>
                                    </div>
                                </div>
                                <Switch
                                    active={preferences.is_video_active}
                                    onChange={(val) => setPreferences({ ...preferences, is_video_active: val })}
                                    activeColor="bg-red-500"
                                    size="md"
                                />
                            </div>

                            <div className={`space-y-6 transition-all duration-700 ${preferences.is_video_active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20 pointer-events-none'}`}>
                                <div className="space-y-3">
                                    <label className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-500 dark:text-muted ml-1">Enlace de YouTube</label>
                                    <div className="relative">
                                        <ExternalLink size={16} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400 dark:text-muted/20" />
                                        <input
                                            value={preferences.video_destacado_url}
                                            onChange={e => setPreferences({ ...preferences, video_destacado_url: e.target.value })}
                                            placeholder="https://youtube.com/watch?v=..."
                                            className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-2xl pl-12 pr-6 py-5 font-bold text-slate-900 dark:text-foreground text-sm focus:outline-none focus:border-red-500/50 transition-all font-mono"
                                        />
                                    </div>
                                </div>
                                <div className="bg-red-50 dark:bg-red-500/5 border border-red-200 dark:border-red-500/10 p-5 rounded-2xl">
                                    <p className="text-[10px] text-red-500 dark:text-red-500/80 font-bold uppercase tracking-widest flex items-center gap-2">
                                        <Zap size={12} fill="currentColor" /> Reproducción automática activada en el perfil
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-10">
                    {/* Smart Link Bio Card */}
                    <div className={`group relative bg-white dark:bg-[#020205] backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] transition-all duration-700 hover:shadow-2xl dark:hover:shadow-black/60 overflow-hidden shadow-xl dark:shadow-none ${!preferences.is_links_active && 'opacity-60'}`}>
                        {/* Indigo Accent Aura */}
                        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-indigo-500/5 blur-[80px] rounded-full transition-all duration-1000 group-hover:scale-125 ${preferences.is_links_active ? 'opacity-100' : 'opacity-0'}`} />

                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${preferences.is_links_active ? 'bg-indigo-50 dark:bg-indigo-500/10 text-indigo-500 ring-4 ring-indigo-500/5' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-muted/40'}`}>
                                        <Zap size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-foreground uppercase tracking-tight">Smart Link Bio</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-indigo-500" />
                                            <p className="text-[9px] text-slate-500 dark:text-muted font-black uppercase tracking-widest opacity-60">Matriz de Enlaces Profesionales</p>
                                        </div>
                                    </div>
                                </div>
                                <Switch
                                    active={preferences.is_links_active}
                                    onChange={(val) => setPreferences({ ...preferences, is_links_active: val })}
                                    activeColor="bg-indigo-500"
                                    size="md"
                                />
                            </div>

                            <div className={`space-y-8 transition-all duration-700 ${preferences.is_links_active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20 pointer-events-none'}`}>
                                <p className="text-sm text-slate-600 dark:text-muted font-medium leading-relaxed">
                                    Despliega una interfaz optimizada para dispositivos móviles que centraliza tu discografía, servicios y redes sociales en un solo punto de contacto.
                                </p>

                                <Link href={`/${preferences.is_links_active ? 'links' : ''}`} className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group/link shadow-sm dark:shadow-xl dark:shadow-indigo-500/5">
                                    Ver Smart Link Bio <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Fun Capture / Newsletter Card */}
                    <div className={`group relative bg-white dark:bg-[#020205] backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] transition-all duration-700 hover:shadow-2xl dark:hover:shadow-black/60 overflow-hidden shadow-xl dark:shadow-none ${!preferences.newsletter_active && 'opacity-60'}`}>
                        {/* Amber Accent Aura */}
                        <div className={`absolute -top-24 -right-24 w-64 h-64 bg-amber-500/5 blur-[80px] rounded-full transition-all duration-1000 group-hover:scale-125 ${preferences.newsletter_active ? 'opacity-100' : 'opacity-0'}`} />

                        <div className="relative z-10 space-y-10">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-5">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-500 ${preferences.newsletter_active ? 'bg-amber-50 dark:bg-amber-500/10 text-amber-500 ring-4 ring-amber-500/5' : 'bg-slate-50 dark:bg-white/5 text-slate-400 dark:text-muted/40'}`}>
                                        <Mail size={32} />
                                    </div>
                                    <div className="space-y-1">
                                        <h3 className="font-black text-2xl text-slate-900 dark:text-foreground uppercase tracking-tight">Captura de Fans</h3>
                                        <div className="flex items-center gap-2">
                                            <span className="w-1 h-1 rounded-full bg-amber-500" />
                                            <p className="text-[9px] text-slate-500 dark:text-muted font-black uppercase tracking-widest opacity-60">Newsletter Directa</p>
                                        </div>
                                    </div>
                                </div>
                                <Switch
                                    active={preferences.newsletter_active}
                                    onChange={(val) => setPreferences({ ...preferences, newsletter_active: val })}
                                    activeColor="bg-amber-500"
                                    size="md"
                                />
                            </div>

                            <div className={`space-y-6 transition-all duration-700 ${preferences.newsletter_active ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-20 pointer-events-none'}`}>
                                <p className="text-sm text-slate-600 dark:text-muted font-medium leading-relaxed">
                                    Integra un formulario de suscripción profesional en tu catálogo y Smart Link para construir tu propia base de datos de seguidores.
                                </p>
                                <div className="bg-amber-50 dark:bg-amber-500/5 border border-amber-200 dark:border-amber-500/10 p-5 rounded-2xl">
                                    <p className="text-[10px] text-amber-600 dark:text-amber-500/80 font-bold uppercase tracking-widest flex items-center gap-2 leading-relaxed">
                                        <Check size={12} strokeWidth={3} /> Sincronización automática con tus enlaces
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Verification & Trust Section */}
                    {!isVerified && (
                        <div className="group relative bg-[#020205] border border-slate-200 dark:border-white/5 p-10 rounded-[3rem] shadow-xl dark:shadow-2xl overflow-hidden transition-all hover:border-accent/40">
                            <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 blur-3xl transition-opacity duration-1000" />

                            <div className="relative z-10 space-y-8">
                                <div className="flex items-center gap-5">
                                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                        <ShieldCheck size={28} />
                                    </div>
                                    <h3 className="text-2xl font-black text-slate-100 dark:text-white uppercase tracking-tight">Verificación <span className="text-accent underline underline-offset-4 decoration-accent/20">Elite.</span></h3>
                                </div>

                                <p className="text-slate-400 text-sm font-medium leading-relaxed">
                                    Los perfiles verificados tienen un <span className="text-white font-black">40% más de tasa de cierre</span>. Demuestra que eres un proveedor de confianza en la red Tianguis.
                                </p>

                                <div className="grid grid-cols-2 gap-4">
                                    <button className="bg-accent text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] hover:scale-[1.05] transition-all shadow-xl shadow-accent/20 active:scale-95">
                                        Iniciar Trámite
                                    </button>
                                    <div className="bg-white/5 border border-white/10 flex items-center justify-center gap-3 rounded-2xl text-[9px] font-black uppercase tracking-widest text-slate-500">
                                        <Clock size={14} />
                                        <span>Proceso en Espera</span>
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
