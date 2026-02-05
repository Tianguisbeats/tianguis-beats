"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Music, TrendingUp, ChevronRight, ChevronLeft } from "lucide-react";
import { Beat } from "@/lib/types";

interface FeaturedBannerProps {
    trendingBeats: Beat[];
}

export default function FeaturedBanner({ trendingBeats }: FeaturedBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate every 6 seconds
    useEffect(() => {
        if (!trendingBeats || trendingBeats.length === 0) return;

        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % trendingBeats.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [trendingBeats]);

    if (!trendingBeats || trendingBeats.length === 0) return null;

    const currentBeat = trendingBeats[currentIndex];

    // Safety check in case index is out of bounds
    if (!currentBeat) return null;

    return (
        <div className="relative w-full rounded-[2.5rem] bg-slate-900 overflow-hidden text-white mb-8 min-h-[350px] md:min-h-[380px] flex items-center shadow-2xl shadow-slate-200 group">

            {/* Background Image with Blur */}
            <div key={currentBeat.id} className="absolute inset-0 z-0 animate-fade-in transition-opacity duration-1000 ease-in-out">
                <img
                    src={currentBeat.portadabeat_url || ''}
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
            </div>

            {/* Navigation Buttons (Visible on hover) */}
            {trendingBeats.length > 1 && (
                <>
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev - 1 + trendingBeats.length) % trendingBeats.length)}
                        className="absolute left-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronLeft size={24} />
                    </button>
                    <button
                        onClick={() => setCurrentIndex((prev) => (prev + 1) % trendingBeats.length)}
                        className="absolute right-4 z-20 p-2 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100"
                    >
                        <ChevronRight size={24} />
                    </button>
                </>
            )}

            <div className="relative z-10 w-full p-8 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                {/* Artwork */}
                <div key={`art-${currentBeat.id}`} className="w-40 h-40 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 shrink-0 rotate-3 hover:rotate-0 transition-transform duration-500 animate-fade-in-up">
                    <img
                        src={currentBeat.portadabeat_url || ''}
                        alt={currentBeat.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info */}
                <div key={`info-${currentBeat.id}`} className="flex-1 text-center md:text-left animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                        <TrendingUp size={12} className="animate-pulse" /> Beats de la Semana
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none line-clamp-2 md:line-clamp-1">
                        {currentBeat.title}
                    </h1>

                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-8">
                        {/* Producer Info with Image */}
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2 hover:bg-white/10 transition-all group/prod">
                            <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-blue-500/50">
                                <img
                                    src={currentBeat.producer_foto_perfil || `https://ui-avatars.com/api/?name=${currentBeat.producer_artistic_name}&background=random`}
                                    alt={currentBeat.producer_artistic_name || ''}
                                    className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform"
                                />
                            </div>
                            <div className="text-left">
                                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest leading-none mb-1">Productor</p>
                                <p className="text-sm font-black text-white">{currentBeat.producer_artistic_name}</p>
                            </div>
                        </div>

                        <div className="flex gap-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                            <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" />
                                {currentBeat.bpm} BPM
                            </span>
                            <span className="flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" />
                                {currentBeat.musical_key || 'C Maj'}
                            </span>
                            <span className="flex items-center gap-2">
                                <Music size={12} className="text-rose-500" />
                                {currentBeat.play_count || 0} Plays
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <Link
                            href={`/beats/${currentBeat.id}`}
                            className="bg-blue-600 text-white px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 active:scale-95 flex items-center gap-2 group/btn"
                        >
                            Escuchar Ahora <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                        <Link
                            href={`/${currentBeat.producer_username}`}
                            className="bg-white/5 text-white border border-white/10 px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all backdrop-blur-md"
                        >
                            Ver Perfil
                        </Link>
                    </div>
                </div>
            </div>

            {/* Dots Indicators */}
            {trendingBeats.length > 1 && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {trendingBeats.map((_, idx) => (
                        <button
                            key={idx}
                            onClick={() => setCurrentIndex(idx)}
                            className={`w-2 h-2 rounded-full transition-all ${idx === currentIndex ? 'bg-white w-6' : 'bg-white/20 hover:bg-white/40'
                                }`}
                        />
                    ))}
                </div>
            )}
        </div>
    );
}
