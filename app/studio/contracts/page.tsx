"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { FileText, Settings, ShieldCheck, FileKey, Crown, Zap, Package, AlignLeft, Info, Loader2 } from 'lucide-react';
import { useToast } from '@/context/ToastContext';

// Define the License Types available
export type ContractType = 'basic' | 'premium' | 'unlimited' | 'exclusive' | 'soundkit';

const CONTRACT_TYPES = [
    {
        id: 'basic' as ContractType,
        name: 'Licencia Básica (MP3)',
        icon: <FileText size={24} />,
        color: 'text-blue-500',
        gradient: 'from-blue-500/20 to-blue-400/5',
        glow: 'group-hover:shadow-blue-500/20'
    },
    {
        id: 'premium' as ContractType,
        name: 'Licencia Premium (WAV)',
        icon: <Zap size={24} />,
        color: 'text-purple-500',
        gradient: 'from-purple-500/20 to-purple-400/5',
        glow: 'group-hover:shadow-purple-500/20'
    },
    {
        id: 'unlimited' as ContractType,
        name: 'Ilimitada (STEMS)',
        icon: <Crown size={24} />,
        color: 'text-amber-500',
        gradient: 'from-amber-500/20 to-amber-400/5',
        glow: 'group-hover:shadow-amber-500/20'
    },
    {
        id: 'exclusive' as ContractType,
        name: 'Compra Exclusiva',
        icon: <ShieldCheck size={24} />,
        color: 'text-emerald-500',
        gradient: 'from-emerald-500/20 to-emerald-400/5',
        glow: 'group-hover:shadow-emerald-500/20'
    },
    {
        id: 'soundkit' as ContractType,
        name: 'Sound Kits (Royalty-Free)',
        icon: <Package size={24} />,
        color: 'text-rose-500',
        gradient: 'from-rose-500/20 to-rose-400/5',
        glow: 'group-hover:shadow-rose-500/20'
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

    // Formularios Temporales
    const [easyFormData, setEasyFormData] = useState({
        streams_limite: '10000',
        copias_limite: '2000',
        videos_limite: '1',
        radio_limite: '2'
    });
    const [expertFormData, setExpertFormData] = useState({
        texto_legal: ''
    });
    const [includeProClauses, setIncludeProClauses] = useState(true);

    useEffect(() => {
        fetchTemplates();
    }, []);

    const fetchTemplates = async () => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) return;

            const { data, error } = await supabase
                .from('licencias_plantillas')
                .select('*')
                .eq('productor_id', user.id);

            if (error) {
                // If the table doesn't exist yet, we catch it silently for now 
                // leaving templates empty until the SQL migration is run
                console.warn('Licencias table might not exist yet:', error.message);
                setLoading(false);
                return;
            }

            const mapped: Record<string, any> = {};
            data?.forEach(t => {
                mapped[t.tipo] = t;
            });
            setTemplates(mapped);
        } catch (error) {
            console.error("Error fetching templates:", error);
        } finally {
            setLoading(false);
        }
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
            setExpertFormData({
                texto_legal: existing?.texto_legal || getDefaultLegalText(type)
            });
        }
        setIncludeProClauses(existing?.incluir_clausulas_pro ?? true);

        setActiveModal({ isOpen: true, type, mode });
    };

    const getDefaultLegalText = (type: ContractType) => {
        // Textos por defecto si no ha configurado ninguno
        const defaults: Record<string, string> = {
            basic: "LICENCIA BÁSICA: Este contrato otorga derechos no exclusivos de uso sobre el Beat para crear una (1) Nueva Canción. Límite de streams: 10,000.",
            premium: "LICENCIA PREMIUM: Derechos no exclusivos para distribución comercial en plataformas. Límite de streams: 500,000.",
            unlimited: "LICENCIA ILIMITADA: Derechos no exclusivos para explotación comercial sin límite numérico de regalías.",
            exclusive: "COMPRA EXCLUSIVA: Cesión total y permanente de la posesión y explotación del instrumental (Master).",
            soundkit: "LICENCIA ROYALTY-FREE: Todos los audios pueden ser usados libremente en construcciones de Beats, sin regalías."
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

            const { error } = await supabase
                .from('licencias_plantillas')
                .upsert(payload, { onConflict: 'productor_id, tipo' });

            if (error) {
                if (error.code === '42P01') {
                    throw new Error("La tabla de contratos no existe. Por favor ejecuta el archivo SQL en Supabase primero.");
                }
                throw error;
            }

            showToast("Contrato guardado exitosamente", "success");
            await fetchTemplates(); // Recargar datos
            setActiveModal({ isOpen: false, type: null, mode: null });

        } catch (error: any) {
            console.error("Error saving template:", error);
            showToast(`Error: ${error.message}`, "error");
        }
    };


    if (loading) return (
        <div className="flex justify-center py-20 animate-pulse">
            <Loader2 className="animate-spin text-accent" size={32} />
        </div>
    );

    return (
        <div className="space-y-12 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-4">
                    Tus <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Contratos</span>
                </h1>
                <p className="text-muted text-xs font-bold uppercase tracking-widest max-w-2xl">
                    Personaliza los términos legales y límites de cada licencia.
                </p>
            </div>

            {/* Grid de Licencias */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 animate-in fade-in slide-in-from-bottom-5 duration-700">
                {CONTRACT_TYPES.map((contract) => {
                    const isConfigured = !!templates[contract.id];
                    const isCustom = templates[contract.id]?.usar_texto_personalizado;

                    return (
                        <div key={contract.id} className={`relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 shadow-sm hover:shadow-2xl transition-all duration-500 group overflow-hidden ${contract.glow}`}>
                            {/* Background Glow Ornament */}
                            <div className={`absolute -top-20 -right-20 w-40 h-40 rounded-full bg-gradient-to-br ${contract.gradient} blur-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-700`} />

                            <div className="relative z-10">
                                <div className="flex items-center gap-5 mb-10">
                                    <div className={`w-16 h-16 rounded-3xl flex items-center justify-center bg-gradient-to-br ${contract.gradient} ${contract.color} shadow-inner`}>
                                        {contract.icon}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className="font-black text-xl text-foreground uppercase tracking-tighter leading-tight italic">
                                            {contract.name}
                                        </h3>
                                        <div className="flex items-center gap-2 mt-2">
                                            <div className={`w-2.5 h-2.5 rounded-full ${isConfigured ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-300 dark:bg-white/20'}`} />
                                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.2em]">
                                                {isConfigured ? (isCustom ? 'PRO: TEXTO LIBRE' : 'PRO: PARÁMETROS') : 'CONFIGURACIÓN BASE'}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4 mt-4">
                                    <button
                                        onClick={() => openModal(contract.id, 'easy')}
                                        className="w-full py-5 px-6 bg-slate-50 hover:bg-white dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-foreground rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-between group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <Settings size={16} className="text-muted group-hover/btn:rotate-90 transition-transform duration-500" />
                                            Modo Parámetros
                                        </div>
                                        <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-white/10 flex items-center justify-center group-hover/btn:bg-accent group-hover/btn:text-white transition-colors">
                                            <Zap size={10} />
                                        </div>
                                    </button>

                                    <button
                                        onClick={() => openModal(contract.id, 'expert')}
                                        className="w-full py-5 px-6 bg-[#0a0a0b] hover:bg-accent text-white rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all shadow-xl hover:shadow-accent/40 flex items-center justify-between group/btn"
                                    >
                                        <div className="flex items-center gap-3">
                                            <AlignLeft size={16} /> Redactar Contrato
                                        </div>
                                        <ShieldCheck size={18} className="opacity-40 group-hover/btn:opacity-100 transition-opacity" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>

            {/* Modal Compartido */}
            {activeModal.isOpen && activeModal.type && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in" onClick={() => setActiveModal({ isOpen: false, type: null, mode: null })} />

                    <div className="relative w-full max-w-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
                        {/* Header Modal */}
                        <div className="p-10 border-b border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 backdrop-blur-xl">
                            <div className="flex items-center gap-3 text-accent mb-3">
                                <div className="p-2 bg-accent/10 rounded-lg">
                                    {activeModal.mode === 'easy' ? <Settings size={22} /> : <FileKey size={22} />}
                                </div>
                                <span className="font-black text-[11px] uppercase tracking-[0.4em] italic">
                                    {activeModal.mode === 'easy' ? 'Módulo de Parámetros' : 'Redacción de Autor'}
                                </span>
                            </div>
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">
                                {CONTRACT_TYPES.find(t => t.id === activeModal.type)?.name}
                            </h2>
                        </div>

                        {/* Content Modal */}
                        <div className="p-8">
                            {activeModal.mode === 'easy' ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Streams de Audio (Max)</label>
                                        <input
                                            type="text"
                                            value={easyFormData.streams_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, streams_limite: e.target.value })}
                                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm text-foreground focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none shadow-inner"
                                            placeholder="Ej: 500,000 / Ilimitado"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Distribución / Ventas</label>
                                        <input
                                            type="text"
                                            value={easyFormData.copias_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, copias_limite: e.target.value })}
                                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm text-foreground focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none shadow-inner"
                                            placeholder="Ej: 5,000 copias"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Videos Musicales</label>
                                        <input
                                            type="text"
                                            value={easyFormData.videos_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, videos_limite: e.target.value })}
                                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm text-foreground focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none shadow-inner"
                                            placeholder="Ej: 1 Video Monetizado"
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.2em] text-muted ml-1">Estaciones de Radio</label>
                                        <input
                                            type="text"
                                            value={easyFormData.radio_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, radio_limite: e.target.value })}
                                            className="w-full bg-slate-100 dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl px-5 py-4 font-bold text-sm text-foreground focus:border-accent focus:ring-4 focus:ring-accent/10 transition-all outline-none shadow-inner"
                                            placeholder="Ej: 2 Estaciones FM"
                                        />
                                    </div>
                                    <div className="col-span-full mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl flex gap-3 text-blue-600 dark:text-blue-400">
                                        <Info size={16} className="shrink-0 mt-0.5" />
                                        <p className="text-[10px] font-bold uppercase tracking-widest leading-relaxed">
                                            Modo Fácil: Insertaremos estos límites automáticamente en la plantilla base profesional de Tianguis Beats.
                                        </p>
                                    </div>

                                    {/* Toggle Cláusulas Pro */}
                                    <div className="col-span-full mt-2 pt-6 border-t border-slate-200 dark:border-white/10">
                                        <div
                                            className={`flex items-center justify-between p-6 rounded-3xl group cursor-pointer transition-all duration-500 border ${includeProClauses ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                                            onClick={() => setIncludeProClauses(!includeProClauses)}
                                        >
                                            <div className="flex gap-5 items-center">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-lg ${includeProClauses ? 'bg-emerald-500 text-white scale-110 rotate-[10deg]' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                    <ShieldCheck size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground">¿Activar Protección Pro de Tianguis?</h4>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Inyectar las 5 Cláusulas de Oro y Sello de Seguridad Real.</p>
                                                </div>
                                            </div>
                                            <div className={`w-14 h-7 rounded-full relative transition-all duration-500 ${includeProClauses ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-md ${includeProClauses ? 'left-8' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-6">
                                    <div className="p-4 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-600 dark:text-rose-400">
                                        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed">
                                            ⚠️ DISCLAIMER LEGAL: Al modificar este texto, sobrescribes la plantilla oficial de Tianguis Beats. Asumes la total y absoluta responsabilidad de los términos estipulados entre tú y el comprador.
                                        </p>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="flex justify-between items-center mb-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Contrato Principal</label>
                                            <span className="text-[9px] font-bold text-accent uppercase tracking-widest">Variables soportadas: {'{ARTISTA}'}, {'{BEAT}'}</span>
                                        </div>
                                        <textarea
                                            rows={10}
                                            value={expertFormData.texto_legal}
                                            onChange={(e) => setExpertFormData({ texto_legal: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl p-5 font-mono text-xs text-foreground focus:border-accent outline-none resize-y leading-relaxed"
                                            placeholder="Escribe todo el texto de tu contrato de licenciamiento aquí..."
                                        />
                                    </div>

                                    {/* Toggle Cláusulas Pro en Modo Experto */}
                                    <div className="mt-4 pt-6 border-t border-slate-200 dark:border-white/10">
                                        <div
                                            className={`flex items-center justify-between p-6 rounded-3xl group cursor-pointer transition-all duration-500 border ${includeProClauses ? 'bg-emerald-500/10 border-emerald-500/40 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'bg-slate-100 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}
                                            onClick={() => setIncludeProClauses(!includeProClauses)}
                                        >
                                            <div className="flex gap-5 items-center">
                                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all duration-700 shadow-lg ${includeProClauses ? 'bg-emerald-500 text-white scale-110 rotate-[10deg]' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                    <ShieldCheck size={28} />
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-black uppercase tracking-tight text-foreground">Inyectar Adéndum Pro</h4>
                                                    <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">Añadiremos las 5 Cláusulas de Oro al final de tu texto.</p>
                                                </div>
                                            </div>
                                            <div className={`w-14 h-7 rounded-full relative transition-all duration-500 ${includeProClauses ? 'bg-emerald-500' : 'bg-slate-400 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-all duration-500 shadow-md ${includeProClauses ? 'left-8' : 'left-1'}`} />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer Actions */}
                        <div className="p-6 border-t border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20 flex gap-4 justify-end">
                            <button
                                onClick={() => setActiveModal({ isOpen: false, type: null, mode: null })}
                                className="px-6 py-3 font-black text-[10px] uppercase tracking-widest text-muted hover:text-foreground transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveTemplate}
                                className="px-8 py-3 bg-foreground text-background dark:bg-white dark:text-black rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-xl"
                            >
                                Guardar Contrato
                            </button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
}
