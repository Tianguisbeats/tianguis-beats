"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Music, TrendingUp, Zap, ArrowLeft, Heart } from 'lucide-react';
import Link from 'next/link';

export default function FreePlanPage() {
    const limitsFeatures = [
        {
            title: "5 Beats Públicos",
            description: "Empieza a mostrar tu sonido al mundo con tus mejores producciones.",
            icon: <Music className="text-slate-400" size={24} />
        },
        {
            title: "Licencia MP3 Básica",
            description: "Permite a los artistas comprar una licencia estándar en formato MP3.",
            icon: <Zap className="text-slate-400" size={24} />
        },
        {
            title: "Plataforma de confianza",
            description: "Únete a la comunidad de productores más fuerte de México y Latam.",
            icon: <Heart className="text-slate-400" size={24} />
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1">
                {/* Hero section - Minimalist and Clean */}
                <section className="relative py-24 bg-slate-50 text-slate-900">
                    <div className="max-w-6xl mx-auto px-4">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-900 transition-colors text-xs font-bold uppercase tracking-widest mb-12">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="grid md:grid-cols-2 gap-16 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-slate-200 text-slate-500 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] mb-6">
                                    Plan de Entrada
                                </div>
                                <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-none mb-8">
                                    Plan <span className="text-slate-300">GRATIS</span>
                                </h1>
                                <p className="text-xl text-slate-500 font-medium mb-10 max-w-lg leading-relaxed">
                                    La puerta de entrada a Tianguis Beats. Prueba la plataforma, sube tus primeros beats y empieza a vender sin costo fijo mensual.
                                </p>
                                <Link href="/signup" className="inline-block px-12 py-5 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/10">
                                    Empezar a publicar ahora
                                </Link>
                            </div>
                            <div className="bg-white p-10 rounded-[3rem] border border-slate-200 shadow-sm relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 -mr-16 -mt-16 rounded-full"></div>
                                <h4 className="text-sm font-black uppercase tracking-[0.2em] text-slate-400 mb-8">Estructura del Plan</h4>
                                <div className="space-y-6">
                                    {[
                                        "Costo Mensual: $0 MXN",
                                        "Comisión por venta: 15%",
                                        "Límite: 5 Beats públicos",
                                        "Calidad: MP3 Estándar",
                                        "Acceso al Tianguis Studio: Full"
                                    ].map((item, i) => (
                                        <div key={i} className="flex items-center gap-4 text-slate-600 font-bold text-sm">
                                            <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center shrink-0">
                                                <Check size={12} className="text-slate-400" strokeWidth={4} />
                                            </div>
                                            {item}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Highlight */}
                <section className="py-24 bg-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-3 gap-12">
                            {limitsFeatures.map((f, i) => (
                                <div key={i} className="p-10 bg-white border border-slate-100 rounded-[2.5rem] hover:shadow-xl hover:shadow-slate-200/40 transition-all">
                                    <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center mb-10 group-hover:scale-110 transition-transform">
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
                <section className="py-24 bg-slate-900 text-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="grid md:grid-cols-2 gap-20 items-center">
                            <div>
                                <h2 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">"Todos empezamos en algún <span className="text-blue-500">lugar</span>"</h2>
                                <p className="text-slate-400 font-medium text-lg leading-relaxed mb-10">
                                    El plan gratis no es un límite, es un trampolín. Úsalo para validar tus primeros beats y, en cuanto realices tus primeras ventas, podrás mejorar a PRO para reinvertir en tu carrera y quedarte con el 100% de lo que generas.
                                </p>
                                <div className="flex items-center gap-6">
                                    <div className="bg-slate-800 p-6 rounded-2xl">
                                        <p className="text-2xl font-black text-blue-500">15%</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Comisión única</p>
                                    </div>
                                    <div className="bg-slate-800 p-6 rounded-2xl">
                                        <p className="text-2xl font-black text-white">5</p>
                                        <p className="text-[9px] font-black uppercase tracking-widest text-slate-500 mt-1">Beats Activos</p>
                                    </div>
                                </div>
                            </div>
                            <div className="relative">
                                <img
                                    src="https://images.unsplash.com/photo-1542333398-93f95b9d22aa?q=80&w=2070&auto=format&fit=crop"
                                    className="rounded-[3rem] shadow-2xl opacity-60 grayscale hover:grayscale-0 transition-all"
                                    alt="Producer starts"
                                />
                            </div>
                        </div>
                    </div>
                </section>

                {/* Final CTA */}
                <section className="py-24 text-center">
                    <div className="max-w-3xl mx-auto px-4">
                        <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-6 underline decoration-blue-600 decoration-8 underline-offset-8">Sin excusas.</h2>
                        <p className="text-slate-400 text-sm font-bold uppercase tracking-[0.2em] mb-12 mt-10 leading-loose">
                            Crea tu cuenta hoy mismo, sube tus mejores 5 ritmos y empieza a formar parte del movimiento. Es gratis para siempre, o hasta que estés listo para crecer.
                        </p>
                        <Link href="/signup" className="px-16 py-6 bg-slate-900 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-blue-600 transition-all shadow-xl shadow-blue-600/20 active:scale-95">
                            Crear mi cuenta GRATIS
                        </Link>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
