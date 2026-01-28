"use client";

import React, { useEffect, useState, use } from 'react';
// Note: use() hook from React 19 / Next.js 15+ is used for unwrapping promises like params.
// But as we are on Next 16 with 'use client', we can typically await params in async component OR use unwrapping.
// Standard client component pattern for dynamic routes in Next 15/16 often involves React.use() for params if passed as promise
// OR simply taking params as prop. Let's use standard prop typing for now, and if Next complains about params being a Promise (Next 15 breaking change), we handle it.

import { supabase } from '@/lib/supabase';
import { Play, Pause, Heart, Share2, Clock, Music2, ShieldCheck } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import LicenseCard from '@/components/LicenseCard';
import CommentSection from '@/components/CommentSection';
import { usePlayer } from '@/context/PlayerContext';
import { Beat } from '@/components/BeatCard';

// Extend Beat interface to include detail columns if needed
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
}

export default function BeatDetailPage({ params }: { params: Promise<{ id: string }> }) {
    // Unwrap params using React.use() or await in useEffect if not using async component structure (client components can't be async in same way)
    // Actually in Next 15+, params is a Promise. In client components we need to unwrap it.
    const resolvedParams = use(params);
    const id = resolvedParams.id;

    const [beat, setBeat] = useState<BeatDetail | null>(null);
    const [loading, setLoading] = useState(true);
    const [selectedLicense, setSelectedLicense] = useState<'MP3' | 'WAV' | 'STEMS' | 'ILIMITADA'>('MP3');
    const [isLiked, setIsLiked] = useState(false);

    const { currentBeat, isPlaying, playBeat } = usePlayer();
    const isThisPlaying = currentBeat?.id === beat?.id && isPlaying;

    useEffect(() => {
        const fetchBeat = async () => {
            // Fetch beat details
            const { data, error } = await supabase
                .from('beats')
                .select('*, producer:producer_id(artistic_name)')
                .eq('id', id)
                .single();

            if (data) {
                const { data: { publicUrl } } = supabase.storage
                    .from('beats-previews')
                    .getPublicUrl(data.mp3_url);

                setBeat({ ...data, mp3_url: publicUrl });

                // Check if liked
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    const { count } = await supabase
                        .from('likes')
                        .select('*', { count: 'exact', head: true })
                        .eq('beat_id', data.id)
                        .eq('user_id', user.id);
                    setIsLiked(!!count);
                }
            }
            setLoading(false);
        };

        fetchBeat();
    }, [id]);

    const handleLike = async () => {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
            alert("Inicia sesión para dar like");
            return;
        }

        if (isLiked) {
            await supabase.from('likes').delete().eq('beat_id', id).eq('user_id', user.id);
            setIsLiked(false);
        } else {
            await supabase.from('likes').insert({ beat_id: id, user_id: user.id });
            setIsLiked(true);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-white flex items-center justify-center font-black text-slate-200 uppercase tracking-widest animate-pulse">Cargando Beat...</div>;
    }

    if (!beat) {
        return <div className="min-h-screen bg-white flex items-center justify-center font-black text-slate-900 uppercase tracking-widest">Beat no encontrado</div>;
    }

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
            <Navbar />

            {/* Header / Hero Details */}
            <div className="pt-32 pb-12 bg-slate-50 border-b border-slate-100">
                <div className="max-w-6xl mx-auto px-4 md:px-8">
                    <div className="flex flex-col md:flex-row gap-8 lg:gap-12 items-center md:items-end">

                        {/* Artwork */}
                        <div className={`w-64 h-64 md:w-80 md:h-80 rounded-[2.5rem] shadow-2xl flex items-center justify-center shrink-0 relative overflow-hidden group ${beat.coverColor || 'bg-slate-200'}`}>
                            {/* Play Overlay */}
                            <div className="absolute inset-0 bg-black/10 group-hover:bg-black/20 transition-all flex items-center justify-center z-10">
                                <button
                                    onClick={() => playBeat(beat)}
                                    className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-2xl hover:scale-110 active:scale-95 transition-all text-blue-600"
                                >
                                    {isThisPlaying ? <Pause fill="currentColor" size={32} /> : <Play fill="currentColor" size={32} className="ml-1" />}
                                </button>
                            </div>
                            <Music2 size={80} className="text-white/20" />
                        </div>

                        {/* Text Info */}
                        <div className="flex-1 text-center md:text-left">
                            <div className="inline-flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-white ${beat.tagColor || 'bg-blue-600'}`}>
                                    {beat.tag || 'Exclusivo'}
                                </span>
                                <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                    {beat.bpm} BPM
                                </span>
                                <span className="px-3 py-1 rounded-full bg-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-widest">
                                    KEY: {beat.musical_key || '?'}
                                </span>
                            </div>

                            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black uppercase tracking-tighter text-slate-900 leading-[0.9] mb-2">
                                {beat.title}
                            </h1>
                            <p className="text-lg font-bold text-slate-400 uppercase tracking-widest mb-8">
                                Prod. by <span className="text-blue-600">{beat.producer}</span>
                            </p>

                            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4">
                                <button
                                    onClick={handleLike}
                                    className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold uppercase text-[10px] tracking-widest transition-all ${isLiked ? 'bg-red-50 text-red-500' : 'bg-white border border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                                >
                                    <Heart size={16} fill={isLiked ? "currentColor" : "none"} />
                                    {isLiked ? 'Te gusta' : 'Me gusta'}
                                </button>
                                <button className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white border border-slate-200 text-slate-500 font-bold uppercase text-[10px] tracking-widest hover:bg-slate-50 transition-all">
                                    <Share2 size={16} />
                                    Compartir
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <main className="max-w-6xl mx-auto px-4 md:px-8 py-16">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12 lg:gap-16">

                    {/* Left Column: Licenses */}
                    <div className="lg:col-span-2">
                        <div className="flex items-center gap-3 mb-8">
                            <ShieldCheck size={24} className="text-slate-900" />
                            <h2 className="text-2xl font-black uppercase tracking-tight">Licencias Disponibles</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <LicenseCard
                                type="MP3"
                                price={beat.price_mp3 || beat.price_mxn || 299}
                                features={['MP3 Alta Calidad', 'Licencia Comercial', '5,000 Streams', 'Tagged (1 Tag)']}
                                active={beat.is_mp3_active !== false}
                                selected={selectedLicense === 'MP3'}
                                onSelect={() => setSelectedLicense('MP3')}
                            />
                            <LicenseCard
                                type="WAV"
                                price={beat.price_wav || 499}
                                features={['WAV + MP3', 'Licencia Comercial', '50,000 Streams', 'Untagged']}
                                active={beat.is_wav_active !== false}
                                selected={selectedLicense === 'WAV'}
                                onSelect={() => setSelectedLicense('WAV')}
                            />
                            <LicenseCard
                                type="STEMS"
                                price={beat.price_stems || 999}
                                features={['Trackout Stems', 'WAV + MP3', 'Streams Ilimitados', 'Untagged']}
                                active={beat.is_stems_active !== false}
                                selected={selectedLicense === 'STEMS'}
                                onSelect={() => setSelectedLicense('STEMS')}
                            />
                            <LicenseCard
                                type="ILIMITADA"
                                price={beat.price_exclusive || 2999}
                                features={['Derechos Exclusivos', 'Archivos Completos', 'Propiedad Intelectual', 'Eliminado de Tienda']}
                                active={beat.is_exclusive_active !== false}
                                selected={selectedLicense === 'ILIMITADA'}
                                onSelect={() => setSelectedLicense('ILIMITADA')}
                            />
                        </div>

                        {/* About / Description (Placeholder) */}
                        <div className="mt-16 bg-slate-50 rounded-[2rem] p-8 border border-slate-100">
                            <h3 className="font-black text-xl uppercase tracking-tight mb-4 text-slate-900">Sobre este Beat</h3>
                            <p className="text-slate-500 leading-relaxed font-medium">
                                Este beat fue producido con los más altos estándares de calidad. Ideal para {beat.genre} y artistas buscando un sonido {beat.mood}.
                                El BPM es de {beat.bpm} y está en la escala de {beat.musical_key}.
                            </p>
                        </div>
                    </div>

                    {/* Right Column: Comments & More */}
                    <div className="lg:col-span-1">
                        <CommentSection beatId={beat.id} />
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
