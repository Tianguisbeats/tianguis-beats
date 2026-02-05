"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronLeft, Hash, Lock,
    Check, Trash2, Edit2, Zap, Eye, EyeOff
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

import { GENRES, MOODS } from '@/lib/constants';

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
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Loader2 className="animate-spin text-blue-600" size={40} />
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
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${disabled ? 'opacity-50 cursor-not-allowed bg-slate-100 text-slate-400' :
                active ? 'bg-green-100 text-green-600 hover:bg-green-200' : 'bg-red-50 text-red-500 hover:bg-red-100'
                }`}
        >
            {active ? <Eye size={12} /> : <EyeOff size={12} />}
            {active ? 'Visible' : 'Oculto'}
        </button>
    );

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-4xl mx-auto px-4 mt-8">

                    <Link href="/studio/beats" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-all mb-8 group">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1" />
                        Volver a mi inventario
                    </Link>

                    <div className="mb-10">
                        <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900">
                            Editar <span className="text-blue-600">"{title}"</span>
                        </h1>
                    </div>

                    <div className="bg-white rounded-[2.5rem] p-10 border border-slate-100 shadow-sm relative overflow-hidden">

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

                        <form onSubmit={handleUpdate} className="space-y-12">

                            <div className="grid md:grid-cols-2 gap-10">
                                {/* METADATA */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Título</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">BPM</label>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Género</label>
                                            <select
                                                value={genre}
                                                onChange={(e) => setGenre(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                                            >
                                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Escala</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all">
                                                {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Nota Base</label>
                                            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all">
                                                {KEYS_BASE.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                {/* ARTWORK & MOOD */}
                                <div className="space-y-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Artwork</label>
                                        <input
                                            type="file"
                                            id="cover"
                                            className="hidden"
                                            onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                                        />
                                        <label htmlFor="cover" className="flex items-center gap-4 p-4 border-2 border-dashed border-slate-100 rounded-2xl cursor-pointer hover:bg-slate-50 transition-all h-[120px]">
                                            <div className="w-20 h-20 bg-white rounded-lg overflow-hidden border border-slate-100 shadow-sm shrink-0">
                                                {coverFile ? (
                                                    <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" />
                                                ) : existingPortada ? (
                                                    <img src={existingPortada} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-slate-300"><ImageIcon size={24} /></div>
                                                )}
                                            </div>
                                            <div>
                                                <span className="text-[10px] font-black uppercase text-blue-600 block mb-1">Cambiar Portada</span>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase leading-snug">Original recomendada:</p>
                                                <p className="text-[8px] font-bold text-slate-400 uppercase leading-snug">3000 x 3000 PX</p>
                                            </div>
                                        </label>
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vibe (3 opciones)</label>
                                        <div className="flex flex-wrap gap-1.5">
                                            {MOODS.map(mood => (
                                                <button
                                                    key={mood.label}
                                                    type="button"
                                                    onClick={() => handleMoodToggle(mood.label)}
                                                    className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase transition-all ${selectedMoods.includes(mood.label)
                                                        ? 'bg-slate-900 text-white'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
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
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">DATOS DEL BEAT</h3>
                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Activa/Desactiva Licencias con el ojo</span>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
                                    {/* MP3 HQ */}
                                    <div className={`p-6 rounded-2xl border space-y-4 transition-all ${isMp3Active ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/50 border-slate-100 opacity-75'}`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest">MP3 Alta Calidad</span>
                                                <Toggle active={isMp3Active} onToggle={() => setIsMp3Active(!isMp3Active)} />
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                                                <span className="text-[10px] font-black text-slate-300">$</span>
                                                <input type="number" value={standardPrice} onChange={(e) => setStandardPrice(e.target.value)} className="w-12 text-[10px] font-black outline-none bg-transparent" />
                                            </div>
                                        </div>
                                        <input type="file" id="hq" className="hidden" onChange={(e) => setHqMp3File(e.target.files?.[0] || null)} />
                                        <label htmlFor="hq" className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{hqMp3File ? hqMp3File.name : (existingMp3HQ ? 'Actualizar MP3' : 'Subir MP3 HQ')}</span>
                                            <Upload size={14} className="text-slate-400" />
                                        </label>
                                    </div>

                                    {/* WAV */}
                                    <div className={`p-6 rounded-2xl border space-y-4 transition-all ${isFree ? 'opacity-50 pointer-events-none grayscale' :
                                        isWavActive ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/50 border-slate-100 opacity-75'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest">Archivo WAV</span>
                                                {isFree ? <Lock size={12} /> : <Toggle active={isWavActive} onToggle={() => setIsWavActive(!isWavActive)} />}
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                                                <span className="text-[10px] font-black text-slate-300">$</span>
                                                <input type="number" value={wavPrice} onChange={(e) => setWavPrice(e.target.value)} className="w-12 text-[10px] font-black outline-none bg-transparent" />
                                            </div>
                                        </div>
                                        <input type="file" id="wav" className="hidden" onChange={(e) => setWavFile(e.target.files?.[0] || null)} />
                                        <label htmlFor="wav" className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{wavFile ? wavFile.name : (existingWav ? 'Actualizar WAV' : 'Subir WAV')}</span>
                                            <Upload size={14} className="text-slate-400" />
                                        </label>
                                    </div>

                                    {/* STEMS */}
                                    <div className={`p-6 rounded-2xl border space-y-4 transition-all ${!isPremium ? 'opacity-50 pointer-events-none grayscale' :
                                        isStemsActive ? 'bg-slate-50 border-slate-100' : 'bg-slate-50/50 border-slate-100 opacity-75'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className="text-[11px] font-black uppercase tracking-widest">Stems (.ZIP)</span>
                                                {!isPremium ? <Lock size={12} /> : <Toggle active={isStemsActive} onToggle={() => setIsStemsActive(!isStemsActive)} />}
                                            </div>
                                            <div className="flex items-center gap-2 bg-white rounded-lg px-2 py-1.5 border border-slate-200">
                                                <span className="text-[10px] font-black text-slate-300">$</span>
                                                <input type="number" value={stemsPrice} onChange={(e) => setStemsPrice(e.target.value)} className="w-12 text-[10px] font-black outline-none bg-transparent" />
                                            </div>
                                        </div>
                                        <input type="file" id="stems" className="hidden" onChange={(e) => setStemsFile(e.target.files?.[0] || null)} />
                                        <label htmlFor="stems" className="flex items-center justify-between px-4 py-2.5 bg-white border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-100 transition-all">
                                            <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{stemsFile ? stemsFile.name : (existingStems ? 'Actualizar Stems' : 'Subir Stems')}</span>
                                            <Upload size={14} className="text-slate-400" />
                                        </label>
                                    </div>

                                    {/* EXCLUSIVA */}
                                    <div className={`p-6 rounded-2xl border space-y-4 transition-all ${!isPremium ? 'opacity-50 pointer-events-none grayscale' :
                                        isExclusive ? 'bg-pink-50/50 border-pink-500 shadow-xl shadow-pink-500/10' : 'bg-slate-50 border-slate-100'
                                        }`}>
                                        <div className="flex justify-between items-center">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[11px] font-black uppercase tracking-widest ${isExclusive ? 'text-pink-600' : ''}`}>Licencia Exclusiva</span>
                                                {!isPremium ? <Lock size={12} /> :
                                                    <Toggle
                                                        active={isExclusive}
                                                        onToggle={() => {
                                                            setIsExclusive(!isExclusive);
                                                            if (!isExclusive) setExclusivePrice(exclusivePrice || '5000');
                                                        }}
                                                    />
                                                }
                                            </div>
                                            <div className={`flex items-center rounded-lg px-3 py-2 border ${isExclusive ? 'bg-white border-pink-200' : 'bg-white border-slate-200'}`}>
                                                <span className={`text-[10px] font-black mr-1 ${isExclusive ? 'text-pink-300' : 'text-slate-300'}`}>$</span>
                                                <input
                                                    type="number"
                                                    value={exclusivePrice}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setExclusivePrice(val);
                                                        if (val && parseInt(val) > 0) setIsExclusive(true);
                                                    }}
                                                    className={`w-16 text-xs font-bold outline-none bg-transparent ${isExclusive ? 'text-white' : 'text-slate-900'}`}
                                                />
                                            </div>
                                        </div>
                                        <p className={`text-[8px] font-black uppercase ${isExclusive ? 'text-white/60' : 'text-slate-400'}`}>
                                            {isExclusive ? 'Este beat dejará de estar a la venta tras su compra.' : 'Activa poniendo un precio mayor a 0, o haz click en el ojo.'}
                                        </p>
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={saving}
                                className="w-full bg-slate-900 text-white py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-blue-600 transition-all shadow-2xl shadow-slate-900/10 flex items-center justify-center gap-4 disabled:opacity-50"
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
