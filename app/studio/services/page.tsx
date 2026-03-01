"use client";

import React, { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Edit3, Trash2, Briefcase, DollarSign, Clock, AlertCircle, Check, X, Loader2, Package, Upload, FileArchive, ArrowUpRight, Layers } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import Switch from '@/components/ui/Switch';
import LoadingTianguis from '@/components/LoadingTianguis';

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
    titulo: string;
    descripcion: string;
    precio: number;
    url_archivo: string;
    archivo_muestra_url?: string;
    url_portada?: string;
    es_publico: boolean;
    fecha_creacion: string;
};

export default function ServicesManagerPageWrapper() {
    return (
        <Suspense fallback={<LoadingTianguis />}>
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
    const [kitSampleFile, setKitSampleFile] = useState<File | null>(null);
    const [kitCoverFile, setKitCoverFile] = useState<File | null>(null);

    const [username, setUsername] = useState<string>('');

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Get Tier & Username
        const { data: profile } = await supabase.from('perfiles').select('nivel_suscripcion, nombre_usuario').eq('id', user.id).single();
        setUserTier(profile?.nivel_suscripcion);
        if (profile?.nombre_usuario) setUsername(profile.nombre_usuario);

        // Get Services
        const { data: servicesData } = await supabase
            .from('servicios')
            .select('*')
            .eq('productor_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (servicesData) setServices(servicesData);

        // Get Sound Kits
        const { data: kitsData } = await supabase
            .from('kits_sonido')
            .select('*')
            .eq('productor_id', user.id)
            .order('fecha_creacion', { ascending: false });

        if (kitsData) setSoundKits(kitsData);

        setLoading(false);
    };

    const handleTogglePublicKit = async (id: string, currentStatus: boolean) => {
        const { error } = await supabase
            .from('kits_sonido')
            .update({ es_publico: !currentStatus })
            .eq('id', id);

        if (!error) {
            setSoundKits(prev => prev.map(k => k.id === id ? { ...k, es_publico: !currentStatus } : k));
        }
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
                productor_id: user.id,
                titulo: currentService.titulo,
                descripcion: currentService.descripcion,
                precio: currentService.precio,
                tipo_servicio: currentService.tipo_servicio || 'mixing_mastering',
                tiempo_entrega_dias: currentService.tiempo_entrega_dias || 3,
                es_activo: true
            };

            let error;
            if (currentService.id) {
                // Update
                const { error: err } = await supabase.from('servicios').update(payload).eq('id', currentService.id);
                error = err;
            } else {
                // Create
                const { error: err } = await supabase.from('servicios').insert(payload);
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

        const { error } = await supabase.from('servicios').delete().eq('id', id);
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
        if (!currentKit?.titulo) errors.titulo = "El título es obligatorio";
        if (!currentKit?.descripcion) errors.descripcion = "La descripción es obligatoria";
        if (!currentKit?.precio || currentKit.precio <= 0) errors.precio = "El precio debe ser mayor a 0";
        if (!kitFile && !currentKit?.url_archivo) errors.file = "El archivo del Sound Kit es obligatorio";
        if (!kitCoverFile && !currentKit?.url_portada) errors.cover = "La portada es obligatoria";

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
            let fileUrl = currentKit.url_archivo || '';

            // Handle File Upload (ZIP/RAR)
            if (kitFile) {
                const fileName = `${username}/${Date.now()}-${kitFile.name}`;
                const { data, error: uploadError } = await supabase.storage
                    .from('archivos_kits_sonido')
                    .upload(fileName, kitFile);

                if (uploadError) throw uploadError;
                const { data: { publicUrl: fUrl } } = supabase.storage.from('archivos_kits_sonido').getPublicUrl(fileName); // We'd get it later normally but ok for here
                fileUrl = fUrl; // Ensure we save url or path
            }

            // Handle Cover Upload
            let coverUrl = currentKit.url_portada || null;
            if (kitCoverFile) {
                const fileExt = kitCoverFile.name.split('.').pop();
                const coverName = `${username}/${Date.now()}-cover.${fileExt}`;
                const { data, error: coverError } = await supabase.storage
                    .from('portadas_kits_sonido')
                    .upload(coverName, kitCoverFile);

                if (coverError) throw coverError;

                const { data: { publicUrl } } = supabase.storage
                    .from('portadas_kits_sonido')
                    .getPublicUrl(coverName);

                coverUrl = publicUrl;
            }

            // Handle Sample Audio Upload
            let sampleUrl = currentKit.archivo_muestra_url || null;
            if (kitSampleFile) {
                const sampleName = `${username}/${Date.now()}-sample.mp3`;
                const { data: sampleData, error: sampleError } = await supabase.storage
                    .from('muestras_soundkits')
                    .upload(sampleName, kitSampleFile);

                if (sampleError) throw sampleError;

                const { data: { publicUrl: sUrl } } = supabase.storage
                    .from('muestras_soundkits')
                    .getPublicUrl(sampleName);

                sampleUrl = sUrl;
            }

            if (!fileUrl) {
                alert("Por favor sube un archivo para el Sound Kit");
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
        } catch (err) {
            console.error(err);
            alert("Error al guardar el Sound Kit");
        } finally {
            setKitSaving(false);
        }
    };

    const handleDeleteKit = async (id: string) => {
        if (!confirm("¿Estás seguro de eliminar este Sound Kit?")) return;
        const { error } = await supabase.from('kits_sonido').delete().eq('id', id);
        if (error) alert("Error al eliminar");
        else fetchData();
    };

    if (loading) return <LoadingTianguis />;

    if (userTier !== 'premium') {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-center p-8 bg-slate-50 dark:bg-card/10 rounded-[4rem] border-2 border-dashed border-slate-200 dark:border-border/50">
                {/* Dot grid ambient */}
                <div className="absolute inset-0 opacity-[0.03] pointer-events-none rounded-[4rem]" style={{ backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

                <div className="bg-accent/10 p-8 rounded-[2.5rem] mb-8 text-accent shadow-2xl shadow-accent/20 animate-bounce-slow relative z-10">
                    <Briefcase size={64} strokeWidth={1} />
                </div>

                <h1 className="text-4xl font-black text-slate-900 dark:text-foreground uppercase tracking-tighter mb-4 relative z-10">
                    Branding <span className="text-accent">Profesional</span>
                </h1>
                <p className="text-slate-600 dark:text-muted max-w-md mb-12 font-medium leading-relaxed uppercase text-[10px] tracking-widest relative z-10">
                    Vende servicios de Mezcla, Masterización, Mentoría y Sound Kits. Exclusivo para miembros
                    <span className="text-slate-900 dark:text-foreground font-black mx-1">Premium</span>.
                </p>
                <Link href="/pricing" className="group relative overflow-hidden bg-slate-900 text-white dark:bg-white dark:text-slate-900 px-12 py-5 rounded-2xl font-black uppercase tracking-widest text-xs hover:scale-[1.02] transition-all shadow-xl active:scale-95 flex items-center gap-3 relative z-10">
                    <div className="absolute inset-0 bg-accent translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                    <span className="relative z-10 group-hover:text-white transition-colors">Mejorar a Premium</span>
                    <ArrowUpRight size={16} className="relative z-10 group-hover:text-white transition-colors" />
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
                    className="bg-accent text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-2 w-fit h-fit"
                >
                    <Plus size={16} className="stroke-[3]" /> Crear Servicio
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
                    <div className="py-24 text-center bg-foreground/[0.02] border-2 border-dashed border-border rounded-[3.5rem] relative overflow-hidden group">
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
                            <div key={service.id} className="group relative bg-card border border-border rounded-[3rem] p-10 overflow-hidden transition-all duration-500 hover:border-accent/40 hover:-translate-y-2">
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
                                        }} className="flex-1 h-12 bg-foreground/5 border border-border text-foreground rounded-xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all text-[10px] font-black uppercase tracking-widest gap-2">
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleDelete(service.id)} className="w-12 h-12 bg-white dark:bg-error/5 border border-slate-200 dark:border-error/10 text-error rounded-xl flex items-center justify-center hover:bg-error hover:text-white transition-all shadow-sm">
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
                            Sound <span className="text-accent underline decoration-slate-200 dark:decoration-white/10 underline-offset-8">Kits</span>
                            <span className="bg-accent/10 text-accent text-[10px] px-4 py-1.5 rounded-full font-black uppercase tracking-widest border border-accent/10 shadow-sm md:shadow-lg dark:shadow-accent/5">Premium</span>
                        </h2>
                        <div className="flex flex-col md:flex-row md:items-center gap-4 mt-6">
                            <p className="text-slate-500 dark:text-muted font-bold text-[10px] uppercase tracking-[0.3em] opacity-60">Monetiza tus librerías y bancos de sonidos</p>
                            <div className="flex items-center gap-2 bg-accent/10 text-accent px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border border-accent/10 w-fit">
                                <Package size={12} />
                                {soundKits.length} Sound Kits Subidos
                            </div>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            const empty = { precio: 0 };
                            setCurrentKit(empty);
                            setInitialKit(empty);
                            setKitErrors({});
                            setIsEditingKit(true);
                        }}
                        className="bg-orange-500 text-white px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:scale-105 transition-all shadow-lg active:scale-95 flex items-center gap-2 w-fit h-fit"
                    >
                        <Plus size={16} className="stroke-[3]" /> Sube tu Sound Kit
                    </button>
                </div>

                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 pb-20">
                    {soundKits.map(kit => (
                        <div key={kit.id} className="group relative bg-card border border-border rounded-[3.5rem] overflow-hidden transition-all duration-700 hover:border-amber-500/40 hover:-translate-y-2">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 blur-[100px] -mr-32 -mt-32 pointer-events-none group-hover:bg-amber-500/10 transition-colors" />

                            <div className="relative h-48 w-full overflow-hidden border-b border-slate-200 dark:border-white/5">
                                <Image
                                    src={kit.url_portada || '/placeholder-kit.jpg'}
                                    fill
                                    className="object-cover opacity-60 dark:opacity-40 group-hover:opacity-100 transition-opacity duration-700 group-hover:scale-110"
                                    alt={kit.titulo}
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-white dark:from-[#020205] via-white/40 dark:via-[#020205]/40 to-transparent" />
                                <div className="absolute top-6 left-6 flex items-center gap-2">
                                    <div className="bg-accent/20 backdrop-blur-md border border-accent/20 text-accent px-3 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
                                        Digital Kit
                                    </div>
                                    <div className="flex items-center gap-2 bg-black/40 backdrop-blur-md px-3 py-1.5 rounded-xl border border-white/10">
                                        <Switch
                                            active={kit.es_publico}
                                            onChange={() => handleTogglePublicKit(kit.id, kit.es_publico)}
                                        />
                                        <span className="text-[8px] font-black uppercase text-white tracking-widest leading-none">
                                            {kit.es_publico ? 'Público' : 'Privado'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            <div className="p-10 relative z-10">
                                <h3 className="font-black text-2xl text-slate-900 dark:text-foreground mb-4 tracking-tight group-hover:text-accent transition-colors">{kit.titulo}</h3>
                                <p className="text-slate-500 dark:text-muted text-[11px] font-bold uppercase tracking-widest leading-relaxed mb-10 line-clamp-2 opacity-60">
                                    {kit.descripcion}
                                </p>
                                <div className="flex flex-col items-center gap-6 pt-8 border-t border-slate-200 dark:border-white/5">
                                    <div className="flex flex-col items-center">
                                        <span className="text-[9px] font-black text-accent uppercase tracking-[0.3em] mb-1">Precio</span>
                                        <span className="font-black text-xl text-slate-900 dark:text-foreground tracking-tighter group-hover:text-accent transition-colors">${kit.precio}</span>
                                    </div>
                                    <div className="w-full bg-orange-500/10 border border-orange-500/20 rounded-xl p-3 flex flex-col items-center justify-center gap-2">
                                        <div className="flex items-center gap-2">
                                            <Layers size={14} className="text-orange-400" />
                                            <span className="text-[9px] font-black text-orange-400 uppercase tracking-widest">Incluye Licencia Sound Kit</span>
                                        </div>
                                        {kit.archivo_muestra_url && (
                                            <div className="flex items-center gap-2 text-[8px] font-bold text-emerald-400 uppercase tracking-widest mt-1">
                                                <Music size={10} /> Preview MP3 Listado
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-center gap-3 w-full">
                                        <button onClick={() => {
                                            setCurrentKit({ ...kit });
                                            setInitialKit({ ...kit });
                                            setKitErrors({});
                                            setIsEditingKit(true);
                                        }} className="flex-1 h-12 bg-foreground/5 border border-border text-foreground rounded-xl flex items-center justify-center hover:bg-foreground hover:text-background transition-all text-[10px] font-black uppercase tracking-widest gap-2">
                                            <Edit3 size={14} /> Editar
                                        </button>
                                        <button onClick={() => handleDeleteKit(kit.id)} className="w-12 h-12 bg-white dark:bg-error/5 border border-slate-200 dark:border-error/10 text-error rounded-xl flex items-center justify-center hover:bg-error hover:text-white transition-all shadow-sm">
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
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in transition-all">
                    <div className="bg-background rounded-[2rem] p-6 md:p-10 max-w-xl w-full shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-y-auto border border-border max-h-[90vh] relative">
                        <button onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitSampleFile(null); setKitCoverFile(null); setKitErrors({}); }} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all z-10 group">
                            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="mb-8 text-center md:text-left">
                            <h2 className="text-3xl font-black tracking-tight flex flex-col md:flex-row md:items-center gap-2 text-slate-900 dark:text-foreground mb-2">
                                {currentKit?.id ? "Afinando el" : "Sube tu"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-amber-500">Sound Kit</span>
                            </h2>
                            <p className="text-xs font-medium text-muted">Añade samples y bancos de sonidos en formato ZIP/RAR.</p>
                        </div>

                        <form onSubmit={handleSaveKit} className="space-y-8">
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Título del Kit</label>
                                            {kitErrors.titulo && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.titulo}</span>}
                                        </div>
                                        <input
                                            required
                                            value={currentKit?.titulo || ''}
                                            onChange={e => {
                                                setCurrentKit({ ...currentKit, titulo: e.target.value });
                                                if (e.target.value) setKitErrors(prev => ({ ...prev, titulo: '' }));
                                            }}
                                            placeholder="Ej. Urban Drums Vol. 1"
                                            className={`w-full bg-foreground/5 dark:bg-white/5 border ${kitErrors.titulo ? 'border-red-500' : 'border-transparent focus:border-orange-500/50'} rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all`}
                                        />
                                    </div>
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Valor Comercial (MXN)</label>
                                            {kitErrors.precio && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.precio}</span>}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-orange-500/10 rounded-xl flex items-center justify-center text-orange-500 group-focus-within:bg-orange-500 group-focus-within:text-white transition-colors">
                                                <DollarSign size={16} strokeWidth={3} />
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={currentKit?.precio || ''}
                                                onChange={e => {
                                                    setCurrentKit({ ...currentKit, precio: Number(e.target.value) });
                                                    if (Number(e.target.value) > 0) setKitErrors(prev => ({ ...prev, precio: '' }));
                                                }}
                                                className={`w-full bg-foreground/5 dark:bg-white/5 border ${kitErrors.precio ? 'border-red-500' : 'border-transparent focus:border-orange-500/50'} rounded-2xl pl-14 pr-5 py-4 font-black text-slate-900 dark:text-white tracking-tight focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all tabular-nums text-lg`}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Portada del Kit</label>
                                        {kitErrors.cover && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.cover}</span>}
                                    </div>
                                    <div className={`relative group aspect-[4/3] rounded-2xl overflow-hidden border-2 border-dashed transition-all cursor-pointer ${kitErrors.cover ? 'border-red-500 bg-red-500/5' : (kitCoverFile || currentKit?.url_portada ? 'border-transparent' : 'border-border hover:border-orange-500/40 hover:bg-orange-500/5')}`}>
                                        <input
                                            type="file"
                                            accept=".jpg,.jpeg,.png,.webp"
                                            required={!currentKit?.url_portada}
                                            onChange={(e) => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setKitCoverFile(file);
                                                    setKitErrors(prev => ({ ...prev, cover: '' }));
                                                }
                                            }}
                                            className="hidden"
                                            id="kit-cover"
                                        />
                                        <label htmlFor="kit-cover" className="absolute inset-0 w-full h-full flex flex-col items-center justify-center p-6 text-center cursor-pointer">
                                            {kitCoverFile ? (
                                                <img src={URL.createObjectURL(kitCoverFile)} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Cover preview" />
                                            ) : currentKit?.url_portada ? (
                                                <img src={currentKit.url_portada} className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" alt="Saved cover" />
                                            ) : (
                                                <>
                                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-4 transition-colors ${kitErrors.cover ? 'bg-red-500/10 text-red-500' : 'bg-foreground/5 dark:bg-white/5 text-muted group-hover:bg-orange-500/10 group-hover:text-orange-500'}`}>
                                                        <span className="hidden"></span>
                                                        <Upload size={24} />
                                                    </div>
                                                    <span className={`text-xs font-black uppercase tracking-wider transition-colors ${kitErrors.cover ? 'text-red-500' : 'text-slate-900 dark:text-foreground group-hover:text-orange-500'}`}>Subir Artwork</span>
                                                    <span className="text-[10px] font-medium text-muted mt-2">Formatos válidos: JPG, PNG, WEBP</span>
                                                </>
                                            )}
                                        </label>
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gradient-to-br from-orange-500/10 to-amber-500/5 border border-orange-500/20 rounded-2xl p-4 flex flex-col md:flex-row items-center md:items-start gap-3">
                                <div className="p-2.5 bg-orange-500/20 text-orange-500 rounded-xl shrink-0 shadow-inner">
                                    <Layers size={20} strokeWidth={2.5} />
                                </div>
                                <div className="text-center md:text-left">
                                    <h4 className="text-orange-500 font-black text-xs uppercase tracking-wide mb-1">Licencia Sound Kit</h4>
                                    <p className="text-slate-700 dark:text-muted/90 text-[10px] font-medium leading-relaxed">
                                        Otorgas a los compradores el derecho **no exclusivo** de usar los sonidos. La reventa individual del contenido está prohibida.
                                    </p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Preview (MP3) del Kit</label>
                                    </div>
                                    <div className={`relative border-2 border-dashed rounded-2xl p-6 transition-all text-center group ${kitSampleFile ? 'border-emerald-500 bg-emerald-500/5' : 'border-border hover:border-emerald-500/40 hover:bg-emerald-500/5'}`}>
                                        <input
                                            type="file"
                                            accept="audio/mpeg"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    setKitSampleFile(file);
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center">
                                            {kitSampleFile ? (
                                                <>
                                                    <Music size={24} className="text-emerald-500 mb-2" />
                                                    <p className="text-[10px] font-black text-slate-900 dark:text-foreground truncate max-w-[200px]">{kitSampleFile.name}</p>
                                                </>
                                            ) : (
                                                <>
                                                    <Music size={24} className="text-muted group-hover:text-emerald-500 mb-2 transition-colors" />
                                                    <p className="text-[9px] font-black uppercase tracking-wider text-muted group-hover:text-emerald-500 transition-colors">
                                                        {currentKit?.archivo_muestra_url ? "Click p/ actualizar Preview" : "Subir Preview MP3"}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Archivo .ZIP / .RAR de la librería</label>
                                        {kitErrors.file && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.file}</span>}
                                    </div>
                                    <div className={`relative border-2 border-dashed rounded-2xl p-8 transition-all text-center group ${kitErrors.file ? 'border-red-500 bg-red-500/5' : (kitFile ? 'border-orange-500 bg-orange-500/5' : 'border-border hover:border-orange-500/40 hover:bg-orange-500/5')}`}>
                                        <input
                                            type="file"
                                            accept=".zip,.rar"
                                            onChange={e => {
                                                const file = e.target.files?.[0];
                                                if (file) {
                                                    if (file.size > 2 * 1024 * 1024 * 1024) { alert("Límite de 2GB excedido"); e.target.value = ''; return; }
                                                    setKitFile(file);
                                                    setKitErrors(prev => ({ ...prev, file: '' }));
                                                }
                                            }}
                                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                                        />
                                        <div className="flex flex-col items-center">
                                            {kitFile ? (
                                                <>
                                                    <div className="w-16 h-16 bg-orange-500 text-white rounded-xl flex items-center justify-center mb-4 shadow-lg shadow-orange-500/20">
                                                        <FileArchive size={32} />
                                                    </div>
                                                    <p className="text-sm font-black text-slate-900 dark:text-foreground">{kitFile.name}</p>
                                                    <p className="text-xs font-medium text-orange-500 mt-1">Listo para subirse</p>
                                                </>
                                            ) : (
                                                <>
                                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${kitErrors.file ? 'bg-red-500/10 text-red-500' : 'bg-foreground/5 dark:bg-white/5 text-muted group-hover:bg-orange-500/10 group-hover:text-orange-500'}`}>
                                                        <FileArchive size={32} />
                                                    </div>
                                                    <p className={`text-sm font-black uppercase tracking-wider transition-colors ${kitErrors.file ? 'text-red-500' : 'text-slate-900 dark:text-foreground group-hover:text-orange-500'}`}>
                                                        {currentKit?.url_archivo ? "Click para actualizar .ZIP" : "Anclar banco de sonidos"}
                                                    </p>
                                                    <p className="text-xs font-medium text-muted mt-2">Soporte máximo: 2GB por lanzamiento</p>
                                                </>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Descripción del contenido</label>
                                        {kitErrors.descripcion && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{kitErrors.descripcion}</span>}
                                    </div>
                                    <textarea
                                        rows={4}
                                        value={currentKit?.descripcion || ''}
                                        onChange={e => {
                                            setCurrentKit({ ...currentKit, descripcion: e.target.value });
                                            if (e.target.value) setKitErrors(prev => ({ ...prev, descripcion: '' }));
                                        }}
                                        placeholder="Enumera lo que incluye: 50 kicks, 30 snares, 20 hi-hats..."
                                        className={`w-full bg-foreground/5 dark:bg-white/5 border ${kitErrors.descripcion ? 'border-red-500' : 'border-transparent focus:border-orange-500/50'} rounded-2xl px-5 py-4 font-medium text-slate-900 dark:text-white placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-orange-500/10 transition-all resize-none shadow-sm`}
                                    />
                                </div>
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditingKit(false); setCurrentKit(null); setKitFile(null); setKitSampleFile(null); setKitCoverFile(null); setKitErrors({}); }}
                                    className="px-6 py-4 rounded-xl font-bold text-muted hover:bg-foreground/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={kitSaving}
                                    className="flex-1 bg-orange-500 text-white py-4 rounded-xl font-black uppercase tracking-wider hover:bg-orange-600 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                >
                                    {kitSaving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" /> Subiendo...
                                        </span>
                                    ) : (currentKit?.id ? "Guardar Cambios" : "Publicar Sound Kit")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {isEditing && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xl animate-in fade-in transition-all">
                    <div className="bg-background rounded-[2rem] p-6 md:p-10 max-w-xl w-full shadow-[0_0_80px_rgba(0,0,0,0.5)] overflow-y-auto border border-border max-h-[90vh] relative">
                        <button onClick={() => { setIsEditing(false); setCurrentService(null); setInitialService(null); setServiceErrors({}); }} className="absolute top-6 right-6 w-10 h-10 rounded-full bg-foreground/5 dark:bg-white/5 border border-border dark:border-white/10 flex items-center justify-center text-muted hover:text-white hover:bg-rose-500 hover:border-rose-500 transition-all z-10 group">
                            <X size={18} className="group-hover:rotate-90 transition-transform duration-300" />
                        </button>

                        <div className="mb-8 text-center md:text-left">
                            <h2 className="text-3xl font-black tracking-tight flex flex-col md:flex-row md:items-center gap-2 text-slate-900 dark:text-foreground mb-2">
                                {currentService?.id ? "Afinando el" : "Crear"} <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent to-blue-500">Servicio</span>
                            </h2>
                            <p className="text-xs font-medium text-muted">Acepta pedidos de mezcla, masterización o beats a medida.</p>
                        </div>

                        <form onSubmit={handleSave} className="space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Especialidad</label>
                                        </div>
                                        <select
                                            className={`w-full bg-foreground/5 dark:bg-white/5 border border-transparent focus:border-accent/50 rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all appearance-none`}
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
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Plazo (Días)</label>
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-focus-within:bg-accent group-focus-within:text-white transition-colors">
                                                <Clock size={16} strokeWidth={3} />
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="1"
                                                value={currentService?.tiempo_entrega_dias || ''}
                                                onChange={e => setCurrentService({ ...currentService, tiempo_entrega_dias: Number(e.target.value) })}
                                                className={`w-full bg-foreground/5 dark:bg-white/5 border border-transparent focus:border-accent/50 rounded-2xl pl-14 pr-5 py-4 font-black text-slate-900 dark:text-white tracking-tight focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all tabular-nums`}
                                            />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Título</label>
                                            {serviceErrors.titulo && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{serviceErrors.titulo}</span>}
                                        </div>
                                        <input
                                            required
                                            value={currentService?.titulo || ''}
                                            onChange={e => {
                                                setCurrentService({ ...currentService, titulo: e.target.value });
                                                if (e.target.value) setServiceErrors(prev => ({ ...prev, titulo: '' }));
                                            }}
                                            placeholder="Ej. Beat Exclusivo a Medida"
                                            className={`w-full bg-foreground/5 dark:bg-white/5 border ${serviceErrors.titulo ? 'border-red-500' : 'border-transparent focus:border-accent/50'} rounded-2xl px-5 py-4 font-bold text-slate-900 dark:text-white placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all`}
                                        />
                                    </div>

                                    <div>
                                        <div className="flex items-center justify-between mb-2">
                                            <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Inversión (MXN)</label>
                                            {serviceErrors.precio && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{serviceErrors.precio}</span>}
                                        </div>
                                        <div className="relative group">
                                            <div className="absolute left-4 top-1/2 -translate-y-1/2 w-8 h-8 bg-accent/10 rounded-xl flex items-center justify-center text-accent group-focus-within:bg-accent group-focus-within:text-white transition-colors">
                                                <DollarSign size={16} strokeWidth={3} />
                                            </div>
                                            <input
                                                type="number"
                                                required
                                                min="0"
                                                value={currentService?.precio || ''}
                                                onChange={e => {
                                                    setCurrentService({ ...currentService, precio: Number(e.target.value) });
                                                    if (Number(e.target.value) > 0) setServiceErrors(prev => ({ ...prev, precio: '' }));
                                                }}
                                                className={`w-full bg-foreground/5 dark:bg-white/5 border ${serviceErrors.precio ? 'border-red-500' : 'border-transparent focus:border-accent/50'} rounded-2xl pl-14 pr-5 py-4 font-black text-slate-900 dark:text-white tracking-tight focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all tabular-nums text-lg`}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <label className="text-xs font-black uppercase tracking-wider text-slate-700 dark:text-foreground/80">Descripción del Servicio</label>
                                    {serviceErrors.descripcion && <span className="text-[10px] text-red-500 font-bold uppercase tracking-widest">{serviceErrors.descripcion}</span>}
                                </div>
                                <textarea
                                    rows={3}
                                    value={currentService?.descripcion || ''}
                                    onChange={e => {
                                        setCurrentService({ ...currentService, descripcion: e.target.value });
                                        if (e.target.value) setServiceErrors(prev => ({ ...prev, descripcion: '' }));
                                    }}
                                    placeholder="Detalla exactamente qué recibirá tu cliente en este servicio..."
                                    className={`w-full bg-foreground/5 dark:bg-white/5 border ${serviceErrors.descripcion ? 'border-red-500' : 'border-transparent focus:border-accent/50'} rounded-2xl px-5 py-4 font-medium text-slate-900 dark:text-white placeholder:text-muted/50 focus:outline-none focus:ring-4 focus:ring-accent/10 transition-all resize-none shadow-sm`}
                                />
                            </div>

                            <div className="flex gap-4 pt-6 border-t border-border">
                                <button
                                    type="button"
                                    onClick={() => { setIsEditing(false); setCurrentService(null); setInitialService(null); setServiceErrors({}); }}
                                    className="px-6 py-4 rounded-xl font-bold text-muted hover:bg-foreground/5 dark:hover:bg-white/5 hover:text-slate-900 dark:hover:text-foreground transition-all"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="flex-1 bg-accent text-white py-4 rounded-xl font-black uppercase tracking-wider hover:bg-accent/90 transition-all shadow-xl active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed text-xs"
                                >
                                    {saving ? (
                                        <span className="flex items-center justify-center gap-2">
                                            <Loader2 size={16} className="animate-spin" /> Guardando...
                                        </span>
                                    ) : (currentService?.id ? "Guardar Cambios" : "Activar Servicio")}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
