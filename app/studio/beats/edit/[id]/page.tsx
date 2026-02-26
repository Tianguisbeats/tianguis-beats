"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronLeft, Hash, Lock,
    Link as LinkIcon, Edit2, Zap, Eye, EyeOff, Save, X, Crown, ShieldCheck, FileText, Layers
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
    const [isUnlimitedActive, setIsUnlimitedActive] = useState(true);
    const [isExclusiveActive, setIsExclusiveActive] = useState(false);
    const [isSoundKitActive, setIsSoundKitActive] = useState(false);

    const [basicPrice, setBasicPrice] = useState('199');
    const [mp3Price, setMp3Price] = useState('349');
    const [proPrice, setProPrice] = useState('499');
    const [premiumPrice, setPremiumPrice] = useState('999');
    const [unlimitedPrice, setUnlimitedPrice] = useState('1999');
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
            setUnlimitedPrice(beat.precio_ilimitado_mxn?.toString() || '1999');
            setExclusivePrice(beat.precio_exclusivo_mxn?.toString() || '3500');

            setIsBasicActive(beat.es_basica_activa !== false);
            setIsMp3Active(beat.es_mp3_activa !== false);
            setIsProActive(beat.es_pro_activa !== false);
            setIsPremiumActive(beat.es_premium_activa !== false);
            setIsUnlimitedActive(beat.es_ilimitada_activa !== false);
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
        unlimitedPrice !== initialData.precio_ilimitado_mxn ||
        exclusivePrice !== initialData.precio_exclusivo_mxn ||
        isBasicActive !== initialData.es_basica_activa ||
        isProActive !== initialData.es_pro_activa ||
        isPremiumActive !== initialData.es_premium_activa ||
        isUnlimitedActive !== initialData.es_ilimitada_activa ||
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
                es_ilimitada_activa: isUnlimitedActive,
                es_exclusiva_activa: isExclusiveActive,
                es_soundkit_activa: isSoundKitActive,

                precio_basico_mxn: parseInt(basicPrice) || 0,
                precio_mp3_mxn: parseInt(mp3Price) || 0,
                precio_pro_mxn: parseInt(proPrice) || 0,
                precio_premium_mxn: parseInt(premiumPrice) || 0,
                precio_ilimitado_mxn: parseInt(unlimitedPrice) || 0,
                precio_exclusivo_mxn: isExclusiveActive ? parseInt(exclusivePrice) : null,
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
        <div className="flex items-center justify-center min-h-[50vh]">
            <Loader2 className="animate-spin text-accent" size={30} />
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
        <div className="w-full lg:-m-14 -m-10 lg:p-14 p-10 bg-background dark:bg-card/20 rounded-[3.5rem] min-h-screen">
            <div className="mb-10 pl-1 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Link href="/studio/beats" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-muted hover:text-accent hover:border-accent transition-all shrink-0">
                        <ChevronLeft size={16} />
                    </Link>
                    <div>
                        <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
                            <span className="bg-gradient-to-r from-[#3b82f6] to-indigo-600 bg-clip-text text-transparent">Editar</span>
                            <span>Beat</span>
                        </h1>
                    </div>
                </div>
            </div>

            <div className="bg-transparent space-y-8">
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
                        <AlertCircle size={16} /> {error}
                    </div>
                )}
                {success && (
                    <div className="bg-green-50 text-green-600 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
                        <CheckCircle2 size={16} /> ¡Cambios guardados correctamente!
                    </div>
                )}

                <form onSubmit={handleUpdate} className="space-y-10">
                    {/* 1. Datos Principales */}
                    <div className="grid md:grid-cols-2 gap-8">
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Título</label>
                                <input
                                    type="text"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-sm font-bold outline-none focus:border-accent focus:bg-card transition-all"
                                    required
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Género</label>
                                <select
                                    value={genre}
                                    onChange={(e) => {
                                        setGenre(e.target.value);
                                        setSubgenre('');
                                    }}
                                    className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-xs font-bold outline-none focus:border-accent transition-all appearance-none"
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                </select>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Subgénero</label>
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest mr-1">(Opcional)</span>
                                </div>
                                <select
                                    value={subgenre}
                                    onChange={(e) => setSubgenre(e.target.value)}
                                    className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-xs font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                    disabled={!genre || !SUBGENRES[genre]}
                                >
                                    <option value="">{genre ? 'Ninguno / Automático' : 'Selecciona un género primero'}</option>
                                    {genre && SUBGENRES[genre]?.map(sg => (
                                        <option key={sg} value={sg}>{sg}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">BPM</label>
                                    <input
                                        type="number"
                                        value={bpm}
                                        onChange={(e) => setBpm(e.target.value)}
                                        className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-sm font-bold outline-none focus:border-accent transition-all"
                                        required
                                    />
                                </div>
                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between ml-1">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Tono / Escala</label>
                                            <div className="group relative">
                                                <Info size={14} className="text-accent cursor-help opacity-70 hover:opacity-100 transition-opacity" />
                                                <div className="absolute bottom-full right-0 mb-2 w-64 p-3 bg-card border border-border rounded-2xl shadow-2xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50 pointer-events-none">
                                                    <p className="text-[9px] font-bold text-foreground leading-relaxed uppercase tracking-wider">
                                                        <span className="text-accent">¿No sabes el tono?</span> Db y C# son la misma nota. Si usas Auto-Tune, ambos ajustes funcionarán igual para este beat.
                                                    </p>
                                                    <div className="absolute top-full right-4 w-2 h-2 bg-card border-r border-b border-border rotate-45 -translate-y-1"></div>
                                                </div>
                                            </div>
                                        </div>
                                        <select
                                            value={tonoEscala}
                                            onChange={(e) => setTonoEscala(e.target.value)}
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-xs font-bold outline-none focus:border-accent transition-all font-heading appearance-none"
                                            required
                                        >
                                            <option value="">Seleccionar Tono / Escala</option>
                                            <optgroup label="NOTAS NATURALES" className="bg-card text-accent font-black">
                                                {MUSICAL_KEYS.filter(k => k.group === 'natural').map(k => (
                                                    <option key={k.value} value={k.value} className="bg-card text-foreground">{k.label}</option>
                                                ))}
                                            </optgroup>
                                            <optgroup label="SOLO PARA PROS (ALTERADAS)" className="bg-card text-accent font-black">
                                                {MUSICAL_KEYS.filter(k => k.group === 'accidental').map(k => (
                                                    <option key={k.value} value={k.value} className="bg-card text-foreground">{k.label}</option>
                                                ))}
                                            </optgroup>
                                        </select>
                                    </div>
                                </div>
                            </div>

                            {/* Beat Type moved here */}
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Beat Type / Artistas de Referencia</label>
                                <TagInput
                                    tags={beatTypes}
                                    setTags={setBeatTypes}
                                    placeholder="Ej: 808 Mafia, Tainy, Zaytoven..."
                                />
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Artwork (3000x3000px)</label>
                                <div className="relative">
                                    <input
                                        type="file"
                                        accept=".jpg,.jpeg,.png"
                                        onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                        className="hidden"
                                        id="cover"
                                    />
                                    <label htmlFor="cover" className="flex items-center gap-4 p-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-background hover:border-accent transition-all h-[116px] overflow-hidden">
                                        {(coverFile || existingPortada) ? (
                                            <div className="flex items-center gap-3 w-full">
                                                <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-sm">
                                                    <img
                                                        src={coverFile ? URL.createObjectURL(coverFile) : existingPortada!}
                                                        className="w-full h-full object-cover"
                                                        alt="Original"
                                                    />
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-xs font-bold text-foreground truncate">{coverFile ? coverFile.name : 'Portada Actual'}</p>
                                                    <p className="text-[10px] text-green-500 font-bold uppercase">{coverFile ? 'Lista para subir' : 'Sin cambios'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="flex flex-col items-center justify-center w-full text-muted">
                                                <Upload size={20} className="mb-2" />
                                                <span className="text-[9px] font-bold uppercase">Click para cambiar</span>
                                            </div>
                                        )}
                                    </label>
                                </div>
                            </div>
                            <div className="space-y-3">
                                <div className="flex items-center justify-between ml-1">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted">Mood Tags</label>
                                    <span className={`text-[9px] font-bold uppercase tracking-widest ${selectedMoods.length === 3 ? 'text-green-500' : 'text-accent'}`}>
                                        {selectedMoods.length}/3 Seleccionados (Forzoso 3)
                                    </span>
                                </div>
                                <div className="flex flex-wrap gap-2">
                                    {MOODS.map(mood => (
                                        <button
                                            key={mood.label}
                                            type="button"
                                            onClick={() => handleMoodToggle(mood.label)}
                                            className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedMoods.includes(mood.label)
                                                ? 'bg-foreground text-background shadow-lg shadow-black/10'
                                                : 'bg-accent-soft text-muted hover:text-foreground'
                                                }`}
                                        >
                                            <span className="mr-1">{mood.emoji}</span> {mood.label}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>

                    <hr className="border-slate-100" />

                    {/* 2. Archivos y Licencias */}
                    <div className="space-y-10">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <ShieldCheck size={20} />
                            </div>
                            <div>
                                <h3 className="text-xl font-black text-foreground uppercase tracking-tighter">Archivos y Licencias</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Gestiona tus archivos y precios por tier</p>
                            </div>
                        </div>

                        {/* SECTION: FILE UPLOADS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center text-accent">
                                    <Upload size={16} />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-foreground">1. Gestión de Archivos</h4>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6">
                                {/* MP3 Tagged */}
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 group transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <Music size={14} className="text-blue-500" /> MP3 Tag (Muestra)
                                            </span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Pre-escucha con marca de voz</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(previewFile || existingPreview) && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            <span className="text-[9px] font-black text-accent/50 uppercase">Obligatorio</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".mp3"
                                            onChange={(e) => setPreviewFile(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Tagged', 20))}
                                            className="hidden"
                                            id="preview-file"
                                        />
                                        <label htmlFor="preview-file" className="flex items-center justify-between px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:border-accent transition-all group/label overflow-hidden">
                                            <span className="truncate max-w-[150px]">{previewFile ? previewFile.name : (existingPreview ? 'Actualizar Archivo' : 'Seleccionar Archivo')}</span>
                                            <div className="w-6 h-6 rounded-lg bg-accent/10 flex items-center justify-center text-accent group-hover/label:bg-accent group-hover/label:text-white transition-colors">
                                                <Upload size={12} />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* MP3 Master */}
                                <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 group transition-all">
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-indigo-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <Zap size={14} className="text-indigo-500" /> MP3 Master (HQ)
                                            </span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Calidad 320kbps sin tags</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(hqMp3File || existingMp3HQ) && <CheckCircle2 size={16} className="text-emerald-500" />}
                                            <span className="text-[9px] font-black text-indigo-500/50 uppercase">Altamente Recomendado</span>
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".mp3"
                                            onChange={(e) => setHqMp3File(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 HQ', 50))}
                                            className="hidden"
                                            id="hq-file"
                                        />
                                        <label htmlFor="hq-file" className="flex items-center justify-between px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest cursor-pointer hover:border-indigo-500 transition-all group/label overflow-hidden">
                                            <span className="truncate max-w-[150px]">{hqMp3File ? hqMp3File.name : (existingMp3HQ ? 'Actualizar Archivo' : 'Seleccionar Archivo')}</span>
                                            <div className="w-6 h-6 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500 group-hover/label:bg-indigo-500 group-hover/label:text-white transition-colors">
                                                <Upload size={12} />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* WAV */}
                                <div className={`p-6 rounded-3xl border transition-all relative ${isFree ? 'opacity-50 grayscale bg-slate-200/50' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                    {isFree && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] rounded-3xl">
                                            <Lock size={20} className="text-slate-400 mb-2" />
                                            <Link href="/pricing" className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">Desbloquear Pro</Link>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <FileText size={14} className="text-emerald-500" /> WAV (Lossless)
                                            </span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Calidad de estudio profesional</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(wavFile || existingWav) && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".wav"
                                            onChange={(e) => setWavFile(validateFile(e.target.files?.[0] || null, ['wav'], 'WAV', 200))}
                                            className="hidden"
                                            id="wav-file"
                                            disabled={isFree}
                                        />
                                        <label htmlFor="wav-file" className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group/label overflow-hidden ${isFree ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-emerald-500'}`}>
                                            <span className="truncate max-w-[150px]">{wavFile ? wavFile.name : (existingWav ? 'Actualizar Archivo' : 'Seleccionar Archivo')}</span>
                                            <div className="w-6 h-6 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500 group-hover/label:bg-emerald-500 group-hover/label:text-white transition-colors">
                                                <Upload size={12} />
                                            </div>
                                        </label>
                                    </div>
                                </div>

                                {/* Stems */}
                                <div className={`p-6 rounded-3xl border transition-all relative ${!isPremium ? 'opacity-50 grayscale bg-slate-200/50' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                    {!isPremium && (
                                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-4 bg-white/40 dark:bg-black/40 backdrop-blur-[2px] rounded-3xl">
                                            <Lock size={20} className="text-slate-400 mb-2" />
                                            <Link href="/pricing" className="px-4 py-2 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform">Desbloquear Premium</Link>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between mb-4">
                                        <div className="flex flex-col">
                                            <span className="text-[10px] font-black text-purple-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                <Layers size={14} className="text-purple-500" /> STEMS (Trackout)
                                            </span>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">Pistas separadas en .ZIP o .RAR</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            {(stemsFile || existingStems) && <CheckCircle2 size={16} className="text-emerald-500" />}
                                        </div>
                                    </div>
                                    <div className="relative">
                                        <input
                                            type="file"
                                            accept=".zip,.rar"
                                            onChange={(e) => setStemsFile(validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems', 500))}
                                            className="hidden"
                                            id="stems-file"
                                            disabled={!isPremium}
                                        />
                                        <label htmlFor="stems-file" className={`flex items-center justify-between px-4 py-3 bg-white dark:bg-black/40 border border-slate-200 dark:border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all group/label overflow-hidden ${!isPremium ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:border-purple-500'}`}>
                                            <span className="truncate max-w-[150px]">{stemsFile ? stemsFile.name : (existingStems ? 'Actualizar Archivo' : 'Seleccionar Archivo')}</span>
                                            <div className="w-6 h-6 rounded-lg bg-purple-500/10 flex items-center justify-center text-purple-500 group-hover/label:bg-purple-500 group-hover/label:text-white transition-colors">
                                                <Upload size={12} />
                                            </div>
                                        </label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* SECTION: LICENSE TIERS */}
                        <div className="space-y-6">
                            <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center text-amber-600">
                                    <ShieldCheck size={16} />
                                </div>
                                <h4 className="text-sm font-black uppercase tracking-widest text-foreground">2. Configuración de Licencias</h4>
                            </div>

                            {[
                                { id: 'basic', label: 'Licencia Gratis', color: 'slate', active: isBasicActive, setAction: setIsBasicActive, price: '0', setPrice: setBasicPrice, desc: 'Uso limitado (MP3 con Tag)', disabled: false, lockPrice: true },
                                { id: 'mp3', label: 'Licencia Básica', color: 'blue', active: isMp3Active, setAction: setIsMp3Active, price: mp3Price, setPrice: setMp3Price, desc: 'Descarga MP3 High Quality', disabled: false },
                                { id: 'pro', label: 'Licencia Pro', color: 'indigo', active: isProActive, setAction: setIsProActive, price: proPrice, setPrice: setProPrice, desc: 'Mayores límites (MP3/WAV)', disabled: isFree },
                                { id: 'premium', label: 'Licencia Premium', color: 'emerald', active: isPremiumActive, setAction: setIsPremiumActive, price: premiumPrice, setPrice: setPremiumPrice, desc: 'Calidad de estudio (WAV)', disabled: !isPremium && !isPro },
                                { id: 'unlimited', label: 'Licencia Ilimitada', color: 'amber', active: isUnlimitedActive, setAction: setIsUnlimitedActive, price: unlimitedPrice, setPrice: setUnlimitedPrice, desc: 'Todos los archivos y stems', disabled: !isPremium }

                            ].map((lic: any) => (
                                <div key={lic.id} className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${lic.disabled ? 'bg-slate-100 dark:bg-white/5 opacity-60 grayscale' : (lic.active ? `bg-white dark:bg-black border-${lic.color}-500/30 shadow-xl shadow-${lic.color}-500/5` : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75')}`}>
                                    <div className="flex items-center gap-5">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${lic.active ? `bg-${lic.color}-500 text-white shadow-lg shadow-${lic.color}-500/20` : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                            {lic.id === 'premium' ? <Crown size={20} /> :
                                                lic.id === 'unlimited' ? <Layers size={20} /> :
                                                    <ShieldCheck size={20} />}
                                        </div>
                                        <div>
                                            <h5 className="font-black uppercase tracking-tight text-foreground">{lic.label}</h5>
                                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{lic.desc}</p>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className={`flex items-center gap-2 bg-slate-50 dark:bg-white/5 px-4 py-3 rounded-2xl border-2 transition-all ${lic.active ? 'border-accent shadow-sm' : 'border-slate-200 dark:border-white/10 opacity-50'}`}>
                                            <span className="text-[11px] font-black text-muted">$</span>
                                            <input
                                                type="number"
                                                value={lic.price}
                                                onChange={(e) => lic.setPrice(e.target.value)}
                                                disabled={lic.disabled || !lic.active}
                                                className="w-16 bg-transparent outline-none font-black text-xs text-foreground placeholder:text-muted"
                                                placeholder="0"
                                            />
                                            <span className="text-[9px] font-black text-muted">MXN</span>
                                        </div>
                                        <Toggle
                                            active={lic.active}
                                            onToggle={() => lic.setAction(!lic.active)}
                                            disabled={lic.disabled}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={saving}
                        onClick={!hasChanges ? (e) => { e.preventDefault(); router.back(); } : undefined}
                        className={`w-full py-5 rounded-2xl font-black uppercase tracking-[0.3em] text-xs transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3 border-t border-white/10 ${hasChanges
                            ? 'bg-accent text-white hover:bg-accent/90 shadow-accent/20'
                            : 'bg-muted/10 text-muted hover:bg-muted/20 shadow-none'
                            }`}
                    >
                        {saving ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Guardando...
                            </>
                        ) : hasChanges ? (
                            <>
                                <Save size={18} />
                                Guardar Cambios
                            </>
                        ) : (
                            <>
                                <X size={18} />
                                Cancelar
                            </>
                        )}
                    </button>
                </form>
            </div>
        </div>
    );
}
