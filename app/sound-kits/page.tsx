"use client";

import React, { useEffect, useState, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Zap, ArrowLeft, Loader2, Star, ShoppingCart, Music } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export default function SoundKitsPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen flex items-center justify-center bg-background">
                <Loader2 className="animate-spin text-accent" size={48} />
            </div>
        }>
            <SoundKitsContent />
        </Suspense>
    );
}

function SoundKitsContent() {
    const [kits, setKits] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchKits() {
            try {
                const { data, error } = await supabase
                    .from('services')
                    .select(`
            id, titulo, precio, descripcion, created_at, cover_url,
            producer:user_id ( artistic_name, username, foto_perfil, subscription_tier, is_verified )
          `)
                    .eq('tipo_servicio', 'sound_kit')
                    .eq('is_active', true)
                    .order('created_at', { ascending: false });

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
        <div className="min-h-screen bg-background text-foreground flex flex-col">
            <Navbar />

            <main className="flex-1 pb-32">
                <div className="max-w-7xl mx-auto px-6 lg:px-10 pt-16">

                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20 animate-fade-in">
                        <div className="max-w-2xl">
                            <Link href="/beats" className="inline-flex items-center gap-2 text-muted hover:text-accent font-black uppercase text-[10px] tracking-widest transition-all mb-6 group">
                                <ArrowLeft size={14} strokeWidth={3} className="group-hover:-translate-x-1 transition-transform" />
                                Regresar al Hub
                            </Link>
                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter mb-6 font-heading leading-none">
                                Sound Kits
                            </h1>
                            <p className="text-xl text-muted font-medium max-w-lg">
                                Drum kits, presets y samples de alta gama.
                            </p>
                        </div>
                        <div className="hidden md:flex flex-col items-end">
                            <div className="flex items-center gap-3 mb-2">
                                <div className="h-[2px] w-12 bg-accent"></div>
                                <span className="text-[10px] font-black uppercase tracking-[0.4em] text-accent">Premium Audio</span>
                            </div>
                            <p className="text-[10px] font-bold text-muted uppercase tracking-widest">Tianguis Beats Original</p>
                        </div>
                    </div>

                    {loading ? (
                        <div className="flex items-center justify-center py-40">
                            <Loader2 className="animate-spin text-accent" size={40} />
                        </div>
                    ) : kits.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
                            {kits.map((kit) => (
                                <div key={kit.id} className="group relative bg-card rounded-[3rem] p-8 border border-border hover:border-accent/40 transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 flex flex-col h-full overflow-hidden">
                                    <div className="aspect-square bg-slate-900 rounded-[2.5rem] mb-8 overflow-hidden relative shadow-inner">
                                        <img
                                            src={kit.cover_url || "https://images.unsplash.com/photo-1516062423079-7c157a58ff62?q=80&w=2070&auto=format&fit=crop"}
                                            className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-60"
                                            alt={kit.titulo}
                                        />
                                        <div className="absolute top-6 left-6">
                                            <div className="w-12 h-12 bg-white/10 backdrop-blur-md rounded-2xl flex items-center justify-center border border-white/20">
                                                <Zap size={20} className="text-white" />
                                            </div>
                                        </div>
                                    </div>

                                    <div className="mb-6 flex-1">
                                        <div className="flex items-center gap-2 mb-3">
                                            <div className="w-1.5 h-1.5 rounded-full bg-accent"></div>
                                            <span className="text-[10px] font-black uppercase tracking-widest text-muted">Pro Toolkit</span>
                                        </div>
                                        <h3 className="text-2xl font-black uppercase tracking-tight mb-3 font-heading group-hover:text-accent transition-colors">
                                            {kit.titulo}
                                        </h3>
                                        <p className="text-sm text-muted line-clamp-2 font-medium leading-relaxed">
                                            {kit.descripcion || "Lleva tus producciones al siguiente nivel con este kit curado por expertos."}
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-8 border-t border-border/50">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-full bg-slate-800 overflow-hidden border border-white/10">
                                                <img src={kit.producer?.foto_perfil || `https://ui-avatars.com/api/?name=${kit.producer?.artistic_name}&background=random`} className="w-full h-full object-cover" />
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-foreground">{kit.producer?.artistic_name}</span>
                                                {kit.producer?.is_verified && <span className="text-[8px] font-bold text-accent uppercase">Verificado</span>}
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <span className="text-2xl font-black text-foreground">${kit.precio}</span>
                                            <span className="text-[10px] uppercase font-bold text-muted">MXN</span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="flex flex-col items-center justify-center py-40 bg-card/20 rounded-[4rem] border border-dashed border-border">
                            <Music className="text-muted mb-6 opacity-20" size={64} />
                            <h3 className="text-2xl font-black uppercase tracking-tight font-heading mb-4 text-muted">No hay kits disponibles</h3>
                            <Link href="/beats" className="bg-accent text-white px-10 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest hover:scale-105 transition-all shadow-xl shadow-accent/20">
                                Regresar a Explorar
                            </Link>
                        </div>
                    )}
                </div>
            </main>

            <Footer />
        </div>
    );
}
