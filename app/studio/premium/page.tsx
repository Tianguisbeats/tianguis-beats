"use client";

import React, { useEffect, useState } from 'react';
import { Crown, Video, Loader2, Check, MessageSquare, Mail, ShieldCheck, Zap } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function PremiumHubPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userTier, setUserTier] = useState<string | null>(null);

    const [preferences, setPreferences] = useState({
        tema_perfil: 'dark',
        color_acento: '#2563eb',
        video_destacado_url: '',
        cta_text: '',
        cta_url: '',
        newsletter_active: false
    });

    // Theme Presets
    const THEMES = [
        { id: 'light', name: 'Minimalista (Claro)', bg: 'bg-white', text: 'text-slate-900' },
        { id: 'dark', name: 'Nocturno (Oscuro)', bg: 'bg-slate-900', text: 'text-white' },
        { id: 'neon', name: 'Cyber Neon', bg: 'bg-black', text: 'text-green-400' },
        { id: 'gold', name: 'Luxury Gold', bg: 'bg-slate-900', text: 'text-amber-400' },
    ];

    const ACCENTS = [
        { color: '#2563eb', name: 'Azul Eléctrico' },
        { color: '#dc2626', name: 'Rojo Intenso' },
        { color: '#16a34a', name: 'Verde Éxito' },
        { color: '#9333ea', name: 'Púrpura' },
        { color: '#f59e0b', name: 'Ámbar' },
        { color: '#000000', name: 'Negro Puro' },
    ];

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data: profile } = await supabase
            .from('profiles')
            .select('subscription_tier, tema_perfil, color_acento, video_destacado_url, cta_text, cta_url, newsletter_active')
            .eq('id', user.id)
            .single();

        if (profile) {
            setUserTier(profile.subscription_tier);
            setPreferences({
                tema_perfil: profile.tema_perfil || 'dark',
                color_acento: profile.color_acento || '#2563eb',
                video_destacado_url: profile.video_destacado_url || '',
                cta_text: profile.cta_text || '',
                cta_url: profile.cta_url || '',
                newsletter_active: profile.newsletter_active || false
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
                tema_perfil: preferences.tema_perfil,
                color_acento: preferences.color_acento,
                video_destacado_url: preferences.video_destacado_url,
                cta_text: preferences.cta_text,
                cta_url: preferences.cta_url,
                newsletter_active: preferences.newsletter_active
            })
            .eq('id', user.id);

        if (error) {
            alert("Error al guardar cambios");
        } else {
            alert("¡Perfil actualizado!");
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center p-12 text-muted"><Loader2 className="animate-spin" /></div>;

    // Restrict access to Premium users only
    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-blue-600/10 p-8 rounded-[2.5rem] mb-8 text-blue-600 shadow-2xl shadow-blue-600/10">
                    <Crown size={64} strokeWidth={1.5} />
                </div>
                <h1 className="text-4xl font-black text-foreground uppercase tracking-tighter mb-4">Hub de Beneficios <span className="text-accent">Premium</span></h1>
                <p className="text-muted max-w-md mb-10 font-medium leading-relaxed">
                    Eleva tu perfil al siguiente nivel con video destacado, botones de contacto personalizados y herramientas de marketing exclusivas.
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
                            <ShieldCheck size={12} /> Estado: Verificado
                        </span>
                        <span className="text-muted font-bold text-[10px] uppercase tracking-widest">Tienda Nivel Master</span>
                    </div>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-3 bg-accent text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] hover:bg-foreground hover:text-background transition-all shadow-xl shadow-accent/20 active:scale-95"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : <><Check size={16} /> Guardar Experiencia</>}
                </button>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-8">
                    {/* Featured Video */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-red-500/10 text-red-600 p-3 rounded-2xl">
                                <Video size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-foreground uppercase tracking-tight">Video de Bienvenida</h3>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Highlight tu mejor trabajo</p>
                            </div>
                        </div>

                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">YouTube URL</label>
                        <input
                            value={preferences.video_destacado_url}
                            onChange={e => setPreferences({ ...preferences, video_destacado_url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                        />
                        <p className="text-[10px] text-muted mt-4 font-medium italic opacity-60">
                            * Este video se reproducirá automáticamente en la cabecera de tu perfil para enganchar a los visitantes.
                        </p>
                    </div>

                    {/* Custom Call to Action */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center gap-4 mb-8">
                            <div className="bg-blue-500/10 text-blue-600 p-3 rounded-2xl">
                                <MessageSquare size={24} />
                            </div>
                            <div>
                                <h3 className="font-black text-foreground uppercase tracking-tight">Botón de Acción Directa</h3>
                                <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Convierte fans en clientes</p>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Texto del Botón</label>
                                <input
                                    value={preferences.cta_text}
                                    onChange={e => setPreferences({ ...preferences, cta_text: e.target.value })}
                                    placeholder="Ej. ¡Hablamos por WhatsApp!"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-2">Enlace (URL o WhatsApp)</label>
                                <input
                                    value={preferences.cta_url}
                                    onChange={e => setPreferences({ ...preferences, cta_url: e.target.value })}
                                    placeholder="https://wa.me/tu-numero"
                                    className="w-full bg-slate-50 dark:bg-black/40 border border-slate-100 dark:border-white/5 rounded-2xl px-5 py-4 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Newsletter / Fan Capture */}
                    <div className="bg-white dark:bg-white/5 p-8 rounded-[2.5rem] border border-slate-100 dark:border-white/5 shadow-sm">
                        <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-4">
                                <div className="bg-amber-500/10 text-amber-500 p-3 rounded-2xl">
                                    <Mail size={24} />
                                </div>
                                <div>
                                    <h3 className="font-black text-foreground uppercase tracking-tight">Captura de Fans</h3>
                                    <p className="text-[10px] text-muted font-bold uppercase tracking-widest opacity-60">Crea tu lista de correos</p>
                                </div>
                            </div>
                            <button
                                onClick={() => setPreferences({ ...preferences, newsletter_active: !preferences.newsletter_active })}
                                className={`w-14 h-8 rounded-full transition-all relative ${preferences.newsletter_active ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`}
                            >
                                <div className={`absolute top-1 w-6 h-6 rounded-full bg-white shadow-sm transition-all ${preferences.newsletter_active ? 'left-7' : 'left-1'}`} />
                            </button>
                        </div>

                        <p className="text-sm text-muted font-medium leading-relaxed mb-6">
                            Activa el formulario de suscripción para que tus fans dejen su correo y reciban noticias sobre nuevos beats o descuentos.
                        </p>

                        <div className={`p-6 rounded-[1.5rem] border-2 border-dashed transition-all ${preferences.newsletter_active ? 'border-accent/40 bg-accent/5 opacity-100' : 'border-slate-300 dark:border-white/5 opacity-40'}`}>
                            <div className="flex gap-2">
                                <div className="h-10 flex-1 bg-white dark:bg-white/10 rounded-lg border border-border/50" />
                                <div className="h-10 w-24 bg-accent rounded-lg" />
                            </div>
                            <p className="text-[9px] uppercase font-black tracking-widest text-center mt-3 text-muted">Previsualización del formulario</p>
                        </div>
                    </div>

                    {/* Premium Identity */}
                    <div className="bg-gradient-to-br from-slate-900 to-black p-8 rounded-[2.5rem] border border-white/5 shadow-2xl relative overflow-hidden group">
                        <div className="absolute inset-0 bg-blue-600/5 blur-[80px] group-hover:bg-blue-600/10 transition-all pointer-events-none" />
                        <div className="relative z-10">
                            <h3 className="text-white font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                                <ShieldCheck className="text-accent" /> Identidad Verificada
                            </h3>
                            <p className="text-slate-400 text-xs font-medium leading-relaxed mb-6">
                                Como usuario Premium, tu perfil muestra automáticamente el sello de "Productor Verificado", aumentando la confianza de los compradores.
                            </p>
                            <div className="bg-white/10 p-4 rounded-2xl backdrop-blur-md border border-white/10 inline-flex items-center gap-2">
                                <Check size={14} className="text-accent" />
                                <span className="text-[10px] text-white font-black uppercase tracking-widest">Sello Activo</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
