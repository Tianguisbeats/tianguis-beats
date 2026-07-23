"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Play, Pause, Heart, Share2, Music, Crown,
    CheckCircle2, ShoppingCart, Music2, Headphones, Calendar, ShieldCheck, MessageCircle, Send, X as CloseIcon, DollarSign, Loader2
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CommentSection from '@/components/CommentSection';
import Link from 'next/link';
import Image from 'next/image';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { Beat } from '@/lib/types';
import { MUSICAL_KEYS, MOODS, INSTRUMENTS } from '@/lib/constants';
import { getGlobalConfig, GlobalConfig } from '@/lib/config';
import { ParallaxBackground, FloatingParticles, SonicWaveBack, NoiseOverlay, useScrollProgress, ScrollReveal } from '@/components/ui/BackgroundEffects';
import { motion, AnimatePresence } from 'framer-motion';

interface BeatDetail extends Beat {
    productor_biografia?: string;
    productor_ciudad?: string;
    productor_pais?: string;
    fecha_creacion: string;
}

export default function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [selectedLicense, setSelectedLicense] = useState<'Gratis' | 'Básica' | 'Pro' | 'Premium' | 'Exclusiva' | null>(null);
    const [purchasedLicenses, setPurchasedLicenses] = useState<string[]>([]);
    
    const { scrollY } = useScrollProgress();
    const { currentBeat, isPlaying, playBeat, togglePlay, likedBeatIds, toggleLike: globalToggleLike, likesCounts } = usePlayer();
    const { currentUserId, addItem, setIsCartOpen } = useCart();
    const { showToast } = useToast();

    const [showOfferModal, setShowOfferModal] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const [offerMessage, setOfferMessage] = useState('');
    const [submittingOffer, setSubmittingOffer] = useState(false);
    const [config, setConfig] = useState<GlobalConfig | null>(null);

    useEffect(() => {
        getGlobalConfig().then(setConfig);
    }, []);

    const isThisBeatSelected = currentBeat?.id === id;
    const isThisBeatPlaying = isThisBeatSelected && isPlaying;
    const displayLikesCount = beat ? (likesCounts[id] ?? beat.conteo_likes ?? 0) : 0;
    const isLiked = likedBeatIds.has(id);

    // Cargar el Beat
    useEffect(() => {
        const fetchBeat = async () => {
            try {
                setLoading(true);
                setNotFound(false);
                const { data, error: fetchError } = await supabase.from('beats').select('*, productor:perfiles(*)').eq('id', id).single();
                if (fetchError || !data) { if (fetchError?.code === 'PGRST116') setNotFound(true); return; }

                const rawData = data as any;
                const producerObj = Array.isArray(rawData.productor) ? rawData.productor[0] : rawData.productor;

                let finalCoverUrl = data.portada_url || null;
                if (finalCoverUrl && !finalCoverUrl.startsWith('http')) finalCoverUrl = supabase.storage.from('portadas_beats').getPublicUrl(finalCoverUrl).data?.publicUrl || null;

                let finalProductorFoto = producerObj?.foto_perfil || null;
                if (finalProductorFoto && !finalProductorFoto.startsWith('http')) finalProductorFoto = supabase.storage.from('fotos_perfil').getPublicUrl(finalProductorFoto).data?.publicUrl || null;

                let muestraUrl = data.archivo_muestra_url || '';
                if (muestraUrl && !muestraUrl.startsWith('http')) muestraUrl = supabase.storage.from('muestras_beats').getPublicUrl(muestraUrl).data?.publicUrl || '';

                let previewMp3Url = data.archivo_mp3_url || '';
                if (previewMp3Url && !previewMp3Url.startsWith('http')) previewMp3Url = supabase.storage.from('muestras_beats').getPublicUrl(previewMp3Url).data?.publicUrl || '';

                const beatData: BeatDetail = {
                    ...rawData,
                    productor_nombre_artistico: producerObj?.nombre_artistico,
                    productor_nombre_usuario: producerObj?.nombre_usuario,
                    productor_foto_perfil: finalProductorFoto,
                    productor_esta_verificado: producerObj?.esta_verificado,
                    productor_es_fundador: producerObj?.es_fundador,
                    productor_nivel_suscripcion: producerObj?.nivel_suscripcion,
                    productor_biografia: producerObj?.biografia,
                    productor_ciudad: producerObj?.ciudad,
                    productor_pais: producerObj?.pais,
                    archivo_mp3_url: previewMp3Url,
                    archivo_muestra_url: muestraUrl,
                    portada_url: finalCoverUrl,
                };
                setBeat(beatData);

                if (!beatData.esta_vendido) {
                    if (beatData.es_gratis_activa) setSelectedLicense('Gratis');
                    else if (beatData.es_basica_activa || beatData.es_mp3_activa) setSelectedLicense('Básica');
                    else if (beatData.es_pro_activa) setSelectedLicense('Pro');
                    else if (beatData.es_premium_activa) setSelectedLicense('Premium');
                    else if (beatData.es_exclusiva_estandar_activa) setSelectedLicense('Exclusiva');
                }

                const userRes = await supabase.auth.getUser();
                if (userRes.data.user) {
                    const { data: purchases } = await supabase.from('transacciones').select('tipo_licencia').eq('comprador_id', userRes.data.user.id).eq('producto_id', data.id).eq('estado_pago', 'completado');
                    if (purchases) setPurchasedLicenses(purchases.map(p => p.tipo_licencia));
                }
            } finally { setLoading(false); }
        };
        if (id) fetchBeat();
    }, [id]);

    const handlePlay = () => { if (beat) { if (isThisBeatSelected) togglePlay(); else playBeat({ ...beat, product_type: 'beat' } as any); } };
    const handleAddToCart = () => {
        const isSoldOut = beat?.esta_vendido && config?.bloqueo_exclusivos;
        if (!beat || !selectedLicense || isSoldOut) return;
        addItem({ id: `${beat.id}-${selectedLicense}`, type: 'beat', name: `${beat.titulo} [${selectedLicense}]`, price: getSelectedPrice(), image: beat.portada_url || undefined, subtitle: `Prod. by ${beat.productor_nombre_artistico || beat.productor_nombre_usuario}`, metadata: { licenseType: selectedLicense, beatId: beat.id, productor_id: beat.productor_id } });
        setIsCartOpen(true);
    };
    const handleLike = async () => { if (!currentUserId) { showToast('Inicia sesión para dar like', 'info'); return; } await globalToggleLike(id, 'beat'); };
    const handleShare = () => { if (navigator.share) navigator.share({ title: beat?.titulo, url: window.location.href }); else { navigator.clipboard.writeText(window.location.href); showToast('Enlace copiado', 'success'); } };
    const getSelectedPrice = () => { const map: any = { 'Gratis': beat?.precio_gratis_mxn || 0, 'Básica': beat?.precio_basica_mxn || 349, 'Pro': beat?.precio_pro_mxn || 599, 'Premium': beat?.precio_premium_mxn || 999, 'Exclusiva': beat?.precio_exclusiva_estandar_mxn || 3500, 'Exclusiva Premium': beat?.precio_exclusiva_premium_mxn || 7500 }; return map[selectedLicense || 'Básica'] || 0; };
    const getMoodDisplay = (val: string) => { const m = MOODS.find(x => x.value.toLowerCase() === val.trim().toLowerCase() || x.label.toLowerCase() === val.trim().toLowerCase()); return m ? `${m.emoji} ${m.label}` : val; };
    const getInstrumentDisplay = (val: string) => { const i = INSTRUMENTS.find(x => x.value.toLowerCase() === val.trim().toLowerCase() || x.label.toLowerCase() === val.trim().toLowerCase()); return i ? `${i.emoji} ${i.label}` : val; };

    if (loading) return <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4"><div className="w-16 h-16 rounded-full border-[3px] border-blue-500/20 border-t-blue-500 animate-spin" /><p className="text-[9px] font-black uppercase tracking-[0.3em] text-blue-500">Cargando beat</p></div>;
    if (notFound || !beat) return <div className="min-h-screen bg-background flex flex-col items-center justify-center text-center p-10 gap-6"><h2 className="text-xl font-black uppercase text-foreground">Beat no encontrado</h2><Link href="/beats" className="px-8 py-4 rounded-2xl bg-blue-600 text-white text-[10px] font-black uppercase">Ver Catálogo</Link></div>;

    const producerName = beat.productor_nombre_artistico || beat.productor_nombre_usuario || 'Productor';
    const tonalidad = MUSICAL_KEYS.find(k => k.value === beat.tono_escala)?.label || beat.tono_escala || '—';
    const licenses = [
        beat.es_gratis_activa && { type: 'Gratis' as const, label: 'Gratis / Demo', price: beat.precio_gratis_mxn || 0, color: '#64748b' },
        (beat.es_basica_activa || beat.es_mp3_activa) && { type: 'Básica' as const, label: 'Licencia MP3', price: beat.precio_basica_mxn || 349, color: '#10b981' },
        beat.es_pro_activa && { type: 'Pro' as const, label: 'Licencia Pro', price: beat.precio_pro_mxn || 599, color: '#3b82f6' },
        beat.es_premium_activa && { type: 'Premium' as const, label: 'Licencia Premium', price: beat.precio_premium_mxn || 999, color: '#f59e0b' },
        !beat.esta_vendido && beat.es_exclusiva_estandar_activa && { type: 'Exclusiva' as const, label: 'Exclusiva Estándar', price: beat.precio_exclusiva_estandar_mxn || 3500, color: '#f43f5e' },
        !beat.esta_vendido && beat.es_exclusiva_premium_activa && { type: 'Exclusiva Premium' as const, label: 'Exclusiva Premium', price: beat.precio_exclusiva_premium_mxn || 7500, color: '#a855f7' },
    ].filter(Boolean) as any[];
    const selectedLicenseData = licenses.find(l => l.type === selectedLicense);

    const getPlayButtonContent = () => {
        if (isThisBeatPlaying) return { text: 'Reproduciendo', icon: <Pause size={14} fill="currentColor" />, color: 'bg-blue-600' };
        if (isThisBeatSelected && !isPlaying) return { text: 'Pausado', icon: <Play size={14} className="ml-1" fill="currentColor" />, color: 'bg-amber-500' };
        return { text: 'Reproducir', icon: <Play size={14} className="ml-1" fill="currentColor" />, color: 'bg-blue-600' };
    };

    const handleSubmitOffer = async () => {
        if (!currentUserId) { showToast('Inicia sesión para negociar', 'info'); return; }
        if (!offerAmount || parseFloat(offerAmount) <= 0) { showToast('Ingresa un monto válido', 'warning'); return; }
        
        setSubmittingOffer(true);
        try {
            const { data: nuevaOferta, error } = await supabase.from('ofertas_exclusivas').insert({
                beat_id: id,
                productor_id: beat?.productor_id,
                comprador_id: currentUserId,
                monto_ofertado: parseFloat(offerAmount),
                mensaje_comprador: offerMessage,
                estado: 'pendiente'
            }).select('id').single();

            if (error) throw error;

            // Avisar al productor por correo (best-effort; la notificación en vivo
            // ya se dispara por el trigger de la BD).
            if (nuevaOferta?.id) {
                try {
                    const { data: { session } } = await supabase.auth.getSession();
                    if (session) {
                        fetch('/api/negociacion/notificar', {
                            method: 'POST',
                            headers: {
                                'Content-Type': 'application/json',
                                Authorization: `Bearer ${session.access_token}`,
                            },
                            body: JSON.stringify({ ofertaId: nuevaOferta.id }),
                        }).catch(() => {});
                    }
                } catch { /* el correo es secundario */ }
            }

            showToast('Oferta enviada al productor', 'success');
            setShowOfferModal(false);
            setOfferAmount('');
            setOfferMessage('');
        } catch (err: any) {
            showToast(err.message || 'Error al enviar oferta', 'error');
        } finally {
            setSubmittingOffer(false);
        }
    };
    const pb = getPlayButtonContent();

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-blue-500">
            <Navbar />
            <NoiseOverlay />
            {/* Heavy effects — desktop only for mobile performance */}
            <div className="hidden md:block fixed inset-0 pointer-events-none z-0">
                <SonicWaveBack theme="blue" opacity={0.6} />
                {beat.portada_url && <div className="absolute inset-0 bg-cover bg-center blur-[120px] scale-125 opacity-20 dark:opacity-10" style={{ backgroundImage: `url(${beat.portada_url})` }} />}
            </div>
            <div className="hidden md:block">
                <ParallaxBackground scrollY={scrollY} />
                <FloatingParticles />
            </div>

            {/* HERO */}
            <section className="relative pt-24 pb-20 mt-10 overflow-hidden">
                <div className="absolute inset-0 pointer-events-none select-none overflow-hidden hidden md:block">
                    <motion.span initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ duration: 1.5 }}
                        className="absolute top-[10%] right-[-5%] text-[20vw] font-black text-foreground/[0.04] uppercase rotate-6 block whitespace-nowrap">
                        {beat.titulo}
                    </motion.span>
                </div>

                <div className="max-w-[1700px] mx-auto px-6 sm:px-12 relative z-10">
                    <div className="flex flex-col lg:flex-row items-center lg:items-center gap-8 md:gap-16 lg:gap-24">
                        <ScrollReveal direction="right" delay={0.2}>
                            <div className="flex flex-col items-center gap-6">
                                <div className="relative group">
                                    <div className="relative w-[260px] sm:w-[300px] md:w-[450px] aspect-square rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_30px_60px_rgba(0,0,0,0.3)] md:shadow-[0_50px_100px_rgba(0,0,0,0.4)] border-2 border-foreground/5 transition-transform duration-700">
                                        {beat.portada_url ? <Image src={beat.portada_url} alt="" fill sizes="(max-width: 640px) 260px, (max-width: 768px) 300px, 450px" priority className="object-cover" /> : <div className="w-full h-full bg-zinc-900 flex items-center justify-center"><Music2 size={100} className="text-foreground/5" /></div>}
                                    </div>
                                    <div className="absolute -inset-6 z-[-1] rounded-[4rem] blur-[80px] opacity-10 bg-blue-600/20" />
                                    <motion.div animate={{ rotate: [0, 5, 0], x: [0, 8, 0] }} transition={{ duration: 10, repeat: Infinity }} className="absolute -top-4 -right-4 w-24 h-24 border-2 border-blue-500/20 rounded-3xl z-[-1]" />
                                </div>
                                <button onClick={handlePlay} className={`group flex items-center gap-4 px-8 py-3.5 rounded-full transition-all duration-500 shadow-xl ${pb.color} text-white hover:scale-105 active:scale-95`}>
                                    <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">{pb.icon}</div>
                                    <span className="font-black text-[10px] uppercase tracking-[0.2em]">{pb.text}</span>
                                </button>
                            </div>
                        </ScrollReveal>

                        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left">
                            <ScrollReveal direction="up" delay={0.1}>
                                <div className="flex flex-col items-center lg:items-start gap-6">
                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-3">
                                            <span className="relative flex h-2 w-2"><span className="animate-ping absolute inset-0 rounded-full bg-blue-500 opacity-75" /><span className="relative h-2 w-2 rounded-full bg-blue-500" /></span>
                                            <span className="text-[10px] font-black uppercase tracking-[0.6em] text-blue-500">Tianguis Original</span>
                                        </div>
                                        <div className="h-4 w-px bg-foreground/10 hidden md:block" />
                                        <div className="flex items-center gap-3">
                                            <button onClick={handleLike} className={`group flex items-center justify-center gap-2 h-10 px-5 rounded-xl border transition-all ${isLiked ? 'bg-red-500 border-transparent text-white' : 'bg-foreground/5 border-foreground/10 text-foreground/40 hover:text-red-500 hover:bg-red-500/5'}`}>
                                                <Heart size={16} fill={isLiked ? 'currentColor' : 'none'} className="group-hover:scale-110 transition-transform" />
                                                {displayLikesCount > 0 && <span className="text-[10px] font-black">{displayLikesCount}</span>}
                                            </button>
                                            <button onClick={handleShare} className="w-10 h-10 flex items-center justify-center rounded-xl border border-foreground/10 bg-foreground/5 text-foreground/40 hover:text-blue-500 hover:bg-blue-500/5 transition-all outline-none"><Share2 size={16} /></button>
                                        </div>
                                    </div>
                                    
                                    <h1 className="text-4xl sm:text-5xl md:text-8xl lg:text-[7rem] xl:text-[8rem] font-black uppercase tracking-tighter leading-[0.9] w-full">
                                        <span className="inline-block break-words text-transparent bg-clip-text bg-gradient-to-r from-foreground via-foreground to-foreground/70 drop-shadow-[0_10px_30px_rgba(59,130,246,0.15)]">
                                            {beat.titulo}
                                        </span>
                                    </h1>

                                    <div className="flex flex-col md:flex-row items-center gap-12 w-full lg:w-auto">
                                        <Link href={`/${beat.productor_nombre_usuario}`} className="flex flex-col md:flex-row items-center gap-6 group/prod">
                                            <div className={`relative w-16 h-16 rounded-[1.8rem] overflow-hidden border-2 transition-all ${beat.productor_nivel_suscripcion === 'premium' ? 'border-blue-500 shadow-[0_0_20px_rgba(59,130,246,0.2)]' : beat.productor_es_fundador ? 'border-amber-400' : 'border-foreground/10'}`}>
                                                {beat.productor_foto_perfil ? <Image src={beat.productor_foto_perfil} fill sizes="64px" className="object-cover" alt="" /> : <div className="w-full h-full bg-zinc-800" />}
                                            </div>
                                            <div className="flex flex-col items-center md:items-center text-center">
                                                <div className="flex items-center gap-2">
                                                    <p className="font-black text-3xl uppercase tracking-tighter text-foreground group-hover/prod:text-blue-500 transition-colors uppercase">{producerName}</p>
                                                    {beat.productor_esta_verificado && <CheckCircle2 size={18} className="text-blue-500" />}
                                                </div>
                                                <div className="flex items-center gap-4 mt-1.5 text-[10px] font-black uppercase tracking-[0.2em] text-foreground/30">
                                                    <span className="flex items-center gap-1.5"><Headphones size={12} className="opacity-50" /> {beat.conteo_reproducciones || 0}</span>
                                                    <div className="w-1 h-1 rounded-full bg-foreground/10" />
                                                    <span className="flex items-center gap-1.5"><Calendar size={12} className="opacity-50" /> {new Date(beat.fecha_creacion).getFullYear()}</span>
                                                </div>
                                            </div>
                                        </Link>

                                        <div className="h-12 w-px bg-foreground/10 hidden lg:block" />

                                        <div className="flex flex-col items-center lg:items-start gap-5 pt-8">
                                            <div className="text-center lg:text-left">
                                                <p className="text-[8px] font-black uppercase tracking-[0.4em] text-foreground/20 mb-1.5">Metadatos del Beat</p>
                                                <p className="font-black text-xl text-foreground uppercase tracking-tight flex items-center gap-4">
                                                    {beat.bpm || '—'} BPM 
                                                    <span className="text-foreground/10 h-4 w-px block" /> 
                                                    {tonalidad}
                                                </p>
                                            </div>
                                            <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2">
                                                {beat.vibras && beat.vibras.split(',').map((tag: any, i: number) => (
                                                    <span key={`vibe-${i}`} className="px-3 py-1.5 rounded-lg bg-blue-500/5 border border-blue-500/10 text-[8px] font-black uppercase tracking-widest text-blue-400">
                                                        {getMoodDisplay(tag)}
                                                    </span>
                                                ))}
                                                {beat.instrumentos && beat.instrumentos.map((inst, i) => (
                                                    <span key={`inst-${i}`} className="px-3 py-1.5 rounded-lg bg-emerald-500/5 border border-emerald-500/10 text-[8px] font-black uppercase tracking-widest text-emerald-500">
                                                        {getInstrumentDisplay(inst)}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>
                {/* Audio Animation Removed per user request to avoid lag */}
            </section>

            <main className="relative z-10 bg-background border-t border-foreground/5">
                <div className="max-w-[1700px] mx-auto px-4 sm:px-12 py-10 md:py-24">
                    <div className="grid lg:grid-cols-[1fr_400px] gap-10 md:gap-20 items-start">
                        <div className="space-y-10 md:space-y-20">
                            <div className="space-y-4 md:space-y-8">
                                <h4 className="text-[10px] font-black uppercase tracking-[0.5em] text-blue-500">Descripción del Beat</h4>
                                <p className="text-lg md:text-3xl font-medium text-foreground/60 leading-relaxed italic max-w-5xl">"{beat.descripcion || 'Sin descripción detallada disponible.'}"</p>
                            </div>

                            <div className="pt-10 md:pt-20 border-t border-foreground/5">
                                <div className="flex items-center gap-4 mb-12">
                                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                                    <h3 className="text-2xl font-black uppercase tracking-tighter">Comentarios</h3>
                                </div>
                                <div className="bg-foreground/[0.01] border border-foreground/5 rounded-[2rem] md:rounded-[4rem] p-5 md:p-10 backdrop-blur-3xl">
                                    <CommentSection beatId={id} />
                                </div>
                            </div>
                        </div>

                        <aside className="lg:sticky lg:top-32 space-y-6 md:space-y-10">
                            <div className="bg-foreground/[0.02] border border-foreground/10 rounded-[2rem] md:rounded-[4rem] p-6 md:p-10 backdrop-blur-2xl shadow-xl">
                                <div className="flex items-center gap-3 mb-10">
                                    <ShieldCheck size={20} className="text-blue-500" />
                                    <h3 className="font-black text-[10px] uppercase tracking-[0.3em] text-foreground">Licencias Disponibles</h3>
                                </div>
                                <div className="space-y-3 mb-10">
                                    {licenses.map(lic => (
                                        <button
                                            key={lic.type}
                                            onClick={() => setSelectedLicense(lic.type)}
                                            className={`w-full text-left p-4 md:p-6 rounded-[1.5rem] md:rounded-[3rem] border transition-all ${selectedLicense === lic.type ? 'border-transparent text-white ring-2 ring-blue-500/50' : 'bg-foreground/[0.03] border-foreground/5 hover:border-blue-500/20'}`}
                                            style={selectedLicense === lic.type ? { background: lic.color, boxShadow: `0 20px 40px ${lic.color}30` } : {}}
                                        >
                                            <div className="flex justify-between items-center text-current">
                                                <div>
                                                    <p className={`text-[8px] font-black uppercase tracking-widest mb-1 ${selectedLicense === lic.type ? 'text-white/60' : 'text-foreground/20'}`}>{lic.type}</p>
                                                    <h4 className="font-black text-xs uppercase">{lic.label}</h4>
                                                </div>
                                                <p className="text-lg font-black">${lic.price}</p>
                                            </div>
                                        </button>
                                    ))}
                                </div>

                                {selectedLicense === 'Exclusiva' && beat && !beat.esta_vendido && (
                                    <button 
                                        onClick={() => setShowOfferModal(true)}
                                        className="w-full py-5 rounded-[3rem] border-2 border-emerald-500/30 text-emerald-500 font-black text-[10px] uppercase tracking-[0.3em] hover:bg-emerald-500 hover:text-white transition-all flex items-center justify-center gap-3 mb-4 group/offer"
                                    >
                                        <MessageCircle size={18} className="group-hover:scale-110 transition-transform" /> Hacer Oferta
                                    </button>
                                )}

                                <button onClick={handleAddToCart} className="w-full py-6 rounded-[3rem] font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 transition-all hover:scale-105 active:scale-95 shadow-2xl text-white" style={{ background: selectedLicenseData ? selectedLicenseData.color : '#333', boxShadow: selectedLicenseData ? `0 20px 50px ${selectedLicenseData.color}40` : 'none' }}>
                                    <ShoppingCart size={18} /> 
                                    {selectedLicense === 'Exclusiva' ? 'Comprar ahora' : 'Agregar al Carrito'}
                                </button>
                                <p className="text-[8px] font-black uppercase tracking-widest text-foreground/10 text-center mt-6">Pagos seguros vía Stripe</p>
                            </div>
                        </aside>
                    </div>
                </div>
            </main>

            <AnimatePresence>
                {showOfferModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowOfferModal(false)} className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
                        <motion.div initial={{ scale: 0.9, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 30 }} className="relative w-full max-w-xl bg-[#0a0a0a] border border-white/10 rounded-[4rem] p-10 overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[100px] rounded-full -mr-32 -mt-32" />
                            
                            <div className="relative z-10">
                                <div className="flex justify-between items-start mb-10">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-emerald-500/10 rounded-2xl flex items-center justify-center text-emerald-500">
                                            <MessageCircle size={24} />
                                        </div>
                                        <div>
                                            <h3 className="text-2xl font-black uppercase tracking-tighter">Hacer Oferta</h3>
                                            <p className="text-[9px] font-black text-muted uppercase tracking-widest opacity-50">Licencia Exclusiva • {beat.titulo}</p>
                                        </div>
                                    </div>
                                    <button onClick={() => setShowOfferModal(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"><CloseIcon size={18} /></button>
                                </div>

                                <div className="space-y-8">
                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">¿Cuánto ofreces por este beat?</label>
                                        <div className="relative">
                                            <span className="absolute left-6 top-1/2 -translate-y-1/2 text-2xl font-black text-emerald-500">$</span>
                                            <input 
                                                type="number" 
                                                value={offerAmount}
                                                onChange={(e) => setOfferAmount(e.target.value)}
                                                className="w-full bg-white/5 border border-white/5 rounded-3xl py-6 pl-12 pr-6 text-3xl font-black text-white focus:outline-none focus:border-emerald-500/50 transition-all"
                                                placeholder="0.00"
                                            />
                                            <span className="absolute right-6 top-1/2 -translate-y-1/2 text-[10px] font-black text-muted uppercase tracking-widest">MXN</span>
                                        </div>
                                    </div>

                                    <div className="space-y-3">
                                        <label className="text-[10px] font-black uppercase tracking-widest text-muted px-2">Mensaje al Productor (Opcional)</label>
                                        <textarea 
                                            value={offerMessage}
                                            onChange={(e) => setOfferMessage(e.target.value)}
                                            className="w-full bg-white/5 border border-white/5 rounded-3xl p-6 text-xs font-medium text-white/70 focus:outline-none focus:border-emerald-500/50 transition-all min-h-[120px] resize-none"
                                            placeholder="Ej: Me gustaría negociar este beat para mi próximo álbum..."
                                        />
                                    </div>

                                    <button 
                                        onClick={handleSubmitOffer}
                                        disabled={submittingOffer}
                                        className="w-full py-6 rounded-3xl bg-emerald-500 text-white font-black text-[10px] uppercase tracking-[0.3em] flex items-center justify-center gap-4 hover:bg-emerald-600 transition-all shadow-2xl shadow-emerald-500/20 active:scale-95 disabled:opacity-50"
                                    >
                                        {submittingOffer ? <Loader2 className="animate-spin" size={20} /> : <Send size={20} />}
                                        Enviar Oferta
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
            <Footer />
        </div>
    );
}
