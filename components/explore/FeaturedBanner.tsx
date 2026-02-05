"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Music, TrendingUp, ChevronRight, ChevronLeft, Users, Sparkles, Star, Zap, Crown, Flame } from "lucide-react";
import { Beat } from "@/lib/types";

interface FeaturedBannerProps {
    trendingBeats: Beat[];
    trendingProducers: any[];
    featuredMoods: any[];
}

type TabType = 'beats' | 'artists' | 'moods';

export default function FeaturedBanner({ trendingBeats, trendingProducers, featuredMoods }: FeaturedBannerProps) {
    const [activeTab, setActiveTab] = useState<TabType>('beats');
    const [currentIndex, setCurrentIndex] = useState(0);

    // Reset index when tab changes
    useEffect(() => {
        setCurrentIndex(0);
    }, [activeTab]);

    // Auto-rotate every 6 seconds
    useEffect(() => {
        const timer = setInterval(() => {
            const currentListLength =
                activeTab === 'beats' ? trendingBeats.length :
                    activeTab === 'artists' ? trendingProducers.length :
                        featuredMoods.length;

            if (currentListLength > 0) {
                setCurrentIndex((prev) => (prev + 1) % currentListLength);
            }
        }, 6000);
        return () => clearInterval(timer);
    }, [activeTab, trendingBeats, trendingProducers, featuredMoods]);

    const items = activeTab === 'beats' ? trendingBeats : activeTab === 'artists' ? trendingProducers : featuredMoods;
    const currentItem = items?.[currentIndex];

    if (!currentItem) return null;

    const TabButton = ({ type, label, icon: Icon }: { type: TabType, label: string, icon: any }) => (
        <button
            onClick={() => setActiveTab(type)}
            className={`flex items-center gap-2 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === type
                    ? 'bg-white text-slate-900 shadow-xl scale-105'
                    : 'bg-white/10 text-white hover:bg-white/20'
                }`}
        >
            <Icon size={12} /> {label}
        </button>
    );

    return (
        <div className="relative w-full rounded-[2.5rem] bg-slate-900 overflow-hidden text-white mb-10 min-h-[400px] flex items-center shadow-2xl shadow-slate-200 group">

            {/* Background Image with Blur */}
            <div key={`${activeTab}-${currentIndex}`} className="absolute inset-0 z-0 animate-fade-in transition-opacity duration-1000 ease-in-out">
                <img
                    src={activeTab === 'beats' ? (currentItem as Beat).portadabeat_url || '' : activeTab === 'artists' ? currentItem.foto_perfil : currentItem.image}
                    alt="Background"
                    className="w-full h-full object-cover opacity-40 blur-3xl scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/80 to-transparent"></div>
            </div>

            {/* Inner Tabs Navigation */}
            <div className="absolute top-6 left-8 md:left-16 z-30 flex gap-2">
                <TabButton type="beats" label="Beats" icon={Music} />
                <TabButton type="artists" label="Artistas" icon={Users} />
                <TabButton type="moods" label="Moods" icon={Sparkles} />
            </div>

            {/* Content Sidebar navigation for Desktop */}
            <div className="absolute right-8 top-1/2 -translate-y-1/2 z-30 hidden lg:flex flex-col gap-3">
                {items.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setCurrentIndex(i)}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'bg-white w-8' : 'bg-white/20 w-3 hover:bg-white/40'
                            }`}
                    />
                ))}
            </div>

            <div className="relative z-10 w-full p-8 md:p-16 mt-10 md:mt-0 flex flex-col md:flex-row items-center gap-8 md:gap-16">

                {/* Artwork / Avatar */}
                <div key={`media-${activeTab}-${currentIndex}`} className="relative group/media shrink-0 transition-all duration-500 animate-fade-in-up">
                    <div className="w-44 h-44 md:w-64 md:h-64 rounded-3xl overflow-hidden shadow-2xl shadow-black/50 border border-white/10 group-hover/media:rotate-0 rotate-2 transition-transform duration-500">
                        <img
                            src={activeTab === 'beats' ? (currentItem as Beat).portadabeat_url || '' : activeTab === 'artists' ? (currentItem.foto_perfil || `https://ui-avatars.com/api/?name=${currentItem.artistic_name}`) : currentItem.image}
                            className="w-full h-full object-cover"
                        />
                    </div>
                </div>

                {/* Info Section */}
                <div key={`content-${activeTab}-${currentIndex}`} className="flex-1 text-center md:text-left animate-fade-in-up">
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-4 backdrop-blur-md border ${activeTab === 'beats' ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' :
                            activeTab === 'artists' ? 'bg-amber-500/20 border-amber-400/30 text-amber-300' :
                                'bg-purple-500/20 border-purple-400/30 text-purple-300'
                        }`}>
                        {activeTab === 'beats' ? <Flame size={12} className="text-orange-400" /> : activeTab === 'artists' ? <Crown size={12} /> : <Zap size={12} />}
                        {activeTab === 'beats' ? '🔥 Beat de la Semana' : activeTab === 'artists' ? '🏆 Artista de la Semana' : '✨ Mood de la Semana'}
                    </div>

                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 leading-none">
                        {activeTab === 'beats' ? (currentItem as Beat).title : activeTab === 'artists' ? currentItem.artistic_name : currentItem.label}
                    </h1>

                    {activeTab === 'moods' && (
                        <p className="text-lg font-medium text-purple-200/80 mb-8 max-w-lg italic">
                            "{currentItem.quote}"
                        </p>
                    )}

                    {activeTab !== 'moods' && (
                        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8 mb-8">
                            <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2">
                                <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                                    <img
                                        src={activeTab === 'beats' ? ((currentItem as Beat).producer_foto_perfil || `https://ui-avatars.com/api/?name=${(currentItem as Beat).producer_artistic_name}`) : (currentItem.foto_perfil || `https://ui-avatars.com/api/?name=${currentItem.artistic_name}`)}
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div className="text-left">
                                    <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">
                                        {activeTab === 'beats' ? 'Productor' : `@${currentItem.username}`}
                                    </p>
                                    <p className="text-sm font-black text-white">
                                        {activeTab === 'beats' ? (currentItem as Beat).producer_artistic_name : currentItem.subscription_tier?.toUpperCase()}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-6 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                {activeTab === 'beats' ? (
                                    <>
                                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-amber-500 shadow-lg shadow-amber-500/50" /> {(currentItem as Beat).bpm} BPM</span>
                                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-cyan-500 shadow-lg shadow-cyan-500/50" /> {(currentItem as Beat).musical_key}</span>
                                    </>
                                ) : (
                                    <>
                                        <span className="flex items-center gap-2"><div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-lg shadow-emerald-500/50" /> {currentItem.beat_count || 12} Beats</span>
                                        <span className="flex items-center gap-2"><Star size={12} className="text-amber-400" /> {currentItem.sale_count || 0} Ventas</span>
                                    </>
                                )}
                            </div>
                        </div>
                    )}

                    <div className="flex flex-wrap justify-center md:justify-start gap-4">
                        <Link
                            href={activeTab === 'beats' ? `/beats/${currentItem.id}` : activeTab === 'artists' ? `/${currentItem.username}` : `/beats?mood=${currentItem.label}`}
                            className={`px-8 py-3.5 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-xl active:scale-95 flex items-center gap-2 group/btn ${activeTab === 'beats' ? 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700' :
                                    activeTab === 'artists' ? 'bg-white text-slate-900 shadow-white/10 hover:bg-slate-50' :
                                        'bg-purple-600 text-white shadow-purple-500/20 hover:bg-purple-700'
                                }`}
                        >
                            {activeTab === 'beats' ? 'Escuchar Ahora' : activeTab === 'artists' ? 'Ver Perfil' : 'Explorar Vibe'}
                            <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
