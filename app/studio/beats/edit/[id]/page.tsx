"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronLeft, Hash, Lock,
    Link as LinkIcon, Edit2, Zap, Eye, EyeOff, Save, X
} from 'lucide-react';

import { GENRES, MOODS, SUBGENRES } from '@/lib/constants';

const SCALES = ["Menor", "Mayor"];
const KEYS_BASE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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
    const [musicalKey, setMusicalKey] = useState('');
    const [musicalScale, setMusicalScale] = useState('Menor');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [beatType, setBeatType] = useState('');

    // License States
    const [isExclusive, setIsExclusive] = useState(false);
    const [isMp3Active, setIsMp3Active] = useState(true);
    const [isWavActive, setIsWavActive] = useState(true);
    const [isStemsActive, setIsStemsActive] = useState(true);

    const [exclusivePrice, setExclusivePrice] = useState('');
    const [standardPrice, setStandardPrice] = useState('');
    const [wavPrice, setWavPrice] = useState('');
    const [stemsPrice, setStemsPrice] = useState('');

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
                .from('profiles')
                .select('id, username, artistic_name, subscription_tier')
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

            if (beat.producer_id !== session.user.id) {
                router.push('/studio/beats');
                return;
            }

            // Populate Form
            setTitle(beat.title || '');
            setGenre(beat.genre || '');
            setSubgenre(beat.subgenre || '');
            setBpm(beat.bpm?.toString() || '');
            setMusicalKey(beat.musical_key || '');
            setMusicalScale(beat.musical_scale || 'Menor');
            setSelectedMoods(beat.mood ? beat.mood.split(', ') : []);
            setBeatType(beat.reference_artist || '');

            setStandardPrice(beat.price_mxn?.toString() || '0');
            setWavPrice(beat.price_wav_mxn?.toString() || '0');
            setStemsPrice(beat.price_stems_mxn?.toString() || '0');
            setExclusivePrice(beat.exclusive_price_mxn?.toString() || '0');

            setIsExclusive(beat.is_exclusive || false);
            setIsMp3Active(beat.is_mp3_active !== false);
            setIsWavActive(beat.is_wav_active !== false);
            setIsStemsActive(beat.is_stems_active !== false);

            setExistingPortada(beat.portadabeat_url);
            setExistingMp3HQ(beat.mp3_url);
            setExistingWav(beat.wav_url);
            setExistingStems(beat.stems_url);
            setExistingPreview(beat.mp3_tag_url);

            setExistingPreview(beat.mp3_tag_url);

            // Set Initial Data for comparison
            setInitialData({
                title: beat.title || '',
                genre: beat.genre || '',
                subgenre: beat.subgenre || '',
                bpm: beat.bpm?.toString() || '',
                musicalKey: beat.musical_key || '',
                musicalScale: beat.musical_scale || 'Menor',
                selectedMoods: beat.mood ? beat.mood.split(', ') : [],
                beatType: beat.reference_artist || '',
                standardPrice: beat.price_mxn?.toString() || '0',
                wavPrice: beat.price_wav_mxn?.toString() || '0',
                stemsPrice: beat.price_stems_mxn?.toString() || '0',
                exclusivePrice: isExclusive && beat.exclusive_price_mxn ? beat.exclusive_price_mxn.toString() : '0',
                isExclusive: beat.is_exclusive || false,
                isMp3Active: beat.is_mp3_active !== false,
                isWavActive: beat.is_wav_active !== false,
                isStemsActive: beat.is_stems_active !== false,
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
        title !== initialData.title ||
        genre !== initialData.genre ||
        subgenre !== initialData.subgenre ||
        bpm !== initialData.bpm ||
        musicalKey !== initialData.musicalKey ||
        musicalScale !== initialData.musicalScale ||
        JSON.stringify(selectedMoods.sort()) !== JSON.stringify(initialData.selectedMoods.sort()) ||
        beatType !== initialData.beatType ||
        standardPrice !== initialData.standardPrice ||
        wavPrice !== initialData.wavPrice ||
        stemsPrice !== initialData.stemsPrice ||
        exclusivePrice !== initialData.exclusivePrice ||
        isExclusive !== initialData.isExclusive ||
        isMp3Active !== initialData.isMp3Active ||
        isWavActive !== initialData.isWavActive ||
        isStemsActive !== initialData.isStemsActive ||
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

        if (!userData) return;

        setSaving(true);
        setError(null);

        try {
            const username = userData.username;
            const timestamp = Date.now();
            const sanitize = (name: string) => name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

            let portadabeat_url = existingPortada;
            let mp3_url = existingMp3HQ;
            let wav_url = existingWav;
            let stems_url = existingStems;
            let mp3_tag_url = existingPreview;

            // 1. Update Files
            if (coverFile) {
                const coverExt = coverFile.name.split('.').pop();
                const coverPath = `${username}/${timestamp}-cover.${coverExt}`;
                await supabase.storage.from('portadas-beats').upload(coverPath, coverFile);
                const { data: { publicUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(coverPath);
                portadabeat_url = publicUrl;
            }

            if (previewFile) {
                const previewPath = `${username}/${timestamp}-preview-${sanitize(previewFile.name)}`;
                await supabase.storage.from('beats-muestras').upload(previewPath, previewFile);
                mp3_tag_url = previewPath;
            }

            if (hqMp3File) {
                const hqPath = `${username}/${timestamp}-hq-${sanitize(hqMp3File.name)}`;
                await supabase.storage.from('beats-mp3-alta-calidad').upload(hqPath, hqMp3File);
                mp3_url = hqPath;
            }

            if (wavFile && userData.subscription_tier !== 'free') {
                const wavPath = `${username}/${timestamp}-wav-${sanitize(wavFile.name)}`;
                await supabase.storage.from('beats-wav').upload(wavPath, wavFile);
                wav_url = wavPath;
            }

            if (stemsFile && userData.subscription_tier === 'premium') {
                const stemsPath = `${username}/${timestamp}-stems-${sanitize(stemsFile.name)}`;
                await supabase.storage.from('beats-stems').upload(stemsPath, stemsFile);
                stems_url = stemsPath;
            }

            // 2. Update DB
            const { error: dbError } = await supabase.from('beats').update({
                title,
                genre,
                subgenre,
                bpm: parseInt(bpm),
                musical_key: musicalKey,
                musical_scale: musicalScale,
                mood: selectedMoods.join(', '),
                reference_artist: beatType,
                portadabeat_url,
                mp3_url,
                mp3_tag_url,
                wav_url,
                stems_url,
                is_exclusive: isExclusive,

                is_mp3_active: isMp3Active,
                is_wav_active: isWavActive,
                is_stems_active: isStemsActive,
                is_exclusive_active: isExclusive,

                price_mxn: parseInt(standardPrice) || 0,
                price_wav_mxn: parseInt(wavPrice) || 0,
                price_stems_mxn: parseInt(stemsPrice) || 0,
                exclusive_price_mxn: isExclusive ? parseInt(exclusivePrice) : null,
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

    const isFree = userData?.subscription_tier === 'free';
    const isPremium = userData?.subscription_tier === 'premium';

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
        <div className="bg-background text-foreground font-sans flex flex-col transition-colors duration-300 w-full">
            {/* Header Removed as requested for Studio Embedding */}

            <div className="max-w-4xl mx-auto px-4 w-full">
                <div className="mb-6 pl-1 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link href="/studio/beats" className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-background border border-border text-muted hover:text-accent hover:border-accent transition-all shrink-0">
                            <ChevronLeft size={16} />
                        </Link>
                        <div>
                            <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground flex items-center gap-2">
                                <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">Editar</span>
                                <span>Beat</span>
                            </h1>
                        </div>
                    </div>
                </div>

                <div className="bg-card rounded-[2rem] p-6 md:p-8 border border-border shadow-sm transition-colors">
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
                                        className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent focus:bg-card transition-all"
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
                                        <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all font-heading">
                                            <option value="">-</option>
                                            {KEYS_BASE.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Beat Type moved here */}
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Beat Type (Referencia)</label>
                                    <input
                                        type="text"
                                        value={beatType}
                                        onChange={(e) => setBeatType(e.target.value)}
                                        className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-accent transition-all"
                                        placeholder="Junior H, Peso Pluma, Natanael Cano..."
                                    />
                                    <p className="text-[9px] text-muted font-bold uppercase tracking-widest ml-1">Separa los artistas con comas para mejorar la recomendación</p>
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
                                {/* MP3 Tagged */}
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
                                            onChange={(e) => setPreviewFile(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Tagged', 20))}
                                            className="hidden"
                                            id="preview-file"
                                        />
                                        <label htmlFor="preview-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-green-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-green-500 hover:bg-green-500/10 transition-all text-center truncate">
                                            {previewFile ? previewFile.name : (existingPreview ? 'Actualizar MP3' : 'Subir MP3')}
                                        </label>
                                        {(previewFile || existingPreview) && <CheckCircle2 size={20} className="text-green-500" />}
                                    </div>
                                </div>

                                {/* MP3 HQ */}
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
                                            onChange={(e) => setHqMp3File(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 HQ', 50))}
                                            className="hidden"
                                            id="hq-file"
                                        />
                                        <label htmlFor="hq-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-amber-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-amber-500 hover:bg-amber-500/10 transition-all text-center truncate">
                                            {hqMp3File ? hqMp3File.name : (existingMp3HQ ? 'Actualizar MP3 HQ' : 'Subir MP3 HQ')}
                                        </label>
                                        {(hqMp3File || existingMp3HQ) && <CheckCircle2 size={20} className="text-green-500" />}
                                    </div>
                                </div>

                                {/* WAV (Updated for Pro Button Visibility & Size) */}
                                <div className={`flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all ${isFree ? 'bg-background border-amber-500/20 shadow-lg shadow-amber-500/5' :
                                    isWavActive ? 'bg-blue-500/5 border-blue-500/20 hover:bg-blue-500/10' : 'bg-background border-border opacity-75'
                                    }`}>
                                    <div className="flex items-center justify-between">
                                        <div className="flex flex-col">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${isFree ? 'text-amber-500' : 'text-blue-500'}`}>
                                                    <Music size={14} className={isFree ? 'text-amber-500' : 'text-blue-500'} /> Archivo WAV
                                                </span>
                                                {isFree && <Lock size={12} className="text-amber-500" />}
                                            </div>
                                            <span className={`text-[9px] font-bold uppercase tracking-widest ${isFree ? 'text-amber-500/50' : 'text-blue-500/50'}`}>Alta Fidelidad • 24 bit</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            {isFree && (
                                                <Link href="/pricing" className="relative z-10 bg-amber-500 text-white px-2.5 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest border border-amber-400 hover:scale-105 active:scale-95 transition-all shadow-xl shadow-amber-500/20 flex items-center gap-2">
                                                    <Zap size={10} className="fill-white" /> Mejorar a Pro
                                                </Link>
                                            )}
                                            {!isFree && <Toggle active={isWavActive} onToggle={() => setIsWavActive(!isWavActive)} />}

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
                                    {!isFree ? (
                                        <div className="flex items-center gap-3">
                                            <input
                                                type="file"
                                                accept=".wav"
                                                onChange={(e) => setWavFile(validateFile(e.target.files?.[0] || null, ['wav'], 'WAV', 200))}
                                                className="hidden"
                                                id="wav-file"
                                            />
                                            <label htmlFor="wav-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-blue-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-blue-500 hover:bg-blue-500/10 transition-all text-center truncate">
                                                {wavFile ? wavFile.name : (existingWav ? 'Actualizar WAV' : 'Subir WAV')}
                                            </label>
                                            {(wavFile || existingWav) && <CheckCircle2 size={20} className="text-green-500" />}
                                        </div>
                                    ) : (
                                        <div className="flex items-center gap-3 opacity-50 grayscale pointer-events-none select-none">
                                            <div className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-border rounded-xl text-[9px] font-black uppercase tracking-widest text-center text-muted">
                                                Disponible en el Plan Pro
                                            </div>
                                        </div>
                                    )}
                                </div>

                                {/* STEMS (Updated for Premium Button Visibility & Size) */}
                                <div className={`flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all ${!isPremium ? 'bg-background border-blue-500/20 shadow-lg shadow-blue-500/5' :
                                    isStemsActive ? 'bg-purple-500/5 border-purple-500/20 hover:bg-purple-500/10' : 'bg-background border-border opacity-75'
                                    }`}>
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
                                                onChange={(e) => setStemsFile(validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems', 500))}
                                                className="hidden"
                                                id="stems-file"
                                            />
                                            <label htmlFor="stems-file" className="flex-1 px-4 py-3 bg-card border-2 border-dashed border-purple-500/20 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-purple-500 hover:bg-purple-500/10 transition-all text-center truncate">
                                                {stemsFile ? stemsFile.name : (existingStems ? 'Actualizar Stems' : 'Subir Stems')}
                                            </label>
                                            {(stemsFile || existingStems) && <CheckCircle2 size={20} className="text-green-500" />}
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

                            {/* Licencia Exclusiva Full Width (Updated for Premium Button Visibility & Size) */}
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
        </div>
    );
}
