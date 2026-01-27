"use client";

import React, { useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck } from 'lucide-react';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');

    const plans = [
        {
            name: "Gratis",
            price: billingCycle === 'monthly' ? "0" : "0",
            description: "Para productores que están empezando.",
            features: [
                "Hasta 5 Beats",
                "Solo archivos MP3",
                "15% comisión por venta",
                "Estadísticas básicas",
                "Soporte por email"
            ],
            icon: <Zap className="text-slate-400" size={24} />,
            buttonText: "Empezar Gratis",
            popular: false
        },
        {
            name: "PRO",
            price: billingCycle === 'monthly' ? "149" : "1,490",
            savings: billingCycle === 'yearly' ? "¡2 meses gratis!" : null,
            description: "Para productores serios en crecimiento.",
            features: [
                "Subidas ilimitadas",
                "Archivos MP3 y WAV",
                "0% comisión (Tú ganas todo)",
                "Panel de ventas avanzado",
                "Soporte prioritario"
            ],
            icon: <Star className="text-blue-600" size={24} />,
            buttonText: "Elegir PRO",
            popular: true
        },
        {
            name: "PREMIUM",
            price: billingCycle === 'monthly' ? "349" : "3,490",
            savings: billingCycle === 'yearly' ? "¡2 meses gratis!" : null,
            description: "La máxima potencia para tu carrera.",
            features: [
                "Todo lo del plan PRO",
                "Archivos Stems (Separados)",
                "Boost en el Algoritmo",
                "Insignia de Founder",
                "Estadísticas en tiempo real"
            ],
            icon: <ShieldCheck className="text-indigo-600" size={24} />,
            buttonText: "Elegir PREMIUM",
            popular: false
        }
    ];

    return (
        <main className="min-h-screen bg-white">
            <Navbar />

            <section className="pt-32 pb-20 px-4">
                <div className="max-w-7xl mx-auto text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-slate-900 tracking-tighter uppercase mb-6">
                        Elige tu <span className="text-blue-600">Plan</span>
                    </h1>
                    <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-12">
                        Escala tu carrera como productor con las herramientas más potentes del mercado.
                    </p>

                    {/* Toggle */}
                    <div className="flex items-center justify-center gap-4 mb-16">
                        <span className={`text-sm font-black uppercase tracking-widest ${billingCycle === 'monthly' ? 'text-slate-900' : 'text-slate-400'}`}>Mensual</span>
                        <button
                            onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
                            className="w-16 h-8 bg-slate-100 rounded-full p-1 relative transition-colors"
                        >
                            <div className={`w-6 h-6 bg-blue-600 rounded-full shadow-lg transform transition-transform ${billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'}`}></div>
                        </button>
                        <span className={`text-sm font-black uppercase tracking-widest ${billingCycle === 'yearly' ? 'text-slate-900' : 'text-slate-400'}`}>
                            Anual <span className="text-green-500 text-[10px] ml-1">2 Meses Gratis</span>
                        </span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan, idx) => (
                            <div
                                key={idx}
                                className={`relative p-8 rounded-3xl border-2 transition-all hover:scale-105 duration-300 ${plan.popular ? 'border-blue-600 shadow-2xl shadow-blue-600/10' : 'border-slate-100 hover:border-slate-200'}`}
                            >
                                {plan.popular && (
                                    <span className="absolute -top-4 left-1/2 -translate-x-1/2 bg-blue-600 text-white px-4 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">
                                        Más Popular
                                    </span>
                                )}

                                <div className="mb-8">
                                    <div className="mb-4">{plan.icon}</div>
                                    <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tight">{plan.name}</h3>
                                    <p className="text-slate-400 text-sm font-medium mt-2">{plan.description}</p>
                                </div>

                                <div className="mb-8">
                                    <div className="flex items-baseline justify-center gap-1">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
                                        <span className="text-slate-400 font-bold uppercase text-[10px] tracking-widest">MXN / {billingCycle === 'monthly' ? 'mes' : 'año'}</span>
                                    </div>
                                    {plan.savings && (
                                        <p className="text-green-500 text-[10px] font-black uppercase tracking-widest mt-2">{plan.savings}</p>
                                    )}
                                </div>

                                <ul className="space-y-4 mb-8 text-left">
                                    {plan.features.map((feature, fIdx) => (
                                        <li key={fIdx} className="flex items-center gap-3 text-sm text-slate-600 font-medium">
                                            <div className="bg-blue-600/10 p-1 rounded-full">
                                                <Check size={12} className="text-blue-600" />
                                            </div>
                                            {feature}
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full py-4 rounded-2xl font-black text-[12px] uppercase tracking-[0.2em] transition-all ${plan.popular ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-xl shadow-blue-600/20' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'}`}
                                >
                                    {plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            <Footer />
        </main>
    );
}
