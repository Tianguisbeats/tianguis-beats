"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronLeft, Hash, Lock,
    Link as LinkIcon, Edit2, Zap, Eye, EyeOff, Save, X, Crown, ShieldCheck, FileText, Layers, Star
} from 'lucide-react';
import TagInput from '@/components/ui/TagInput';
import Switch from '@/components/ui/Switch';

import { GENRES, MOODS, SUBGENRES, MUSICAL_KEYS } from '@/lib/constants';
import { EXCHANGE_RATES } from '@/context/CurrencyContext';


export default function EditBeatPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;
    const router = useRouter();

    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Initial Data for Dirty Check
    const [initialData, setInitialData] = useState<any>(null);

    // Form State
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [subgenre, setSubgenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [tonoEscala, setTonoEscala] = useState('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [beatTypes, setBeatTypes] = useState<string[]>([]);

    // License States
    const [isBasicActive, setIsBasicActive] = useState(true);
    const [isMp3Active, setIsMp3Active] = useState(true);
    const [isProActive, setIsProActive] = useState(true);
    const [isPremiumActive, setIsPremiumActive] = useState(true);
    const [isExclusiveActive, setIsExclusiveActive] = useState(false);
    const [isSoundKitActive, setIsSoundKitActive] = useState(false);

    const [basicPrice, setBasicPrice] = useState('199');
    const [mp3Price, setMp3Price] = useState('349');
    const [proPrice, setProPrice] = useState('499');
    const [premiumPrice, setPremiumPrice] = useState('999');
    const [exclusivePrice, setExclusivePrice] = useState('3500');
    const [soundKitPrice, setSoundKitPrice] = useState('499');

    // Existing URLs
    const [existingPortada, setExistingPortada] = useState<string | null>(null);
    const [existingMp3HQ, setExistingMp3HQ] = useState<string | null>(null);
    const [existingWav, setExistingWav] = useState<string | null>(null);
    const [existingStems, setExistingStems] = useState<string | null>(null);
    const [existingPreview, setExistingPreview] = useState<string | null>(null);

    // New Files State
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [hqMp3File, setHqMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

    const validateFile = (file: File | null, allowedExtensions: string[], label: string, maxMB: number) => {
        if (!file) return null;
        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
            setError(`Archivo inválido para ${label}. Solo se permiten extensiones: ${allowedExtensions.join(', ')}`);
            return null;
        }
        if (file.size > 2048 * 1024 * 1024) {
            setError(`${label}: El peso máximo es de 2GB.`);
            return null;
        }
        return file;
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('perfiles')
                .select('id, nombre_usuario, nombre_artistico, nivel_suscripcion')
                .eq('id', session.user.id)
                .single();
            setUserData(profile);

            const { data: beat, error: beatError } = await supabase
                .from('beats')
                .select('*')
                .eq('id', id)
                .single();

            if (beatError || !beat) {
                setError("No se pudo cargar el beat.");
                setLoading(false);
                return;
            }

            if (beat.productor_id !== session.user.id) {
                router.push('/studio/beats');
                return;
            }

            // Populate Form
            setTitle(beat.titulo || '');
            setGenre(beat.genero || '');
            setSubgenre(beat.subgenero || '');
            setBpm(beat.bpm?.toString() || '');
            // Normalize Tono/Escala on load (Backward compatibility for labels)
            const rawTono = beat.tono_escala || '';
            const matchedKey = MUSICAL_KEYS.find(k => k.value === rawTono || k.label === rawTono);
            const normalizedTono = matchedKey ? matchedKey.value : rawTono;

            setTonoEscala(normalizedTono);
            setSelectedMoods(beat.vibras ? beat.vibras.split(', ') : []);
            setBeatTypes(beat.tipos_beat || []);

            setBasicPrice(beat.precio_basico_mxn?.toString() || '199');
            setMp3Price(beat.precio_mp3_mxn?.toString() || '349');
            setProPrice(beat.precio_pro_mxn?.toString() || '599');
            setPremiumPrice(beat.precio_premium_mxn?.toString() || '999');
            setExclusivePrice(beat.precio_exclusiva_mxn?.toString() || beat.precio_exclusivo_mxn?.toString() || '3500');

            setIsBasicActive(beat.es_basica_activa !== false);
            setIsMp3Active(beat.es_mp3_activa !== false);
            setIsProActive(beat.es_pro_activa !== false);
            setIsPremiumActive(beat.es_premium_activa !== false);
            setIsExclusiveActive(beat.es_exclusiva_activa || false);
            setIsSoundKitActive(beat.es_soundkit_activa || false);

            setExistingPortada(beat.portada_url);
            setExistingMp3HQ(beat.archivo_mp3_url);
            setExistingWav(beat.archivo_wav_url);
            setExistingStems(beat.archivo_stems_url);
            setExistingPreview(beat.archivo_muestra_url);

            setInitialData({
                titulo: beat.titulo || '',
                genero: beat.genero || '',
                subgenero: beat.subgenero || '',
                bpm: beat.bpm?.toString() || '',

                vibras: beat.vibras ? beat.vibras.split(', ') : [],
                tipos_beat: beat.tipos_beat || [],
                precio_basico_mxn: beat.precio_basico_mxn?.toString() || '199',
                precio_pro_mxn: beat.precio_pro_mxn?.toString() || '499',
                precio_premium_mxn: beat.precio_premium_mxn?.toString() || '999',
                precio_ilimitado_mxn: beat.precio_ilimitado_mxn?.toString() || '1999',
                precio_exclusivo_mxn: beat.precio_exclusivo_mxn?.toString() || '3500',
                es_basica_activa: beat.es_basica_activa !== false,
                es_pro_activa: beat.es_pro_activa !== false,
                es_premium_activa: beat.es_premium_activa !== false,
                es_ilimitada_activa: beat.es_ilimitada_activa !== false,
                es_exclusiva_activa: beat.es_exclusiva_activa || false,
            });

            setLoading(false);
        };
        loadInitialData();
    }, [id, router]);

    const handleMoodToggle = (mood: string) => {
        if (selectedMoods.includes(mood)) {
            setSelectedMoods(selectedMoods.filter(m => m !== mood));
        } else if (selectedMoods.length < 3) {
            setSelectedMoods([...selectedMoods, mood]);
        }
    };

    // Dirty Check Logic
    const hasChanges = initialData ? (
        title !== initialData.titulo ||
        genre !== initialData.genero ||
        subgenre !== initialData.subgenero ||
        bpm !== initialData.bpm ||
        tonoEscala !== initialData.tono_escala ||
        JSON.stringify(selectedMoods.sort()) !== JSON.stringify(initialData.vibras.sort()) ||
        JSON.stringify(beatTypes.sort()) !== JSON.stringify(initialData.tipos_beat.sort()) ||
        basicPrice !== initialData.precio_basico_mxn ||
        proPrice !== initialData.precio_pro_mxn ||
        premiumPrice !== initialData.precio_premium_mxn ||
        exclusivePrice !== initialData.precio_exclusivo_mxn ||
        isBasicActive !== initialData.es_basica_activa ||
        isProActive !== initialData.es_pro_activa ||
        isPremiumActive !== initialData.es_premium_activa ||
        isExclusiveActive !== initialData.es_exclusiva_activa ||
        coverFile !== null ||
        previewFile !== null ||
        hqMp3File !== null ||
        wavFile !== null ||
        stemsFile !== null
    ) : false;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!hasChanges) {
            router.back();
            return;
        }

        const missingFields = [];
        if (!title) missingFields.push("Título");
        if (!genre) missingFields.push("Género");
        if (!bpm) missingFields.push("BPM");
        if (!tonoEscala) missingFields.push("Tono/Escala");

        if (missingFields.length > 0) {
            setError(`Faltan campos obligatorios: ${missingFields.join(", ")}`);
            return;
        }

        if (selectedMoods.length !== 3) {
            setError("Mood Tags: Debes seleccionar exactamente 3 etiquetas para poder guardar.");
            return;
        }

        if (beatTypes.length < 1) {
            setError("Artistas de Referencia: Debes agregar al menos 1 artista de referencia.");
            return;
        }

        if (!userData) return;

        setSaving(true);
        setError(null);

        try {
            const username = userData.nombre_usuario;
            const timestamp = Date.now();
            const sanitize = (name: string) => name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

            let portada_url = existingPortada;
            let archivo_mp3_url = existingMp3HQ;
            let archivo_wav_url = existingWav;
            let archivo_stems_url = existingStems;
            let archivo_muestra_url = existingPreview;

            // 1. Update Files
            if (coverFile) {
                const coverPath = `${userData.nombre_usuario}/${sanitize(coverFile.name)}`;
                await supabase.storage.from('portadas_beats').upload(coverPath, coverFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(coverPath);
                portada_url = publicUrl;
            }

            if (previewFile) {
                const previewPath = `${userData.nombre_usuario}/${sanitize(previewFile.name)}`;
                await supabase.storage.from('muestras_beats').upload(previewPath, previewFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('muestras_beats').getPublicUrl(previewPath);
                archivo_muestra_url = publicUrl;
            }

            if (hqMp3File) {
                const hqPath = `${userData.nombre_usuario}/${sanitize(hqMp3File.name)}`;
                await supabase.storage.from('beats_mp3').upload(hqPath, hqMp3File, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('beats_mp3').getPublicUrl(hqPath);
                archivo_mp3_url = publicUrl;
            }

            if (wavFile && userData.nivel_suscripcion !== 'free') {
                const wavPath = `${userData.nombre_usuario}/${sanitize(wavFile.name)}`;
                await supabase.storage.from('beats_wav').upload(wavPath, wavFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('beats_wav').getPublicUrl(wavPath);
                archivo_wav_url = publicUrl;
            }

            if (stemsFile && userData.nivel_suscripcion === 'premium') {
                const stemsPath = `${userData.nombre_usuario}/${sanitize(stemsFile.name)}`;
                await supabase.storage.from('beats_stems').upload(stemsPath, stemsFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('beats_stems').getPublicUrl(stemsPath);
                archivo_stems_url = publicUrl;
            }

            // 2. Update DB
            const { error: dbError } = await supabase.from('beats').update({
                titulo: title,
                genero: genre,
                subgenero: subgenre,
                bpm: parseInt(bpm),
                tono_escala: tonoEscala,
                vibras: selectedMoods.join(', '),
                tipos_beat: beatTypes,
                artista_referencia: beatTypes.join(', '), // Sync for fuzzy search
                portada_url,
                archivo_mp3_url,
                archivo_muestra_url,
                archivo_wav_url,
                archivo_stems_url,

                es_basica_activa: isBasicActive,
                es_mp3_activa: isMp3Active,
                es_pro_activa: isProActive,
                es_premium_activa: isPremiumActive,
                es_exclusiva_activa: isExclusiveActive,
                es_soundkit_activa: isSoundKitActive,

                precio_basico_mxn: parseInt(basicPrice) || 0,
                precio_mp3_mxn: parseInt(mp3Price) || 0,
                precio_pro_mxn: parseInt(proPrice) || 0,
                precio_premium_mxn: parseInt(premiumPrice) || 0,
                precio_exclusiva_mxn: isExclusiveActive ? parseInt(exclusivePrice) : null,
                precio_soundkit_mxn: parseInt(soundKitPrice) || 0,
            }).eq('id', id);

            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => router.push('/studio/beats'), 1500);

        } catch (err: any) {
            setError(err.message || "Error al actualizar el beat");
        } finally {
            setSaving(false);
        }
    };

    if (loading) return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
            <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted animate-pulse">Cargando Beat...</p>
        </div>
    );

    const isFree = userData?.nivel_suscripcion === 'free' || !userData?.nivel_suscripcion;
    const isPro = userData?.nivel_suscripcion === 'pro';
    const isPremium = userData?.nivel_suscripcion === 'premium';

    const Toggle = ({ active, onToggle, disabled = false }: { active: boolean, onToggle: () => void, disabled?: boolean }) => (
        <Switch
            active={active}
            onChange={onToggle}
            disabled={disabled}
            activeColor="bg-accent"
        />
    );

    // Helper for Price Conversion Preview
    const PricePreview = ({ price }: { price: string }) => {
        const amount = parseInt(price) || 0;
        if (amount <= 0) return null;
        const usd = (amount * EXCHANGE_RATES.USD).toFixed(2);
        const eur = (amount * EXCHANGE_RATES.EUR).toFixed(2);
        return (
            <div className="flex gap-2 mt-1.5 px-2">
                <span className="text-[9px] font-black text-accent/70 uppercase">≈ ${usd} USD</span>
                <span className="text-[9px] font-black text-purple-500/70 uppercase">≈ €{eur} EUR</span>
            </div>
        );
    };

    return (
        <div className="w-full">
            {/* Header */}
            <div className="mb-14 flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="flex items-center gap-5">
                    <Link href="/studio/beats" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-accent hover:border-accent/30 transition-all group">
                        <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                    </Link>
                    <div>
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl border mb-3 shadow-xl" style={{ background: '#3b82f6', borderColor: '#ffffff20' }}>
                            <Crown size={12} className="text-white fill-white" />
                            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Modo Edición Profunda</span>
                        </div>
                        <h1 className="text-5xl font-black uppercase tracking-tighter leading-[1] text-foreground">
                            Editar <span className="text-accent underline decoration-white/10 underline-offset-8">Beat.</span>
                        </h1>
                    </div>
                </div>
            </div>

            {/* Error / Success */}
            {error && (
                <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold mb-8">
                    <AlertCircle size={16} className="shrink-0" /> {error}
                    <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
                </div>
            )}
            {success && (
                <div className="flex items-center gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-8">
                    <CheckCircle2 size={24} className="shrink-0" /> <span className="text-base uppercase tracking-tight">¡Cambios guardados con éxito! Redirigiendo...</span>
                </div>
            )}

            <form onSubmit={handleUpdate} className="space-y-10">
                {/* ─── SECTION 1: Identidad del Beat ─── */}
                <div className="bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden transition-all">
                    <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-11 h-11 bg-accent/10 rounded-2xl flex items-center justify-center text-accent ring-1 ring-accent/20">
                            <Star size={20} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Identidad del Beat</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">Configuración musical y visual</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 gap-10">
                        {/* Col 1 */}
                        <div className="space-y-6">
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">Título del Beat *</label>
                                <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej: Dark Summer Remix"
                                    className="w-full bg-foreground/5 border border-border rounded-[1.25rem] px-5 py-4.5 text-base font-bold outline-none focus:border-accent/50 focus:bg-foreground/[0.08] transition-all text-foreground placeholder:text-muted/30" />
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">Género *</label>
                                    <select value={genre} onChange={e => { setGenre(e.target.value); setSubgenre(''); }} required
                                        className="w-full bg-foreground/5 border border-border rounded-[1.25rem] px-5 py-4 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none text-foreground cursor-pointer">
                                        <option value="">Seleccionar</option>
                                        {GENRES.map(g => <option key={g} value={g} className="bg-[#020205]">{g}</option>)}
                                    </select>
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">Subgénero</label>
                                    <select value={subgenre} onChange={e => setSubgenre(e.target.value)} disabled={!genre || !SUBGENRES[genre]}
                                        className="w-full bg-foreground/5 border border-border rounded-[1.25rem] px-5 py-4 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none disabled:opacity-40 text-foreground cursor-pointer">
                                        <option value="">{genre ? 'Ninguno' : 'Selecciona género'}</option>
                                        {genre && SUBGENRES[genre]?.map(sg => <option key={sg} value={sg} className="bg-[#020205]">{sg}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-5">
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">BPM *</label>
                                    <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} required placeholder="140"
                                        className="w-full bg-foreground/5 border border-border rounded-[1.25rem] px-5 py-4.5 text-base font-bold outline-none focus:border-accent/50 focus:bg-foreground/[0.08] transition-all text-foreground placeholder:text-muted/30" />
                                </div>
                                <div className="space-y-2.5">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">Tono / Escala *</label>
                                    <select value={tonoEscala} onChange={e => setTonoEscala(e.target.value)} required
                                        className="w-full bg-foreground/5 border border-border rounded-[1.25rem] px-5 py-4 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none text-foreground cursor-pointer">
                                        <option value="">Seleccionar</option>
                                        <optgroup label="NATURALES" className="bg-[#020205] text-accent">
                                            {MUSICAL_KEYS.filter(k => k.group === 'natural').map(k => <option key={k.value} value={k.value} className="bg-[#020205]">{k.label}</option>)}
                                        </optgroup>
                                        <optgroup label="ALTERADAS (PRO)" className="bg-[#020205] text-muted">
                                            {MUSICAL_KEYS.filter(k => k.group === 'accidental').map(k => <option key={k.value} value={k.value} className="bg-[#020205]">{k.label}</option>)}
                                        </optgroup>
                                    </select>
                                </div>
                            </div>

                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">Artistas de Referencia *</label>
                                <TagInput tags={beatTypes} setTags={setBeatTypes} placeholder="Ej: Tainy, 808 Mafia..." />
                            </div>
                        </div>

                        {/* Col 2 */}
                        <div className="space-y-6">
                            {/* Cover upload */}
                            <div className="space-y-2.5">
                                <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted ml-1">Artwork (Premium · 3000px) *</label>
                                <input type="file" accept=".jpg,.jpeg,.png"
                                    onChange={e => {
                                        const f = e.target.files?.[0] || null;
                                        if (f && !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) { setError("Artwork: Solo JPG/PNG"); e.target.value = ''; return; }
                                        setCoverFile(f);
                                    }} className="hidden" id="cover" />
                                <label htmlFor="cover" className="flex items-center gap-6 p-6 bg-foreground/5 border-2 border-dashed border-border rounded-[2rem] cursor-pointer hover:bg-foreground/8 hover:border-accent/30 transition-all h-[160px] overflow-hidden group">
                                    {(coverFile || existingPortada) ? (
                                        <div className="flex items-center gap-5 w-full">
                                            <div className="w-28 h-28 rounded-2xl overflow-hidden border border-border shrink-0 shadow-2xl group-hover:scale-105 transition-transform">
                                                <img src={coverFile ? URL.createObjectURL(coverFile) : existingPortada!} className="w-full h-full object-cover" alt="Preview" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-foreground truncate max-w-[160px] uppercase tracking-tighter">{coverFile ? coverFile.name : 'Portada Actual'}</p>
                                                <p className={`text-[9px] font-black uppercase tracking-widest mt-1.5 ${coverFile ? 'text-emerald-400' : 'text-accent'}`}>
                                                    {coverFile ? '✓ Reemplazo cargado' : 'Click para cambiar'}
                                                </p>
                                            </div>
                                        </div>
                                    ) : (
                                        <div className="flex flex-col items-center justify-center w-full text-muted">
                                            <ImageIcon size={32} className="mb-3 opacity-20" />
                                            <span className="text-[10px] font-black uppercase tracking-[0.2em]">Seleccionar Artwork</span>
                                            <span className="text-[8px] font-bold text-muted/40 uppercase mt-1">Click o arrastra archivo</span>
                                        </div>
                                    )}
                                </label>
                            </div>

                            {/* Moods */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between px-1">
                                    <label className="text-[10px] font-black uppercase tracking-[0.25em] text-muted">Mood Tags (Elije 3) *</label>
                                    <span className={`text-[10px] font-black uppercase tracking-widest ${selectedMoods.length === 3 ? 'text-emerald-400' : 'text-accent animate-pulse'}`}>
                                        {selectedMoods.length}/3
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2.5">
                                    {MOODS.map(mood => (
                                        <button key={mood.label} type="button" onClick={() => handleMoodToggle(mood.label)}
                                            className={`px-4 py-2.5 rounded-[1.25rem] text-[10px] font-black uppercase tracking-widest transition-all ${selectedMoods.includes(mood.label)
                                                ? 'bg-accent text-white shadow-xl shadow-accent/20 scale-105'
                                                : 'bg-white/5 border border-white/10 text-muted hover:text-foreground hover:border-white/20'}`}>
                                            {mood.emoji} {mood.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="h-4" /> {/* Spacer */}

                <div className="bg-card border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-11 h-11 bg-accent/10 rounded-2xl flex items-center justify-center text-accent ring-1 ring-accent/20">
                            <Upload size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Gestión de Archivos</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">Actualiza tus archivos fuente</p>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* MP3 Tagged */}
                        <div className="bg-[#111116] border border-white/5 rounded-[2rem] p-8 group hover:border-accent/40 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                                            <Music size={20} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest block">Muestra (MP3) *</span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Audio con marca de voz</span>
                                        </div>
                                    </div>
                                    {(previewFile || existingPreview) && <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />}
                                </div>

                                <input type="file" accept=".mp3" onChange={e => setPreviewFile(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Tagged', 20))} className="hidden" id="preview-file" />
                                <label htmlFor="preview-file" className="mt-auto flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-white/10 hover:border-blue-500/50 transition-all group/btn">
                                    <span className="truncate max-w-[180px]">{previewFile ? previewFile.name : (existingPreview ? '✓ Archivo Actual' : 'Seleccionar MP3')}</span>
                                    <Upload size={14} className="group-hover/btn:scale-110 transition-transform text-blue-400" />
                                </label>
                            </div>
                        </div>

                        {/* MP3 Master */}
                        <div className="bg-[#111116] border border-white/5 rounded-[2rem] p-8 group hover:border-indigo-500/40 transition-all relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest block">Master (MP3) *</span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Alta calidad sin tags (320kbps)</span>
                                        </div>
                                    </div>
                                    {(hqMp3File || existingMp3HQ) && <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />}
                                </div>

                                <input type="file" accept=".mp3" onChange={e => setHqMp3File(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 HQ', 50))} className="hidden" id="hq-file" />
                                <label htmlFor="hq-file" className="mt-auto flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-white/10 hover:border-indigo-500/50 transition-all group/btn">
                                    <span className="truncate max-w-[180px]">{hqMp3File ? hqMp3File.name : (existingMp3HQ ? '✓ Archivo Actual' : 'Seleccionar MP3 HQ')}</span>
                                    <Upload size={14} className="group-hover/btn:scale-110 transition-transform text-indigo-400" />
                                </label>
                            </div>
                        </div>

                        {/* WAV */}
                        <div className={`bg-[#111116] border border-white/5 rounded-[2rem] p-8 group hover:border-emerald-500/40 transition-all relative overflow-hidden ${isFree ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                            <FileText size={20} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest block">Estudio (WAV) *</span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Formato sin pérdida (24-bit)</span>
                                        </div>
                                    </div>
                                    {(wavFile || existingWav) && <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />}
                                </div>

                                <input type="file" accept=".wav" onChange={e => setWavFile(validateFile(e.target.files?.[0] || null, ['wav'], 'WAV', 200))} className="hidden" id="wav-file" disabled={isFree} />
                                <label htmlFor="wav-file" className="mt-auto flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-white/10 hover:border-emerald-500/50 transition-all group/btn">
                                    <span className="truncate max-w-[180px]">{wavFile ? wavFile.name : (existingWav ? '✓ Archivo Actual' : 'Seleccionar WAV')}</span>
                                    <Upload size={14} className="group-hover/btn:scale-110 transition-transform text-emerald-400" />
                                </label>
                            </div>
                            {isFree && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10">
                                <Lock size={20} className="text-white/40 mb-3" />
                                <Link href="/pricing" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl pointer-events-auto">Activar Plan Pro</Link>
                            </div>}
                        </div>

                        {/* Stems */}
                        <div className={`bg-[#111116] border border-white/5 rounded-[2rem] p-8 group hover:border-purple-500/40 transition-all relative overflow-hidden ${!isPremium ? 'opacity-40 grayscale pointer-events-none' : ''}`}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/5 blur-[50px] rounded-full -translate-y-1/2 translate-x-1/2" />
                            <div className="flex flex-col h-full">
                                <div className="flex items-center justify-between mb-6">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500">
                                            <Layers size={20} />
                                        </div>
                                        <div>
                                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest block">Sesión (STEMS)</span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-40">Pistas separadas (.ZIP / .RAR)</span>
                                        </div>
                                    </div>
                                    {(stemsFile || existingStems) && <CheckCircle2 size={18} className="text-emerald-500 drop-shadow-[0_0_8px_rgba(16,185,129,0.3)]" />}
                                </div>

                                <input type="file" accept=".zip,.rar" onChange={e => setStemsFile(validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems', 500))} className="hidden" id="stems-file" disabled={!isPremium} />
                                <label htmlFor="stems-file" className="mt-auto flex items-center justify-between px-5 py-4 bg-white/5 border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] cursor-pointer hover:bg-white/10 hover:border-purple-500/50 transition-all group/btn">
                                    <span className="truncate max-w-[180px]">{stemsFile ? stemsFile.name : (existingStems ? '✓ Archivo Actual' : 'Seleccionar STEMS')}</span>
                                    <Upload size={14} className="group-hover/btn:scale-110 transition-transform text-purple-400" />
                                </label>
                            </div>
                            {!isPremium && <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] flex flex-col items-center justify-center p-6 text-center z-10">
                                <Lock size={20} className="text-white/40 mb-3" />
                                <Link href="/pricing" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl pointer-events-auto">Plan Premium Activo</Link>
                            </div>}
                        </div>
                    </div>
                </div>

                {/* ─── SECTION 3: Distribución y Licencias ─── */}
                <div className="bg-card border border-white/5 rounded-[2.5rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="flex items-center gap-3 mb-10">
                        <div className="w-11 h-11 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-500 ring-1 ring-amber-500/20">
                            <ShieldCheck size={24} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground">Distribución y Licencias</h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest opacity-50">Configura tus tiers de precios</p>
                        </div>
                    </div>

                    <div className="space-y-4">
                        {[
                            { id: 'free', label: 'Licencia Gratis', active: isBasicActive, set: setIsBasicActive, price: '0', setPrice: setBasicPrice, desc: 'Uso no comercial · Tag de Voz Obligatorio', color: 'slate', lock: true },
                            { id: 'mp3', label: 'Licencia Básica', active: isMp3Active, set: setIsMp3Active, price: mp3Price, setPrice: setMp3Price, desc: 'MP3 · 10K-50K Streams · 1 Video YT', color: 'emerald' },
                            { id: 'pro', label: 'Licencia Premium', active: isProActive, set: setIsProActive, price: proPrice, setPrice: setProPrice, desc: 'WAV + MP3 · 500K Streams · Radio', color: 'blue', disabled: isFree },
                            { id: 'premium', label: 'Licencia Pro', active: isPremiumActive, set: setIsPremiumActive, price: premiumPrice, setPrice: setPremiumPrice, desc: 'STEMS · Mix Individual · Uso Ilimitado', color: 'amber', disabled: !isPremium && !isPro },
                            { id: 'exclusiva', label: 'Licencia Exclusiva', active: isExclusiveActive, set: setIsExclusiveActive, price: exclusivePrice, setPrice: setExclusivePrice, desc: 'Cesión exclusiva + Permite Content ID', color: 'rose', disabled: !isPremium }
                        ].map((lic) => (
                            <div key={lic.id} className={`group p-6 rounded-[2rem] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden
                                ${lic.disabled ? 'opacity-30 grayscale cursor-not-allowed bg-white/[0.02] border-white/5' :
                                    lic.active ? 'bg-[#111116] border-accent/30' : 'bg-white/[0.02] border-white/5 opacity-70 hover:opacity-100'}`} style={lic.active && !lic.disabled ? { borderColor: lic.color === 'slate' ? '#64748b40' : lic.color === 'emerald' ? '#10b98140' : lic.color === 'blue' ? '#3b82f640' : lic.color === 'amber' ? '#f59e0b40' : '#f43f5e40' } : {}}>

                                <div className="flex items-center gap-5">
                                    <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${lic.active ? 'text-white shadow-2xl' : 'bg-white/5 text-muted'}`}
                                        style={lic.active ? { background: lic.color === 'slate' ? '#64748b' : lic.color === 'emerald' ? '#10b981' : lic.color === 'blue' ? '#3b82f6' : lic.color === 'amber' ? '#f59e0b' : '#f43f5e' } : {}}>
                                        {lic.id === 'pro' ? <ShieldCheck size={24} /> : lic.id === 'premium' ? <Layers size={24} /> : lic.id === 'exclusiva' ? <Crown size={24} /> : <FileText size={24} />}
                                    </div>
                                    <div>
                                        <h4 className="text-base font-black uppercase tracking-tight text-foreground flex items-center gap-2">
                                            {lic.label}
                                            {lic.id === 'premium' && <span className="text-[8px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded-full border border-emerald-500/30">BEST SELLER</span>}
                                        </h4>
                                        <p className="text-[10px] font-bold text-muted uppercase tracking-[0.1em]">{lic.desc}</p>
                                    </div>
                                </div>

                                <div className="flex items-center gap-6">
                                    <div className={`flex items-center gap-3 bg-black/40 px-5 py-4 rounded-2xl border transition-all ${lic.active ? 'border-accent/40 shadow-inner' : 'border-white/5'}`}>
                                        <span className="text-xs font-black text-muted/50 tracking-tighter">$</span>
                                        <input type="number" value={lic.price} onChange={e => lic.setPrice(e.target.value)} disabled={lic.disabled || !lic.active || lic.lock}
                                            className="w-16 bg-transparent outline-none font-bold text-base text-foreground placeholder:text-muted/20" />
                                        <span className="text-[9px] font-black text-muted/30">MXN</span>
                                    </div>
                                    <Toggle active={lic.active} onToggle={() => !lic.disabled && lic.set(!lic.active)} disabled={lic.disabled} />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Submit */}
                <div className="pt-6">
                    <button type="submit" disabled={saving} onClick={!hasChanges ? (e) => { e.preventDefault(); router.back(); } : undefined}
                        className={`group relative w - full overflow - hidden rounded - [2rem] p - 6 transition - all active:scale-[0.98] ${hasChanges ? 'bg-accent text-white shadow-[0_20px_40px_-15px_rgba(255,107,0,0.4)]' : 'bg-white/5 text-muted grayscale'}`}>
                        <div className="relative z-10 flex items-center justify-center gap-4">
                            {saving ? (
                                <><Loader2 className="animate-spin text-white" size={24} /><span className="text-sm font-black uppercase tracking-[0.3em]">Guardando Cambios...</span></>
                            ) : (
                                <><Save size={24} className="group-hover:rotate-12 transition-transform" /><span className="text-sm font-black uppercase tracking-[0.3em]">{hasChanges ? 'Actualizar Beat' : 'Volver sin Cambios'}</span></>
                            )}
                        </div>
                    </button>
                </div>
            </form>
        </div>
    );
}
