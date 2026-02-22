"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit3, Trash2, Briefcase, DollarSign, Clock, AlertCircle, Check, X, Loader2, Package, Upload, FileArchive } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';

// Tipos
type Service = {
    id: string;
    titulo: string;
    descripcion: string;
    precio: number;
    tipo_servicio: string;
    tiempo_entrega_dias: number;
    is_active: boolean;
};

type SoundKit = {
    id: string;
    title: string;
    description: string;
    price: number;
    file_url: string;
    cover_url?: string;
    is_public: boolean;
    created_at: string;
};

export default function ServicesManagerPageWrapper() {
    return (
        <Suspense fallback={<div className="flex justify-center p-12"><Loader2 className="animate-spin" /></div>}>
            <ServicesManagerPage />
        </Suspense>
    );
}

function ServicesManagerPage() {
    const searchParams = useSearchParams();
    const [services, setServices] = useState<Service[]>([]);
    const [soundKits, setSoundKits] = useState<SoundKit[]>([]);
    const [loading, setLoading] = useState(true);
    const [userTier, setUserTier] = useState<string | null>(null);

    // Form State Services
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service> | null>(null);
    const [initialService, setInitialService] = useState<Partial<Service> | null>(null);
    const [serviceErrors, setServiceErrors] = useState<Record<string, string>>({});
    const [saving, setSaving] = useState(false);

    // Form State Sound Kits
    const [isEditingKit, setIsEditingKit] = useState(false);
    const [currentKit, setCurrentKit] = useState<Partial<SoundKit> | null>(null);
    const [initialKit, setInitialKit] = useState<Partial<SoundKit> | null>(null);
    const [kitErrors, setKitErrors] = useState<Record<string, string>>({});
    const [kitSaving, setKitSaving] = useState(false);
    const [kitFile, setKitFile] = useState<File | null>(null);
    const [kitCoverFile, setKitCoverFile] = useState<File | null>(null);

    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Tier & Username
        const { data: profile } = await supabase.from('profiles').select('subscription_tier, username').eq('id', user.id).single();
        setUserTier(profile?.subscription_tier);
        if (profile?.username) setUsername(profile.username);

        // Get Services
        const { data: servicesData } = await supabase
            .from('services')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: false });

        if (servicesData) setServices(servicesData);

        // Get Sound Kits
        const { data: kitsData } = await supabase
            .from('sound_kits')
            .select('*')
            .eq('producer_id', user.id)
            .order('created_at', { ascending: false });

        if (kitsData) setSoundKits(kitsData);

        setLoading(false);
    };

    // Deep Linking Effect
    useEffect(() => {
        if (loading) return;

        const editServiceId = searchParams.get('edit_service');
        const editKitId = searchParams.get('edit_kit');

        if (editServiceId) {
            const serviceToEdit = services.find(s => s.id === editServiceId);
            if (serviceToEdit) {
                setCurrentService({ ...serviceToEdit });
                setInitialService({ ...serviceToEdit });
                setIsEditing(true);
            }
        }

        if (editKitId) {
            const kitToEdit = soundKits.find(k => k.id === editKitId);
            if (kitToEdit) {
                setCurrentKit({ ...kitToEdit });
                setInitialKit({ ...kitToEdit });
                setIsEditingKit(true);
            }
        }
    }, [loading, services, soundKits, searchParams]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const errors: Record<string, string> = {};
        if (!currentService?.titulo) errors.titulo = "El título es obligatorio";
        if (!currentService?.descripcion) errors.descripcion = "La descripción es obligatoria";
        if (!currentService?.precio || currentService.precio <= 0) errors.precio = "El precio debe ser mayor a 0";
        if (!currentService?.tipo_servicio) errors.tipo_servicio = "La categoría es obligatoria";

        if (Object.keys(errors).length > 0) {
            setServiceErrors(errors);
            return;
        }

        setSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !currentService) return;

        try {
            const payload = {
                user_id: user.id,
                titulo: currentService.titulo,
                descripcion: currentService.descripcion,
                precio: currentService.precio,
                tipo_servicio: currentService.tipo_servicio || 'mixing_mastering',
                tiempo_entrega_dias: currentService.tiempo_entrega_dias || 3,
                is_active: true
            };

            let error;
            if (currentService.id) {
                // Update
                const { error: err } = await supabase.from('services').update(payload).eq('id', currentService.id);
                error = err;
            } else {
                // Create
                const { error: err } = await supabase.from('services').insert(payload);
                error = err;
            }

            if (error) throw error;
            setIsEditing(false);
            setCurrentService(null);
            setInitialService(null);
            setServiceErrors({});
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al guardar el servicio");
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este servicio?")) return;

        const { error } = await supabase.from('services').delete().eq('id', id);
        if (error) {
            alert("Error al eliminar");
        } else {
            fetchData();
        }
    };

    const handleSaveKit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Validation
        const errors: Record<string, string> = {};
        if (!currentKit?.title) errors.title = "El título es obligatorio";
        if (!currentKit?.description) errors.description = "La descripción es obligatoria";
        if (!currentKit?.price || currentKit.price <= 0) errors.price = "El precio debe ser mayor a 0";
        if (!kitFile && !currentKit?.file_url) errors.file = "El archivo del Sound Kit es obligatorio";
        if (!kitCoverFile && !currentKit?.cover_url) errors.cover = "La portada es obligatoria";

        if (Object.keys(errors).length > 0) {
            setKitErrors(errors);
            return;
        }

        setKitSaving(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user || !currentKit) return; // username check is implicit if user exists, but good to have
        if (!username) {
            alert("Error: No se pudo obtener el nombre de usuario.");
            setKitSaving(false);
            return;
        }

        try {
            let fileUrl = currentKit.file_url || '';

            // Handle File Upload (ZIP/RAR)
            if (kitFile) {
                const fileName = `${username}/${Date.now()}-${kitFile.name}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('sound_kits')
                    .upload(fileName, kitFile);

                if (uploadError) throw uploadError;
                fileUrl = fileName;
            }

            // Handle Cover Upload
            let coverUrl = currentKit.cover_url || null;
            if (kitCoverFile) {
                const fileExt = kitCoverFile.name.split('.').pop();
                const coverName = `${username}/${Date.now()}-cover.${fileExt}`;
                const { data, error: coverError } = await supabase.storage
                    .from('sound_kits_covers')
                    .upload(coverName, kitCoverFile);

                if (coverError) throw coverError;

                const { data: { publicUrl } } = supabase.storage
                    .from('sound_kits_covers')
                    .getPublicUrl(coverName);

                coverUrl = publicUrl;
            }

            if (!fileUrl) {
                alert("Por favor sube un archivo para el Sound Kit");
                setKitSaving(false);
                return;
            }

            const payload = {
                producer_id: user.id,
                title: currentKit.title,
                description: currentKit.description,
                price: currentKit.price || 0,
                file_url: fileUrl,
                cover_url: coverUrl,
                is_public: true
            };

            let error;
            if (currentKit.id) {
                const { error: err } = await supabase.from('sound_kits').update(payload).eq('id', currentKit.id);
                error = err;
            } else {
                const { error: err } = await supabase.from('sound_kits').insert(payload);
                error = err;
            }

            if (error) throw error;
            setIsEditingKit(false);
            setCurrentKit(null);
            setInitialKit(null);
            setKitErrors({});
            setKitFile(null);
            setKitCoverFile(null);
            fetchData();
        } catch (err) {
            console.error(err);
            alert("Error al guardar el Sound Kit");
        } finally {
            setKitSaving(false);
        }
    };

    const handleDeleteKit = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este Sound Kit?")) return;
        const { error } = await supabase.from('sound_kits').delete().eq('id', id);
        if (error) alert("Error al eliminar");
        else fetchData();
    };

    if (loading) return <div className="flex justify-center p-12 text-muted"><Loader2 className="animate-spin" /></div>;

    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8">
                <div className="bg-accent/10 p-6 rounded-full mb-6 text-accent shadow-xl shadow-accent/20">
                    <Briefcase size={48} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 dark:text-foreground mb-4">Venta de Servicios Exclusiva</h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-8">
                    La venta de servicios (Mezcla, Master, Mentorías, etc.) y Sound Kits es una característica exclusiva para miembros
                    <span className="text-accent font-bold"> Premium</span>.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-200 transition-all shadow-xl">
                    Mejorar a Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-16 animate-in fade-in duration-700">
            {/* Header Elite */}
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-8">
                <div>
                    <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-foreground mb-4">
                        Servicios <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Profesionales</span>
                    </h1>
                    <div className="flex flex-wrap items-center gap-4 text-slate-500 dark:text-muted">
                        <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-accent/20 shadow-lg shadow-accent/5">
                            <Briefcase size={12} /> Branding Hub Pro
                        </div>
                        <span className="text-[10px] font-bold uppercase tracking-widest opacity-60 flex items-center gap-2">
                            <Package size={12} /> {services.length} Servicios Activos
                        </span>
                    </div>
                </div>
                <button
                    onClick={() => {
                        const empty = { tipo_servicio: 'mixing_mastering', precio: 0 };
                        setCurrentService(empty);
                        setInitialService(empty);
                        setServiceErrors({});
                        setIsEditing(true);
                    }}
                    className="bg-accent text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center gap-3 w-fit"
                >
                    <Plus size={20} className="stroke-[3]" /> Crear Servicio
                </button>
            </div>

            {/* Services Section - Elite Portfolio */}
            <div className="space-y-8">
                <div className="flex items-center gap-4 mb-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                    <h2 className="text-[10px] font-black uppercase tracking-[0.5em] text-muted opacity-40">Servicios Profesionales</h2>
                    <div className="h-px flex-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                </div>

                {services.length === 0 && !isEditing ? (
                    <div className="py-24 text-center bg-slate-50 dark:bg-[#020205] border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3.5rem] relative overflow-hidden group">
                        <div className="absolute inset-0 bg-accent/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                        <div className="w-24 h-24 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/5 rounded-[2.5rem] flex items-center justify-center mx-auto mb-10 text-muted shadow-sm shadow-black/5 dark:shadow-white/5 group-hover:scale-110 transition-transform duration-500">
                            <Briefcase size={40} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-2xl font-black text-slate-900 dark:text-foreground uppercase tracking-tight mb-4">Tu vitrina está vacía</h3>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-widest max-w-sm mx-auto mb-12 opacity-60 leading-relaxed">
                            Monetiza tu experiencia técnica ofreciendo servicios que complementen tus ritmos.
                        </p>
                        <button
                            onClick={() => {
                                const empty = { tipo_servicio: 'mixing_mastering', precio: 0 };
                                setCurrentService(empty);
                                setIsEditing(true);
                            }}
                            className="bg-accent text-white px-8 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-xl inline-block"
                        >
                            Lanzar mi primer servicio
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {services.map(service => (
                            <div key={service.id} className="group relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 overflow-hidden transition-all duration-500 hover:border-accent/40 hover:-translate-y-2 shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)] dark:hover:shadow-accent/10">
                                <div className="absolute top-0 right-0 w-48 h-48 bg-accent/5 blur-[80px] -mr-24 -mt-24 pointer-events-none group-hover:bg-accent/10 transition-colors" />

                                <div className="flex justify-start items-start mb-10 relative z-10">
                                    <div className="w-14 h-14 bg-accent/10 border border-accent/20 text-accent rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                                        <Briefcase size={28} />
                                    </div>
                                </div>

                                <h3 className="font-black text-2xl text-slate-900 dark:text-foreground mb-4 tracking-tight group-hover:text-accent transition-colors">{service.titulo}</h3>
                                <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 line-clamp-3 opacity-60 group-hover:opacity-100 transition-opacity">
                                    {service.descripcion}
                                </p>

                                <div className="flex flex-col gap-8 pt-8 border-t border-slate-200 dark:border-white/5 relative z-10">
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <span className="text-[9px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] mb-1">Inversión</span>
                                            <span className="font-black text-xl text-slate-900 dark:text-foreground tracking-tighter group-hover:text-accent transition-colors">${service.precio}</span>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-[9px] font-black text-slate-500 dark:text-muted uppercase tracking-[0.3em] mb-1">Entrega Est.</span>
                                            <div className="flex items-center gap-2 font-black text-xs text-slate-700 dark:text-foreground/80">
                                                <Clock size={14} className="text-accent" />
                                                {service.tiempo_entrega_dias} Días
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center justify-center gap-3 w-full">
                                        <button onClick={() => {
                                            setCurrentService({ ...service });
                                            setInitialService({ ...service });
                                            setServiceErrors({});
                                            setIsEditing(true);
                                        }} className="flex-1 h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-foreground rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white dark:hover:bg-white/10 dark:hover:border-accent/40 shadow-sm transition-all text-[10px] font-black uppercase tracking-widest gap-2">
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="w-12 h-12 bg-white dark:bg-rose-500/5 border border-slate-200 dark:border-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-px bg-gradient-to-r from-transparent via-white/10 to-transparent my-16" />

            {/* Sound Kits Section */}
            <div className="space-y-10">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-foreground tracking-tighter uppercase flex items-center gap-4">
                            Sound <span className="text-amber-500 underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Kits</span>
                            <span className="bg-amber-100 dark:bg-amber-500/10 text-amber-600 dark:text-amber-500 text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-amber-200 dark:border-amber-500/10 shadow-sm md:shadow-lg dark:shadow-amber-500/5">Premium</span>
                        </h2>
                        <p className="text-slate-500 dark:text-muted font-bold text-[10px] uppercase tracking-[0.3em] mt-6 opacity-60">Monetiza tus librerías y bancos de sonidos</p>
                    </div>
                    <button
                        onClick={() => {
                            const empty = { price: 0 };
                            setCurrentKit(empty);
                            setInitialKit(empty);
                            setKitErrors({});
                            setIsEditingKit(true);
                        }}
                        className="bg-amber-500 text-white px-10 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-amber-400 hover:scale-105 transition-all shadow-xl shadow-amber-500/20 active:scale-95 flex items-center gap-3 w-fit"
                    >
                        <Plus size={20} className="stroke-[3]" /> Nuevo Sound Kit
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {soundKits.map(kit => (
                        <div key={kit.id} className="group relative bg-white dark:bg-[#020205] border border-slate-200 dark:border-white/10 rounded-[3.5rem] overflow-hidden transition-all duration-700 hover:border-amber-500/40 hover:-translate-y-2 shadow-lg dark:shadow-[0_4px_20px_rgba(255,255,255,0.02)] dark:hover:shadow-amber-500/10">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

                            {/* Kit Cover Preview */}
                            <div className="relative h-48 w-full overflow-hidden border-b border-slate-200 dark:border-white/5">
                                <Image
                                    src={kit.cover_url || '/placeholder-kit.jpg'}
                                    fill
                                    className="object-cover opacity-60 dark:opacity-40 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-110"
                                    alt={kit.title}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#020205] via-white/40 dark:via-[#020205]/40 to-transparent" />
                                <div className="absolute top-6 left-6 flex gap-2">
                                    <div className="bg-amber-500/20 backdrop-blur-md border border-amber-500/20 text-amber-600 dark:text-amber-500 px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                        Digital Kit
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 relative z-10">
                                <h3 className="font-black text-2xl text-slate-900 dark:text-foreground mb-4 tracking-tight group-hover:text-amber-500 transition-colors">{kit.title}</h3>
                                <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 line-clamp-2 opacity-60">
                                    {kit.description}
                                </p>
                                <div className="flex flex-col items-center gap-6 pt-8 border-t border-slate-200 dark:border-white/5">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-black text-amber-500 uppercase tracking-[0.3em] mb-1">Precio</span>
                                        <span className="font-black text-xl text-slate-900 dark:text-foreground tracking-tighter group-hover:text-amber-500 transition-colors">${kit.price}</span>
                                    </div>
                                    <div className="flex items-center justify-center gap-3 w-full">
                                        <button onClick={() => {
                                            setCurrentKit({ ...kit });
                                            setInitialKit({ ...kit });
                                            setKitErrors({});
                                            setIsEditingKit(true);
                                        }} className="flex-1 h-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-foreground rounded-xl flex items-center justify-center hover:bg-slate-900 hover:text-white dark:hover:bg-white/10 dark:hover:border-amber-500/40 shadow-sm transition-all text-[10px] font-black uppercase tracking-widest gap-2">
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleDeleteKit(kit.id)} className="w-12 h-12 bg-white dark:bg-rose-500/5 border border-slate-200 dark:border-rose-500/10 text-rose-500 rounded-xl flex items-center justify-center hover:bg-rose-500 hover:text-white transition-all shadow-sm">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                    {soundKits.length === 0 && (
                        <div className="lg:col-span-3 py-20 text-center bg-slate-50 dark:bg-white/5 border-2 border-dashed border-slate-200 dark:border-white/5 rounded-[3.5rem]">
                            <Package className="w-16 h-16 mx-auto mb-4 text-slate-300 dark:text-white/20" />
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 dark:text-muted">No hay Sound Kits registrados en la bóveda</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modals with Elite UI */}
            {isEditingKit && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="bg-[#0a0a0c] rounded-[3.5rem] p-10 max-w-2xl w-full shadow-2xl overflow-y-auto border border-white/5 max-h-[90vh] relative">
                        <button onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitCoverFile(null); setKitErrors({}); }} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all z-10">
                            <X size={24} />
                        </button>

                        <div className="mb-10">
                            <h2 className="text-3xl font-black uppercase tracking-tighter flex items-center gap-4 text-foreground mb-2">
                                {currentKit?.id ? "Refinar" : "Arquitectura del"} <span className="text-amber-500">Sound Kit</span>
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-50">Configura tu producto digital de alta gama</p>
                        </div>

                        <form onSubmit={handleSaveKit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Identificador Público</label>
                                        <input
                                            required
                                            value={currentKit?.title || ''}
                                            onChange={e => {
                                                setCurrentKit({ ...currentKit, title: e.target.value });
                                                if (e.target.value) setKitErrors(prev => ({ ...prev, title: '' }));
                                            }}
                                            placeholder="EJ. URBAN DRUMS VOL. 1"
                                            className={`w-full bg-white/5 border-2 rounded-2xl px-6 py-4 font-black text-foreground text-sm focus:outline-none focus:border-amber-500 transition-all shadow-inner ${kitErrors.title ? 'border-red-500' : 'border-white/5'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Valuación Comercial (MXN)</label>
                                        <div className="relative">
                                            <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-amber-500" />
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={currentKit?.price || ''}
                                                onChange={e => {
                                                    setCurrentKit({ ...currentKit, price: Number(e.target.value) });
                                                    if (Number(e.target.value) > 0) setKitErrors(prev => ({ ...prev, price: '' }));
                                                }}
                                                className={`w-full bg-white/5 border-2 rounded-2xl pl-12 pr-6 py-4 font-black text-foreground text-sm focus:outline-none focus:border-amber-500 transition-all shadow-inner tabular-nums ${kitErrors.price ? 'border-red-500' : 'border-white/5'}`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Diseño de Portada</label>
                                    <div className="relative group aspect-square">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            required={!currentKit?.cover_url}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) setKitCoverFile(file);
                                            }}
                                            className="hidden"
                                            id="kit-cover"
                                        />
                                        <label htmlFor="kit-cover" className={`flex flex-col items-center justify-center gap-4 border-2 border-dashed rounded-[2rem] cursor-pointer hover:bg-white/5 transition-all w-full h-full overflow-hidden relative ${kitErrors.cover ? 'border-red-500 bg-red-500/5' : (kitCoverFile || currentKit?.cover_url ? 'border-amber-500/40 bg-amber-500/5' : 'border-white/10')}`}>
                                            {kitCoverFile ? (
                                                <img src={URL.createObjectURL(kitCoverFile)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : currentKit?.cover_url ? (
                                                <img src={currentKit.cover_url} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                                            ) : (
                                                <div className="flex flex-col items-center gap-3 z-10">
                                                    <Upload size={32} className={kitErrors.cover ? 'text-red-500' : 'text-muted/40'} />
                                                    <span className={`text-[9px] font-black uppercase tracking-widest ${kitErrors.cover ? 'text-red-500' : 'text-muted/40'}`}>Sincronizar Arte</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Archivo de la Bóveda (.zip / .rar)</label>
                                    <div className={`relative border-2 border-dashed rounded-[2rem] p-10 transition-all text-center group ${kitErrors.file ? 'border-red-500 bg-red-500/5' : (kitFile ? 'border-amber-500 bg-amber-500/5' : 'border-white/10 hover:border-amber-500/40 hover:bg-white/5')}`}>
                                        <input
                                            type="file"
                                            accept=".zip,.rar"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024 * 1024) { alert("Límite de 2GB excedido"); e.target.value = ''; return; }
                                                    setKitFile(file);
                                                }
                                            }}
                                            className="absolute inset-0 opacity-0 cursor-pointer"
                                        />
                                        <div className="flex flex-col items-center">
                                            {kitFile ? (
                                                <>
                                                    <div className="w-16 h-16 bg-amber-500/20 rounded-2xl flex items-center justify-center text-amber-500 mb-4 animate-bounce-slow">
                                                        <FileArchive size={32} />
                                                    </div>
                                                    <p className="text-sm font-black text-amber-500 uppercase tracking-tight">{kitFile.name}</p>
                                                    <p className="text-[9px] font-bold text-amber-500/60 uppercase tracking-widest mt-2">Listo para el despliegue</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Upload className={kitErrors.file ? 'text-red-500' : 'text-muted/20 group-hover:text-amber-500 transition-colors'} size={40} strokeWidth={1.5} />
                                                    <p className={`text-[10px] font-black uppercase tracking-widest mt-6 ${kitErrors.file ? 'text-red-500' : 'text-muted'}`}>{kitErrors.file ? "Archivo Requerido" : (currentKit?.file_url ? "Click para actualizar archivo" : "Transferencia de datos digital")}</p>
                                                    <p className="text-[9px] font-bold text-muted/40 uppercase tracking-widest mt-2">Maximum throughput: 2GB per upload</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Detalles Técnicos & Contenido</label>
                                    <textarea
                                        rows={4}
                                        value={currentKit?.description || ''}
                                        onChange={e => {
                                            setCurrentKit({ ...currentKit, description: e.target.value });
                                            if (e.target.value) setKitErrors(prev => ({ ...prev, description: '' }));
                                        }}
                                        placeholder="EJ. INCLUYE +50 DRUM SAMPLES, PRESETS DE SERUM Y LOOPS EXCLUSIVOS."
                                        className={`w-full bg-white/5 border-2 rounded-[2rem] px-8 py-6 font-bold text-foreground text-[11px] focus:outline-none focus:border-amber-500 resize-none transition-all shadow-inner ${kitErrors.description ? 'border-red-500' : 'border-white/5'}`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-10 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitCoverFile(null); setKitErrors({}); }}
                                    className="flex-1 py-5 rounded-2xl font-black text-muted uppercase tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={kitSaving}
                                    className="flex-[2] bg-amber-600 text-white py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-amber-500 transition-all shadow-xl shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                                >
                                    {kitSaving ? "Sincronizando Bóveda..." : (currentKit?.id ? "Guardar Cambios Maestros" : "Activar e Iniciar Venta")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in transition-all">
                    <div className="bg-[#0a0a0c] rounded-[3.5rem] p-10 max-w-2xl w-full shadow-2xl overflow-hidden border border-white/5 relative">
                        <button onClick={() => { setIsEditing(false); setCurrentService(null); setInitialService(null); setServiceErrors({}); }} className="absolute top-8 right-8 w-12 h-12 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all z-10">
                            <X size={24} />
                        </button>

                        <div className="mb-10">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-2 leading-none">
                                {currentService?.id ? "Refinar" : "Crear"} <span className="text-accent underline decoration-white/10 underline-offset-4">Servicio</span>
                            </h2>
                            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted opacity-50">Configura tu oferta profesional elite</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Especialidad</label>
                                        <select
                                            className="w-full bg-white/5 border-2 border-white/5 rounded-2xl px-6 py-4 font-black text-foreground text-xs focus:outline-none focus:border-accent appearance-none shadow-inner"
                                            value={currentService?.tipo_servicio || 'mixing_mastering'}
                                            onChange={e => setCurrentService({ ...currentService, tipo_servicio: e.target.value })}
                                        >
                                            <option value="mixing_mastering">Mezcla & Masterización</option>
                                            <option value="beat_custom">Producción a Medida</option>
                                            <option value="mentoria">Mentoría Pro / Coaching</option>
                                            <option value="video_lyric">Video Lyric 4K / Visuals</option>
                                            <option value="video_musical">Filmación & Post-Producción</option>
                                        </select>
                                    </div>

                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Valor Comercial (MXN)</label>
                                        <div className="relative">
                                            <DollarSign size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" />
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={currentService?.precio || ''}
                                                onChange={e => {
                                                    setCurrentService({ ...currentService, precio: Number(e.target.value) });
                                                    if (Number(e.target.value) > 0) setServiceErrors(prev => ({ ...prev, precio: '' }));
                                                }}
                                                className={`w-full bg-white/5 border-2 rounded-2xl pl-12 pr-6 py-4 font-black text-foreground text-sm focus:outline-none focus:border-accent transition-all shadow-inner tabular-nums ${serviceErrors.precio ? 'border-red-500' : 'border-white/5'}`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Título del Servicio</label>
                                        <input
                                            required
                                            value={currentService?.titulo || ''}
                                            onChange={e => {
                                                setCurrentService({ ...currentService, titulo: e.target.value });
                                                if (e.target.value) setServiceErrors(prev => ({ ...prev, titulo: '' }));
                                            }}
                                            placeholder="EJ. MEZCLA DE VOCES PRO"
                                            className={`w-full bg-white/5 border-2 rounded-2xl px-6 py-4 font-black text-foreground text-sm focus:outline-none focus:border-accent transition-all shadow-inner ${serviceErrors.titulo ? 'border-red-500' : 'border-white/5'}`}
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Plazo de Entrega (Días)</label>
                                        <div className="relative">
                                            <Clock size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-accent" />
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={currentService?.tiempo_entrega_dias || ''}
                                                onChange={e => setCurrentService({ ...currentService, tiempo_entrega_dias: Number(e.target.value) })}
                                                className="w-full bg-white/5 border-2 border-white/5 rounded-2xl pl-12 pr-6 py-4 font-black text-foreground text-sm focus:outline-none focus:border-accent transition-all shadow-inner"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Descripción del Servicio</label>
                                <textarea
                                    rows={4}
                                    value={currentService?.descripcion || ''}
                                    onChange={e => {
                                        setCurrentService({ ...currentService, descripcion: e.target.value });
                                        if (e.target.value) setServiceErrors(prev => ({ ...prev, descripcion: '' }));
                                    }}
                                    placeholder="DETALLA EXACTAMENTE QUÉ RECIBIRÁ TU CLIENTE..."
                                    className={`w-full bg-white/5 border-2 rounded-[2rem] px-8 py-6 font-bold text-foreground text-[11px] focus:outline-none focus:border-accent resize-none transition-all shadow-inner ${serviceErrors.descripcion ? 'border-red-500' : 'border-white/10'}`}
                                />
                            </div>

                            <div className="flex gap-4 pt-10 border-t border-white/5">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentService(null); setInitialService(null); setServiceErrors({}); }}
                                    className="flex-1 py-5 rounded-2xl font-black text-muted uppercase tracking-[0.3em] text-[10px] hover:bg-white/5 transition-all"
                                >
                                    Descartar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-[2] bg-foreground text-background dark:bg-white dark:text-slate-900 py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-[10px] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95 disabled:opacity-50"
                                >
                                    {saving ? "Guardando..." : (currentService?.id ? "Guardar Cambios Maestros" : "Activar Servicio")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
