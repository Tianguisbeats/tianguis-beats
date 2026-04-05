"use client";

import React, { useState, useEffect, use } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
    Upload, Music, CheckCircle2, AlertCircle, Loader2, Info, Hash,
    Lock, Zap, Crown, ShieldCheck, FileText, Layers, Sparkles,
    ArrowRight, X, Star, Image as ImageIcon, Rocket, Wand2, ChevronRight, Check, ChevronDown, ChevronLeft, Save
} from 'lucide-react';
import Navbar from '@/components/Navbar';
import TagInput from '@/components/ui/TagInput';
import Switch from '@/components/ui/Switch';
import { GENRES, MOODS, INSTRUMENTS, SUBGENRES, MUSICAL_KEYS } from '@/lib/constants';
import { EXCHANGE_RATES } from '@/context/CurrencyContext';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollReveal } from '@/components/ui/BackgroundEffects';

// License tier definitions (synced with Studio licencias)
const LICENSE_META: Record<string, { label: string; color: string; hex: string; icon: React.ReactNode; planReq: string | null; desc: string }> = {
    basic: { label: 'Licencia Gratis', color: 'slate', hex: '#64748b', icon: <Music size={20} />, planReq: null, desc: '' },
    mp3: { label: 'Licencia Básica', color: 'emerald', hex: '#10b981', icon: <FileText size={20} />, planReq: null, desc: '' },
    pro: { label: 'Licencia Pro', color: 'blue', hex: '#3b82f6', icon: <ShieldCheck size={20} />, planReq: 'pro', desc: '' },
    premium: { label: 'Licencia Premium', color: 'orange', hex: '#f97316', icon: <Layers size={20} />, planReq: 'premium', desc: '' },
    exclusiva: { label: 'Exclusiva Estándar', color: 'purple', hex: '#a855f7', icon: <Crown size={20} />, planReq: 'pro', desc: 'WAV + MP3 · Sin Stems' },
    exclusiva_premium: { label: 'Exclusiva Premium', color: 'orange', hex: '#f97316', icon: <Crown size={20} />, planReq: 'premium', desc: 'WAV + MP3 + Stems' },
};

function getDisplayFileName(url: string) {
    if (!url) return '';
    try { return decodeURIComponent(url).split('/').pop() || url; }
    catch { return url.split('/').pop() || url; }
}

const uploadFileWithProgress = async (bucket: string, path: string, file: File, onProgress: (progress: { pct: number, loaded: number, total: number }) => void) => {
    return new Promise((resolve, reject) => {
        supabase.auth.getSession().then(({ data }) => {
            const token = data.session?.access_token;
            if (!token) return reject(new Error("No autorizado para subir archivos"));

            const xhr = new XMLHttpRequest();
            const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
            const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    const pct = Math.round((e.loaded / e.total) * 100);
                    onProgress({ pct, loaded: e.loaded, total: e.total });
                }
            };

            xhr.open('POST', `${supabaseUrl}/storage/v1/object/${bucket}/${path}`);
            xhr.setRequestHeader('Authorization', `Bearer ${token}`);
            xhr.setRequestHeader('apikey', anonKey!);
            xhr.setRequestHeader('Content-Type', file.type || 'application/octet-stream');
            xhr.setRequestHeader('x-upsert', 'true');

            xhr.onload = () => {
                if (xhr.status >= 200 && xhr.status < 300) { resolve(JSON.parse(xhr.responseText)); }
                else { reject(new Error(`Error subiendo (${xhr.status}): ${xhr.responseText}`)); }
            };

            xhr.onerror = () => reject(new Error("Error de red durante la subida"));
            xhr.send(file);
        }).catch(reject);
    });
};

function FileUploadZone({ id, label, sublabel, color, hex, icon, file, existingFile, disabled, disabledLabel, disabledLink, accept, onChange }: any) {
    const [isDragging, setIsDragging] = useState(false);
    return (
        <div className={`relative rounded-[2.5rem] border transition-all duration-500 overflow-hidden group ${disabled ? 'opacity-40 grayscale cursor-not-allowed' : ''} ${file || existingFile ? 'border-border dark:border-white/20' : 'border-border dark:border-white/5'}`}
            style={{ borderColor: (file || existingFile) && !disabled ? `${hex}30` : undefined, background: `${hex}03` }}>
            <div className="absolute top-0 left-0 right-0 h-px transition-all duration-700"
                style={{ backgroundImage: `linear-gradient(to right, transparent, ${hex}${(file || existingFile) && !disabled ? '40' : '10'}, transparent)` }} />
            {disabled && (
                <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-background/50 backdrop-blur-[4px] rounded-[2.5rem]">
                    <Link href={disabledLink || "/pricing"} 
                        className={`px-6 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all shadow-lg text-white ${
                            disabledLabel?.includes('Pro') ? 'bg-amber-500' : 
                            disabledLabel?.includes('Premium') ? 'bg-blue-600' :
                            disabledLabel?.includes('Licencia') ? 'bg-rose-500' : 'bg-foreground'
                        }`}>
                        {disabledLabel || 'Desbloquear'}
                    </Link>
                </div>
            )}
            <input type="file" accept={accept} disabled={disabled} onChange={onChange} className="hidden" id={id} />
            <label htmlFor={id} className={`flex flex-col p-6 cursor-pointer ${disabled ? 'pointer-events-none' : ''}`}
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={(e) => { e.preventDefault(); setIsDragging(false); }}
                onDrop={(e) => {
                    e.preventDefault();
                    setIsDragging(false);
                    if (disabled) return;
                    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                        onChange({ target: { files: e.dataTransfer.files } });
                    }
                }}>
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3.5">
                        <div className="w-10 h-10 rounded-2xl flex items-center justify-center border border-border dark:border-white/[0.05] transition-transform group-hover:scale-110"
                            style={{ background: `${hex}15`, color: hex }}>
                            {icon}
                        </div>
                        <div>
                            <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: hex }}>{label}</p>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-widest mt-1">{sublabel}</p>
                        </div>
                    </div>
                    {(file || existingFile) && (
                        <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); onChange({ target: { files: null } }); }}
                            className="bg-rose-500/10 hover:bg-rose-500 text-white p-2 rounded-xl transition-all z-30 relative ml-auto cursor-pointer border border-rose-500/20" title="Remover archivo">
                            <X size={15} />
                        </button>
                    )}
                </div>
                <div className={`flex items-center justify-between px-5 py-3 rounded-2xl border transition-all duration-300 ${isDragging ? 'border-dashed border-blue-500/30 bg-blue-500/5 scale-[0.98]' : 'border-border dark:border-white/5 bg-background dark:bg-black/40'}`}>
                    <span className="text-[10px] font-bold text-muted uppercase tracking-wider truncate max-w-[180px]">
                        {file ? file.name : existingFile ? getDisplayFileName(existingFile) : 'Haz click o suelta aquí'}
                    </span>
                    <div className="w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ml-2 border border-border dark:border-white/[0.03]"
                        style={{ background: `${hex}15`, color: hex }}>
                        <Upload size={14} />
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

    // Progress State
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<Record<string, { pct: number, loaded: number, total: number }>>({});

    // Form State
    const [title, setTitle] = useState('');
    const [genre, setGenre] = useState('');
    const [subgenre, setSubgenre] = useState('');
    const [bpm, setBpm] = useState('');
    const [tonoEscala, setTonoEscala] = useState('');
    const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
    const [selectedInstruments, setSelectedInstruments] = useState<string[]>([]);
    const [beatTypes, setBeatTypes] = useState<string[]>([]);
    const [description, setDescription] = useState('');
    const [isMoodOpen, setIsMoodOpen] = useState(false);
    const [isInstOpen, setIsInstOpen] = useState(false);
    const moodRef = React.useRef<HTMLDivElement>(null);
    const instRef = React.useRef<HTMLDivElement>(null);

    // Handle click outside for dropdowns
    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (moodRef.current && !moodRef.current.contains(event.target as Node)) {
                setIsMoodOpen(false);
            }
            if (instRef.current && !instRef.current.contains(event.target as Node)) {
                setIsInstOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    // License States
    const [isBasicActive, setIsBasicActive] = useState(false);
    const [isMp3Active, setIsMp3Active] = useState(false);
    const [isProActive, setIsProActive] = useState(false);
    const [isPremiumActive, setIsPremiumActive] = useState(false);
    const [isExclusivaActive, setIsExclusivaActive] = useState(false);
    const [isExclusivaPremiumActive, setIsExclusivaPremiumActive] = useState(false);

    // Store active constraints from Studio settings
    const [studioActiveConstraints, setStudioActiveConstraints] = useState<Record<string, boolean>>({
        gratis: false,
        basica: false,
        pro: false,
        premium: false,
        exclusiva: false,
        exclusiva_premium: false
    });

    const [basicPrice, setBasicPrice] = useState('0');
    const [mp3Price, setMp3Price] = useState('349');
    const [proPrice, setProPrice] = useState('599');
    const [premiumPrice, setPremiumPrice] = useState('999');
    const [exclusivaPrice, setExclusivaPrice] = useState('4999');
    const [exclusivaPremiumPrice, setExclusivaPremiumPrice] = useState('9999');

    // Existing URLs
    const [existingPortada, setExistingPortada] = useState<string | null>(null);
    const [existingMp3HQ, setExistingMp3HQ] = useState<string | null>(null);
    const [existingWav, setExistingWav] = useState<string | null>(null);
    const [existingStems, setExistingStems] = useState<string | null>(null);
    const [existingPreview, setExistingPreview] = useState<string | null>(null);

    // New Files
    const [coverFile, setCoverFile] = useState<File | null>(null);
    const [isDraggingCover, setIsDraggingCover] = useState(false);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [hqMp3File, setHqMp3File] = useState<File | null>(null);
    const [wavFile, setWavFile] = useState<File | null>(null);
    const [stemsFile, setStemsFile] = useState<File | null>(null);

    useEffect(() => {
        const init = async () => {
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
            setTonoEscala(beat.tono_escala || '');
            if (beat.vibras) setSelectedMoods(beat.vibras.split(', '));
            if (beat.instrumentos) setSelectedInstruments(beat.instrumentos);
            setBeatTypes(beat.tipos_beat || (beat.artista_referencia ? beat.artista_referencia.split(', ') : []));
            setBasicPrice(beat.precio_gratis_mxn?.toString() || '0');
            setMp3Price(beat.precio_basica_mxn?.toString() || '349');
            setProPrice(beat.precio_pro_mxn?.toString() || '599');
            setPremiumPrice(beat.precio_premium_mxn?.toString() || '999');
            setExclusivaPrice(beat.precio_exclusiva_estandar_mxn?.toString() || '4999');
            setExclusivaPremiumPrice(beat.precio_exclusiva_premium_mxn?.toString() || '9999');
            setIsBasicActive(beat.es_gratis_activa !== false);
            setIsMp3Active(beat.es_basica_activa !== false);
            setIsProActive(beat.es_pro_activa !== false);
            setIsPremiumActive(beat.es_premium_activa !== false);
            setIsExclusivaActive(beat.es_exclusiva_estandar_activa || false);
            setIsExclusivaPremiumActive(beat.es_exclusiva_premium_activa || false);
            setExistingPortada(beat.portada_url);
            setExistingMp3HQ(beat.archivo_mp3_url);
            setExistingWav(beat.archivo_wav_url);
            setExistingStems(beat.archivo_stems_url);
            setExistingPreview(beat.archivo_muestra_url);
            setDescription(beat.descripcion || '');

            const { data: licsConfig } = await supabase.from('licencias').select('*').eq('productor_id', session.user.id).single();
            if (licsConfig) {
                setStudioActiveConstraints({
                    gratis: licsConfig.gratis_activa ?? false,
                    basica: licsConfig.basica_activa ?? false,
                    pro: licsConfig.pro_activa ?? false,
                    premium: licsConfig.premium_activa ?? false,
                    exclusiva: licsConfig.exclusiva_activa ?? false,
                    exclusiva_premium: licsConfig.exclusiva_premium_activa ?? false,
                });
            } else {
                setStudioActiveConstraints({ gratis: false, basica: false, pro: false, premium: false, exclusiva: false, exclusiva_premium: false });
            }
            setLoading(false);
        };
        init();
    }, [id, router]);

    const handleMoodToggle = (mood: string) => {
        if (selectedMoods.includes(mood)) setSelectedMoods(selectedMoods.filter(m => m !== mood));
        else if (selectedMoods.length < 3) setSelectedMoods([...selectedMoods, mood]);
    };

    const handleInstrumentToggle = (inst: string) => {
        if (selectedInstruments.includes(inst)) setSelectedInstruments(selectedInstruments.filter(m => m !== inst));
        else if (selectedInstruments.length < 3) setSelectedInstruments([...selectedInstruments, inst]);
    };

    const validateFile = (file: File | null, exts: string[], label: string) => {
        if (!file) return null;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !exts.includes(ext)) { setError(`${label}: Solo se permiten: ${exts.join(', ')}`); return null; }
        return file;
    };

    const handleErrorAndScroll = (msg: string, elementId: string) => {
        setError(msg);
        const el = document.getElementById(elementId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' });
            el.focus({ preventScroll: true });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userData) return;
        if (!title) return handleErrorAndScroll("Campo requerido: Título", "input-title");
        if (!genre) return handleErrorAndScroll("Campo requerido: Género", "input-genre");
        if (!bpm) return handleErrorAndScroll("Campo requerido: BPM", "input-bpm");
        if (!tonoEscala) return handleErrorAndScroll("Campo requerido: Tono/Escala", "input-key");
        if (!coverFile && !existingPortada) return handleErrorAndScroll("Campo requerido: Portada (Artwork)", "cover");
        if (!previewFile && !existingPreview) return handleErrorAndScroll("Campo requerido: Archivo MP3 Muestra", "preview-file");
        if (selectedMoods.length < 1) return handleErrorAndScroll("Selecciona al menos 1 Mood Tag.", "input-moods");
        if (selectedInstruments.length < 1) return handleErrorAndScroll("Selecciona al menos 1 Instrumento.", "input-instruments");
        if (beatTypes.length < 1) return handleErrorAndScroll("Agrega al menos 1 artista de referencia.", "input-artists");

        if (!isBasicActive && !isMp3Active && !isProActive && !isPremiumActive && !isExclusivaActive && !isExclusivaPremiumActive) {
            return handleErrorAndScroll("Debes activar al menos una licencia. Recuerda activarlas en 'Mis Licencias'.", "licenses-section");
        }

        if (isMp3Active && !hqMp3File && !existingMp3HQ) return handleErrorAndScroll("Licencia Básica (MP3) requiere subir el archivo MP3 HQ.", "hq-file");
        if (isProActive && !wavFile && !existingWav) return handleErrorAndScroll("Licencia Pro requiere subir el archivo WAV.", "wav-file");
        if (isPremiumActive && (!hqMp3File && !existingMp3HQ || !wavFile && !existingWav || !stemsFile && !existingStems)) return handleErrorAndScroll("Licencia Premium requiere MP3 HQ, WAV y STEMS.", "hq-file");
        if (isExclusivaActive && (!hqMp3File && !existingMp3HQ || !wavFile && !existingWav)) return handleErrorAndScroll("Exclusiva Estándar requiere MP3 HQ y WAV.", "hq-file");
        if (isExclusivaPremiumActive && (!hqMp3File && !existingMp3HQ || !wavFile && !existingWav || !stemsFile && !existingStems)) return handleErrorAndScroll("Exclusiva Premium requiere MP3 HQ, WAV y STEMS.", "hq-file");

        setIsUploading(true);
        setUploadProgress({});
        setError(null);
        try {
            const un = userData.nombre_usuario;
            const san = (n: string) => n.replace(/[^a-z0-9.]/gi, '_').toLowerCase();

            let portada_url = existingPortada;
            if (coverFile) {
                setUploadProgress(p => ({ ...p, cover: { pct: 0, loaded: 0, total: coverFile.size } }));
                const p = `${un}/${san(coverFile.name)}`;
                await uploadFileWithProgress('portadas_beats', p, coverFile, (progress) => setUploadProgress(prev => ({ ...prev, cover: progress })));
                const { data: { publicUrl } } = supabase.storage.from('portadas_beats').getPublicUrl(p);
                portada_url = publicUrl;
            }

            let previewPath = existingPreview;
            if (previewFile) {
                setUploadProgress(p => ({ ...p, preview: { pct: 0, loaded: 0, total: previewFile.size } }));
                const p = `${un}/${san(previewFile.name)}`;
                await uploadFileWithProgress('muestras_beats', p, previewFile, (progress) => setUploadProgress(prev => ({ ...prev, preview: progress })));
                const { data: { publicUrl } } = supabase.storage.from('muestras_beats').getPublicUrl(p);
                previewPath = publicUrl;
            }

            let hqPath = existingMp3HQ;
            if (hqMp3File) {
                setUploadProgress(p => ({ ...p, hq: { pct: 0, loaded: 0, total: hqMp3File.size } }));
                const p = `${un}/${san(hqMp3File.name)}`;
                await uploadFileWithProgress('beats_mp3', p, hqMp3File, (progress) => setUploadProgress(prev => ({ ...prev, hq: progress })));
                const { data: { publicUrl } } = supabase.storage.from('beats_mp3').getPublicUrl(p);
                hqPath = publicUrl;
            }

            let wavPath = existingWav;
            if (wavFile && !isFree) {
                setUploadProgress(p => ({ ...p, wav: { pct: 0, loaded: 0, total: wavFile.size } }));
                const p = `${un}/${san(wavFile.name)}`;
                await uploadFileWithProgress('beats_wav', p, wavFile, (progress) => setUploadProgress(prev => ({ ...prev, wav: progress })));
                const { data: { publicUrl } } = supabase.storage.from('beats_wav').getPublicUrl(p);
                wavPath = publicUrl;
            }

            let stemsPath = existingStems;
            if (stemsFile && isPremium) {
                setUploadProgress(p => ({ ...p, stems: { pct: 0, loaded: 0, total: stemsFile.size } }));
                const p = `${un}/${san(stemsFile.name)}`;
                await uploadFileWithProgress('beats_stems', p, stemsFile, (progress) => setUploadProgress(prev => ({ ...prev, stems: progress })));
                const { data: { publicUrl } } = supabase.storage.from('beats_stems').getPublicUrl(p);
                stemsPath = publicUrl;
            }

            const { error: dbError } = await supabase.from('beats').update({
                titulo: title,
                genero: genre,
                subgenero: subgenre,
                bpm: parseInt(bpm),
                tono_escala: tonoEscala,
                vibras: selectedMoods.join(', '),
                instrumentos: selectedInstruments,
                tipos_beat: beatTypes,
                artista_referencia: beatTypes.join(', '),
                portada_url,
                archivo_mp3_url: hqPath,
                archivo_muestra_url: previewPath,
                archivo_wav_url: wavPath,
                archivo_stems_url: stemsPath,
                es_gratis_activa: isBasicActive,
                es_basica_activa: isMp3Active,
                es_pro_activa: isProActive,
                es_premium_activa: isPremiumActive,
                es_exclusiva_estandar_activa: isExclusivaActive,
                es_exclusiva_premium_activa: isExclusivaPremiumActive,
                precio_gratis_mxn: 0,
                precio_basica_mxn: parseInt(mp3Price) || 0,
                precio_pro_mxn: parseInt(proPrice) || 0,
                precio_premium_mxn: parseInt(premiumPrice) || 0,
                precio_exclusiva_estandar_mxn: parseInt(exclusivaPrice) || 0,
                precio_exclusiva_premium_mxn: parseInt(exclusivaPremiumPrice) || 0,
                es_visible: true,
                esta_archivado: false,
                esta_desactivado_por_plan: false
            }).eq('id', id);

            if (dbError) throw dbError;
            setSuccess(true);
            setTimeout(() => router.push('/studio/beats'), 1500);
        } catch (err: any) {
            let errorMsg = err.message || "Error al actualizar el beat";
            if (errorMsg.includes("413") || errorMsg.includes("Payload too large")) {
                errorMsg = "⚠️ El archivo es demasiado pesado para la configuración actual. Por favor, comprime el archivo ZIP de los STEMS o reduce su tamaño antes de volver a intentarlo.";
            }
            setError(errorMsg);
        } finally { setIsUploading(false); setSaving(false); }
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

    if (loading || !userData) return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
        </div>
    );

    const isPremium = userData.nivel_suscripcion?.toLowerCase().includes('premium');
    const isPro = !isPremium && (userData.nivel_suscripcion?.toLowerCase().includes('pro') || userData.nivel_suscripcion?.toLowerCase().includes('plus'));
    const isFree = !isPremium && !isPro;

    const licenseRows = [
        { key: 'basic', active: isBasicActive, setActive: setIsBasicActive, price: '0', setPrice: setBasicPrice, locked: (!previewFile && !existingPreview) || !studioActiveConstraints.gratis, lockReason: !studioActiveConstraints.gratis ? "ACTÍVALA EN LICENCIAS" : 'REQUIERE AGREGAR ARCHIVO MP3', lockLink: !studioActiveConstraints.gratis ? "/studio/licencias" : null, lockPrice: true },
        { key: 'mp3', active: isMp3Active, setActive: setIsMp3Active, price: mp3Price, setPrice: setMp3Price, locked: (!hqMp3File && !existingMp3HQ) || !studioActiveConstraints.basica, lockReason: !studioActiveConstraints.basica ? "ACTÍVALA EN LICENCIAS" : 'REQUIERE AGREGAR ARCHIVO MP3 HQ', lockLink: !studioActiveConstraints.basica ? "/studio/licencias" : null },
        { key: 'pro', active: isProActive, setActive: setIsProActive, price: proPrice, setPrice: setProPrice, locked: isFree || (!wavFile && !existingWav) || !studioActiveConstraints.pro, lockReason: isFree ? "MEJORAR A PRO" : !studioActiveConstraints.pro ? "ACTÍVALA EN LICENCIAS" : 'REQUIERE AGREGAR WAV Y MP3 HQ', lockLink: isFree ? "/pricing" : !studioActiveConstraints.pro ? "/studio/licencias" : null },
        { key: 'premium', active: isPremiumActive, setActive: setIsPremiumActive, price: premiumPrice, setPrice: setPremiumPrice, locked: isFree || (!stemsFile && !existingStems) || (!wavFile && !existingWav) || (!hqMp3File && !existingMp3HQ) || !studioActiveConstraints.premium, lockReason: isFree ? "MEJORAR A PREMIUM" : !studioActiveConstraints.premium ? "ACTÍVALA EN LICENCIAS" : 'REQUIERE AGREGAR ARCHIVO WAV, STEMS Y MP3', lockLink: isFree ? "/pricing" : !studioActiveConstraints.premium ? "/studio/licencias" : null },
        { key: 'exclusiva', active: isExclusivaActive, setActive: setIsExclusivaActive, price: exclusivaPrice, setPrice: setExclusivaPrice, locked: isFree || (!wavFile && !existingWav) || (!hqMp3File && !existingMp3HQ) || !studioActiveConstraints.exclusiva, lockReason: isFree ? "MEJORAR A PRO" : !studioActiveConstraints.exclusiva ? "ACTÍVALA EN LICENCIAS" : 'REQUIERE WAV + MP3 HQ', lockLink: isFree ? "/pricing" : !studioActiveConstraints.exclusiva ? "/studio/licencias" : null },
        { key: 'exclusiva_premium', active: isExclusivaPremiumActive, setActive: setIsExclusivaPremiumActive, price: exclusivaPremiumPrice, setPrice: setExclusivaPremiumPrice, locked: isFree || (!wavFile && !existingWav) || (!hqMp3File && !existingMp3HQ) || (!stemsFile && !existingStems) || !studioActiveConstraints.exclusiva_premium, lockReason: isFree ? "MEJORAR A PREMIUM" : !studioActiveConstraints.exclusiva_premium ? "ACTÍVALA EN LICENCIAS" : 'REQUIERE WAV + MP3 HQ + STEMS', lockLink: isFree ? "/pricing" : !studioActiveConstraints.exclusiva_premium ? "/studio/licencias" : null },
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col">
            <Navbar />

            {/* ══════ BACKGROUND ESTÁTICO ══════ */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-background via-background to-blue-500/[0.02]" />
                <div className="absolute top-0 left-[30%] w-px h-full bg-gradient-to-b from-transparent via-blue-500/5 to-transparent rotate-[15deg]" />
                <div className="absolute top-0 left-[65%] w-px h-full bg-gradient-to-b from-transparent via-indigo-500/5 to-transparent -rotate-[10deg]" />
                <div className="absolute inset-0 bg-gradient-to-b from-background/5 via-background/60 to-background" />
            </div>

            {/* Premium Upload Progress Modal */}
            {isUploading && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0 }} 
                        animate={{ opacity: 1 }} 
                        className="absolute inset-0 bg-background/80 backdrop-blur-2xl"
                    />

                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        className="relative bg-white dark:bg-[#0c0c0e] border border-slate-200 dark:border-white/10 rounded-[3rem] p-10 w-full max-w-xl shadow-[0_50px_200px_-20px_rgba(0,0,0,0.5)] overflow-hidden"
                    >
                        {/* Decorative Background Glows */}
                        <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 blur-[80px] rounded-full" />
                        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-emerald-500/10 blur-[80px] rounded-full" />

                        <div className="relative z-10 flex flex-col items-center text-center">
                            <div className="w-20 h-20 bg-blue-500/10 rounded-[2rem] flex items-center justify-center text-blue-500 mb-8 relative group">
                                <div className="absolute inset-0 border-4 border-blue-500/20 rounded-[2rem] animate-ping opacity-20" />
                                <div className="relative z-10">
                                    <Loader2 size={32} className="animate-spin" />
                                </div>
                            </div>
                            
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-3 leading-none">
                                Actualizando <span className="text-blue-500">tu Obra</span>
                            </h2>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mb-12 opacity-60">
                                Sincronizando archivos con el servidor. No cierres esta pestaña.
                            </p>

                            <div className="w-full space-y-6">
                                {Object.entries(uploadProgress).map(([key, data]) => {
                                    const { pct, loaded, total } = data as { pct: number, loaded: number, total: number };
                                    const labels: Record<string, { name: string, color: string }> = { 
                                        cover: { name: 'Portada', color: 'amber' }, 
                                        preview: { name: 'Muestra MP3', color: 'slate' }, 
                                        hq: { name: 'MP3 Alta Calidad', color: 'emerald' }, 
                                        wav: { name: 'WAV Master', color: 'blue' }, 
                                        stems: { name: 'STEMS (Pistas)', color: 'purple' } 
                                    };
                                    
                                    const fileItem = key === 'cover' ? coverFile : 
                                                   key === 'preview' ? previewFile :
                                                   key === 'hq' ? hqMp3File :
                                                   key === 'wav' ? wavFile :
                                                   key === 'stems' ? stemsFile : null;

                                    const isComplete = pct === 100;
                                    const loadedMB = (loaded / (1024 * 1024)).toFixed(1);
                                    const totalMB = (total / (1024 * 1024)).toFixed(1);

                                    return (
                                        <div key={key} className="group/item">
                                            <div className="flex flex-col gap-2.5 mb-2">
                                                <div className="flex justify-between items-center">
                                                    <div className="flex items-center gap-3">
                                                        <div className={`w-8 h-8 rounded-xl bg-${labels[key].color}-500/10 flex items-center justify-center text-${labels[key].color}-500 transition-all duration-500`}>
                                                            {isComplete ? <Check size={14} strokeWidth={4} /> : <div className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />}
                                                        </div>
                                                        <div className="text-left">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-foreground leading-none mb-1">{labels[key].name}</p>
                                                            <p className="text-[9px] font-bold text-muted uppercase tracking-tighter opacity-40 truncate max-w-[200px]">
                                                                {fileItem?.name || 'Sincronizando...'}
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="text-right">
                                                        <p className={`text-[11px] font-black tracking-tighter ${isComplete ? 'text-emerald-500' : 'text-blue-500'}`}>
                                                            {isComplete ? '100%' : `${pct}%`}
                                                        </p>
                                                        <p className="text-[8px] font-bold text-muted uppercase tracking-widest opacity-30">
                                                            {loadedMB}MB / {totalMB}MB
                                                        </p>
                                                    </div>
                                                </div>
                                                
                                                {/* Bar */}
                                                <div className="h-1.5 w-full bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden relative">
                                                    <motion.div 
                                                        initial={{ width: 0 }}
                                                        animate={{ width: `${pct}%` }}
                                                        className={`h-full relative transition-all duration-300 ease-out rounded-full ${isComplete ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-blue-500 shadow-[0_0_10px_rgba(59,130,246,0.3)]'}`}
                                                    >
                                                        {!isComplete && (
                                                            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer" 
                                                                 style={{ backgroundSize: '1000px 100%' }} />
                                                        )}
                                                    </motion.div>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <div className="mt-12 pt-8 border-t border-slate-200 dark:border-white/5 w-full">
                                <div className="flex items-center justify-center gap-3 px-6 py-3 bg-slate-100 dark:bg-white/5 rounded-2xl">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <p className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Sincronización Segura de Archivos</p>
                                </div>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}

            <main className="flex-1 pb-24 pt-24 w-full">

                        <div className="max-w-screen-2xl mx-auto px-6 sm:px-12 relative z-10 w-full">
                            
                            <div className="mb-12">
                                <Link href="/studio/beats" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-foreground/[0.03] border border-border text-[10px] font-black uppercase tracking-widest text-muted hover:text-blue-500 hover:border-blue-500/30 transition-all group">
                                    <ChevronLeft size={16} className="group-hover:-translate-x-1 transition-transform" /> Volver a mis Beats
                                </Link>
                            </div>

                    {error && (
                        <div className="flex items-center gap-3 p-4 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[11px] font-bold mb-6">
                            <AlertCircle size={16} className="shrink-0" /> {error}
                            <button onClick={() => setError(null)} className="ml-auto"><X size={14} /></button>
                        </div>
                    )}
                    {success && (
                        <div className="flex items-center gap-3 p-5 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-bold mb-6">
                            <CheckCircle2 size={20} /> ¡Beat actualizado con éxito! Redirigiendo...
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-12">

                        {/* ─── SECTION 1: Identidad ─── */}
                        <div className="bg-white/[0.02] dark:bg-black/20 border border-white/5 dark:border-white/10 rounded-[3rem] p-8 md:p-14 relative mb-12 group transition-all duration-700 shadow-2xl shadow-black/5 dark:shadow-blue-500/[0.02] hover:shadow-blue-500/10 hover:border-blue-500/30 overflow-visible">
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem]">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div key={`ident-shape-${i}`} className="absolute bg-blue-500/5 dark:bg-blue-400/5"
                                        style={{ width: `${80 + i * 40}px`, height: `${80 + i * 40}px`, bottom: `${-10 + i * 20}%`, left: `${-5 + i * 15}%`, borderRadius: i % 2 === 0 ? '50%' : '1rem', rotate: '45deg' }}
                                        animate={{ x: [0, 30, 0], y: [0, -30, 0], rotate: [45, 135, 45] }}
                                        transition={{ duration: 10 + i * 2, repeat: Infinity, ease: 'easeInOut' }} />
                                ))}
                            </div>
                            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[100px] rounded-full -mr-32 -mt-32 pointer-events-none" />
                            <div className="absolute bottom-10 right-10 w-32 h-32 border border-yellow-500/5 rotate-45 rounded-3xl pointer-events-none" />

                            <div className="flex items-center gap-6 mb-12 relative z-10">
                                <div className="w-16 h-16 bg-blue-500/10 border border-blue-500/20 rounded-[1.8rem] flex items-center justify-center text-blue-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Wand2 size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Identidad</h2>
                                    <p className="text-[11px] font-bold text-muted uppercase tracking-[0.3em] mt-1.5 opacity-60">Vibras, Género y Concepto Visual</p>
                                </div>
                            </div>

                            <div className="grid md:grid-cols-2 gap-8">
                                <div className="space-y-6">
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3 block">Título</label>
                                        <input type="text" id="input-title" value={title} onChange={(e) => setTitle(e.target.value)}
                                            className="w-full bg-background border border-border dark:border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-foreground placeholder:text-muted focus:outline-none focus:border-blue-500/50 transition-all shadow-sm"
                                            placeholder="Título del beat" />
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3 block">BPM</label>
                                            <input type="number" id="input-bpm" value={bpm} onChange={(e) => setBpm(e.target.value)}
                                                className="w-full bg-background border border-border dark:border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-blue-500/50 transition-all shadow-sm"
                                                placeholder="140" />
                                        </div>
                                        <div>
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3 block">Escala</label>
                                            <select id="input-key" value={tonoEscala} onChange={(e) => setTonoEscala(e.target.value)}
                                                className="w-full bg-background border border-border dark:border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer shadow-sm">
                                                <option value="">Selecciona Key</option>
                                                <optgroup label="── Mayores">
                                                    {MUSICAL_KEYS.filter(k => k.value.includes("_maj")).map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                                                </optgroup>
                                                <optgroup label="── Menores">
                                                    {MUSICAL_KEYS.filter(k => k.value.includes("_min")).map(k => <option key={k.value} value={k.value}>{k.label}</option>)}
                                                </optgroup>
                                            </select>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-3 block">Género</label>
                                        <div className="relative">
                                            <select id="input-genre" value={genre} onChange={(e) => { setGenre(e.target.value); setSubgenre(''); }}
                                                className="w-full bg-background border border-border dark:border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-foreground focus:outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer pr-12 shadow-sm">
                                                <option value="">Género Principal</option>
                                                {GENRES.map(g => <option key={g} value={g}>{g}</option>)}
                                            </select>
                                            <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-muted"><ChevronDown size={18} /></div>
                                        </div>
                                    </div>
                                    {genre && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-500/40 mb-3 block">↳ Subgénero</label>
                                            <div className="relative">
                                                <select value={subgenre} onChange={(e) => setSubgenre(e.target.value)}
                                                    className="w-full bg-blue-500/5 border border-blue-500/20 dark:border-blue-500/40 rounded-2xl px-6 py-4 text-sm font-bold text-blue-500 focus:outline-none focus:border-blue-500/50 appearance-none transition-all cursor-pointer pr-12 shadow-sm">
                                                    <option value="">Selecciona Subgénero</option>
                                                    {SUBGENRES[genre as keyof typeof SUBGENRES]?.map(sg => <option key={sg} value={sg}>{sg}</option>)}
                                                </select>
                                                <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none text-blue-500/50"><ChevronDown size={18} /></div>
                                            </div>
                                        </motion.div>
                                    )}
                                    <div>
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Tipo de Artista / Beat Type</label>
                                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full shrink-0">1 a 5</span>
                                        </div>
                                        <div id="input-artists">
                                            <TagInput tags={beatTypes} setTags={setBeatTypes} maxTags={5} placeholder="Ej: Travis Scott, Metro Boomin..." />
                                        </div>
                                    </div>
                                </div>

                                <div className="space-y-6">
                                    {/* Cover upload */}
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted mb-1 block">Portada del Beat</label>
                                        <input type="file" accept=".jpg,.jpeg,.png,.webp" onChange={e => setCoverFile(e.target.files?.[0] || null)} className="hidden" id="cover" />
                                        <label htmlFor="cover"
                                            onDragOver={(e) => { e.preventDefault(); setIsDraggingCover(true); }}
                                            onDragLeave={(e) => { e.preventDefault(); setIsDraggingCover(false); }}
                                            onDrop={(e) => { e.preventDefault(); setIsDraggingCover(false); setCoverFile(e.dataTransfer.files?.[0] || null); }}
                                            className={`relative flex items-center justify-center p-6 bg-black/[0.02] dark:bg-white/[0.02] border border-dashed rounded-[2.5rem] cursor-pointer transition-all min-h-[140px] overflow-hidden ${isDraggingCover ? 'border-blue-500 bg-blue-500/5' : (coverFile || existingPortada) ? 'border-blue-500/40' : 'border-border hover:border-blue-500/30'}`}>
                                            {(coverFile || existingPortada) ? (
                                                <div className="flex items-center gap-6 w-full relative z-10">
                                                    <div className="w-24 h-24 rounded-2xl overflow-hidden border border-border shrink-0 bg-black/20">
                                                        <img src={coverFile ? URL.createObjectURL(coverFile) : existingPortada!} className="w-full h-full object-cover" alt="Preview" />
                                                    </div>
                                                    <div className="flex-1 min-w-0">
                                                        <p className="text-[11px] font-black text-foreground uppercase tracking-widest truncate">{coverFile ? coverFile.name : 'Imagen Actual'}</p>
                                                        <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2"><Check size={10} /> {coverFile ? 'Para subir' : 'Conservar actual'}</p>
                                                    </div>
                                                    <button type="button" onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCoverFile(null); }}
                                                        className="ml-auto bg-rose-500/10 hover:bg-rose-500 text-rose-500 hover:text-white p-2.5 rounded-2xl transition-all border border-rose-500/20 shrink-0"><X size={16} /></button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center justify-center w-full text-muted group pointer-events-none">
                                                    <ImageIcon size={28} className="mb-3 opacity-40 group-hover:scale-110 group-hover:text-blue-500 transition-all" />
                                                    <span className="text-[10px] font-black uppercase tracking-[0.3em] mb-1">Cambiar Portada</span>
                                                    <span className="text-[8px] font-bold uppercase mt-1.5 opacity-60 text-blue-400">3000x3000px · Máx 5MB</span>
                                                </div>
                                            )}
                                        </label>
                                    </div>

                                    <div className="mb-10">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted ml-1">Descripción del Beat</label>
                                            <span className="text-[8px] font-bold text-muted/20 uppercase tracking-widest">Aparecerá en tu perfil público</span>
                                        </div>
                                        <div className="relative group transition-all duration-500">
                                            <div className="absolute -inset-[1px] bg-gradient-to-br from-blue-500/20 to-transparent rounded-[2.2rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                            <textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="La historia detrás de tu Beat..."
                                                className="relative w-full bg-white/[0.02] dark:bg-black/20 border border-border dark:border-white/20 rounded-[2rem] p-8 text-sm text-foreground focus:outline-none focus:border-blue-500/20 transition-all min-h-[160px] resize-none placeholder:text-muted/30 font-medium leading-relaxed shadow-sm" />
                                            <div className="absolute bottom-6 right-8 opacity-10 group-hover:opacity-40 transition-opacity"><Sparkles size={18} className="text-blue-500" /></div>
                                        </div>
                                    </div>

                                    {/* Moods */}
                                    <div className="relative" ref={moodRef} id="input-moods">
                                        <div className="flex items-center justify-between mb-3">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Moods ambientales</label>
                                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full shrink-0">Máx 3</span>
                                        </div>
                                        <button type="button" onClick={() => { setIsMoodOpen(!isMoodOpen); setIsInstOpen(false); }}
                                            className={`w-full flex items-center justify-between bg-background border border-border dark:border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-left transition-all hover:border-blue-500/30 shadow-sm ${isMoodOpen ? 'border-blue-500/50 ring-1 ring-blue-500/20' : ''}`}>
                                            <span className={selectedMoods.length === 0 ? "text-muted" : "text-foreground"}>
                                                {selectedMoods.length > 0 ? `${selectedMoods.length} seleccionados` : "Seleccionar Moods..."}
                                            </span>
                                            <ChevronDown size={18} className={`text-muted transition-transform ${isMoodOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {isMoodOpen && (
                                            <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="absolute z-[999] mt-2 w-full bg-white/95 dark:bg-black/90 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-3 max-h-[350px] flex flex-col overflow-hidden"
                                                onWheel={(e) => e.stopPropagation()}>
                                                <div className="overflow-y-auto pr-1" data-lenis-prevent>
                                                    <div className="flex flex-col gap-1">
                                                        {MOODS.map(mood => (
                                                            <button key={mood.value} type="button" onClick={(e) => { e.stopPropagation(); handleMoodToggle(mood.value); }}
                                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border text-left ${selectedMoods.includes(mood.value) ? 'bg-blue-600/20 text-blue-500 dark:text-blue-400 border-blue-500/30' : 'bg-transparent border-transparent text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}`}>
                                                                <span className="text-base">{mood.emoji}</span>
                                                                {mood.label}
                                                                {selectedMoods.includes(mood.value) && <Check size={14} className="ml-auto" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {selectedMoods.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {selectedMoods.map(m => {
                                                    const moodObj = MOODS.find(x => x.value === m);
                                                    return (
                                                        <span key={m} className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                            {moodObj?.emoji} {moodObj?.label}
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleMoodToggle(m); }} className="ml-1 hover:text-white transition-colors"><X size={10} /></button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>

                                    {/* Instruments */}
                                    <div className="relative" ref={instRef} id="input-instruments">
                                        <div className="flex items-center justify-between mb-4">
                                            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-muted">Instrumentos</label>
                                            <span className="text-[8px] font-bold text-blue-400 uppercase tracking-widest bg-blue-500/10 px-2 py-0.5 rounded-full">Máx 3</span>
                                        </div>
                                        <button type="button" onClick={() => { setIsInstOpen(!isInstOpen); setIsMoodOpen(false); }}
                                            className={`w-full flex items-center justify-between bg-background border border-border dark:border-white/20 rounded-2xl px-6 py-4 text-sm font-bold text-left transition-all hover:border-blue-500/30 shadow-sm ${isInstOpen ? 'border-blue-500/50 ring-1 ring-blue-500/20' : ''}`}>
                                            <span className={selectedInstruments.length === 0 ? "text-muted" : "text-foreground"}>
                                                {selectedInstruments.length > 0 ? `${selectedInstruments.length} seleccionados` : "Seleccionar Instrumentos..."}
                                            </span>
                                            <ChevronDown size={18} className={`text-muted transition-transform ${isInstOpen ? "rotate-180" : ""}`} />
                                        </button>
                                        {isInstOpen && (
                                            <motion.div initial={{ opacity: 0, y: 5, scale: 0.98 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className="absolute z-[999] mt-2 w-full bg-white/95 dark:bg-black/90 backdrop-blur-3xl border border-black/5 dark:border-white/10 rounded-3xl shadow-[0_25px_60px_-15px_rgba(0,0,0,0.2)] dark:shadow-[0_25px_60px_-15px_rgba(0,0,0,0.6)] p-3 max-h-[350px] flex flex-col overflow-hidden"
                                                onWheel={(e) => e.stopPropagation()}>
                                                <div className="overflow-y-auto pr-1" data-lenis-prevent>
                                                    <div className="flex flex-col gap-1">
                                                        {INSTRUMENTS.map(inst => (
                                                            <button key={inst.value} type="button" onClick={(e) => { e.stopPropagation(); handleInstrumentToggle(inst.value); }}
                                                                className={`flex items-center gap-3 px-4 py-3 rounded-xl text-[11px] font-black uppercase tracking-[0.1em] transition-all border text-left ${selectedInstruments.includes(inst.value) ? 'bg-blue-600/20 text-blue-500 dark:text-blue-400 border-blue-500/30' : 'bg-transparent border-transparent text-muted hover:bg-black/5 dark:hover:bg-white/5 hover:text-foreground'}`}>
                                                                <span className="text-base">{inst.emoji}</span>
                                                                {inst.label}
                                                                {selectedInstruments.includes(inst.value) && <Check size={14} className="ml-auto" />}
                                                            </button>
                                                        ))}
                                                    </div>
                                                </div>
                                            </motion.div>
                                        )}
                                        {selectedInstruments.length > 0 && (
                                            <div className="flex flex-wrap gap-2 mt-3">
                                                {selectedInstruments.map(i => {
                                                    const instObj = INSTRUMENTS.find(x => x.value === i);
                                                    return (
                                                        <span key={i} className="px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-[0.1em] bg-blue-500/10 text-blue-400 border border-blue-500/20 flex items-center gap-1">
                                                            {instObj?.emoji} {instObj?.label}
                                                            <button type="button" onClick={(e) => { e.stopPropagation(); handleInstrumentToggle(i); }} className="ml-1 hover:text-white transition-colors"><X size={10} /></button>
                                                        </span>
                                                    );
                                                })}
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* ─── SECTION 2: Archivos ─── */}
                        <div className="bg-white/[0.02] dark:bg-black/20 border border-white/5 dark:border-white/10 rounded-[3rem] p-8 md:p-12 relative mb-12 group transition-all duration-700 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5 hover:border-emerald-500/20 overflow-hidden">
                            <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div key={`audio-wave-${i}`} className="absolute border border-emerald-500/10 dark:border-emerald-500/5 rounded-full"
                                        initial={{ width: 0, height: 0, opacity: 0 }}
                                        animate={{ width: ['0%', '130%'], height: ['0%', '130%'], opacity: [0, 0.1, 0] }}
                                        transition={{ duration: 5, repeat: Infinity, delay: i * 1.6, ease: "linear" }} />
                                ))}
                            </div>

                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-emerald-500/10 border border-emerald-500/20 rounded-[1.8rem] flex items-center justify-center text-emerald-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Music size={28} />
                                </div>
                                <div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-foreground">Archivos</h2>
                                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.3em] mt-1.5 opacity-60">Gestión de archivos de alta fidelidad</p>
                                </div>
                            </div>

                            <div className="grid sm:grid-cols-2 gap-5">
                                <FileUploadZone id="preview-file" label="MP3 Muestra (Tagged)" sublabel="Pre-escucha con tags" color="blue" hex="#3b82f6"
                                    icon={<Music size={18} />} file={previewFile} existingFile={existingPreview} disabled={false}
                                    accept=".mp3" onChange={(e: any) => setPreviewFile(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 Muestra'))} />
                                <FileUploadZone id="hq-file" label="MP3 High Quality" sublabel="320kbps High-Quality" color="violet" hex="#a855f7"
                                    icon={<Zap size={18} />} file={hqMp3File} existingFile={existingMp3HQ}
                                    disabled={false} accept=".mp3" onChange={(e: any) => setHqMp3File(validateFile(e.target.files?.[0] || null, ['mp3'], 'MP3 HQ'))} />
                                <FileUploadZone id="wav-file" label="WAV 24-bit" sublabel="Pérdida cero (Lossless)" color="amber" hex="#f59e0b"
                                    icon={<FileText size={18} />} file={wavFile} existingFile={existingWav}
                                    disabled={isFree} disabledLabel="Mejorar a Pro" disabledLink="/pricing"
                                    accept=".wav" onChange={(e: any) => setWavFile(validateFile(e.target.files?.[0] || null, ['wav'], 'WAV'))} />
                                <FileUploadZone id="stems-file" label="Trackouts (STEMS)" sublabel="ZIP de pistas individuales" color="emerald" hex="#10b981"
                                    icon={<Layers size={18} />} file={stemsFile} existingFile={existingStems}
                                    disabled={!isPremium} disabledLabel="Mejorar a Premium" disabledLink="/pricing"
                                    accept=".zip,.rar" onChange={(e: any) => setStemsFile(validateFile(e.target.files?.[0] || null, ['zip', 'rar'], 'Stems'))} />
                            </div>
                        </div>

                        {/* ─── SECTION 3: Contratos ─── */}
                        <div className={`bg-white/[0.02] dark:bg-black/20 border border-white/5 dark:border-white/10 rounded-[3rem] p-8 md:p-12 relative mb-12 group transition-all duration-700 shadow-xl shadow-black/5 dark:shadow-amber-500/[0.02] hover:shadow-2xl hover:shadow-amber-500/5 hover:border-amber-500/20 overflow-visible`}>
                            {/* FLOATING GEOMETRIC SHAPES & THUNDER FOR CONTRACTS */}
                            <div className="absolute inset-0 pointer-events-none overflow-hidden rounded-[3rem]">
                                {[...Array(3)].map((_, i) => (
                                    <motion.div key={`cont-shape-${i}`} className="absolute text-amber-500/5"
                                        style={{ top: `${15 + i * 25}%`, right: `${5 + i * 15}%` }}
                                        animate={{ y: [0, -15, 0], opacity: [0.03, 0.08, 0.03] }}
                                        transition={{ duration: 6 + i, repeat: Infinity }}>
                                        <Zap size={70 + i * 30} strokeWidth={0.5} />
                                    </motion.div>
                                ))}
                            </div>

                            <div className="flex items-center gap-6 mb-12">
                                <div className="w-16 h-16 bg-amber-500/10 border border-amber-500/20 rounded-[1.8rem] flex items-center justify-center text-amber-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <ShieldCheck size={28} />
                                </div>
                                <div>
                                    <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground leading-tight">¿Qué licencia tendrá activa este Beat?</h2>
                                    <p className="text-[10px] font-bold text-blue-500 uppercase tracking-[0.2em] mt-2 opacity-80">Configura los derechos y el precio de tu obra</p>
                                </div>
                            </div>

                            {/* License Cards Grid (2x3) */}
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 w-full" id="licenses-section">
                                {licenseRows.map((row) => {
                                    const meta = LICENSE_META[row.key];
                                    const isActive = row.active;
                                    const isLocked = row.locked;

                                    return (
                                        <div 
                                            key={row.key}
                                            className={`relative flex flex-col p-8 rounded-[2.5rem] border transition-all duration-500 overflow-hidden group/license animate-in fade-in slide-in-from-bottom-2 duration-700 bg-card dark:bg-black/30 ${isActive ? `border-white/10 shadow-2xl` : 'border-border/50 dark:border-white/5 shadow-lg shadow-black/20'}`}
                                            style={{ borderColor: isActive ? `${meta.hex}30` : undefined }}
                                        >
                                            {/* Static Glow Accent */}
                                            {isActive && (
                                                <div className="absolute -top-12 -right-12 w-32 h-32 blur-[60px] opacity-30 pointer-events-none"
                                                    style={{ background: meta.hex }} />
                                            )}

                                            {/* Header: Icon & Label */}
                                            <div className="flex items-center gap-4 mb-6">
                                                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center border transition-all duration-500 ${isActive ? 'rotate-0 shadow-lg' : '-rotate-6'}`}
                                                    style={{ 
                                                        background: isActive ? `${meta.hex}25` : `${meta.hex}10`, 
                                                        borderColor: isActive ? `${meta.hex}30` : `${meta.hex}20`, 
                                                        color: meta.hex,
                                                        boxShadow: isActive ? `0 10px 30px -10px ${meta.hex}40` : 'none',
                                                        opacity: isActive ? 1 : 0.8
                                                    }}>
                                                    {meta.icon}
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: meta.hex, opacity: isActive ? 1 : 0.8 }}>{meta.label}</p>
                                                    <p className="text-[11px] font-bold text-muted uppercase tracking-widest mt-1 opacity-80">{meta.desc}</p>
                                                </div>
                                                <Switch
                                                    active={isActive}
                                                    disabled={isLocked}
                                                    onChange={() => row.setActive(!isActive)}
                                                    activeColor={`bg-${meta.color}-500`}
                                                />
                                            </div>

                                            <div className="mt-auto space-y-4">
                                                {isLocked && (
                                                    <div className="flex flex-col gap-3 mb-2">
                                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20 backdrop-blur-md">
                                                            <div className="w-5 h-5 rounded-lg bg-rose-500/20 flex items-center justify-center text-rose-500 shrink-0">
                                                                <Lock size={10} />
                                                            </div>
                                                            <span className="text-[9px] font-black uppercase tracking-widest text-rose-500 leading-tight">
                                                                {row.lockReason}
                                                            </span>
                                                        </div>
                                                        {row.lockLink && (
                                                            <Link href={row.lockLink} className="flex items-center justify-center p-2 rounded-xl bg-background border border-border hover:bg-rose-500 text-muted hover:text-white transition-all duration-300">
                                                                <span className="text-[9px] font-black uppercase tracking-widest">Mejorar Plan →</span>
                                                            </Link>
                                                        )}
                                                    </div>
                                                )}
                                                
                                                <div className="relative">
                                                    <input
                                                        type="number"
                                                        value={row.price}
                                                        onChange={(e) => row.setPrice(e.target.value)}
                                                        disabled={!isActive || row.lockPrice}
                                                        className={`w-full bg-background dark:bg-black/40 border transition-all duration-500 rounded-2xl px-6 py-4 font-black text-lg outline-none focus:ring-4 focus:ring-blue-500/10 ${isActive ? 'border-border dark:border-white/20 text-foreground' : 'border-border/50 dark:border-white/5 text-muted cursor-not-allowed opacity-60'}`}
                                                        placeholder="Precio"
                                                    />
                                                    <div className="absolute right-6 top-1/2 -translate-y-1/2 pointer-events-none">
                                                        <span className="text-[10px] font-black uppercase tracking-widest text-muted">MXN</span>
                                                    </div>
                                                </div>
                                                {isActive && <PricePreview price={row.price} />}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}
                                className="mt-12 pt-8 border-t border-border flex flex-col md:flex-row items-center gap-6 group transition-all">
                                <div className="w-14 h-14 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500 shrink-0 shadow-inner group-hover:scale-110 transition-transform duration-500">
                                    <Info size={28} />
                                </div>
                                <div className="flex-1 text-center md:text-left">
                                    <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-1">Nota de Distribución y Licenciamiento</p>
                                    <p className="text-[11px] font-bold text-muted leading-relaxed uppercase tracking-wider opacity-60">
                                        Antes de actualizar, asegúrate de tener tus términos configurados en <Link href="/studio/licencias" className="text-blue-500 hover:underline underline-offset-4 decoration-blue-500/30">Tianguis Studio</Link>.
                                    </p>
                                </div>
                                <Link href="/studio/licencias" className="px-6 py-3 bg-blue-500/10 hover:bg-blue-500 text-blue-500 hover:text-white rounded-2xl text-[9px] font-black uppercase tracking-widest transition-all border border-blue-500/20 whitespace-nowrap">
                                    Ir al Studio →
                                </Link>
                            </motion.div>
                        </div>

                        {/* ─── SUBMIT ─── */}
                        <div className="flex flex-col items-center justify-center pb-16 mt-6 gap-6">
                            <button type="submit" disabled={isUploading || saving}
                                className="w-full sm:w-auto group relative px-16 py-5 rounded-2xl bg-blue-600 text-white text-[11px] font-black uppercase tracking-[0.4em] overflow-hidden hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-50 disabled:grayscale">
                                <span className="relative z-10 flex items-center justify-center gap-4">
                                    {isUploading || saving ? <><Loader2 className="animate-spin" size={18} /> Guardando...</> : <><Save size={18} /> Guardar Cambios</>}
                                </span>
                            </button>
                        </div>
                    </form>
                </div>
            </main>
        </div>
    );
}

