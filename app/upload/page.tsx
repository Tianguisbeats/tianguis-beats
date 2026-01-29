"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronRight, Hash, Lock,
    Link as LinkIcon, Edit2, Zap
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

const MOODS = [
    { label: "Agresivo", emoji: "🔥" },
    { label: "Chill", emoji: "🌊" },
    { label: "Oscuro", emoji: "🌑" },
    { label: "Triste", emoji: "💔" },
    { label: "Melódico", emoji: "✨" },
    { label: "Energético", emoji: "⚡" },
    { label: "Psicodélico", emoji: "🍄" },
    { label: "Brillante", emoji: "💎" },
    { label: "Clásico", emoji: "🎹" },
    { label: "Nostálgico", emoji: "🚬" },
    { label: "Malandro", emoji: "👺" },
    { label: "Tropical", emoji: "🌴" }
];

const GENRES = [
    "Trap", "Reggaeton", "Hip Hop", "Corridos", "R&B", "Drill", "Pop", "Lo-fi",
    "Phonk", "Afrobeat", "Techno", "House", "Rock", "Banda", "Alternativo"
];

const SCALES = ["Menor", "Mayor", "Dórica", "Frigia", "Lidia", "Mixolidia", "Locria"];
const KEYS_BASE = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [musicalScale, setMusicalScale] = useState('Menor');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [isExclusive, setIsExclusive] = useState(false);
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

        if (file.size > maxMB * 1024 * 1024) {
            setError(`${label}: El peso máximo es de ${maxMB}MB.`);
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

            const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
            setUserData(profile);

            const { count } = await supabase.from('beats').select('*', { count: 'exact', head: true }).eq('producer_id', session.user.id);
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

        if (!title || !genre || !bpm || !musicalKey || !previewFile || !hqMp3File || !coverFile) {
            setError("Por favor completa los campos y archivos obligatorios.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const userId = userData.id;
            const username = userData.username;
            const timestamp = Date.now();

            // Uploads
            // Portadas-beats para el artwork (Max 5MB, 3000x3000px)
            const coverPath = `${username}/${timestamp}-cover-${coverFile.name}`;
            await supabase.storage.from('portadas-beats').upload(coverPath, coverFile);
            const { data: { publicUrl: coverUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(coverPath);

            // Beats-muestras para el MP3 con Tag (Max 20MB)
            const previewPath = `${username}/${timestamp}-preview-${previewFile.name}`;
            await supabase.storage.from('beats-muestras').upload(previewPath, previewFile);
            const { data: { publicUrl: previewUrl } } = supabase.storage.from('beats-muestras').getPublicUrl(previewPath);

            // Beats-maestros divididos por formato
            // HQ MP3 (Max 50MB)
            const hqPath = `${username}/${timestamp}-hq-${hqMp3File.name}`;
            await supabase.storage.from('beats-mp3-alta-calidad').upload(hqPath, hqMp3File);

            let wavPath = null;
            if (wavFile && userData.subscription_tier !== 'free') {
                wavPath = `${username}/${timestamp}-wav-${wavFile.name}`;
                await supabase.storage.from('beats-wav').upload(wavPath, wavFile);
            }

            let stemsPath = null;
            if (stemsFile && userData.subscription_tier === 'premium') {
                stemsPath = `${username}/${timestamp}-stems-${stemsFile.name}`;
                await supabase.storage.from('beats-stems').upload(stemsPath, stemsFile);
            }

            // Save to DB
            const { error: dbError } = await supabase.from('beats').insert({
                producer_id: userId,
                title,
                genre,
                bpm: parseInt(bpm),
                musical_key: musicalKey,
                musical_scale: musicalScale,
                mood: selectedMoods.join(', '),
                cover_url: coverUrl,
                mp3_tag_url: previewUrl,
                mp3_url: hqPath,
                wav_url: wavPath,
                stems_url: stemsPath,
                is_exclusive: isExclusive,
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
    const isPremium = userData.subscription_tier === 'premium';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-4xl mx-auto px-4 mt-8">

                    {/* Header Minimalista */}
                    <div className="mb-10 pl-2 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-1">
                                Publicar nuevo <span className="text-blue-600">Beat</span>
                            </h1>
                            <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                Datos del Beat
                            </p>
                        </div>
                        {isFree && (
                            <div className="bg-blue-50 border border-blue-100 rounded-2xl px-6 py-4 flex flex-col items-center md:items-end">
                                <span className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-1">Tu Límite (Gratis)</span>
                                <div className="flex items-center gap-2">
                                    <div className="h-1.5 w-24 bg-blue-100 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-blue-600 transition-all duration-500"
                                            style={{ width: `${(beatCount / 5) * 100}%` }}
                                        />
                                    </div>
                                    <span className="text-xs font-black text-blue-600">{beatCount}/5</span>
                                </div>
                                {beatCount >= 5 && (
                                    <p className="text-[8px] font-bold text-red-500 uppercase mt-2">Límite alcanzado</p>
                                )}
                            </div>
                        )}
                    </div>

                    <div className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm">
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
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Título</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 focus:bg-white transition-all"
                                            placeholder="Nombre del Beat"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">BPM</label>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 transition-all"
                                                placeholder="140"
                                                required
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Género</label>
                                            <select
                                                value={genre}
                                                onChange={(e) => setGenre(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all appearance-none"
                                                required
                                            >
                                                <option value="">Seleccionar</option>
                                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Escala</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all">
                                                <option value="">Seleccionar Escala</option>
                                                {SCALES.map(s => <option key={s} value={s}>{s}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nota Base</label>
                                            <select
                                                value={musicalKey}
                                                onChange={(e) => setMusicalKey(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all"
                                                disabled={!musicalScale}
                                                required
                                            >
                                                <option value="">-</option>
                                                {KEYS_BASE.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Artwork (Sugerido 3000x3000px - Max 5MB)</label>
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
                                                        if (file.size > 5 * 1024 * 1024) {
                                                            setError("Artwork: El peso máximo es de 5MB.");
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
                                            <label htmlFor="cover" className="flex items-center gap-4 p-3 border-2 border-dashed border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50 hover:border-slate-300 transition-all h-[116px]">
                                                {coverFile ? (
                                                    <div className="flex items-center gap-3 w-full">
                                                        <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                                                            <ImageIcon size={24} className="text-slate-400" />
                                                        </div>
                                                        <div className="min-w-0">
                                                            <p className="text-xs font-bold text-slate-900 truncate">{coverFile.name}</p>
                                                            <p className="text-[10px] text-green-500 font-bold uppercase">Listo para subir</p>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex flex-col items-center justify-center w-full text-slate-400">
                                                        <Upload size={20} className="mb-2" />
                                                        <span className="text-[9px] font-bold uppercase">Click para subir</span>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Vibe (Max 3)</label>
                                        <div className="flex flex-wrap gap-2">
                                            {MOODS.map(mood => (
                                                <button
                                                    key={mood.label}
                                                    type="button"
                                                    onClick={() => handleMoodToggle(mood.label)}
                                                    className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wide transition-all ${selectedMoods.includes(mood.label)
                                                        ? 'bg-slate-900 text-white shadow-md'
                                                        : 'bg-slate-100 text-slate-500 hover:bg-slate-200'
                                                        }`}
                                                >
                                                    {mood.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="border-slate-100" />

                            {/* 2. Archivos y Licencias */}
                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-4">
                                    <div className="space-y-4">
                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-500 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">MP3 Tagged</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Previsualización con Voz</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {previewFile && <CheckCircle2 size={16} className="text-green-500" />}
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
                                                    <label htmlFor="preview-file" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all">
                                                        {previewFile ? 'Cambiar' : 'Seleccionar'}
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                {previewFile ? <p className="text-[9px] text-slate-400 font-bold truncate italic max-w-[70%]">{previewFile.name}</p> : <span />}
                                                <span className="text-[8px] font-black text-slate-300 uppercase">Max 20MB</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className="flex items-center justify-between p-4 bg-slate-50 rounded-2xl border border-slate-100 group hover:border-blue-500 transition-all">
                                                <div className="flex flex-col">
                                                    <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">MP3 High Quality</span>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">320kbps Maestro</span>
                                                </div>
                                                <div className="flex items-center gap-3">
                                                    {hqMp3File && <CheckCircle2 size={16} className="text-green-500" />}
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
                                                    <label htmlFor="hq-file" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all">
                                                        {hqMp3File ? 'Cambiar' : 'Seleccionar'}
                                                    </label>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                {hqMp3File ? <p className="text-[9px] text-slate-400 font-bold truncate italic max-w-[70%]">{hqMp3File.name}</p> : <span />}
                                                <span className="text-[8px] font-black text-slate-300 uppercase">Max 50MB</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${isFree ? 'bg-slate-100/50 border-slate-100 grayscale' : 'bg-slate-50 border-slate-100 group hover:border-blue-500'}`}>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Archivo WAV</span>
                                                        {isFree && <Lock size={12} className="text-slate-400" />}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Calidad de Estudio (PRO)</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-center">
                                                    {isFree ? (
                                                        <Link href="/pricing" className="px-4 py-2 bg-slate-900 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Mejorar</Link>
                                                    ) : (
                                                        <>
                                                            {wavFile && <CheckCircle2 size={16} className="text-green-500" />}
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
                                                            <label htmlFor="wav-file" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all">
                                                                {wavFile ? 'Cambiar' : 'Seleccionar'}
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                {wavFile ? <p className="text-[9px] text-slate-400 font-bold truncate italic max-w-[70%]">{wavFile.name}</p> : <span />}
                                                <span className="text-[8px] font-black text-slate-300 uppercase">Max 200MB</span>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-1">
                                            <div className={`flex items-center justify-between p-4 rounded-2xl border transition-all ${!isPremium ? 'bg-slate-100/50 border-slate-100 grayscale' : 'bg-slate-50 border-slate-100 group hover:border-blue-500'}`}>
                                                <div className="flex flex-col">
                                                    <div className="flex items-center gap-2">
                                                        <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Stems (.ZIP)</span>
                                                        {!isPremium && <Lock size={12} className="text-slate-400" />}
                                                    </div>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pistas Separadas (Premium)</span>
                                                </div>
                                                <div className="flex items-center gap-3 text-center">
                                                    {!isPremium ? (
                                                        <Link href="/pricing" className="px-4 py-2 bg-blue-600 text-white rounded-lg text-[9px] font-black uppercase tracking-widest">Premium</Link>
                                                    ) : (
                                                        <>
                                                            {stemsFile && <CheckCircle2 size={16} className="text-green-500" />}
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
                                                            <label htmlFor="stems-file" className="px-4 py-2 bg-white border border-slate-200 rounded-lg text-[9px] font-black uppercase tracking-widest cursor-pointer hover:bg-slate-50 transition-all">
                                                                {stemsFile ? 'Cambiar' : 'Seleccionar'}
                                                            </label>
                                                        </>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between px-2">
                                                {stemsFile ? <p className="text-[9px] text-slate-400 font-bold truncate italic max-w-[70%]">{stemsFile.name}</p> : <span />}
                                                <span className="text-[8px] font-black text-slate-300 uppercase">Max 500MB</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="p-5 bg-slate-50 rounded-2xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Licencia MP3</span>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Uso no comercial limitado</span>
                                            </div>
                                            <div className="flex items-center bg-white rounded-lg px-3 py-2 border border-slate-200">
                                                <span className="text-[10px] font-black text-slate-400 mr-1">$</span>
                                                <input
                                                    type="number"
                                                    value={standardPrice}
                                                    onChange={(e) => setStandardPrice(e.target.value)}
                                                    className="w-12 text-xs font-black outline-none text-slate-900"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center mb-4 pt-4 border-t border-slate-200/50">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${isFree ? 'text-slate-300' : 'text-slate-900'}`}>Licencia WAV</span>
                                                    {isFree && <Lock size={12} className="text-slate-300" />}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Alta calidad sin compresión</span>
                                            </div>
                                            <div className={`flex items-center rounded-lg px-3 py-2 border ${isFree ? 'bg-slate-100 border-slate-100' : 'bg-white border-slate-200'}`}>
                                                <span className="text-[10px] font-black text-slate-400 mr-1">$</span>
                                                <input
                                                    type="number"
                                                    disabled={isFree}
                                                    value={wavPrice}
                                                    onChange={(e) => setWavPrice(e.target.value)}
                                                    className="w-12 text-xs font-black outline-none text-slate-900 bg-transparent"
                                                />
                                            </div>
                                        </div>

                                        <div className="flex justify-between items-center pt-4 border-t border-slate-200/50">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${!isPremium ? 'text-slate-300' : 'text-slate-900'}`}>Licencia Stems</span>
                                                    {!isPremium && <Lock size={12} className="text-slate-300" />}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Pistas individuales</span>
                                            </div>
                                            <div className={`flex items-center rounded-lg px-3 py-2 border ${!isPremium ? 'bg-slate-100 border-slate-100' : 'bg-white border-slate-200'}`}>
                                                <span className="text-[10px] font-black text-slate-400 mr-1">$</span>
                                                <input
                                                    type="number"
                                                    disabled={!isPremium}
                                                    value={stemsPrice}
                                                    onChange={(e) => setStemsPrice(e.target.value)}
                                                    className="w-12 text-xs font-black outline-none text-slate-900 bg-transparent"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div className={`p-5 rounded-2xl border transition-all ${isExclusive ? 'border-blue-500 bg-blue-50/30 shadow-sm' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex justify-between items-center mb-4">
                                            <div className="flex flex-col">
                                                <div className="flex items-center gap-2">
                                                    <span className={`text-[10px] font-black uppercase tracking-widest mb-1 ${!isPremium ? 'text-slate-300' : 'text-slate-900'}`}>Licencia Exclusiva</span>
                                                    {!isPremium && <Lock size={12} className="text-slate-300" />}
                                                </div>
                                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">Derechos totales y retiro de la tienda</span>
                                            </div>
                                            <div className={`flex items-center rounded-lg px-3 py-2 border transition-all ${!isPremium ? 'bg-slate-100 border-slate-100' : isExclusive ? 'bg-white border-blue-500 ring-2 ring-blue-500/10' : 'bg-white border-slate-200'}`}>
                                                <span className={`text-[10px] font-black mr-1 ${isExclusive ? 'text-blue-600' : 'text-slate-400'}`}>$</span>
                                                <input
                                                    type="number"
                                                    disabled={!isPremium}
                                                    value={exclusivePrice}
                                                    onChange={(e) => {
                                                        const val = e.target.value;
                                                        setExclusivePrice(val);
                                                        setIsExclusive(val !== '' && parseInt(val) > 0);
                                                    }}
                                                    className={`w-16 text-xs font-black outline-none bg-transparent ${isExclusive ? 'text-blue-600' : 'text-slate-900'}`}
                                                    placeholder="0"
                                                />
                                            </div>
                                        </div>
                                        {isPremium && (
                                            <p className={`text-[8px] font-bold uppercase ${isExclusive ? 'text-blue-500' : 'text-slate-400'}`}>
                                                {isExclusive ? '★ Este beat se marcará como Exclusivo' : 'Deja en 0 para no ofrecer venta exclusiva'}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-4 bg-slate-900 text-white rounded-xl font-black uppercase tracking-[0.2em] text-xs hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                            >
                                {loading ? "Publicando..." : "Publicar Beat"}
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
