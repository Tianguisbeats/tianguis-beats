"use client";

import React, { useEffect, useState, use } from 'react';
// Note: use() hook from React 19 / Next.js 15+ is used for unwrapping promises like params.
// But as we are on Next 16 with 'use client', we can typically await params in async component OR use unwrapping.
// Standard client component pattern for dynamic routes in Next 15/16 often involves React.use() for params if passed as promise
// OR simply taking params as prop. Let's use standard prop typing for now, and if Next complains about params being a Promise (Next 15 breaking change), we handle it.

import { supabase } from '@/lib/supabase';
import { Play, Pause, Heart, Share2, Clock, Music2, ShieldCheck, Download, MessageCircle, BarChart3 } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LicenseCard from '@/components/LicenseCard';
import CommentSection from '@/components/CommentSection';
import WaveformPlayer from '@/components/WaveformPlayer';
import Link from 'next/link';
import { usePlayer } from '@/context/PlayerContext';
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
    like_count?: number;
    play_count?: number;
    sale_count?: number;
    description?: string;
    cover_url?: string | null;
    created_at: string;
}

/**
 * BeatDetailPage: Muestra la información detallada de un beat específico.
 * Permite reproducir, dar like, comentar y ver opciones de licencia.
 */
export default function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLicense, setSelectedLicense] = useState<'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA'>('MP3');
    const [isLiked, setIsLiked] = useState(false);

    const { currentBeat, isPlaying, playBeat } = usePlayer();

    useEffect(() => {
        const fetchBeat = async () => {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('beats')
                    .select('id, title, genre, bpm, price_mxn, price_wav_mxn, price_stems_mxn, exclusive_price_mxn, cover_url, mp3_url, musical_key, mood, description, play_count, sale_count, like_count, is_exclusive, created_at, producer:producer_id(artistic_name, username)')
                    .eq('id', id)
                    .single();

                if (data) {
                    // Resolve high-quality preview or maestra bucket
                    const path = data.mp3_url || '';
                    const encodedPath = path.split('/').map((s: string) => encodeURIComponent(s)).join('/');
                    const bucket = path.includes('-hq-') ? 'beats-mp3-alta-calidad' : 'beats-muestras';
                    const { data: { publicUrl } } = supabase.storage.from(bucket).getPublicUrl(encodedPath);

                    // Resolve Cover Art URL if it's a relative path
                    let finalCoverUrl = data.cover_url;
                    if (finalCoverUrl && !finalCoverUrl.startsWith('http')) {
                        const { data: { publicUrl: coverPUrl } } = supabase.storage.from('artworks').getPublicUrl(finalCoverUrl);
                        finalCoverUrl = coverPUrl;
                    }

                    const rawData = data as any;
                    const producerObj = Array.isArray(rawData.producer) ? rawData.producer[0] : rawData.producer;

                    setBeat({
                        ...data,
                        producer: producerObj,
                        mp3_url: publicUrl,
                        cover_url: finalCoverUrl
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
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white pb-20">
            <Navbar />

            {/* Main Header Container */}
            <div className="pt-24 pb-16 bg-gradient-to-b from-slate-50 to-white">
                <div className="max-w-7xl mx-auto px-4 md:px-8">
                    <div className="grid lg:grid-cols-12 gap-12 items-start">

                        {/* Artwork & Header Info (Left) */}
                        <div className="lg:col-span-8 space-y-8">
                            <div className="flex flex-col md:flex-row gap-8 items-center md:items-start text-center md:text-left">
                                <div className={`w-64 h-64 md:w-72 md:h-72 rounded-[3.5rem] shadow-2xl flex items-center justify-center shrink-0 relative overflow-hidden bg-slate-100`}>
                                    {beat.cover_url ? (
                                        <img src={beat.cover_url} className="w-full h-full object-cover" alt={beat.title || 'Beat'} />
                                    ) : (
                                        <Music2 size={80} className="text-slate-200" />
                                    )}
                                </div>

                                <div className="flex-1">
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-4">
                                        <span className="px-3 py-1 rounded-full bg-blue-600 text-white text-[9px] font-black uppercase tracking-widest">
                                            {beat.tag || 'Caliente'}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                            {beat.genre}
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                            {beat.bpm} BPM
                                        </span>
                                        <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-500 text-[9px] font-black uppercase tracking-widest">
                                            {beat.musical_key}
                                        </span>
                                    </div>

                                    <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter text-slate-900 leading-[0.85] mb-4">
                                        {beat.title}
                                    </h1>
                                    <p className="text-xl font-bold text-slate-400 uppercase tracking-widest mb-8">
                                        Prod. by <Link href={`/${(beat.producer as any)?.username || ''}`} className="text-blue-600 underline decoration-blue-100 hover:text-slate-900 transition-colors">
                                            {(beat.producer as any)?.artistic_name || (beat.producer as any)?.username || 'Desconocido'}
                                        </Link>
                                    </p>

                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-6">
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <BarChart3 size={18} />
                                            <span className="text-sm font-black">{beat.play_count || 0} <span className="text-[10px] uppercase opacity-60">Plays</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Heart size={18} className={isLiked ? "fill-red-500 text-red-500" : ""} />
                                            <span className="text-sm font-black">{beat.like_count || 0} <span className="text-[10px] uppercase opacity-60">Likes</span></span>
                                        </div>
                                        <div className="flex items-center gap-2 text-slate-400">
                                            <Download size={18} />
                                            <span className="text-sm font-black">{beat.sale_count || 0} <span className="text-[10px] uppercase opacity-60">Ventas</span></span>
                                        </div>
                                    </div>

                                    {/* Quick Actions Integration */}
                                    <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 mt-6">
                                        <button
                                            onClick={handleLike}
                                            className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-black text-[10px] uppercase tracking-widest transition-all ${isLiked ? 'bg-red-50 text-red-500 border-2 border-red-100' : 'bg-white text-slate-900 border-2 border-slate-100 hover:border-blue-600'}`}
                                        >
                                            <Heart size={14} fill={isLiked ? "currentColor" : "none"} />
                                            {isLiked ? 'Favorito' : 'Dar Like'}
                                        </button>
                                        <button className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-white text-slate-900 border-2 border-slate-100 font-black text-[10px] uppercase tracking-widest hover:border-blue-600 transition-all">
                                            <Share2 size={14} /> Compartir
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* WAVEFORM PLAYER */}
                            <div className="mt-8">
                                <WaveformPlayer
                                    url={beat.mp3_url || ''}
                                    height={100}
                                    waveColor="#f1f5f9"
                                    progressColor="#2563eb"
                                />
                            </div>

                            <div className="grid md:grid-cols-2 gap-8 mt-12">
                                <div className="space-y-4">
                                    <h3 className="text-xl font-black uppercase tracking-tight flex items-center gap-2">
                                        <ShieldCheck className="text-blue-600" size={20} />
                                        Licencias Disponibles
                                    </h3>
                                    <div className="grid gap-4">
                                        <LicenseCard
                                            type="MP3"
                                            price={beat.price_mp3 || beat.price_mxn || 299}
                                            features={['MP3 Alta Calidad', 'Ventas Ilimitadas', 'Untagged']}
                                            selected={selectedLicense === 'MP3'}
                                            onSelect={() => setSelectedLicense('MP3')}
                                            active={true}
                                        />
                                        <LicenseCard
                                            type="WAV"
                                            price={beat.price_wav || Math.ceil((beat.price_mxn || 299) * 1.5)}
                                            features={['WAV + MP3', 'Mejor Calidad', 'Certificado de Uso']}
                                            selected={selectedLicense === 'WAV'}
                                            onSelect={() => setSelectedLicense('WAV')}
                                            active={true}
                                        />
                                    </div>
                                </div>
                                <div className="space-y-4">
                                    <div className="h-7 invisible" /> {/* Spacer */}
                                    <div className="grid gap-4">
                                        <LicenseCard
                                            type="STEMS"
                                            price={beat.price_stems || Math.ceil((beat.price_mxn || 299) * 2.5)}
                                            features={['Archivos Separados', 'Control Total', 'Ideal para Proyectos Pro']}
                                            selected={selectedLicense === 'STEMS'}
                                            onSelect={() => setSelectedLicense('STEMS')}
                                            active={true}
                                        />
                                        <LicenseCard
                                            type="ILIMITADA"
                                            price={beat.price_exclusive || 2999}
                                            features={['Derechos Exclusivos', 'Eliminado de la Tienda', 'Propiedad Total']}
                                            selected={selectedLicense === 'ILIMITADA'}
                                            onSelect={() => setSelectedLicense('ILIMITADA')}
                                            active={true}
                                        />
                                    </div>
                                </div>
                            </div>

                            {/* Interaction Actions */}
                            <div className="flex gap-4 pt-8">
                                <button
                                    onClick={handleLike}
                                    className={`flex-1 py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all flex items-center justify-center gap-3 ${isLiked ? 'bg-red-50 text-red-500 shadow-xl shadow-red-500/5' : 'bg-slate-900 text-white hover:bg-blue-600'}`}
                                >
                                    <Heart size={20} fill={isLiked ? "currentColor" : "none"} />
                                    {isLiked ? 'En tus favoritos' : 'Me gusta este beat'}
                                </button>
                                <button className="flex-1 py-5 rounded-2xl border-2 border-slate-100 font-black uppercase tracking-widest text-[11px] text-slate-900 hover:bg-slate-50 transition-all flex items-center justify-center gap-3">
                                    <Share2 size={20} />
                                    Compartir Beat
                                </button>
                            </div>
                        </div>

                        {/* Right Sidebar: Comments & Details (Right) */}
                        <div className="lg:col-span-4 space-y-8">
                            <div className="bg-slate-50 rounded-[2.5rem] p-8 border border-slate-100">
                                <h3 className="font-black text-xl uppercase tracking-tight mb-6">Detalles Técnicos</h3>
                                <ul className="space-y-4">
                                    <li className="flex justify-between items-center pb-4 border-b border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Publicado</span>
                                        <span className="text-sm font-bold text-slate-900">{(beat.created_at) ? new Date(beat.created_at).toLocaleDateString() : new Date().toLocaleDateString()}</span>
                                    </li>
                                    <li className="flex justify-between items-center pb-4 border-b border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Escala</span>
                                        <span className="text-sm font-bold text-slate-900">{beat.musical_key || 'No especificada'}</span>
                                    </li>
                                    <li className="flex justify-between items-center pb-4 border-b border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tonalidad</span>
                                        <span className="text-sm font-bold text-slate-900">{beat.musical_scale || 'Natural'}</span>
                                    </li>
                                    <li className="flex justify-between items-center pb-4 border-b border-slate-200">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Tempo (BPM)</span>
                                        <span className="text-sm font-bold text-slate-900">{beat.bpm} BPM</span>
                                    </li>
                                    <li className="flex justify-between items-center">
                                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Género</span>
                                        <span className="text-sm font-bold text-slate-900">{beat.genre}</span>
                                    </li>
                                </ul>
                            </div>

                            <CommentSection beatId={id} />
                        </div>
                    </div>
                </div>
            </div>

            <Footer />
        </div>
    );
}
