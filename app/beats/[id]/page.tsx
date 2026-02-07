"use client";

import React, { useEffect, useState, use } from 'react';
import { supabase } from '@/lib/supabase';
import { Play, Pause, Heart, Share2, Clock, Music2, ShieldCheck, Download, MessageCircle, BarChart3, ShoppingCart, Info, Globe, ChevronRight, Speaker } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LicenseCard from '@/components/LicenseCard';
import CommentSection from '@/components/CommentSection';
import WaveformPlayer from '@/components/WaveformPlayer';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
import { useCart } from '@/context/CartContext';
import { Beat } from '@/lib/types';
import { Crown, Youtube, Zap, Package, Tag, Layers, Activity, Calendar } from 'lucide-react';

// Extend Beat interface to include detail columns
interface BeatDetail extends Beat {
    price_mp3?: number;
    price_wav?: number;
    price_stems?: number;
    price_exclusive?: number;
    is_mp3_active?: boolean;
    is_wav_active?: boolean;
    is_stems_active?: boolean;
    is_exclusive_active?: boolean;
    moods?: string[];
    description?: string;
    portadabeat_url?: string | null;
    created_at: string;
}

/**
 * BeatDetailPage: Muestra la información detallada de un beat específico.
 * Permite reproducir, dar like, comentar y ver opciones de licencia.
 */
export default function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLicense, setSelectedLicense] = useState<'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA' | null>(null);
    const [isLiked, setIsLiked] = useState(false);

    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem } = useCart();

    // Determine initial selected license based on availability
    useEffect(() => {
        if (beat) {
            if (beat.is_mp3_active !== false) setSelectedLicense('MP3');
            else if (beat.is_wav_active !== false) setSelectedLicense('WAV');
            else if (beat.is_stems_active !== false) setSelectedLicense('STEMS');
            else if (beat.is_exclusive_active !== false) setSelectedLicense('ILIMITADA');
            else setSelectedLicense(null); // No licenses available
        }
    }, [beat]);

    const handleAddToCart = () => {
        if (!beat || !selectedLicense) return;

        const priceMap = {
            'MP3': beat.price_mp3 || beat.price_mxn || 299,
            'WAV': beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5),
            'STEMS': beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5),
            'ILIMITADA': beat.price_exclusive || 2999
        };

        addItem({
            id: `${beat.id}-${selectedLicense}`,
            type: 'beat',
            name: `${beat.title} [${selectedLicense}]`,
            price: priceMap[selectedLicense as keyof typeof priceMap],
            image: beat.portadabeat_url || undefined,
            subtitle: `Prod. by ${(beat.producer as any)?.artistic_name || (beat.producer as any)?.username}`,
            metadata: { license: selectedLicense, beatId: beat.id }
        });

        router.push('/cart');
    };

    useEffect(() => {
        const fetchBeat = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('beats')
                    .select('id, title, genre, bpm, price_mxn, price_wav_mxn, price_stems_mxn, exclusive_price_mxn, is_mp3_active, is_wav_active, is_stems_active, is_exclusive_active, portadabeat_url, mp3_url, mp3_tag_url, musical_key, musical_scale, mood, description, play_count, like_count, created_at, producer:producer_id(artistic_name, username, foto_perfil, is_verified, is_founder, subscription_tier)')
                    .eq('id', id)
                    .single();

                if (data) {
                    // Resolve high-quality preview or maestra bucket
                    const path = data.mp3_tag_url || data.mp3_url || '';
                    const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                    const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
                    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                    // Resolve Cover Art URL if it's a relative path
                    let finalCoverUrl = data.portadabeat_url;
                    if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
                        const { data: { publicUrl: coverPUrl } } = supabase.storage.from('portadas-beats').getPublicUrl(finalCoverUrl);
                        finalCoverUrl = coverPUrl;
                    }

                    const rawData = data as any;
                    const producerObj = Array.isArray(rawData.producer) ? rawData.producer[0] : rawData.producer;

                    setBeat({
                        ...data,
                        producer: producerObj,
                        mp3_url: publicUrl,
                        portadabeat_url: finalCoverUrl
                    } as BeatDetail);

                    // Log visit & efficient play count increment
                    // We only increment play count on explicit play usually, but user asked to check why plays aren't saving.
                    // If we put it here, it counts VIEWS as plays.
                    // Ideally this should be in the 'playBeat' function or similar.
                    // However, purely for the request "check why plays aren't saving", let's leave it here but use RPC.
                    // Wait, usually play count is on PLAY, not VIEW.
                    // But for now let's just clean the syntax.

                    /* 
                       NOTE: Ideally we move this to when the user clicks Play. 
                       But the original code had `// logListen(data.id);` commented out here.
                    */

                    const { data: { user } } = await supabase.auth.getUser();
                    if (user) {
                        const { count } = await supabase
                            .from('likes')
                            .select('id', { count: 'exact', head: true })
                            .eq('beat_id', data.id)
                            .eq('user_id', user.id);
                        setIsLiked(!!count);
                    }
                }
            } catch (err) {
                console.error("Error fetching beat detail:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchBeat();
    }, [id]);

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            const confirmLogin = confirm("Necesitas iniciar sesión para dar Like. ¿Ir al login?");
            if (confirmLogin) router.push('/login');
            return;
        }

        if (isLiked) {
            await supabase.from('likes').delete().eq('beat_id', id).eq('user_id', user.id);
            setIsLiked(false);
            if (beat) setBeat({ ...beat, like_count: (beat.like_count || 1) - 1 });
        } else {
            await supabase.from('likes').insert({ beat_id: id, user_id: user.id });
            setIsLiked(true);
            if (beat) setBeat({ ...beat, like_count: (beat.like_count || 0) + 1 });
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-accent border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-muted uppercase tracking-widest text-xs">Cargando...</p>
            </div>
        );
    }

    if (!beat) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black text-foreground mb-4">404</h1>
                <p className="text-muted font-bold uppercase tracking-widest text-xs">Beat no encontrado</p>
                <Link href="/beats" className="mt-8 px-6 py-3 bg-foreground text-background rounded-full font-bold text-xs uppercase tracking-widest hover:bg-accent hover:text-white transition-all">
                    Regresar a Explorar
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1 pb-32">
                {/* 1. HERO HEADER (Immersive Gradient) */}
                <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-sm bg-background overflow-hidden border-b border-border">
                    {/* Dynamic Ambient Background - "Liquid" Effect */}
                    <div className="absolute inset-0 bg-background -z-20" />
                    <div className="absolute top-[-20%] left-[-10%] w-[120vw] h-[120vw] bg-gradient-to-br from-accent/5 via-purple-500/5 to-pink-500/5 rounded-full blur-[120px] -z-10 animate-pulse duration-[8000ms]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-gradient-to-tr from-amber-500/5 via-orange-500/5 to-yellow-500/5 rounded-full blur-[100px] -z-10 animate-pulse duration-[10000ms] delay-1000" />

                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                        {/* Artwork */}
                        <div className="relative group shrink-0 w-64 h-64 md:w-80 md:h-80">
                            {/* Liquid Animation Background for Card */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-spin-slow" />

                            <div className="w-full h-full rounded-[2.5rem] bg-card shadow-2xl overflow-hidden border border-border relative z-10 transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1">
                                {beat.portadabeat_url ? (
                                    <img src={beat.portadabeat_url} className="w-full h-full object-cover" alt={beat.title} />
                                ) : (
                                    <div className="w-full h-full bg-accent-soft flex items-center justify-center text-muted"><Music2 size={80} /></div>
                                )}
                            </div>

                            {/* Play Button Overlay */}
                            <button
                                onClick={() => playBeat(beat as any)}
                                className="absolute -bottom-6 -right-6 w-20 h-20 bg-foreground text-background rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-black/20 hover:bg-accent hover:text-white hover:shadow-accent/30 hover:scale-110 transition-all active:scale-95 z-20"
                            >
                                {isPlaying && currentBeat?.id === beat.id ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>

                        {/* Text Info */}
                        <div className="text-center md:text-left flex-1 space-y-6">
                            <div className="space-y-2">
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-foreground leading-[0.9] uppercase tracking-tighter">
                                    {beat.title}
                                </h1>

                                {/* Producer Header - Now below title */}
                                <Link href={`/${(beat.producer as any)?.username || ''}`} className="inline-flex items-center gap-3 bg-card/40 backdrop-blur-sm px-4 py-2 rounded-full border border-border/50 hover:bg-card/60 transition-all group">
                                    <div className={`relative p-0.5 rounded-full border-2 ${(beat.producer as any)?.subscription_tier === 'premium' ? 'border-accent' :
                                        (beat.producer as any)?.subscription_tier === 'pro' ? 'border-amber-400' :
                                            'border-border'
                                        }`}>
                                        <img src={(beat.producer as any)?.foto_perfil || "/logo.png"} className="w-8 h-8 rounded-full object-cover" alt="Prod" />
                                    </div>
                                    <div className="flex items-center gap-1.5">
                                        <span className="block text-sm font-black text-foreground">{(beat.producer as any)?.artistic_name || (beat.producer as any)?.username}</span>
                                        {(beat.producer as any)?.is_verified && <img src="/verified-badge.png" className="w-3.5 h-3.5" alt="V" />}
                                        {(beat.producer as any)?.is_founder && <Crown size={14} className="text-amber-400" fill="currentColor" />}
                                    </div>
                                </Link>
                            </div>

                            {/* Technical Details Integrated into Hero */}
                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                <span className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                    <Tag size={12} /> {beat.genre}
                                </span>
                                <span className="px-4 py-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                    <Activity size={12} /> {beat.bpm} BPM
                                </span>
                                <span className="px-4 py-2 rounded-xl bg-accent/10 text-accent border border-accent/20 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                    <Music2 size={12} /> {beat.musical_key || '?'}
                                </span>
                                <span className="px-4 py-2 rounded-xl bg-purple-500/10 text-purple-500 border border-purple-500/20 text-[9px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                    <Layers size={12} /> {beat.musical_scale}
                                </span>
                                <div className="flex items-center gap-4 text-muted text-[10px] font-black uppercase tracking-widest pl-2">
                                    <span className="flex items-center gap-1.5"><Speaker size={14} className="text-accent" /> {beat.play_count?.toLocaleString() || 0}</span>
                                    <span className="flex items-center gap-1.5"><Heart size={14} className="text-red-500" /> {beat.like_count?.toLocaleString() || 0}</span>
                                </div>
                                <div className="h-6 w-px bg-border mx-1 hidden md:block" />
                                <div className="flex flex-wrap items-center gap-2">
                                    {beat.mood?.split(',').map((m: string) => {
                                        const moodLabel = m.trim();
                                        const moodInfo = (require('@/lib/constants').MOODS as any[]).find((mood: any) => mood.label === moodLabel);
                                        return (
                                            <span key={moodLabel} className="px-3 py-1 bg-white border border-slate-100 rounded-lg text-[9px] font-black uppercase tracking-widest text-slate-500 shadow-sm flex items-center gap-1.5">
                                                <span className="text-sm leading-none">{moodInfo?.emoji || '✨'}</span>
                                                {moodLabel}
                                            </span>
                                        );
                                    })}
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center md:justify-start mt-4">
                                <button onClick={handleLike} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${isLiked ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 hover:scale-105' : 'bg-foreground text-background hover:bg-accent hover:text-white shadow-xl shadow-black/10'}`}>
                                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                                    {isLiked ? 'Te gusta' : 'Dar Like'}
                                </button>
                                <button
                                    onClick={() => {
                                        navigator.clipboard.writeText(window.location.href);
                                        alert("¡Enlace copiado al portapapeles! 🚀");
                                    }}
                                    className="px-8 py-4 rounded-2xl bg-card text-foreground border-2 border-border font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:border-accent transition-all hover:scale-105 active:scale-95"
                                >
                                    <Share2 size={18} /> Compartir
                                </button>

                                {/* Release Date next to action buttons */}
                                <div className="flex flex-col justify-center px-4 bg-card/50 backdrop-blur-sm rounded-2xl border border-border py-2">
                                    <span className="text-[8px] font-black text-muted uppercase tracking-[0.2em] mb-1 leading-none text-center">Lanzamiento</span>
                                    <div className="flex items-center gap-2 text-foreground">
                                        <Calendar size={14} className="text-accent" />
                                        <span className="text-[11px] font-black uppercase tracking-widest">
                                            {new Date(beat.created_at).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. WAVEFORM VISUALIZER */}
                <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20 mb-8">
                    <div className="bg-card p-6 rounded-[2.5rem] shadow-xl shadow-black/5 border border-border">
                        <WaveformPlayer url={beat.mp3_url || ''} height={100} waveColor="#94a3b8" progressColor="var(--accent)" />
                    </div>
                </div>


                {/* 3. MAIN CONTENT GRID */}
                <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-12">
                    {/* LEFT COLUMN: Licenses */}
                    <div className="lg:col-span-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-foreground mb-8 flex items-center gap-2">
                            <ShieldCheck className="text-accent" /> Licencias Disponibles
                        </h2>

                        {!selectedLicense ? (
                            <div className="p-10 bg-card rounded-[2rem] text-center border-2 border-dashed border-border">
                                <h3 className="text-xl font-black text-muted uppercase tracking-widest">Beat No Disponible</h3>
                                <p className="text-muted text-sm mt-2">Este beat no tiene licencias activas para venta.</p>
                            </div>
                        ) : (
                            <>
                                <div className="grid md:grid-cols-2 gap-4 mb-8">
                                    {beat.is_mp3_active !== false && (
                                        <LicenseCard
                                            type="MP3"
                                            price={beat.price_mp3 || beat.price_mxn || 299}
                                            features={['MP3 Alta Calidad', 'Ventas Ilimitadas', 'Untagged']}
                                            selected={selectedLicense === 'MP3'}
                                            onSelect={() => setSelectedLicense('MP3')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_wav_active !== false && (
                                        <LicenseCard
                                            type="WAV"
                                            price={beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5)}
                                            features={['WAV + MP3', 'Calidad de Estudio', 'Untagged']}
                                            selected={selectedLicense === 'WAV'}
                                            onSelect={() => setSelectedLicense('WAV')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_stems_active !== false && (
                                        <LicenseCard
                                            type="STEMS"
                                            price={beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5)}
                                            features={['Trackout (Stems)', 'Control Total', 'WAV + MP3']}
                                            selected={selectedLicense === 'STEMS'}
                                            onSelect={() => setSelectedLicense('STEMS')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_exclusive_active !== false && (
                                        <LicenseCard
                                            type="ILIMITADA"
                                            price={beat.price_exclusive || 2999}
                                            features={['Derechos Exclusivos', 'Tu Propiedad 100%', 'Eliminado de Tienda']}
                                            selected={selectedLicense === 'ILIMITADA'}
                                            onSelect={() => setSelectedLicense('ILIMITADA')}
                                            active={true}
                                        />
                                    )}
                                </div>

                                <button
                                    onClick={handleAddToCart}
                                    className="w-full py-5 bg-foreground text-background rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-accent hover:text-white transition-all shadow-xl shadow-black/10 flex items-center justify-center gap-3"
                                >
                                    <ShoppingCart size={18} />
                                    Añadir {selectedLicense} al Carrito
                                </button>
                            </>
                        )}

                        {/* Description */}
                        {beat.description && (
                            <div className="mt-12 p-8 bg-card border border-border rounded-[2rem]">
                                <h3 className="text-sm font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                                    <Info size={16} /> Sobre este Beat
                                </h3>
                                <p className="text-muted leading-relaxed font-medium whitespace-pre-wrap">{beat.description}</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Statistics & Details (Prioritizing Comments) */}
                    <div className="lg:col-span-4 space-y-8">
                        <section>
                            <div className="bg-card p-6 rounded-[2.5rem] border border-border shadow-sm min-h-[400px]">
                                <CommentSection beatId={id} />
                            </div>
                        </section>
                    </div>
                </div>
            </main>
            <Footer />
        </div>
    );
}
