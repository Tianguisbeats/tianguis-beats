"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Music, TrendingUp, Zap, ArrowLeft, Heart } from 'lucide-react';
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
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1">
                {/* Hero section - Vitaminized/Minimalist */}
                <section className="relative py-24 bg-slate-50/50 text-slate-900 overflow-hidden">
                    <div className="absolute top-0 right-0 w-1/3 h-full bg-slate-200/30 blur-[100px] rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest mb-12">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-slate-200/50 text-slate-500 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-6 border border-slate-200">
                                    Punto de Inicio
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                                    Plan <span className="text-slate-300">GRATIS</span>
                                </h1>
                                <p className="text-xl text-slate-500 font-medium mb-10 max-w-lg leading-relaxed">
                                    La puerta de entrada a Tianguis Beats. Impulsa tu carrera sin costos iniciales, sube tu música y comienza a construir tu comunidad.
                                </p>

                                {loading ? (
                                    <div className="h-16 w-48 bg-slate-100 animate-pulse rounded-2xl"></div>
                                ) : isLoggedIn && userTier === 'free' ? (
                                    <div className="inline-block px-12 py-5 bg-slate-100 text-slate-400 border border-slate-200 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-default">
                                        Tu Plan Actual
                                    </div>
                                ) : isLoggedIn && userTier !== 'free' ? (
                                    <Link href="/pricing" className="inline-block px-12 py-5 bg-white border border-slate-200 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:border-slate-900 transition-all shadow-sm hover:scale-105 active:scale-95">
                                        Cambiar a Gratis
                                    </Link>
                                ) : (
                                    <Link href="/signup" className="inline-block px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10 hover:scale-105 active:scale-95">
                                        Empezar Gratis Ahora
                                    </Link>
                                )}
                            </div>
                            <div className="bg-white p-12 rounded-[3.5rem] border border-slate-200 shadow-2xl shadow-slate-200/50 relative overflow-hidden group hover:border-slate-300 transition-all">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full group-hover:scale-110 transition-transform"></div>
                                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mb-10">Estructura del Plan</h4>
                                <div className="space-y-6">
                                    {[
                                        { label: "Suscripción Mensual", value: "$0 MXN", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Comisión por Venta", value: "15%", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Límite de Beats", value: "5 Activos", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Calidad de Audio", value: "MP3 Estándar", icon: <Check size={14} className="text-slate-400" /> },
                                        { label: "Tianguis Studio", value: "Acceso Básico", icon: <Check size={14} className="text-slate-400" /> }
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center justify-between py-1 border-b border-dashed border-slate-100 last:border-0">
                                            <div className="flex items-center gap-3">
                                                <div className="w-6 h-6 rounded-full bg-slate-50 flex items-center justify-center shrink-0">
                                                    {item.icon}
                                                </div>
                                                <span className="text-xs font-bold text-slate-500 uppercase tracking-tight">{item.label}</span>
                                            </div>
                                            <span className="text-sm font-black text-slate-900">{item.value}</span>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Highlight */}
                <section className="py-32 bg-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-8">
                            {limitsFeatures.map((f, i) => (
                                <div key={i} className="p-12 bg-white border border-slate-100 rounded-[3rem] hover:shadow-2xl hover:shadow-slate-200/60 transition-all group">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 group-hover:bg-slate-100 transition-all duration-500">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-4">{f.title}</h4>
                                    <p className="text-base text-slate-500 font-medium leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Growth section */}
                <section className="py-32 bg-slate-900 text-white relative overflow-hidden">
                    <div className="absolute bottom-0 left-0 w-1/2 h-full bg-blue-600/5 blur-[120px] rounded-full translate-y-1/2 -translate-x-1/2"></div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-5xl font-black uppercase tracking-tighter mb-8 italic leading-none">"Escala tu negocio <span className="text-blue-500">sin límites</span>"</h2>
                                <p className="text-slate-400 font-medium text-lg leading-relaxed mb-12">
                                    El plan gratis es el lugar ideal para establecer tus bases. Cuando tus ventas comiencen a escalar, el paso natural es PRO para quedarte con el 100% de tus ingresos y potenciar tu catálogo.
                                </p>
                                <div className="flex items-center gap-8">
                                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                                        <p className="text-3xl font-black text-blue-500">15%</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Comisión Base</p>
                                    </div>
                                    <div className="bg-white/5 border border-white/10 p-8 rounded-3xl backdrop-blur-sm">
                                        <p className="text-3xl font-black text-white">5</p>
                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mt-2">Lanzamientos</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <div className="absolute -inset-4 bg-blue-500/10 blur-3xl rounded-full"></div>
                                <img
                                    src="https://images.unsplash.com/photo-1542333398-93f95b9d22aa?q=80&w=2070&auto=format&fit=crop"
                                    className="rounded-[4rem] shadow-2xl opacity-80 group-hover:opacity-100 transition-opacity border-2 border-white/10"
                                    alt="Comunidad de Productores"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-32 text-center bg-white">
                    <div className="max-w-3xl mx-auto px-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-12">
                            <Heart size={32} className="text-slate-200" />
                        </div>
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-8 leading-none">Sin excusas. Únete hoy.</h2>
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em] mb-16 leading-loose">
                            Tu carrera musical no espera. Sube tus mejores hits y forma parte de la red de productores más grande.
                        </p>

                        {loading ? (
                            <div className="h-20 w-64 bg-slate-100 animate-pulse rounded-[2rem] mx-auto"></div>
                        ) : isLoggedIn && userTier === 'free' ? (
                            <div className="inline-block px-16 py-7 bg-slate-100 text-slate-400 border border-slate-200 rounded-[2rem] font-black uppercase tracking-widest text-[10px] cursor-default">
                                Estás usando el Plan Gratis
                            </div>
                        ) : isLoggedIn ? (
                            <Link href="/pricing" className="px-16 py-7 bg-white border-2 border-slate-200 text-slate-900 rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:border-slate-900 transition-all shadow-sm hover:scale-105 active:scale-95 inline-block">
                                Ver otros planes
                            </Link>
                        ) : (
                            <Link href="/signup" className="px-16 py-7 bg-slate-900 text-white rounded-[2rem] font-black uppercase tracking-widest text-[10px] hover:bg-blue-600 transition-all shadow-2xl shadow-blue-600/20 hover:scale-105 active:scale-95 inline-block">
                                Crear mi cuenta GRATIS
                            </Link>
                        )}
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
