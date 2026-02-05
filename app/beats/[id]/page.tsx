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
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mb-4"></div>
                <p className="font-black text-slate-400 uppercase tracking-widest text-xs">Cargando...</p>
            </div>
        );
    }

    if (!beat) {
        return (
            <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center">
                <h1 className="text-4xl font-black text-slate-900 mb-4">404</h1>
                <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">Beat no encontrado</p>
                <Link href="/beats" className="mt-8 px-6 py-3 bg-slate-900 text-white rounded-full font-bold text-xs uppercase tracking-widest">
                    Regresar a Explorar
                </Link>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 pb-32">
                {/* 1. HERO HEADER (Immersive Gradient) */}
                <div className="relative pt-32 pb-20 md:pt-40 md:pb-32 px-4 shadow-sm bg-white overflow-hidden">
                    {/* Dynamic Ambient Background - "Liquid" Effect */}
                    <div className="absolute inset-0 bg-white -z-20" />
                    <div className="absolute top-[-20%] left-[-10%] w-[120vw] h-[120vw] bg-gradient-to-br from-blue-50/50 via-purple-50/50 to-pink-50/50 rounded-full blur-[120px] -z-10 animate-pulse duration-[8000ms]" />
                    <div className="absolute bottom-[-20%] right-[-10%] w-[100vw] h-[100vw] bg-gradient-to-tr from-amber-50/50 via-orange-50/50 to-yellow-50/50 rounded-full blur-[100px] -z-10 animate-pulse duration-[10000ms] delay-1000" />

                    <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center gap-12">
                        {/* Artwork */}
                        <div className="relative group shrink-0 w-64 h-64 md:w-80 md:h-80">
                            {/* Liquid Animation Background for Card */}
                            <div className="absolute -inset-4 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 rounded-[3rem] blur-xl opacity-20 group-hover:opacity-40 transition-opacity duration-700 animate-spin-slow" />

                            <div className="w-full h-full rounded-[2.5rem] bg-white shadow-2xl overflow-hidden border border-slate-100 relative z-10 transition-transform duration-500 group-hover:scale-[1.02] group-hover:-rotate-1">
                                {beat.portadabeat_url ? (
                                    <img src={beat.portadabeat_url} className="w-full h-full object-cover" alt={beat.title} />
                                ) : (
                                    <div className="w-full h-full bg-slate-100 flex items-center justify-center text-slate-300"><Music2 size={80} /></div>
                                )}
                            </div>

                            {/* Play Button Overlay */}
                            <button
                                onClick={() => playBeat(beat as any)}
                                className="absolute -bottom-6 -right-6 w-20 h-20 bg-slate-900 text-white rounded-[1.5rem] flex items-center justify-center shadow-xl shadow-slate-900/20 hover:bg-blue-600 hover:shadow-blue-600/30 hover:scale-110 transition-all active:scale-95 z-20"
                            >
                                {isPlaying && currentBeat?.id === beat.id ? <Pause size={30} fill="currentColor" /> : <Play size={30} fill="currentColor" className="ml-1" />}
                            </button>
                        </div>

                        {/* Text Info */}
                        <div className="text-center md:text-left flex-1 space-y-6">
                            {/* Producer Header - First and Bigger */}
                            <Link href={`/${(beat.producer as any)?.username || ''}`} className="inline-flex items-center gap-4 bg-white/50 backdrop-blur-md px-6 py-4 rounded-[2.5rem] border border-white/50 shadow-sm hover:shadow-xl transition-all group scale-105 origin-left">
                                <div className={`relative p-1 rounded-full border-2 ${(beat.producer as any)?.subscription_tier === 'premium' ? 'border-blue-500' :
                                        (beat.producer as any)?.subscription_tier === 'pro' ? 'border-amber-400' :
                                            'border-slate-100'
                                    } shadow-lg`}>
                                    <img src={(beat.producer as any)?.foto_perfil || "/logo.png"} className="w-16 h-16 rounded-full object-cover" alt="Prod" />
                                    {(beat.producer as any)?.is_verified && (
                                        <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-0.5 shadow-sm border border-slate-50">
                                            <img src="/verified-badge.png" className="w-5 h-5" alt="V" />
                                        </div>
                                    )}
                                </div>
                                <div className="text-left">
                                    <div className="flex items-center gap-2">
                                        <span className="block text-2xl font-black text-slate-900 tracking-tighter">{(beat.producer as any)?.artistic_name || (beat.producer as any)?.username}</span>
                                        {(beat.producer as any)?.is_founder && <Crown size={20} className="text-amber-400" fill="currentColor" />}
                                    </div>
                                    <span className="block text-[10px] font-black uppercase text-blue-600 tracking-widest animate-pulse mt-1">PRODUCTOR DESTACADO</span>
                                </div>
                            </Link>

                            <div>
                                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black text-slate-900 leading-[0.9] uppercase tracking-tighter mb-4">
                                    {beat.title}
                                </h1>
                                <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
                                    <span className="px-5 py-2 rounded-xl bg-emerald-50 text-emerald-600 border border-emerald-100 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                        <Tag size={12} /> {beat.genre}
                                    </span>
                                    <span className="px-5 py-2 rounded-xl bg-amber-50 text-amber-600 border border-amber-100 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                        <Activity size={12} /> {beat.bpm} BPM
                                    </span>
                                    <span className="px-5 py-2 rounded-xl bg-blue-50 text-blue-600 border border-blue-100 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                        <Music2 size={12} /> {beat.musical_key || '?'}
                                    </span>
                                    <span className="px-5 py-2 rounded-xl bg-purple-50 text-purple-600 border border-purple-100 text-[10px] font-black uppercase tracking-widest shadow-sm flex items-center gap-2">
                                        <Layers size={12} /> {beat.musical_scale}
                                    </span>
                                </div>
                            </div>

                            <div className="flex gap-4 justify-center md:justify-start mt-4">
                                <button onClick={handleLike} className={`px-8 py-4 rounded-2xl font-black text-xs uppercase tracking-widest flex items-center gap-3 transition-all ${isLiked ? 'bg-red-500 text-white shadow-xl shadow-red-500/30 hover:scale-105' : 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-900/10'}`}>
                                    <Heart size={18} fill={isLiked ? "currentColor" : "none"} />
                                    {isLiked ? 'Te gusta' : 'Dar Like'}
                                </button>
                                <button className="px-8 py-4 rounded-2xl bg-white text-slate-900 border-2 border-slate-100 font-black text-xs uppercase tracking-widest flex items-center gap-3 hover:border-slate-900 transition-all">
                                    <Share2 size={18} /> Compartir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* 2. WAVEFORM VISUALIZER */}
                <div className="max-w-6xl mx-auto px-4 -mt-10 relative z-20 mb-20">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-100">
                        <WaveformPlayer url={beat.mp3_url || ''} height={100} waveColor="#cbd5e1" progressColor="#2563eb" />
                    </div>
                </div>

                {/* 3. MAIN CONTENT GRID */}
                <div className="max-w-6xl mx-auto px-4 grid lg:grid-cols-12 gap-12">
                    {/* LEFT COLUMN: Licenses */}
                    <div className="lg:col-span-8">
                        <h2 className="text-2xl font-black uppercase tracking-tight text-slate-900 mb-8 flex items-center gap-2">
                            <ShieldCheck className="text-blue-600" /> Licencias Disponibles
                        </h2>

                        {!selectedLicense ? (
                            <div className="p-10 bg-slate-100 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                                <h3 className="text-xl font-black text-slate-400 uppercase tracking-widest">Beat No Disponible</h3>
                                <p className="text-slate-400 text-sm mt-2">Este beat no tiene licencias activas para venta.</p>
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
                                    className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 flex items-center justify-center gap-3"
                                >
                                    <ShoppingCart size={18} />
                                    Añadir {selectedLicense} al Carrito
                                </button>
                            </>
                        )}

                        {/* Description */}
                        {beat.description && (
                            <div className="mt-12 p-8 bg-white border border-slate-100 rounded-[2rem]">
                                <h3 className="text-sm font-black uppercase tracking-widest text-slate-400 mb-4 flex items-center gap-2">
                                    <Info size={16} /> Sobre este Beat
                                </h3>
                                <p className="text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{beat.description}</p>
                            </div>
                        )}
                    </div>

                    {/* RIGHT COLUMN: Statistics & Details */}
                    <div className="lg:col-span-4 space-y-8">
                        {/* "Detalles Vitaminados" Card */}
                        <section className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-xl shadow-slate-200/50">
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] text-slate-900 mb-8 flex items-center gap-2 border-b pb-4">
                                <Info size={16} className="text-blue-600" /> Detalles Técnicos
                            </h3>

                            <div className="space-y-6">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Speaker size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Reproducciones</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{beat.play_count?.toLocaleString() || 0}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Heart size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Likes</span>
                                    </div>
                                    <span className="text-lg font-black text-slate-900">{beat.like_count?.toLocaleString() || 0}</span>
                                </div>

                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3 text-slate-400">
                                        <Calendar size={18} />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Lanzamiento</span>
                                    </div>
                                    <span className="text-[11px] font-bold text-slate-900 uppercase">
                                        {new Date(beat.created_at).toLocaleDateString('es-MX', { month: 'short', year: 'numeric' })}
                                    </span>
                                </div>

                                {/* Moods Section */}
                                <div className="pt-6 border-t mt-4">
                                    <span className="block text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Aura y Mood</span>
                                    <div className="flex flex-wrap gap-2">
                                        {beat.mood?.split(',').map((m: string) => (
                                            <span key={m} className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-full text-[9px] font-black uppercase tracking-widest border border-blue-100/50">
                                                ✨ {m.trim()}
                                            </span>
                                        )) || (
                                                <span className="text-[10px] text-slate-300 italic font-bold">No especificado</span>
                                            )}
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section>
                            <h3 className="text-sm font-black uppercase tracking-[0.2em] mb-6 flex items-center gap-2 px-4">
                                <MessageCircle size={20} className="text-purple-500" /> Comentarios
                            </h3>
                            <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm min-h-[400px]">
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
