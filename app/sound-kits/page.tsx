"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    Zap, ArrowLeft, Music, Crown, ShoppingCart, Package,
    ArrowRight, Star, Headphones, TrendingUp, Heart, Clock, Trophy, Gem, SlidersHorizontal
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import { usePlayer } from "@/context/PlayerContext";
import { useToast } from "@/context/ToastContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SoundKitCard from "@/components/explore/SoundKitCard";
import { motion } from "framer-motion";
import { 
    AbstractHomeBack, ParallaxBackground, FloatingParticles, useScrollProgress, ScrollReveal 
} from "@/components/ui/BackgroundEffects";

export default function SoundKitsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin" />
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Cargando Kits...</p>
            </div>
        }>
            <SoundKitsContent />
        </Suspense>
    );
}

function SoundKitsContent() {
    const [kits, setKits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrency();
    const { progress, scrollY } = useScrollProgress();

    useEffect(() => {
        async function fetchKits() {
            try {
                const { data, error } = await supabase
                    .from('kits_sonido')
                    .select(`
                        id, titulo, precio, descripcion, fecha_creacion, url_archivo, url_portada, archivo_muestra_url,
                        productor_id,
                        producer:productor_id ( nombre_artistico, nombre_usuario, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador )
                    `)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false });

                if (error) throw error;

                const resolvedKits = (data || []).map(kit => {
                    let coverUrl = kit.url_portada;
                    let audioUrl = kit.archivo_muestra_url;

                    if (coverUrl && !coverUrl.startsWith('http')) {
                        const { data: pData } = supabase.storage.from('portadas_kits_sonido').getPublicUrl(coverUrl);
                        coverUrl = pData?.publicUrl;
                    }

                    if (audioUrl && !audioUrl.startsWith('http')) {
                        const { data: aData } = supabase.storage.from('muestras_kits_sonido').getPublicUrl(audioUrl);
                        audioUrl = aData?.publicUrl;
                    }

                    return { ...kit, url_portada: coverUrl, archivo_muestra_url: audioUrl };
                });

                setKits(resolvedKits);
            } catch (err) {
                console.error("Error fetching sound kits:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchKits();
    }, []);

    const KitSkeleton = () => (
        <div className="bg-white/40 dark:bg-black/20 backdrop-blur-xl rounded-[2.5rem] p-6 border border-white/20 dark:border-white/10 shadow-soft animate-pulse flex flex-col h-full">
            <div className="aspect-[4/5] bg-orange-500/10 rounded-[2rem] mb-6"></div>
            <div className="h-5 bg-orange-500/10 rounded-full w-3/4 mb-4"></div>
            <div className="mt-auto flex justify-between items-center bg-orange-500/5 p-4 rounded-2xl">
                <div className="h-5 bg-orange-500/10 rounded-full w-12"></div>
                <div className="h-8 bg-orange-500/10 rounded-xl w-20"></div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-white text-black dark:bg-[#0A0A0A] dark:text-white font-sans selection:bg-orange-500 selection:text-white flex flex-col transition-colors duration-300">
            <Navbar minimal={true} />

            <ParallaxBackground scrollY={scrollY} />
            <FloatingParticles />

            <main className="flex-1 pb-32 relative">
                
                {/* ── Premium Hero Header ── */}
                <div className="relative pt-24 pb-10 md:pt-40 md:pb-20 overflow-hidden">
                    <AbstractHomeBack theme="orange" opacity={1} />
                    
                    {/* Giant Watermark - Premium Simplified */}
                    <div className="absolute inset-x-0 bottom-[-5%] flex items-center justify-center pointer-events-none select-none overflow-hidden">
                        <motion.span 
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-[22vw] font-black leading-none text-orange-500/[0.03] dark:text-orange-500/[0.05] tracking-tighter uppercase block whitespace-nowrap"
                        >
                            SOUND KITS
                        </motion.span>
                    </div>

                    <div className="max-w-[1700px] mx-auto px-6 sm:px-12 relative z-10">
                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-12">
                            <ScrollReveal direction="up" delay={0.1}>
                                <div className="flex items-center gap-3 mb-8">
                                    <span className="relative flex h-2 w-2">
                                        <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
                                    </span>
                                    <span className="text-[10px] font-black uppercase tracking-[0.6em] text-orange-600 dark:text-orange-500 mix-blend-difference dark:mix-blend-normal">Tianguis Original</span>
                                </div>
                                <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[8rem] font-black uppercase tracking-tighter leading-[0.85] mb-6 md:mb-8 relative z-10">
                                    <span className="text-orange-500">Sound</span><br />
                                    <span className="text-slate-400/50 dark:text-white/20">Kits</span>
                                </h1>
                                <p className="text-black/50 dark:text-white/30 text-[11px] font-black uppercase tracking-[0.4em] relative z-10">
                                    {loading ? 'Preparando...' : `${kits.length} drumkits y samples curados`}
                                </p>
                            </ScrollReveal>
                        </div>
                    </div>
                </div>

                <div className="px-4 sm:px-10 max-w-[1700px] mx-auto w-full mt-12 overflow-hidden">
                    <div className="flex flex-col lg:flex-row gap-12 items-start">
                        
                        <div className="flex-1 w-full min-w-0">
                            <div className="flex items-center justify-between mb-12">
                                <Link href="/beats" className="group flex items-center gap-3 text-muted-foreground hover:text-orange-500 font-bold uppercase text-[10px] tracking-widest transition-all">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-r from-orange-500 to-amber-500 text-white backdrop-blur-xl border border-transparent flex items-center justify-center group-hover:shadow-lg group-hover:shadow-orange-500/30 group-hover:-translate-x-1 transition-all">
                                        <ArrowLeft size={14} strokeWidth={3} />
                                    </div>
                                    <span>Tianguis Principal</span>
                                </Link>

                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2 px-5 py-3 bg-white/40 dark:bg-white/5 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full">
                                        <Package size={14} className="text-orange-500" />
                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-500 dark:text-muted">{kits.length} Disponibles</span>
                                    </div>
                                </div>
                            </div>

                            <div className="relative w-full mb-16">
                                <div id="tabs-container" className="flex items-center gap-3 overflow-x-auto no-scrollbar snap-x snap-mandatory scroll-smooth justify-start pb-6">
                                    <button className="snap-center flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 min-h-[52px] relative group bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-500/30">
                                        <Package size={14} strokeWidth={3} className="text-white" />
                                        <span>Todos los Kits</span>
                                    </button>
                                    <button className="snap-center flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 min-h-[52px] relative group text-slate-500 hover:text-black dark:text-white/40 dark:hover:text-white border border-slate-200 hover:border-slate-300 dark:border-white/5 dark:hover:border-white/20 bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5">
                                        <Zap size={14} strokeWidth={2} className="text-orange-500 group-hover:scale-110 transition-transform" />
                                        <span>Nuevos</span>
                                    </button>
                                    <button className="snap-center flex-shrink-0 flex items-center gap-3 px-8 py-4 rounded-full font-black text-[10px] uppercase tracking-[0.2em] transition-all duration-300 min-h-[52px] relative group text-slate-500 hover:text-black dark:text-white/40 dark:hover:text-white border border-slate-200 hover:border-slate-300 dark:border-white/5 dark:hover:border-white/20 bg-white hover:bg-slate-50 dark:bg-transparent dark:hover:bg-white/5">
                                        <Trophy size={14} strokeWidth={2} className="text-orange-500 group-hover:scale-110 transition-transform" />
                                        <span>Populares</span>
                                    </button>
                                </div>
                            </div>

                            {loading ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
                                    {[...Array(6)].map((_, i) => <KitSkeleton key={i} />)}
                                </div>
                            ) : kits.length > 0 ? (
                                <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-6 md:gap-8">
                                    {kits.map(kit => <SoundKitCard key={kit.id} kit={kit} />)}
                                </div>
                            ) : (
                                <div className="flex flex-col items-center justify-center py-40 bg-white/80 dark:bg-white/5 backdrop-blur-xl border-2 border-slate-200/60 dark:border-white/10 rounded-[3rem] text-center px-10">
                                    <div className="w-24 h-24 bg-orange-500/10 border-2 border-orange-500/30 dark:border-orange-500/40 rounded-[2rem] flex items-center justify-center mx-auto mb-8 text-orange-600 dark:text-orange-400">
                                        <Package size={40} strokeWidth={1.5} />
                                    </div>
                                    <h3 className="text-3xl font-black uppercase tracking-tighter text-foreground mb-4">Sin Kits</h3>
                                    <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-[0.4em] mb-12">Estamos preparando lo mejor. Regresa pronto.</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </main>

            <Footer minimal={true} />
        </div>
    );
}
