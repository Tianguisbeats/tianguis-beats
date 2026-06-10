"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    Users, ArrowLeft, Music, Crown, Award, Star, ArrowRight,
    TrendingUp, Search, X, Zap, Clock, Trophy, Gem, SlidersHorizontal, ShieldCheck
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { motion } from "framer-motion";
import { 
    AbstractCirclesBack, ParallaxBackground, FloatingParticles, useScrollProgress, ScrollReveal 
} from "@/components/ui/BackgroundEffects";

export default function ProducersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <div className="w-12 h-12 border-4 border-purple-500/20 border-t-purple-500 rounded-full animate-spin" />
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Cargando Productores...</p>
            </div>
        }>
            <ProducersContent />
        </Suspense>
    );
}

const ProducerCard = React.memo(function ProducerCard({ artist }: { artist: any }) {
    const plan = (artist.nivel_suscripcion || 'free').toLowerCase();
    const isPremium = plan === 'premium';
    const isPro = plan === 'pro';
    const isFree = !isPremium && !isPro;

    return (
        <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            whileHover={{ y: -12 }}
            className="group relative flex flex-col h-full"
        >
            <Link href={`/${artist.nombre_usuario}`} className="relative h-full flex flex-col">
                {/* Photo card con efecto Glassmorphism y Elevación */}
                <div className={`relative aspect-[3.2/4.5] rounded-[2rem] sm:rounded-[3rem] overflow-hidden transition-all duration-700 border-2 shadow-2xl max-md:shadow-purple-500/10
                    ${isPremium ? 'border-blue-500/30' : isPro ? 'border-amber-500/30' : 'border-slate-200 dark:border-white/10 dark:bg-white/5 bg-slate-50'}`}>
                    <div className="md:hidden absolute -inset-10 bg-[radial-gradient(circle_at_28%_18%,rgba(139,92,246,0.30),transparent_32%),radial-gradient(circle_at_75%_72%,rgba(59,130,246,0.22),transparent_30%)] z-10 pointer-events-none mix-blend-screen" />

                    <img
                        src={artist.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.nombre_artistico || artist.nombre_usuario)}&background=random&color=fff&size=512`}
                        className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 opacity-90 group-hover:opacity-100"
                        alt={artist.nombre_artistico || artist.nombre_usuario}
                    />

                    {/* Gradient Overlay Editorial */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent opacity-90 group-hover:opacity-100 transition-opacity" />

                    {/* Badge de Estatus Superior */}
                    <div className="absolute top-5 left-5 right-5 flex justify-between items-start pointer-events-none">
                        <div className="flex gap-2">
                            {artist.esta_verificado && (
                                <div className="p-2 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 shadow-xl" title="Verificado">
                                    <img src="/verified-badge.png" className="w-[16px] h-[16px] object-contain" alt="Verificado" />
                                </div>
                            )}
                            {artist.es_fundador && (
                                <div className="p-2 bg-amber-500 rounded-2xl shadow-[0_0_15px_rgba(245,158,11,0.5)] border border-white/20" title="Fundador Tianguis">
                                    <Crown size={16} className="text-white fill-white/20" />
                                </div>
                            )}
                        </div>
                        
                        {/* Etiqueta de Plan de Color */}
                        <div className={`px-4 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest border border-white/10 backdrop-blur-md shadow-lg
                            ${isPremium ? 'bg-blue-600 text-white shadow-blue-500/40' : 
                              isPro ? 'bg-amber-500 text-white shadow-amber-500/40' : 
                              'bg-white/10 text-white/70'}`}>
                            {plan === 'premium' ? 'Premium' : plan === 'pro' ? 'Pro' : 'Free'}
                        </div>
                    </div>

                    {/* Footer de Tarjeta Editorial */}
                    <div className="absolute inset-x-0 bottom-0 p-4 md:p-8 flex flex-col">
                        <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none group-hover:scale-105 origin-left transition-transform mb-3">
                            {artist.nombre_artistico || artist.nombre_usuario}
                        </h3>
                        <div className="text-[9px] font-black uppercase tracking-[0.6em] text-white/40 group-hover:text-[#8B5CF6] transition-colors">
                            Productor Certificado
                        </div>
                        <div className="flex items-center gap-2 mt-4 sm:opacity-0 sm:group-hover:opacity-100 sm:translate-y-4 sm:group-hover:translate-y-0 transition-all duration-300">
                             <div className="h-0.5 w-8 bg-[#8B5CF6]" />
                             <span className="text-[8px] font-black uppercase tracking-[0.4em] text-white">Ver Perfil</span>
                             <ArrowRight size={10} className="text-white" />
                        </div>
                    </div>
                </div>
            </Link>
        </motion.div>
    );
});

function ProducersContent() {
    const [artists, setArtists] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const { scrollY } = useScrollProgress();

    useEffect(() => {
        async function fetchArtists() {
            try {
                setLoading(true);
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('id, nombre_usuario, nombre_artistico, nombre_completo, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador, biografia, fecha_creacion')
                    .not('nombre_usuario', 'is', null)
                    .order('nivel_suscripcion', { ascending: false })
                    .limit(200);

                if (error) throw error;
                const sorted = (data || []).sort((a, b) => {
                    const t: any = { premium: 0, pro: 1, free: 2 };
                    const ta = t[(a.nivel_suscripcion || 'free').toLowerCase()] ?? 3;
                    const tb = t[(b.nivel_suscripcion || 'free').toLowerCase()] ?? 3;
                    if (ta !== tb) return ta - tb;
                    return new Date(b.fecha_creacion || 0).getTime() - new Date(a.fecha_creacion || 0).getTime();
                });
                setArtists(sorted);
                setFiltered(sorted);
            } catch (err) {
                console.error("Error fetching artists:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchArtists();
    }, []);

    useEffect(() => {
        let result = artists;
        if (searchQuery) {
            result = result.filter(a =>
                (a.nombre_artistico || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                (a.nombre_usuario || '').toLowerCase().includes(searchQuery.toLowerCase())
            );
        }
        setFiltered(result);
    }, [searchQuery, artists]);

    const featuredArtists = filtered.slice(0, 6);

    return (
        <div className="min-h-screen bg-white text-black dark:bg-[#0A0A0A] dark:text-white font-sans selection:bg-blue-500 selection:text-white flex flex-col transition-colors duration-300 overflow-x-hidden">
            <Navbar minimal={true} />

            <main className="flex-1 pb-8 relative">
                
                {/* ── Editorial Hero Header ── */}
                <div className="relative pt-28 pb-12 md:pt-48 md:pb-32 overflow-hidden bg-white dark:bg-[#0A0A0A]">
                    <AbstractCirclesBack theme="purple" opacity={1} />
                    <div className="md:hidden absolute inset-0 pointer-events-none">
                        <div className="absolute inset-0 bg-[radial-gradient(circle_at_12%_18%,rgba(139,92,246,0.18),transparent_32%),radial-gradient(circle_at_86%_22%,rgba(59,130,246,0.14),transparent_30%)]" />
                        <motion.div
                            animate={{ y: [0, -12, 0], rotate: [0, 6, 0] }}
                            transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut" }}
                            className="absolute top-28 right-7 w-14 h-14 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-500"
                        >
                            <Music size={24} strokeWidth={1.5} />
                        </motion.div>
                        <motion.div
                            animate={{ y: [0, 10, 0], rotate: [0, -8, 0] }}
                            transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 0.7 }}
                            className="absolute top-48 left-5 w-11 h-11 rounded-full bg-blue-500/10 border border-blue-500/20 flex items-center justify-center text-blue-500"
                        >
                            <Users size={18} strokeWidth={1.5} />
                        </motion.div>
                    </div>
                    
                    {/* Floating Decorative Icons (Matching Beats Style) */}
                    <motion.div 
                        animate={{ y: [0, -20, 0], rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 6, repeat: Infinity }}
                        className="absolute top-40 right-[15%] opacity-20 hidden lg:block"
                    >
                        <Music size={80} strokeWidth={1} className="text-blue-500" />
                    </motion.div>
                    <motion.div 
                        animate={{ y: [0, 20, 0], rotate: [0, -5, 5, 0] }}
                        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
                        className="absolute bottom-20 left-[10%] opacity-20 hidden lg:block"
                    >
                        <Zap size={60} strokeWidth={1} className="text-amber-500" />
                    </motion.div>
                    
                    <div className="max-w-[1700px] mx-auto px-6 sm:px-12 relative z-10 text-center">
                        <motion.div 
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1 }}
                        >
                            <div className="flex items-center justify-center gap-3 mb-8 md:mb-10">
                                <div className="h-0.5 w-8 md:w-12 bg-[#8B5CF6] rounded-full" />
                                <span className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.45em] md:tracking-[0.8em] text-[#8B5CF6]">Tianguis Producer</span>
                                <div className="h-0.5 w-8 md:w-12 bg-[#8B5CF6] rounded-full" />
                            </div>
                            <h1 className="text-4xl sm:text-6xl md:text-8xl lg:text-[10rem] font-black uppercase tracking-tighter mb-8 md:mb-12 hero-text-pro">
                                <span className="text-[#8B5CF6]">Artistas</span><br />
                                <span className="text-transparent bg-clip-text bg-gradient-to-b from-[#A855F7] to-[#8B5CF6] dark:from-[#D8B4FE] dark:to-[#8B5CF6]">Productores</span>
                            </h1>
                            <p className="text-black/50 dark:text-white/30 text-[12px] font-black uppercase tracking-[0.5em]">
                                {loading ? 'Sincronizando...' : `${artists.length} productores certificados en la plataforma`}
                            </p>
                            <div className="md:hidden grid grid-cols-3 gap-2 mt-7">
                                <div className="rounded-2xl border border-purple-500/15 bg-purple-500/[0.07] px-3 py-3">
                                    <p className="text-lg font-black leading-none">{artists.length}</p>
                                    <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-purple-500">Perfiles</p>
                                </div>
                                <div className="rounded-2xl border border-blue-500/15 bg-blue-500/[0.07] px-3 py-3">
                                    <p className="text-lg font-black leading-none">Pro</p>
                                    <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-blue-500">Talento</p>
                                </div>
                                <div className="rounded-2xl border border-amber-500/15 bg-amber-500/[0.07] px-3 py-3">
                                    <p className="text-lg font-black leading-none">Top</p>
                                    <p className="mt-1 text-[7px] font-black uppercase tracking-widest text-amber-500">Curados</p>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>

                <div className="px-6 sm:px-16 max-w-[1800px] mx-auto w-full">
                    <div className="flex flex-col gap-10 md:gap-20">
                        
                        {/* Modern Search & Title Section */}
                        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-7 md:gap-10">
                             <div className="flex flex-col gap-2">
                                <h3 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">Directorio Global.</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">Encuentra al colaborador ideal para tu próximo proyecto</p>
                             </div>

                             {/* Redesigned Premium Search */}
                             <div className="relative w-full max-w-[500px] md:sticky md:top-28 z-20">
                                <Search size={18} className="absolute left-6 top-1/2 -translate-y-1/2 text-blue-500" />
                                <input 
                                    type="text" 
                                    value={searchQuery} 
                                    onChange={e => setSearchQuery(e.target.value)}
                                    placeholder="BUSCAR NOMBRE O USUARIO..."
                                    className="w-full bg-slate-100/95 dark:bg-white/5 border-2 border-transparent focus:border-blue-500/50 rounded-[2rem] pl-16 pr-8 py-5 text-[10px] md:text-[11px] font-black uppercase tracking-widest outline-none transition-all text-black dark:text-white shadow-xl dark:shadow-none backdrop-blur-xl" />
                             </div>
                        </div>

                        {!loading && featuredArtists.length > 0 && (
                            <section className="md:hidden -mx-6 px-6 overflow-hidden">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-[8px] font-black uppercase tracking-[0.35em] text-[#8B5CF6]">Swipe rápido</p>
                                        <h2 className="text-xl font-black uppercase tracking-tighter">Productores destacados</h2>
                                    </div>
                                    <Trophy size={18} className="text-[#8B5CF6]" />
                                </div>
                                <div className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory pb-4">
                                    {featuredArtists.map(artist => (
                                        <div key={artist.id} className="snap-center shrink-0 w-[72vw] max-w-[280px]">
                                            <ProducerCard artist={artist} />
                                        </div>
                                    ))}
                                </div>
                            </section>
                        )}

                        {loading ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-12">
                                {[...Array(8)].map((_, i) => (
                                    <div key={i} className="animate-pulse flex flex-col gap-8">
                                        <div className="aspect-[3.2/4.5] rounded-[3rem] bg-slate-200 dark:bg-white/5"></div>
                                        <div className="h-6 bg-slate-200 dark:bg-white/5 rounded-full w-2/3 mx-auto"></div>
                                    </div>
                                ))}
                            </div>
                        ) : filtered.length > 0 ? (
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-x-12 gap-y-24">
                                {filtered.map(artist => <ProducerCard key={artist.id} artist={artist} />)}
                            </div>
                        ) : (
                            <motion.div 
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="flex flex-col items-center justify-center py-40 border-4 border-dashed border-slate-100 dark:border-white/[0.03] rounded-[4rem] text-center"
                            >
                                <X size={60} className="text-red-500/20 mb-8" />
                                <h3 className="text-3xl font-black uppercase tracking-tighter mb-4">Sin resultados</h3>
                                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.4em]">Prueba buscando por nombre artístico o nombre de usuario</p>
                            </motion.div>
                        )}
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
