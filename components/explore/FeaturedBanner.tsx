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

type TabType = 'beats' | 'artists' | 'moods';

export default function FeaturedBanner({ trendingBeats, trendingProducers, featuredMoods }: FeaturedBannerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('beats');
    const [currentIndex, setCurrentIndex] = useState(0);
    const { playBeat, currentBeat, isPlaying } = usePlayer();

    // Reset index when tab changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeTab]);

    const items = activeTab === 'beats' ? trendingBeats : activeTab === 'artists' ? trendingProducers : featuredMoods;
    const currentItem = items?.[currentIndex];

    const isThisPlaying = activeTab === 'beats' && (currentItem as Beat)?.id === currentBeat?.id && isPlaying;

    const handlePlayForBanner = (e: React.MouseEvent) => {
        e.preventDefault();
        if (activeTab === 'beats') {
            playBeat(currentItem as Beat);
        }
    };

    // Auto-rotate every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            if (items.length > 0) {
                setCurrentIndex((prev) => (prev + 1) % items.length);
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [activeTab, items]);

    if (!currentItem) return null;

    const nextItem = () => setCurrentIndex((prev) => (prev + 1) % items.length);
    const prevItem = () => setCurrentIndex((prev) => (prev - 1 + items.length) % items.length);

    const TabButton = ({ type, label, icon: Icon }: { type: TabType, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(type)}
            className={`flex items-center gap-2 px-6 md:px-10 py-5 rounded-t-[2.5rem] text-[11px] font-black uppercase tracking-[0.2em] transition-all relative min-h-[56px] ${activeTab === type
                ? 'bg-card text-accent z-30 border-t border-x border-border shadow-[0_-4px_20px_rgba(0,0,0,0.05)]'
                : 'bg-accent-soft/40 text-muted hover:text-foreground border border-border border-b-0 hover:bg-accent-soft'
                }`}
        >
            <Icon size={14} strokeWidth={3} /> {label}
            {activeTab === type && (
                <div className="absolute -bottom-2 left-0 right-0 h-4 bg-card z-40" />
            )}
        </button>
    );

    const getLiquidColors = () => {
        if (activeTab === 'beats') {
            const genre = (currentItem as Beat)?.genre;
            if (genre?.includes('Corridos')) return 'from-emerald-500/40 via-green-600/40 to-red-900/40';
            if (genre?.includes('Trap')) return 'from-purple-600/40 via-fuchsia-600/40 to-blue-900/40';
            if (genre?.includes('Reggaeton')) return 'from-orange-500/40 via-rose-600/40 to-purple-900/40';
            return 'from-blue-600/40 via-purple-600/40 to-blue-900/40';
        }
        if (activeTab === 'artists') return 'from-amber-400/40 via-orange-500/40 to-amber-900/40';
        return 'from-purple-600/40 via-pink-600/40 to-purple-900/40';
    };

    return (
        <div className="w-full mb-10 group">
            {/* Tabs Navigation (Outside and Above) */}
            <div className="flex justify-center gap-1.5 mb-[-1px] relative z-20 px-4">
                <TabButton type="beats" label="Beats" icon={Music} />
                <TabButton type="artists" label="Artistas" icon={Users} />
                <TabButton type="moods" label="Moods" icon={Sparkles} />
            </div>

            <div className="relative w-full rounded-[3.5rem] bg-slate-950 overflow-hidden text-white min-h-[520px] md:min-h-[480px] flex items-center shadow-2xl shadow-accent/5 transition-colors duration-300">

                {/* Liquid Background Effect */}
                <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
                    <div className={`absolute -top-1/4 -left-1/4 w-full h-full bg-gradient-to-br ${getLiquidColors()} rounded-full blur-[120px] animate-pulse duration-[10000ms] opacity-60`}></div>
                    <div className={`absolute -bottom-1/4 -right-1/4 w-full h-full bg-gradient-to-tl ${getLiquidColors()} rounded-full blur-[120px] animate-pulse duration-[8000ms] opacity-60`}></div>
                    <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1/2 h-1/2 bg-white/5 rounded-full blur-[80px]`}></div>
                </div>

                {/* Background Image with Blur */}
                <div key={`${activeTab}-${currentIndex}`} className="absolute inset-0 z-0 animate-fade-in transition-opacity duration-1000 ease-in-out">
                    <img
                        src={activeTab === 'beats' ?
                            ((currentItem as Beat).genre === 'Corridos Tumbados 🇲🇽' ? 'https://images.unsplash.com/photo-1593030230495-9f5e04cb2a01?q=80&w=2070&auto=format&fit=crop' :
                                (currentItem as Beat).genre === 'Trap' ? 'https://images.unsplash.com/photo-1514525253361-bee84384c484?q=80&w=2070&auto=format&fit=crop' :
                                    (currentItem as Beat).portadabeat_url || '') :
                            activeTab === 'artists' ? (currentItem.foto_perfil || `https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop`) :
                                currentItem.image}
                        alt="Background"
                        className={`w-full h-full object-cover ${activeTab === 'moods' ? 'opacity-40 blur-none' : activeTab === 'artists' ? 'opacity-40 blur-2xl' : 'opacity-20 blur-3xl'} scale-125 transition-all duration-1000`}
                    />
                    <div className={`absolute inset-0 ${activeTab === 'moods' ? 'bg-black/60' : 'bg-gradient-to-r from-slate-950 via-slate-950/40 to-transparent'}`}></div>
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
                    <div key={`media-${activeTab}-${currentIndex}`} className="relative shrink-0 animate-fade-in-up">
                        {activeTab !== 'moods' && (
                            <div className="w-48 h-48 md:w-80 md:h-80 rounded-[3rem] md:rounded-[4rem] overflow-hidden shadow-2xl shadow-black transition-all duration-1000 flex items-center justify-center p-2 bg-white/5 backdrop-blur-sm border border-white/10">
                                <img
                                    src={activeTab === 'beats' ? (currentItem as Beat).portadabeat_url || '' : (currentItem.foto_perfil || `https://ui-avatars.com/api/?name=${currentItem.artistic_name || currentItem.username}&background=random`)}
                                    className="w-full h-full object-cover rounded-[2.5rem] md:rounded-[3.5rem]"
                                    onError={(e) => {
                                        (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${currentItem.artistic_name || currentItem.username || 'TB'}&background=3b82f6&color=fff`;
                                    }}
                                />
                            </div>
                        )}
                        {activeTab === 'artists' && (currentItem.subscription_tier === 'premium' || currentItem.subscription_tier === 'pro') && (
                            <div className="absolute -top-4 -right-4 p-4 bg-amber-500 text-white rounded-[1.5rem] shadow-2xl animate-bounce shadow-amber-500/40">
                                <Crown size={24} fill="currentColor" />
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div key={`content-${activeTab}-${currentIndex}`} className="flex-1 text-center md:text-left animate-fade-in-up">
                        <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full text-[10px] md:text-[12px] font-black uppercase tracking-[0.2em] mb-6 md:mb-10 backdrop-blur-2xl border ${activeTab === 'beats' ? 'bg-accent/30 border-accent/40 text-blue-200' :
                            activeTab === 'artists' ? 'bg-amber-600/30 border-amber-400/40 text-amber-200' :
                                'bg-purple-600/30 border-purple-400/40 text-purple-200'
                            }`}>
                            {activeTab === 'beats' ? <Flame size={16} className="text-orange-400 animate-pulse" /> : activeTab === 'artists' ? <Star size={16} className="text-amber-400" /> : <Sparkles size={16} className="text-purple-400" />}
                            {activeTab === 'beats' ? '🔥 Top Hits' : activeTab === 'artists' ? '✨ Protagonistas' : '💎 Mood Selection'}
                        </div>

                        <h1 className="text-3xl md:text-7xl font-black tracking-tighter mb-4 md:mb-6 leading-[0.9] bg-clip-text text-transparent bg-gradient-to-br from-white to-white/40 lowercase font-heading">
                            {activeTab === 'beats' ? (currentItem as Beat).title : (currentItem.artistic_name || currentItem.username || 'Artista')}
                            {activeTab === 'artists' && (
                                <span className="inline-flex items-center gap-4 ml-4 md:ml-6">
                                    {currentItem.is_verified && (
                                        <img src="/verified-badge.png" alt="Verificado" className="w-6 h-6 md:w-8 md:h-8 object-contain" />
                                    )}
                                </span>
                            )}
                        </h1>

                        {activeTab === 'artists' && (
                            <div className="mb-6 md:mb-10 space-y-4 md:space-y-8">
                                <div className="flex flex-wrap gap-4 md:gap-8 text-[10px] md:text-[11px] font-black uppercase tracking-[0.3em] text-slate-400 justify-center md:justify-start">
                                    <span className="flex items-center gap-2">
                                        <Globe size={14} className="text-accent" /> {currentItem.country || 'México'}
                                    </span>
                                    <span className="flex items-center gap-2">
                                        <Users size={14} className="text-purple-400" /> Miembro desde {new Date(currentItem.created_at || Date.now()).getFullYear()}
                                    </span>
                                </div>
                                <p className="text-sm md:text-lg font-medium text-slate-300 leading-relaxed max-w-2xl line-clamp-2 italic font-body">
                                    "{currentItem.bio || "Productor destacado en Tianguis Beats, definiendo el sonido de la escena actual."}"
                                </p>
                            </div>
                        )}

                        {activeTab === 'moods' && (
                            <div className="mb-8 md:mb-12 relative">
                                <p className="text-2xl md:text-6xl font-black text-white italic tracking-tighter relative z-10 leading-tight max-w-3xl font-heading">
                                    {currentItem.quote}
                                </p>
                            </div>
                        )}

                        {activeTab === 'beats' && (
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
                        )}

                        <div className="flex flex-wrap justify-center md:justify-start gap-4 md:gap-6 items-center mt-4 text-white">
                            {activeTab === 'beats' && (
                                <button
                                    onClick={handlePlayForBanner}
                                    className={`w-16 h-16 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center transition-all shadow-2xl active:scale-95 border backdrop-blur-md min-h-[64px] min-w-[64px] ${isThisPlaying ? 'bg-white text-accent border-white' : 'bg-white/10 text-white border-white/20 hover:bg-white/20'}`}
                                >
                                    {isThisPlaying ? <Pause size={28} fill="currentColor" /> : <Play size={28} fill="currentColor" className="ml-1" />}
                                </button>
                            )}
                            <Link
                                href={activeTab === 'beats' ? `/beats/${currentItem.id}` : activeTab === 'artists' ? `/${currentItem.username}` : `/beats?mood=${currentItem.label}`}
                                className={`px-10 py-5 md:px-16 md:py-6 rounded-[2rem] md:rounded-[2.5rem] font-black uppercase text-[12px] md:text-[14px] tracking-[0.25em] transition-all shadow-3xl active:scale-95 flex items-center gap-3 md:gap-4 group/btn-main min-h-[56px] ${activeTab === 'beats' ? 'bg-accent text-white shadow-accent/40 hover:bg-blue-500 hover:scale-105' :
                                    activeTab === 'artists' ? 'bg-white text-slate-950 shadow-white/10 hover:bg-slate-50 hover:scale-105' :
                                        'bg-purple-600 text-white shadow-purple-600/40 hover:bg-purple-700 hover:scale-105'
                                    }`}
                            >
                                {activeTab === 'beats' ? 'Ver Detalles' : activeTab === 'artists' ? 'Ver Perfil' : 'Explorar'}
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
