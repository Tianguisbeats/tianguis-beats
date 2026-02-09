"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Music, TrendingUp, ChevronRight, ChevronLeft, Users, Sparkles, Star, Zap, Crown, Flame, Instagram, Twitter, Globe, Pause, Play, Check } from "lucide-react";
import { Beat } from "@/lib/types";
import { usePlayer } from "@/context/PlayerContext";

interface FeaturedBannerProps {
    trendingBeats: Beat[];
    trendingProducers: any[];
    featuredMoods: any[];
}



export default function FeaturedBanner({ trendingBeats, trendingProducers, featuredMoods }: FeaturedBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { playBeat, currentBeat, isPlaying } = usePlayer();

    // Alternar 5 Beats y 5 Artistas de forma balanceada (Billboard Top 10)
    const combinedItems = [];
    for (let i = 0; i < 5; i++) {
        if (trendingBeats[i]) combinedItems.push({ type: 'beat', data: trendingBeats[i] });
        if (trendingProducers[i]) combinedItems.push({ type: 'producer', data: trendingProducers[i] });
    }

    const currentItem = combinedItems?.[currentIndex];
    const isBeat = currentItem?.type === 'beat';
    const itemData = currentItem?.data;

    const isThisPlaying = isBeat && (itemData as Beat)?.id === currentBeat?.id && isPlaying;

    const handlePlayForBanner = (e: React.MouseEvent) => {
        e.preventDefault();
        if (isBeat) playBeat(itemData as Beat);
    };

    // Rotación automática cada 7 segundos para dar tiempo de lectura
    useEffect(() => {
        const timer = setInterval(() => {
            if (combinedItems.length > 0) {
                setCurrentIndex((prev) => (prev + 1) % combinedItems.length);
            }
        }, 7000);
        return () => clearInterval(timer);
    }, [combinedItems.length]);

    if (!currentItem) return null;

    const nextItem = () => setCurrentIndex((prev) => (prev + 1) % combinedItems.length);
    const prevItem = () => setCurrentIndex((prev) => (prev - 1 + combinedItems.length) % combinedItems.length);

    const getLiquidColors = () => {
        if (!isBeat) return 'from-amber-500/30 via-orange-600/30 to-slate-900/40';
        const genre = (itemData as Beat)?.genre;
        if (genre?.includes('Corridos')) return 'from-emerald-500/40 via-green-600/40 to-red-900/40';
        if (genre?.includes('Trap')) return 'from-purple-600/40 via-fuchsia-600/40 to-blue-900/40';
        return 'from-blue-600/40 via-purple-600/40 to-blue-900/40';
    };

    return (
        <div className="w-full mb-8 group">
            {/* Reduced height from 520px to 420px for a more compact and professional look */}
            <div className="relative w-full rounded-[3rem] bg-slate-950 overflow-hidden text-white min-h-[420px] md:min-h-[400px] flex items-center shadow-2xl shadow-accent/5 transition-all duration-500">

                {/* Liquid Background Effect */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-1/4 -left-1/4 w-full h-full bg-gradient-to-br ${getLiquidColors()} rounded-full blur-[100px] animate-pulse duration-[10000ms] opacity-50`}></div>
                    <div className={`absolute -bottom-1/4 -right-1/4 w-full h-full bg-gradient-to-tl ${getLiquidColors()} rounded-full blur-[100px] animate-pulse duration-[8000ms] opacity-50`}></div>
                </div>

                {/* Content */}
                <div className="relative z-10 w-full p-6 md:px-16 md:py-8 flex flex-col md:flex-row items-center gap-8 md:gap-16">

                    {/* Media Content - Compact Size */}
                    <div key={`media-${currentIndex}-${currentItem.type}`} className="relative shrink-0 animate-in fade-in zoom-in duration-700">
                        <div className={`w-40 h-40 md:w-64 md:h-64 rounded-[2.5rem] md:rounded-[3rem] overflow-hidden shadow-2xl shadow-black/50 border border-white/10 relative ${!isBeat ? 'p-1 bg-gradient-to-br from-amber-400 to-orange-600' : ''}`}>
                            <img
                                src={isBeat ? (itemData as Beat).portadabeat_url || '' : (itemData as any).foto_perfil || `https://ui-avatars.com/api/?name=${(itemData as any).artistic_name || (itemData as any).username}&background=random`}
                                className={`w-full h-full object-cover ${!isBeat ? 'rounded-[2.4rem] md:rounded-[2.9rem]' : ''}`}
                                alt="Feature Content"
                            />
                            {!isBeat && (itemData as any).subscription_tier === 'premium' && (
                                <div className="absolute top-4 right-4 bg-amber-500 text-white p-2 rounded-xl shadow-lg animate-bounce">
                                    <Crown size={16} fill="currentColor" />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Info Section */}
                    <div key={`content-${currentIndex}-${currentItem.type}`} className="flex-1 text-center md:text-left animate-in slide-in-from-right-8 fade-in duration-700">
                        <div className={`inline-flex items-center gap-3 px-5 py-2 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-[0.2em] mb-4 md:mb-6 backdrop-blur-3xl border ${isBeat ? 'bg-accent/20 border-accent/30 text-blue-200' : 'bg-amber-500/20 border-amber-500/30 text-amber-200'}`}>
                            {isBeat ? <Flame size={14} className="text-orange-400" /> : <Star size={14} className="text-amber-400" />}
                            {isBeat ? 'Hits de la Semana' : 'Artista Destacado'}
                        </div>

                        <h1 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight mb-3 md:mb-4 leading-[1.1] font-heading lowercase">
                            {isBeat ? (itemData as Beat).title : (itemData as any).artistic_name || (itemData as any).username}
                        </h1>

                        {isBeat ? (
                            <div className="flex flex-col md:flex-row items-center gap-4 mb-6 md:mb-8">
                                <Link href={`/${(itemData as Beat).producer_username}`} className="flex items-center gap-3 bg-white/5 hover:bg-white/10 rounded-full px-4 py-2 transition-all border border-white/5 group">
                                    <div className="w-8 h-8 rounded-full overflow-hidden border border-accent">
                                        <img src={(itemData as Beat).producer_foto_perfil || ''} className="w-full h-full object-cover" />
                                    </div>
                                    <span className="text-sm font-black lowercase text-white">{(itemData as Beat).producer_artistic_name}</span>
                                    {(itemData as Beat).producer_is_verified && <img src="/verified-badge.png" alt="Verificado" className="w-4 h-4 object-contain" />}
                                    {(itemData as Beat).producer_is_founder && <Crown size={14} className="text-yellow-400 fill-yellow-400" />}
                                </Link>
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-2 mb-4">
                                    <h2 className="text-sm font-black uppercase text-amber-500 tracking-widest flex items-center gap-2">
                                        {(itemData as any).is_verified && <img src="/verified-badge.png" alt="Verificado" className="w-5 h-5 object-contain" />}
                                        {(itemData as any).is_founder && <Crown size={16} className="text-yellow-400 fill-yellow-400" />}
                                        PRODUCCIÓN VERIFICADA
                                    </h2>
                                </div>
                                <p className="text-xs md:text-sm text-slate-300 max-w-xl line-clamp-2 md:line-clamp-3 font-medium opacity-80 leading-relaxed mb-6">
                                    {(itemData as any).bio || "Productor verificado de la escena nacional mexicana. Descubre su sonido único."}
                                </p>
                                <div className="flex items-center gap-4">
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                                        <Music size={14} className="text-accent" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">50+ Beats</span>
                                    </div>
                                    <div className="flex items-center gap-2 px-4 py-2 bg-white/5 rounded-2xl border border-white/10">
                                        <Users size={14} className="text-accent" />
                                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Artista Popular</span>
                                    </div>
                                </div>
                            </>
                        )}
                        <div className="flex flex-wrap justify-center md:justify-start gap-4 items-center mt-8">
                            {isBeat ? (
                                <>
                                    <button
                                        onClick={handlePlayForBanner}
                                        className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 border backdrop-blur-md min-h-0 min-w-0 ${isThisPlaying ? 'bg-white text-accent border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                                    >
                                        {isThisPlaying ? <Pause size={24} fill="currentColor" /> : <Play size={24} fill="currentColor" className="ml-1" />}
                                    </button>
                                    <Link
                                        href={`/beats/${(itemData as Beat).id}`}
                                        className="px-8 py-4 md:px-10 md:py-5 bg-accent text-white rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-500 hover:scale-105 transition-all shadow-xl shadow-accent/20 flex items-center gap-2 group/btn"
                                    >
                                        Obtener Beat
                                        <ArrowRight size={18} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                </>
                            ) : (
                                <Link
                                    href={`/${(itemData as any).username}`}
                                    className="px-8 py-4 md:px-10 md:py-5 bg-white text-slate-900 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-slate-100 hover:scale-105 transition-all shadow-xl flex items-center gap-2 group/btn"
                                >
                                    Ver Perfil de Artista
                                    <Users size={18} />
                                </Link>
                            )}
                        </div>
                    </div>

                    {/* Navigation Mini-Buttons (Hidden on mobile) */}
                    <div className="absolute right-8 top-1/2 -translate-y-1/2 hidden lg:flex flex-col gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={prevItem} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all hover:scale-110 min-h-0 min-w-0"><ChevronLeft size={20} /></button>
                        <button onClick={nextItem} className="p-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 transition-all hover:scale-110 min-h-0 min-w-0"><ChevronRight size={20} /></button>
                    </div>

                </div>

                {/* Progress Indicators - Centered Bottom */}
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {combinedItems.map((_, i) => (
                        <button
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`h-[2px] rounded-full transition-all duration-500 min-h-0 min-w-0 p-0 border-0 ${i === currentIndex ? 'w-10 bg-white' : 'w-4 bg-white/20 hover:bg-white/50'}`}
                            aria-label={`Go to slide ${i + 1}`}
                        />
                    ))}
                </div>
            </div>
        </div>
    );
}


