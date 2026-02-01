"use client";

import React from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Star, Zap, TrendingUp, ShieldCheck, ArrowLeft, Crown } from 'lucide-react';
import Link from 'next/link';

export default function ProPlanPage() {
    const mainFeatures = [
        {
            title: "0% Comisión por Venta",
            description: "Quédate con el 100% de tus ingresos. Sin letras pequeñas.",
            icon: <TrendingUp className="text-amber-500" size={24} />
        },
        {
            title: "Subidas Ilimitadas",
            description: "No pongas límites a tu creatividad. Sube todos los beats que quieras.",
            icon: <Zap className="text-amber-500" size={24} />
        },
        {
            title: "Archivos WAV HQ",
            description: "Ofrece la máxima calidad a tus clientes con archivos WAV profesionales.",
            icon: <ShieldCheck className="text-amber-500" size={24} />
        }
    ];

    const deepContent = [
        {
            title: "Potencia tu Carrera",
            text: "El plan PRO está diseñado para productores que han decidido tomarse su carrera en serio. Al eliminar las comisiones, cada venta que realizas es íntegramente tuya, lo que te permite reinvertir en tu equipo, marketing y crecimiento.",
            image: "https://images.unsplash.com/photo-1598488035139-bdbb2231ce04?q=80&w=2070&auto=format&fit=crop"
        },
        {
            title: "Más que solo Archivos",
            text: "Al habilitar la subida de archivos WAV, te posicionas como un profesional en el mercado. Los artistas serios buscan calidad, y el formato WAV es el estándar de la industria que te permitirá cerrar más ventas y a mejores precios.",
            image: "https://images.unsplash.com/photo-1520529124203-0974f3ca4e18?q=80&w=2070&auto=format&fit=crop"
        }
    ];

    return (
        <div className="min-h-screen bg-slate-50 text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1">
                {/* Hero Section */}
                <section className="relative py-20 overflow-hidden bg-slate-900 text-white">
                    <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/dark-matter.png')]"></div>
                    <div className="max-w-6xl mx-auto px-4 relative z-10">
                        <Link href="/pricing" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-xs font-bold uppercase tracking-widest mb-10">
                            <ArrowLeft size={14} /> Volver a planes
                        </Link>

                        <div className="grid md:grid-cols-2 gap-12 items-center">
                            <div>
                                <div className="inline-flex items-center gap-2 bg-amber-400/20 text-amber-400 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-6 border border-amber-400/30">
                                    <Crown size={12} /> Plan Recomendado
                                </div>
                                <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-none mb-6">
                                    Plan <span className="text-amber-400 text-shadow-glow">PRO</span>
                                </h1>
                                <p className="text-xl text-slate-400 font-medium mb-8 max-w-lg leading-relaxed">
                                    Diseñado para productores independientes que buscan maximizar sus ganancias y profesionalizar su catálogo.
                                </p>
                                <Link href="/pricing" className="inline-block px-10 py-5 bg-amber-500 text-slate-900 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-amber-400 hover:scale-105 transition-all shadow-xl shadow-amber-500/20 active:scale-95">
                                    Mejorar Ahora — $149 MXN
                                </Link>
                            </div>
                            <div className="relative hidden md:block">
                                <div className="absolute -inset-4 bg-amber-500/20 blur-3xl rounded-full"></div>
                                <div className="relative bg-slate-800 border-2 border-slate-700 p-8 rounded-[3rem] shadow-2xl overflow-hidden group">
                                    <div className="absolute top-0 right-0 p-4 bg-amber-400 text-slate-900 rounded-bl-3xl font-black text-[10px] uppercase tracking-widest">0% Fees</div>
                                    <div className="flex items-center gap-4 mb-8">
                                        <div className="w-12 h-12 bg-slate-700 rounded-2xl flex items-center justify-center text-amber-400">
                                            <Star size={24} fill="currentColor" />
                                        </div>
                                        <div>
                                            <h4 className="font-black uppercase tracking-tighter text-lg">Independencia Total</h4>
                                            <p className="text-slate-500 text-[10px] font-bold uppercase">Sin límites de distribución</p>
                                        </div>
                                    </div>
                                    <div className="space-y-4">
                                        {[
                                            "Comisión por venta: 0%",
                                            "Almacenamiento: Ilimitado",
                                            "Formato WAV: Habilitado",
                                            "Soporte: Prioritario",
                                            "Etiqueta Verificada PRO"
                                        ].map((item, i) => (
                                            <div key={i} className="flex items-center gap-3 text-slate-300 text-xs font-bold">
                                                <Check size={14} className="text-amber-400" strokeWidth={4} />
                                                {item}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Features Grid */}
                <section className="py-24 bg-white">
                    <div className="max-w-6xl mx-auto px-4">
                        <div className="text-center mb-20">
                            <h2 className="text-3xl font-black uppercase tracking-tighter text-slate-900 mb-4">Beneficios de Élite</h2>
                            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.3em]">Todo lo necesario para escalar</p>
                        </div>

                        <div className="grid md:grid-cols-3 gap-12">
                            {mainFeatures.map((f, i) => (
                                <div key={i} className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100 hover:border-amber-200 transition-all hover:-translate-y-2">
                                    <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm border border-slate-100">
                                        {f.icon}
                                    </div>
                                    <h4 className="text-lg font-black uppercase tracking-tighter text-slate-900 mb-2">{f.title}</h4>
                                    <p className="text-sm text-slate-500 font-medium leading-relaxed">{f.description}</p>
                                </div>
                            ))}
                        </div>
                    </div>
                </section>

                {/* Comparative Section */}
                <section className="py-24 bg-slate-50">
                    <div className="max-w-4xl mx-auto px-4">
                        <div className="bg-white p-10 md:p-16 rounded-[4rem] border border-slate-200 shadow-xl">
                            <h2 className="text-4xl font-black uppercase tracking-tighter text-slate-900 mb-12 text-center">Plan Gratis vs <span className="text-amber-500">PRO</span></h2>

                            <div className="space-y-8">
                                <div className="grid grid-cols-3 gap-4 border-b border-slate-100 pb-4">
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Característica</div>
                                    <div className="text-[10px] font-black uppercase text-slate-400 tracking-widest text-center">Gratis</div>
                                    <div className="text-[10px] font-black uppercase text-amber-500 tracking-widest text-center">PRO</div>
                                </div>

                                {[
                                    { name: "Comisión Tianguis", free: "15%", pro: "0%" },
                                    { name: "Límite de Beats", free: "5", pro: "Ilimitados" },
                                    { name: "Formatos", free: "MP3", pro: "MP3 + WAV" },
                                    { name: "Soporte", free: "Básico", pro: "Especializado" },
                                    { name: "Estadísticas", free: "Simples", pro: "Avanzadas" }
                                ].map((row, i) => (
                                    <div key={i} className="grid grid-cols-3 gap-4 items-center">
                                        <div className="text-xs font-bold text-slate-700">{row.name}</div>
                                        <div className="text-xs font-medium text-slate-400 text-center">{row.free}</div>
                                        <div className="text-xs font-black text-slate-900 text-center bg-amber-50 rounded-lg py-1 border border-amber-100">{row.pro}</div>
                                    </div>
                                ))}
                            </div>

                            <div className="mt-16 bg-slate-900 text-white p-8 rounded-3xl flex flex-col md:flex-row items-center justify-between gap-6">
                                <div>
                                    <h4 className="text-xl font-black uppercase tracking-tighter mb-1">¿Listo para la independencia?</h4>
                                    <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Impulsa tu tienda hoy mismo</p>
                                </div>
                                <Link href="/pricing" className="px-8 py-4 bg-amber-500 text-slate-900 rounded-xl font-black uppercase tracking-widest text-[10px] hover:bg-amber-400 transition-all">
                                    Empezar con PRO
                                </Link>
                            </div>
                        </div>
                    </div>
                </section>
            </main>

            <Footer />
        </div>
    );
}
