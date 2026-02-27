"use client";

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, CheckCircle2, AlertCircle, Loader2, Info, Hash,
    Lock, Zap, Crown, ShieldCheck, FileText, Layers, Sparkles,
    ArrowRight, X, Star, Image as ImageIcon
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import TagInput from '@/components/ui/TagInput';
import Switch from '@/components/ui/Switch';
import { GENRES, MOODS, SUBGENRES, MUSICAL_KEYS } from '@/lib/constants';
import { EXCHANGE_RATES } from '@/context/CurrencyContext';

// License tier definitions (synced with Studio licencias)
const LICENSE_META: Record<string, { label: string; color: string; hex: string; icon: React.ReactNode; planReq: string | null; desc: string }> = {
    basic: { label: 'Gratis', color: 'slate', hex: '#64748b', icon: <Music size={20} />, planReq: null, desc: 'MP3 con tag · Demo personal' },
    mp3: { label: 'Básica', color: 'blue', hex: '#3b82f6', icon: <FileText size={20} />, planReq: null, desc: 'MP3 HQ · Hasta 10k streams' },
    pro: { label: 'Pro', color: 'indigo', hex: '#6366f1', icon: <Zap size={20} />, planReq: 'pro', desc: 'MP3/WAV · Distribución libre' },
    premium: { label: 'Premium', color: 'emerald', hex: '#10b981', icon: <ShieldCheck size={20} />, planReq: 'pro', desc: 'WAV · 100k streams' },
    unlimited: { label: 'Ilimitada', color: 'amber', hex: '#f59e0b', icon: <Layers size={20} />, planReq: 'premium', desc: 'STEMS + WAV · Sin límites' },
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

export default function UploadPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [userData, setUserData] = useState<any>(null);
    const [beatCount, setBeatCount] = useState(0);
    const [studioLicenses, setStudioLicenses] = useState<any[]>([]);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);
    const [activeSection, setActiveSection] = useState(0);

    // Form
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [subgenre, setSubgenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [tonoEscala, setTonoEscala] = useState('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [beatTypes, setBeatTypes] = useState<string[]>([]);

    // Licencias states
    const [isBasicActive, setIsBasicActive] = useState(true);
    const [isMp3Active, setIsMp3Active] = useState(true);
    const [isProActive, setIsProActive] = useState(true);
    const [isPremiumActive, setIsPremiumActive] = useState(true);
    const [isUnlimitedActive, setIsUnlimitedActive] = useState(true);
    const [basicPrice, setBasicPrice] = useState('0');
    const [mp3Price, setMp3Price] = useState('349');
    const [proPrice, setProPrice] = useState('599');
    const [premiumPrice, setPremiumPrice] = useState('999');
    const [unlimitedPrice, setUnlimitedPrice] = useState('1999');

    // Files
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
        const init = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) { router.push('/login'); return; }

            const { data: profile } = await supabase.from('perfiles')
                .select('id, nombre_usuario, nombre_artistico, nivel_suscripcion')
                .eq('id', session.user.id).single();
            setUserData(profile);

            const { count } = await supabase.from('beats')
                .select('id', { count: 'exact', head: true }).eq('productor_id', session.user.id);
            setBeatCount(count || 0);

            // Fetch Studio configured licenses to pre-fill prices
            const { data: lics } = await supabase.from('contratos_licencia')
                .select('*').eq('productor_id', session.user.id);
            if (lics?.length) {
                setStudioLicenses(lics);
                const find = (tipo: string) => lics.find((l: any) => l.tipo_contrato === tipo);
                const basic = find('basic'); if (basic?.precio) setBasicPrice('0');
                const mp3 = find('mp3'); if (mp3?.precio) setMp3Price(mp3.precio.toString());
                const pro = find('pro'); if (pro?.precio) setProPrice(pro.precio.toString());
                const premium = find('premium'); if (premium?.precio) setPremiumPrice(premium.precio.toString());
                const unlimited = find('unlimited'); if (unlimited?.precio) setUnlimitedPrice(unlimited.precio.toString());
            }
        };
        init();
    }, [router]);

    const handleMoodToggle = (mood: string) => {
        if (selectedMoods.includes(mood)) setSelectedMoods(selectedMoods.filter(m => m !== mood));
        else if (selectedMoods.length < 3) setSelectedMoods([...selectedMoods, mood]);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;
        if (userData.nivel_suscripcion === 'free' && beatCount >= 5) { setError("Límite de 5 beats en plan Free. Actualiza tu plan."); return; }

        const missing = [];
        if (!title) missing.push("Título");
        if (!genre) missing.push("Género");
        if (!bpm) missing.push("BPM");
        if (!tonoEscala) missing.push("Tono/Escala");
        if (!previewFile) missing.push("MP3 de Muestra");
        if (!coverFile) missing.push("Portada");
        if (missing.length > 0) { setError(`Campos requeridos: ${missing.join(", ")}`); return; }
        if (selectedMoods.length !== 3) { setError("Selecciona exactamente 3 Mood Tags."); return; }
        if (beatTypes.length < 1) { setError("Agrega al menos 1 artista de referencia."); return; }

        setLoading(true); setError(null);
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("No hay sesión activa");
            const san = (n: string) => n.replace(/[^a-z0-9.]/gi, '_').toLowerCase();
            const un = userData.nombre_usuario;

            let portada_url = null;
            if (coverFile) {
                const p = `${un}/${san(coverFile.name)}`;
                await supabase.storage.from('portadas_beats').upload(p, coverFile, { upsert: true });
                const { data: { publicUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(p);
                portada_url = publicUrl;
            }
            if (!previewFile || !coverFile) throw new Error("Archivos obligatorios faltantes");
            const previewPath = `${un}/${san(previewFile.name)}`;
            await supabase.storage.from('muestras_beats').upload(previewPath, previewFile, { upsert: true });

            let hqPath = null;
            if (hqMp3File) { hqPath = `${un}/${san(hqMp3File.name)}`; await supabase.storage.from('beats_mp3').upload(hqPath, hqMp3File, { upsert: true }); }
            let wavPath = null;
            if (wavFile && userData.nivel_suscripcion !== 'free') { wavPath = `${un}/${san(wavFile.name)}`; await supabase.storage.from('beats_wav').upload(wavPath, wavFile, { upsert: true }); }
            let stemsPath = null;
            if (stemsFile && userData.nivel_suscripcion === 'premium') { stemsPath = `${un}/${san(stemsFile.name)}`; await supabase.storage.from('beats_stems').upload(stemsPath, stemsFile, { upsert: true }); }

            const { error: dbError } = await supabase.from('beats').insert({
                productor_id: user.id,
                titulo: title, genero: genre, subgenero: subgenre,
                bpm: parseInt(bpm), tono_escala: tonoEscala,
                vibras: selectedMoods.join(', '), tipos_beat: beatTypes,
                artista_referencia: beatTypes.join(', '),
                portada_url, archivo_mp3_url: hqPath,
                archivo_muestra_url: previewPath,
                archivo_wav_url: wavPath, archivo_stems_url: stemsPath,
                es_basica_activa: isBasicActive, es_mp3_activa: isMp3Active,
                es_pro_activa: isProActive, es_premium_activa: isPremiumActive,
                es_ilimitada_activa: isUnlimitedActive,
                precio_basico_mxn: 0,
                precio_mp3_mxn: parseInt(mp3Price) || 0,
                precio_pro_mxn: parseInt(proPrice) || 0,
                precio_premium_mxn: parseInt(premiumPrice) || 0,
                precio_ilimitado_mxn: parseInt(unlimitedPrice) || 0,
                es_publico: true
            });
            if (dbError) throw dbError;
            setSuccess(true);
            setTimeout(() => router.push(`/${userData.nombre_usuario}`), 1500);
        } catch (err: any) {
            setError(err.message || "Error al subir el beat");
        } finally { setLoading(false); }
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

    if (!userData) return (
        <div className="min-h-screen bg-[#020205] flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
    );

    const isFree = userData.nivel_suscripcion === 'free';
    const isPro = userData.nivel_suscripcion === 'pro';
    const isPremium = userData.nivel_suscripcion === 'premium';
    const planLabel = isPremium ? 'Premium' : isPro ? 'Pro' : 'Free';
    const planColor = isPremium ? '#00f2ff' : isPro ? '#f59e0b' : '#64748b';

    const licenseRows = [
        { key: 'basic', active: isBasicActive, setActive: setIsBasicActive, price: '0', setPrice: setBasicPrice, locked: false, lockPrice: true },
        { key: 'mp3', active: isMp3Active, setActive: setIsMp3Active, price: mp3Price, setPrice: setMp3Price, locked: false },
        { key: 'pro', active: isProActive, setActive: setIsProActive, price: proPrice, setPrice: setProPrice, locked: isFree },
        { key: 'premium', active: isPremiumActive, setActive: setIsPremiumActive, price: premiumPrice, setPrice: setPremiumPrice, locked: isFree },
        { key: 'unlimited', active: isUnlimitedActive, setActive: setIsUnlimitedActive, price: unlimitedPrice, setPrice: setUnlimitedPrice, locked: !isPremium },
    ];

    const sections = ['Identidad del Beat', 'Archivos de Audio', 'Licencias & Precios'];

    return (
        <div className="min-h-screen bg-[#020205] text-foreground font-sans flex flex-col">
            <Navbar />
            {/* BG glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-15%] left-[-10%] w-[50%] h-[50%] bg-blue-600/5 blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[45%] bg-purple-600/5 blur-[140px] rounded-full" />
                <div className="absolute top-[30%] right-[10%] w-[30%] h-[30%] bg-amber-500/4 blur-[120px] rounded-full" />
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-accent/3 via-transparent to-transparent" />
            </div>

            <main className="flex-1 pb-24 pt-6">
                <div className="max-w-4xl mx-auto px-4">

                    {/* Header */}
                    <div className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border mb-4" style={{ background: `${planColor}10`, borderColor: `${planColor}30` }}>
                                <span className="w-1.5 h-1.5 rounded-full animate-pulse" style={{ background: planColor }} />
                                <span className="text-[9px] font-black uppercase tracking-[0.2em]" style={{ color: planColor }}>Plan {planLabel} · Activo</span>
                            </div>
                            <h1 className="text-5xl font-black uppercase tracking-tighter leading-[1] mb-2">
                                Publicar<br />
                                <span className="text-accent underline decoration-white/10 underline-offset-8">Beat.</span>
                                <Sparkles className="inline ml-3 text-amber-400 fill-amber-400 w-7 h-7 mb-1" />
                            </h1>
                            <p className="text-[10px] font-black text-muted uppercase tracking-widest opacity-50">Completa los 3 pasos para lanzar tu producción</p>
                        </div>

                        {isFree && (
                            <div className="bg-white/[0.03] border border-white/10 rounded-[2rem] px-6 py-5 text-center min-w-[180px]">
                                <p className="text-[9px] font-black text-muted uppercase tracking-[0.2em] mb-3">Límite Plan Gratis</p>
                                <div className="flex items-center gap-3 justify-center">
                                    <div className="h-1.5 w-24 bg-white/10 rounded-full overflow-hidden">
                                        <div className="h-full bg-gradient-to-r from-accent to-blue-500 transition-all" style={{ width: `${(beatCount / 5) * 100}%` }} />
                                    </div>
                                    <span className="text-lg font-black text-foreground">{beatCount}/5</span>
                                </div>
                                {beatCount >= 5 && <p className="text-[9px] font-black text-rose-400 uppercase mt-2 animate-pulse">Límite alcanzado</p>}
                                <Link href="/pricing" className="mt-3 inline-flex items-center gap-1 text-[9px] font-black text-accent uppercase tracking-widest hover:underline">
                                    Upgrade <ArrowRight size={10} />
                                </Link>
                            </div>
                        )}
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2 mb-8 overflow-x-auto pb-2">
                        {sections.map((s, i) => (
                            <React.Fragment key={i}>
                                <button type="button" onClick={() => setActiveSection(i)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-full text-[9px] font-black uppercase tracking-widest transition-all shrink-0 ${activeSection === i ? 'bg-accent text-white shadow-lg shadow-accent/20' : 'bg-white/5 border border-white/10 text-muted hover:text-foreground'}`}>
                                    <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[9px] ${activeSection === i ? 'bg-white text-accent' : 'bg-white/10'}`}>{i + 1}</span>
                                    {s}
                                </button>
                                {i < sections.length - 1 && <div className="h-px flex-1 bg-white/10 min-w-[20px] shrink-0" />}
                            </React.Fragment>
                        ))}
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
                            <CheckCircle2 size={20} /> ¡Beat publicado con éxito! Redirigiendo a tu perfil...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* ─── SECTION 1: Identidad del Beat ─── */}
                        <div className={`bg-white/[0.03] border border-white/8 rounded-[2.5rem] p-8 relative overflow-hidden transition-all ${activeSection !== 0 ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-accent/10 rounded-2xl flex items-center justify-center text-accent">
                                    <Star size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Identidad del Beat</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Información musical y metadatos</p>
                                </div>
                                {activeSection === 0 && (
                                    <button type="button" onClick={() => setActiveSection(1)} className="ml-auto flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-muted uppercase tracking-widest hover:text-foreground transition-all">
                                        Siguiente <ArrowRight size={12} />
                                    </button>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                {/* Col 1 */}
                                <div className="space-y-5">
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Título del Beat *</label>
                                        <input type="text" value={title} onChange={e => setTitle(e.target.value)} required placeholder="Ej: Dark Summer Remix"
                                            className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-accent/50 focus:bg-white/8 transition-all text-foreground placeholder:text-muted/40" />
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Género *</label>
                                            <select value={genre} onChange={e => { setGenre(e.target.value); setSubgenre(''); }} required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none text-foreground">
                                                <option value="">Seleccionar</option>
                                                {GENRES.map(g => <option key={g} value={g} className="bg-[#020205]">{g}</option>)}
                                            </select>
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Subgénero</label>
                                            <select value={subgenre} onChange={e => setSubgenre(e.target.value)} disabled={!genre || !SUBGENRES[genre]}
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none disabled:opacity-40 text-foreground">
                                                <option value="">{genre ? 'Ninguno' : 'Primero selecciona género'}</option>
                                                {genre && SUBGENRES[genre]?.map(sg => <option key={sg} value={sg} className="bg-[#020205]">{sg}</option>)}
                                            </select>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">BPM *</label>
                                            <input type="number" value={bpm} onChange={e => setBpm(e.target.value)} required placeholder="140"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-sm font-bold outline-none focus:border-accent/50 transition-all text-foreground placeholder:text-muted/40" />
                                        </div>
                                        <div className="space-y-2">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Tono / Escala *</label>
                                            <select value={tonoEscala} onChange={e => setTonoEscala(e.target.value)} required
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl px-4 py-3.5 text-xs font-bold outline-none focus:border-accent/50 transition-all appearance-none text-foreground">
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
                                        <TagInput tags={beatTypes} setTags={setBeatTypes} placeholder="Ej: Tainy, 808 Mafia, Zaytoven..." />
                                    </div>
                                </div>

                                {/* Col 2 */}
                                <div className="space-y-5">
                                    {/* Cover upload */}
                                    <div className="space-y-2">
                                        <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Artwork (3000×3000 · JPG/PNG) *</label>
                                        <input type="file" accept=".jpg,.jpeg,.png"
                                            onChange={e => {
                                                const f = e.target.files?.[0] || null;
                                                if (f && !['image/jpeg', 'image/png', 'image/jpg'].includes(f.type)) { setError("Artwork: Solo JPG/PNG"); e.target.value = ''; return; }
                                                setCoverFile(f);
                                            }} className="hidden" id="cover" />
                                        <label htmlFor="cover" className="flex items-center gap-4 p-4 bg-white/5 border-2 border-dashed border-white/10 rounded-2xl cursor-pointer hover:bg-white/8 hover:border-accent/30 transition-all h-[120px] overflow-hidden">
                                            {coverFile ? (
                                                <div className="flex items-center gap-4 w-full">
                                                    <div className="w-20 h-20 rounded-2xl overflow-hidden border border-white/10 shrink-0 shadow-xl">
                                                        <img src={URL.createObjectURL(coverFile)} className="w-full h-full object-cover" alt="Preview" />
                                                    </div>
                                                    <div>
                                                        <p className="text-xs font-bold text-foreground truncate max-w-[160px]">{coverFile.name}</p>
                                                        <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest mt-1">✓ Listo para subir</p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full text-muted">
                                                    <ImageIcon size={24} className="mb-2 opacity-30" />
                                                    <span className="text-[9px] font-black uppercase tracking-widest">Click o arrastra tu artwork</span>
                                                    <span className="text-[8px] font-bold text-muted/50 uppercase mt-1">Recomendado 3000×3000px</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    {/* Moods */}
                                    <div className="space-y-3">
                                        <div className="flex items-center justify-between">
                                            <label className="text-[9px] font-black uppercase tracking-[0.25em] text-muted">Mood Tags *</label>
                                            <span className={`text-[9px] font-black uppercase tracking-widest ${selectedMoods.length === 3 ? 'text-emerald-400' : 'text-accent'}`}>
                                                {selectedMoods.length}/3 Seleccionados
                                            </span>
                                        </div>
                                        <div className="flex flex-wrap gap-2">
                                            {MOODS.map(mood => (
                                                <button key={mood.label} type="button" onClick={() => handleMoodToggle(mood.label)}
                                                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${selectedMoods.includes(mood.label)
                                                        ? 'bg-accent text-white shadow-lg shadow-accent/20 scale-105'
                                                        : 'bg-white/5 border border-white/10 text-muted hover:text-foreground hover:border-white/20'}`}>
                                                    {mood.emoji} {mood.label}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── SECTION 2: Archivos de Audio ─── */}
                        <div className={`bg-white/[0.03] border border-white/8 rounded-[2.5rem] p-8 relative overflow-hidden transition-all ${activeSection !== 1 ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent" />
                            <div className="flex items-center gap-3 mb-8">
                                <div className="w-10 h-10 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-400">
                                    <Upload size={18} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Archivos de Audio</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Sube tus archivos maestros</p>
                                </div>
                                {activeSection === 1 && (
                                    <div className="ml-auto flex gap-2">
                                        <button type="button" onClick={() => setActiveSection(0)} className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-muted uppercase tracking-widest hover:text-foreground transition-all">
                                            Atrás
                                        </button>
                                        <button type="button" onClick={() => setActiveSection(2)} className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-muted uppercase tracking-widest hover:text-foreground transition-all">
                                            Siguiente <ArrowRight size={12} />
                                        </button>
                                    </div>
                                )}
                            </div>

                            <div className="grid md:grid-cols-2 gap-4">
                                <FileUploadZone id="preview-file" label="MP3 con Tag (Muestra)" sublabel="Pre-escucha en catálogo · Obligatorio" color="blue" hex="#3b82f6"
                                    icon={<Music size={16} />} file={previewFile} existingFile={null} disabled={false}
                                    accept=".mp3" onChange={(e: any) => setPreviewFile(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Muestra'))} />

                                <FileUploadZone id="hq-file" label="MP3 Master (HQ)" sublabel="320kbps sin tags · Para licencias básicas" color="indigo" hex="#6366f1"
                                    icon={<Zap size={16} />} file={hqMp3File} existingFile={null} disabled={false}
                                    accept=".mp3" onChange={(e: any) => setHqMp3File(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 HQ'))} />

                                <FileUploadZone id="wav-file" label="Archivo WAV" sublabel="Alta fidelidad · Solo Pro y Premium" color="emerald" hex="#10b981"
                                    icon={<FileText size={16} />} file={wavFile} existingFile={null} disabled={isFree} disabledLabel="Desbloquear Pro"
                                    accept=".wav" onChange={(e: any) => setWavFile(validateFile(e.target.files?.[0] || null, ['wav'], 'WAV'))} />

                                <FileUploadZone id="stems-file" label="STEMS (Trackout)" sublabel="ZIP de pistas separadas · Solo Premium" color="purple" hex="#a855f7"
                                    icon={<Layers size={16} />} file={stemsFile} existingFile={null} disabled={!isPremium} disabledLabel="Desbloquear Premium"
                                    accept=".zip,.rar" onChange={(e: any) => setStemsFile(validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems'))} />
                            </div>
                        </div>

                        {/* ─── SECTION 3: Licencias & Precios ─── */}
                        <div className={`bg-white/[0.03] border border-white/8 rounded-[2.5rem] p-8 relative overflow-hidden transition-all ${activeSection !== 2 ? 'opacity-50 grayscale pointer-events-none' : ''}`}>
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-amber-500/40 to-transparent" />
                            <div className="flex items-center gap-3 mb-3">
                                <div className="w-10 h-10 bg-amber-500/10 rounded-2xl flex items-center justify-center text-amber-400">
                                    <ShieldCheck size={18} />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-black uppercase tracking-tighter text-foreground">Licencias & Precios</h2>
                                    <p className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-50">Precios sincronizados con Tianguis Studio</p>
                                </div>
                                {activeSection === 2 && (
                                    <button type="button" onClick={() => setActiveSection(1)} className="flex items-center gap-1 px-3 py-2 bg-white/5 border border-white/10 rounded-full text-[9px] font-black text-muted uppercase tracking-widest hover:text-foreground transition-all">
                                        Atrás
                                    </button>
                                )}
                            </div>

                            {studioLicenses.length > 0 && (
                                <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-emerald-500/5 border border-emerald-500/20 rounded-2xl">
                                    <CheckCircle2 size={14} className="text-emerald-500 shrink-0" />
                                    <p className="text-[9px] font-black text-emerald-400 uppercase tracking-widest">Precios cargados desde tus licencias configuradas en Tianguis Studio</p>
                                    <Link href="/studio/licencias" className="ml-auto text-[9px] font-black text-emerald-400 hover:underline uppercase tracking-widest whitespace-nowrap">
                                        Editar →
                                    </Link>
                                </div>
                            )}
                            {studioLicenses.length === 0 && (
                                <div className="flex items-center gap-2 mb-6 px-4 py-2.5 bg-amber-500/5 border border-amber-500/20 rounded-2xl">
                                    <Info size={14} className="text-amber-400 shrink-0" />
                                    <p className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Configura tus términos y contratos en Studio para sincronizar precios automáticamente</p>
                                    <Link href="/studio/licencias" className="ml-auto text-[9px] font-black text-amber-400 hover:underline uppercase tracking-widest whitespace-nowrap">
                                        Configurar →
                                    </Link>
                                </div>
                            )}

                            <div className="space-y-3">
                                {licenseRows.map(lic => {
                                    const meta = LICENSE_META[lic.key];
                                    return (
                                        <div key={lic.key} className={`relative rounded-[1.75rem] border transition-all duration-300 overflow-hidden ${lic.locked ? 'opacity-50 grayscale' : lic.active ? '' : 'opacity-60'}`}
                                            style={{ borderColor: !lic.locked && lic.active ? `${meta.hex}30` : '#ffffff10', background: !lic.locked && lic.active ? `${meta.hex}08` : 'rgba(255,255,255,0.02)' }}>
                                            {!lic.locked && lic.active && (
                                                <div className="absolute top-0 left-0 right-0 h-px"
                                                    style={{ backgroundImage: `linear-gradient(to right, transparent, ${meta.hex}50, transparent)` }} />
                                            )}

                                            {lic.locked && (
                                                <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40 backdrop-blur-[2px] rounded-[1.75rem]">
                                                    <Link href="/pricing" className="flex items-center gap-2 px-5 py-2 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest shadow-2xl hover:scale-105 transition-all"
                                                        style={{ background: meta.hex }}>
                                                        <Lock size={12} />
                                                        {meta.planReq === 'premium' ? 'Requiere Premium' : 'Requiere Pro'}
                                                    </Link>
                                                </div>
                                            )}

                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-5 p-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center transition-all"
                                                        style={{ background: lic.active && !lic.locked ? `${meta.hex}20` : '#ffffff08', color: lic.active && !lic.locked ? meta.hex : '#64748b' }}>
                                                        {meta.icon}
                                                    </div>
                                                    <div>
                                                        <div className="flex items-center gap-2 mb-0.5">
                                                            <h5 className="text-sm font-black uppercase tracking-tighter text-foreground">Licencia {meta.label}</h5>
                                                            {meta.planReq && (
                                                                <span className="px-2 py-0.5 rounded-full text-[8px] font-black uppercase tracking-widest border"
                                                                    style={{ color: meta.hex, borderColor: `${meta.hex}30`, background: `${meta.hex}10` }}>
                                                                    {meta.planReq === 'premium' ? 'Solo Premium' : 'Pro+'}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <p className="text-[9px] font-bold text-muted uppercase tracking-widest">{meta.desc}</p>
                                                    </div>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    <div className="flex flex-col items-end">
                                                        <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border transition-all ${lic.active ? 'border-white/20 bg-white/5' : 'border-white/5 bg-transparent opacity-40'}`}>
                                                            <span className="text-[11px] font-black text-muted">$</span>
                                                            <input type="number" value={lic.lockPrice ? '0' : lic.price}
                                                                onChange={e => !lic.lockPrice && lic.setPrice(e.target.value)}
                                                                disabled={lic.locked || !lic.active || lic.lockPrice}
                                                                className="w-16 bg-transparent outline-none font-black text-xs text-foreground" />
                                                            <span className="text-[8px] font-black text-muted">MXN</span>
                                                        </div>
                                                        {!lic.lockPrice && <PricePreview price={lic.price} />}
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
                        <div className="relative overflow-hidden bg-white/[0.03] border border-white/8 rounded-[2.5rem] p-8">
                            <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-accent/40 to-transparent" />
                            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-widest opacity-60 mb-1">¿Todo listo?</p>
                                    <p className="text-xl font-black uppercase tracking-tighter text-foreground">Lanzar al Tianguis 🚀</p>
                                </div>
                                <button type="submit" disabled={loading}
                                    className="group relative overflow-hidden w-full md:w-auto px-12 py-5 bg-accent text-white rounded-2xl font-black text-[11px] uppercase tracking-widest hover:scale-[1.02] active:scale-95 transition-all shadow-2xl shadow-accent/30 flex items-center justify-center gap-3 disabled:opacity-50 disabled:cursor-not-allowed">
                                    <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                    {loading ? (
                                        <><Loader2 className="animate-spin relative z-10" size={18} /><span className="relative z-10">Publicando...</span></>
                                    ) : (
                                        <><Upload size={18} className="relative z-10" /><span className="relative z-10">Publicar Beat en el Tianguis</span></>
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
