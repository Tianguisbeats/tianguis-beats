"use client";

import React, { useState, useRef, useEffect } from 'react';
import {
    Upload, Music, FileAudio, Layers, CheckCircle2, AlertCircle,
    Loader2, X, ChevronRight, Info, Disc, Mic2, Tag
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Profile } from '@/lib/types';

/**
 * Página de Carga de Beats: Formulario avanzado para productores.
 */
export default function UploadPage() {
    const router = useRouter();
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);
    const [profile, setProfile] = useState<Profile | null>(null);

    // Form states
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [musicalScale, setMusicalScale] = useState('Menor');
    const [price, setPrice] = useState('299');
    const [tag, setTag] = useState('Nuevo');
    const [mood, setMood] = useState('');
    const [refArtist, setRefArtist] = useState('');
    const [description, setDescription] = useState('');
    const [isExclusive, setIsExclusive] = useState(false);

    // File states
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [mp3TagFile, setMp3TagFile] = useState<File | null>(null);
    const [mp3File, setMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

    // Previews
    const [coverPreview, setCoverPreview] = useState<string | null>(null);

    const genres = ["Trap", "Reggaeton", "Corridos Tumbados", "Hip Hop", "R&B", "Drill", "Experimental", "Pop", "Lo-fi", "Funk", "Soul", "Indie", "Afrobeats"];

    const moods = [
        { label: "Psicodélico 🌀", value: "Psicodélico" },
        { label: "Melancólico ☁️", value: "Melancólico" },
        { label: "Optimista ☀️", value: "Optimista" },
        { label: "Experimental 🧪", value: "Experimental" },
        { label: "Nostálgico 📻", value: "Nostálgico" },
        { label: "Rebelde 🎸", value: "Rebelde" },
        { label: "Somnoliento 🌙", value: "Somnoliento" },
        { label: "Espiritual ✨", value: "Espiritual" },
        { label: "Ácido 🍋", value: "Ácido" },
        { label: "Chill 🌊", value: "Chill" },
        { label: "Agresivo 😤", value: "Agresivo" },
        { label: "Oscuro 🌑", value: "Oscuro" },
        { label: "Barroco 🎻", value: "Barroco" },
        { label: "Folk 🌾", value: "Folk" },
        { label: "Sinfónico 🎺", value: "Sinfónico" }
    ];

    const musicalKeys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) {
                router.push('/login');
                return;
            }
            const { data } = await supabase.from('profiles').select('*').eq('id', user.id).single();
            setProfile(data);
        };
        fetchUser();
    }, []);

    const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                alert("La portada no debe exceder los 2MB");
                return;
            }
            setCoverFile(file);
            const reader = new FileReader();
            reader.onloadend = () => setCoverPreview(reader.result as string);
            reader.readAsDataURL(file);
        }
    };

    const handleUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mp3TagFile || !mp3File || !title || !genre) {
            setErrorMessage('Faltan campos obligatorios o archivos clave (Preview y MP3).');
            setUploadStatus('error');
            return;
        }

        setIsUploading(true);
        setUploadStatus('uploading');
        setUploadProgress(5);

        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) throw new Error('Sesión expirada.');

            const timestamp = Date.now();
            const userId = user.id;

            // 1. Upload Cover
            let coverUrl = null;
            if (coverFile) {
                const { data, error } = await supabase.storage.from('beats-previews').upload(`${userId}/${timestamp}-cover.jpg`, coverFile);
                if (error) throw error;
                coverUrl = data.path;
            }
            setUploadProgress(20);

            // 2. Upload Files
            const uploadFile = async (file: File, suffix: string, bucket: string) => {
                const path = `${userId}/${timestamp}-${suffix}`;
                const { data, error } = await supabase.storage.from(bucket).upload(path, file);
                if (error) throw error;
                return data.path;
            };

            const mp3TagPath = await uploadFile(mp3TagFile, 'preview-tag.mp3', 'beats-previews');
            setUploadProgress(40);

            const mp3Path = await uploadFile(mp3File, 'high-quality.mp3', 'beats-previews');
            setUploadProgress(60);

            let wavPath = null;
            if (wavFile && profile?.subscription_tier !== 'free') {
                wavPath = await uploadFile(wavFile, 'premium.wav', 'beats-raw');
            }

            let stemsPath = null;
            if (stemsFile && profile?.subscription_tier !== 'free') {
                stemsPath = await uploadFile(stemsFile, 'stems.zip', 'beats-raw');
            }
            setUploadProgress(80);

            // 3. Database Entry
            const { error: dbError } = await supabase.from('beats').insert({
                producer_id: userId,
                title,
                genre,
                bpm: parseInt(bpm),
                musical_key: musicalKey,
                musical_scale: musicalScale,
                description,
                price_mxn: parseFloat(price),
                cover_url: coverUrl,
                mp3_tag_url: mp3TagPath,
                mp3_url: mp3Path,
                wav_url: wavPath,
                stems_url: stemsPath,
                tag,
                mood,
                reference_artist: refArtist,
                is_exclusive: isExclusive,
                tier_visibility: profile?.subscription_tier === 'premium' ? 2 : (profile?.subscription_tier === 'pro' ? 1 : 0)
            });

            if (dbError) throw dbError;

            setUploadStatus('success');
            setUploadProgress(100);
            setTimeout(() => router.push('/beats'), 2000);

        } catch (err: any) {
            setErrorMessage(err.message || 'Error en la subida');
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    const isFree = profile?.subscription_tier === 'free';

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-4xl mx-auto px-4">
                    <div className="mb-10 text-center">
                        <h1 className="text-4xl font-black tracking-tighter uppercase mb-3">Publicar Nuevo <span className="text-blue-600">Beat</span></h1>
                        <p className="text-slate-500 font-medium tracking-tight">Comparte tu música con el mundo y empieza a generar ventas.</p>
                    </div>

                    <form onSubmit={handleUpload} className="grid gap-8">
                        {/* SECCIÓN 1: IDENTIDAD VISUAL */}
                        <div className="bg-white rounded-[2.5rem] p-8 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-center border-l-8 border-l-blue-600">
                            <div className="relative group w-48 h-48 bg-slate-100 rounded-3xl overflow-hidden border-2 border-dashed border-slate-300 flex items-center justify-center">
                                {coverPreview ? (
                                    <img src={coverPreview} className="w-full h-full object-cover" alt="Preview" />
                                ) : (
                                    <Disc className="text-slate-300 w-16 h-16 animate-pulse" />
                                )}
                                <label className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer">
                                    <Upload className="text-white" />
                                    <input type="file" className="hidden" accept="image/*" onChange={handleCoverChange} />
                                </label>
                            </div>
                            <div className="flex-1 space-y-4">
                                <h2 className="text-2xl font-black uppercase tracking-tight">Arte de Portada</h2>
                                <p className="text-sm text-slate-500 font-medium">Sube una imagen cuadrada de alta calidad (JPG/PNG). Recomendamos 1500x1500px, máx 2MB.</p>
                                <div className="p-3 bg-blue-50 text-blue-700 rounded-xl text-[10px] font-bold uppercase tracking-widest flex items-center gap-2">
                                    <Info size={14} /> Un buen arte aumenta las ventas en un 40%.
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 2: INFORMACIÓN TÉCNICA */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm space-y-8">
                            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Music className="text-blue-600" /> Detalles de la Obra
                            </h2>

                            <div className="grid md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Título del Beat</label>
                                    <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ej. Sky High" className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Género Principal</label>
                                    <select value={genre} onChange={(e) => setGenre(e.target.value)} className="input-field" required>
                                        <option value="">Seleccionar...</option>
                                        {genres.map(g => <option key={g} value={g}>{g}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">BPM</label>
                                    <input type="number" value={bpm} onChange={(e) => setBpm(e.target.value)} placeholder="Ej. 140" className="input-field" required />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Vibe / Mood</label>
                                    <select value={mood} onChange={(e) => setMood(e.target.value)} className="input-field" required>
                                        <option value="">Seleccionar...</option>
                                        {moods.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
                                    </select>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-6 p-6 bg-slate-50 rounded-3xl">
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Tonalidad (Key)</label>
                                    <div className="flex gap-2">
                                        <select value={musicalKey} onChange={(e) => setMusicalKey(e.target.value)} className="input-field flex-1" required>
                                            <option value="">Nota...</option>
                                            {musicalKeys.map(k => <option key={k} value={k}>{k}</option>)}
                                        </select>
                                        <select value={musicalScale} onChange={(e) => setMusicalScale(e.target.value)} className="input-field flex-1" required>
                                            <option value="Menor">Menor (m)</option>
                                            <option value="Mayor">Mayor (Maj)</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Artista de Referencia</label>
                                    <input type="text" value={refArtist} onChange={(e) => setRefArtist(e.target.value)} placeholder="Ej. Travis Scott" className="input-field" />
                                </div>
                            </div>
                        </div>

                        {/* SECCIÓN 3: ARCHIVOS Y DISTRIBUCIÓN */}
                        <div className="bg-white rounded-[2.5rem] p-8 md:p-10 border border-slate-200 shadow-sm space-y-8">
                            <h2 className="text-xl font-black uppercase tracking-tight flex items-center gap-3">
                                <Layers className="text-blue-600" /> Archivos de Entrega
                            </h2>

                            <div className="grid gap-4">
                                {/* ITEM: PREVIEW CON TAG */}
                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100 hover:border-blue-600 transition-all group">
                                    <div className="p-4 bg-white rounded-xl text-blue-600 shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                        <Tag size={20} />
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Obligatorio</p>
                                        <p className="text-sm font-black text-slate-900">Audio Preview con Tag (MP3)</p>
                                    </div>
                                    <label className="cursor-pointer">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${mp3TagFile ? 'bg-green-100 text-green-600' : 'bg-blue-600 text-white shadow-lg'}`}>
                                            {mp3TagFile ? '✓ Cargado' : 'Subir'}
                                        </span>
                                        <input type="file" className="hidden" accept=".mp3" onChange={(e) => setMp3TagFile(e.target.files?.[0] || null)} />
                                    </label>
                                </div>

                                {/* ITEM: MP3 ALTA CALIDAD */}
                                <div className="flex items-center gap-4 p-5 bg-slate-50 rounded-2xl border-2 border-slate-100">
                                    <div className="p-4 bg-white rounded-xl text-slate-400"><FileAudio size={20} /></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Licencia Básica</p>
                                        <p className="text-sm font-black text-slate-900">Master Final (MP3 320kbps)</p>
                                    </div>
                                    <label className="cursor-pointer">
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${mp3File ? 'bg-green-100 text-green-600' : 'bg-slate-900 text-white'}`}>
                                            {mp3File ? '✓ Cargado' : 'Subir'}
                                        </span>
                                        <input type="file" className="hidden" accept=".mp3" onChange={(e) => setMp3File(e.target.files?.[0] || null)} />
                                    </label>
                                </div>

                                {/* ITEM: WAV PREMIUM */}
                                <div className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${isFree ? 'opacity-40 bg-slate-100 grayscale cursor-not-allowed shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="p-4 bg-white rounded-xl text-slate-400"><Disc size={20} /></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Licencia Pro/Premium</p>
                                        <p className="text-sm font-black text-slate-900">Audio Sin Pérdida (WAV)</p>
                                    </div>
                                    <label className={`cursor-pointer ${isFree ? 'pointer-events-none' : ''}`}>
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${wavFile ? 'bg-green-100 text-green-600' : 'bg-slate-900 text-white'}`}>
                                            {wavFile ? '✓ Cargado' : isFree ? 'Bloqueado' : 'Subir'}
                                        </span>
                                        <input type="file" className="hidden" accept=".wav" onChange={(e) => setWavFile(e.target.files?.[0] || null)} disabled={isFree} />
                                    </label>
                                </div>

                                {/* ITEM: STEMS */}
                                <div className={`flex items-center gap-4 p-5 rounded-2xl border-2 transition-all ${isFree ? 'opacity-40 bg-slate-100 grayscale cursor-not-allowed shadow-inner' : 'bg-slate-50 border-slate-100'}`}>
                                    <div className="p-4 bg-white rounded-xl text-slate-400"><Layers size={20} /></div>
                                    <div className="flex-1">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Licencia Exclusiva</p>
                                        <p className="text-sm font-black text-slate-900">Trackouts Separados (ZIP)</p>
                                    </div>
                                    <label className={`cursor-pointer ${isFree ? 'pointer-events-none' : ''}`}>
                                        <span className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest ${stemsFile ? 'bg-green-100 text-green-600' : 'bg-slate-900 text-white'}`}>
                                            {stemsFile ? '✓ Cargado' : isFree ? 'Bloqueado' : 'Subir'}
                                        </span>
                                        <input type="file" className="hidden" accept=".zip,.rar" onChange={(e) => setStemsFile(e.target.files?.[0] || null)} disabled={isFree} />
                                    </label>
                                </div>
                            </div>
                        </div>

                        {/* BOTÓN FINAL */}
                        {uploadStatus === 'error' && (
                            <div className="p-4 bg-red-50 text-red-600 rounded-2xl flex items-center gap-3 text-xs font-bold border border-red-100">
                                <AlertCircle size={20} /> {errorMessage}
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={isUploading}
                            className={`w-full py-6 rounded-3xl font-black uppercase tracking-[0.3em] text-sm transition-all shadow-2xl transform active:scale-95 flex items-center justify-center gap-4 ${isUploading ? 'bg-slate-200 text-slate-400' : 'bg-blue-600 text-white hover:bg-slate-900 hover:scale-[1.02] shadow-blue-600/20'}`}
                        >
                            {isUploading ? (
                                <>
                                    <Loader2 className="animate-spin" size={24} /> Subiendo Beat {uploadProgress}%
                                </>
                            ) : (
                                <>
                                    <CheckCircle2 size={24} /> Publicar Beat Ahora
                                </>
                            )}
                        </button>
                    </form>
                </div>
            </main>

            <Footer />

            <style jsx>{`
                .input-field {
                    width: 100%;
                    background: #f8fafc;
                    border: 2px solid #f1f5f9;
                    border-radius: 1rem;
                    padding: 1rem 1.25rem;
                    outline: none;
                    transition: all 0.2s;
                    font-weight: 700;
                    font-size: 0.875rem;
                    color: #0f172a;
                }
                .input-field:focus {
                    border-color: #2563eb;
                    background: white;
                    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.05);
                }
            `}</style>
        </div>
    );
}
