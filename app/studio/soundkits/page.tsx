"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Plus, Edit3, Trash2, Loader2, Package,
    ArrowUpRight, Music, Layers, Briefcase, 
    Upload, FileArchive, AlertCircle, Crown, Info, X, DollarSign
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Switch from '@/components/ui/Switch';
import LoadingTianguis from '@/components/LoadingTianguis';
import { useToast } from '@/context/ToastContext';

// Tipos
type SoundKit = {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    url_archivo: string;
    archivo_muestra_url?: string;
    url_portada?: string;
    es_publico: boolean;
    esta_desactivado_por_plan?: boolean;
    fecha_creacion: string;
};

export default function SoundKitsManagerPageWrapper() {
    return (
        <Suspense fallback={<LoadingTianguis />}>
            <SoundKitsManagerPage />
        </Suspense>
    );
}

function SoundKitsManagerPage() {
    const searchParams = useSearchParams();
    const [soundKits, setSoundKits] = useState<SoundKit[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<string | null>(null);

    // Form State Sound Kits
    const [isEditingKit, setIsEditingKit] = useState(false);
    const [currentKit, setCurrentKit] = useState<Partial<SoundKit> | null>(null);
    const [initialKit, setInitialKit] = useState<Partial<SoundKit> | null>(null);
    const [kitErrors, setKitErrors] = useState<Record<string, string>>({});
    const [kitSaving, setKitSaving] = useState(false);
    const [kitFile, setKitFile] = useState<File | null>(null);
    const [kitSampleFile, setKitSampleFile] = useState<File | null>(null);
    const [kitCoverFile, setKitCoverFile] = useState<File | null>(null);

    const [username, setUsername] = useState<string>('');
    const { showToast } = useToast();

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            setLoading(false);
            return;
        }

        // Get Tier & Username
        const { data: profile } = await supabase.from('perfiles').select('nivel_suscripcion, nombre_usuario').eq('id', user.id).single();
        setUserTier(profile?.nivel_suscripcion);
        if (profile?.nombre_usuario) setUsername(profile.nombre_usuario);

        // Get Sound Kits
        const { data: kitsData } = await supabase
            .from('kits_sonido')
            .select('*')
            .eq('productor_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (kitsData) setSoundKits(kitsData);

        // Check for Sound Kit license active status
        const { data: lics } = await supabase.from('licencias').select('soundkits_activa').eq('productor_id', user.id).single();
        const isLicenseActive = lics?.soundkits_activa ?? false;

        setLoading(false);
        return isLicenseActive;
    };

    const handleTogglePublicKit = async (id: string, currentStatus: boolean, deactivated?: boolean) => {
        if (deactivated) {
            showToast('Mejora tu plan para activar este Sound Kit', 'error');
            return;
        }
        const { error } = await supabase
            .from('kits_sonido')
            .update({ es_publico: !currentStatus })
            .eq('id', id);

        if (!error) {
            setSoundKits(prev => prev.map(k => k.id === id ? { ...k, es_publico: !currentStatus } : k));
            showToast(!currentStatus ? 'Sound Kit publicado' : 'Sound Kit ocultado', 'success');
        }
    };

    // Deep Linking Effect
    useEffect(() => {
        if (loading) return;

        const editKitId = searchParams.get('edit_kit');

        if (editKitId) {
            const kitToEdit = soundKits.find(k => k.id === editKitId);
            if (kitToEdit) {
                setCurrentKit({ ...kitToEdit });
                setInitialKit({ ...kitToEdit });
                setIsEditingKit(true);
            }
        }
    }, [loading, soundKits, searchParams]);

    const handleSaveKit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const errors: Record<string, string> = {};
        if (!currentKit?.titulo) errors.titulo = "El título es obligatorio";
        if (!currentKit?.descripcion) errors.descripcion = "La descripción es obligatoria";
        if (!currentKit?.precio || currentKit.precio <= 0) errors.precio = "El precio debe ser mayor a 0";
        if (!kitFile && !currentKit?.url_archivo) errors.file = "El archivo del Sound Kit es obligatorio";
        if (!kitCoverFile && !currentKit?.url_portada) errors.cover = "La portada es obligatoria";
        if (!kitSampleFile && !currentKit?.archivo_muestra_url) errors.sample = "El audio de muestra (MP3) es obligatorio";

        if (Object.keys(errors).length > 0) {
            setKitErrors(errors);
            return;
        }

        setKitSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !currentKit) return; 
        if (!username) {
            showToast("Error: No se pudo obtener el nombre de usuario.", "error");
            setKitSaving(false);
            return;
        }

        try {
            let fileUrl = currentKit.url_archivo || '';

            // Handle File Upload (ZIP/RAR)
            if (kitFile) {
                const fileName = `${username}/${kitFile.name}`;
                const { data, error: fileError } = await supabase.storage
                    .from('archivos_kits_sonido')
                    .upload(fileName, kitFile, { upsert: true });

                if (fileError) throw fileError;

                const { data: { publicUrl: fUrl } } = supabase.storage
                    .from('archivos_kits_sonido')
                    .getPublicUrl(fileName);

                fileUrl = fUrl;
            }

            // Handle Cover Upload
            let coverUrl = currentKit.url_portada || null;
            if (kitCoverFile) {
                const fileExt = kitCoverFile.name.split('.').pop();
                const coverName = `${username}/cover-${Date.now()}.${fileExt}`;
                const { data, error: coverError } = await supabase.storage
                    .from('portadas_kits_sonido')
                    .upload(coverName, kitCoverFile, { upsert: true });

                if (coverError) throw coverError;

                const { data: { publicUrl } } = supabase.storage
                    .from('portadas_kits_sonido')
                    .getPublicUrl(coverName);

                coverUrl = publicUrl;
            }

            // Handle Sample Audio Upload
            let sampleUrl = currentKit.archivo_muestra_url || null;
            if (kitSampleFile) {
                const sampleName = `${username}/${kitSampleFile.name}`;
                const { data: sampleData, error: sampleError } = await supabase.storage
                    .from('muestra_soundkit')
                    .upload(sampleName, kitSampleFile, { upsert: true });

                if (sampleError) throw sampleError;

                const { data: { publicUrl: sUrl } } = supabase.storage
                    .from('muestra_soundkit')
                    .getPublicUrl(sampleName);

                sampleUrl = sUrl;
            }

            if (!fileUrl) {
                showToast("Por favor sube un archivo para el Sound Kit", "error");
                setKitSaving(false);
                return;
            }

            const payload = {
                productor_id: user.id,
                titulo: currentKit.titulo,
                descripcion: currentKit.descripcion,
                precio: currentKit.precio || 0,
                url_archivo: fileUrl,
                archivo_muestra_url: sampleUrl,
                url_portada: coverUrl,
                es_publico: true
            };

            let error;
            if (currentKit.id) {
                const { error: err } = await supabase.from('kits_sonido').update(payload).eq('id', currentKit.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('kits_sonido').insert(payload);
                error = err;
            }

            if (error) throw error;
            setIsEditingKit(false);
            setCurrentKit(null);
            setInitialKit(null);
            setKitErrors({});
            setKitFile(null);
            setKitSampleFile(null);
            setKitCoverFile(null);
            fetchData();
            showToast("Sound Kit publicado exitosamente.", "success");
        } catch (err) {
            console.error(err);
            showToast("Error al guardar el Sound Kit", "error");
        } finally {
            setKitSaving(false);
        }
    };

    const handleDeleteKit = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este Sound Kit?")) return;
        const { error } = await supabase.from('kits_sonido').delete().eq('id', id);
        if (error) showToast("Error al eliminar", "error");
        else {
            fetchData();
            showToast("Kit eliminado", "success");
        }
    };

    if (loading) return <LoadingTianguis />;

    if (userTier !== 'premium' && userTier !== 'pro') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 dark:bg-card/10 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-border/50">
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[4rem]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="bg-orange-500/10 p-8 rounded-[2.5rem] mb-8 text-orange-500 animate-bounce-slow relative z-10">
                    <Package size={64} strokeWidth={1} />
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4 relative z-10">
                    Bóveda de <span className="text-orange-500">Sound Kits</span>
                </h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-12 font-medium leading-relaxed uppercase text-[10px] tracking-widest relative z-10">
                    Vende tus librerías de sonidos y presets directamente a otros productores. Exclusivo para miembros
                    <span className="text-slate-900 dark:text-foreground font-black mx-1">Pro / Premium</span>.
                </p>
                <Link href="/pricing" className="group relative overflow-hidden bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all active:scale-95 flex items-center gap-3 relative z-10">
                    <div className="absolute inset-0 bg-orange-500 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Mejorar Plan</span>
                    <ArrowUpRight size={16} className="relative z-10 group-hover:text-white transition-colors" />
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-in fade-in duration-700">
            {/* Sound Kits Section */}
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h1 className="text-5xl md:text-8xl font-black uppercase tracking-tighter text-foreground mb-3 md:mb-4 leading-[0.85]">
                            <span className="opacity-40">Tus</span> <br />
                            <span className="text-orange-500 relative inline-block">
                                Sound Kits
                                <span className="absolute -bottom-2 left-0 w-full h-1.5 bg-gradient-to-r from-orange-500/50 to-transparent rounded-full" />
                            </span>
                        </h1>
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-6">
                            <p className="text-slate-500 dark:text-muted font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">Monetiza tus librerías y bancos de sonidos</p>
                            <div className="flex items-center gap-2 bg-orange-500/10 text-orange-500 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-orange-500/10 w-fit">
                                <Package size={12} />
                                {soundKits.length} Librerías Activas
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={async () => {
                            const isLicenseActive = await fetchData();
                            if (!isLicenseActive) {
                                showToast('Primero debes habilitar la Licencia de Sound Kits en la sección de Licencias', 'error');
                                return;
                            }
                            const empty = { precio: 0 };
                            setCurrentKit(empty);
                            setInitialKit(empty);
                            setKitErrors({});
                            setIsEditingKit(true);
                        }}
                        className="bg-orange-500 text-white px-8 py-4 rounded-3xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all active:scale-95 flex items-center gap-3 w-fit h-fit shadow-xl shadow-orange-500/20"
                    >
                        <Plus size={20} className="stroke-[3]" /> Nuevo Sound Kit
                    </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {soundKits.length === 0 ? (
                        <div className="col-span-full py-40 text-center bg-foreground/[0.02] border-2 border-dashed border-border rounded-[4rem] relative overflow-hidden group">
                            <div className="absolute inset-0 bg-orange-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <Package className="w-24 h-24 mx-auto mb-6 text-slate-300 dark:text-white/10 group-hover:scale-110 transition-transform duration-500" />
                            <h3 className="text-3xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-2">Bóveda Vacía</h3>
                            <p className="text-muted text-[11px] font-bold uppercase tracking-widest max-w-sm mx-auto opacity-60">Publica tu primer Sound Kit para empezar a generar ingresos.</p>
                        </div>
                    ) : (
                        soundKits.map(kit => (
                            <div key={kit.id} className="group relative bg-white/50 dark:bg-white/[0.02] border border-border rounded-[3rem] overflow-hidden transition-all duration-700 hover:border-orange-500/40 flex flex-col items-stretch backdrop-blur-3xl shadow-2xl shadow-black/5">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-orange-500/5 blur-[80px] -mr-24 -mt-24 pointer-events-none group-hover:bg-orange-500/10 transition-colors" />

                                <div className="relative aspect-video overflow-hidden border-b border-border">
                                    <Image
                                        src={kit.url_portada || '/placeholder-kit.jpg'}
                                        fill
                                        className="object-cover transition-transform duration-[2s] group-hover:scale-110"
                                        alt={kit.titulo}
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60" />

                                    {kit.esta_desactivado_por_plan && (
                                        <div className="absolute inset-0 bg-rose-500/40 backdrop-blur-[2px] flex items-center justify-center p-4 text-center z-20">
                                            <div className="flex flex-col items-center gap-1">
                                                <AlertCircle size={24} className="text-white" />
                                                <span className="text-[8px] font-black text-white uppercase tracking-widest bg-rose-600 px-2 py-1 rounded-lg">Desactivado por Plan</span>
                                            </div>
                                        </div>
                                    )}

                                    <div className="absolute bottom-4 left-6 right-6 flex items-center justify-between z-10">
                                        <div className="bg-black/60 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full">
                                            <span className="text-[10px] font-black text-white uppercase tracking-widest">${kit.precio} MXN</span>
                                        </div>
                                        <div className={`p-2 rounded-full backdrop-blur-md border border-white/20 ${kit.es_publico ? 'bg-emerald-500/80 text-white' : 'bg-slate-500/80 text-white'}`}>
                                            <Layers size={14} />
                                        </div>
                                    </div>
                                </div>

                                <div className="p-8 flex-1 flex flex-col gap-6 relative z-10">
                                    <div className="space-y-4">
                                        <div className="flex items-center justify-between gap-3">
                                            <h3 className="font-black text-2xl text-foreground tracking-tight group-hover:text-orange-500 transition-colors truncate">{kit.titulo}</h3>
                                            <div className="flex items-center gap-2">
                                                <Switch
                                                    active={kit.es_publico && !kit.esta_desactivado_por_plan}
                                                    onChange={(status) => handleTogglePublicKit(kit.id, !status, kit.esta_desactivado_por_plan)}
                                                    disabled={kit.esta_desactivado_por_plan}
                                                />
                                            </div>
                                        </div>
                                        <p className="text-muted text-xs font-medium leading-relaxed line-clamp-2 opacity-60 group-hover:opacity-100 transition-opacity">
                                            {kit.descripcion}
                                        </p>
                                    </div>

                                    <div className="pt-6 border-t border-border flex items-center gap-3">
                                        <button 
                                            onClick={() => {
                                                setCurrentKit({ ...kit });
                                                setInitialKit({ ...kit });
                                                setKitErrors({});
                                                setIsEditingKit(true);
                                            }} 
                                            className="flex-1 h-12 bg-foreground/5 dark:bg-white/5 border border-border text-foreground rounded-2xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all text-[10px] font-black uppercase tracking-widest gap-2"
                                        >
                                            <Edit3 size={14} /> Editar Datos
                                        </button>
                                        <button 
                                            onClick={() => handleDeleteKit(kit.id)} 
                                            className="w-12 h-12 bg-rose-500/10 border border-rose-500/20 text-rose-500 rounded-2xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-lg shadow-rose-500/5 active:scale-95"
                                        >
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>

            {/* Modal de Edición de Sound Kit */}
            {isEditingKit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/40 backdrop-blur-sm pointer-events-auto" onClick={() => { setIsEditingKit(false); setCurrentKit(null); }} />
                    
                    <div className="relative bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-white/10 rounded-[3.5rem] overflow-hidden animate-in zoom-in-95 duration-300 shadow-[0_50px_200px_-20px_rgba(0,0,0,0.6)] dark:shadow-[0_50px_200px_-20px_rgba(0,0,0,1)] w-full max-w-2xl flex flex-col max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-10 border-b border-slate-200 dark:border-white/10 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.02] relative z-10 shrink-0">
                            <div className="flex items-center gap-6">
                                <div className={`inline-flex items-center gap-3 px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-500 border border-orange-500/20`}>
                                    <Package size={14} />
                                    Sound Kit Editor
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">
                                    {currentKit?.titulo || 'Nuevo Kit'}
                                </h2>
                            </div>
                            <button
                                onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitSampleFile(null); setKitCoverFile(null); setKitErrors({}); }}
                                className="w-12 h-12 rounded-full bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 transition-all"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Modal Body */}
                        <div className="flex-1 overflow-y-auto p-10 space-y-10 custom-scrollbar relative z-10">
                            <form onSubmit={handleSaveKit} className="space-y-10">
                                <div className="grid md:grid-cols-2 gap-10">
                                    {/* Cover Image Upload Section */}
                                    <div className="flex flex-col gap-4">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Acento Visual (Portada)</label>
                                            {kitErrors.cover && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.cover}</span>}
                                        </div>
                                        <div className={`relative group aspect-square rounded-[2rem] overflow-hidden border-2 border-dashed transition-all cursor-pointer ${kitErrors.cover ? 'border-red-500 bg-red-500/5' : (kitCoverFile || currentKit?.url_portada ? 'border-transparent' : 'border-border hover:border-orange-500/40 hover:bg-orange-500/5')}`}>
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png,.webp"
                                                required={!currentKit?.url_portada}
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0];
                                                    if (file) { setKitCoverFile(file); setKitErrors(prev => ({ ...prev, cover: '' })); }
                                                }}
                                                className="hidden"
                                                id="kit-cover-modal"
                                            />
                                            <label htmlFor="kit-cover-modal" className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                                                {kitCoverFile ? (
                                                    <img src={URL.createObjectURL(kitCoverFile)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Cover preview" />
                                                ) : currentKit?.url_portada ? (
                                                    <Image src={currentKit.url_portada} fill sizes="200px" className="object-cover group-hover:scale-105 transition-transform duration-700" alt="Saved cover" />
                                                ) : (
                                                    <div className="flex flex-col items-center">
                                                        <div className="w-16 h-16 rounded-2xl bg-foreground/5 dark:bg-white/5 text-muted group-hover:bg-orange-500/10 group-hover:text-orange-500 flex items-center justify-center mb-4 transition-all">
                                                            <Upload size={28} />
                                                        </div>
                                                        <span className="text-[10px] font-black uppercase tracking-widest">Subir Artwork</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Inputs Section */}
                                    <div className="space-y-6">
                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nombre del Sound Kit</label>
                                                {kitErrors.titulo && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.titulo}</span>}
                                            </div>
                                            <input
                                                required
                                                value={currentKit?.titulo || ''}
                                                onChange={e => {
                                                    setCurrentKit({ ...currentKit, titulo: e.target.value });
                                                    if (e.target.value) setKitErrors(prev => ({ ...prev, titulo: '' }));
                                                }}
                                                placeholder="Ej. Urban Drums Vol. 1"
                                                className={`w-full bg-slate-50 dark:bg-white/[0.03] border ${kitErrors.titulo ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-orange-500/50'} rounded-2xl px-6 py-4 font-bold text-foreground focus:outline-none transition-all`}
                                            />
                                        </div>

                                        <div className="space-y-3">
                                            <div className="flex items-center justify-between">
                                                <label className="text-[10px] font-black uppercase tracking-widest text-muted">Valor Comercial (MXN)</label>
                                                {kitErrors.precio && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.precio}</span>}
                                            </div>
                                            <div className="relative group">
                                                <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500">
                                                    <DollarSign size={16} strokeWidth={3} />
                                                </div>
                                                <input
                                                    type="number"
                                                    required
                                                    min="1"
                                                    value={currentKit?.precio || ''}
                                                    onChange={e => {
                                                        setCurrentKit({ ...currentKit, precio: Number(e.target.value) });
                                                        if (Number(e.target.value) > 0) setKitErrors(prev => ({ ...prev, precio: '' }));
                                                    }}
                                                    className="w-full bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-white/10 focus:border-orange-500/50 rounded-2xl pl-14 pr-6 py-4 font-black text-foreground tracking-tighter tabular-nums"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Full Width Fields */}
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Descripción del Contenido</label>
                                        {kitErrors.descripcion && <span className="text-[9px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.descripcion}</span>}
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={currentKit?.descripcion || ''}
                                        onChange={e => {
                                            setCurrentKit({ ...currentKit, descripcion: e.target.value });
                                            if (e.target.value) setKitErrors(prev => ({ ...prev, descripcion: '' }));
                                        }}
                                        placeholder="Enumera lo que incluye tu kit..."
                                        className={`w-full bg-slate-50 dark:bg-white/[0.03] border ${kitErrors.descripcion ? 'border-red-500' : 'border-slate-200 dark:border-white/10 focus:border-orange-500/50'} rounded-[2rem] px-6 py-5 font-medium text-foreground resize-none focus:outline-none transition-all`}
                                    />
                                </div>

                                {/* File Upload Grid */}
                                <div className="grid md:grid-cols-2 gap-6">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                            <Music size={12} /> Preview (MP3)
                                        </label>
                                        <div className={`relative border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.05] ${kitErrors.sample ? 'border-red-500/50' : ''}`}>
                                            <input
                                                type="file"
                                                accept="audio/mpeg"
                                                required={!currentKit?.archivo_muestra_url}
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) { setKitSampleFile(file); setKitErrors(prev => ({ ...prev, sample: '' })); }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                                <Upload size={18} />
                                            </div>
                                            <div className="truncate flex-1">
                                                <p className="text-[11px] font-black text-foreground truncate uppercase">{kitSampleFile?.name || (currentKit?.archivo_muestra_url ? 'Archivo Guardado' : 'Subir Preview')}</p>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">MP3 Demo</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted flex items-center gap-2">
                                            <FileArchive size={12} /> Archivo Principal
                                        </label>
                                        <div className={`relative border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/[0.02] rounded-2xl p-4 flex items-center gap-4 transition-all hover:bg-slate-100 dark:hover:bg-white/[0.05] ${kitErrors.file ? 'border-red-500/50' : ''}`}>
                                            <input
                                                type="file"
                                                accept=".zip,.rar"
                                                required={!currentKit?.url_archivo}
                                                onChange={e => {
                                                    const file = e.target.files?.[0];
                                                    if (file) { setKitFile(file); setKitErrors(prev => ({ ...prev, file: '' })); }
                                                }}
                                                className="absolute inset-0 opacity-0 cursor-pointer z-10"
                                            />
                                            <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center shrink-0">
                                                <FileArchive size={18} />
                                            </div>
                                            <div className="truncate flex-1">
                                                <p className="text-[11px] font-black text-foreground truncate uppercase">{kitFile?.name || (currentKit?.url_archivo ? 'Archivo Guardado' : 'Subir ZIP/RAR')}</p>
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-0.5">Librería Completa</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </form>
                        </div>

                        {/* Modal Footer */}
                        <div className="px-10 py-8 border-t border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-black/40 flex gap-6 justify-end items-center relative z-10 shrink-0">
                            <button
                                onClick={() => { setIsEditingKit(false); setCurrentKit(null); }}
                                className="px-8 py-4 font-black text-[11px] uppercase tracking-widest text-muted hover:text-foreground transition-all"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleSaveKit}
                                disabled={kitSaving}
                                className="px-12 py-4 bg-orange-500 text-white rounded-3xl font-black text-[11px] uppercase tracking-[0.3em] transition-all hover:scale-105 hover:shadow-xl hover:shadow-orange-500/30 active:scale-95 disabled:opacity-50"
                            >
                                {kitSaving ? (
                                    <span className="flex items-center gap-2">
                                        <Loader2 size={16} className="animate-spin" /> Procesando
                                    </span>
                                ) : "Guardar Sound Kit"}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
