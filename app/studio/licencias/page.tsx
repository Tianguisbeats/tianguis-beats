"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    FileText, Settings, ShieldCheck, FileKey, Crown, Zap,
    Package, AlignLeft, Info, Loader2, Music, Check, X
} from 'lucide-react';
import { useToast } from '@/context/ToastContext';

export type ContractType = 'basica' | 'mp3' | 'pro' | 'premium' | 'ilimitada' | 'exclusiva' | 'soundkit';

const CONTRACT_TYPES = [
    {
        id: 'basica' as ContractType,
        name: 'Licencia Gratis',
        tier: 'FREE',
        description: 'Uso personal / promocional con tag de voz.',
        icon: <FileText size={26} />,
        color: 'text-slate-400',
        iconBg: 'bg-slate-400/10',
        borderColor: 'border-slate-400/20',
        glowColor: 'shadow-slate-400/10',
        accentLine: 'via-slate-400',
        badgeBg: 'bg-slate-400/10 text-slate-400',
    },
    {
        id: 'mp3' as ContractType,
        name: 'Licencia Básica',
        tier: 'MP3 HQ',
        description: 'MP3 de alta calidad sin tag. Distribución estándar.',
        icon: <Music size={26} />,
        color: 'text-blue-400',
        iconBg: 'bg-blue-500/10',
        borderColor: 'border-blue-500/20',
        glowColor: 'shadow-blue-500/10',
        accentLine: 'via-blue-500',
        badgeBg: 'bg-blue-500/10 text-blue-400',
    },
    {
        id: 'pro' as ContractType,
        name: 'Licencia Pro',
        tier: 'PRO',
        description: 'MP3 + WAV con límites de distribución extendidos.',
        icon: <Zap size={26} />,
        color: 'text-indigo-400',
        iconBg: 'bg-indigo-500/10',
        borderColor: 'border-indigo-500/20',
        glowColor: 'shadow-indigo-500/10',
        accentLine: 'via-indigo-500',
        badgeBg: 'bg-indigo-500/10 text-indigo-400',
    },
    {
        id: 'premium' as ContractType,
        name: 'Licencia Premium',
        tier: 'ESTUDIO WAV',
        description: 'WAV de calidad estudio. Altos límites de explotación.',
        icon: <Package size={26} />,
        color: 'text-purple-400',
        iconBg: 'bg-purple-500/10',
        borderColor: 'border-purple-500/20',
        glowColor: 'shadow-purple-500/10',
        accentLine: 'via-purple-500',
        badgeBg: 'bg-purple-500/10 text-purple-400',
    },
    {
        id: 'ilimitada' as ContractType,
        name: 'Licencia Ilimitada',
        tier: 'TODOS LOS ARCHIVOS',
        description: 'Todos los formatos. Sin límites comerciales.',
        icon: <Crown size={26} />,
        color: 'text-amber-400',
        iconBg: 'bg-amber-500/10',
        borderColor: 'border-amber-500/20',
        glowColor: 'shadow-amber-500/10',
        accentLine: 'via-amber-500',
        badgeBg: 'bg-amber-500/10 text-amber-400',
    },
    {
        id: 'exclusiva' as ContractType,
        name: 'Compra Exclusiva',
        tier: 'EXCLUSIVA',
        description: 'Cesión completa de derechos exclusivos sobre el beat.',
        icon: <ShieldCheck size={26} />,
        color: 'text-emerald-400',
        iconBg: 'bg-emerald-500/10',
        borderColor: 'border-emerald-500/20',
        glowColor: 'shadow-emerald-500/10',
        accentLine: 'via-emerald-500',
        badgeBg: 'bg-emerald-500/10 text-emerald-400',
    }
];

export default function ContractsPage() {
    const { showToast } = useToast();
    const [loading, setLoading] = useState(true);
    const [templates, setTemplates] = useState<Record<string, any>>({});
    const [activeModal, setActiveModal] = useState<{
        isOpen: boolean;
        type: ContractType | null;
        mode: 'easy' | 'expert' | null;
    }>({ isOpen: false, type: null, mode: null });

    const [easyFormData, setEasyFormData] = useState({
        streams_limite: '10000',
        copias_limite: '2000',
        videos_limite: '1',
        radio_limite: '2'
    });
    const [expertFormData, setExpertFormData] = useState({ texto_legal: '' });
    const [includeProClauses, setIncludeProClauses] = useState(true);

    useEffect(() => { fetchTemplates(); }, []);

    const fetchTemplates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;
            const { data, error } = await supabase.from('licencias').select('*').eq('productor_id', user.id);
            if (error) { console.warn('Licencias table:', error.message); setLoading(false); return; }
            const mapped: Record<string, any> = {};
            data?.forEach(t => { mapped[t.tipo] = t; });
            setTemplates(mapped);
        } catch (error) { console.error(error); }
        finally { setLoading(false); }
    };

    const openModal = (type: ContractType, mode: 'easy' | 'expert') => {
        const existing = templates[type];
        if (mode === 'easy') {
            setEasyFormData({
                streams_limite: existing?.streams_limite || '10000',
                copias_limite: existing?.copias_limite || '2000',
                videos_limite: existing?.videos_limite || '1',
                radio_limite: existing?.radio_limite || '2'
            });
        } else {
            setExpertFormData({ texto_legal: existing?.texto_legal || getDefaultLegalText(type) });
        }
        setIncludeProClauses(existing?.incluir_clausulas_pro ?? true);
        setActiveModal({ isOpen: true, type, mode });
    };

    const getDefaultLegalText = (type: ContractType) => {
        const defaults: Record<string, string> = {
            basica: "LICENCIA GRATIS: Este contrato otorga derechos no exclusivos de uso sobre el Beat para fines promocionales. Descarga MP3 con etiqueta de voz (Tag).",
            mp3: "LICENCIA BÁSICA: Derechos no exclusivos con descarga de archivo MP3 de alta calidad (High Quality limpio). Limite estándar de distribución.",
            pro: "LICENCIA PRO: Derechos no exclusivos con limites extendidos de distribución y reproducciones. Descarga MP3 / WAV.",
            premium: "LICENCIA PREMIUM: Derechos no exclusivos con calidad de estudio profesional (WAV). Altos límites de explotación.",
            ilimitada: "LICENCIA ILIMITADA: Derechos no exclusivos con acceso a todos los archivos y sin limites comerciales.",
            exclusiva: "COMPRA EXCLUSIVA: Cesión de derechos exclusivos sobre el instrumental."
        };
        return defaults[type] || '';
    };

    const handleSaveTemplate = async () => {
        if (!activeModal.type) return;
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No autenticado");
            const payload = {
                productor_id: user.id,
                tipo: activeModal.type,
                usar_texto_personalizado: activeModal.mode === 'expert',
                incluir_clausulas_pro: includeProClauses,
                ...(activeModal.mode === 'easy' ? easyFormData : { texto_legal: expertFormData.texto_legal })
            };
            const { error } = await supabase.from('licencias').upsert(payload, { onConflict: 'productor_id, tipo' });
            if (error) {
                if (error.code === '42P01') throw new Error("La tabla de licencias no existe. Ejecuta el SQL en Supabase primero.");
                throw error;
            }
            showToast("Licencia guardada exitosamente", "success");
            await fetchTemplates();
            setActiveModal({ isOpen: false, type: null, mode: null });
        } catch (error: any) {
            showToast(`Error: ${error.message}`, "error");
        }
    };

    if (loading) return (
        <div className="flex flex-col items-center justify-center py-24 animate-pulse">
            <div className="w-16 h-16 bg-slate-200 dark:bg-white/5 rounded-[2rem] mb-6 flex items-center justify-center">
                <Loader2 className="animate-spin text-accent/20" size={32} />
            </div>
            <div className="h-4 w-32 bg-slate-200 dark:bg-white/5 rounded-full" />
        </div>
    );

    const activeContract = CONTRACT_TYPES.find(t => t.id === activeModal.type);

    return (
        <div className="space-y-16 pb-20">
            {/* Header */}
            <div className="space-y-6">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 border border-accent/20 rounded-full">
                    <span className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-accent">Sistema de Licenciamiento v2.0</span>
                </div>
                <div className="space-y-2">
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground leading-[1] flex flex-col">
                        Tus
                        <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Licencias.</span>
                    </h1>
                    <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-[0.4em] opacity-60 ml-1">
                        Personaliza los términos legales y límites de cada tipo
                    </p>
                </div>
            </div>

            {/* Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {CONTRACT_TYPES.map((contract) => {
                    const isConfigured = !!templates[contract.id];
                    const isCustom = templates[contract.id]?.usar_texto_personalizado;

                    return (
                        <div
                            key={contract.id}
                            className={`group relative bg-white dark:bg-[#020205] border rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl ${contract.borderColor} shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)] ${contract.glowColor}`}
                        >
                            {/* Top accent line */}
                            <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${contract.accentLine} to-transparent opacity-60 group-hover:opacity-100 transition-opacity`} />

                            {/* Ambient glow on hover */}
                            <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full ${contract.iconBg} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                            <div className="relative z-10 p-8 flex flex-col h-full">
                                {/* Icon + Tier badge */}
                                <div className="flex items-start justify-between mb-6">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${contract.iconBg} ${contract.color} group-hover:scale-110 transition-transform duration-500`}>
                                        {contract.icon}
                                    </div>
                                    <span className={`px-3 py-1 rounded-xl text-[8px] font-black uppercase tracking-widest border ${contract.borderColor} ${contract.badgeBg}`}>
                                        {contract.tier}
                                    </span>
                                </div>

                                {/* Name & description */}
                                <div className="mb-6">
                                    <h3 className={`font-black text-xl uppercase tracking-tighter leading-tight mb-2 ${contract.color}`}>
                                        {contract.name}
                                    </h3>
                                    <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-widest leading-relaxed opacity-60">
                                        {contract.description}
                                    </p>
                                </div>

                                {/* Status indicator */}
                                <div className="flex items-center gap-2 mb-8">
                                    <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-white/20'}`} />
                                    <span className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">
                                        {isConfigured ? (isCustom ? 'Contrato personalizado' : 'Parámetros configurados') : 'Sin configurar · Usa plantilla base'}
                                    </span>
                                </div>

                                {/* Action buttons */}
                                <div className="space-y-3 mt-auto">
                                    <button
                                        onClick={() => openModal(contract.id, 'easy')}
                                        className={`w-full py-4 px-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between border ${contract.borderColor} bg-slate-50 dark:bg-white/5 text-slate-700 dark:text-foreground hover:bg-white dark:hover:bg-white/10 active:scale-95 shadow-sm`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <Settings size={14} className={`${contract.color} group-[&]:rotate-90 transition-transform`} />
                                            Modo Parámetros
                                        </div>
                                        <div className={`w-5 h-5 rounded-full ${contract.iconBg} ${contract.color} flex items-center justify-center`}>
                                            <Zap size={9} fill="currentColor" />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => openModal(contract.id, 'expert')}
                                        className={`w-full py-4 px-5 bg-slate-900 dark:bg-white/5 text-white dark:text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-between hover:${contract.iconBg} active:scale-95 shadow-xl border border-transparent hover:${contract.borderColor}`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlignLeft size={14} />
                                            Redactar Contrato
                                        </div>
                                        <ShieldCheck size={16} className={`opacity-40 group-hover:opacity-100 ${contract.color} transition-opacity`} />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal */}
            {activeModal.isOpen && activeModal.type && activeContract && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setActiveModal({ isOpen: false, type: null, mode: null })} />

                    <div className="relative w-full max-w-2xl bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-white/5 rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Modal top line */}
                        <div className={`absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent ${activeContract.accentLine} to-transparent`} />

                        {/* Modal Header */}
                        <div className="p-10 border-b border-slate-200 dark:border-white/10">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${activeContract.badgeBg} border ${activeContract.borderColor}`}>
                                    {activeModal.mode === 'easy' ? <Settings size={12} /> : <FileKey size={12} />}
                                    {activeModal.mode === 'easy' ? 'Modo Parámetros' : 'Modo Experto'}
                                </div>
                                <button
                                    onClick={() => setActiveModal({ isOpen: false, type: null, mode: null })}
                                    className="w-10 h-10 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                                >
                                    <X size={18} />
                                </button>
                            </div>
                            <h2 className={`text-3xl font-black uppercase tracking-tighter ${activeContract.color}`}>
                                {activeContract.name}
                            </h2>
                            <p className="text-muted text-[11px] font-bold uppercase tracking-widest mt-1 opacity-60">{activeContract.description}</p>
                        </div>

                        {/* Modal Content */}
                        <div className="p-8 overflow-y-auto max-h-[60vh]">
                            {activeModal.mode === 'easy' ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    {[
                                        { label: 'Streams de Audio (Max)', key: 'streams_limite', placeholder: 'Ej: 500,000 / Ilimitado' },
                                        { label: 'Distribución / Ventas', key: 'copias_limite', placeholder: 'Ej: 5,000 copias' },
                                        { label: 'Videos Musicales', key: 'videos_limite', placeholder: 'Ej: 1 Video Monetizado' },
                                        { label: 'Estaciones de Radio', key: 'radio_limite', placeholder: 'Ej: 2 Estaciones FM' },
                                    ].map(field => (
                                        <div key={field.key} className="space-y-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">{field.label}</label>
                                            <input
                                                type="text"
                                                value={(easyFormData as any)[field.key]}
                                                onChange={(e) => setEasyFormData({ ...easyFormData, [field.key]: e.target.value })}
                                                className={`w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm text-foreground focus:outline-none focus:border-current transition-all shadow-inner ${activeContract.color}`}
                                                placeholder={field.placeholder}
                                            />
                                        </div>
                                    ))}
                                    <div className="col-span-full p-4 bg-blue-500/10 border border-blue-500/20 rounded-2xl flex gap-3 text-blue-500">
                                        <Info size={16} className="shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                            Estos límites se insertarán automáticamente en la plantilla profesional de Tianguis Beats.
                                        </p>
                                    </div>

                                    <div className="col-span-full pt-6 border-t border-slate-200 dark:border-white/10">
                                        <div
                                            className={`flex items-center justify-between p-6 rounded-3xl cursor-pointer transition-all duration-500 border ${includeProClauses ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                                            onClick={() => setIncludeProClauses(!includeProClauses)}
                                        >
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${includeProClauses ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                    <ShieldCheck size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground">¿Activar Protección Pro?</h4>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Inyectar las 5 Cláusulas de Oro de Tianguis.</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${includeProClauses ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${includeProClauses ? 'left-7' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-500">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                            ⚠️ Al modificar este texto asumes responsabilidad total de los términos entre tú y el comprador.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Contrato Principal</label>
                                            <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Variables: {'{ARTISTA}'}, {'{BEAT}'}</span>
                                        </div>
                                        <textarea
                                            rows={10}
                                            value={expertFormData.texto_legal}
                                            onChange={(e) => setExpertFormData({ texto_legal: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-2xl p-5 font-mono text-xs text-foreground focus:border-accent outline-none resize-y leading-relaxed"
                                            placeholder="Escribe aquí el texto completo de tu contrato de licenciamiento..."
                                        />
                                    </div>
                                    <div className="pt-4 border-t border-slate-200 dark:border-white/10">
                                        <div
                                            className={`flex items-center justify-between p-6 rounded-3xl cursor-pointer transition-all duration-500 border ${includeProClauses ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                                            onClick={() => setIncludeProClauses(!includeProClauses)}
                                        >
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all duration-500 ${includeProClauses ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                    <ShieldCheck size={22} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Inyectar Adéndum Pro</h4>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Añadir las 5 Cláusulas de Oro al final de tu texto.</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-all duration-500 ${includeProClauses ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all duration-500 shadow-md ${includeProClauses ? 'left-7' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Modal Footer */}
                        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex gap-4 justify-end">
                            <button
                                onClick={() => setActiveModal({ isOpen: false, type: null, mode: null })}
                                className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                className={`px-8 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl ${activeContract.iconBg} ${activeContract.color} border ${activeContract.borderColor}`}
                            >
                                <Check size={14} className="inline mr-2" />
                                Guardar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
