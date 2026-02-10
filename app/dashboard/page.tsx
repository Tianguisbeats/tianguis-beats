"use client";

import React, { useState, useRef } from 'react';
import {
    Upload,
    Music,
    FileAudio,
    Layers,
    CheckCircle2,
    AlertCircle,
    Loader2,
    X
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

/**
 * Panel del Productor: Interfaz para gestionar beats y subir nuevos archivos.
 * Permite la carga de archivos MP3, WAV y Stems a Supabase Storage.
 */
export default function ProducerDashboard() {
    const [isUploading, setIsUploading] = useState(false);
    const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
    const [errorMessage, setErrorMessage] = useState('');
    const [uploadProgress, setUploadProgress] = useState(0);

    // Form states
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [musicalKey, setMusicalKey] = useState('');
    const [price, setPrice] = useState('299');
    const [tag, setTag] = useState('Nuevo');
    const [mood, setMood] = useState('');
    const [refArtist, setRefArtist] = useState('');
    const [isExclusive, setIsExclusive] = useState(false);

    // File states
    const [mp3File, setMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);
    const [profile, setProfile] = useState<any>(null);

    React.useEffect(() => {
        const fetchProfile = async () => {
            try {
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { data } = await supabase
                        .from('profiles')
                        .select('id, username, artistic_name, subscription_tier')
                        .eq('id', user.id)
                        .single();
                    setProfile(data);
                }
            } catch (err) {
                console.error("Error fetching dashboard profile:", err);
            }
        };
        fetchProfile();
    }, []);

    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleFileUpload = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!mp3File || !title || !genre) {
            setErrorMessage('El título, género y el archivo MP3 son obligatorios.');
            setUploadStatus('error');
            return;
        }

        setIsUploading(true);
        setUploadStatus('uploading');
        setUploadProgress(10);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('Debes iniciar sesión para subir archivos.');

            const sanitize = (name: string) => name.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

            // 1. Subir archivos a Storage
            const timestamp = Date.now();
            const username = profile.username;
            const mp3Path = `${username}/${timestamp}-preview-${sanitize(mp3File.name)}`;

            const { error: mp3Error } = await supabase.storage
                .from('beats-muestras')
                .upload(mp3Path, mp3File);

            if (mp3Error) throw mp3Error;

            // En este dashboard simplificado, usamos el mismo MP3 para ambos campos 
            // (se asume que es el etiquetado si es publico)
            const mp3FullUrl = mp3Path;
            const mp3TagUrl = mp3Path;
            setUploadProgress(50);

            let wavUrl = null;
            let wavPath = null;
            if (wavFile) {
                wavPath = `${username}/${timestamp}-master-${sanitize(wavFile.name)}`;
                const { error: wavError } = await supabase.storage
                    .from('beats-wav')
                    .upload(wavPath, wavFile);
                if (wavError) throw wavError;
            }

            let stemsUrl = null;
            let stemsPath = null;
            if (stemsFile) {
                stemsPath = `${username}/${timestamp}-stems-${sanitize(stemsFile.name)}`;
                const { error: stemsError } = await supabase.storage
                    .from('beats-stems')
                    .upload(stemsPath, stemsFile);
                if (stemsError) throw stemsError;
            }

            setUploadProgress(80);

            // 2. Crear entrada en la base de datos
            const { error: dbError } = await supabase.from('beats').insert({
                producer_id: user.id,
                title,
                genre,
                bpm: bpm ? parseInt(bpm) : null,
                musical_key: musicalKey,
                tag: tag,
                portadabeat_url: null,
                price_mxn: parseFloat(price),
                mp3_url: mp3FullUrl,
                mp3_tag_url: mp3TagUrl,
                wav_url: wavPath,
                stems_url: stemsPath,
                mood,
                beat_types: refArtist ? refArtist.split(', ').map(s => s.trim()) : [],
                is_exclusive: isExclusive,
                tier_visibility: profile?.subscription_tier === 'premium' ? 2 : (profile?.subscription_tier === 'pro' ? 1 : 0)
            });

            if (dbError) throw dbError;

            setUploadStatus('success');
            setUploadProgress(100);

            // Reset form
            setTitle('');
            setGenre('');
            setBpm('');
            setMusicalKey('');
            setTag('Nuevo');
            setMood('');
            setRefArtist('');
            setIsExclusive(false);
            setMp3File(null);
            setWavFile(null);
            setStemsFile(null);

        } catch (err: any) {
            setErrorMessage(err.message || 'Error al subir el beat');
            setUploadStatus('error');
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 pt-24 pb-20">
                <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex flex-col md:flex-row items-center justify-between mb-12 gap-6">
                        <div>
                            <h1 className="text-4xl font-black tracking-tighter uppercase mb-2">Panel del <span className="text-blue-600">Productor</span></h1>
                            <p className="text-slate-500 font-medium tracking-tight">Gestiona tus beats y sube material nuevo.</p>
                        </div>

                        <div className="flex items-center gap-4 bg-slate-50 p-3 rounded-2xl border border-slate-100 w-full md:w-auto">
                            <div className="w-12 h-12 bg-blue-600 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg shadow-blue-600/20">
                                U
                            </div>
                            <div className="pr-4">
                                <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 leading-none mb-1">Plan Actual</p>
                                <p className="text-sm font-black text-blue-600 uppercase">Premium</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid lg:grid-cols-3 gap-8">
                        {/* Sidebar Stats */}
                        <div className="space-y-6">
                            <div className="p-8 bg-blue-600 rounded-[2.5rem] text-white shadow-2xl shadow-blue-600/20">
                                <h3 className="font-black uppercase tracking-widest text-[10px] mb-6 text-blue-100 opacity-80">Rendimiento</h3>
                                <div className="space-y-6">
                                    <div>
                                        <p className="text-4xl font-black tracking-tighter">12</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mt-1">Beats Activos</p>
                                    </div>
                                    <div>
                                        <p className="text-4xl font-black tracking-tighter">$4,250</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-100 mt-1">Ventas (MXN)</p>
                                    </div>
                                </div>
                            </div>

                            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100">
                                <h3 className="font-black uppercase tracking-tight text-sm mb-4">Límites del Plan</h3>
                                <div className="space-y-4">
                                    <div>
                                        <div className="flex justify-between text-[10px] font-black uppercase tracking-widest mb-2">
                                            <span>Almacenamiento</span>
                                            <span className="text-blue-600">Ilimitado</span>
                                        </div>
                                        <div className="h-2 bg-slate-200 rounded-full overflow-hidden">
                                            <div className="h-full bg-blue-600 w-[20%]"></div>
                                        </div>
                                    </div>
                                    <p className="text-[10px] font-bold text-slate-400 italic">Estás en el plan más completo. ¡Sigue rompiendo!</p>
                                </div>
                            </div>
                        </div>

                        {/* Main Upload Form */}
                        <div className="lg:col-span-2">
                            <form onSubmit={handleFileUpload} className="bg-white border-2 border-slate-100 rounded-[3rem] p-8 md:p-12 shadow-sm">
                                <h2 className="text-2xl font-black uppercase tracking-tight mb-8">Sube tu <span className="text-blue-600">nuevo beat</span></h2>

                                {uploadStatus === 'success' && (
                                    <div className="mb-8 p-6 bg-green-50 border border-green-100 rounded-[2rem] flex items-center gap-4 text-green-700 animate-in zoom-in duration-300">
                                        <CheckCircle2 size={32} />
                                        <div>
                                            <p className="font-black uppercase tracking-widest text-[10px]">¡Éxito!</p>
                                            <p className="font-bold">Tu beat se ha subido correctamente al Tianguis.</p>
                                        </div>
                                        <button onClick={() => setUploadStatus('idle')} className="ml-auto p-2 hover:bg-green-100 rounded-full transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}

                                {uploadStatus === 'error' && (
                                    <div className="mb-8 p-6 bg-red-50 border border-red-100 rounded-[2rem] flex items-center gap-4 text-red-600">
                                        <AlertCircle size={32} />
                                        <div>
                                            <p className="font-black uppercase tracking-widest text-[10px]">Error</p>
                                            <p className="font-bold">{errorMessage}</p>
                                        </div>
                                        <button onClick={() => setUploadStatus('idle')} className="ml-auto p-2 hover:bg-red-100 rounded-full transition-colors">
                                            <X size={20} />
                                        </button>
                                    </div>
                                )}

                                <div className="space-y-8">
                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Título del Beat</label>
                                            <input
                                                type="text"
                                                value={title}
                                                onChange={(e) => setTitle(e.target.value)}
                                                placeholder="Ej. Fuego en el Barrio"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Género Principal</label>
                                            <select
                                                value={genre}
                                                onChange={(e) => setGenre(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none"
                                            >
                                                <option value="">Selecciona un género</option>
                                                <option value="Trap">Trap</option>
                                                <option value="Reggaeton">Reggaeton</option>
                                                <option value="Corridos">Corridos</option>
                                                <option value="Hip Hop">Hip Hop</option>
                                                <option value="R&B">R&B</option>
                                                <option value="Drill">Drill</option>
                                                <option value="Experimental">Experimental</option>
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Vibe / Mood</label>
                                            <select
                                                value={mood}
                                                onChange={(e) => setMood(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none"
                                                required
                                            >
                                                <option value="">Selecciona el mood</option>
                                                <option value="Agresivo">Agresivo 😤</option>
                                                <option value="Triste">Triste 🥺</option>
                                                <option value="Feliz">Feliz 😊</option>
                                                <option value="Oscuro">Oscuro 🌑</option>
                                                <option value="Chill">Chill 🌊</option>
                                                <option value="Energético">Energético ⚡</option>
                                                <option value="Romántico">Romántico ❤️</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Artista de Referencia (Type Beat)</label>
                                            <input
                                                type="text"
                                                value={refArtist}
                                                onChange={(e) => setRefArtist(e.target.value)}
                                                placeholder="Ej. Bad Bunny, Junior H, Eladio Carrión"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">BPM</label>
                                            <input
                                                type="number"
                                                value={bpm}
                                                onChange={(e) => setBpm(e.target.value)}
                                                placeholder="Ej. 140"
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 placeholder:text-slate-300"
                                                required
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Tonalidad (Key)</label>
                                            <select
                                                value={musicalKey}
                                                onChange={(e) => setMusicalKey(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none"
                                                required
                                            >
                                                <option value="">Selecciona tonalidad</option>
                                                {['C', 'Cm', 'C#', 'C#m', 'D', 'Dm', 'D#', 'D#m', 'E', 'Em', 'F', 'Fm', 'F#', 'F#m', 'G', 'Gm', 'G#', 'G#m', 'A', 'Am', 'A#', 'A#m', 'B', 'Bm'].map(k => (
                                                    <option key={k} value={k}>{k}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid md:grid-cols-2 gap-8">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Etiqueta (Tag)</label>
                                            <select
                                                value={tag}
                                                onChange={(e) => setTag(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900 appearance-none"
                                            >
                                                <option value="Nuevo">Puesto (Nuevo)</option>
                                                <option value="Caliente">Caliente 🔥</option>
                                                <option value="Exclusivo">Exclusivo 💎</option>
                                                <option value="Oferta">Oferta 💸</option>
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-2 ml-1">Precio (MXN)</label>
                                            <input
                                                type="number"
                                                value={price}
                                                onChange={(e) => setPrice(e.target.value)}
                                                className="w-full bg-slate-50 border-2 border-slate-100 rounded-2xl px-6 py-4 outline-none focus:border-blue-600 transition-all font-bold text-slate-900"
                                            />
                                        </div>
                                    </div>

                                    {/* File Upload Section */}
                                    <div className="space-y-4">
                                        <label className="block text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-1">Archivos del Beat</label>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                            {/* MP3 */}
                                            <label className={`cursor-pointer p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${mp3File ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 hover:border-blue-400'}`}>
                                                <input type="file" accept="audio/mpeg" className="hidden" onChange={(e) => setMp3File(e.target.files?.[0] || null)} />
                                                <FileAudio size={24} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{mp3File ? mp3File.name.substring(0, 10) + '...' : 'MP3 (Directo)'}</span>
                                            </label>

                                            {/* WAV */}
                                            <label className={`cursor-pointer p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${wavFile ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 hover:border-blue-400'}`}>
                                                <input type="file" accept="audio/wav" className="hidden" onChange={(e) => setWavFile(e.target.files?.[0] || null)} />
                                                <Music size={24} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{wavFile ? wavFile.name.substring(0, 10) + '...' : 'WAV (Original)'}</span>
                                            </label>

                                            {/* Stems */}
                                            <label className={`cursor-pointer p-6 rounded-2xl border-2 border-dashed transition-all flex flex-col items-center justify-center gap-3 ${stemsFile ? 'border-blue-600 bg-blue-50 text-blue-600' : 'border-slate-100 bg-slate-50 hover:border-blue-400'}`}>
                                                <input type="file" accept=".zip,.rar" className="hidden" onChange={(e) => setStemsFile(e.target.files?.[0] || null)} />
                                                <Layers size={24} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{stemsFile ? stemsFile.name.substring(0, 10) + '...' : 'STEMS (Trackouts)'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={isUploading}
                                        className={`w-full py-6 rounded-2xl font-black uppercase tracking-[0.2em] text-xs transition-all shadow-xl transform active:scale-95 flex items-center justify-center gap-3 ${isUploading ? 'bg-slate-100 text-slate-400' : 'bg-blue-600 text-white hover:bg-blue-700 shadow-blue-600/20'}`}
                                    >
                                        {isUploading ? (
                                            <>
                                                <Loader2 className="animate-spin" size={18} />
                                                Subiendo {uploadProgress}%
                                            </>
                                        ) : (
                                            <>
                                                <Upload size={18} />
                                                Publicar en el Tianguis
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
