"use client";

import React, { useEffect, useState, use } from 'react';
// Note: use() hook from React 19 / Next.js 15+ is used for unwrapping promises like params.
// But as we are on Next 16 with 'use client', we can typically await params in async component OR use unwrapping.
// Standard client component pattern for dynamic routes in Next 15/16 often involves React.use() for params if passed as promise
// OR simply taking params as prop. Let's use standard prop typing for now, and if Next complains about params being a Promise (Next 15 breaking change), we handle it.

import { supabase } from '@/lib/supabase';
import { Play, Pause, Heart, Share2, Clock, Music2, ShieldCheck, Download, MessageCircle, BarChart3, ShoppingCart, Info, Globe, ChevronRight } from 'lucide-react';
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
    const [selectedLicense, setSelectedLicense] = useState<'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA'>('MP3');
    const [isLiked, setIsLiked] = useState(false);

    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const { addItem, isInCart } = useCart();

    const handleAddToCart = () => {
        if (!beat) return;

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

        // onClose(); // This function is not defined in the provided context. Assuming it's removed or handled elsewhere.
        router.push('/cart');
    };

    useEffect(() => {
        const fetchBeat = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('beats')
                    .select('id, title, genre, bpm, price_mxn, price_wav_mxn, price_stems_mxn, exclusive_price_mxn, is_mp3_active, is_wav_active, is_stems_active, is_exclusive_active, portadabeat_url, mp3_url, mp3_tag_url, musical_key, musical_scale, mood, description, play_count, like_count, created_at, producer:producer_id(artistic_name, username, avatar_url, is_verified, is_founder)')
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

                    logListen(data.id);

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

    const logListen = async (beatId: string) => {
        const { data: { user } } = await supabase.auth.getUser();
        await supabase.from('listens').insert({
            beat_id: beatId,
            user_id: user?.id || null
        });
        await supabase.rpc('increment_play_count', { p_beat_id: beatId });
    };

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Inicia sesión para dar like");
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
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <Music2 className="text-blue-600 animate-bounce mb-4" size={48} />
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Cargando vibras...</p>
            </div>
        );
    }

    if (!beat) {
        return (
            <div className="min-h-screen bg-white flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black text-slate-900 mb-4">404</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Beat no encontrado</p>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col pt-24">
            <Navbar />

            <main className="flex-1">
                {/* 1. HERO SECTION - High Impact Header */}
                <div className="relative pt-12 pb-24 overflow-hidden">
                    {/* Background Glow */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-full -z-10 bg-gradient-to-b from-blue-50/50 to-white pointer-events-none" />
                    <div className="absolute top-[-20%] right-[-10%] w-[500px] h-[500px] bg-blue-100/30 rounded-full blur-[120px] -z-10 animate-pulse" />
                    <div className="absolute bottom-[-10%] left-[-5%] w-[400px] h-[400px] bg-purple-100/20 rounded-full blur-[100px] -z-10" />

                    <div className="max-w-7xl mx-auto px-4 md:px-8">
                        <div className="flex flex-col lg:flex-row gap-12 items-center lg:items-end mb-16">
                            {/* Artwork Container */}
                            <div className="relative group shrink-0">
                                <div className="absolute inset-0 bg-blue-600/20 blur-3xl rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
                                <div className={`w-64 h-64 md:w-80 md:h-80 rounded-[3rem] bg-white shadow-2xl overflow-hidden border-4 border-white relative z-10 transition-all duration-700 group-hover:scale-[1.02] group-hover:-rotate-2`}>
                                    {beat.portadabeat_url ? (
                                        <img src={beat.portadabeat_url} className="w-full h-full object-cover" alt={beat.title} />
                                    ) : (
                                        <div className="w-full h-full bg-slate-50 flex items-center justify-center text-slate-200"><Music2 size={80} /></div>
                                    )}
                                </div>
                                <button
                                    onClick={() => playBeat(beat as any)}
                                    className="absolute -bottom-6 -right-6 w-20 h-20 bg-blue-600 text-white rounded-3xl flex items-center justify-center shadow-2xl hover:bg-slate-900 hover:scale-110 transition-all active:scale-90 z-20 group/play"
                                >
                                    {isPlaying && currentBeat?.id === beat.id ? (
                                        <Pause size={32} fill="currentColor" />
                                    ) : (
                                        <Play size={32} fill="currentColor" className="ml-1" />
                                    )}
                                </button>
                            </div>

                            {/* Header Info Area */}
                            <div className="flex-1 text-center lg:text-left space-y-6">
                                <div className="space-y-4">
                                    <h1 className="text-5xl md:text-7xl lg:text-8xl font-black uppercase tracking-tighter text-slate-900 leading-[0.8] drop-shadow-sm click-highlight">
                                        {beat.title}
                                    </h1>
                                    <div className="flex items-center justify-center lg:justify-start gap-4">
                                        <Link href={`/${(beat.producer as any)?.username || ''}`} className="group flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-slate-100 shadow-sm hover:shadow-md transition-all">
                                            <div className="w-8 h-8 rounded-full overflow-hidden border border-slate-200">
                                                <img src={(beat.producer as any)?.avatar_url || "/logo.png"} className="w-full h-full object-cover" alt="Producer" />
                                            </div>
                                            <span className="text-sm font-black text-slate-900 uppercase tracking-widest group-hover:text-blue-600 transition-colors username-highlight">
                                                Prod. by {(beat.producer as any)?.artistic_name || (beat.producer as any)?.username}
                                            </span>
                                        </Link>
                                    </div>
                                </div>

                                {/* Vibrant Stats Row */}
                                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-8 pt-4">
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Plays</span>
                                        <div className="flex items-center gap-2 text-slate-900">
                                            <BarChart3 size={18} className="text-blue-600" />
                                            <span className="text-xl font-black">{beat.play_count || 0}</span>
                                        </div>
                                    </div>
                                    <div className="flex flex-col">
                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-1">Likes</span>
                                        <div className="flex items-center gap-2 text-slate-900">
                                            <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : "text-slate-400"} />
                                            <span className="text-xl font-black">{beat.like_count || 0}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* 2. REORDENAMIENTO DE DETALLES - Visual Branding */}
                        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                            <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center group border-green-100 bg-green-50/10">
                                <span className="text-[9px] font-black text-green-600 uppercase tracking-widest mb-2">Género</span>
                                <span className="text-sm font-black text-slate-900 uppercase">{beat.genre}</span>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center group border-amber-100 bg-amber-50/10">
                                <span className="text-[9px] font-black text-amber-600 uppercase tracking-widest mb-2">Tempo</span>
                                <span className="text-sm font-black text-slate-900 uppercase">{beat.bpm} BPM</span>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center group border-blue-100 bg-blue-50/10">
                                <span className="text-[9px] font-black text-blue-600 uppercase tracking-widest mb-2">Escala</span>
                                <span className="text-sm font-black text-slate-900 uppercase">{beat.musical_key || '—'}</span>
                            </div>
                            <div className="bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center group border-purple-100 bg-purple-50/10">
                                <span className="text-[9px] font-black text-purple-600 uppercase tracking-widest mb-2">Tonalidad</span>
                                <span className="text-sm font-black text-slate-900 uppercase">{beat.musical_scale || 'Natural'}</span>
                            </div>
                            <div className="col-span-2 bg-white/50 backdrop-blur-sm p-5 rounded-[2rem] border border-slate-100 flex flex-col items-center justify-center text-center border-slate-200">
                                <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">Moods</span>
                                <div className="flex flex-wrap justify-center gap-1.5">
                                    {beat.mood && beat.mood.split(',').map((m, i) => (
                                        <span key={i} className="text-[9px] font-black text-slate-600 bg-slate-100 px-2 py-1 rounded-lg uppercase tracking-widest">{m.trim()}</span>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* WAVEFORM - High Visibility */}
                        <div className="mt-16 bg-slate-900/5 p-8 rounded-[3rem] border border-slate-100/50 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-blue-600/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <WaveformPlayer
                                url={beat.mp3_url || ''}
                                height={120}
                                waveColor="#e2e8f0"
                                progressColor="#2563eb"
                            />
                        </div>

                        {/* Master Actions Row */}
                        <div className="mt-12 flex flex-wrap items-center justify-center lg:justify-start gap-4">
                            <button
                                onClick={handleLike}
                                className={`px-10 py-5 rounded-[2rem] font-black text-[12px] uppercase tracking-widest transition-all flex items-center gap-3 shadow-xl active:scale-95 ${isLiked ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-slate-900 text-white shadow-slate-900/20 hover:bg-red-500'}`}
                            >
                                <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                {isLiked ? 'En tus Favoritos' : 'Me Gusta'}
                            </button>
                            <button className="px-10 py-5 rounded-[2rem] bg-white border-2 border-slate-100 text-slate-900 font-black text-[12px] uppercase tracking-widest hover:border-blue-600 hover:text-blue-600 transition-all flex items-center gap-3 shadow-sm active:scale-95">
                                <Share2 size={20} /> Compartir Beat
                            </button>
                        </div>
                    </div>
                </div>

                {/* 3. CONTENT AREA - Layout Reorganized */}
                <div className="max-w-7xl mx-auto px-4 md:px-8 pb-32">
                    <div className="grid lg:grid-cols-12 gap-16">

                        {/* LEFT: Licenses & Description */}
                        <div className="lg:col-span-8 space-y-16">

                            {/* Licenses Grid - Solo las activas */}
                            <section>
                                <div className="flex items-center gap-4 mb-10">
                                    <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 shadow-sm"><ShieldCheck size={24} /></div>
                                    <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900">Opciones de Licencia</h2>
                                </div>

                                <div className="grid md:grid-cols-2 gap-6">
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
                                            features={['WAV + MP3', 'Uso comercial ilimitado', 'Calidad de estudio']}
                                            selected={selectedLicense === 'WAV'}
                                            onSelect={() => setSelectedLicense('WAV')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_stems_active !== false && (
                                        <LicenseCard
                                            type="STEMS"
                                            price={beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5)}
                                            features={['Archivos Separados', 'Control Total', 'Ideal para Proyectos Pro']}
                                            selected={selectedLicense === 'STEMS'}
                                            onSelect={() => setSelectedLicense('STEMS')}
                                            active={true}
                                        />
                                    )}
                                    {beat.is_exclusive_active !== false && (
                                        <LicenseCard
                                            type="ILIMITADA"
                                            price={beat.price_exclusive || 2999}
                                            features={['Derechos Exclusivos', 'Eliminado de la Tienda', 'Propiedad Total']}
                                            selected={selectedLicense === 'ILIMITADA'}
                                            onSelect={() => setSelectedLicense('ILIMITADA')}
                                            active={true}
                                        />
                                    )}
                                </div>

                                {/* Main Add To Cart */}
                                <div className="mt-8">
                                    <button
                                        onClick={handleAddToCart}
                                        className="w-full py-6 bg-blue-600 text-white rounded-[2rem] font-black uppercase tracking-[0.2em] text-[11px] hover:bg-slate-900 transition-all shadow-2xl shadow-blue-600/30 flex items-center justify-center gap-4 group active:scale-[0.98]"
                                    >
                                        <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center group-hover:bg-blue-500 transition-colors">
                                            <ShoppingCart size={16} />
                                        </div>
                                        Añadir al Carrito — {new Intl.NumberFormat("es-MX", { style: "currency", currency: "MXN", maximumFractionDigits: 0 }).format(
                                            selectedLicense === 'MP3' ? (beat.price_mp3 || beat.price_mxn || 299) :
                                                selectedLicense === 'WAV' ? (beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5)) :
                                                    selectedLicense === 'STEMS' ? (beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5)) :
                                                        (beat.price_exclusive || 2999)
                                        )}
                                    </button>
                                </div>
                            </section>

                            {/* Description Section */}
                            {beat.description && (
                                <section className="p-10 bg-slate-50 rounded-[3rem] border border-slate-100">
                                    <h3 className="text-xl font-black uppercase tracking-tight mb-4 flex items-center gap-2">
                                        <Info size={20} className="text-blue-600" /> Notas del Productor
                                    </h3>
                                    <p className="text-slate-600 font-medium leading-relaxed whitespace-pre-wrap">
                                        {beat.description}
                                    </p>
                                </section>
                            )}
                        </div>

                        {/* RIGHT SIDEBAR: Comments */}
                        <div className="lg:col-span-4">
                            <div className="sticky top-32 space-y-8">
                                <CommentSection beatId={id} />
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
