"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronLeft, Hash, Lock,
    Check, Trash2, Edit2, Zap, Eye, EyeOff, Crown
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

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

    // Form State
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [subgenre, setSubgenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [musicalScale, setMusicalScale] = useState('Menor');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);

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

    // New Files State
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [hqMp3File, setHqMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                router.push('/login');
                return;
            }

            // Load Profile
            const { data: profile } = await supabase
                .from('profiles')
                .select('id, username, artistic_name, subscription_tier')
                .eq('id', session.user.id)
                .single();
            setUserData(profile);

            // Load Beat
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

            // Security Check
            if (beat.producer_id !== session.user.id) {
                router.push('/studio/beats');
                return;
            }

            // Set Form Data
            setTitle(beat.title || '');
            setGenre(beat.genre || '');
            setSubgenre(beat.subgenre || '');
            setBpm(beat.bpm?.toString() || '');
            setMusicalKey(beat.musical_key || '');
            setMusicalScale(beat.musical_scale || 'Menor');
            setSelectedMoods(beat.mood ? beat.mood.split(', ') : []);

            // Prices & Toggles
            setStandardPrice(beat.price_mxn?.toString() || '0');
            setWavPrice(beat.price_wav_mxn?.toString() || '0');
            setStemsPrice(beat.price_stems_mxn?.toString() || '0');
            setExclusivePrice(beat.exclusive_price_mxn?.toString() || '0');

            setIsExclusive(beat.is_exclusive || false);
            // Default to true if null/undefined for backward compatibility
            setIsMp3Active(beat.is_mp3_active !== false);
            setIsWavActive(beat.is_wav_active !== false);
            setIsStemsActive(beat.is_stems_active !== false);

            setExistingPortada(beat.portadabeat_url);
            setExistingMp3HQ(beat.mp3_url);
            setExistingWav(beat.wav_url);
            setExistingStems(beat.stems_url);

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

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
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

            // 1. Update Files if provided
            if (coverFile) {
                const coverExt = coverFile.name.split('.').pop();
                const coverPath = `${username}/${timestamp}-cover.${coverExt}`;
                await supabase.storage.from('portadas-beats').upload(coverPath, coverFile);
                const { data: { publicUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(coverPath);
                portadabeat_url = publicUrl;
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
                portadabeat_url,
                mp3_url,
                wav_url,
                stems_url,
                is_exclusive: isExclusive ?? false, // Ensure boolean
                // Save License Activation States
                is_mp3_active: isMp3Active,
                is_wav_active: isWavActive,
                is_stems_active: isStemsActive,
                is_exclusive_active: isExclusive, // Syncs with is_exclusive logic

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
        <div className="min-h-screen flex items-center justify-center bg-background">
            <Loader2 className="animate-spin text-accent" size={40} />
        </div>
    );

    const isFree = userData?.subscription_tier === 'free';
    const isPremium = userData?.subscription_tier === 'premium';

    // Helper to render toggles
    const Toggle = ({ active, onToggle, disabled = false }: { active: boolean, onToggle: () => void, disabled?: boolean }) => (
        <button
            type="button"
            onClick={onToggle}
            disabled={disabled}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-accent-soft text-muted' :
                active ? 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200' : 'bg-red-50 dark:bg-red-900/30 text-red-500 dark:text-red-400 hover:bg-red-100'
                }`}
        >
            {active ? <Eye size={12} /> : <EyeOff size={12} />}
            {active ? 'Visible' : 'Oculto'}
        </button>
    );

    return (
        <div className="min-h-screen bg-background text-foreground font-body flex flex-col pt-20 transition-colors duration-300">
            <Navbar />

            <main className="flex-1 p-4 md:p-8 pt-4">
                <div className="max-w-5xl mx-auto space-y-8">
                    {/* Header compactado */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-card p-8 rounded-[2.5rem] border border-border shadow-sm">
                        <div className="flex items-center gap-4">
                            <Link href="/studio/beats" className="inline-flex items-center justify-center w-10 h-10 rounded-full bg-background border border-border text-muted hover:text-accent hover:border-accent transition-all shrink-0">
                                <ChevronLeft size={18} />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-black uppercase tracking-tighter text-foreground font-heading">
                                    Editar <span className="text-accent">"{title}"</span>
                                </h1>
                                <p className="text-muted font-bold uppercase tracking-widest text-[10px] flex items-center gap-2 mt-1">
                                    <Edit2 size={12} className="text-accent" /> agrega los datos de tu Beat
                                </p>
                            </div>
                        </div>
                        <button
                            type="submit"
                            form="updateBeatForm" // Link to the form below
                            disabled={saving}
                            className="bg-foreground text-background py-3 px-6 rounded-full font-black uppercase text-[12px] tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-3 disabled:opacity-50 min-h-[48px] md:min-w-[200px]"
                        >
                            {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                            {saving ? 'Guardando Cambios...' : 'Guardar y Publicar'}
                        </button>
                    </div>

                    <div className="bg-card rounded-[1.5rem] md:rounded-[2.5rem] p-6 md:p-10 border border-border shadow-sm relative overflow-hidden">

                        {error && (
                            <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-[10px] font-black uppercase mb-8 flex items-center gap-3">
                                <AlertCircle size={18} /> {error}
                            </div>
                        )}
                        {success && (
                            <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-[10px] font-black uppercase mb-8 flex items-center gap-3">
                                <CheckCircle2 size={18} /> ¡Cambios guardados con éxito!
                            </div>
                        )}

                        <form onSubmit={handleUpdate} id="updateBeatForm" className="space-y-8 md:space-y-12">

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-10">
                                {/* METADATA */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Título</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all text-foreground min-h-[56px]"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Género</label>
                                        <select
                                            value={genre}
                                            onChange={(e) => {
                                                setGenre(e.target.value);
                                                setSubgenre('');
                                            }}
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all appearance-none text-foreground min-h-[56px]"
                                        >
                                            <option value="">Seleccionar</option>
                                            {GENRES.map(g => <option key={g} value={g} className="bg-card text-foreground">{g}</option>)}
                                        </select>
                                    </div>

                                    <div className="space-y-2">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Subgénero</label>
                                            <span className="text-[9px] font-bold text-muted uppercase tracking-widest">(Opcional)</span>
                                        </div>
                                        <select
                                            value={subgenre}
                                            onChange={(e) => setSubgenre(e.target.value)}
                                            className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all appearance-none cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed text-foreground min-h-[56px]"
                                            disabled={!genre || !SUBGENRES[genre]}
                                        >
                                            <option value="">{genre ? 'Ninguno / Automático' : 'Selecciona un género primero'}</option>
                                            {genre && SUBGENRES[genre]?.map(sg => (
                                                <option key={sg} value={sg} className="bg-card text-foreground">{sg}</option>
                                            ))}
                                        </select>
                                    </div>

                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">BPM</label>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                className="w-full bg-background border-2 border-border rounded-xl px-4 py-4 text-sm font-bold outline-none focus:border-accent transition-all text-foreground min-h-[56px]"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Escala</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all text-foreground min-h-[56px]">
                                                {SCALES.map(s => <option key={s} value={s} className="bg-card text-foreground">{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-muted">Nota</label>
                                            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="w-full bg-background border-2 border-border rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-accent transition-all text-foreground min-h-[56px]">
                                                {KEYS_BASE.map(k => <option key={k} value={k} className="bg-card text-foreground">{k}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ARTWORK & MOOD */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted">Artwork</label>
                                        <input
                                            type="file"
                                            id="cover"
                                            className="hidden"
                                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="cover" className="flex items-center gap-4 p-4 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-background transition-all h-[120px]">
                                            <div className="w-20 h-20 bg-background rounded-lg overflow-hidden border border-border shadow-sm shrink-0">
                                                {coverFile ? (
                                                    <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" />
                                                ) : existingPortada ? (
                                                    <img src={existingPortada} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-muted/30"><ImageIcon size={24} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-accent block mb-1">Cambiar Portada</span>
                                                <p className="text-[8px] font-bold text-muted uppercase leading-snug">Original recomendada:</p>
                                                <p className="text-[8px] font-bold text-muted uppercase leading-snug">3000 x 3000 PX</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted ml-1">Vibe (3 opciones)</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {MOODS.map(mood => (
                                                <button
                                                    key={mood.label}
                                                    type="button"
                                                    onClick={() => handleMoodToggle(mood.label)}
                                                    className={`px-3 py-2 rounded-lg text-[9px] font-black uppercase transition-all min-h-[40px] ${selectedMoods.includes(mood.label)
                                                        ? 'bg-foreground text-background'
                                                        : 'bg-background text-muted hover:bg-accent-soft'
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

                            {/* FILES & LICENSES */}
                            <div className="space-y-8">
                                <div className="flex items-center justify-between">
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">COSTOS Y ARCHIVOS DEL BEAT</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activa/Desactiva licencias 👁️</span>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {/* MP3 HQ */}
                                    <div className={`flex flex-col gap-4 p-6 rounded-3xl border transition-all ${isMp3Active ? 'bg-amber-50/30 border-amber-100 hover:bg-amber-50/50' : 'bg-slate-50/50 border-slate-100 opacity-75 grayscale'}`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest mb-1 flex items-center gap-1.5">
                                                    <Music size={14} className="text-amber-500" /> MP3 MASTER HQ
                                                </span>
                                                <span className="text-[9px] font-bold text-amber-500/70 uppercase tracking-widest">Calidad 320 KBPS • Sin Tags</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Toggle active={isMp3Active} onToggle={() => setIsMp3Active(!isMp3Active)} />
                                                <div className="flex items-center gap-2 bg-white rounded-xl px-2 py-1.5 border-2 border-amber-100 shadow-sm">
                                                    <span className="text-[10px] font-black text-amber-500">$</span>
                                                    <input type="number" value={standardPrice} onChange={(e) => setStandardPrice(e.target.value)} className="w-10 text-[10px] font-black outline-none text-slate-900" />
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-3">
                                            <input type="file" id="hq" className="hidden" onChange={(e) => setHqMp3File(e.target.files?.[0] || null)} />
                                            <label htmlFor="hq" className="flex-1 px-4 py-3 bg-white border-2 border-dashed border-amber-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-amber-400 hover:bg-amber-50 transition-all text-center truncate">
                                                <span className="text-slate-400">{hqMp3File ? hqMp3File.name : (existingMp3HQ ? 'Actualizar MP3' : 'Subir MP3 HQ')}</span>
                                            </label>
                                            {(hqMp3File || existingMp3HQ) && <CheckCircle2 size={20} className="text-green-500" />}
                                        </div>
                                    </div>

                                    {/* WAV */}
                                    <div className={`flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all ${isFree ? 'bg-slate-100/30 border-slate-100 grayscale opacity-60' :
                                        isWavActive ? 'bg-blue-50/30 border-blue-100 hover:bg-blue-50/50' : 'bg-slate-50/50 border-slate-100 opacity-75'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${isFree ? 'text-slate-400' : 'text-blue-700'}`}>
                                                        <Music size={14} className={isFree ? 'text-slate-400' : 'text-blue-500'} /> Archivo WAV
                                                    </span>
                                                    {isFree && <Lock size={12} className="text-slate-400" />}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${isFree ? 'text-slate-300' : 'text-blue-500/70'}`}>Alta Fidelidad • 24 bit</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {!isFree && <Toggle active={isWavActive} onToggle={() => setIsWavActive(!isWavActive)} />}
                                                <div className={`flex items-center rounded-xl px-2.5 py-2 border-2 ${isFree ? 'bg-slate-50 border-slate-100' : 'bg-white border-blue-100 shadow-sm'}`}>
                                                    <span className={`text-[10px] font-black mr-1 ${isFree ? 'text-slate-300' : 'text-blue-400'}`}>$</span>
                                                    <input type="number" disabled={isFree} value={wavPrice} onChange={(e) => setWavPrice(e.target.value)} className={`w-10 text-[10px] font-black outline-none bg-transparent ${isFree ? 'text-slate-300' : 'text-slate-900'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        {!isFree && (
                                            <div className="flex items-center gap-3">
                                                <input type="file" id="wav" className="hidden" onChange={(e) => setWavFile(e.target.files?.[0] || null)} />
                                                <label htmlFor="wav" className="flex-1 px-4 py-3 bg-white border-2 border-dashed border-blue-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-all text-center truncate">
                                                    <span className="text-slate-400">{wavFile ? wavFile.name : (existingWav ? 'Actualizar WAV' : 'Subir WAV')}</span>
                                                </label>
                                                {(wavFile || existingWav) && <CheckCircle2 size={20} className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* STEMS */}
                                    <div className={`flex flex-col gap-4 p-6 rounded-3xl border-2 transition-all ${!isPremium ? 'bg-slate-100/30 border-slate-100 grayscale opacity-60' :
                                        isStemsActive ? 'bg-purple-50 border-purple-200 hover:bg-purple-100/50' : 'bg-slate-50/50 border-slate-100 opacity-75'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 flex items-center gap-1.5 ${!isPremium ? 'text-slate-400' : 'text-purple-700'}`}>
                                                        <Music size={14} className={!isPremium ? 'text-slate-400' : 'text-purple-500'} /> Stems (.ZIP)
                                                    </span>
                                                    {!isPremium && <Lock size={12} className="text-slate-400" />}
                                                </div>
                                                <span className={`text-[9px] font-bold uppercase tracking-widest ${!isPremium ? 'text-slate-300' : 'text-purple-500/70'}`}>Pistas separadas</span>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {isPremium && <Toggle active={isStemsActive} onToggle={() => setIsStemsActive(!isStemsActive)} />}
                                                <div className={`flex items-center rounded-xl px-2.5 py-2 border-2 ${!isPremium ? 'bg-slate-50 border-slate-100' : 'bg-white border-purple-100 shadow-sm'}`}>
                                                    <span className={`text-[10px] font-black mr-1 ${!isPremium ? 'text-slate-300' : 'text-purple-400'}`}>$</span>
                                                    <input type="number" disabled={!isPremium} value={stemsPrice} onChange={(e) => setStemsPrice(e.target.value)} className={`w-10 text-[10px] font-black outline-none bg-transparent ${!isPremium ? 'text-slate-300' : 'text-slate-900'}`} />
                                                </div>
                                            </div>
                                        </div>
                                        {isPremium && (
                                            <div className="flex items-center gap-3">
                                                <input type="file" id="stems" className="hidden" onChange={(e) => setStemsFile(e.target.files?.[0] || null)} />
                                                <label htmlFor="stems" className="flex-1 px-4 py-3 bg-white border-2 border-dashed border-purple-200 rounded-xl text-[9px] font-black uppercase tracking-widest cursor-pointer hover:border-purple-400 hover:bg-purple-50 transition-all text-center truncate">
                                                    <span className="text-slate-400">{stemsFile ? stemsFile.name : (existingStems ? 'Actualizar Stems' : 'Subir Stems')}</span>
                                                </label>
                                                {(stemsFile || existingStems) && <CheckCircle2 size={20} className="text-green-500" />}
                                            </div>
                                        )}
                                    </div>

                                    {/* EXCLUSIVA */}
                                    <div className={`p-6 rounded-2xl border space-y-4 transition-all ${!isPremium ? 'opacity-50 pointer-events-none grayscale' :
                                        isExclusive ? 'bg-blue-50/10 border-blue-500/50 shadow-xl shadow-blue-500/5' : 'bg-slate-50/5 border-slate-100/10'
                                        }`}>
                                        <div className="flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className={`p-2 rounded-xl ${isExclusive ? 'bg-blue-500 text-white' : 'bg-slate-200 text-slate-400'}`}>
                                                    <Crown size={20} />
                                                </div>
                                                <div>
                                                    <h4 className={`text-sm font-black uppercase tracking-tight ${isExclusive ? 'text-blue-500' : 'text-slate-400'}`}>Licencia Exclusiva</h4>
                                                    <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest">Venta única y total</p>
                                                </div>
                                            </div>
                                            <label className="relative inline-flex items-center cursor-pointer">
                                                <input
                                                    type="checkbox"
                                                    className="sr-only peer"
                                                    checked={isExclusive}
                                                    onChange={(e) => setIsExclusive(e.target.checked)}
                                                />
                                                <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                                            </label>
                                        </div>

                                        <div className="flex items-center gap-4">
                                            <div className={`flex-1 flex items-center rounded-lg px-3 py-2 border ${isExclusive ? 'bg-background border-blue-500/30' : 'bg-background border-border'}`}>
                                                <span className={`text-[10px] font-black mr-1 ${isExclusive ? 'text-blue-400' : 'text-slate-400'}`}>$</span>
                                                <input
                                                    type="number"
                                                    value={exclusivePrice}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setExclusivePrice(val);
                                                        if (val && parseInt(val) > 0) setIsExclusive(true);
                                                    }}
                                                    className={`w-full text-xs font-bold outline-none bg-transparent text-foreground`}
                                                    placeholder="Precio"
                                                />
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-foreground text-background py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-accent hover:text-white transition-all shadow-2xl shadow-accent/10 flex items-center justify-center gap-4 disabled:opacity-50 min-h-[64px]"
                            >
                                {saving ? <Loader2 className="animate-spin" size={20} /> : <Check size={20} />}
                                {saving ? 'Guardando Cambios...' : 'Guardar y Publicar'}
                            </button>
                        </form>

                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
