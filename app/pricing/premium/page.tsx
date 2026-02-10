"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import {
    Check, Star, Zap, TrendingUp, ShieldCheck,
    ArrowLeft, Crown, X, Briefcase, Package,
    Diamond, Rocket, Music, Globe
} from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function PremiumPlanPage() {
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

    const mainFeatures = [
        {
            title: "Servicios de Mezcla y Masterización",
            description: "Habilita la venta de servicios profesionales directamente en tu perfil con el respaldo de Tianguis Beats.",
            icon: <Briefcase size={24} className="text-blue-500" />
        },
        {
            title: "Venta de Sound Kits",
            description: "Vende tus propios Sample Packs, Drum Kits y Presets con entrega digital automática.",
            icon: <Package size={24} className="text-blue-500" />
        },
        {
            title: "Licencias Exclusivas",
            description: "Vende derechos totales sobre tus beats y retíralos automáticamente del catálogo al cerrar la venta.",
            icon: <Diamond size={24} className="text-blue-500" />
        },
        {
            title: "Algoritmo de Prioridad VIP",
            description: "Tus lanzamientos aparecerán en las posiciones superiores del Home y Explorar para máxima visibilidad.",
            icon: <Rocket size={24} className="text-blue-500" />
        }
    ];

    const stats = [
        { label: "Costo Mensual", value: "$349 MXN" },
        { label: "Comisión Venta", value: "0%" },
        { label: "Licencia Stems", value: "Habilitada" },
        { label: "Exclusivas", value: "Habilitadas" },
        { label: "Sound Kits", value: "Ilimitados" },
        { label: "Smart Bio", value: "Premium" }
    ];

    return (
        <div className="min-h-screen bg-background text-foreground font-sans flex flex-col pt-20 transition-colors duration-300">
            <Navbar />

            <main className="flex-1">
                {/* Hero section - Vitaminized Blue/Gold */}
                <section className="relative py-28 overflow-hidden bg-gradient-to-br from-blue-700 via-blue-900 to-slate-950 text-white">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-400/10 blur-[130px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="absolute bottom-0 left-0 w-1/4 h-1/2 bg-blue-500/10 blur-[100px] rounded-full"></div>

                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-300 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-12">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-white/20 backdrop-blur-md">
                                    <ShieldCheck size={14} className="text-blue-400" /> Máximo Nivel Profesional
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                                    Plan <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100 italic">PREMIUM</span>
                                </h1>
                                <p className="text-xl md:text-2xl text-blue-100/80 font-medium mb-12 max-w-xl leading-relaxed">
                                    Domina el mercado global. Vende servicios, kits, exclusivas y obtén la exposición que tu career merece.
                                </p>

                                {loading ? (
                                    <div className="h-16 w-56 bg-white/10 animate-pulse rounded-[2rem]"></div>
                                ) : isLoggedIn && userTier === 'premium' ? (
                                    <div className="inline-block px-12 py-6 bg-white/20 text-white border border-white/30 rounded-[2rem] font-black uppercase tracking-widest text-[10px] cursor-default backdrop-blur-sm">
                                        Tu Plan Actual
                                    </div>
                                ) : (
                                    <Link href="/pricing" className="inline-block px-12 py-6 bg-white text-blue-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-blue-50 hover:scale-105 transition-all shadow-2xl shadow-blue-900/40 active:scale-95">
                                        {isLoggedIn ? (userTier === 'free' || userTier === 'pro' ? "Mejorar a Premium" : "Suscribirse Premium") : "Ser Premium — $349 MXN"}
                                    </Link>
                                )}
                            </div>

                            <div className="relative">
                                <div className="absolute -inset-4 bg-blue-500/20 blur-3xl rounded-full"></div>
                                <div className="relative bg-white/5 backdrop-blur-xl border border-white/10 p-12 rounded-[4rem] shadow-3xl">
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-300 mb-10">Configuración Premium</h4>
                                    <div className="space-y-6">
                                        {stats.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                                                <span className="text-[10px] font-black text-blue-200/50 uppercase tracking-widest">{item.label}</span>
                                                <span className="text-sm font-black text-white">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-12 p-6 bg-blue-500/20 border border-blue-400/30 rounded-3xl text-center">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-200">Exposición garantizada</p>
                                        <p className="text-xs font-bold text-white mt-1">Algoritmo de prioridad activado</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Highlight */}
                <section className="py-32 bg-background dark:bg-[#020205]">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {mainFeatures.map((f, i) => (
                                <div key={i} className="p-10 bg-card/30 dark:bg-white/5 rounded-[3rem] border border-border dark:border-white/10 hover:border-blue-500/50 transition-all group text-center">
                                    <div className="w-16 h-16 bg-card dark:bg-white/10 rounded-2xl flex items-center justify-center mb-8 mx-auto shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                        {f.icon && React.isValidElement(f.icon) ? React.cloneElement(f.icon as React.ReactElement<any>, { className: "text-blue-500 group-hover:text-white transition-colors" }) : f.icon}
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tighter text-foreground mb-3 leading-tight">{f.title}</h4>
                                    <p className="text-xs text-muted font-bold leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Vitaminized Content Section */}
                <section className="py-32 bg-card/30 dark:bg-slate-950/50 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-2 gap-20 items-center">
                            <div className="order-2 md:order-1">
                                <div className="space-y-12">
                                    <div className="flex gap-8 group">
                                        <div className="shrink-0 w-14 h-14 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Music size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Venta de Sound Kits</h4>
                                            <p className="text-muted font-medium leading-relaxed">Habilita tu propia tienda de librerías. El plan Premium te permite subir y vender Drum Kits, Sample Packs y bancos de sonidos sin límites.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 group">
                                        <div className="shrink-0 w-14 h-14 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Briefcase size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Servicios Master & Mix</h4>
                                            <p className="text-muted font-medium leading-relaxed">Ofrece servicios profesionales. Los clientes podrán contratarte para mezclar o masterizar sus temas directamente desde tu perfil.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-8 group">
                                        <div className="shrink-0 w-14 h-14 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                                            <Zap size={24} />
                                        </div>
                                        <div>
                                            <h4 className="text-xl font-black uppercase tracking-tighter mb-2">Ecosistema Completo</h4>
                                            <p className="text-muted font-medium leading-relaxed">Beats, Servicios, Kits y Exclusivas. Todo centralizado en una plataforma diseñada para que solo te preocupes de crear.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="relative group">
                                    <div className="absolute -inset-10 bg-blue-500/10 blur-[100px] rounded-full group-hover:bg-blue-500/20 transition-all"></div>
                                    <div className="relative rounded-[4rem] overflow-hidden border-8 border-card shadow-3xl">
                                        <img
                                            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
                                            alt="Studio"
                                            className="w-full h-auto"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent"></div>
                                        <div className="absolute bottom-10 left-10 right-10 p-8 bg-white/5 backdrop-blur-2xl rounded-[2rem] border border-white/10">
                                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-300">Empieza hoy</span>
                                            <p className="text-white text-lg font-black uppercase tracking-tighter mt-2">"El estándar para el 1% de los productores"</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 text-center bg-background dark:bg-[#020205]">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="w-20 h-20 bg-blue-500/10 dark:bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-10">
                            <Diamond size={32} className="text-blue-500" />
                        </div>
                        <h2 className="text-5xl md:text-6xl font-black uppercase tracking-tighter text-foreground mb-8 leading-none">Domina el mercado global.</h2>
                        <p className="text-muted text-[10px] font-black uppercase tracking-[0.3em] mb-16">Acceso inmediato a todas las herramientas de negocio</p>

                        {loading ? (
                            <div className="h-20 w-80 bg-card animate-pulse rounded-[2rem] mx-auto"></div>
                        ) : (
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                                <Link
                                    href={isLoggedIn && userTier === 'premium' ? "#" : "/pricing"}
                                    className={`px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-[10px] transition-all shadow-2xl hover:scale-105 active:scale-95 ${isLoggedIn && userTier === 'premium'
                                        ? "bg-card dark:bg-white/10 text-muted cursor-default shadow-none"
                                        : "bg-blue-600 text-white hover:bg-slate-900 dark:hover:bg-blue-500 shadow-blue-600/30"
                                        }`}
                                >
                                    {isLoggedIn && userTier === 'premium' ? "Tu Plan Actual" : isLoggedIn ? "Mejorar a Premium" : "Elegir Premium"}
                                </Link>

                                {!isLoggedIn && (
                                    <Link href="/signup" className="px-12 py-6 bg-card dark:bg-white/5 border-2 border-border dark:border-white/10 text-muted rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:border-slate-900 dark:hover:border-white/30 hover:text-foreground transition-all active:scale-95">
                                        Crear mi cuenta
                                    </Link>
                                )}
                            </div>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
