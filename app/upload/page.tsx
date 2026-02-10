"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronRight, Hash, Lock,
    Link as LinkIcon, Edit2, Zap, Eye, EyeOff, Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { GENRES, MOODS, SUBGENRES } from '@/lib/constants';

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

    // Form State
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [subgenre, setSubgenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [musicalScale, setMusicalScale] = useState('Menor');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [beatType, setBeatType] = useState('');

    // License States
    const [isExclusive, setIsExclusive] = useState(false);
    const [isMp3Active, setIsMp3Active] = useState(true);
    const [isWavActive, setIsWavActive] = useState(true);
    const [isStemsActive, setIsStemsActive] = useState(true);

    const [exclusivePrice, setExclusivePrice] = useState('3500');
    const [standardPrice, setStandardPrice] = useState('199');
    const [wavPrice, setWavPrice] = useState('499');
    const [stemsPrice, setStemsPrice] = useState('999');

    // Files State
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [hqMp3File, setHqMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

    // Validation Helper
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
                .from('profiles')
                .select('id, username, artistic_name, subscription_tier, portada_perfil')
                .eq('id', session.user.id)
                .single();
            setUserData(profile);

            const { count } = await supabase
                .from('beats')
                .select('id', { count: 'exact', head: true })
                .eq('producer_id', session.user.id);
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

        if (userData.subscription_tier === 'free' && beatCount >= 5) {
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
            const username = userData.username;
            const timestamp = Date.now();

            // 1. Artwork Upload
            let portadabeat_url = null;
            if (coverFile) {
                const coverExt = coverFile.name.split('.').pop();
                const coverPath = `${username}/${timestamp}-cover.${coverExt}`;
                await supabase.storage.from('portadas-beats').upload(coverPath, coverFile);
                const { data: { publicUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(coverPath);
                portadabeat_url = publicUrl;
            }

            // 2. Audio Previews & HQ (Beats-muestras)
            const previewPath = `${username}/${timestamp}-preview-${sanitize(previewFile.name)}`;
            await supabase.storage.from('beats-muestras').upload(previewPath, previewFile);

            // Beats-maestros divididos por formato
            // HQ MP3 (Max 50MB)
            let hqPath = null;
            if (hqMp3File) {
                hqPath = `${username}/${timestamp}-hq-${sanitize(hqMp3File.name)}`;
                await supabase.storage.from('beats-mp3-alta-calidad').upload(hqPath, hqMp3File);
            }

            let wavPath = null;
            if (wavFile && userData.subscription_tier !== 'free') {
                wavPath = `${username}/${timestamp}-wav-${sanitize(wavFile.name)}`;
                await supabase.storage.from('beats-wav').upload(wavPath, wavFile);
            }

            let stemsPath = null;
            if (stemsFile && userData.subscription_tier === 'premium') {
                stemsPath = `${username}/${timestamp}-stems-${sanitize(stemsFile.name)}`;
                await supabase.storage.from('beats-stems').upload(stemsPath, stemsFile);
            }

            // Save to DB
            const { error: dbError } = await supabase.from('beats').insert({
                producer_id: userId,
                title,
                genre,
                subgenre,
                bpm: parseInt(bpm),
                musical_key: musicalKey,
                musical_scale: musicalScale,
                mood: selectedMoods.join(', '),
                reference_artist: beatType,
                portadabeat_url: portadabeat_url,
                mp3_url: hqPath, // Archivo de Alta Calidad (Limpio)
                mp3_tag_url: previewPath, // Archivo con tags para previsualización
                wav_url: wavPath,
                stems_url: stemsPath,
                is_exclusive: isExclusive,

                // Active Licenses
                is_mp3_active: isMp3Active,
                is_wav_active: isWavActive,
                is_stems_active: isStemsActive,
                is_exclusive_active: isExclusive,

                price_mxn: parseInt(standardPrice) || 0,
                price_wav_mxn: parseInt(wavPrice) || 0,
                price_stems_mxn: parseInt(stemsPrice) || 0,
                exclusive_price_mxn: isExclusive ? parseInt(exclusivePrice) : null,
                tier_visibility: userData.subscription_tier === 'free' ? 0 : (userData.subscription_tier === 'pro' ? 1 : 0)
            });

            if (dbError) throw dbError;

            setSuccess(true);
            setTimeout(() => router.push(`/${userData.username}`), 1500);

        } catch (err: any) {
            setError(err.message || "Error al subir el beat");
        } finally {
            setLoading(false);
        }
    };

    if (!userData) return null;
    const isFree = userData.subscription_tier === 'free';
    const isPro = userData.subscription_tier === 'pro';
    const isPremium = userData.subscription_tier === 'premium';

    // Helper to render toggles
    const Toggle = ({ active, onToggle, disabled = false }: { active: boolean, onToggle: () => void, disabled?: boolean }) => (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`w-12 h-6 rounded-full transition-all relative ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-200' : active ? 'bg-accent' : 'bg-slate-200 dark:bg-white/10'}`}
        >
            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow-sm transition-all ${active ? 'left-7' : 'left-1'}`} />
        </button>
    );

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
            <Navbar />

            {/* Background Accents */}
            <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
                <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-500/5 blur-[120px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-500/5 blur-[120px] rounded-full" />
                <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-amber-500/5 blur-[100px] rounded-full" />
            </div>
            <main className="flex-1 pb-20 relative">
                <div className="max-w-4xl mx-auto px-4 mt-8">

                    {/* Header Minimalista */}
                    <div className="mb-10 pl-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground mb-1 flex items-center gap-3">
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Publicar</span>
                                <span className="text-foreground">Beat</span>
                                <Zap className="text-amber-400 fill-amber-400" size={32} />
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

                    <div className="bg-card rounded-[2rem] p-8 border border-border shadow-sm transition-colors">
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
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent focus:bg-card transition-all"
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
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all appearance-none"
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
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                            disabled={!genre || !SUBGENRES[genre]}
                                        >
                                            <option value="">{genre ? 'Ninguno / Automático' : 'Selecciona un género primero'}</option>
                                            {genre && SUBGENRES[genre]?.map(sg => (
                                                <option key={sg} value={sg}>{sg}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">BPM</label>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all"
                                                placeholder="140"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Escala</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all font-heading">
                                                <option value="">Escala</option>
                                                {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Nota</label>
                                            <select
                                                value={musicalKey}
                                                onChange={(e) => setMusicalKey(e.target.value)}
                                                className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all font-heading"
                                                disabled={!musicalScale}
                                                required
                                            >
                                                <option value="">-</option>
                                                {KEYS_BASE.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Beat Type (Referencia)</label>
                                        <input
                                            type="text"
                                            value={beatType}
                                            onChange={(e) => setBeatType(e.target.value)}
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all"
                                            placeholder="Junior H, 808 Mafia, Metro Boomin..."
                                        />
                                        <p className="text-[9px] text-muted font-bold uppercase tracking-widest ml-1">Separa los artistas con comas para mejorar la recomendación</p>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Artwork (Sugerido 3000x3000px - Original)</label>
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
                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-foreground uppercase tracking-tighter mb-1">PRECIOS Y ARCHIVOS</h3>
                                    <span className="text-[10px] font-black text-muted uppercase tracking-widest">Control de licencias 🔓</span>
                                </div>
                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* MP3 Tagged + Licencia Base */}
                                    <div className="flex flex-col gap-4 p-6 bg-green-500/5 rounded-3xl border border-green-500/20 hover:bg-green-500/10 transition-colors group">
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-green-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                    <Music size={14} className="text-green-500" /> MP3 Tag (Muestra)
                                                </span>
                                                <span className="text-[9px] font-bold text-green-500/50 uppercase tracking-widest">Obligatorio • Max 20MB</span>
                                            </div>
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
                                            <label htmlFor="preview-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-green-500 hover:bg-green-500/10 transition-all text-center truncate">
                                                {previewFile ? previewFile.name : 'Seleccionar MP3 (Muestra)'}
                                            </label>
                                            {previewFile && <CheckCircle2 size={20} className="text-green-500 animate-in zoom-in" />}
                                        </div>
                                    </div>

                                    {/* MP3 320 KBPS (High Quality) */}
                                    <div className={`flex flex-col gap-4 p-6 rounded-3xl border transition-all ${isMp3Active ? 'bg-amber-500/5 border-amber-500/20 hover:bg-amber-500/10' : 'bg-background border-border opacity-75 grayscale'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                    <Music size={14} className="text-amber-500" /> MP3 MASTER HQ
                                                </span>
                                                <span className="text-[9px] font-bold text-amber-500/50 uppercase tracking-widest">Calidad 320 KBPS • Sin Tags</span>
                                            </div>
                                            <div className="flex items-center gap-4">
                                                <Toggle active={isMp3Active} onToggle={() => setIsMp3Active(!isMp3Active)} />
                                                <div className={`flex items-center gap-2 bg-background rounded-xl px-2 py-1.5 border-2 transition-all ${isMp3Active ? 'border-accent shadow-sm' : 'border-border opacity-50'}`}>
                                                    <span className={`text-[10px] font-black ${isMp3Active ? 'text-accent' : 'text-slate-300'}`}>$</span>
                                                    <input
                                                        type="number"
                                                        value={standardPrice}
                                                        disabled={!isMp3Active}
                                                        onChange={(e) => setStandardPrice(e.target.value)}
                                                        className={`w-10 text-[10px] font-black outline-none bg-transparent ${isMp3Active ? 'text-foreground' : 'text-slate-300'}`}
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept=".mp3"
                                                onChange={(e) => {
                                                    const file = validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 High Quality', 50);
                                                    setHqMp3File(file);
                                                    if (!file) e.target.value = '';
                                                }}
                                                className="hidden"
                                                id="hq-file"
                                            />
                                            <label htmlFor="hq-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-amber-500 hover:bg-amber-500/10 transition-all text-center truncate">
                                                {hqMp3File ? hqMp3File.name : 'Seleccionar MP3 (HQ)'}
                                            </label>
                                            {hqMp3File && <CheckCircle2 size={20} className="text-green-500 animate-in zoom-in" />}
                                        </div>
                                    </div>

                                    {/* WAV + Precio */}
                                    {/* WAV + Precio */}
                                    <div className={`relative flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all ${isFree ? 'bg-background border-amber-500/30' :
                                        isWavActive ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10' : 'bg-background border-border opacity-75'
                                        }`}>
                                        {isFree && (
                                            <Link href="/pricing" className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-amber-500 text-slate-900 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-amber-400 shadow-xl shadow-amber-500/20 flex items-center gap-2 hover:scale-110 transition-transform whitespace-nowrap">
                                                <Crown size={12} fill="currentColor" /> Mejorar a Pro
                                            </Link>
                                        )}
                                        <div className={`flex items-center justify-between ${isFree ? 'opacity-40 pointer-events-none grayscale' : ''}`}>
                                            {!isFree && <Toggle active={isWavActive} onToggle={() => setIsWavActive(!isWavActive)} />}

                                            {/* Precio Input Wrapper */}
                                            <div className={`flex items-center rounded-xl px-2.5 py-2 border-2 transition-all ${isFree ? 'opacity-30 grayscale pointer-events-none bg-background border-border' : (isWavActive ? 'bg-background border-accent shadow-sm' : 'bg-background border-border opacity-50')}`}>
                                                <span className={`text-[10px] font-black mr-1 ${isFree ? 'text-muted' : (isWavActive ? 'text-accent' : 'text-muted/30')}`}>$</span>
                                                <input
                                                    type="number"
                                                    disabled={isFree || !isWavActive}
                                                    value={wavPrice}
                                                    onChange={(e) => setWavPrice(e.target.value)}
                                                    className={`w-10 text-[10px] font-black outline-none bg-transparent ${(isFree || !isWavActive) ? 'text-muted' : 'text-foreground'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    {/* File Input Logic */}
                                    {!isFree ? (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept=".wav"
                                                onChange={(e) => {
                                                    const file = validateFile(e.target.files?.[0] || null, ['wav'], 'Archivo WAV', 200);
                                                    setWavFile(file);
                                                    if (!file) e.target.value = '';
                                                }}
                                                className="hidden"
                                                id="wav-file"
                                            />
                                            <label htmlFor="wav-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center truncate">
                                                {wavFile ? wavFile.name : 'Seleccionar WAV'}
                                            </label>
                                            {wavFile && <CheckCircle2 size={20} className="text-green-500 animate-in zoom-in" />}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-50 grayscale pointer-events-none select-none">
                                            <div className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-center text-muted">
                                                Disponible en el Plan Pro
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* Stems + Precio */}
                                <div className={`relative flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all ${!isPremium ? 'bg-background border-blue-600/30' :
                                    isStemsActive ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10' : 'bg-background border-border opacity-75'
                                    }`}>
                                    {!isPremium && (
                                        <Link href="/pricing" className="absolute -top-3 left-1/2 -translate-x-1/2 z-20 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-500 shadow-xl shadow-blue-600/20 flex items-center gap-2 hover:scale-110 transition-transform whitespace-nowrap">
                                            <Crown size={12} fill="currentColor" /> Desbloquear Premium
                                        </Link>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${!isPremium ? 'text-blue-500' : 'text-purple-500'}`}>
                                                    <Hash size={14} className={!isPremium ? 'text-blue-500' : 'text-purple-500'} /> Stems
                                                </span>
                                                {!isPremium && <Lock size={12} className="text-blue-500" />}
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${!isPremium ? 'text-blue-500/50' : 'text-purple-500/50'}`}>Pistas separadas • .ZIP</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {!isPremium && (
                                                <Link href="/pricing" className="relative z-10 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2">
                                                    <Zap size={10} className="fill-white" /> Mejorar a Premium
                                                </Link>
                                            )}
                                            {isPremium && <Toggle active={isStemsActive} onToggle={() => setIsStemsActive(!isStemsActive)} />}
                                            <div className={`flex items-center rounded-xl px-2.5 py-2 border-2 transition-all ${!isPremium ? 'opacity-30 grayscale pointer-events-none bg-background border-border' : (isStemsActive ? 'bg-background border-accent shadow-sm' : 'bg-background border-border opacity-50')}`}>
                                                <span className={`text-[10px] font-black mr-1 ${!isPremium ? 'text-muted' : (isStemsActive ? 'text-accent' : 'text-muted/30')}`}>$</span>
                                                <input
                                                    type="number"
                                                    disabled={!isPremium || !isStemsActive}
                                                    value={stemsPrice}
                                                    onChange={(e) => setStemsPrice(e.target.value)}
                                                    className={`w-10 text-[10px] font-black outline-none bg-transparent ${(!isPremium || !isStemsActive) ? 'text-muted' : 'text-foreground'}`}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    {isPremium ? (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept=".zip,.rar"
                                                onChange={(e) => {
                                                    const file = validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems (.ZIP)', 500);
                                                    setStemsFile(file);
                                                    if (!file) e.target.value = '';
                                                }}
                                                className="hidden"
                                                id="stems-file"
                                            />
                                            <label htmlFor="stems-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-purple-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center truncate">
                                                {stemsFile ? stemsFile.name : 'Seleccionar Stems'}
                                            </label>
                                            {stemsFile && <CheckCircle2 size={20} className="text-green-500 animate-in zoom-in" />}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-50 grayscale pointer-events-none select-none">
                                            <div className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-center text-muted">
                                                Disponible en el Plan Premium
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Licencia Exclusiva Full Width */}
                            <div className={`p-8 rounded-3xl border transition-all ${!isPremium ? 'bg-background border-blue-500/20 shadow-xl shadow-blue-500/5' :
                                isExclusive ? 'border-rose-500/50 bg-rose-500/5 shadow-xl shadow-rose-500/10' : 'bg-background border-border opacity-50'}`}>
                                <div className="flex justify-between items-center">
                                    <div className="flex flex-col">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-[11px] font-black uppercase tracking-widest mb-1 ${!isPremium ? 'text-blue-500' : 'text-rose-500'}`}>Licencia Exclusiva</span>
                                            {!isPremium && <Lock size={12} className="text-blue-500" />}
                                        </div>
                                        <span className={`text-[9px] font-bold uppercase tracking-widest leading-none ${!isPremium ? 'text-blue-500/50' : 'text-muted'}`}>Tu beat se retirará automáticamente tras la compra</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        {!isPremium && (
                                            <Link href="/pricing" className="relative z-10 bg-blue-600 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-blue-500 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2">
                                                <Zap size={10} className="fill-white" /> Mejorar a Premium
                                            </Link>
                                        )}
                                        {isPremium && <Toggle active={isExclusive} onToggle={() => {
                                            setIsExclusive(!isExclusive);
                                            if (!isExclusive) setExclusivePrice(exclusivePrice || '5000');
                                        }} />}
                                        <div className={`flex items-center rounded-xl px-3 py-2 border transition-all ${!isPremium ? 'opacity-30 grayscale pointer-events-none bg-background border-border' : (isExclusive ? 'bg-background border-rose-500 shadow-sm' : 'bg-background border-border shadow-none')}`}>
                                            <span className={`text-[10px] font-black mr-1 ${isExclusive ? 'text-rose-500' : 'text-muted/30'}`}>$</span>
                                            <input
                                                type="number"
                                                disabled={!isPremium || !isExclusive}
                                                value={exclusivePrice}
                                                onChange={(e) => {
                                                    const val = e.target.value;
                                                    setExclusivePrice(val);
                                                    setIsExclusive(val !== '' && parseInt(val) > 0);
                                                }}
                                                className={`w-16 text-xs font-black outline-none bg-transparent ${(isExclusive && isPremium) ? 'text-foreground' : 'text-muted'}`}
                                                placeholder="0"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>


                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-5 bg-accent text-white rounded-2xl font-black uppercase tracking-[0.3em] text-xs hover:bg-accent/90 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center justify-center gap-3 border-t border-white/10"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={20} />
                                        Publicando Beat...
                                    </>
                                ) : (
                                    <>
                                        <Upload size={18} />
                                        Publicar Beat en el Tianguis
                                    </>
                                )}
                            </button>
                        </form>
                    </div>
                </div >
            </main >

            <Footer />
        </div >
    );
}
