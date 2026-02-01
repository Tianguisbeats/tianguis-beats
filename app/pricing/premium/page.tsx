"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, ShieldCheck, Zap, Globe, Diamond, ArrowLeft, Rocket } from 'lucide-react';
import Link from 'next/link';

export default function PremiumPlanPage() {
    const exclusivityFeatures = [
        {
            title: "Licencia de Stems (Pistas)",
            description: "Permite a los artistas comprar las pistas separadas de tu beat para una mezcla profesional.",
            icon: <Zap className="text-blue-500" size={24} />
        },
        {
            title: "Venta Exclusiva Habilitada",
            description: "Habilita la opción de vender un beat en exclusiva y retirarlo automáticamente de la tienda a un precio premium.",
            icon: <Diamond className="text-blue-500" size={24} />
        },
        {
            title: "Algoritmo de Prioridad",
            description: "Tus beats aparecerán en las posiciones superiores de la Home y Explorar para mayor visibilidad.",
            icon: <Rocket className="text-blue-500" size={24} />
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1">
                {/* Hero section with Blue themes */}
                <section className="relative py-24 overflow-hidden bg-gradient-to-br from-blue-700 via-blue-800 to-slate-900 text-white">
                    <div className="absolute top-0 right-0 w-1/2 h-full bg-blue-500/10 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-12">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="max-w-3xl">
                            <div className="inline-flex items-center gap-2 bg-white/10 text-white px-5 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-white/20 backdrop-blur-md">
                                <ShieldCheck size={14} className="text-blue-400" /> Máximo Nivel Profesional
                            </div>
                            <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                                Plan <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-300 to-blue-100">PREMIUM</span>
                            </h1>
                            <p className="text-xl md:text-2xl text-blue-100/80 font-medium mb-10 max-w-2xl leading-relaxed">
                                El estándar de la industria para productores que controlan el mercado. Exclusividad, potencia y visibilidad absoluta.
                            </p>
                            <Link href="/pricing" className="inline-block px-12 py-6 bg-white text-blue-900 rounded-3xl font-black uppercase tracking-widest text-xs hover:bg-blue-50 hover:scale-105 transition-all shadow-2xl shadow-blue-900/40 active:scale-95">
                                Convertirme en Premium — $349 MXN
                            </Link>
                        </div>
                    </div>
                </section>

                {/* Features Highlight */}
                <section className="py-28 bg-white border-b border-slate-100">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-16">
                            {exclusivityFeatures.map((f, i) => (
                                <div key={i} className="flex flex-col items-center text-center">
                                    <div className="w-20 h-20 bg-blue-50 rounded-[2.5rem] flex items-center justify-center mb-10 shadow-inner group hover:scale-110 transition-transform">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter text-slate-900 mb-4">{f.title}</h4>
                                    <p className="text-base text-slate-500 font-medium leading-relaxed px-4">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* The "Power-up" Section */}
                <section className="py-32 bg-slate-50 relative overflow-hidden">
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <div className="grid md:grid-cols-2 gap-20 items-center">
                            <div className="order-2 md:order-1">
                                <div className="space-y-12">
                                    <div className="flex gap-6">
                                        <div className="shrink-0 w-12 h-12 bg-blue-600 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                            <Globe size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Exposición Global</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">Tu música llegará a más oídos. El algoritmo de Tianguis優先 prioritiza tus lanzamientos en las secciones de recomendados y tendencias.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="shrink-0 w-12 h-12 bg-slate-900 text-white rounded-2xl flex items-center justify-center shadow-lg">
                                            <ShieldCheck size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Soporte VIP 24/7</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">Atención directa y prioritaria por parte de nuestro equipo para cualquier duda comercial o técnica.</p>
                                        </div>
                                    </div>
                                    <div className="flex gap-6">
                                        <div className="shrink-0 w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                                            <Zap size={20} />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-black uppercase tracking-tighter mb-2">Todo el catálogo habilitado</h4>
                                            <p className="text-slate-500 font-medium leading-relaxed">Sin restricciones. MP3, WAV, Stems y Exclusivas. El paquete completo para el artista serio.</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="order-1 md:order-2">
                                <div className="relative">
                                    <div className="absolute -inset-10 bg-blue-500/10 blur-[80px] rounded-full"></div>
                                    <div className="relative rounded-[4rem] overflow-hidden border-4 border-white shadow-3xl">
                                        <img
                                            src="https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
                                            alt="Studio"
                                            className="w-full h-auto"
                                        />
                                        <div className="absolute inset-0 bg-gradient-to-t from-blue-900/60 to-transparent"></div>
                                        <div className="absolute bottom-8 left-8 right-8 p-6 bg-white/10 backdrop-blur-xl rounded-3xl border border-white/20">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-blue-200">Testimonio</span>
                                            <p className="text-white text-sm font-bold italic mt-2">"Ser Premium cambió mis ventas. La gente confía más cuando ve todos los formatos disponibles."</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final Call to Action */}
                <section className="py-24 text-center">
                    <div className="max-w-4xl mx-auto px-4">
                        <h2 className="text-5xl font-black uppercase tracking-tighter text-slate-900 mb-8">¿Listo para dominar la tienda?</h2>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-12">Mejora hoy y siente la diferencia Premium</p>
                        <div className="flex flex-col md:flex-row items-center justify-center gap-6">
                            <Link href="/pricing" className="px-12 py-5 bg-blue-600 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-xl shadow-blue-600/30">
                                Elegir Premium
                            </Link>
                            <Link href="/help" className="px-12 py-5 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black uppercase tracking-widest text-xs hover:border-slate-900 hover:text-slate-900 transition-all">
                                Hablar con ventas
                            </Link>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
