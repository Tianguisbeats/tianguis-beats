"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronRight, Hash, Lock, Star, Sparkles, Zap
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
    { label: "Tropical", emoji: "🌴" },
    { label: "Eufórico", emoji: "🎢" },
    { label: "Frío", emoji: "🧊" },
    { label: "Futurista", emoji: "🧬" }
];

const GENRES = ["Trap", "Reggaeton", "Hip Hop", "Corridos Tumbados", "R&B", "Drill", "Pop", "Lo-fi", "Afrobeats"];
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
            setError("Has alcanzado el límite de 5 beats para el plan gratuito. Sube de plan para publicar ilimitadamente.");
            return;
        }

        if (!title || !genre || !bpm || !musicalKey || !previewFile || !hqMp3File || !coverFile) {
            setError("Por favor completa todos los campos requeridos y sube los archivos necesarios.");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const userId = userData.id;
            const timestamp = Date.now();

            // 1. Upload Cover
            const coverPath = `${userId}/${timestamp}-cover-${coverFile.name}`;
            await supabase.storage.from('beats-previews').upload(coverPath, coverFile);
            const { data: { publicUrl: coverUrl } } = supabase.storage.from('beats-previews').getPublicUrl(coverPath);

            // 2. Upload Preview MP3
            const previewPath = `${userId}/${timestamp}-preview-${previewFile.name}`;
            await supabase.storage.from('beats-previews').upload(previewPath, previewFile);
            const { data: { publicUrl: previewUrl } } = supabase.storage.from('beats-previews').getPublicUrl(previewPath);

            // 3. Upload HQ MP3
            const hqPath = `${userId}/${timestamp}-hq-${hqMp3File.name}`;
            await supabase.storage.from('beats-raw').upload(hqPath, hqMp3File);

            // 4. Upload WAV (Optional)
            let wavPath = null;
            if (wavFile && (userData.subscription_tier !== 'free')) {
                wavPath = `${userId}/${timestamp}-wav-${wavFile.name}`;
                await supabase.storage.from('beats-raw').upload(wavPath, wavFile);
            }

            // 5. Upload Stems (Optional)
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
            setTimeout(() => router.push(`/${userData.username}`), 2000);

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

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-5xl mx-auto px-4 mt-8">
                    {/* Header Banner for Free Users */}
                    {isFree && (
                        <div className="bg-slate-900 rounded-[2.5rem] p-8 mb-12 text-white flex items-center justify-between shadow-2xl shadow-blue-600/10 px-12 relative overflow-hidden group">
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-blue-600 rounded-xl flex items-center justify-center text-white">
                                        <Zap size={16} fill="currentColor" />
                                    </div>
                                    <p className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400">Estatus del Productor</p>
                                </div>
                                <h3 className="text-3xl font-black uppercase tracking-tight">Te quedan <span className="text-blue-500 underline underline-offset-8 decoration-4">{5 - beatCount}</span> Beats gratis</h3>
                                <p className="text-slate-400 text-sm font-medium mt-4">Sube de plan para subir beats ilimitados y vender licencias WAV.</p>
                            </div>
                            <button onClick={() => router.push('/pricing')} className="relative z-10 bg-blue-600 text-white px-8 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-white hover:text-blue-600 transition-all shadow-xl active:scale-95">
                                Desbloquear Todo →
                            </button>
                            {/* Aesthetic BG Grid */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none bg-[radial-gradient(#2563eb_1px,transparent_1px)] [background-size:20px_20px]" />
                        </div>
                    )}

                    <div className="bg-white rounded-[4rem] p-10 md:p-20 border border-slate-200 shadow-sm relative overflow-hidden">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-16 pb-12 border-b border-slate-100">
                            <div className="w-24 h-24 bg-blue-50 rounded-[2rem] flex items-center justify-center text-blue-600 shadow-inner">
                                <Music size={42} />
                            </div>
                            <div className="text-center md:text-left">
                                <h1 className="text-5xl font-black uppercase tracking-tighter text-slate-900 leading-none mb-4">Nueva <span className="text-blue-600">Obra Maestra</span></h1>
                                <p className="text-slate-400 font-bold uppercase tracking-[0.3em] text-[10px]">Configura tu lanzamiento en el Tianguis</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-100 p-8 rounded-[2.5rem] mb-12 flex items-center gap-6 text-red-600 animate-shake">
                                <AlertCircle size={32} />
                                <p className="font-black text-sm uppercase tracking-tight">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border-2 border-green-100 p-8 rounded-[2.5rem] mb-12 flex items-center gap-6 text-green-600">
                                <CheckCircle2 size={32} />
                                <p className="font-black text-sm uppercase tracking-tight">¡Beat publicado con éxito! Redirigiendo a tu perfil...</p>
                            </div>
                        )}

                        <form onSubmit={handleFileUpload} className="space-y-20">
                            {/* Información Básica */}
                            <section>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                        <Hash size={16} />
                                    </div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic">Identidad del Beat</h2>
                                </div>
                                <div className="grid md:grid-cols-2 gap-10">
                                    <div className="space-y-4">
                                        <label className="label-style">Título Artístico</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="input-style"
                                            placeholder="Ej: SANGRE FRÍA"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-4">
                                        <label className="label-style">Precio Estándar (Licencia de Uso)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={standardPrice}
                                                onChange={(e) => setStandardPrice(e.target.value)}
                                                className="input-style"
                                                placeholder="199"
                                                required
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded">MXN</div>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="label-style">Género del Tianguis</label>
                                        <select
                                            value={genre}
                                            onChange={(e) => setGenre(e.target.value)}
                                            className="input-style appearance-none"
                                            required
                                        >
                                            <option value="">Selección de Género</option>
                                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-4">
                                        <label className="label-style">Tempo (BPM)</label>
                                        <div className="relative">
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                className="input-style"
                                                placeholder="140"
                                                required
                                            />
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-slate-900 text-white text-[8px] font-black px-2 py-1 rounded">BPM</div>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-4">
                                            <label className="label-style">Nota</label>
                                            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="input-style" required>
                                                <option value="">Esc.</option>
                                                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-4">
                                            <label className="label-style">Modo</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="input-style">
                                                <option value="Menor">Menor</option>
                                                <option value="Mayor">Mayor</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Vibe Selection */}
                            <section>
                                <div className="flex items-center justify-between mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                            <Star size={16} />
                                        </div>
                                        <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic">Vibe & Mood</h2>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] font-black uppercase tracking-widest ${selectedMoods.length === 3 ? 'text-blue-600' : 'text-slate-300'}`}>
                                            {selectedMoods.length}/3 Seleccionados
                                        </span>
                                    </div>
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    {MOODS.map(mood => {
                                        const isSelected = selectedMoods.includes(mood.label);
                                        return (
                                            <button
                                                key={mood.label}
                                                type="button"
                                                onClick={() => handleMoodToggle(mood.label)}
                                                className={`px-6 py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all transform active:scale-95 ${isSelected ? 'bg-blue-600 text-white shadow-2xl shadow-blue-600/30 ring-4 ring-blue-50' : 'bg-slate-50 text-slate-500 hover:bg-white hover:shadow-xl border border-transparent hover:border-slate-100'
                                                    }`}
                                            >
                                                <span className="text-lg">{mood.emoji}</span>
                                                {mood.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Exclusive Sales Section */}
                            <section className="bg-slate-50 p-10 rounded-[3rem] border-2 border-slate-100 group">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white ${isPremium ? 'bg-blue-600' : 'bg-slate-300'}`}>
                                            <Sparkles size={24} fill="currentColor" />
                                        </div>
                                        <div>
                                            <h3 className="text-xl font-black uppercase tracking-tight text-slate-900">Venta Exclusiva</h3>
                                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mt-1">¿Deseas vender este beat por completo?</p>
                                        </div>
                                    </div>

                                    <div className="flex flex-col items-end gap-2">
                                        <button
                                            type="button"
                                            disabled={!isPremium}
                                            onClick={() => setIsExclusive(!isExclusive)}
                                            className={`relative w-20 h-10 rounded-full transition-all flex items-center p-1 ${!isPremium ? 'bg-slate-200 cursor-not-allowed' : (isExclusive ? 'bg-blue-600' : 'bg-slate-300')
                                                }`}
                                        >
                                            <div className={`w-8 h-8 bg-white rounded-full shadow-lg transition-transform ${isExclusive && isPremium ? 'translate-x-10' : 'translate-x-0'} flex items-center justify-center`}>
                                                {isExclusive && isPremium ? <CheckCircle2 size={16} className="text-blue-600" /> : <Lock size={16} className={`${!isPremium ? 'text-slate-400' : 'text-slate-300'}`} />}
                                            </div>
                                        </button>
                                        {!isPremium && (
                                            <button onClick={() => router.push('/pricing')} className="text-[9px] font-black text-blue-600 hover:underline uppercase tracking-widest animate-pulse">
                                                ★ Función PREMIUM
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div className="mt-6 pt-6 border-t border-slate-200">
                                    <p className="text-slate-500 text-xs font-medium leading-relaxed mb-6">
                                        Al activar la **Venta Exclusiva**, el beat se retirará automáticamente del mercado tras la primera compra. El comprador adquiere el 100% de los derechos. <span className="font-bold text-slate-900 italic">(Solo disponible para el plan que factura en grande)</span>.
                                    </p>

                                    {isExclusive && isPremium && (
                                        <div className="animate-in slide-in-from-top-4 duration-500">
                                            <label className="label-style mb-3">Precio de Venta Exclusiva (MXN)</label>
                                            <div className="relative max-w-xs">
                                                <input
                                                    type="number"
                                                    value={exclusivePrice}
                                                    onChange={(e) => setExclusivePrice(e.target.value)}
                                                    className="input-style border-blue-600 bg-blue-50/20"
                                                    placeholder="Ej: 3000"
                                                    required
                                                />
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded uppercase tracking-widest">Exclusivo</div>
                                            </div>
                                            <p className="mt-2 text-[10px] text-blue-600 font-bold uppercase tracking-widest">Recomendado: $3,000 - $5,000</p>
                                        </div>
                                    )}
                                </div>
                            </section>

                            {/* Archivos */}
                            <section className="space-y-12">
                                <div className="flex items-center gap-4">
                                    <div className="w-8 h-8 bg-slate-900 rounded-xl flex items-center justify-center text-white">
                                        <Upload size={16} />
                                    </div>
                                    <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400 italic">Laboratorio de Archivos</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-12">
                                    {/* Cover Art */}
                                    <div className="space-y-6">
                                        <div className="flex justify-between items-end">
                                            <label className="label-style">Artwork Digital</label>
                                            <span className="text-[9px] font-bold text-slate-300 uppercase italic">3000x3000px JPG</span>
                                        </div>
                                        <div className="relative group">
                                            <input type="file" accept="image/jpeg,image/png" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" id="cover-upload" />
                                            <label htmlFor="cover-upload" className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[3rem] p-16 cursor-pointer hover:border-blue-600 hover:bg-blue-50/20 transition-all group/label">
                                                {coverFile ? (
                                                    <div className="text-center">
                                                        <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center text-green-500 mx-auto mb-4">
                                                            <CheckCircle2 size={40} />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase text-slate-900 truncate max-w-[200px]">{coverFile.name}</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <div className="w-20 h-20 bg-slate-50 rounded-3xl flex items-center justify-center text-slate-300 group-hover/label:bg-blue-600 group-hover/label:text-white transition-all mb-4">
                                                            <ImageIcon size={40} />
                                                        </div>
                                                        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Insertar Diseño</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Archivos de Audio */}
                                    <div className="space-y-8 flex flex-col justify-center">
                                        <div className="space-y-3">
                                            <label className="label-style">1. Preview con Tag (.mp3)</label>
                                            <div className="relative">
                                                <input type="file" accept=".mp3" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} className="file-input-style" />
                                                {previewFile && <CheckCircle2 size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-green-500" />}
                                            </div>
                                        </div>

                                        <div className="space-y-3">
                                            <label className="label-style">2. Master HQ (.mp3)</label>
                                            <input type="file" accept=".mp3" onChange={(e) => setHqMp3File(e.target.files?.[0] || null)} className="file-input-style" />
                                        </div>

                                        <div className={`space-y-3 relative group ${isFree ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <label className="label-style flex items-center gap-2">
                                                    3. Master WAV (.wav)
                                                    {isFree && <Lock size={12} className="text-slate-400" />}
                                                </label>
                                                {isFree && (
                                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">PRO Only</span>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept=".wav"
                                                disabled={isFree}
                                                onChange={(e) => setWavFile(e.target.files?.[0] || null)}
                                                className={`file-input-style ${isFree ? 'bg-slate-100 border-dashed pointer-events-none' : ''}`}
                                            />
                                            {isFree && (
                                                <div onClick={() => router.push('/pricing')} className="absolute inset-0 cursor-pointer pointer-events-auto" title="Click para actualizar plan" />
                                            )}
                                        </div>

                                        <div className={`space-y-3 relative group ${!isPremium ? 'opacity-60 cursor-not-allowed' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <label className="label-style flex items-center gap-2">
                                                    4. Stems / Trackouts (.zip)
                                                    {!isPremium && <Lock size={12} className="text-slate-400" />}
                                                </label>
                                                {!isPremium && (
                                                    <span className="text-[8px] font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity">PREMIUM Only</span>
                                                )}
                                            </div>
                                            <input
                                                type="file"
                                                accept=".zip,.rar"
                                                disabled={!isPremium}
                                                onChange={(e) => setStemsFile(e.target.files?.[0] || null)}
                                                className={`file-input-style ${!isPremium ? 'bg-slate-100 border-dashed pointer-events-none' : ''}`}
                                            />
                                            {!isPremium && (
                                                <div onClick={() => router.push('/pricing')} className="absolute inset-0 cursor-pointer pointer-events-auto" title="Click para actualizar plan" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-10 bg-blue-600 text-white rounded-[3rem] font-black uppercase tracking-[0.5em] text-xs shadow-[0_30px_60px_-15px_rgba(37,99,235,0.4)] hover:bg-slate-900 transition-all flex items-center justify-center gap-4 transform hover:-translate-y-2 active:scale-[0.98] relative overflow-hidden group/btn"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        Inyectando Metadatos...
                                    </>
                                ) : (
                                    <>
                                        Soltar Beat en el Market
                                        <ChevronRight size={20} className="group-hover/btn:translate-x-2 transition-transform" />
                                    </>
                                )}
                                {/* Button Shine */}
                                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover/btn:translate-x-full transition-transform duration-1000" />
                            </button>
                        </form>
                    </div>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .label-style {
                    display: block;
                    font-size: 10px;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.2em;
                    color: #0f172a;
                    margin-left: 0.25rem;
                }
                .input-style {
                    width: 100%;
                    background: #f8fafc;
                    border: 3px solid #f1f5f9;
                    border-radius: 1.75rem;
                    padding: 1.5rem;
                    outline: none;
                    transition: all 0.3s;
                    font-weight: 800;
                    font-size: 0.9rem;
                    color: #0f172a;
                }
                .input-style:focus {
                    border-color: #2563eb;
                    background: white;
                    shadow: 0 15px 35px -5px rgba(37, 99, 235, 0.1);
                }
                .file-input-style {
                    width: 100%;
                    font-size: 0.75rem;
                    font-weight: 800;
                    color: #64748b;
                    background: #ffffff;
                    padding: 1rem;
                    border-radius: 1.25rem;
                    border: 2px solid #f1f5f9;
                    transition: all 0.2s;
                }
                .file-input-style:hover {
                    border-color: #e2e8f0;
                }
                .file-input-style::-webkit-file-upload-button {
                    background: #0f172a;
                    color: white;
                    border: none;
                    border-radius: 0.75rem;
                    padding: 0.6rem 1.2rem;
                    font-family: inherit;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-size: 9px;
                    margin-right: 1.25rem;
                    cursor: pointer;
                    transition: all 0.2s;
                }
                .file-input-style::-webkit-file-upload-button:hover {
                    background: #2563eb;
                }
            `}</style>
        </div>
    );
}
