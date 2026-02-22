"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Music, TrendingUp, Zap, ArrowLeft, Heart, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function FreePlanPage() {
    const [userTier, setUserTier] = useState<string | null>(null);
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                setIsLoggedIn(true);
                const { data } = await supabase
                    .from('profiles')
                    .select('subscription_tier')
                    .eq('id', session.user.id)
                    .single();
                if (data) setUserTier(data.subscription_tier);
            }
            setLoading(false);
        };
        checkUser();
    }, []);

    const limitsFeatures = [
        {
            title: "5 Beats Públicos",
            description: "Muestra tu talento al mundo. Sube tus mejores 5 producciones y empieza a generar tracción.",
            icon: <Music className="text-slate-400" size={24} />
        },
        {
            title: "Licencia MP3 (con Tags)",
            description: "Tus beats estarán disponibles para venta en formato MP3 con tus marcas de agua de protección.",
            icon: <Zap className="text-slate-400" size={24} />
        },
        {
            title: "Estadísticas Básicas",
            description: "Visualiza cuántas personas han escuchado tus ritmos y monitorea tu crecimiento inicial.",
            icon: <TrendingUp className="text-slate-400" size={24} />
        },
        {
            title: "Smart Bio",
            description: "No incluida. Actualiza a PREMIUM para desbloquear tu enlace único y conectar todas tus redes.",
            icon: <Heart className="text-slate-300 dark:text-slate-600" size={24} />
        }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col transition-colors duration-300">
            <Navbar />

            <main className="flex-1">
                {/* Hero section - Vitaminized/Minimalist */}
                <section className="relative py-24 bg-card/30 dark:bg-[#020205] text-foreground overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-400/10 dark:bg-white/5 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-muted hover:text-foreground transition-colors text-xs font-bold uppercase tracking-widest mb-12">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-slate-400/10 text-slate-400 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-slate-400/20 backdrop-blur-sm">
                                    Punto de Inicio
                                </div>

                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8 text-slate-900 dark:text-white">
                                    Plan <span className="text-slate-400 drop-shadow-[0_0_10px_rgba(148,163,184,0.2)]">GRATIS</span>
                                </h1>
                                <p className="text-xl text-muted font-medium mb-10 max-w-lg leading-relaxed">
                                    La puerta de entrada a Tianguis Beats. Impulsa tu carrera sin costos iniciales, sube tu música y comienza a construir tu comunidad.
                                </p>

                                {loading ? (
                                    <div className="h-16 w-48 bg-card animate-pulse rounded-2xl"></div>
                                ) : isLoggedIn && userTier === 'free' ? (
                                    <div className="inline-block px-12 py-5 bg-card text-muted border border-border rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-default">
                                        Tu Plan Actual
                                    </div>
                                ) : isLoggedIn && (userTier === 'premium' || userTier === 'pro') ? (
                                    null // Strategy: Hide downgrade option for premium and pro users
                                ) : isLoggedIn ? (
                                    <Link href="/pricing" className="inline-block px-12 py-5 bg-card border border-border text-foreground rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-slate-400 transition-all shadow-sm hover:scale-105 active:scale-95">
                                        Cambiar a Gratis
                                    </Link>
                                ) : (
                                    <Link href="/signup" className="inline-block px-12 py-5 bg-foreground text-background rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-accent transition-all shadow-xl shadow-foreground/10 hover:scale-105 active:scale-95">
                                        Empezar Gratis Ahora
                                    </Link>
                                )}
                            </div>
                            <div className="bg-card/50 dark:bg-slate-900/50 backdrop-blur-xl p-12 rounded-[3.5rem] border border-border dark:border-white/10 shadow-2xl relative overflow-hidden group hover:border-slate-400 transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-500/5 dark:bg-white/5 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform"></div>

                                <div className="relative mb-10 group-hover:scale-110 transition-transform duration-700">
                                    <div className="absolute inset-0 bg-slate-400/10 blur-3xl rounded-full"></div>
                                    <img src="/images/plans/free.png" alt="Free Plan Visual" className="relative w-full h-32 object-contain grayscale opacity-60" />
                                </div>

                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-muted mb-10">Estructura del Plan</h4>
                                <div className="space-y-6">
                                    {[
                                        { label: "Suscripción Mensual", value: "$0 MXN", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Comisión por Venta", value: "15%", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Límite de Beats", value: "5 Activos", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Calidad de Audio", value: "MP3 Estándar", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Tianguis Studio", value: "Acceso Básico", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Smart Bio", value: "No incluida", icon: <X size={14} className="text-slate-300 dark:text-slate-600" /> }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-1 border-b border-dashed border-border dark:border-white/10 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-500/10 flex items-center justify-center shrink-0">
                                                    {item.icon}
                                                </div>
                                                <span className="text-xs font-bold text-muted uppercase tracking-tight">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-foreground">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Highlight */}
                <section className="py-32 bg-background dark:bg-[#020205]">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {limitsFeatures.map((f, i) => (
                                <div key={i} className="p-12 bg-card/30 dark:bg-white/5 border border-border dark:border-white/5 rounded-[3rem] hover:shadow-2xl hover:shadow-slate-500/10 transition-all group">
                                    <div className="w-16 h-16 bg-card dark:bg-white/10 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-slate-500/10 dark:group-hover:bg-white/20 transition-all duration-500">
                                        {f.icon && React.isValidElement(f.icon) ? React.cloneElement(f.icon as React.ReactElement<any>, { className: "text-slate-400" }) : f.icon}
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter text-foreground mb-4">{f.title}</h4>
                                    <p className="text-base text-muted font-medium leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Growth section */}
                <section className="py-32 bg-slate-950 text-white relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-1/2 h-full bg-slate-400/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-5xl font-black uppercase tracking-tighter mb-8 italic leading-none">"Escala tu negocio <span className="text-slate-400">sin límites</span>"</h2>
                                <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12">
                                    El plan gratis es el lugar ideal para establecer tus bases. Cuando tus ventas comiencen a escalar, el paso natural es PRO para quedarte con el 100% de tus ingresos y potenciar tu catálogo.
                                </p>
                                <div className="flex items-center gap-8">
                                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                                        <p className="text-3xl font-black text-slate-400">15%</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Comisión Base</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                                        <p className="text-3xl font-black text-white">5</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Lanzamientos</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-slate-500/10 blur-3xl rounded-full"></div>
                                <img
                                    src="/images/plans/free.png"
                                    className="rounded-[4rem] shadow-2xl opacity-60 group-hover:opacity-100 transition-opacity border-2 border-white/10 bg-slate-900 p-12"
                                    alt="Comunidad de Productores"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 text-center bg-background dark:bg-[#020205]">
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="w-20 h-20 bg-card dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-12">
                            <Heart size={32} className="text-muted" />
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-foreground mb-8 leading-none">Sin excusas. Únete hoy.</h2>
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.3em] mb-16 leading-loose">
                            Tu carrera musical no espera. Sube tus mejores hits y forma parte de la red de productores más grande.
                        </p>
                    </div>
                </section>
            </main>

            <Footer />
        </div >
    );
}
