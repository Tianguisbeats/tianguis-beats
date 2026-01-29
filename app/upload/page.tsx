"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import {
    Upload, Music, Image as ImageIcon, CheckCircle2,
    AlertCircle, Loader2, Info, ChevronRight, Hash, Eye
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
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header Banner for Free Users */}
                    {isFree && (
                        <div className="bg-blue-600 rounded-[2rem] p-6 mb-10 text-white flex items-center justify-between shadow-2xl shadow-blue-600/20 px-10">
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-1">Estatus del Productor</p>
                                <h3 className="text-xl font-black uppercase tracking-tight">Te quedan <span className="underline">{5 - beatCount}</span> Beats gratis</h3>
                            </div>
                            <button onClick={() => router.push('/pricing')} className="bg-white text-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-slate-900 hover:text-white transition-all shadow-lg">
                                Subir de Plan →
                            </button>
                        </div>
                    )}

                    <div className="bg-white rounded-[3.5rem] p-8 md:p-16 border border-slate-200 shadow-sm">
                        <div className="flex items-center gap-4 mb-12">
                            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600">
                                <Music size={32} />
                            </div>
                            <div>
                                <h1 className="text-4xl font-black uppercase tracking-tighter text-slate-900 leading-none">Detalles del <span className="text-blue-600">Beat</span></h1>
                                <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] mt-2">Publicar nueva obra maestra</p>
                            </div>
                        </div>

                        {error && (
                            <div className="bg-red-50 border-2 border-red-100 p-6 rounded-3xl mb-10 flex items-center gap-4 text-red-600 animate-shake">
                                <AlertCircle size={24} />
                                <p className="font-bold text-sm tracking-tight">{error}</p>
                            </div>
                        )}

                        {success && (
                            <div className="bg-green-50 border-2 border-green-100 p-6 rounded-3xl mb-10 flex items-center gap-4 text-green-600">
                                <CheckCircle2 size={24} />
                                <p className="font-bold text-sm tracking-tight">¡Beat publicado con éxito! Redirigiendo...</p>
                            </div>
                        )}

                        <form onSubmit={handleFileUpload} className="space-y-12">
                            {/* Información Básica */}
                            <section>
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300 mb-8 flex items-center gap-3">
                                    <Hash size={16} /> Información Básica
                                </h2>
                                <div className="grid md:grid-cols-2 gap-8">
                                    <div className="space-y-3">
                                        <label className="label-style">Título del Beat</label>
                                        <input
                                            type="text"
                                            value={title}
                                            onChange={(e) => setTitle(e.target.value)}
                                            className="input-style"
                                            placeholder="Ej: Nubes"
                                            required
                                        />
                                    </div>
                                    <div className="space-y-3">
                                        <label className="label-style">Género Principal</label>
                                        <select
                                            value={genre}
                                            onChange={(e) => setGenre(e.target.value)}
                                            className="input-style appearance-none"
                                            required
                                        >
                                            <option value="">Selecciona Género</option>
                                            {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                    </div>
                                    <div className="space-y-3">
                                        <label className="label-style">BPM (Tempo)</label>
                                        <input
                                            type="number"
                                            value={bpm}
                                            onChange={(e) => setBpm(e.target.value)}
                                            className="input-style"
                                            placeholder="Ej: 140"
                                            required
                                        />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-3">
                                            <label className="label-style">Escala</label>
                                            <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="input-style" required>
                                                <option value="">Nota</option>
                                                {KEYS.map(k => <option key={k} value={k}>{k}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-3">
                                            <label className="label-style">Tipo</label>
                                            <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="input-style">
                                                <option value="Menor">Menor</option>
                                                <option value="Mayor">Mayor</option>
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* Vibe / Mood */}
                            <section>
                                <div className="flex items-center justify-between mb-8">
                                    <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300 flex items-center gap-3">
                                        <Info size={16} /> Elige el Vibe
                                    </h2>
                                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Máximo 3</span>
                                </div>
                                <div className="flex flex-wrap gap-3">
                                    {MOODS.map(mood => {
                                        const isSelected = selectedMoods.includes(mood.label);
                                        return (
                                            <button
                                                key={mood.label}
                                                type="button"
                                                onClick={() => handleMoodToggle(mood.label)}
                                                className={`px-5 py-3 rounded-2xl font-bold text-sm flex items-center gap-2 transition-all transform active:scale-95 ${isSelected ? 'bg-blue-600 text-white shadow-xl shadow-blue-600/20' : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
                                                    }`}
                                            >
                                                <span>{mood.emoji}</span>
                                                {mood.label}
                                            </button>
                                        );
                                    })}
                                </div>
                            </section>

                            {/* Archivos */}
                            <section className="space-y-10">
                                <h2 className="text-sm font-black uppercase tracking-[0.3em] text-slate-300 flex items-center gap-3">
                                    <Upload size={16} /> Carga de Archivos
                                </h2>

                                <div className="grid md:grid-cols-2 gap-8">
                                    {/* Cover Art */}
                                    <div className="space-y-4">
                                        <label className="label-style">Artwork (Cuadrada, JPG)</label>
                                        <div className="relative group">
                                            <input type="file" accept="image/jpeg,image/png" onChange={(e) => setCoverFile(e.target.files?.[0] || null)} className="hidden" id="cover-upload" />
                                            <label htmlFor="cover-upload" className="flex flex-col items-center justify-center border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 cursor-pointer hover:border-blue-400 hover:bg-blue-50/10 transition-all">
                                                {coverFile ? (
                                                    <div className="text-center">
                                                        <CheckCircle2 className="text-green-500 mx-auto mb-2" size={32} />
                                                        <p className="text-[10px] font-black uppercase text-slate-900 truncate max-w-[200px]">{coverFile.name}</p>
                                                    </div>
                                                ) : (
                                                    <>
                                                        <ImageIcon className="text-slate-300 group-hover:text-blue-500 mb-4 transition-colors" size={40} />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Seleccionar Imagen</p>
                                                    </>
                                                )}
                                            </label>
                                        </div>
                                    </div>

                                    {/* Archivos de Audio */}
                                    <div className="space-y-6">
                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="label-style">Preview con Tag (.mp3)</label>
                                                {previewFile && <span className="text-[9px] font-bold text-blue-600 truncate max-w-[150px]">{previewFile.name}</span>}
                                            </div>
                                            <input type="file" accept=".mp3" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} className="file-input-style" />
                                        </div>

                                        <div className="space-y-2">
                                            <div className="flex justify-between items-center">
                                                <label className="label-style">Master MP3 HQ (.mp3)</label>
                                                {hqMp3File && <span className="text-[9px] font-bold text-blue-600 truncate max-w-[150px]">{hqMp3File.name}</span>}
                                            </div>
                                            <input type="file" accept=".mp3" onChange={(e) => setHqMp3File(e.target.files?.[0] || null)} className="file-input-style" />
                                        </div>

                                        <div className={`space-y-2 ${isFree ? 'opacity-40 grayscale' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <label className="label-style flex items-center gap-2">Master WAV (.wav) {isFree && <Loader2 size={12} />}</label>
                                                {wavFile && <span className="text-[9px] font-bold text-blue-600 truncate max-w-[150px]">{wavFile.name}</span>}
                                            </div>
                                            <input
                                                type="file"
                                                accept=".wav"
                                                disabled={isFree}
                                                onChange={(e) => setWavFile(e.target.files?.[0] || null)}
                                                className="file-input-style"
                                            />
                                        </div>

                                        <div className={`space-y-2 ${!isPremium ? 'opacity-40 grayscale' : ''}`}>
                                            <div className="flex justify-between items-center">
                                                <label className="label-style">Stems/Trackouts (.zip/rar)</label>
                                                {stemsFile && <span className="text-[9px] font-bold text-blue-600 truncate max-w-[150px]">{stemsFile.name}</span>}
                                            </div>
                                            <input
                                                type="file"
                                                accept=".zip,.rar"
                                                disabled={!isPremium}
                                                onChange={(e) => setStemsFile(e.target.files?.[0] || null)}
                                                className="file-input-style"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </section>

                            <button
                                type="submit"
                                disabled={loading}
                                className="w-full py-8 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.4em] text-xs shadow-2xl shadow-blue-600/30 hover:bg-slate-900 transition-all flex items-center justify-center gap-4 active:scale-[0.98]"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin" size={24} />
                                        Subiendo Obra Maestra...
                                    </>
                                ) : (
                                    <>
                                        Publicar Beat en el Tianguis
                                        <ChevronRight size={20} />
                                    </>
                                )}
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
                    color: #94a3b8;
                    margin-left: 0.5rem;
                }
                .input-style {
                    width: 100%;
                    background: #f8fafc;
                    border: 2px solid #f1f5f9;
                    border-radius: 1.5rem;
                    padding: 1.25rem 1.5rem;
                    outline: none;
                    transition: all 0.2s;
                    font-weight: 700;
                    font-size: 0.875rem;
                    color: #0f172a;
                }
                .input-style:focus {
                    border-color: #2563eb;
                    background: white;
                    box-shadow: 0 10px 25px -5px rgba(37, 99, 235, 0.1);
                }
                .file-input-style {
                    width: 100%;
                    font-size: 0.75rem;
                    font-weight: 700;
                    color: #64748b;
                    background: #f8fafc;
                    padding: 0.75rem;
                    border-radius: 1rem;
                    border: 1px solid #f1f5f9;
                }
                .file-input-style::-webkit-file-upload-button {
                    background: #0f172a;
                    color: white;
                    border: none;
                    border-radius: 0.5rem;
                    padding: 0.5rem 1rem;
                    font-family: inherit;
                    font-weight: 900;
                    text-transform: uppercase;
                    letter-spacing: 0.1em;
                    font-size: 9px;
                    margin-right: 1rem;
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
