"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, CheckCircle2, AlertCircle, Loader2, Info, Hash,
    Lock, Zap, Crown, ShieldCheck, FileText, Layers, Sparkles,
    ArrowRight, X, Star, Image as ImageIcon, ChevronLeft, Save
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TagInput from '@/components/ui/TagInput';
import Switch from '@/components/ui/Switch';
import { GENRES, MOODS, SUBGENRES, MUSICAL_KEYS } from '@/lib/constants';
import { EXCHANGE_RATES } from '@/context/CurrencyContext';

// License tier definitions (synced with Studio licencias and Upload)
const LICENSE_META: Record<string, { label: string; color: string; hex: string; icon: React.ReactNode; planReq: string | null; desc: string }> = {
    basic: { label: 'Licencia Gratis', color: 'slate', hex: '#64748b', icon: <Music size={20} />, planReq: null, desc: 'Uso no comercial · Tag de Voz Obligatorio' },
    mp3: { label: 'Licencia Básica', color: 'emerald', hex: '#10b981', icon: <FileText size={20} />, planReq: null, desc: 'MP3 · 10K-50K Streams · 1 Video YT' },
    pro: { label: 'Licencia Pro', color: 'blue', hex: '#3b82f6', icon: <ShieldCheck size={20} />, planReq: 'pro', desc: 'WAV + MP3 · 500K Streams · Radio' },
    premium: { label: 'Licencia Premium', color: 'amber', hex: '#f59e0b', icon: <Layers size={20} />, planReq: 'premium', desc: 'STEMS · Mix Invidual · Uso Ilimitado' },
    exclusiva: { label: 'Licencia Exclusiva', color: 'rose', hex: '#f43f5e', icon: <Crown size={20} />, planReq: 'premium', desc: 'Cesión exclusiva + Permite Content ID' },
};

function FileUploadZone({ id, label, sublabel, color, hex, icon, file, existingFile, disabled, disabledLabel, accept, onChange }: any) {
    const [isDragging, setIsDragging] = useState(false);
    return (
        <div className={`relative rounded-[2rem] border transition-all duration-300 overflow-hidden group ${disabled ? 'opacity-50 grayscale cursor-not-allowed' : ''} ${file || existingFile ? 'border-opacity-60' : 'border-white/10'}`}
            style={{ borderColor: (file || existingFile) && !disabled ? `${hex}40` : undefined, background: `${hex}08` }}>
            <div className="absolute top-0 left-0 right-0 h-px transition-all"
                style={{ backgroundImage: `linear-gradient(to right, transparent, ${hex}${(file || existingFile) && !disabled ? '60' : '20'}, transparent)` }} />
            {disabled && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-white/5 backdrop-blur-[2px] rounded-[2rem]">
                    <Lock size={18} className="text-slate-400 mb-2" />
                    <Link href="/pricing" className="px-4 py-2 text-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-xl hover:scale-105 transition-transform"
                        style={{ background: hex }}>
                        {disabledLabel || 'Desbloquear'}
                    </Link>
                </div>
            )}
            <input type="file" accept={accept} disabled={disabled} onChange={onChange} className="hidden" id={id} />
            <label htmlFor={id} className={`flex flex-col p-5 cursor-pointer ${disabled ? 'pointer-events-none' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={(e) => { e.preventDefault(); setIsDragging(false); }}>
                <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-xl flex items-center justify-center"
                            style={{ background: `${hex}15`, color: hex }}>
                            {icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: hex }}>{label}</p>
                            <p className="text-[8px] font-bold text-muted uppercase tracking-widest mt-0.5">{sublabel}</p>
                        </div>
                    </div>
                    {(file || existingFile) && <CheckCircle2 size={16} className="text-emerald-500 shrink-0" />}
                </div>
                <div className={`flex items-center justify-between px-4 py-2.5 rounded-xl border transition-all ${isDragging ? 'border-dashed scale-[0.98]' : ''}`}
                    style={{ background: `${hex}08`, borderColor: `${hex}20` }}>
                    <span className="text-[9px] font-bold text-muted uppercase tracking-widest truncate max-w-[160px]">
                        {file ? file.name : existingFile ? 'Archivo cargado · click para actualizar' : 'Arrastra o click para subir'}
                    </span>
                    <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0 ml-2"
                        style={{ background: `${hex}20`, color: hex }}>
                        <Upload size={12} />
                    </div>
                </div>
            </label>
        </div>
    );
}

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
    const [tonoEscala, setTonoEscala] = useState('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [beatTypes, setBeatTypes] = useState<string[]>([]);

    // License States
    const [isBasicActive, setIsBasicActive] = useState(true);
    const [isMp3Active, setIsMp3Active] = useState(true);
    const [isProActive, setIsProActive] = useState(true);
    const [isPremiumActive, setIsPremiumActive] = useState(true);
    const [isExclusiveActive, setIsExclusiveActive] = useState(false);

    const [basicPrice, setBasicPrice] = useState('0');
    const [mp3Price, setMp3Price] = useState('349');
    const [proPrice, setProPrice] = useState('599');
    const [premiumPrice, setPremiumPrice] = useState('999');
    const [exclusivePrice, setExclusivePrice] = useState('3500');

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

    const validateFile = (file: File | null, exts: string[], label: string) => {
        if (!file) return null;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !exts.includes(ext)) { setError(`${label}: Solo se permiten: ${exts.join(', ')}`); return null; }
        return file;
    };

    useEffect(() => {
        const loadInitialData = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/login'); return; }

            const { data: profile } = await supabase.from('perfiles')
                .select('id, nombre_usuario, nombre_artistico, nivel_suscripcion')
                .eq('id', session.user.id).single();
            setUserData(profile);

            const { data: beat, error: beatError } = await supabase.from('beats')
                .select('*').eq('id', id).single();

            if (beatError || !beat) {
                setError("No se pudo cargar el beat.");
                setLoading(false);
                return;
            }

            if (beat.productor_id !== session.user.id) { router.push('/studio/beats'); return; }

            // Populate Form
            setTitle(beat.titulo || '');
            setGenre(beat.genero || '');
            setSubgenre(beat.subgenero || '');
            setBpm(beat.bpm?.toString() || '');

            const matchedKey = MUSICAL_KEYS.find(k => k.value === beat.tono_escala || k.label === beat.tono_escala);
            setTonoEscala(matchedKey ? matchedKey.value : beat.tono_escala || '');

            setSelectedMoods(beat.vibras ? beat.vibras.split(', ') : []);
            setBeatTypes(beat.artista_referencia ? beat.artista_referencia.split(', ') : (beat.tipos_beat || []));

            setBasicPrice(beat.precio_basico_mxn?.toString() || '0');
            setMp3Price(beat.precio_mp3_mxn?.toString() || '349');
            setProPrice(beat.precio_pro_mxn?.toString() || '599');
            setPremiumPrice(beat.precio_premium_mxn?.toString() || '999');
            setExclusivePrice(beat.precio_exclusiva_mxn?.toString() || beat.precio_exclusivo_mxn?.toString() || '9999');

            setIsBasicActive(beat.es_basica_activa !== false);
            setIsMp3Active(beat.es_mp3_activa !== false);
            setIsProActive(beat.es_pro_activa !== false);
            setIsPremiumActive(beat.es_premium_activa !== false);
            setIsExclusiveActive(beat.es_exclusiva_activa || false);

            setExistingPortada(beat.portada_url);
            setExistingMp3HQ(beat.archivo_mp3_url);
            setExistingWav(beat.archivo_wav_url);
            setExistingStems(beat.archivo_stems_url);
            setExistingPreview(beat.archivo_muestra_url);

            setInitialData({
                titulo: beat.titulo || '',
                genero: beat.genero || '',
                subgenero: beat.subgenero || '',
                bpm: beat.bpm?.toString() || '',
                tono_escala: matchedKey ? matchedKey.value : beat.tono_escala || '',
                vibras: beat.vibras ? beat.vibras.split(', ') : [],
                tipos_beat: beat.artista_referencia ? beat.artista_referencia.split(', ') : (beat.tipos_beat || []),
                precio_basico_mxn: beat.precio_basico_mxn?.toString() || '0',
                precio_mp3_mxn: beat.precio_mp3_mxn?.toString() || '349',
                precio_pro_mxn: beat.precio_pro_mxn?.toString() || '599',
                precio_premium_mxn: beat.precio_premium_mxn?.toString() || '999',
                precio_exclusiva_mxn: beat.precio_exclusiva_mxn?.toString() || beat.precio_exclusivo_mxn?.toString() || '9999',
                es_basica_activa: beat.es_basica_activa !== false,
                es_mp3_activa: beat.es_mp3_activa !== false,
                es_pro_activa: beat.es_pro_activa !== false,
                es_premium_activa: beat.es_premium_activa !== false,
                es_exclusiva_activa: beat.es_exclusiva_activa || false,
            });

            setLoading(false);
        };
        loadInitialData();
    }, [id, router]);

    const handleMoodToggle = (mood: string) => {
        if (selectedMoods.includes(mood)) setSelectedMoods(selectedMoods.filter(m => m !== mood));
        else if (selectedMoods.length < 3) setSelectedMoods([...selectedMoods, mood]);
    };

    const hasChanges = initialData ? (
        title !== initialData.titulo ||
        genre !== initialData.genero ||
        subgenre !== initialData.subgenero ||
        bpm !== initialData.bpm ||
        tonoEscala !== initialData.tono_escala ||
        JSON.stringify(selectedMoods.sort()) !== JSON.stringify(initialData.vibras.sort()) ||
        JSON.stringify(beatTypes.sort()) !== JSON.stringify(initialData.tipos_beat.sort()) ||
        mp3Price !== initialData.precio_mp3_mxn ||
        proPrice !== initialData.precio_pro_mxn ||
        premiumPrice !== initialData.precio_premium_mxn ||
        exclusivePrice !== initialData.precio_exclusiva_mxn ||
        isBasicActive !== initialData.es_basica_activa ||
        isMp3Active !== initialData.es_mp3_activa ||
        isProActive !== initialData.es_pro_activa ||
        isPremiumActive !== initialData.es_premium_activa ||
        isExclusiveActive !== initialData.es_exclusiva_activa ||
        coverFile !== null ||
        previewFile !== null ||
        hqMp3File !== null ||
        wavFile !== null ||
        stemsFile !== null
    ) : false;

    const handleUpdate = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasChanges) { router.push('/studio/beats'); return; }

        const missing = [];
        if (!title) missing.push("Título");
        if (!genre) missing.push("Género");
        if (!bpm) missing.push("BPM");
        if (!tonoEscala) missing.push("Tono/Escala");
        if (missing.length > 0) { setError(`Campos requeridos: ${missing.join(", ")}`); return; }
        if (selectedMoods.length !== 3) { setError("Selecciona exactamente 3 Mood Tags."); return; }
        if (beatTypes.length < 1) { setError("Agrega al menos 1 artista de referencia."); return; }

        setSaving(true); setError(null);
        try {
            const san = (n: string) => n.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const un = userData.nombre_usuario;

            let portada_url = existingPortada;
            if (coverFile) {
                const p = `${un}/${san(coverFile.name)}`;
                await supabase.storage.from('portadas_beats').upload(p, coverFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(p);
                portada_url = publicUrl;
            }

            let previewPath = existingPreview;
            if (previewFile) {
                const path = `${un}/${san(previewFile.name)}`;
                await supabase.storage.from('muestras_beats').upload(path, previewFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('muestras_beats').getPublicUrl(path);
                previewPath = publicUrl;
            }

            let hqPath = existingMp3HQ;
            if (hqMp3File) {
                const path = `${un}/${san(hqMp3File.name)}`;
                await supabase.storage.from('beats_mp3').upload(path, hqMp3File, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('beats_mp3').getPublicUrl(path);
                hqPath = publicUrl;
            }

            let wavPath = existingWav;
            if (wavFile && userData.nivel_suscripcion !== 'free') {
                const path = `${un}/${san(wavFile.name)}`;
                await supabase.storage.from('beats_wav').upload(path, wavFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('beats_wav').getPublicUrl(path);
                wavPath = publicUrl;
            }

            let stemsPath = existingStems;
            if (stemsFile && userData.nivel_suscripcion === 'premium') {
                const path = `${un}/${san(stemsFile.name)}`;
                await supabase.storage.from('beats_stems').upload(path, stemsFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('beats_stems').getPublicUrl(path);
                stemsPath = publicUrl;
            }

            const { error: dbError } = await supabase.from('beats').update({
                titulo: title, genero: genre, subgenero: subgenre,
                bpm: parseInt(bpm), tono_escala: tonoEscala,
                vibras: selectedMoods.join(', '), artista_referencia: beatTypes.join(', '),
                portada_url, archivo_mp3_url: hqPath,
                archivo_muestra_url: previewPath,
                archivo_wav_url: wavPath, archivo_stems_url: stemsPath,
                es_basica_activa: isBasicActive, es_mp3_activa: isMp3Active,
                es_pro_activa: isProActive, es_premium_activa: isPremiumActive,
                es_exclusiva_activa: isExclusiveActive,
                precio_basico_mxn: 0,
                precio_mp3_mxn: parseInt(mp3Price) || 0,
                precio_pro_mxn: parseInt(proPrice) || 0,
                precio_premium_mxn: parseInt(premiumPrice) || 0,
                precio_exclusiva_mxn: parseInt(exclusivePrice) || 0,
            }).eq('id', id);

            if (dbError) throw dbError;
            setSuccess(true);
            setTimeout(() => router.push('/studio/beats'), 1500);
        } catch (err: any) { setError(err.message || "Error al actualizar"); }
        finally { setSaving(false); }
    };

    const PricePreview = ({ price }: { price: string }) => {
        const amt = parseInt(price) || 0;
        if (amt <= 0) return null;
        return (
            <div className="flex gap-3 mt-1 px-1">
                <span className="text-[9px] font-black text-blue-400/70 uppercase">≈ ${(amt * EXCHANGE_RATES.USD).toFixed(2)} USD</span>
                <span className="text-[9px] font-black text-purple-400/70 uppercase">≈ €{(amt * EXCHANGE_RATES.EUR).toFixed(2)} EUR</span>
            </div>
        );
    };

    if (loading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
    );

    const isFree = userData?.nivel_suscripcion?.trim().toLowerCase() === 'free';
    const isPro = userData?.nivel_suscripcion?.trim().toLowerCase() === 'pro';
    const isPremium = userData?.nivel_suscripcion?.trim().toLowerCase() === 'premium';
    const planLabel = isPremium ? 'Premium' : isPro ? 'Pro' : 'Free';

    const licenseRows = [
        { key: 'basic', active: isBasicActive, setActive: setIsBasicActive, price: '0', setPrice: setBasicPrice, locked: false, lockPrice: true },
        { key: 'mp3', active: isMp3Active, setActive: setIsMp3Active, price: mp3Price, setPrice: setMp3Price, locked: false },
        { key: 'pro', active: isProActive, setActive: setIsProActive, price: proPrice, setPrice: setProPrice, locked: isFree },
        { key: 'premium', active: isPremiumActive, setActive: setIsPremiumActive, price: premiumPrice, setPrice: setPremiumPrice, locked: isFree },
        { key: 'exclusiva', active: isExclusiveActive, setActive: setIsExclusiveActive, price: exclusivePrice, setPrice: setExclusivePrice, locked: !isPremium },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <Navbar />
            {/* BG glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/[0.04] dark:bg-blue-600/[0.07] blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/[0.04] dark:bg-purple-600/[0.07] blur-[140px] rounded-full" />
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-amber-500/[0.03] dark:bg-amber-500/[0.05] blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-gradient-to-b from-accent/[0.02] via-transparent to-transparent" />
            </div>

            <main className="flex-1 pb-24 pt-6">
                <div className="max-w-4xl mx-auto px-4">
                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div className="flex items-center gap-5">
                            <Link href="/studio/beats" className="w-12 h-12 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-muted hover:text-accent transition-all group shadow-xl">
                                <ChevronLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
                            </Link>
                            <div>
                                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-xl border mb-4 shadow-xl" style={{ background: '#3b82f6', borderColor: '#ffffff20' }}>
                                    <Crown size={12} className="text-white fill-white" />
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-white">Modo Edición Profunda</span>
                                </div>
                                <h1 className="text-5xl font-black uppercase tracking-tighter leading-[1] mb-2">
                                    Editar <span className="text-accent underline decoration-white/10 underline-offset-8">Beat.</span>
                                </h1>
                                <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50">Actualización en tiempo real para el Tianguis</p>
                            </div>
                        </div>
                    </div>

                    {/* Error / Success */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold mb-6">
                            <AlertCircle size={16} className="shrink-0" /> {error}
                            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-6">
                            <CheckCircle2 size={24} className="shrink-0" /> ¡Cambios guardados con éxito! Redirigiendo...
                        </div>
                    )}

                    <form onSubmit={handleUpdate} className="space-y-8">
                        {/* ─── SECTION 1: Identidad del Beat ─── */}
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden transition-all shadow-sm">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                    <Star size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Identidad del Beat</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Información musical y metadatos</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Título del Beat *</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej: Dark Summer Remix"
                                            className="w-full bg-foreground/5 border border-border rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-accent/50 focus:bg-foreground/[0.08] transition-all text-foreground" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Género *</label>
                                            <select value={genre} onChange={e => { setGenre(e.target.value); setSubgenre(''); }} required
                                                className="w-full bg-foreground/5 border border-border rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none text-foreground">
                                                <option value="">Seleccionar</option>
                                                {GENRES.map(g => <option key={g} value={g} className="bg-[#020205]">{g}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Subgénero</label>
                                            <select value={subgenre} onChange={e => setSubgenre(e.target.value)} disabled={!genre || !SUBGENRES[genre]}
                                                className="w-full bg-foreground/5 border border-border rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none disabled:opacity-40 text-foreground">
                                                <option value="">{genre ? 'Ninguno' : 'Primero selecciona género'}</option>
                                                {genre && SUBGENRES[genre]?.map(sg => <option key={sg} value={sg} className="bg-[#020205]">{sg}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">BPM *</label>
                                            <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} required placeholder="140"
                                                className="w-full bg-foreground/5 border border-border rounded-2xl px-4 py-4 text-sm font-bold outline-none focus:border-accent/50 focus:bg-foreground/[0.08] transition-all text-foreground" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Tono / Escala *</label>
                                            <select value={tonoEscala} onChange={e => setTonoEscala(e.target.value)} required
                                                className="w-full bg-foreground/5 border border-border rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none text-foreground">
                                                <option value="">Seleccionar</option>
                                                <optgroup label="NATURALES" className="bg-[#020205] text-accent">
                                                    {MUSICAL_KEYS.filter(k => k.group === 'natural').map(k => <option key={k.value} value={k.value} className="bg-[#020205]">{k.label}</option>)}
                                                </optgroup>
                                                <optgroup label="ALTERADAS (PRO)" className="bg-[#020205] text-muted">
                                                    {MUSICAL_KEYS.filter(k => k.group === 'accidental').map(k => <option key={k.value} value={k.value} className="bg-[#020205]">{k.label}</option>)}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Artistas de Referencia *</label>
                                        <TagInput tags={beatTypes} setTags={setBeatTypes} placeholder="Ej: Tainy, 808 Mafia..." />
                                    </div>
                                </div>

                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Artwork (3000×3000 · JPG/PNG) *</label>
                                        <input type="file" accept=".jpg,.jpeg,.png"
                                            onChange={e => {
                                                const f = e.target.files?.[0] || null;
                                                if (f && !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) { setError("Artwork: Solo JPG/PNG"); e.target.value = ''; return; }
                                                setCoverFile(f);
                                            }} className="hidden" id="cover" />
                                        <label htmlFor="cover" className="flex items-center gap-4 p-4 bg-foreground/5 border-2 border-dashed border-border rounded-2xl cursor-pointer hover:bg-foreground/8 hover:border-accent/30 transition-all h-[120px] overflow-hidden">
                                            {(coverFile || existingPortada) ? (
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-border shrink-0 shadow-xl">
                                                        <img src={coverFile ? URL.createObjectURL(coverFile) : existingPortada!} className="w-full h-full object-cover" alt="Preview" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground truncate max-w-[160px]">{coverFile ? coverFile.name : 'Portada Actual'}</p>
                                                        <p className={`text-[9px] font-black uppercase tracking-widest mt-1 ${coverFile ? 'text-emerald-400' : 'text-accent'}`}>
                                                            {coverFile ? '✓ Reemplazo cargado' : 'Click para cambiar'}
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full text-muted">
                                                    <ImageIcon size={24} className="mb-2 opacity-30" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Seleccionar Artwork</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Mood Tags *</label>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${selectedMoods.length === 3 ? 'text-emerald-400' : 'text-accent'}`}>{selectedMoods.length}/3</span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {MOODS.map(mood => (
                                                <button key={mood.label} type="button" onClick={() => handleMoodToggle(mood.label)}
                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedMoods.includes(mood.label) ? 'bg-accent text-white shadow-lg' : 'bg-white/5 border border-white/10 text-muted hover:text-foreground'}`}>
                                                    {mood.emoji} {mood.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── SECTION 2: Archivos de Audio ─── */}
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden transition-all shadow-sm">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                                    <Upload size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Archivos de Audio</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Sube tus archivos maestros</p>
                                </div>
                            </div>
                            <div className="grid md:grid-cols-2 gap-4">
                                <FileUploadZone id="preview-file" label="MP3 con Tag (Muestra)" sublabel="Audio con marcas de voz" color="blue" hex="#3b82f6"
                                    icon={<Music size={16} />} file={previewFile} existingFile={existingPreview} disabled={false}
                                    accept=".mp3" onChange={(e: any) => setPreviewFile(validateFile(e.target.files?.[0] || null, ['mp3'], 'Muestra'))} />
                                <FileUploadZone id="hq-file" label="MP3 Master (HQ)" sublabel="320kbps sin tags" color="indigo" hex="#6366f1"
                                    icon={<Zap size={16} />} file={hqMp3File} existingFile={existingMp3HQ} disabled={false}
                                    accept=".mp3" onChange={(e: any) => setHqMp3File(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 HQ'))} />
                                <FileUploadZone id="wav-file" label="Archivo WAV" sublabel="Alta fidelidad (24-bit)" color="emerald" hex="#10b981"
                                    icon={<FileText size={16} />} file={wavFile} existingFile={existingWav} disabled={isFree} disabledLabel="Desbloquear Pro"
                                    accept=".wav" onChange={(e: any) => setWavFile(validateFile(e.target.files?.[0] || null, ['wav'], 'WAV'))} />
                                <FileUploadZone id="stems-file" label="STEMS (Trackout)" sublabel="Pistas separadas (ZIP/RAR)" color="purple" hex="#a855f7"
                                    icon={<Layers size={16} />} file={stemsFile} existingFile={existingStems} disabled={!isPremium} disabledLabel="Desbloquear Premium"
                                    accept=".zip,.rar" onChange={(e: any) => setStemsFile(validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems'))} />
                            </div>
                        </div>

                        {/* ─── SECTION 3: Licencias & Precios ─── */}
                        <div className="bg-card border border-border rounded-[2.5rem] p-8 relative overflow-hidden transition-all shadow-sm">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                            <div className="flex items-center gap-3 mb-6">
                                <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Licencias & Precios</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Configura tus tiers de precios</p>
                                </div>
                            </div>
                            <div className="space-y-3">
                                {licenseRows.map(lic => {
                                    const meta = LICENSE_META[lic.key];
                                    return (
                                        <div key={lic.key} className={`relative rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${lic.locked || !lic.active ? 'opacity-60' : ''}`}
                                            style={{ borderColor: !lic.locked && lic.active ? `${meta.hex}30` : 'var(--border)', background: !lic.locked && lic.active ? `${meta.hex}08` : 'var(--card)' }}>
                                            {lic.locked && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px]">
                                                    <Link href="/pricing" className="px-5 py-2 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest" style={{ background: meta.hex }}>
                                                        <Lock size={12} className="inline mr-2" /> Requiere {meta.planReq === 'premium' ? 'Premium' : 'Pro'}
                                                    </Link>
                                                </div>
                                            )}
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: lic.active ? `${meta.hex}20` : '#ffffff08', color: lic.active ? meta.hex : '#64748b' }}>
                                                        {meta.icon}
                                                    </div>
                                                    <div>
                                                        <h5 className="text-sm font-black uppercase tracking-tighter text-foreground">{meta.label}</h5>
                                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{meta.desc}</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border ${lic.active ? 'bg-foreground/5' : 'opacity-40'}`}>
                                                            <span className="text-[11px] font-black text-muted">$</span>
                                                            <input type="number" value={lic.price} onChange={e => lic.setPrice(e.target.value)} disabled={lic.locked || !lic.active || lic.lockPrice}
                                                                className="w-16 bg-transparent outline-none font-black text-xs text-foreground" />
                                                            <span className="text-[8px] font-black text-muted">MXN</span>
                                                        </div>
                                                        <PricePreview price={lic.price} />
                                                    </div>
                                                    <Switch active={lic.active} onChange={v => !lic.locked && lic.setActive(v)} disabled={lic.locked} activeColor="bg-accent" />
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Submit */}
                        <div className="relative overflow-hidden bg-card border border-border rounded-[2.5rem] p-8 shadow-xl">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest opacity-60 mb-1">{hasChanges ? '¡Cambios detectados!' : 'Sin cambios pendientes.'}</p>
                                    <p className="text-xl font-black uppercase tracking-tighter text-foreground">{hasChanges ? 'Actualizar Beat' : 'Volver al Studio'}</p>
                                </div>
                                <button type="submit" disabled={saving}
                                    className={`group relative overflow-hidden px-12 py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-3 ${hasChanges ? 'bg-accent text-white shadow-2xl shadow-accent/30 hover:scale-[1.02]' : 'bg-white/5 text-muted grayscale'}`}>
                                    {saving ? (
                                        <><Loader2 className="animate-spin" size={18} /><span>Guardando...</span></>
                                    ) : (
                                        <>{hasChanges ? <Save size={18} /> : <ChevronLeft size={18} />}<span>{hasChanges ? 'Aplicar Cambios' : 'Regresar'}</span></>
                                    )}
                                </button>
                            </div>
                        </div>
                    </form>
                </div>
            </main>
            <Footer />
        </div>
    );
}
