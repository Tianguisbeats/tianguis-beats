"use client";

import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Star, Zap, TrendingUp, ShieldCheck, ArrowLeft, Crown, X } from 'lucide-react';
import Link from 'next/link';
import { supabase } from '@/lib/supabase';

export default function ProPlanPage() {
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
            title: "0% Comisión por Venta",
            description: "No compartas tus ganancias. El 100% de cada venta va directamente a tu bolsillo.",
            icon: <TrendingUp className="text-amber-500" size={24} />
        },
        {
            title: "Catálogo Ilimitado",
            description: "Sube todos los ritmos que desees. No pongas frenos a tu flujo de trabajo creativo.",
            icon: <Zap className="text-amber-500" size={24} />
        },
        {
            title: "Audio WAV Profesional",
            description: "Habilita la entrega de archivos WAV de alta calidad para los artistas más exigentes.",
            icon: <ShieldCheck className="text-amber-500" size={24} />

        }
    ];

    const summaryItems = [
        { label: "Costo Mensual", value: "$149 MXN" },
        { label: "Comisión Tianguis", value: "0%" },
        { label: "Almacenamiento", value: "Ilimitado" },
        { label: "Soporte", value: "Prioritario 24/7" },
        { label: "Tianguis Studio", value: "Full Access" }
    ];

    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#08080a] text-slate-900 dark:text-white font-sans flex flex-col">
            <Navbar />

            <main className="flex-1">
                {/* Hero section - Vitaminized Amber/Slate */}
                <section className="relative py-24 bg-slate-900 text-white overflow-hidden">
                    <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')]"></div>
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-amber-500/10 blur-[120px] rounded-full translate-x-1/2 -translate-y-1/2"></div>

                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest mb-12">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-400 px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-amber-400/30 backdrop-blur-sm">
                                    <Star size={14} fill="currentColor" /> Plan de Crecimiento
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                                    Plan <span className="text-amber-400 drop-shadow-[0_0_15px_rgba(251,191,36,0.3)]">PRO</span>
                                </h1>
                                <p className="text-xl text-slate-400 font-medium mb-12 max-w-lg leading-relaxed">
                                    Toma el control total de tu negocio. Sin comisiones, con subidas ilimitadas y todas las herramientas para profesionalizar tu tienda.
                                </p>

                                {loading ? (
                                    <div className="h-16 w-56 bg-white/10 animate-pulse rounded-2xl"></div>
                                ) : isLoggedIn && userTier === 'pro' ? (
                                    <div className="inline-block px-12 py-6 bg-amber-400/10 text-amber-400 border border-amber-400/30 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-default backdrop-blur-sm">
                                        Tu Plan Actual
                                    </div>
                                ) : (
                                    <Link href="/pricing" className="inline-block px-12 py-6 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all shadow-2xl shadow-amber-500/20 hover:scale-105 active:scale-95">
                                        {isLoggedIn && userTier === 'premium' ? "Plan Superior Activo" : isLoggedIn ? "Mejorar a PRO — $149 MXN" : "Mejorar Ahora — $149 MXN"}
                                    </Link>
                                )}
                            </div>

                            <div className="relative">
                                <div className="bg-slate-800 border-2 border-slate-700 p-12 rounded-[4rem] shadow-2xl relative overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-6 bg-amber-400 text-slate-900 rounded-bl-[2.5rem] font-black text-[10px] uppercase tracking-widest">PRO Verified</div>
                                    <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500 mb-10">Resumen del Plan</h4>
                                    <div className="space-y-6">
                                        {summaryItems.map((item, i) => (
                                            <div key={i} className="flex items-center justify-between py-1 border-b border-white/5 last:border-0">
                                                <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">{item.label}</span>
                                                <span className="text-sm font-black text-white">{item.value}</span>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="mt-10 pt-6 border-t border-white/5 flex items-center gap-3 text-amber-400 font-black text-[10px] uppercase tracking-widest">
                                        <ShieldCheck size={16} />
                                        100% de Ingresos para ti
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Highlights */}
                <section className="py-32 bg-white dark:bg-black/20">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
                            {mainFeatures.map((f, i) => (
                                <div key={i} className="p-12 bg-slate-50 dark:bg-white/5 rounded-[3.5rem] border border-slate-100 dark:border-white/10 hover:border-amber-200 transition-all group">
                                    <div className="w-16 h-16 bg-white dark:bg-white/10 rounded-2xl flex items-center justify-center mb-10 shadow-sm border border-slate-100 dark:border-white/5 group-hover:scale-110 group-hover:bg-amber-50 dark:group-hover:bg-amber-500/10 group-hover:border-amber-100 transition-all duration-500">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-4">{f.title}</h4>
                                    <p className="text-base text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Business Growth Section */}
                <section className="py-32 bg-slate-50 dark:bg-[#08080a]">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white dark:bg-white/5 p-12 md:p-20 rounded-[4rem] border border-slate-200 dark:border-white/10 shadow-2xl relative overflow-hidden">
                            <div className="absolute top-0 right-0 w-64 h-64 bg-amber-50 dark:bg-amber-500/5 rounded-full blur-[100px] -mr-32 -mt-32 opacity-60"></div>

                            <h2 className="text-4xl md:text-5xl font-black uppercase tracking-tighter text-slate-900 dark:text-white mb-16 text-center leading-none">
                                Escala tu Negocio a <span className="text-amber-500">0% Comisión</span>
                            </h2>

                            <div className="grid gap-4">
                                {[
                                    { name: "Comisión por Venta", free: "15%", pro: "0%", icon: <TrendingUp size={14} /> },
                                    { name: "Límite de Beats", free: "5", pro: "Ilimitados", icon: <Zap size={14} /> },
                                    { name: "Entrega de MP3 & WAV", free: <X size={14} className="text-slate-300 mx-auto" />, pro: <Check size={14} className="text-amber-500 mx-auto" />, icon: <ShieldCheck size={14} /> },
                                    { name: "Soporte al Cliente", free: "Básico", pro: "Prioritario", icon: <Star size={14} /> }
                                ].map((row, i) => (
                                    <div key={i} className="grid grid-cols-3 gap-6 items-center py-6 border-b border-slate-50 dark:border-white/5 last:border-0">
                                        <div className="flex items-center gap-3 text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">
                                            <div className="p-2 bg-slate-50 dark:bg-white/5 rounded-lg text-slate-400">{row.icon}</div>
                                            {row.name}
                                        </div>
                                        <div className="text-sm font-bold text-slate-400 text-center">{row.free}</div>
                                        <div className="text-sm font-black text-slate-900 dark:text-white text-center bg-amber-50 dark:bg-amber-500/10 rounded-2xl py-3 border border-amber-100 dark:border-amber-500/20 shadow-sm">
                                            {row.pro}
                                        </div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-16 bg-slate-900 text-white p-10 rounded-[2.5rem] flex flex-col md:flex-row items-center justify-between gap-8 group">
                                <div>
                                    <h4 className="text-2xl font-black uppercase tracking-tighter mb-2 group-hover:text-amber-400 transition-colors">¿Listo para la Independencia?</h4>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.3em]">Convierte tu pasión en una empresa rentable</p>
                                </div>

                                {loading ? (
                                    <div className="h-16 w-48 bg-white/10 animate-pulse rounded-2xl"></div>
                                ) : isLoggedIn && userTier === 'pro' ? (
                                    <div className="px-10 py-5 bg-white/10 text-white border border-white/20 rounded-2xl font-black uppercase tracking-widest text-[10px] cursor-default">
                                        Tu Plan Actual
                                    </div>
                                ) : (
                                    <Link href="/pricing" className="px-10 py-5 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all hover:scale-110 active:scale-95 shadow-xl shadow-amber-500/20">
                                        {isLoggedIn && userTier === 'premium' ? "Incluido en tu Plan" : "Empezar con PRO"}
                                    </Link>
                                )}
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
