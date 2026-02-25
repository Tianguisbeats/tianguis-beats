/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, ChevronRight, ChevronLeft, Users, Play, Pause, Flame, Sparkles, Crown, CheckCircle2 } from "lucide-react";
import { Beat } from "@/lib/types";
import { usePlayer } from "@/context/PlayerContext";

interface FeaturedBannerProps {
    trendingBeats: Beat[];
    trendingProducers: Record<string, unknown>[];
    featuredMoods: Record<string, unknown>[];
}

export default function FeaturedBanner({ trendingBeats, trendingProducers }: FeaturedBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const { playBeat, currentBeat, isPlaying } = usePlayer();

    // Combinar hasta 10 hits (priorizando beats luego productores)
    const hits = [
        ...trendingBeats.slice(0, 6).map(b => ({ type: 'beat', data: b })),
        ...trendingProducers.slice(0, 4).map(p => ({ type: 'producer', data: p }))
    ].slice(0, 10);

    const activeHit = hits?.[currentIndex];
    const isBeat = activeHit?.type === 'beat';
    const data = activeHit?.data;
    const isThisPlaying = isBeat && (data as Beat)?.id === currentBeat?.id && isPlaying;

    useEffect(() => {
        const timer = setInterval(() => {
            if (hits.length > 0) {
                setCurrentIndex((prev) => (prev + 1) % hits.length);
            }
        }, 8000);
        return () => clearInterval(timer);
    }, [hits.length]);

    if (!activeHit) return null;

    const nextHit = () => setCurrentIndex((prev) => (prev + 1) % hits.length);
    const prevHit = () => setCurrentIndex((prev) => (prev - 1 + hits.length) % hits.length);

    // Helper para obtener info del productor de forma segura
    const getProducerInfo = (): {
        nombre_artistico: string;
        nombre_usuario: string;
        foto_perfil: string;
        esta_verificado: boolean;
        es_fundador: boolean;
    } => {
        if (isBeat) {
            const beat = data as Beat;
            const producerObj = (beat as any).productor as Record<string, unknown>;
            return {
                nombre_artistico: (producerObj?.nombre_artistico as string) || beat.productor_nombre_artistico || "Productor",
                nombre_usuario: (producerObj?.nombre_usuario as string) || beat.productor_nombre_usuario || "anonymous",
                foto_perfil: (producerObj?.foto_perfil as string) || beat.productor_foto_perfil || "",
                esta_verificado: !!(producerObj?.esta_verificado || beat.productor_esta_verificado),
                es_fundador: !!(producerObj?.es_fundador || beat.productor_es_fundador)
            };
        } else {
            const profile = data as Record<string, unknown>;
            return {
                nombre_artistico: (profile.nombre_artistico as string) || (profile.nombre_usuario as string),
                nombre_usuario: profile.nombre_usuario as string,
                foto_perfil: (profile.foto_perfil as string) || "",
                esta_verificado: !!profile.esta_verificado,
                es_fundador: !!profile.es_fundador
            };
        }
    };

    const prodInfo = getProducerInfo();

    return (
        <div className="w-full mb-12 group relative">
            {/* Main Premium Container */}
            <div className="relative w-full aspect-[21/9] md:aspect-[25/9] rounded-[4rem] overflow-hidden bg-background flex shadow-[0_40px_100px_-20px_rgba(0,0,0,0.5)] border border-border/50">

                {/* Dynamic Background */}
                <div className="absolute inset-0 overflow-hidden">
                    <img
                        src={(isBeat ? (data as Beat).portada_url : (data as Record<string, unknown>).foto_perfil as string) || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"}
                        className="w-full h-full object-cover opacity-30 blur-2xl scale-125 transition-all duration-1000 ease-in-out"
                        alt="Background Glow"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-background via-background/80 to-transparent"></div>
                    <div className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background to-transparent"></div>
                </div>

                {/* Glass Card Content */}
                <div className="relative z-10 w-full h-full flex items-center px-10 md:px-24">
                    <div className="flex flex-col md:flex-row items-center gap-10 md:gap-20 w-full animate-in fade-in slide-in-from-bottom-5 duration-1000">

                        {/* Artwork */}
                        <div className="relative shrink-0 perspective-1000 group/art">
                            <div className="w-48 h-48 md:w-80 md:h-80 rounded-[3rem] overflow-hidden rotate-3 group-hover/art:rotate-0 transition-transform duration-700 shadow-2xl border border-white/10 relative">
                                <img
                                    src={(isBeat ? (data as Beat).portada_url : (data as Record<string, unknown>).foto_perfil as string) || `https://ui-avatars.com/api/?name=${prodInfo.nombre_artistico}&background=random`}
                                    className="w-full h-full object-cover"
                                    alt="Artwork"
                                />
                                {isThisPlaying && (
                                    <div className="absolute inset-0 bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                                        <div className="flex gap-1.5 h-12 items-end">
                                            <div className="w-1.5 bg-white animate-[music-bar_1s_ease-in-out_infinite]"></div>
                                            <div className="w-1.5 bg-white animate-[music-bar_1.2s_ease-in-out_infinite]"></div>
                                            <div className="w-1.5 bg-white animate-[music-bar_0.8s_ease-in-out_infinite]"></div>
                                            <div className="w-1.5 bg-white animate-[music-bar_1.4s_ease-in-out_infinite]"></div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Hit Badge Floating */}
                            <div className="absolute -top-4 -right-4 bg-background border border-border text-foreground px-6 py-2 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-2xl flex items-center gap-2 select-none">
                                <Flame size={14} className="text-accent fill-accent animate-pulse" />
                                {isBeat ? 'Hits de la semana' : 'Top Productor'}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col items-center md:items-start text-center md:text-left">
                            <div className="flex items-center gap-4 mb-6 opacity-0 animate-[fade-in_1s_ease-in-out_forwards_0.5s]">
                                <span className="bg-accent/10 border border-accent/20 text-accent text-[9px] font-black uppercase tracking-[0.4em] px-4 py-1.5 rounded-full">
                                    {isBeat ? 'Trending Track' : 'Featured Producer'}
                                </span>
                                {prodInfo.esta_verificado && (
                                    <CheckCircle2 size={16} className="text-info" />
                                )}
                            </div>

                            <h2 className="text-4xl md:text-7xl font-black text-white uppercase tracking-tighter mb-4 font-heading leading-none group-hover:tracking-tight transition-all duration-700">
                                {isBeat ? (data as Beat).titulo : prodInfo.nombre_artistico}
                            </h2>

                            <div className="flex items-center gap-6 mb-10 text-muted">
                                <Link href={`/${prodInfo.nombre_usuario}`} className="flex items-center gap-6 group/prod">
                                    <div className="relative">
                                        <img src={prodInfo.foto_perfil || `https://ui-avatars.com/api/?name=${prodInfo.nombre_artistico}`} alt={prodInfo.nombre_artistico as string} className="w-20 h-20 md:w-28 md:h-28 rounded-3xl object-cover border-2 border-border group-hover/prod:border-accent transition-all duration-500 shadow-2xl" />
                                        {prodInfo.esta_verificado && (
                                            <div className="absolute -bottom-2 -right-2 w-8 h-8 bg-background rounded-full flex items-center justify-center border-2 border-border shadow-lg">
                                                <img src="/verified-badge.png" className="w-5 h-5 object-contain" alt="Verified" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex flex-col gap-1">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xl md:text-2xl font-black uppercase tracking-widest group-hover/prod:text-accent transition-colors leading-none">{prodInfo.nombre_artistico}</span>
                                            {prodInfo.es_fundador && <Crown size={22} className="text-accent fill-accent animate-pulse" />}
                                        </div>
                                        <span className="text-xs font-bold text-muted tracking-[0.2em] uppercase opacity-60 group-hover/prod:opacity-100 transition-opacity">@{prodInfo.nombre_usuario}</span>
                                    </div>
                                </Link>
                                <div className="h-4 w-[1px] bg-border/20"></div>
                                <div className="flex items-center gap-2">
                                    <Sparkles size={16} className="text-accent" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Billboard Top 10</span>
                                </div>
                            </div>

                            <div className="flex items-center gap-4">
                                {isBeat ? (
                                    <>
                                        <button
                                            onClick={() => playBeat(data as Beat)}
                                            className={`h-12 w-12 md:h-14 md:w-14 rounded-2xl flex items-center justify-center transition-all duration-300 shadow-xl active:scale-95 ${isThisPlaying ? 'bg-white text-accent' : 'bg-accent text-white hover:scale-110'}`}
                                        >
                                            {isThisPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" className="ml-1" />}
                                        </button>
                                        <Link
                                            href={`/beats/${(data as Beat).id}`}
                                            className="px-6 h-12 md:h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-white flex items-center gap-3 group/btn transition-all active:scale-95"
                                        >
                                            <span className="text-[9px] font-black uppercase tracking-widest">Ver Detalles</span>
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </>
                                ) : (
                                    <Link
                                        href={`/${prodInfo.nombre_usuario}`}
                                        className="px-8 h-14 bg-accent text-white rounded-2xl flex items-center gap-3 group/btn transition-all shadow-lg shadow-accent/40 active:scale-95"
                                    >
                                        <span className="text-[9px] font-black uppercase tracking-widest">Ver Perfil</span>
                                        <Users size={16} className="group-hover/btn:rotate-12 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Overlaid UI Controls */}
                <div className="absolute right-12 bottom-12 flex items-center gap-4 z-20">
                    <button onClick={prevHit} className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md active:scale-90">
                        <ChevronLeft size={20} />
                    </button>
                    <button onClick={nextHit} className="w-12 h-12 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center text-white hover:bg-white/20 transition-all backdrop-blur-md active:scale-90">
                        <ChevronRight size={20} />
                    </button>
                </div>

                {/* Horizontal Indicators - Centered Bottom */}
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2">
                    {hits.map((_, i) => (
                        <div
                            key={i}
                            onClick={() => setCurrentIndex(i)}
                            className={`h-1 transition-all duration-500 rounded-full cursor-pointer ${i === currentIndex ? 'w-10 bg-accent' : 'w-4 bg-white/10 hover:bg-white/30'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Custom Animations Inline to ensure they work */}
            <style jsx>{`
                @keyframes music-bar {
                    0%, 100% { height: 10%; }
                    50% { height: 100%; }
                }
            `}</style>
        </div>
    );
}
