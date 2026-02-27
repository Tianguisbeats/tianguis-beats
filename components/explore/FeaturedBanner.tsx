/* eslint-disable @next/next/no-img-element */
"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { ArrowRight, Play, Pause, Flame, Crown, CheckCircle2, Music2, Users, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Beat } from "@/lib/types";
import { usePlayer } from "@/context/PlayerContext";

interface FeaturedBannerProps {
    trendingBeats: Beat[];
    trendingProducers: Record<string, unknown>[];
    featuredMoods: Record<string, unknown>[];
}

export default function FeaturedBanner({ trendingBeats, trendingProducers }: FeaturedBannerProps) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [animating, setAnimating] = useState(false);
    const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
    const { playBeat, currentBeat, isPlaying } = usePlayer();

    // Create a mixed array: alternating beat and producer
    const beats = trendingBeats.slice(0, 5);
    const producers = trendingProducers.slice(0, 5);

    const mixedItems: any[] = [];
    const maxLength = Math.max(beats.length, producers.length);
    for (let i = 0; i < maxLength; i++) {
        if (i < beats.length) mixedItems.push({ ...beats[i], type: 'beat' });
        if (i < producers.length) mixedItems.push({ ...producers[i], type: 'producer' });
    }

    const items = mixedItems;

    const navigate = (dir: 1 | -1) => {
        setAnimating(true);
        setTimeout(() => {
            setCurrentIndex((prev) => (prev + dir + items.length) % items.length);
            setAnimating(false);
        }, 200);
    };

    useEffect(() => {
        if (items.length <= 1) return;
        intervalRef.current = setInterval(() => {
            setAnimating(true);
            setTimeout(() => {
                setCurrentIndex(p => (p + 1) % items.length);
                setAnimating(false);
            }, 200);
        }, 8000);
        return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
    }, [items.length]);

    if (items.length === 0) return null;

    const currentItem = items[currentIndex];
    const isBeat = currentItem.type === 'beat';

    // For beats, we might have nested producer info
    const beatProducer = isBeat ? (currentItem.producer || currentItem.productor) : null;
    const isBeatPlaying = isBeat && currentBeat?.id === currentItem.id && isPlaying;

    return (
        <section className="py-8 px-4">
            <div className="max-w-[1700px] mx-auto">

                {/* Section Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 mb-10">
                    <div>
                        <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-none">
                            Trending de<br />
                            <span className="text-accent">esta semana.</span>
                        </h2>
                    </div>
                </div>

                {/* Main Card */}
                <div className="relative rounded-[3rem] overflow-hidden border border-border bg-card shadow-2xl"
                    style={{ minHeight: '420px' }}>

                    {/* Blurred background */}
                    <div className="absolute inset-0 overflow-hidden">
                        <img
                            src={
                                isBeat
                                    ? (currentItem.portada_url || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop")
                                    : ((currentItem.foto_perfil as string) || "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop")
                            }
                            className="w-full h-full object-cover opacity-20 blur-3xl scale-125 transition-all duration-1000"
                            alt=""
                        />
                        <div className="absolute inset-0 bg-gradient-to-r from-card via-card/90 to-card/60" />
                        <div className="absolute inset-0 bg-gradient-to-t from-card/80 via-transparent to-transparent" />
                    </div>

                    {/* Content */}
                    <div className={`relative z-10 flex flex-col lg:flex-row items-center gap-10 p-10 md:p-16 transition-all duration-200 ${animating ? 'opacity-0 translate-y-2' : 'opacity-100 translate-y-0'}`}>

                        {/* Artwork */}
                        <div className="relative shrink-0 group/art">
                            <div className="w-52 h-52 md:w-72 md:h-72 rounded-[2.5rem] overflow-hidden border border-border shadow-2xl transition-transform duration-700 group-hover/art:scale-105 group-hover/art:rotate-1">
                                <img
                                    src={
                                        isBeat
                                            ? (currentItem.portada_url || "/logo.png")
                                            : ((currentItem.foto_perfil as string) || "/logo.png")
                                    }
                                    className="w-full h-full object-cover"
                                    alt="Artwork"
                                />
                                {isBeat && isBeatPlaying && (
                                    <div className="absolute inset-0 bg-accent/20 backdrop-blur-sm flex items-center justify-center">
                                        <div className="flex gap-1.5 h-12 items-end">
                                            {[1, 1.2, 0.8, 1.4].map((d, i) => (
                                                <div key={i} className="w-1.5 bg-white rounded-full animate-bounce" style={{ animationDuration: `${d}s`, height: '40%', animationIterationCount: 'infinite' }} />
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Floating badge */}
                            <div className="absolute -top-3 -right-3 bg-background border border-border px-4 py-1.5 rounded-xl font-black uppercase text-[9px] tracking-widest shadow-xl flex items-center gap-2">
                                <Flame size={12} className="text-accent fill-accent animate-pulse" />
                                {isBeat ? 'Hit de la Semana' : 'Productor Destacado'}
                            </div>

                            {/* Index dots */}
                            <div className="absolute -bottom-5 left-1/2 -translate-x-1/2 flex items-center gap-1.5">
                                {items.map((_, i) => (
                                    <button
                                        key={i}
                                        onClick={() => { setAnimating(true); setTimeout(() => { setCurrentIndex(i); setAnimating(false); }, 200); }}
                                        className={`rounded-full transition-all duration-300 ${i === currentIndex ? 'w-6 h-1.5 bg-accent' : 'w-1.5 h-1.5 bg-foreground/20 hover:bg-foreground/40'}`}
                                    />
                                ))}
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex-1 flex flex-col items-center lg:items-start text-center lg:text-left mt-6 lg:mt-0">
                            {/* Tag */}
                            <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-accent/10 border border-accent/20 rounded-full mb-5">
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] text-accent">
                                    {isBeat ? `Trending Beat` : `Top Productor`}
                                </span>
                            </div>

                            {/* Title */}
                            <h3 className="text-4xl md:text-6xl font-black text-foreground uppercase tracking-tighter leading-none mb-5">
                                {isBeat
                                    ? currentItem.titulo
                                    : (currentItem.nombre_artistico || currentItem.nombre_usuario)}
                            </h3>

                            {/* Producer info for beats */}
                            {isBeat && beatProducer && (
                                <Link href={`/${beatProducer.nombre_usuario || '#'}`}
                                    className="flex items-center gap-4 mb-8 group/prod self-center lg:self-start">
                                    <div className="relative">
                                        <img src={beatProducer.foto_perfil || "/logo.png"} alt=""
                                            className="w-12 h-12 rounded-2xl object-cover border border-border group-hover/prod:border-accent transition-colors" />
                                        {beatProducer.esta_verificado && (
                                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-background rounded-full flex items-center justify-center border border-border">
                                                <img src="/verified-badge.png" className="w-3 h-3" alt="✓" />
                                            </div>
                                        )}
                                    </div>
                                    <div>
                                        <div className="flex items-center gap-2">
                                            <span className="font-black text-foreground uppercase text-sm tracking-wider group-hover/prod:text-accent transition-colors">
                                                {beatProducer.nombre_artistico || beatProducer.nombre_usuario}
                                            </span>
                                            {beatProducer.es_fundador && <Crown size={14} className="text-amber-500 fill-amber-500" />}
                                        </div>
                                        <span className="text-[9px] font-bold text-muted uppercase tracking-widest opacity-60">
                                            @{beatProducer.nombre_usuario}
                                        </span>
                                    </div>
                                </Link>
                            )}

                            {/* Badges for producers */}
                            {!isBeat && (
                                <div className="flex items-center gap-4 mb-8 self-center lg:self-start">
                                    {currentItem.esta_verificado && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl">
                                            <ShieldCheck size={14} className="text-blue-400" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-blue-400">Verificado</span>
                                        </div>
                                    )}
                                    {currentItem.es_fundador && (
                                        <div className="flex items-center gap-2 px-3 py-1.5 bg-amber-500/10 border border-amber-500/20 rounded-xl">
                                            <Crown size={14} className="text-amber-500 fill-amber-500" />
                                            <span className="text-[9px] font-black uppercase tracking-widest text-amber-500">Fundador</span>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Beat Stats */}
                            {isBeat && (
                                <div className="flex items-center gap-6 mb-8 text-muted self-center lg:self-start">
                                    {currentItem.genero && (
                                        <div className="px-3 py-1 bg-foreground/5 border border-border rounded-xl text-[9px] font-black uppercase tracking-widest">
                                            {currentItem.genero}
                                        </div>
                                    )}
                                    {currentItem.bpm && (
                                        <div className="text-[9px] font-bold uppercase tracking-widest">
                                            <span className="text-accent font-black">{currentItem.bpm}</span> BPM
                                        </div>
                                    )}
                                    {currentItem.conteo_reproducciones > 0 && (
                                        <div className="text-[9px] font-bold uppercase tracking-widest">
                                            <span className="text-foreground font-black">{(currentItem.conteo_reproducciones || 0).toLocaleString('es-MX')}</span> plays
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Actions */}
                            <div className="flex items-center gap-4 self-center lg:self-start">
                                {isBeat ? (
                                    <>
                                        <button
                                            onClick={() => playBeat(mixedItems[currentIndex])}
                                            className={`h-14 w-14 rounded-2xl flex items-center justify-center transition-all shadow-xl active:scale-95 ${isBeatPlaying ? 'bg-white text-accent' : 'bg-accent text-white hover:scale-110 shadow-accent/30'}`}
                                        >
                                            {isBeatPlaying ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-1" />}
                                        </button>
                                        <Link href={`/beats/${currentItem.id}`}
                                            className="inline-flex items-center gap-3 px-6 h-14 bg-foreground/5 border border-border hover:bg-foreground/10 hover:border-accent/30 rounded-2xl text-foreground transition-all group/btn">
                                            <span className="text-[9px] font-black uppercase tracking-widest">Ver Detalles</span>
                                            <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                                        </Link>
                                    </>
                                ) : (
                                    <Link href={`/${currentItem.nombre_usuario}`}
                                        className="inline-flex items-center gap-3 px-8 h-14 bg-accent text-white rounded-2xl transition-all shadow-xl shadow-accent/20 hover:scale-[1.02] active:scale-95 group/btn">
                                        <span className="text-[9px] font-black uppercase tracking-widest">Ver Perfil</span>
                                        <ArrowRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                                    </Link>
                                )}
                            </div>
                        </div>

                        {/* Right: thumbnail strip */}
                        <div className="hidden xl:flex flex-col gap-3 shrink-0">
                            {items.slice(0, 7).map((item: any, i) => {
                                const isActive = i === currentIndex;
                                const isItemBeat = item.type === 'beat';
                                const img = isItemBeat ? item.portada_url : item.foto_perfil;
                                const name = isItemBeat ? item.titulo : (item.nombre_artistico || item.nombre_usuario);
                                return (
                                    <button
                                        key={i}
                                        onClick={() => { setAnimating(true); setTimeout(() => { setCurrentIndex(i); setAnimating(false); }, 200); }}
                                        className={`flex items-center gap-3 p-3 rounded-2xl border transition-all duration-300 text-left w-52 ${isActive ? 'bg-accent/10 border-accent/30' : 'bg-foreground/5 border-border hover:bg-foreground/10'}`}
                                    >
                                        <div className={`w-10 h-10 rounded-xl overflow-hidden shrink-0 border transition-colors ${isActive ? 'border-accent/40' : 'border-border'}`}>
                                            <img src={img || "/logo.png"} alt="" className="w-full h-full object-cover" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className={`text-[9px] font-black uppercase tracking-widest truncate transition-colors ${isActive ? 'text-accent' : 'text-foreground'}`}>
                                                {name}
                                            </p>
                                            {isItemBeat && item.genero && (
                                                <p className="text-[8px] font-bold text-muted uppercase tracking-widest truncate opacity-60 mt-0.5">{item.genero}</p>
                                            )}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Nav Arrows */}
                    <div className="absolute right-8 bottom-8 flex items-center gap-2 z-20">
                        <button onClick={() => navigate(-1)} className="w-11 h-11 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-foreground hover:bg-foreground/10 hover:border-accent/30 transition-all active:scale-90">
                            <ChevronLeft size={18} />
                        </button>
                        <button onClick={() => navigate(1)} className="w-11 h-11 rounded-2xl bg-foreground/5 border border-border flex items-center justify-center text-foreground hover:bg-foreground/10 hover:border-accent/30 transition-all active:scale-90">
                            <ChevronRight size={18} />
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
}
