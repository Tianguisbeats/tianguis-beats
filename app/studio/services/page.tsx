"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit3, Trash2, Briefcase, DollarSign, Clock, AlertCircle, Check, X, Loader2, Package, Upload, FileArchive } from 'lucide-react';
import Link from 'next/link';
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
    const [saving, setSaving] = useState(false);

    // Form State Sound Kits
    const [isEditingKit, setIsEditingKit] = useState(false);
    const [currentKit, setCurrentKit] = useState<Partial<SoundKit> | null>(null);
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
                setCurrentService(serviceToEdit);
                setIsEditing(true);
            }
        }

        if (editKitId) {
            const kitToEdit = soundKits.find(k => k.id === editKitId);
            if (kitToEdit) {
                setCurrentKit(kitToEdit);
                setIsEditingKit(true);
            }
        }
    }, [loading, services, soundKits, searchParams]);

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
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
            setCurrentKit(null);
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
                <div className="bg-accent-soft p-6 rounded-full mb-6 text-accent">
                    <Briefcase size={48} />
                </div>
                <h1 className="text-3xl font-black text-foreground mb-4">Venta de Servicios Exclusiva</h1>
                <p className="text-muted max-w-md mb-8">
                    La venta de servicios (Mezcla, Master, Mentorías, etc.) y Sound Kits es una característica exclusiva para miembros
                    <span className="text-accent font-bold"> Premium</span>.
                </p>
                <Link href="/pricing" className="bg-slate-900 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest hover:bg-slate-800 transition-all">
                    Mejorar a Premium
                </Link>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h1 className="text-4xl font-black uppercase tracking-tighter text-foreground mb-3">Servicios <span className="text-accent">& Sound Kits</span></h1>
                    <div className="flex items-center gap-4">
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em] flex items-center gap-2">
                            <Briefcase size={12} className="text-accent" />
                            Potencia tu Marca
                        </p>
                        <div className="h-3 w-px bg-border" />
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.2em]">Exclusivo Premium</p>
                    </div>
                </div>
                <button
                    onClick={() => { setCurrentService({}); setIsEditing(true); }}
                    className="bg-foreground text-background px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-accent hover:text-white transition-all shadow-xl active:scale-95 flex items-center gap-3 w-fit"
                >
                    <Plus size={16} /> Crear Servicio
                </button>
            </div>

            {/* Services Section */}
            <div>
                {services.length === 0 && !isEditing ? (
                    <div className="p-20 text-center bg-background/50 rounded-[3rem] border-2 border-dashed border-border/60">
                        <div className="w-20 h-20 bg-card rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-muted/20 shadow-inner">
                            <Briefcase size={32} strokeWidth={1.5} />
                        </div>
                        <h3 className="text-xl font-black text-foreground uppercase tracking-tight mb-2">Sin servicios activos</h3>
                        <p className="text-muted text-xs font-bold uppercase tracking-widest max-w-xs mx-auto mb-10 opacity-60 leading-relaxed">
                            Monetiza tu experiencia ofreciendo mezcla, máster o producciones personalizadas.
                        </p>
                        <button
                            onClick={() => { setCurrentService({}); setIsEditing(true); }}
                            className="text-accent font-black text-[10px] uppercase tracking-[0.3em] hover:underline"
                        >
                            Configurar mi primer servicio
                        </button>
                    </div>
                ) : (
                    <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {services.map(service => (
                            <div key={service.id} className="bg-white/50 dark:bg-[#08080a]/60 hover:bg-white dark:hover:bg-[#0c0c0f] border border-slate-100 dark:border-white/5 hover:border-accent/30 rounded-[2.5rem] p-8 transition-all duration-500 group flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl hover:shadow-accent/10">
                                <div className="flex justify-between items-start mb-8">
                                    <div className="w-12 h-12 bg-accent/10 text-accent rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                        <Briefcase size={24} />
                                    </div>
                                    <div className="flex gap-2">
                                        <button onClick={() => { setCurrentService(service); setIsEditing(true); }} className="w-10 h-10 bg-background border border-border/50 text-foreground rounded-xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all">
                                            <Edit3 size={16} />
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="w-10 h-10 bg-background border border-border/50 text-red-500/60 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                            <Trash2 size={16} />
                                        </button>
                                    </div>
                                </div>
                                <h3 className="font-black text-xl text-foreground dark:text-white mb-3 tracking-tight group-hover:text-accent transition-colors">{service.titulo}</h3>
                                <p className="text-muted text-[11px] font-bold uppercase tracking-wide leading-relaxed mb-8 grow line-clamp-3 group-hover:text-foreground/80 dark:group-hover:text-white/80 transition-colors">
                                    {service.descripcion}
                                </p>

                                <div className="flex items-center justify-between pt-6 border-t border-border/50">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Inversión</span>
                                        <span className="font-black text-lg text-foreground dark:text-white tracking-tighter group-hover:text-accent transition-colors">${service.precio} <span className="text-[10px] opacity-40">MXN</span></span>
                                    </div>
                                    <div className="flex flex-col items-end">
                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Entrega</span>
                                        <div className="flex items-center gap-1.5 font-black text-xs text-foreground/80">
                                            <Clock size={14} className="text-accent" />
                                            {service.tiempo_entrega_dias} Días
                                        </div>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>

            <div className="h-px bg-border/50 my-16" />

            {/* Sound Kits Section */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                <div>
                    <h2 className="text-3xl font-black text-foreground dark:text-white tracking-tighter uppercase flex items-center gap-4">
                        Sound Kits
                        <span className="bg-gradient-to-r from-amber-400 to-orange-600 text-white text-[9px] px-3 py-1 rounded-full font-black uppercase tracking-widest shadow-xl shadow-amber-500/20">Premium</span>
                    </h2>
                    <p className="text-muted font-bold text-xs uppercase tracking-widest mt-2">Vende tus librerías y bancos de sonidos exclusivos</p>
                </div>
                <button
                    onClick={() => { setCurrentKit({}); setIsEditingKit(true); }}
                    className="bg-accent text-white px-8 py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.15em] hover:bg-foreground hover:text-background transition-all shadow-[0_20px_40px_-10px_rgba(37,99,235,0.3)] active:scale-95 flex items-center gap-3 w-fit"
                >
                    <Plus size={16} /> Subir Sound Kit
                </button>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 pb-20">
                {soundKits.map(kit => (
                    <div key={kit.id} className="bg-white/50 dark:bg-[#08080a]/60 hover:bg-white dark:hover:bg-[#0c0c0f] border border-slate-100 dark:border-white/5 hover:border-amber-500/30 rounded-[2.5rem] p-8 transition-all duration-500 group flex flex-col h-full hover:-translate-y-2 hover:shadow-2xl hover:shadow-amber-500/10">
                        <div className="flex justify-between items-start mb-8 text-amber-500">
                            <div className="w-12 h-12 bg-amber-500/10 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110">
                                <Package size={24} />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => { setCurrentKit(kit); setIsEditingKit(true); }} className="w-10 h-10 bg-background border border-border/50 text-foreground rounded-xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all">
                                    <Edit3 size={16} />
                                </button>
                                <button onClick={() => handleDeleteKit(kit.id)} className="w-10 h-10 bg-background border border-border/50 text-red-500/60 rounded-xl flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                                    <Trash2 size={16} />
                                </button>
                            </div>
                        </div>
                        <h3 className="font-black text-xl text-foreground mb-3 tracking-tight">{kit.title}</h3>
                        <p className="text-muted text-[11px] font-bold uppercase tracking-wide leading-relaxed mb-8 grow line-clamp-3">
                            {kit.description}
                        </p>
                        <div className="flex items-center justify-between pt-6 border-t border-border/50">
                            <div className="flex flex-col">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Precio</span>
                                <span className="font-black text-lg text-foreground tracking-tighter">${kit.price} <span className="text-[10px] opacity-40">MXN</span></span>
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Formato</span>
                                <div className="flex items-center gap-1.5 font-black text-[10px] text-amber-600 uppercase tracking-widest">
                                    <FileArchive size={14} />
                                    Digital ZIP
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Sound Kit Modal */}
            {isEditingKit && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-y-auto border border-border max-h-[90vh]">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-xl font-black uppercase tracking-tighter flex items-center gap-2 text-foreground">
                                {currentKit?.id ? "Editar Sound Kit" : "Nuevo Sound Kit"}
                                <span className="text-[10px] bg-amber-500/10 text-amber-500 px-2 py-1 rounded-full uppercase tracking-widest">Premium</span>
                            </h2>
                            <button onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitCoverFile(null); }} className="text-muted hover:text-foreground">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleSaveKit} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Título del Sound Kit</label>
                                <input
                                    required
                                    value={currentKit?.title || ''}
                                    onChange={e => setCurrentKit({ ...currentKit, title: e.target.value })}
                                    placeholder="Ej. Urban Drums Vol. 1"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Precio (MXN)</label>
                                    <div className="relative">
                                        <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                        <input
                                            type="number"
                                            required
                                            min="0"
                                            value={currentKit?.price || ''}
                                            onChange={e => setCurrentKit({ ...currentKit, price: Number(e.target.value) })}
                                            className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Portada (Obligatorio)</label>
                                    <div className="relative group">
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png"
                                            required={!currentKit?.cover_url}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setKitCoverFile(file);
                                                }
                                            }}
                                            className="hidden"
                                            id="kit-cover"
                                        />
                                        <label htmlFor="kit-cover" className={`flex flex-col items-center justify-center gap-2 p-1 border-2 border-dashed rounded-xl cursor-pointer hover:bg-background transition-all h-[120px] overflow-hidden relative ${kitCoverFile || currentKit?.cover_url ? 'border-green-500 bg-green-500/10' : 'border-border'}`}>
                                            {kitCoverFile ? (
                                                <img src={URL.createObjectURL(kitCoverFile)} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : currentKit?.cover_url ? (
                                                <img src={currentKit.cover_url} className="absolute inset-0 w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" />
                                            ) : (
                                                <div className="flex flex-col items-center z-10">
                                                    <Upload size={20} className="text-muted mb-2" />
                                                    <span className="text-[9px] font-bold text-muted uppercase">Subir</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Archivo (.zip / .rar - Máx 2GB)</label>
                                <div className={`relative border-2 border-dashed rounded-xl p-6 transition-all ${kitFile ? 'border-accent bg-accent-soft' : 'border-border hover:border-accent'}`}>
                                    <input
                                        type="file"
                                        accept=".zip,.rar"
                                        onChange={e => {
                                            const file = e.target.files?.[0];
                                            if (file) {
                                                if (file.size > 2 * 1024 * 1024 * 1024) {
                                                    alert("El archivo excede el límite de 2GB.");
                                                    e.target.value = '';
                                                    return;
                                                }
                                                setKitFile(file);
                                            }
                                        }}
                                        className="absolute inset-0 opacity-0 cursor-pointer"
                                    />
                                    <div className="flex flex-col items-center text-center">
                                        {kitFile ? (
                                            <>
                                                <FileArchive className="text-accent mb-2" size={24} />
                                                <p className="text-xs font-bold text-accent">{kitFile.name}</p>
                                                <p className="text-[10px] text-accent/70 mt-1">Listo para subir</p>
                                            </>
                                        ) : (
                                            <>
                                                <Upload className="text-muted mb-2" size={24} />
                                                <p className="text-xs font-bold text-muted">{currentKit?.file_url ? "Archivo cargado (Click para cambiar)" : "Haz click o arrastra tu archivo"}</p>
                                                <p className="text-[10px] text-muted mt-1">Formatos permitidos: .zip, .rar</p>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={currentKit?.description || ''}
                                    onChange={e => setCurrentKit({ ...currentKit, description: e.target.value })}
                                    placeholder="¿Qué incluye este kit? (Samples, presets, etc.)"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-muted text-xs focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                {(!currentKit?.title && !currentKit?.price && !kitFile && !currentKit?.file_url) ? (
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitCoverFile(null); }}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-foreground py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitCoverFile(null); }}
                                            className="px-6 py-3 rounded-xl font-bold text-muted uppercase tracking-widest text-xs hover:bg-background transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={kitSaving}
                                            className="flex-1 bg-accent text-white py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent-soft hover:text-accent transition-colors shadow-lg"
                                        >
                                            {kitSaving ? "Subiendo..." : "Guardar Kit"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-card rounded-3xl p-8 max-w-lg w-full shadow-2xl overflow-hidden border border-border">
                        <h2 className="text-xl font-black uppercase tracking-tighter mb-6 text-foreground">
                            {currentService?.id ? "Editar Servicio" : "Nuevo Servicio"}
                        </h2>

                        <form onSubmit={handleSave} className="space-y-4">
                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Categoría</label>
                                <select
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent appearance-none"
                                    value={currentService?.tipo_servicio || 'mixing_mastering'}
                                    onChange={e => setCurrentService({ ...currentService, tipo_servicio: e.target.value })}
                                >
                                    <option value="mixing_mastering">Mezcla y Masterización</option>
                                    <option value="beat_custom">Beat a Medida</option>
                                    <option value="mentoria">Mentoría / Clase</option>
                                    <option value="video_lyric">Video Lyric Premium (4K)</option>
                                    <option value="video_musical">Producción de Video Musical</option>
                                </select>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Título</label>
                                <input
                                    required
                                    value={currentService?.titulo || ''}
                                    onChange={e => setCurrentService({ ...currentService, titulo: e.target.value })}
                                    placeholder="Ej. Mezcla de Voces Pro"
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Precio (MXN)</label>
                                <div className="relative">
                                    <DollarSign size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
                                    <input
                                        type="number"
                                        required
                                        min="0"
                                        value={currentService?.precio || ''}
                                        onChange={e => setCurrentService({ ...currentService, precio: Number(e.target.value) })}
                                        className="w-full bg-background border border-border rounded-xl pl-9 pr-4 py-3 font-bold text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-accent"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-1">Descripción</label>
                                <textarea
                                    rows={3}
                                    value={currentService?.descripcion || ''}
                                    onChange={e => setCurrentService({ ...currentService, descripcion: e.target.value })}
                                    placeholder="Describe qué incluye tu servicio..."
                                    className="w-full bg-background border border-border rounded-xl px-4 py-3 font-medium text-muted text-xs focus:outline-none focus:ring-2 focus:ring-accent resize-none"
                                />
                            </div>

                            <div className="flex gap-3 pt-4">
                                {(!currentService?.titulo && !currentService?.precio && !currentService?.descripcion) ? (
                                    <button
                                        type="button"
                                        onClick={() => { setIsEditing(false); setCurrentService(null); }}
                                        className="flex-1 bg-slate-100 dark:bg-slate-800 text-foreground py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-slate-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                ) : (
                                    <>
                                        <button
                                            type="button"
                                            onClick={() => { setIsEditing(false); setCurrentService(null); }}
                                            className="px-6 py-3 rounded-xl font-bold text-muted uppercase tracking-widest text-xs hover:bg-background transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={saving}
                                            className="flex-1 bg-foreground text-background py-3 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-colors shadow-lg"
                                        >
                                            {saving ? "Guardando..." : "Guardar Servicio"}
                                        </button>
                                    </>
                                )}
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
