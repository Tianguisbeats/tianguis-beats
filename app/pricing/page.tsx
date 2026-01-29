"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck, Crown, Info } from 'lucide-react';
import Link from 'next/link';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            name: "Gratis",
            price: "0",
            description: "Para productores que están empezando.",
            features: [
                "Hasta 5 Beats",
                "Solo archivos MP3",
                "15% comisión por venta",
                "Estadísticas básicas",
                "Soporte por email"
            ],
            icon: <Zap className="text-slate-400" size={32} />,
            buttonText: "Empezar Gratis",
            color: "slate",
            popular: false
        },
        {
            name: "PRO",
            price: billingCycle === 'monthly' ? "149" : "119",
            description: "Para productores serios en crecimiento.",
            features: [
                "Subidas ilimitadas",
                "Archivos MP3 y WAV",
                "0% comisión (Tú ganas todo)",
                "Panel de ventas avanzado",
                "Soporte prioritario"
            ],
            icon: <Star className="text-slate-500" size={32} />,
            buttonText: "Elegir PRO",
            color: "gray",
            popular: false
        },
        {
            name: "PREMIUM",
            price: billingCycle === 'monthly' ? "349" : "279",
            description: "La máxima potencia para tu carrera.",
            features: [
                "Todo lo del plan PRO",
                "Archivos Stems (Separados)",
                "Boost en el Algoritmo",
                "Insignia de Founder Especial",
                "Control total de licencias"
            ],
            icon: <ShieldCheck className="text-blue-600" size={32} />,
            buttonText: "Elegir PREMIUM",
            color: "blue",
            popular: true
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 text-center">
                    {/* Founder Badge Banner */}
                    <div className="inline-flex items-center gap-3 bg-yellow-50 border border-yellow-100 p-4 rounded-3xl mb-12 animate-bounce shadow-sm">
                        <div className="w-10 h-10 bg-yellow-400 rounded-2xl flex items-center justify-center text-white shadow-lg shadow-yellow-400/20">
                            <Crown size={20} />
                        </div>
                        <div className="text-left">
                            <p className="text-[10px] font-black uppercase tracking-widest text-yellow-700">Oportunidad Única</p>
                            <p className="text-xs font-bold text-yellow-800">¡Los primeros 100 usuarios recibirán la <span className="underline decoration-2">Insignia Amarilla de Founder</span> para siempre!</p>
                        </div>
                    </div>

                    <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-6">
                        Elige tu <span className="text-blue-600 italic">Estrategia</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-16">
                        Impulsa tu carrera musical con planes diseñados para cada etapa de tu crecimiento.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-6 mb-20 bg-slate-50 w-fit mx-auto p-2 rounded-3xl border border-slate-100">
                        <button
                            onClick={() => setBillingCycle('monthly')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                        >
                            Mensual
                        </button>
                        <button
                            onClick={() => setBillingCycle('yearly')}
                            className={`px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-white shadow-md text-blue-600' : 'text-slate-400'}`}
                        >
                            Anual (-20%)
                        </button>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, idx) => (
                            <div
                                key={idx}
                                className={`relative p-10 rounded-[3rem] border-4 transition-all duration-500 group overflow-hidden ${plan.color === 'blue' ? 'border-blue-600/10 hover:border-blue-600 shadow-2xl shadow-blue-600/5' :
                                        plan.color === 'gray' ? 'border-slate-100 hover:border-slate-400' : 'border-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                {plan.popular && (
                                    <div className="absolute top-6 right-6 bg-blue-600 text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/20 z-10">
                                        Más Popular
                                    </div>
                                )}

                                <div className="mb-10 text-left relative z-10">
                                    <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-6 transition-all group-hover:scale-110 ${plan.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                            plan.color === 'gray' ? 'bg-slate-100 text-slate-500' : 'bg-slate-50 text-slate-400'
                                        }`}>
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-3">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm font-medium leading-relaxed">{plan.description}</p>
                                </div>

                                <div className="mb-10 text-left relative z-10">
                                    <div className="flex items-baseline gap-2">
                                        <span className="text-5xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
                                        <div className="flex flex-col">
                                            <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">MXN</span>
                                            <span className="text-slate-400 font-bold text-[10px] tracking-widest">/ Mes</span>
                                        </div>
                                    </div>
                                    {billingCycle === 'yearly' && (
                                        <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest mt-2 bg-blue-50 w-fit px-3 py-1 rounded-lg animate-pulse">
                                            Ahorra un 20% anual
                                        </p>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-12 text-left relative z-10">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-start gap-4 text-sm text-slate-600 font-medium group/feat">
                                            <div className={`mt-0.5 p-1 rounded-full transition-colors ${plan.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-400 group-hover/feat:bg-slate-900 group-hover/feat:text-white'}`}>
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <Link
                                    href="/signup"
                                    className={`relative z-10 w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 transform active:scale-95 ${plan.color === 'blue' ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-2xl shadow-blue-600/30' :
                                            plan.color === 'gray' ? 'bg-slate-900 text-white hover:bg-blue-600' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                        }`}
                                >
                                    {plan.buttonText}
                                </Link>

                                {/* Aesthetic BG Element */}
                                <div className={`absolute -bottom-12 -right-12 w-48 h-48 rounded-full blur-3xl opacity-0 group-hover:opacity-20 transition-opacity pointer-events-none ${plan.color === 'blue' ? 'bg-blue-600' : 'bg-slate-400'
                                    }`}></div>
                            </div>
                        ))}
                    </div>

                    {/* Security Legend */}
                    <div className="mt-20 flex flex-wrap justify-center gap-12 items-center opacity-40 grayscale">
                        <div className="flex items-center gap-3">
                            <ShieldCheck size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Pago 100% Seguro</span>
                        </div>
                        <div className="flex items-center gap-3">
                            <Info size={24} />
                            <span className="text-xs font-black uppercase tracking-widest">Cancela cuando quieras</span>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
