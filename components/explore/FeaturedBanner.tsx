"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowRight, Music, TrendingUp, ChevronRight, ChevronLeft, Users, Sparkles, Star, Zap, Crown, Flame, Instagram, Twitter, Globe, CheckCircle2 } from "lucide-react";
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

    const items = activeTab === 'beats' ? trendingBeats : activeTab === 'artists' ? trendingProducers : featuredMoods;
    const currentItem = items?.[currentIndex];

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
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === type
                ? 'bg-slate-900 text-white shadow-xl scale-105'
                : 'bg-white text-slate-400 hover:text-slate-900 border border-slate-200'
                }`}
        >
            <Icon size={12} /> {label}
        </button>
    );

    return (
        <div className="w-full mb-10 group">
            {/* Tabs Navigation (Outside and Above) */}
            <div className="flex justify-center gap-4 mb-8">
                <TabButton type="beats" label="Beats" icon={Music} />
                <TabButton type="artists" label="Artistas" icon={Users} />
                <TabButton type="moods" label="Moods" icon={Sparkles} />
            </div>

            <div className="relative w-full rounded-[3rem] bg-slate-900 overflow-hidden text-white min-h-[420px] flex items-center shadow-2xl shadow-slate-200">

                {/* Background Image with Blur */}
                <div key={`${activeTab}-${currentIndex}`} className="absolute inset-0 z-0 animate-fade-in transition-opacity duration-1000 ease-in-out">
                    <img
                        src={activeTab === 'beats' ? (currentItem as Beat).portadabeat_url || '' : activeTab === 'artists' ? (currentItem.foto_perfil || `https://ui-avatars.com/api/?name=${currentItem.artistic_name}&background=random`) : currentItem.image}
                        alt="Background"
                        className="w-full h-full object-cover opacity-30 blur-3xl scale-125"
                    />
                    <div className="absolute inset-0 bg-gradient-to-r from-slate-900 via-slate-900/60 to-transparent"></div>
                </div>

                {/* Navigation Arrows */}
                {items.length > 1 && (
                    <>
                        <button
                            onClick={prevItem}
                            className="absolute left-6 z-40 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 sm:block hidden"
                        >
                            <ChevronLeft size={24} />
                        </button>
                        <button
                            onClick={nextItem}
                            className="absolute right-6 z-40 p-3 bg-white/10 hover:bg-white/20 rounded-full backdrop-blur-md transition-all opacity-0 group-hover:opacity-100 border border-white/10 sm:block hidden"
                        >
                            <ChevronRight size={24} />
                        </button>
                    </>
                )}

                <div className="relative z-10 w-full p-8 md:p-16 flex flex-col md:flex-row items-center gap-10 md:gap-20">

                    {/* Media Content */}
                    <div key={`media-${activeTab}-${currentIndex}`} className="relative shrink-0 animate-fade-in-up">
                        <div className="w-48 h-48 md:w-72 md:h-72 rounded-[2.5rem] overflow-hidden shadow-2xl shadow-black/80 border border-white/10 rotate-1 hover:rotate-0 transition-all duration-700">
                            <img
                                src={activeTab === 'beats' ? (currentItem as Beat).portadabeat_url || '' : activeTab === 'artists' ? (currentItem.foto_perfil || `https://ui-avatars.com/api/?name=${currentItem.artistic_name}`) : currentItem.image}
                                className="w-full h-full object-cover"
                            />
                        </div>
                        {activeTab === 'artists' && (currentItem.subscription_tier === 'premium' || currentItem.subscription_tier === 'pro') && (
                            <div className="absolute -top-4 -right-4 p-3 bg-amber-500 text-white rounded-2xl shadow-xl animate-bounce">
                                <Crown size={20} />
                            </div>
                        )}
                    </div>

                    {/* Info Section */}
                    <div key={`content-${activeTab}-${currentIndex}`} className="flex-1 text-center md:text-left animate-fade-in-up">
                        <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest mb-5 backdrop-blur-md border ${activeTab === 'beats' ? 'bg-blue-500/20 border-blue-400/30 text-blue-300' :
                            activeTab === 'artists' ? 'bg-amber-500/20 border-amber-400/30 text-amber-300' :
                                'bg-purple-500/20 border-purple-400/30 text-purple-300'
                            }`}>
                            {activeTab === 'beats' ? <Flame size={12} className="text-orange-400" /> : activeTab === 'artists' ? <Star size={12} /> : <Zap size={12} />}
                            {activeTab === 'beats' ? '🔥 Beat Recomendado' : activeTab === 'artists' ? '✨ Artista Premium' : '💎 Mood de la Semana'}
                        </div>

                        <h1 className="text-4xl md:text-7xl font-black tracking-tighter mb-4 leading-none bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">
                            {activeTab === 'beats' ? (currentItem as Beat).title : activeTab === 'artists' ? currentItem.artistic_name : currentItem.label}
                            {activeTab === 'artists' && currentItem.is_verified && <CheckCircle2 size={24} className="inline-block ml-3 text-blue-400" />}
                        </h1>

                        {activeTab === 'artists' && (
                            <div className="mb-8 space-y-4">
                                <p className="text-sm md:text-base font-medium text-slate-300 leading-relaxed max-w-xl line-clamp-3">
                                    {currentItem.bio || "Productor destacado en Tianguis Beats, creando sonidos únicos que definen la escena actual con una trayectoria reconocida en la industria."}
                                </p>
                                <div className="flex items-center justify-center md:justify-start gap-4">
                                    <Link href="#" className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white border border-white/5 shadow-lg"><Instagram size={18} /></Link>
                                    <Link href="#" className="p-2.5 bg-white/5 rounded-xl hover:bg-white/10 transition-all text-slate-400 hover:text-white border border-white/5 shadow-lg"><Twitter size={18} /></Link>
                                    <Link href="#" className="p-2.5 bg-white/10 rounded-xl hover:bg-white/20 transition-all text-slate-300 hover:text-white border border-white/10 shadow-lg"><Globe size={18} /></Link>
                                </div>
                            </div>
                        )}

                        {activeTab === 'moods' && (
                            <div className="mb-8 relative py-4">
                                <div className="absolute -left-6 top-0 text-4xl opacity-20 animate-pulse">{currentItem.emoji}</div>
                                <p className="text-xl md:text-2xl font-black text-white italic tracking-tight relative z-10">
                                    "{currentItem.quote}"
                                </p>
                            </div>
                        )}

                        {activeTab === 'beats' && (
                            <div className="flex flex-col md:flex-row items-center gap-5 md:gap-10 mb-8">
                                <Link href={`/${(currentItem as Beat).producer_username}`} className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-5 py-2.5 hover:bg-white/10 transition-all group/prod shadow-xl">
                                    <div className="w-10 h-10 rounded-full overflow-hidden border-2 border-white/20">
                                        <img
                                            src={(currentItem as Beat).producer_foto_perfil || `https://ui-avatars.com/api/?name=${(currentItem as Beat).producer_artistic_name}`}
                                            className="w-full h-full object-cover group-hover/prod:scale-110 transition-transform"
                                        />
                                    </div>
                                    <div className="text-left">
                                        <p className="text-[9px] font-black text-slate-500 uppercase tracking-widest leading-none mb-1">Creado por</p>
                                        <p className="text-sm font-black text-white">{(currentItem as Beat).producer_artistic_name}</p>
                                    </div>
                                </Link>
                                <div className="flex gap-8 text-slate-400 font-bold uppercase tracking-widest text-[10px]">
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-orange-500" /> {(currentItem as Beat).bpm} BPM</span>
                                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-blue-500" /> {(currentItem as Beat).musical_key}</span>
                                </div>
                            </div>
                        )}

                        <div className="flex flex-wrap justify-center md:justify-start gap-5 items-center">
                            <Link
                                href={activeTab === 'beats' ? `/beats/${currentItem.id}` : activeTab === 'artists' ? `/${currentItem.username}` : `/beats?mood=${currentItem.label}`}
                                className={`px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest transition-all shadow-2xl active:scale-95 flex items-center gap-2 group/btn ${activeTab === 'beats' ? 'bg-blue-600 text-white shadow-blue-500/40 hover:bg-blue-700' :
                                    activeTab === 'artists' ? 'bg-white text-slate-900 shadow-white/10 hover:bg-slate-50' :
                                        'bg-purple-600 text-white shadow-purple-500/40 hover:bg-purple-700'
                                    }`}
                            >
                                {activeTab === 'beats' ? 'Escuchar Ahora' : activeTab === 'artists' ? 'Ir al Perfil' : 'Ver Colección'}
                                <ChevronRight size={16} className="group-hover/btn:translate-x-1 transition-transform" />
                            </Link>

                            {/* Progress Indicator */}
                            <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 shadow-lg">
                                <div className="flex gap-2">
                                    {items.map((_, i) => (
                                        <div
                                            key={i}
                                            className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? 'w-8 bg-white shadow-[0_0_10px_rgba(255,255,255,0.5)]' : 'w-2 bg-white/20'}`}
                                        />
                                    ))}
                                </div>
                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter w-12 text-center">
                                    {currentIndex + 1} / {items.length}
                                </span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
