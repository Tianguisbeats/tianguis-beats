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
        icon: <FileText size={20} />,
        color: 'text-blue-500',
        bg: 'bg-blue-500/10'
    },
    {
        id: 'premium' as ContractType,
        name: 'Licencia Premium (WAV)',
        icon: <Zap size={20} />,
        color: 'text-purple-500',
        bg: 'bg-purple-500/10'
    },
    {
        id: 'unlimited' as ContractType,
        name: 'Ilimitada (STEMS)',
        icon: <Crown size={20} />,
        color: 'text-amber-500',
        bg: 'bg-amber-500/10'
    },
    {
        id: 'exclusive' as ContractType,
        name: 'Compra Exclusiva',
        icon: <ShieldCheck size={20} />,
        color: 'text-emerald-500',
        bg: 'bg-emerald-500/10'
    },
    {
        id: 'soundkit' as ContractType,
        name: 'Sound Kits (Royalty-Free)',
        icon: <Package size={20} />,
        color: 'text-rose-500',
        bg: 'bg-rose-500/10'
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
                    Personaliza los términos legales y límites de cada licencia. Generaremos un PDF World-Class firmado automáticamente para tus clientes en cada venta.
                </p>
            </div>

            {/* Grid de Licencias */}
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {CONTRACT_TYPES.map((contract) => {
                    const isConfigured = !!templates[contract.id];
                    const isCustom = templates[contract.id]?.usar_texto_personalizado;

                    return (
                        <div key={contract.id} className="bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[2.5rem] p-8 shadow-sm hover:shadow-xl hover:border-accent/40 transition-all group">
                            <div className="flex items-center gap-4 mb-6">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${contract.bg} ${contract.color}`}>
                                    {contract.icon}
                                </div>
                                <div className="flex-1">
                                    <h3 className="font-black text-lg text-foreground uppercase tracking-tight leading-tight">
                                        {contract.name}
                                    </h3>
                                    <div className="flex items-center gap-2 mt-1">
                                        <div className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-white/20'}`} />
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest">
                                            {isConfigured ? (isCustom ? 'Texto Libre (Experto)' : 'Límites (Fácil)') : 'Por defecto'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-3 mt-8">
                                <button
                                    onClick={() => openModal(contract.id, 'easy')}
                                    className="w-full py-4 px-6 bg-slate-50 hover:bg-slate-100 dark:bg-white/5 dark:hover:bg-white/10 border border-slate-200 dark:border-white/10 text-foreground rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                                >
                                    <Settings size={14} /> Configurar Parámetros
                                </button>

                                <button
                                    onClick={() => openModal(contract.id, 'expert')}
                                    className="w-full py-4 px-6 bg-accent hover:bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-lg hover:shadow-accent/20 flex items-center justify-center gap-2"
                                >
                                    <AlignLeft size={14} /> Editar Texto Legal
                                </button>
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
                        <div className="p-8 border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-black/20">
                            <div className="flex items-center gap-3 text-accent mb-2">
                                {activeModal.mode === 'easy' ? <Settings size={20} /> : <FileKey size={20} />}
                                <span className="font-bold text-[10px] uppercase tracking-[0.3em]">
                                    {activeModal.mode === 'easy' ? 'Modo Fácil (Límites)' : 'Modo Experto (Redacción Completa)'}
                                </span>
                            </div>
                            <h2 className="text-2xl font-black uppercase text-foreground">
                                {CONTRACT_TYPES.find(t => t.id === activeModal.type)?.name}
                            </h2>
                        </div>

                        {/* Content Modal */}
                        <div className="p-8">
                            {activeModal.mode === 'easy' ? (
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Streams de Audio (Max)</label>
                                        <input
                                            type="text"
                                            value={easyFormData.streams_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, streams_limite: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm text-foreground focus:border-accent outline-none"
                                            placeholder="Ej: 500,000 / Ilimitado"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Distribución / Ventas</label>
                                        <input
                                            type="text"
                                            value={easyFormData.copias_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, copias_limite: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm text-foreground focus:border-accent outline-none"
                                            placeholder="Ej: 5,000 copias"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Videos Musicales</label>
                                        <input
                                            type="text"
                                            value={easyFormData.videos_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, videos_limite: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm text-foreground focus:border-accent outline-none"
                                            placeholder="Ej: 1 Video Monetizado"
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Estaciones de Radio</label>
                                        <input
                                            type="text"
                                            value={easyFormData.radio_limite}
                                            onChange={(e) => setEasyFormData({ ...easyFormData, radio_limite: e.target.value })}
                                            className="w-full bg-slate-50 dark:bg-black border border-slate-200 dark:border-white/10 rounded-xl px-4 py-3 font-bold text-sm text-foreground focus:border-accent outline-none"
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
                                        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl group cursor-pointer" onClick={() => setIncludeProClauses(!includeProClauses)}>
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${includeProClauses ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-tight text-foreground">¿Incluir Cláusulas de Protección Pro?</h4>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">Publishing 50/50, Content ID, Sincronización y Respaldo Legal.</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-colors ${includeProClauses ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeProClauses ? 'left-7' : 'left-1'}`} />
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
                                        <div className="flex items-center justify-between p-4 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl group cursor-pointer" onClick={() => setIncludeProClauses(!includeProClauses)}>
                                            <div className="flex gap-4 items-center">
                                                <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${includeProClauses ? 'bg-emerald-500 text-white' : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                    <ShieldCheck size={20} />
                                                </div>
                                                <div>
                                                    <h4 className="text-xs font-black uppercase tracking-tight text-foreground">Añadir Adéndum de Protección Pro</h4>
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">Agregaremos las 5 Cláusulas de Oro de Tianguis Beats al final de tu texto.</p>
                                                </div>
                                            </div>
                                            <div className={`w-12 h-6 rounded-full relative transition-colors ${includeProClauses ? 'bg-emerald-500' : 'bg-slate-300 dark:bg-slate-700'}`}>
                                                <div className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-all ${includeProClauses ? 'left-7' : 'left-1'}`} />
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
