"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Users, ArrowLeft, Loader2, Star, Instagram, Twitter, Globe, Crown, CheckCheck, MapPin, Music, Link as LinkIcon, Award, Sparkles } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function ProducersPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        }>
            <ProducersContent />
        </Suspense>
    );
}

function ProducersContent() {
    const [artists, setArtists] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchArtists() {
            try {
                setLoading(true);
                // Query más robusta: Filtramos directamente en el servidor los que tienen username
                const { data, error } = await supabase
                    .from('perfiles')
                    .select('id, nombre_usuario, nombre_artistico, nombre_completo, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador, biografia, fecha_creacion')
                    .not('nombre_usuario', 'is', null) // Asegurar que tengan al menos username
                    .order('nivel_suscripcion', { ascending: false })
                    .limit(200);

                if (error) {
                    console.error("Supabase error fetching artists:", error);
                    throw error;
                }

                // Filtrar solo los que tienen al menos username o artistic_name
                const validProfiles = (data || []).filter(p => p.nombre_usuario || p.nombre_artistico);

                // Strict sorting: Premium -> Pro -> Free
                const sorted = validProfiles.sort((a, b) => {
                    const tier_order: any = { premium: 0, pro: 1, free: 2 };
                    const tierA = tier_order[(a.nivel_suscripcion || 'free').toLowerCase()] ?? 3;
                    const tierB = tier_order[(b.nivel_suscripcion || 'free').toLowerCase()] ?? 3;

                    if (tierA !== tierB) return tierA - tierB;
                    return new Date(b.fecha_creacion || 0).getTime() - new Date(a.fecha_creacion || 0).getTime();
                });

                setArtists(sorted);
            } catch (err) {
                console.error("Error fetching artists:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchArtists();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col selection:bg-accent selection:text-white">
            <Navbar />

            <main className="flex-1 pb-40">
                {/* Header Section Premium */}
                <section className="relative pt-24 pb-20 overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent"></div>
                    <div className="max-w-7xl mx-auto px-6 lg:px-10 relative">
                        <Link href="/beats" className="inline-flex items-center gap-2 text-muted hover:text-accent font-black uppercase text-[10px] tracking-widest transition-all mb-10 group">
                            <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            Regresar al Tianguis
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-10">
                            <div className="max-w-3xl">
                                <div className="flex items-center gap-3 mb-6">
                                    <div className="h-[1px] w-12 bg-accent/50"></div>
                                    <span className="text-accent text-[10px] font-black uppercase tracking-[0.4em]">Directorio de Élite</span>
                                </div>
                                <h1 className="text-6xl md:text-9xl font-black uppercase tracking-tighter mb-8 font-heading leading-none">
                                    L@s <span className="text-accent">Productores</span>
                                </h1>
                                <p className="text-xl text-muted font-medium max-w-xl leading-relaxed italic border-l-2 border-accent/20 pl-8">
                                    El motor creativo de la escena urbana en México. Descubre a los productores que están dictando las reglas del juego.
                                </p>
                            </div>
                            <div className="hidden lg:flex flex-col items-end gap-2">
                                <div className="flex -space-x-4 mb-4">
                                    {artists.slice(0, 5).map((a, i) => (
                                        <div key={i} className="w-12 h-12 rounded-full border-4 border-background overflow-hidden shadow-xl">
                                            <img src={a.foto_perfil || `https://ui-avatars.com/api/?name=${a.nombre_usuario}`} className="w-full h-full object-cover" />
                                        </div>
                                    ))}
                                </div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted">+{artists.length > 0 ? artists.length : '...'} Productores Activos</p>
                            </div>
                        </div>
                    </div>
                </section>

                <div className="max-w-7xl mx-auto px-6 lg:px-10">
                    {loading ? (
                        <div className="flex items-center justify-center py-40">
                            <div className="flex flex-col items-center gap-6">
                                <Loader2 className="animate-spin text-accent" size={48} />
                                <p className="text-xs font-black uppercase tracking-[0.3em] text-muted">Sincronizando con el Tianguis...</p>
                            </div>
                        </div>
                    ) : artists.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-x-8 gap-y-16">
                            {artists.map((artist) => {
                                const isPremium = (artist.nivel_suscripcion || '').toLowerCase() === 'premium';
                                const isPro = (artist.nivel_suscripcion || '').toLowerCase() === 'pro';

                                return (
                                    <Link
                                        href={`/${artist.nombre_usuario}`}
                                        key={artist.id}
                                        className="group relative flex flex-col h-full animate-fade-in"
                                    >
                                        {/* Visual Container */}
                                        <div className="relative aspect-[4/5] rounded-[3.5rem] overflow-hidden mb-8 transition-all duration-700 shadow-2xl group-hover:shadow-accent/20 border border-border group-hover:border-accent/30 group-hover:-translate-y-2">
                                            <img
                                                src={artist.foto_perfil || `https://ui-avatars.com/api/?name=${artist.nombre_artistico || artist.nombre_usuario}&background=random&color=fff&size=512`}
                                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110 grayscale-[30%] group-hover:grayscale-0 opacity-90 group-hover:opacity-100"
                                                alt={artist.nombre_artistico || artist.nombre_usuario}
                                            />

                                            {/* Tier Overlays */}
                                            <div className="absolute top-8 left-8 right-8 flex justify-between items-start pointer-events-none">
                                                <div className="flex flex-col gap-2">
                                                    {isPremium && (
                                                        <div className="bg-blue-600 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-white/20 backdrop-blur-md animate-pulse">
                                                            <Star size={12} fill="currentColor" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Premium</span>
                                                        </div>
                                                    )}
                                                    {isPro && (
                                                        <div className="bg-amber-500 text-white px-4 py-1.5 rounded-full flex items-center gap-2 shadow-xl border border-white/20 backdrop-blur-md">
                                                            <Award size={12} fill="currentColor" />
                                                            <span className="text-[9px] font-black uppercase tracking-widest">Pro</span>
                                                        </div>
                                                    )}
                                                </div>
                                                <div className="flex items-center gap-2">
                                                    {artist.es_fundador && (
                                                        <div className="w-10 h-10 bg-slate-950/80 backdrop-blur-xl border border-white/10 rounded-2xl flex items-center justify-center text-amber-400 shadow-2xl">
                                                            <Crown size={20} fill="currentColor" />
                                                        </div>
                                                    )}
                                                    {artist.esta_verificado && (
                                                        <div className="w-10 h-10 bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl flex items-center justify-center text-white shadow-2xl">
                                                            <img src="/verified-badge.png" className="w-6 h-6 object-contain" alt="Verificado" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Info Overlays */}
                                            <div className="absolute inset-x-0 bottom-0 p-10 bg-gradient-to-t from-black via-black/40 to-transparent">
                                                <div className="flex items-center gap-3 mb-2 opacity-0 group-hover:opacity-100 transition-opacity translate-y-4 group-hover:translate-y-0 duration-500">
                                                    <div className="h-[1px] w-8 bg-accent"></div>
                                                    <span className="text-[8px] font-black uppercase tracking-[0.4em] text-accent">Ver Perfil Completo</span>
                                                </div>
                                                <h3 className="text-3xl font-black text-white uppercase tracking-tighter leading-none mb-3 font-heading group-hover:text-accent transition-colors">
                                                    {artist.nombre_artistico || artist.nombre_usuario}
                                                </h3>
                                                <div className="flex items-center gap-4 text-white/60">
                                                    <div className="flex items-center gap-1.5">
                                                        <Music size={10} className="text-accent" />
                                                        <span className="text-[9px] font-bold uppercase tracking-widest">Productor</span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        {/* Metadata Box Minimal */}
                                        <div className="px-6 flex flex-col gap-4">
                                            <p className="text-xs text-muted leading-relaxed font-medium line-clamp-2 italic opacity-60 group-hover:opacity-100 transition-opacity">
                                                {artist.biografia || "Este productor ha decidido que su música hable por él. Explora su catálogo completo."}
                                            </p>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-card/20 rounded-[4rem] border border-dashed border-border">
                            <Users className="text-muted mb-6 opacity-20" size={64} />
                            <h3 className="text-2xl font-black uppercase tracking-tight font-heading mb-4 text-muted">Aún no hay artistas visibles</h3>
                            <p className="text-muted text-sm max-w-xs text-center mb-8">Estamos vinculando las cuentas de los mejores productores de la plataforma.</p>
                            <Link href="/beats" className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-accent/20">
                                Regresar al Tianguis
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
