"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronRight, Hash, Lock,
    Link as LinkIcon, Edit2, Zap, Eye, EyeOff, Crown, ShieldCheck, FileText, Layers
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TagInput from '@/components/ui/TagInput';
import Switch from '@/components/ui/Switch';

import { GENRES, MOODS, SUBGENRES } from '@/lib/constants';
import { EXCHANGE_RATES } from '@/context/CurrencyContext';

const SCALES = ["Menor", "Mayor"];
const KEYS_BASE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

/**
 * UploadPage: Formulario principal para la subida de beats.
 * Gestiona la carga de archivos a Supabase Storage y el registro en la base de datos.
 * Incluye validaciones de peso y formatos.
 */
export default function UploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [beatCount, setBeatCount] = useState(0);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Estado del formulario
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [subgenre, setSubgenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [musicalScale, setMusicalScale] = useState('Menor');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [beatTypes, setBeatTypes] = useState<string[]>([]);

    // Estados de licencias (5 Tiers)
    const [isBasicActive, setIsBasicActive] = useState(true);
    const [isProActive, setIsProActive] = useState(true);
    const [isPremiumActive, setIsPremiumActive] = useState(true);
    const [isUnlimitedActive, setIsUnlimitedActive] = useState(true);
    const [isExclusiveActive, setIsExclusiveActive] = useState(false);

    const [basicPrice, setBasicPrice] = useState('199');
    const [proPrice, setProPrice] = useState('499');
    const [premiumPrice, setPremiumPrice] = useState('999');
    const [unlimitedPrice, setUnlimitedPrice] = useState('1999');
    const [exclusivePrice, setExclusivePrice] = useState('3500');

    // Estado de archivos
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [hqMp3File, setHqMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

    // Función auxiliar de validación
    const validateFile = (file: File | null, allowedExtensions: string[], label: string, maxMB: number) => {
        if (!file) return null;

        const extension = file.name.split('.').pop()?.toLowerCase();
        if (!extension || !allowedExtensions.includes(extension)) {
            setError(`Archivo inválido para ${label}. Solo se permiten extensiones: ${allowedExtensions.join(', ')}`);
            return null;
        }

        // Limit weight to 2GB (Browser/Supabase limit)
        if (file.size > 2048 * 1024 * 1024) {
            setError(`${label}: El peso máximo es de 2GB.`);
            return null;
        }

        return file;
    };

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            const { data: profile } = await supabase
                .from('perfiles')
                .select('id, nombre_usuario, nombre_artistico, nivel_suscripcion, portada_perfil')
                .eq('id', session.user.id)
                .single();
            setUserData(profile);

            const { count } = await supabase
                .from('beats')
                .select('id', { count: 'exact', head: true })
                .eq('productor_id', session.user.id);
            setBeatCount(count || 0);
        };
        checkAuth();
    }, [router]);

    const handleMoodToggle = (mood: string) => {
        if (selectedMoods.includes(mood)) {
            setSelectedMoods(selectedMoods.filter(m => m !== mood));
        } else if (selectedMoods.length < 3) {
            setSelectedMoods([...selectedMoods, mood]);
        }
    };

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;

        if (userData.nivel_suscripcion === 'free' && beatCount >= 5) {
            setError("Has alcanzado el límite de 5 beats. Actualiza tu plan.");
            return;
        }

        if (!title || !genre || !bpm || !musicalKey || !previewFile || !coverFile) {
            setError("Por favor completa los campos y el MP3 de Muestra (Obligatorio).");
            return;
        }
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error("No hay sesión activa");
        const userId = user.id;

        // Sanitización de nombres de archivos
        const sanitize = (name: string) => name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

        if (selectedMoods.length !== 3) {
            setError("Vibe: Debes elegir exactamente 3 opciones.");
            setLoading(false);
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const username = userData.nombre_usuario;
            const timestamp = Date.now();

            // 1. Subida de portada
            let portadabeat_url = null;
            if (coverFile) {
                const coverPath = `${userId}/${sanitize(coverFile.name)}`;
                await supabase.storage.from('portadas_beats').upload(coverPath, coverFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(coverPath);
                portadabeat_url = publicUrl;
            }

            // 2. Audio de prueba y Alta Calidad (Beats-muestras)
            const previewPath = `${userId}/${sanitize(previewFile.name)}`;
            await supabase.storage.from('muestras_beats').upload(previewPath, previewFile, { upsert: true });

            // Beats-maestros divididos por formato
            // HQ MP3 (Max 50MB)
            let hqPath = null;
            if (hqMp3File) {
                hqPath = `${userId}/${sanitize(hqMp3File.name)}`;
                await supabase.storage.from('beats_mp3').upload(hqPath, hqMp3File, { upsert: true });
            }

            let wavPath = null;
            if (wavFile && userData.nivel_suscripcion !== 'free') {
                wavPath = `${userId}/${sanitize(wavFile.name)}`;
                await supabase.storage.from('beats_wav').upload(wavPath, wavFile, { upsert: true });
            }

            let stemsPath = null;
            if (stemsFile && userData.nivel_suscripcion === 'premium') {
                stemsPath = `${userId}/${sanitize(stemsFile.name)}`;
                await supabase.storage.from('beats_stems').upload(stemsPath, stemsFile, { upsert: true });
            }

            // Guardar en base de datos
            const { error: dbError } = await supabase.from('beats').insert({
                productor_id: userId,
                titulo: title,
                genero: genre,
                subgenero: subgenre,
                bpm: parseInt(bpm),
                nota_musical: musicalKey,
                escala_musical: musicalScale,
                vibras: selectedMoods.join(', '),
                tipos_beat: beatTypes,
                artista_referencia: beatTypes.join(', '), // Sync for fuzzy search
                portada_url: portadabeat_url,
                archivo_mp3_url: hqPath, // Archivo de Alta Calidad (Limpio)
                archivo_muestra_url: previewPath, // Archivo con tags para previsualización
                archivo_wav_url: wavPath,
                archivo_stems_url: stemsPath,

                // Licencias activas (Sincronizado con Mis Contratos)
                es_basica_activa: isBasicActive,
                es_pro_activa: isProActive,
                es_premium_activa: isPremiumActive, // Premium = WAV
                es_ilimitada_activa: isUnlimitedActive, // Unlimited = Stems
                es_exclusiva_activa: isExclusiveActive,

                precio_basico_mxn: parseInt(basicPrice) || 0,
                precio_pro_mxn: parseInt(proPrice) || 0,
                precio_premium_mxn: parseInt(premiumPrice) || 0,
                precio_ilimitado_mxn: parseInt(unlimitedPrice) || 0,
                precio_exclusivo_mxn: isExclusiveActive ? parseInt(exclusivePrice) : null,
                visibilidad_tier: userData.nivel_suscripcion === 'free' ? 0 : (userData.nivel_suscripcion === 'pro' ? 1 : 0)
            });

            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => router.push(`/${userData.nombre_usuario}`), 1500);

        } catch (err: any) {
            setError(err.message || "Error al subir el beat");
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return null;
    const isFree = userData.nivel_suscripcion === 'free';
    const isPro = userData.nivel_suscripcion === 'pro';
    const isPremium = userData.nivel_suscripcion === 'premium';

    // Función auxiliar para renderizar los interruptores
    const Toggle = ({ active, onToggle, disabled = false }: { active: boolean, onToggle: () => void, disabled?: boolean }) => (
        <Switch
            active={active}
            onChange={onToggle}
            disabled={disabled}
            activeColor="bg-accent"
        />
    );

    // Helper para previsualizar la conversión de precios
    const PricePreview = ({ price }: { price: string }) => {
        const amount = parseInt(price) || 0;
        if (amount <= 0) return null;
        const usd = (amount * EXCHANGE_RATES.USD).toFixed(2);
        const eur = (amount * EXCHANGE_RATES.EUR).toFixed(2);
        return (
            <div className="flex gap-2 mt-1.5 px-2">
                <span className="text-[9px] font-black text-blue-500/70 uppercase">≈ ${usd} USD</span>
                <span className="text-[9px] font-black text-purple-500/70 uppercase">≈ €{eur} EUR</span>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
            <Navbar />

            {/* Detalles de fondo */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-500/5 blur-[100px] rounded-full" />
            </div>
            <main className="flex-1 pb-20 relative">
                <div className="max-w-4xl mx-auto px-4 mt-8">

                    {/* Encabezado minimalista */}
                    <div className="mb-10 pl-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-1 flex items-center gap-3">
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Publicar</span>
                                <span className="text-foreground">Beat</span>
                                <Zap className="text-amber-400 fill-amber-400 w-6 h-6 md:w-8 md:h-8" />
                            </h1>
                            <p className="text-muted font-bold uppercase tracking-widest text-[10px] flex items-center gap-2">
                                <Edit2 size={12} className="text-blue-500" /> agrega los datos de tu Beat
                            </p>
                        </div>
                        {isFree && (
                            <div className="bg-card/40 backdrop-blur-sm border border-border rounded-[2rem] px-8 py-5 flex flex-col items-center md:items-end shadow-sm">
                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 flex items-center gap-2">
                                    <Zap size={14} className="fill-blue-500" /> Tu Límite (Gratis)
                                </span>
                                <div className="flex items-center gap-4">
                                    <div className="h-2 w-32 bg-background/50 rounded-full overflow-hidden border border-border shadow-inner">
                                        <div
                                            className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${(beatCount / 5) * 100}%` }}
                                        />
                                    </div>
                                    <div className="flex flex-col items-center">
                                        <span className="text-sm font-black text-foreground leading-none">{beatCount}/5</span>
                                        <span className="text-[8px] font-bold text-muted uppercase">Beats</span>
                                    </div>
                                </div>
                                {beatCount >= 5 && (
                                    <p className="text-[9px] font-black text-red-500 uppercase mt-2 animate-pulse">Límite alcanzado ⚠️</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-card rounded-[2rem] p-5 md:p-8 border border-border shadow-sm transition-colors">
                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
                                <AlertCircle size={16} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-600 p-4 rounded-xl text-xs font-bold mb-6 flex items-center gap-2">
                                <CheckCircle2 size={16} /> ¡Publicado correctamente!
                            </div>
                        )}

                        <form onSubmit={handleFileUpload} className="space-y-10">

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
                                            placeholder="Nombre del Beat"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Género</label>
                                        <select
                                            value={genre}
                                            onChange={(e) => {
                                                setGenre(e.target.value);
                                                setSubgenre(''); // Reset subgenre on genre change
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
                                                placeholder="140"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Escala</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-xs font-bold outline-none focus:border-accent transition-all font-heading">
                                                <option value="">Escala</option>
                                                {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Nota</label>
                                            <select
                                                value={musicalKey}
                                                onChange={(e) => setMusicalKey(e.target.value)}
                                                className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-base md:text-xs font-bold outline-none focus:border-accent transition-all font-heading"
                                                disabled={!musicalScale}
                                                required
                                            >
                                                <option value="">-</option>
                                                {KEYS_BASE.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                    </div>
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
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Artwork (Sugerido 3000x3000px - 3MB max)</label>
                                        <div className="relative">
                                            <input
                                                type="file"
                                                accept=".jpg,.jpeg,.png"
                                                onChange={(e) => {
                                                    const file = e.target.files?.[0] || null;
                                                    if (file) {
                                                        const validTypes = ['image/jpeg', 'image/png', 'image/jpg'];
                                                        if (!validTypes.includes(file.type)) {
                                                            setError("Artwork: Solo se permiten archivos JPG o PNG.");
                                                            e.target.value = '';
                                                            setCoverFile(null);
                                                            return;
                                                        }
                                                        if (file.size > 2048 * 1024 * 1024) {
                                                            setError("Artwork: El peso máximo es de 2GB.");
                                                            e.target.value = '';
                                                            setCoverFile(null);
                                                            return;
                                                        }
                                                        setCoverFile(file);
                                                    }
                                                }}
                                                className="hidden"
                                                id="cover"
                                            />
                                            <label htmlFor="cover" className="flex items-center gap-4 p-3 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-background hover:border-accent transition-all h-[116px] overflow-hidden">
                                                {coverFile ? (
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="w-16 h-16 bg-background rounded-lg flex items-center justify-center shrink-0 overflow-hidden border border-border shadow-sm">
                                                            <img
                                                                src={URL.createObjectURL(coverFile)}
                                                                className="w-full h-full object-cover"
                                                                alt="Preview"
                                                                onLoad={(e) => {
                                                                    // Optional: Revoke URL to avoid memory leaks if needed
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-foreground truncate">{coverFile.name}</p>
                                                            <p className="text-[10px] text-green-500 font-bold uppercase">Listo para subir</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center w-full text-muted">
                                                        <Upload size={20} className="mb-2" />
                                                        <span className="text-[9px] font-bold uppercase">Click para subir</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Vibe (Elige 3 opciones)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {MOODS.map(mood => (
                                                <button
                                                    key={mood.label}
                                                    type="button"
                                                    onClick={() => handleMoodToggle(mood.label)}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedMoods.includes(mood.label)
                                                        ? 'bg-foreground text-background'
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
                            <div className="space-y-12">
                                <div className="flex flex-col">
                                    <h3 className="text-3xl font-black text-foreground uppercase tracking-tighter">Archivos y Licencias</h3>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em] mt-1">Configura tus archivos maestros y permisos de venta</p>
                                </div>

                                {/* SECTION: FILE UPLOADS */}
                                <div className="space-y-6">
                                    <div className="flex items-center gap-2 mb-2">
                                        <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center text-blue-600">
                                            <Upload size={16} />
                                        </div>
                                        <h4 className="text-sm font-black uppercase tracking-widest text-foreground">1. Gestión de Archivos</h4>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-6">
                                        {/* MP3 Tagged */}
                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 group transition-all">
                                            <div className="flex flex-col mb-4">
                                                <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <Music size={14} /> MP3 con Tag (Muestra)
                                                </span>
                                                <span className="text-[8px] font-bold text-muted uppercase">Pre-escucha en el catálogo • Obligatorio</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept=".mp3"
                                                    onChange={(e) => {
                                                        const file = validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Tagged', 20);
                                                        setPreviewFile(file);
                                                        if (!file) e.target.value = '';
                                                    }}
                                                    className="hidden"
                                                    id="preview-file"
                                                />
                                                <label htmlFor="preview-file" className="flex-1 px-4 py-3 bg-white dark:bg-black border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-blue-500 transition-all text-center truncate">
                                                    {previewFile ? previewFile.name : 'Seleccionar MP3 (Muestra)'}
                                                </label>
                                                {previewFile && <CheckCircle2 size={18} className="text-green-500" />}
                                            </div>
                                        </div>

                                        {/* MP3 Master */}
                                        <div className="p-6 bg-slate-50 dark:bg-white/5 rounded-3xl border border-slate-200 dark:border-white/10 group transition-all">
                                            <div className="flex flex-col mb-4">
                                                <span className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <Music size={14} /> MP3 Master (HQ)
                                                </span>
                                                <span className="text-[8px] font-bold text-muted uppercase">Sin tags • Alta calidad • Ideal Licencias Básicas</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept=".mp3"
                                                    onChange={(e) => {
                                                        const file = validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Master', 50);
                                                        setHqMp3File(file);
                                                        if (!file) e.target.value = '';
                                                    }}
                                                    className="hidden"
                                                    id="hq-file"
                                                />
                                                <label htmlFor="hq-file" className="flex-1 px-4 py-3 bg-white dark:bg-black border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-indigo-500 transition-all text-center truncate">
                                                    {hqMp3File ? hqMp3File.name : 'Seleccionar MP3 (Limpio)'}
                                                </label>
                                                {hqMp3File && <CheckCircle2 size={18} className="text-green-500" />}
                                            </div>
                                        </div>

                                        {/* WAV */}
                                        <div className={`p-6 rounded-3xl border transition-all relative ${isFree ? 'opacity-50 grayscale bg-slate-200/50' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                            {isFree && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                                                    <span className="text-[8px] font-black uppercase bg-amber-500 text-white px-3 py-1.5 rounded-full shadow-lg">Solo Pro+</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col mb-4">
                                                <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <Music size={14} /> Archivo WAV
                                                </span>
                                                <span className="text-[8px] font-bold text-muted uppercase">Alta fidelidad • 24 bits • Premium</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept=".wav"
                                                    disabled={isFree}
                                                    onChange={(e) => {
                                                        const file = validateFile(e.target.files?.[0] || null, ['wav'], 'WAV', 200);
                                                        setWavFile(file);
                                                        if (!file) e.target.value = '';
                                                    }}
                                                    className="hidden"
                                                    id="wav-file"
                                                />
                                                <label htmlFor="wav-file" className="flex-1 px-4 py-3 bg-white dark:bg-black border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-emerald-500 transition-all text-center truncate">
                                                    {wavFile ? wavFile.name : 'Seleccionar WAV'}
                                                </label>
                                                {wavFile && <CheckCircle2 size={18} className="text-green-500" />}
                                            </div>
                                        </div>

                                        {/* Stems */}
                                        <div className={`p-6 rounded-3xl border transition-all relative ${!isPremium ? 'opacity-50 grayscale bg-slate-200/50' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                            {!isPremium && (
                                                <div className="absolute inset-0 z-10 flex items-center justify-center p-4">
                                                    <span className="text-[8px] font-black uppercase bg-blue-600 text-white px-3 py-1.5 rounded-full shadow-lg">Solo Premium</span>
                                                </div>
                                            )}
                                            <div className="flex flex-col mb-4">
                                                <span className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1 flex items-center gap-2">
                                                    <Hash size={14} /> STEMS (Trackout)
                                                </span>
                                                <span className="text-[8px] font-bold text-muted uppercase">Archivo .ZIP • Todas las pistas separadas</span>
                                            </div>
                                            <div className="flex items-center gap-3">
                                                <input
                                                    type="file"
                                                    accept=".zip,.rar"
                                                    disabled={!isPremium}
                                                    onChange={(e) => {
                                                        const file = validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems', 2000);
                                                        setStemsFile(file);
                                                        if (!file) e.target.value = '';
                                                    }}
                                                    className="hidden"
                                                    id="stems-file"
                                                />
                                                <label htmlFor="stems-file" className="flex-1 px-4 py-3 bg-white dark:bg-black border-2 border-dashed border-slate-300 dark:border-white/10 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-purple-500 transition-all text-center truncate">
                                                    {stemsFile ? stemsFile.name : 'Seleccionar ZIP Stems'}
                                                </label>
                                                {stemsFile && <CheckCircle2 size={18} className="text-green-500" />}
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

                                    <div className="grid gap-4">
                                        {[
                                            { id: 'basic', label: 'Básica', color: 'blue', active: isBasicActive, setAction: setIsBasicActive, price: basicPrice, setPrice: setBasicPrice, desc: 'Uso comercial limitado (MP3)', disabled: false },
                                            { id: 'pro', label: 'Pro', color: 'indigo', active: isProActive, setAction: setIsProActive, price: proPrice, setPrice: setProPrice, desc: 'Mayores límites de distribución (MP3)', disabled: false },
                                            { id: 'premium', label: 'Premium', color: 'emerald', active: isPremiumActive, setAction: setIsPremiumActive, price: premiumPrice, setPrice: setPremiumPrice, desc: 'Calidad de estudio (WAV)', disabled: isFree },
                                            { id: 'unlimited', label: 'Ilimitada', color: 'purple', active: isUnlimitedActive, setAction: setIsUnlimitedActive, price: unlimitedPrice, setPrice: setUnlimitedPrice, desc: 'Uso sin límites (Stems)', disabled: !isPremium },
                                            { id: 'exclusive', label: 'Exclusiva', color: 'rose', active: isExclusiveActive, setAction: setIsExclusiveActive, price: exclusivePrice, setPrice: setExclusivePrice, desc: 'Cesión total de derechos (Exclusividad)', disabled: !isPremium }
                                        ].map((lic) => (
                                            <div key={lic.id} className={`p-6 rounded-[1.5rem] border-2 transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 relative overflow-hidden ${lic.disabled ? 'bg-slate-100 dark:bg-white/5 opacity-60 grayscale' : (lic.active ? `bg-white dark:bg-black border-${lic.color}-500/30 shadow-xl shadow-${lic.color}-500/5` : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 opacity-75')}`}>
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${lic.active ? `bg-${lic.color}-500 text-white shadow-lg shadow-${lic.color}-500/20` : 'bg-slate-200 dark:bg-white/10 text-muted'}`}>
                                                        {lic.id === 'exclusive' ? <Crown size={24} /> :
                                                            lic.id === 'unlimited' ? <Layers size={24} /> :
                                                                lic.id === 'premium' ? <FileText size={24} /> :
                                                                    lic.id === 'pro' ? <Zap size={24} /> :
                                                                        <Music size={24} />}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-lg font-black uppercase tracking-tighter text-foreground">{lic.label}</h5>
                                                        <p className="text-[10px] font-bold text-muted uppercase tracking-widest">{lic.desc}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-6">
                                                    <div className="flex flex-col items-end">
                                                        <div className={`flex items-center gap-2 rounded-xl px-3 py-2 border-2 transition-all ${lic.active ? 'bg-background border-slate-900 dark:border-white shadow-sm' : 'bg-background border-slate-200 dark:border-white/10 opacity-50'}`}>
                                                            <span className={`text-[11px] font-black ${lic.active ? 'text-foreground' : 'text-muted'}`}>$</span>
                                                            <input
                                                                type="number"
                                                                value={lic.price}
                                                                onChange={(e) => lic.setPrice(e.target.value)}
                                                                disabled={lic.disabled || !lic.active}
                                                                className="w-16 bg-transparent outline-none font-black text-xs text-foreground"
                                                            />
                                                            <span className="text-[8px] font-black text-muted uppercase">MXN</span>
                                                        </div>
                                                        <PricePreview price={lic.price} />
                                                    </div>
                                                    <Toggle active={lic.active} onToggle={() => !lic.disabled && lic.setAction(!lic.active)} disabled={lic.disabled} />
                                                </div>

                                                {lic.disabled && (
                                                    <div className="absolute inset-0 bg-background/40 backdrop-blur-[1px] flex items-center justify-center p-4">
                                                        <Link href="/pricing" className="bg-slate-900 dark:bg-white text-white dark:text-black text-[8px] font-black uppercase px-4 py-2 rounded-lg shadow-xl hover:scale-105 transition-transform">Desbloquear Nivel</Link>
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className={`w-full py-6 rounded-[2rem] font-black uppercase tracking-[0.4em] text-[12px] transition-all duration-300 shadow-2xl active:scale-95 flex items-center justify-center gap-4 ${loading
                                    ? 'bg-slate-100 text-muted cursor-not-allowed'
                                    : 'bg-accent text-white hover:bg-black dark:hover:bg-white dark:hover:text-black shadow-accent/25'
                                    }`}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Publicando Beat...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={20} />
                                        Publicar Beat en el Tianguis
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
