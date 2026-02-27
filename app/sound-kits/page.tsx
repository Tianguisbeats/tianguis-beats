"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import {
    Zap, ArrowLeft, Music, Crown, ShoppingCart, Package,
    ArrowRight, Star, Headphones, TrendingUp
} from "lucide-react";
import { useCurrency } from "@/context/CurrencyContext";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SoundKitsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <div className="w-12 h-12 border-4 border-accent/20 border-t-accent rounded-full animate-spin" />
                <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em] animate-pulse">Cargando Kits...</p>
            </div>
        }>
            <SoundKitsContent />
        </Suspense>
    );
}

function KitCard({ kit, formatPrice }: { kit: any; formatPrice: (n: number) => string }) {
    const isPremium = kit.producer?.nivel_suscripcion === 'premium';
    const isPro = kit.producer?.nivel_suscripcion === 'pro';

    return (
        <div className="group relative bg-card rounded-[2.5rem] border border-border hover:border-accent/30 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 hover:-translate-y-1 flex flex-col overflow-hidden">
            {/* Top glow on hover */}
            <div className="absolute top-0 left-0 right-0 h-px opacity-0 group-hover:opacity-100 transition-all duration-500 bg-gradient-to-r from-transparent via-accent/50 to-transparent" />

            {/* Artwork */}
            <div className="aspect-square overflow-hidden relative">
                <img
                    src={kit.url_portada || "https://images.unsplash.com/photo-1516062423079-7c157a58ff62?q=80&w=600&auto=format&fit=crop"}
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    alt={kit.titulo}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/10 to-transparent" />

                {/* Play icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-500">
                    <div className="w-16 h-16 bg-accent/90 backdrop-blur-md rounded-full flex items-center justify-center shadow-2xl shadow-accent/40 scale-75 group-hover:scale-100 transition-transform duration-500">
                        <Headphones size={22} className="text-white" />
                    </div>
                </div>

                {/* Top badges */}
                <div className="absolute top-4 left-4 right-4 flex justify-between items-start">
                    <div className="flex flex-col gap-1.5">
                        {isPremium && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600/90 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                                <Star size={9} fill="currentColor" /> Premium
                            </span>
                        )}
                        {isPro && (
                            <span className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/90 backdrop-blur-md text-white rounded-full text-[8px] font-black uppercase tracking-widest shadow-lg">
                                <Zap size={9} fill="currentColor" /> Pro
                            </span>
                        )}
                    </div>
                    <span className="px-3 py-1.5 bg-black/40 backdrop-blur-md border border-white/10 text-white rounded-full text-[8px] font-black uppercase tracking-widest">
                        Sound Kit
                    </span>
                </div>

                {/* Price overlay bottom */}
                <div className="absolute bottom-4 right-4">
                    <span className="px-4 py-2 bg-accent text-white rounded-full text-sm font-black shadow-lg">
                        {formatPrice(kit.precio)}
                    </span>
                </div>
            </div>

            {/* Content */}
            <div className="p-6 flex-1 flex flex-col">
                <h3 className="text-lg font-black uppercase tracking-tighter text-foreground group-hover:text-accent transition-colors line-clamp-1 mb-1">
                    {kit.titulo}
                </h3>
                <p className="text-xs text-muted line-clamp-2 font-medium leading-relaxed mb-5 flex-1">
                    {kit.descripcion || "Lleva tus producciones al siguiente nivel con este kit curado por expertos."}
                </p>

                {/* Producer + CTA */}
                <div className="flex items-center justify-between border-t border-border pt-4">
                    <Link href={`/${kit.producer?.nombre_usuario}`}
                        className="flex items-center gap-2.5 group/p hover:opacity-100 transition-opacity"
                        onClick={e => e.stopPropagation()}>
                        <div className={`w-8 h-8 rounded-full overflow-hidden border-2 transition-all ${isPremium ? 'border-blue-500 shadow-[0_0_12px_-2px_rgba(59,130,246,0.6)]' : isPro ? 'border-amber-400 shadow-[0_0_12px_-2px_rgba(245,158,11,0.6)]' : 'border-border'}`}>
                            <img src={kit.producer?.foto_perfil || `https://ui-avatars.com/api/?name=${kit.producer?.nombre_artistico}&background=random`} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                            <div className="flex items-center gap-1">
                                <span className="text-[9px] font-black uppercase tracking-widest text-foreground group-hover/p:text-accent transition-colors">{kit.producer?.nombre_artistico}</span>
                                {kit.producer?.esta_verificado && <img src="/verified-badge.png" className="w-3 h-3" alt="✓" />}
                                {kit.producer?.es_fundador && <Crown size={9} className="text-amber-500 fill-amber-500" />}
                            </div>
                            <span className="text-[7px] font-bold text-muted uppercase tracking-widest">Productor</span>
                        </div>
                    </Link>
                    <button className="group/btn flex items-center gap-1.5 px-4 py-2 bg-accent text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:scale-105 active:scale-95 transition-all shadow-sm shadow-accent/20">
                        <ShoppingCart size={11} className="group-hover/btn:scale-110 transition-transform" />
                        Comprar
                    </button>
                </div>
            </div>
        </div>
    );
}

function SoundKitsContent() {
    const [kits, setKits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const { formatPrice } = useCurrency();

    useEffect(() => {
        async function fetchKits() {
            try {
                const { data, error } = await supabase
                    .from('kits_sonido')
                    .select(`
                        id, titulo, precio, descripcion, fecha_creacion, url_archivo, url_portada,
                        producer:productor_id ( nombre_artistico, nombre_usuario, foto_perfil, nivel_suscripcion, esta_verificado, es_fundador )
                    `)
                    .eq('es_publico', true)
                    .order('fecha_creacion', { ascending: false });

                if (error) throw error;
                setKits(data || []);
            } catch (err) {
                console.error("Error fetching sound kits:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchKits();
    }, []);

    return (
        <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300 selection:bg-accent selection:text-white">
            <Navbar />

            {/* BG glows */}
            <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
                <div className="absolute top-[-10%] left-[-5%] w-[50%] h-[50%] bg-amber-500/[0.04] dark:bg-amber-500/[0.07] blur-[140px] rounded-full" />
                <div className="absolute bottom-[-10%] right-[-5%] w-[45%] h-[45%] bg-accent/[0.03] dark:bg-accent/[0.06] blur-[140px] rounded-full" />
            </div>

            <main className="flex-1 pb-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-12">

                    {/* ── HEADER ── */}
                    <div className="mb-16">
                        <Link href="/beats" className="inline-flex items-center gap-2 text-muted hover:text-accent font-black uppercase text-[9px] tracking-widest transition-all mb-8 group">
                            <ArrowLeft size={12} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                            Regresar al Tianguis
                        </Link>

                        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
                            <div>
                                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-card border border-border rounded-full mb-5 shadow-sm">
                                    <Package size={12} className="text-amber-400" />
                                    <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted">Tianguis Beats Original</span>
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-4 text-foreground">
                                    Sound<br /><span className="text-accent">Kits.</span>
                                </h1>
                                <p className="text-muted text-sm font-medium max-w-md">Drum kits, presets y samples de alta gama. Seleccionados por los mejores productores del país.</p>
                            </div>

                            {/* Stats */}
                            <div className="flex flex-wrap gap-3">
                                {[
                                    { icon: <Package size={14} className="text-amber-400" />, value: `${kits.length || '...'} Kits`, label: 'Disponibles' },
                                    { icon: <TrendingUp size={14} className="text-accent" />, value: 'Premium', label: 'Audio Quality' },
                                    { icon: <Star size={14} className="text-emerald-400" />, value: '100%', label: 'Curados' },
                                ].map(s => (
                                    <div key={s.label} className="flex items-center gap-3 px-5 py-3 bg-card border border-border rounded-full shadow-sm">
                                        {s.icon}
                                        <div>
                                            <p className="text-sm font-black text-foreground leading-none">{s.value}</p>
                                            <p className="text-[8px] font-black text-muted uppercase tracking-widest">{s.label}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── GRID ── */}
                    {loading ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {[1, 2, 3, 4, 5, 6].map(i => (
                                <div key={i} className="bg-card rounded-[2.5rem] border border-border overflow-hidden animate-pulse">
                                    <div className="aspect-square bg-foreground/5" />
                                    <div className="p-6 space-y-3">
                                        <div className="h-5 bg-foreground/5 rounded-full w-3/4" />
                                        <div className="h-3 bg-foreground/5 rounded-full" />
                                        <div className="h-3 bg-foreground/5 rounded-full w-2/3" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : kits.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                            {kits.map(kit => <KitCard key={kit.id} kit={kit} formatPrice={formatPrice} />)}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-card rounded-[3rem] border border-dashed border-border text-center px-10">
                            <div className="w-20 h-20 bg-foreground/5 rounded-[2rem] flex items-center justify-center mb-6">
                                <Music size={36} className="text-muted opacity-30" />
                            </div>
                            <h3 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-2">No hay kits disponibles</h3>
                            <p className="text-muted text-sm max-w-xs mb-8">Los mejores productores están preparando sus sound kits. Mantente al pendiente.</p>
                            <Link href="/beats" className="group relative overflow-hidden bg-accent text-white px-8 py-4 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:scale-[1.03] transition-all shadow-lg shadow-accent/20 flex items-center gap-2">
                                <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                                <ArrowRight size={14} className="relative z-10" />
                                <span className="relative z-10">Explorar Beats</span>
                            </Link>
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
