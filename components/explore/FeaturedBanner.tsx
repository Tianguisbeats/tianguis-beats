"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Music, TrendingUp } from "lucide-react";
import { Beat } from "@/lib/types";

interface FeaturedBannerProps {
    trendingBeat?: Beat;
}

export default function FeaturedBanner({ trendingBeat }: FeaturedBannerProps) {
    if (!trendingBeat) return null;

    return (
        <div className="relative w-full rounded-[2.5rem] bg-slate-900 overflow-hidden text-white mb-8 min-h-[300px] md:min-h-[380px] flex items-center shadow-2xl shadow-slate-200">
            {/* Background Image with Blur */}
            <div className="absolute inset-0 z-0">
                <img
                    src={trendingBeat.portadabeat_url || ''}
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
            </div>

            <div className="relative z-10 w-full p-8 md:p-16 flex flex-col md:flex-row items-center gap-8 md:gap-16">
                {/* Artwork */}
                <div className="w-40 h-40 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 shrink-0 rotate-3 hover:rotate-0 transition-all duration-500">
                    <img
                        src={trendingBeat.portadabeat_url || ''}
                        alt={trendingBeat.title}
                        className="w-full h-full object-cover"
                    />
                </div>

                {/* Info */}
                <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-300 text-[10px] font-black uppercase tracking-widest mb-6 backdrop-blur-md">
                        <TrendingUp size={12} /> Beat de la Semana
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none">
                        {trendingBeat.title}
                    </h1>
                    <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-8 text-slate-400 font-medium">
                        <span className="flex items-center gap-2 uppercase tracking-widest text-xs font-bold">
                            Por <span className="text-white border-b border-blue-500">{trendingBeat.producer_artistic_name}</span>
                        </span>
                        <div className="flex gap-4">
                            <span className="flex items-center gap-1.5 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                                {trendingBeat.bpm} BPM
                            </span>
                            <span className="flex items-center gap-1.5 text-xs">
                                <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                                {trendingBeat.musical_key || 'C Maj'}
                            </span>
                        </div>
                    </div>

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <Link
                            href={`/beats/${trendingBeat.id}`}
                            className="bg-white text-slate-900 px-8 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-blue-500 hover:text-white transition-all shadow-lg active:scale-95 flex items-center gap-2"
                        >
                            Escuchar Ahora <ArrowRight size={14} />
                        </Link>
                        <Link
                            href={`/${trendingBeat.producer_username}`}
                            className="bg-white/5 text-white border border-white/10 px-8 py-3.5 rounded-xl font-black uppercase text-[11px] tracking-widest hover:bg-white/10 transition-all backdrop-blur-md"
                        >
                            Ver Perfil
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
