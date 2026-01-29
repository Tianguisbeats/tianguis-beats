"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
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

const GENRES = ["Trap", "Reggaeton", "Hip Hop", "Corridos", "R&B", "Drill", "Pop", "Lo-fi"];
const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

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
    const [exclusivePrice, setExclusivePrice] = useState('');
    const [standardPrice, setStandardPrice] = useState('199');

    // Files State
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [hqMp3File, setHqMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

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
            const timestamp = Date.now();

            // Uploads
            const coverPath = `${userId}/${timestamp}-cover-${coverFile.name}`;
            await supabase.storage.from('beats-previews').upload(coverPath, coverFile);
            const { data: { publicUrl: coverUrl } } = supabase.storage.from('beats-previews').getPublicUrl(coverPath);

            const previewPath = `${userId}/${timestamp}-preview-${previewFile.name}`;
            await supabase.storage.from('beats-previews').upload(previewPath, previewFile);
            const { data: { publicUrl: previewUrl } } = supabase.storage.from('beats-previews').getPublicUrl(previewPath);

            const hqPath = `${userId}/${timestamp}-hq-${hqMp3File.name}`;
            await supabase.storage.from('beats-raw').upload(hqPath, hqMp3File);

            let wavPath = null;
            if (wavFile && userData.subscription_tier !== 'free') {
                wavPath = `${userId}/${timestamp}-wav-${wavFile.name}`;
                await supabase.storage.from('beats-raw').upload(wavPath, wavFile);
            }

            let stemsPath = null;
            if (stemsFile && userData.subscription_tier === 'premium') {
                stemsPath = `${userId}/${timestamp}-stems-${stemsFile.name}`;
                await supabase.storage.from('beats-raw').upload(stemsPath, stemsFile);
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
                    <div className="mb-10 pl-2">
                        <h1 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-1">
                            Publicar nuevo <span className="text-blue-600">Beat</span>
                        </h1>
                        <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            Datos del Beat
                        </p>
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
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Nota</label>
                                            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all" required>
                                                <option value="">-</option>
                                                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Escala</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="w-full bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-3 text-xs font-bold outline-none focus:border-blue-500 transition-all">
                                                <option value="Menor">Menor</option>
                                                <option value="Mayor">Mayor</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-slate-400 ml-1">Artwork (3000px)</label>
                                        <div className="relative">
                                            <input type="file" accept="image/*" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" id="cover" />
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
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2 flex items-center gap-2">
                                        <Music size={14} /> Archivos de Audio
                                    </h3>

                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">MP3 Tagged</span>
                                            <input type="file" accept=".mp3" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} className="text-[10px] w-40" />
                                        </div>
                                        <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">MP3 HQ</span>
                                            <input type="file" accept=".mp3" onChange={(e) => setHqMp3File(e.target.files?.[0] || null)} className="text-[10px] w-40" />
                                        </div>
                                        <div className={`flex items-center justify-between p-3 rounded-xl border ${isFree ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">WAV</span>
                                                {isFree && <Lock size={10} />}
                                            </div>
                                            <input type="file" accept=".wav" disabled={isFree} onChange={(e) => setWavFile(e.target.files?.[0] || null)} className="text-[10px] w-40" />
                                        </div>
                                        <div className={`flex items-center justify-between p-3 rounded-xl border ${!isPremium ? 'bg-slate-100 border-slate-200 opacity-60' : 'bg-slate-50 border-slate-100'}`}>
                                            <div className="flex items-center gap-2">
                                                <span className="text-[10px] font-bold text-slate-500 uppercase">Stems</span>
                                                {!isPremium && <Lock size={10} />}
                                            </div>
                                            <input type="file" accept=".zip,.rar" disabled={!isPremium} onChange={(e) => setStemsFile(e.target.files?.[0] || null)} className="text-[10px] w-40" />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    <h3 className="text-xs font-black uppercase tracking-widest text-slate-900 mb-2 flex items-center gap-2">
                                        <Zap size={14} /> Licencias
                                    </h3>

                                    <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <div className="flex justify-between items-center mb-2">
                                            <span className="text-[10px] font-bold text-slate-500 uppercase">Licencia Estándar</span>
                                            <span className="font-bold text-sm text-slate-900">${standardPrice}</span>
                                        </div>
                                        <input
                                            type="range" min="100" max="1000" step="50"
                                            value={standardPrice}
                                            onChange={(e) => setStandardPrice(e.target.value)}
                                            className="w-full h-1 bg-slate-200 rounded-lg appearance-none cursor-pointer"
                                        />
                                    </div>

                                    <div className={`p-4 rounded-xl border transition-all ${isExclusive ? 'bg-blue-50 border-blue-200' : 'bg-slate-50 border-slate-100'}`}>
                                        <div className="flex justify-between items-center mb-2">
                                            <div className="flex items-center gap-2">
                                                <span className={`text-[10px] font-bold uppercase ${isExclusive ? 'text-blue-600' : 'text-slate-400'}`}>Venta Exclusiva</span>
                                                {!isPremium && <Lock size={10} className="text-slate-400" />}
                                            </div>
                                            <button
                                                type="button"
                                                disabled={!isPremium}
                                                onClick={() => setIsExclusive(!isExclusive)}
                                                className={`w-8 h-4 rounded-full relative transition-colors ${isExclusive ? 'bg-blue-600' : 'bg-slate-300'}`}
                                            >
                                                <div className={`w-3 h-3 bg-white rounded-full absolute top-0.5 transition-all ${isExclusive ? 'left-4.5' : 'left-0.5'}`} />
                                            </button>
                                        </div>
                                        {isExclusive && (
                                            <input
                                                type="number"
                                                value={exclusivePrice}
                                                onChange={(e) => setExclusivePrice(e.target.value)}
                                                className="w-full bg-white border border-blue-200 rounded-lg px-3 py-2 text-xs font-bold text-blue-900 placeholder-blue-300 outline-none"
                                                placeholder="Precio Exclusivo (MXN)"
                                            />
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
