"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Music, TrendingUp, ChevronRight, ChevronLeft, Users, Sparkles, Star, Zap, Crown, Flame, Instagram, Twitter, Globe, Pause, Play } from "lucide-react";
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

    const items = trendingBeats;
    const currentItem = items?.[currentIndex];

    const isThisPlaying = (currentItem as Beat)?.id === currentBeat?.id && isPlaying;

    const handlePlayForBanner = (e: React.MouseEvent) => {
        e.preventDefault();
        playBeat(currentItem as Beat);
    };

    // Auto-rotate every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            if (items.length > 0) {
                setCurrentIndex((prev) => (prev + 1) % items.length);
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [items]);

    if (!currentItem) return null;

    const nextItem = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const prevItem = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    const getLiquidColors = () => {
        const genre = (currentItem as Beat)?.genre;
        if (genre?.includes('Corridos')) return 'from-emerald-500/40 via-green-600/40 to-red-900/40';
        if (genre?.includes('Trap')) return 'from-purple-600/40 via-fuchsia-600/40 to-blue-900/40';
        if (genre?.includes('Reggaeton')) return 'from-orange-500/40 via-rose-600/40 to-purple-900/40';
        return 'from-blue-600/40 via-purple-600/40 to-blue-900/40';
    };

    return (
        <div className="w-full mb-10 group">
            <div className="relative w-full rounded-[3.5rem] bg-slate-950 overflow-hidden text-white min-h-[520px] md:min-h-[480px] flex items-center shadow-2xl shadow-accent/5 transition-colors duration-300">

                {/* Liquid Background Effect */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-1/4 -left-1/4 w-full h-full bg-gradient-to-br ${getLiquidColors()} rounded-full blur-[120px] animate-pulse duration-[10000ms] opacity-60`}></div>
                    <div className={`absolute -bottom-1/4 -right-1/4 w-full h-full bg-gradient-to-tl ${getLiquidColors()} rounded-full blur-[120px] animate-pulse duration-[8000ms] opacity-60`}></div>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-white/5 rounded-full blur-[80px]`}></div>
                </div>

                {/* Background Image with Blur */}
                <div key={`bg-${currentIndex}`} className="absolute inset-0 z-0 animate-fade-in transition-opacity duration-1000 ease-in-out">
                    <img
                        src={(currentItem as Beat).genre === 'Corridos Tumbados 🇲🇽' ? 'https://images.unsplash.com/photo-1593030230495-9f5e04cb2a01?q=80&w=2070&auto=format&fit=crop' :
                            (currentItem as Beat).genre === 'Trap' ? 'https://images.unsplash.com/photo-1514525253361-bee84384c484?q=80&w=2070&auto=format&fit=crop' :
                                (currentItem as Beat).portadabeat_url || ''}
                        alt="Background"
                        className="w-full h-full object-cover opacity-20 blur-3xl scale-125 transition-all duration-1000"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent"></div>
                </div>

                {/* Navigation Arrows */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={prevItem}
                            className="absolute left-6 z-40 p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-xl transition-all opacity-0 group-hover:opacity-100 border border-white/10 sm:block hidden hover:scale-110 active:scale-90 min-h-[56px] min-w-[56px] flex items-center justify-center"
                        >
                            <ChevronLeft size={28} />
                        </button>
                        <button
                            onClick={nextItem}
                            className="absolute right-6 z-40 p-4 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-xl transition-all opacity-0 group-hover:opacity-100 border border-white/10 sm:block hidden hover:scale-110 active:scale-90 min-h-[56px] min-w-[56px] flex items-center justify-center"
                        >
                            <ChevronRight size={28} />
                        </button>
                    </>
                )}

                <div className="relative z-10 w-full p-6 md:p-20 flex flex-col md:flex-row items-center gap-8 md:gap-24">

                    {/* Media Content */}
                    <div key={`media-${currentIndex}`} className="relative shrink-0 animate-fade-in-up">
                        <div className="w-48 h-48 md:w-80 md:h-80 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl shadow-black transition-all duration-1000 flex items-center justify-center p-2 bg-white/5 backdrop-blur-sm border border-white/10">
                            <img
                                src={(currentItem as Beat).portadabeat_url || ''}
                                className="w-full h-full object-cover rounded-[2.5rem] md:rounded-[3.5rem]"
                                onError={(e) => {
                                    (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${(currentItem as Beat).title}&background=3b82f6&color=fff`;
                                }}
                            />
                        </div>
                    </div>

                    {/* Info Section */}
                    <div key={`content-${currentIndex}`} className="flex-1 text-center md:text-left animate-fade-in-up">
                        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] mb-6 md:mb-10 backdrop-blur-2xl border bg-accent/30 border-accent/40 text-blue-200">
                            <Flame size={16} className="text-orange-400 animate-pulse" /> 🔥 Top Hits
                        </div>

                        <h1 className="text-3xl md:text-7xl font-black tracking-tighter mb-4 md:mb-6 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40 lowercase font-heading">
                            {(currentItem as Beat).title}
                        </h1>

                        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-16 mb-8 md:mb-12">
                            <Link href={`/${(currentItem as Beat).producer_username}`} className="flex items-center gap-4 md:gap-5 bg-white/5 hover:bg-white/10 rounded-[2rem] md:rounded-[2.5rem] px-5 py-3 md:px-6 md:py-4 transition-all group/prod backdrop-blur-md border border-white/5">
                                <div className="w-12 h-12 md:w-16 md:h-16 rounded-full overflow-hidden border-2 border-accent p-0.5 transition-all duration-300 group-hover/prod:scale-110">
                                    <img
                                        src={(currentItem as Beat).producer_foto_perfil || `https://ui-avatars.com/api/?name=${(currentItem as Beat).producer_artistic_name}`}
                                        className="w-full h-full object-cover rounded-full"
                                    />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] leading-none mb-1 md:mb-2">Producido por</p>
                                    <div className="flex items-center gap-2.5">
                                        <p className="text-lg md:text-xl font-black text-white lowercase">{(currentItem as Beat).producer_artistic_name}</p>
                                        <div className="flex items-center gap-2 ml-1">
                                            {(currentItem as Beat).producer_is_verified && (
                                                <img src="/verified-badge.png" alt="Verificado" className="w-4 h-4 md:w-5 md:h-5 object-contain" />
                                            )}
                                            {(currentItem as Beat).producer_is_founder && <Crown className="text-amber-400 fill-amber-400 w-4 h-4 md:w-[18px] md:h-[18px]" />}
                                        </div>
                                    </div>
                                </div>
                            </Link>
                        </div>

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 items-center mt-4 text-white">
                            <button
                                onClick={handlePlayForBanner}
                                className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all shadow-2xl active:scale-95 border backdrop-blur-md min-h-[64px] min-w-[64px] ${isThisPlaying ? 'bg-white text-accent border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                            >
                                {isThisPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                            </button>
                            <Link
                                href={`/beats/${currentItem.id}`}
                                className="px-10 py-5 md:px-16 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-black uppercase text-[12px] md:text-[14px] tracking-[0.25em] transition-all shadow-3xl active:scale-95 flex items-center gap-3 md:gap-4 group/btn-main min-h-[56px] bg-accent text-white shadow-accent/40 hover:bg-blue-500 hover:scale-105"
                            >
                                Ver Detalles
                                <ChevronRight size={20} className="group-hover/btn-main:translate-x-2 transition-transform" />
                            </Link>

                            {/* Progress Indicator */}
                            <div className="flex items-center gap-4 md:gap-8 bg-white/5 border border-white/10 rounded-2xl md:rounded-3xl px-6 py-4 md:px-8 md:py-5 shadow-3xl backdrop-blur-2xl">
                                <div className="flex gap-2 md:gap-3">
                                    {items.map((_, i) => (
                                        <button
                                            key={i}
                                            onClick={(e) => { e.preventDefault(); setCurrentIndex(i); }}
                                            className={`h-2 md:h-2.5 rounded-full transition-all duration-700 ${i === currentIndex ? 'w-8 md:w-12 bg-white shadow-[0_0_20px_rgba(255,255,255,0.8)]' : 'w-2 md:w-2.5 bg-white/20 hover:bg-white/40'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] md:text-[12px] font-black text-slate-300 uppercase tracking-[0.2em] w-12 md:w-16 text-center tabular-nums">
                                    {(currentIndex + 1).toString().padStart(2, '0')} <span className="text-slate-600">/</span> {items.length.toString().padStart(2, '0')}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
