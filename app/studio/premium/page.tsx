"use client";

import React, { useEffect, useState } from 'react';
import { Crown, Video, Loader2, Check, MessageSquare, Mail, ShieldCheck, Zap, Clock, ChevronRight, ExternalLink, ArrowUpRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';
import Switch from '@/components/ui/Switch';
import LoadingTianguis from '@/components/LoadingTianguis';

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



    const [stats, setStats] = useState<any>({
        beats: [],
        hasBio: false,
        hasSocials: false,
        hasPhoto: false,
        hasCover: false
    });

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('perfiles')
            .select('*')
            .eq('id', user.id)
            .single();

        const { data: beats } = await supabase
            .from('beats')
            .select('*')
            .eq('productor_id', user.id);

        if (profile) {
            setUserTier(profile.nivel_suscripcion);
            setIsVerified(profile.esta_verificado || false);
            setPreferences({
                is_video_active: !!profile.video_destacado_url,
                video_destacado_url: profile.video_destacado_url || '',
                newsletter_active: profile.boletin_activo || false,
                is_links_active: profile.enlaces_activos || false
            });
            setStats({
                beats: beats || [],
                hasBio: !!profile.biografia,
                hasSocials: !!(profile.instagram_url || profile.twitter_url || profile.youtube_url || profile.tiktok_url || profile.facebook_url),
                hasPhoto: !!profile.foto_perfil,
                hasCover: !!(profile.foto_portada || profile.banner_url || profile.portada_url)
            });
        }
        setLoading(false);
    };

    const getOptimizationChecklist = () => {
        const checks = [];

        // Profile Checks
        checks.push({
            id: 'profile-photo',
            label: 'Foto de Perfil',
            done: stats.hasPhoto,
            tip: 'Una foto profesional aumenta la confianza del comprador.'
        });
        checks.push({
            id: 'cover-photo',
            label: 'Portada de Perfil',
            done: stats.hasCover,
            tip: 'La portada define la estética de tu marca.'
        });
        checks.push({
            id: 'bio',
            label: 'Biografía Completa',
            done: stats.hasBio,
            tip: 'Cuéntale a los artistas quién eres y tu trayectoria.'
        });
        checks.push({
            id: 'socials',
            label: 'Redes Sociales',
            done: stats.hasSocials,
            tip: 'Permite que te encuentren en otras plataformas.'
        });

        // Beat Checks
        const beatsWithMoods = stats.beats.filter((b: any) => (b.moods?.length || 0) >= 3).length;
        checks.push({
            id: 'beat-moods',
            label: 'Moods en Beats',
            done: beatsWithMoods === stats.beats.length && stats.beats.length > 0,
            tip: 'Asegúrate que todos tus beats tengan al menos 3 Moods para mejor búsqueda.'
        });

        const beatsWithInstruments = stats.beats.filter((b: any) => (b.instrumentos?.length || 0) >= 1).length;
        checks.push({
            id: 'beat-instruments',
            label: 'Instrumentos',
            done: beatsWithInstruments === stats.beats.length && stats.beats.length > 0,
            tip: 'Detallar instrumentos ayuda en los filtros técnicos del catálogo.'
        });

        const beatsWithCover = stats.beats.filter((b: any) => !!b.portada_url).length;
        checks.push({
            id: 'beat-covers',
            label: 'Portadas de Beats',
            done: beatsWithCover === stats.beats.length && stats.beats.length > 0,
            tip: 'Cada beat debe tener una portada llamativa y única.'
        });

        return checks;
    };

    useEffect(() => {
        fetchData();
    }, []);

    const handleSave = async () => {
        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { error } = await supabase
            .from('perfiles')
            .update({
                video_destacado_url: preferences.is_video_active ? preferences.video_destacado_url : '',
                boletin_activo: preferences.newsletter_active,
                enlaces_activos: preferences.is_links_active
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

    if (loading) return <LoadingTianguis />;

    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 dark:bg-card/10 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-border/50 relative overflow-hidden">
                {/* Dot grid ambient */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="bg-blue-600/10 p-8 rounded-[2.5rem] mb-8 text-blue-600 dark:text-[#00f2ff] animate-bounce-slow relative z-10">
                    <Crown size={64} strokeWidth={1} />
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4 relative z-10">
                    Hub de Beneficios <span className="text-accent">Premium</span>
                </h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-12 font-medium leading-relaxed uppercase text-[10px] tracking-widest relative z-10">
                    Video destacado, Smart Link Bio, captura de fans y verificación élite. Exclusivo para miembros
                    <span className="text-slate-900 dark:text-foreground font-black mx-1">Premium</span>.
                </p>
                <Link href="/pricing" className="group relative overflow-hidden bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3 relative z-10">
                    <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Mejorar a Premium</span>
                    <ArrowUpRight size={16} className="relative z-10 group-hover:text-white transition-colors" />
                </Link>
            </div>
        );
    }

    const checklist = getOptimizationChecklist();
    const completedChecks = checklist.filter(c => c.done).length;
    const progressPercent = Math.round((completedChecks / checklist.length) * 100);

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
                        <h1 className="text-4xl md:text-7xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                            <span className="opacity-40">Características</span> <br />
                            <span className="text-blue-500 relative inline-block">
                                Premium.
                                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-slate-400/50 to-transparent rounded-full" />
                            </span>
                        </h1>
                        <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] opacity-60 ml-1">
                            Control centralizado de identidad y alcance
                        </p>
                    </div>
                </div>

                <div className="flex items-center gap-6">
                    <div className="bg-slate-50 dark:bg-white/5 backdrop-blur-3xl border border-slate-200 dark:border-white/10 px-6 py-4 rounded-2xl flex items-center gap-4">
                        <div className={`w-3 h-3 rounded-full ${saving ? 'bg-amber-500 animate-pulse' : 'bg-emerald-500'}`} />
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-900 dark:text-foreground">
                            {saving ? 'Sincronizando' : 'Sincronizado'}
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid lg:grid-cols-2 gap-10">
                <div className="space-y-10">
                    {/* Sales Optimization Card */}
                    <div className="group relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-accent/30 p-8 rounded-[2.5rem] overflow-hidden">
                        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent to-transparent" />
                        <div className="absolute inset-0 bg-accent/5 opacity-50" />

                        <div className="relative z-10 space-y-8">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-2xl bg-accent/20 flex items-center justify-center text-accent">
                                        <Zap size={24} fill="currentColor" />
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-black text-slate-900 dark:text-white uppercase tracking-tight">Optimizar Ventas</h3>
                                        <p className="text-[9px] text-accent font-black uppercase tracking-widest">IA Health Check</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <span className="text-2xl font-black text-slate-900 dark:text-white">{progressPercent}%</span>
                                    <p className="text-[8px] font-bold text-muted uppercase">Completado</p>
                                </div>
                            </div>

                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                                <div className="h-full bg-accent transition-all duration-1000" style={{ width: `${progressPercent}%` }} />
                            </div>

                            <div className="space-y-3">
                                {checklist.map((item) => (
                                    <div key={item.id} className={`p-4 rounded-2xl border transition-all ${item.done ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-white/5 border-white/10 opacity-70'}`}>
                                        <div className="flex items-center justify-between mb-1">
                                            <span className={`text-[10px] font-black uppercase tracking-widest ${item.done ? 'text-emerald-500' : 'text-slate-400'}`}>
                                                {item.label}
                                            </span>
                                            {item.done ? <Check size={14} className="text-emerald-500" /> : <Clock size={14} className="text-slate-500" />}
                                        </div>
                                        {!item.done && <p className="text-[10px] text-muted font-medium leading-relaxed">{item.tip}</p>}
                                    </div>
                                ))}
                            </div>

                            <Link href="/studio/beats" className="w-full block text-center py-4 bg-slate-900 text-white dark:bg-white dark:text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                                Ir a corregir beats
                            </Link>
                        </div>
                    </div>

                </div>

                <div className="space-y-10">
                    {/* Smart Link Bio Card */}
                    <div className={`group relative bg-white dark:bg-[#020205] backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] transition-all duration-700 overflow-hidden ${!preferences.is_links_active && 'opacity-60'}`}>
                        {/* Indigo Top Line */}
                        <div className="absolute top-0 left-0 right-0 h-[6px] bg-indigo-500 z-20" />
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

                                <Link href={`/${preferences.is_links_active ? 'links' : ''}`} className="w-full flex items-center justify-center gap-3 py-4 bg-indigo-50 dark:bg-indigo-500/10 border border-indigo-200 dark:border-indigo-500/20 rounded-xl text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500 hover:text-white transition-all group/link">
                                    Ver Smart Link Bio <ChevronRight size={16} className="group-hover/link:translate-x-1 transition-transform" />
                                </Link>
                            </div>
                        </div>
                    </div>

                    {/* Fun Capture / Newsletter Card */}
                    <div className={`group relative bg-white dark:bg-[#020205] backdrop-blur-3xl border border-slate-200 dark:border-white/5 p-8 rounded-[2.5rem] transition-all duration-700 overflow-hidden ${!preferences.newsletter_active && 'opacity-60'}`}>
                        {/* Amber Top Line */}
                        <div className="absolute top-0 left-0 right-0 h-[6px] bg-amber-500 z-20" />
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

                    {/* Video Spotlight Card */}
                    <div className={`group relative bg-card border border-border p-8 rounded-[2.5rem] transition-all duration-700 overflow-hidden ${!preferences.is_video_active && 'opacity-60'}`}>
                        {/* Red Top Line */}
                        <div className="absolute top-0 left-0 right-0 h-[6px] bg-red-500 z-20" />
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
            </div>
        </div>
    );
}
