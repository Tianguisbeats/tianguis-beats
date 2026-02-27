"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    Users, ArrowLeft, Music, Crown, Award, Star, ArrowRight,
    TrendingUp, Search, X
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProducersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Cargando Productores...</p>
            </div>
        }>
            <ProducersContent />
        </Suspense>
    );
}

function ProducerCard({ artist }: { artist: any }) {
    const isPremium = (artist.nivel_suscripcion || '').toLowerCase() === 'premium';
    const isPro = (artist.nivel_suscripcion || '').toLowerCase() === 'pro';

    return (
        <Link href={`/${artist.nombre_usuario}`} className="group relative flex flex-col h-full">
            {/* Photo card */}
            <div className={`relative aspect-[4/5] rounded-[3rem] overflow-hidden mb-5 transition-all duration-700 border shadow-xl hover:-translate-y-2
                ${isPremium ? 'border-blue-500/40 shadow-blue-500/10 group-hover:border-blue-500/70 group-hover:shadow-blue-500/20'
                    : isPro ? 'border-amber-400/40 shadow-amber-400/10 group-hover:border-amber-400/70 group-hover:shadow-amber-400/20'
                        : 'border-border group-hover:border-foreground/20 group-hover:shadow-accent/10'}`}>

                <img
                    src={artist.foto_perfil || `https://ui-avatars.com/api/?name=${encodeURIComponent(artist.nombre_artistico || artist.nombre_usuario)}&background=random&color=fff&size=512`}
                    className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[20%] group-hover:grayscale-0"
                    alt={artist.nombre_artistico || artist.nombre_usuario}
                />

                {/* Gradient */}
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/20 to-transparent" />

                {/* Top overlay badges */}
                <div className="absolute top-5 left-5 right-5 flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                        {isPremium && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/90 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/10">
                                <Star size={8} fill="currentColor" /> Premium
                            </span>
                        )}
                        {isPro && (
                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg border border-white/10">
                                <Award size={8} fill="currentColor" /> Pro
                            </span>
                        )}
                    </div>
                    <div className="flex gap-1.5">
                        {artist.es_fundador && (
                            <div className="w-9 h-9 bg-black/60 backdrop-blur-xl border border-amber-500/30 rounded-2xl flex items-center justify-center shadow-xl">
                                <Crown size={16} className="text-amber-400 fill-amber-400" />
                            </div>
                        )}
                        {artist.esta_verificado && (
                            <div className="w-9 h-9 bg-black/60 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center shadow-xl">
                                <img src="/verified-badge.png" className="w-5 h-5 object-contain" alt="✓" />
                            </div>
                        )}
                    </div>
                </div>

                {/* Bottom info */}
                <div className="absolute inset-x-0 bottom-0 p-7">
                    <div className="flex items-center gap-2 mb-2 opacity-0 group-hover:opacity-100 translate-y-3 group-hover:translate-y-0 transition-all duration-400">
                        <div className="h-px w-6 bg-accent" />
                        <span className="text-[7px] font-black uppercase tracking-[0.4em] text-accent">Ver Perfil</span>
                    </div>
                    <h3 className="text-2xl md:text-3xl font-black text-white uppercase tracking-tighter leading-none group-hover:text-accent transition-colors">
                        {artist.nombre_artistico || artist.nombre_usuario}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-2">
                        <Music size={9} className="text-white/40" />
                        <span className="text-[8px] font-bold text-white/40 uppercase tracking-widest">Productor</span>
                    </div>
                </div>
            </div>

            {/* Bio below card */}
            {artist.biografia && (
                <p className="px-2 text-[10px] text-muted leading-relaxed font-medium line-clamp-2 italic opacity-60 group-hover:opacity-90 transition-opacity">
                    {artist.biografia}
                </p>
            )}
        </Link>
    );
}

function ProducersContent() {
    const [artists, setArtists] = useState<any[]>([]);
    const [filtered, setFiltered] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [activeFilter, setActiveFilter] = useState<'all' | 'premium' | 'pro' | 'free'>('all');

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
                const valid = (data || []).filter(p => p.nombre_usuario || p.nombre_artistico);
                const sorted = valid.sort((a, b) => {
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
        if (activeFilter !== 'all') result = result.filter(a => (a.nivel_suscripcion || 'free').toLowerCase() === activeFilter);
        if (searchQuery) result = result.filter(a =>
            (a.nombre_artistico || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
            (a.nombre_usuario || '').toLowerCase().includes(searchQuery.toLowerCase())
        );
        setFiltered(result);
    }, [searchQuery, activeFilter, artists]);

    const counts = {
        all: artists.length,
        premium: artists.filter(a => (a.nivel_suscripcion || '').toLowerCase() === 'premium').length,
        pro: artists.filter(a => (a.nivel_suscripcion || '').toLowerCase() === 'pro').length,
        free: artists.filter(a => !['premium', 'pro'].includes((a.nivel_suscripcion || '').toLowerCase())).length,
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300 selection:bg-accent selection:text-white">
            <Navbar />

            {/* BG glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-purple-600/[0.04] dark:bg-purple-600/[0.07] blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-accent/[0.03] dark:bg-accent/[0.05] blur-[140px] rounded-full" />
            </div>

            {/* pb-24 en móvil: espacio para MobileBottomNav + AudioPlayer */}
            <main className="flex-1 pb-24 md:pb-16">


                {/* ── HERO HEADER ── */}
                <section className="relative pt-16 pb-16 px-6 lg:px-10 overflow-hidden">
                    <div className="max-w-7xl mx-auto">
                        <Link href="/beats" className="inline-flex items-center gap-2 text-muted hover:text-accent font-black uppercase text-[9px] tracking-widest transition-all mb-8 group">
                            <ArrowLeft size={12} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            Regresar al Tianguis
                        </Link>

                        <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-10">
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-3 mb-5">
                                    <div className="h-[1px] w-10 bg-accent/50" />
                                    <span className="text-accent text-[9px] font-black uppercase tracking-[0.4em]">Directorio de Élite</span>
                                </div>
                                <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-6 leading-none text-foreground">
                                    Los <span className="text-accent">Productores.</span>
                                </h1>
                                <p className="text-muted font-medium max-w-lg leading-relaxed border-l-2 border-accent/20 pl-6 text-sm italic">
                                    El motor creativo de la escena urbana en México. Descubre a los productores que están dictando las reglas del juego.
                                </p>
                            </div>

                            {/* Stacked avatars + count */}
                            <div className="flex flex-col items-start lg:items-end gap-4">
                                <div className="flex -space-x-3">
                                    {artists.slice(0, 6).map((a, i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-[3px] border-background overflow-hidden shadow-xl">
                                            <img src={a.foto_perfil || `https://ui-avatars.com/api/?name=${a.nombre_usuario}`} className="w-full h-full object-cover" alt="" />
                                        </div>
                                    ))}
                                </div>
                                <div className="flex gap-3">
                                    {[
                                        { label: 'Premium', count: counts.premium, color: 'text-blue-400' },
                                        { label: 'Pro', count: counts.pro, color: 'text-amber-400' },
                                        { label: 'Total', count: counts.all, color: 'text-accent' },
                                    ].map(s => (
                                        <div key={s.label} className="px-4 py-2 bg-card border border-border rounded-full">
                                            <span className={`text-sm font-black ${s.color}`}>{s.count}</span>
                                            <span className="text-[8px] font-black text-muted uppercase tracking-widest ml-1">{s.label}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-6 lg:px-10">

                    {/* ── FILTERS + SEARCH ── */}
                    <div className="flex flex-col md:flex-row gap-4 mb-12">
                        {/* Tier tabs */}
                        <div className="flex gap-2 flex-wrap">
                            {([
                                { key: 'all', label: 'Todos', count: counts.all },
                                { key: 'premium', label: '⭐ Premium', count: counts.premium, color: '#3b82f6' },
                                { key: 'pro', label: '⚡ Pro', count: counts.pro, color: '#f59e0b' },
                                { key: 'free', label: 'Free', count: counts.free },
                            ] as const).map(f => (
                                <button key={f.key} onClick={() => setActiveFilter(f.key as any)}
                                    className={`flex items-center gap-2 px-4 py-2.5 rounded-full text-[9px] font-black uppercase tracking-widest transition-all ${activeFilter === f.key
                                        ? 'bg-accent text-white shadow-lg shadow-accent/20'
                                        : 'bg-card border border-border text-muted hover:text-foreground hover:border-foreground/20'}`}>
                                    {f.label}
                                    <span className={`px-1.5 py-0.5 rounded-full text-[8px] ${activeFilter === f.key ? 'bg-white/20' : 'bg-foreground/10'}`}>{f.count}</span>
                                </button>
                            ))}
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 max-w-sm md:ml-auto">
                            <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" />
                            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                                placeholder="Buscar productor..."
                                className="w-full bg-card border border-border rounded-full pl-10 pr-10 py-2.5 text-xs font-bold outline-none focus:border-accent/50 text-foreground placeholder:text-muted/50 transition-all" />
                            {searchQuery && (
                                <button onClick={() => setSearchQuery('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors">
                                    <X size={12} />
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── GRID ── */}
                    {loading ? (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-12">
                            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
                                <div key={i} className="animate-pulse">
                                    <div className="aspect-[4/5] rounded-[3rem] bg-foreground/5 mb-4" />
                                    <div className="h-3 bg-foreground/5 rounded-full w-3/4 mx-2" />
                                </div>
                            ))}
                        </div>
                    ) : filtered.length > 0 ? (
                        <>
                            <p className="text-[9px] font-black text-muted uppercase tracking-widest mb-8">{filtered.length} productores</p>
                            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-x-8 gap-y-16">
                                {filtered.map(artist => <ProducerCard key={artist.id} artist={artist} />)}
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-card rounded-[3rem] border border-dashed border-border text-center px-10">
                            <div className="w-20 h-20 bg-foreground/5 rounded-[2rem] flex items-center justify-center mb-6">
                                <Users size={36} className="text-muted opacity-30" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-2">
                                {searchQuery ? `Sin resultados para "${searchQuery}"` : "Sin productores"}
                            </h3>
                            <p className="text-muted text-sm max-w-xs mb-8">Intenta con otro filtro o nombre.</p>
                            <button onClick={() => { setSearchQuery(''); setActiveFilter('all'); }}
                                className="group relative overflow-hidden bg-accent text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] transition-all shadow-lg shadow-accent/20 flex items-center gap-2">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <ArrowRight size={14} className="relative z-10" />
                                <span className="relative z-10">Ver Todos</span>
                            </button>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
