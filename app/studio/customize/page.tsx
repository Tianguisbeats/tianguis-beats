"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Palette, Layout, Video, Loader2, Check } from 'lucide-react';
import Link from 'next/link';

export default function CustomizePage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userTier, setUserTier] = useState<string | null>(null);

    const [preferences, setPreferences] = useState({
        tema_perfil: 'light',
        color_acento: '#2563eb', // Default blue-600
        video_destacado_url: ''
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
            .select('subscription_tier, tema_perfil, color_acento, video_destacado_url')
            .eq('id', user.id)
            .single();

        if (profile) {
            setUserTier(profile.subscription_tier);
            setPreferences({
                tema_perfil: profile.tema_perfil || 'light',
                color_acento: profile.color_acento || '#2563eb',
                video_destacado_url: profile.video_destacado_url || ''
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
                video_destacado_url: preferences.video_destacado_url
            })
            .eq('id', user.id);

        if (error) {
            alert("Error al guardar cambios");
        } else {
            alert("¡Perfil actualizado!");
        }
        setSaving(false);
    };

    if (loading) return <div className="flex justify-center p-12"><Loader2 className="animate-spin text-slate-400" /></div>;

    // Restrict access to Premium users only
    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-amber-100 p-6 rounded-full mb-6 text-amber-600">
                    <Palette size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-4">Personalización Premium</h1>
                <p className="text-slate-500 max-w-md mb-8">
                    Desbloquea temas oscuros, colores personalizados y video de bienvenida. Haz que tu marca destaque.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Mejorar a Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-4xl">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tighter uppercase">Personalizar Perfil</h1>
                    <p className="text-slate-400 font-bold text-xs uppercase tracking-widest mt-1">Define la identidad visual de tu tienda</p>
                </div>
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="flex items-center gap-2 bg-slate-900 text-white px-8 py-3 rounded-xl font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-lg"
                >
                    {saving ? <Loader2 size={16} className="animate-spin" /> : "Guardar Cambios"}
                </button>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* Theme Selector */}
                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-purple-50 text-purple-600 p-2 rounded-lg">
                            <Layout size={20} />
                        </div>
                        <h3 className="font-bold text-slate-900">Tema del Perfil</h3>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        {THEMES.map(theme => (
                            <button
                                key={theme.id}
                                onClick={() => setPreferences({ ...preferences, tema_perfil: theme.id })}
                                className={`relative p-4 rounded-xl border-2 text-left transition-all ${preferences.tema_perfil === theme.id ? 'border-purple-600 ring-2 ring-purple-100' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                <div className={`aspect-video rounded-lg mb-3 ${theme.bg} ${theme.text} flex items-center justify-center text-[10px] font-black uppercase tracking-widest border border-black/5`}>
                                    Preview
                                </div>
                                <span className="text-xs font-bold text-slate-700 block">{theme.name}</span>
                                {preferences.tema_perfil === theme.id && (
                                    <div className="absolute top-2 right-2 bg-purple-600 text-white p-1 rounded-full">
                                        <Check size={12} />
                                    </div>
                                )}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-8">
                    {/* Accent Color */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-blue-50 text-blue-600 p-2 rounded-lg">
                                <Palette size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Color de Acento</h3>
                        </div>

                        <div className="flex flex-wrap gap-4">
                            {ACCENTS.map(acc => (
                                <button
                                    key={acc.color}
                                    onClick={() => setPreferences({ ...preferences, color_acento: acc.color })}
                                    className={`w-12 h-12 rounded-full border-4 transition-all ${preferences.color_acento === acc.color ? 'border-slate-900 scale-110' : 'border-transparent hover:scale-110'}`}
                                    style={{ backgroundColor: acc.color }}
                                    title={acc.name}
                                >
                                    {preferences.color_acento === acc.color && <Check size={20} className="text-white mx-auto" />}
                                </button>
                            ))}
                            <div className="relative">
                                <input
                                    type="color"
                                    value={preferences.color_acento}
                                    onChange={(e) => setPreferences({ ...preferences, color_acento: e.target.value })}
                                    className="w-12 h-12 rounded-full overflow-hidden cursor-pointer"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Featured Video */}
                    <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="bg-red-50 text-red-600 p-2 rounded-lg">
                                <Video size={20} />
                            </div>
                            <h3 className="font-bold text-slate-900">Video Destacado</h3>
                        </div>

                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">YouTube URL</label>
                        <input
                            value={preferences.video_destacado_url}
                            onChange={e => setPreferences({ ...preferences, video_destacado_url: e.target.value })}
                            placeholder="https://youtube.com/watch?v=..."
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 font-medium text-slate-600 text-xs focus:outline-none focus:ring-2 focus:ring-slate-900"
                        />
                        <p className="text-[10px] text-slate-400 mt-2">
                            Este video aparecerá en la parte superior de tu perfil (Solo Premium).
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
