"use client";

import React from 'react';
import { Check, Zap, Flame, Crown } from 'lucide-react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function PricingPage() {
    const plans = [
        {
            name: "Gratis",
            price: "$0",
            description: "Para productores que van empezando.",
            icon: <Zap className="text-blue-600" size={32} />,
            features: [
                "Sube hasta 10 Beats",
                "Licencias estándar",
                "Perfil básico de productor",
                "Estadísticas básicas",
                "Trato directo con artistas",
            ],
            buttonText: "Empezar Gratis",
            highlight: false,
        },
        {
            name: "Pro",
            price: "$199",
            period: "/mes",
            description: "Lleva tu carrera al siguiente nivel.",
            icon: <Flame className="text-orange-600" size={32} />,
            features: [
                "Sube hasta 50 Beats",
                "Licencias personalizadas",
                "Perfil verificado",
                "Estadísticas avanzadas",
                "Soporte prioritario",
                "Insignia 'Pro' en el catálogo",
            ],
            buttonText: "Subir a Pro",
            highlight: true,
        },
        {
            name: "Premium",
            price: "$399",
            period: "/mes",
            description: "El control total de tu estudio.",
            icon: <Crown className="text-purple-600" size={32} />,
            features: [
                "Beats ilimitados",
                "Cero comisiones",
                "Marketing destacado",
                "Contratos legales incluidos",
                "Insignia 'Fidelidad' (Primeros 100)",
                "Acceso exclusivo a eventos",
            ],
            buttonText: "Hazte Premium",
            highlight: false,
        },
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col">
            <Navbar />

            <main className="flex-1 pt-32 pb-20">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-3xl mx-auto mb-20">
                        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-[10px] font-black uppercase tracking-[0.3em] mb-6">
                            <span className="w-2 h-2 rounded-full bg-blue-600"></span>
                            Planes y Precios
                        </div>
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase leading-[0.9] mb-6">
                            Escoge tu plan y <span className="text-blue-600">empieza a ganar.</span>
                        </h1>
                        <p className="text-slate-500 text-xl font-medium">
                            Precios adaptados a la economía mexa para que nadie se quede fuera de la escena.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8">
                        {plans.map((plan) => (
                            <div
                                key={plan.name}
                                className={`relative p-10 rounded-[3rem] border-2 transition-all flex flex-col h-full ${plan.highlight
                                        ? 'border-blue-600 bg-white shadow-2xl shadow-blue-600/10 scale-105 z-10'
                                        : 'border-slate-100 bg-slate-50 hover:border-slate-200'
                                    }`}
                            >
                                {plan.highlight && (
                                    <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-black uppercase tracking-widest px-6 py-2 rounded-full shadow-lg">
                                        Más Popular
                                    </div>
                                )}

                                <div className="mb-8">
                                    <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center shadow-sm mb-6">
                                        {plan.icon}
                                    </div>
                                    <h3 className="text-2xl font-black uppercase tracking-tight mb-2">{plan.name}</h3>
                                    <div className="flex items-baseline gap-1">
                                        <span className="text-5xl font-black tracking-tighter">{plan.price}</span>
                                        <span className="text-slate-400 font-black text-sm uppercase tracking-widest">{plan.period}</span>
                                    </div>
                                    <p className="mt-4 text-slate-500 font-medium text-sm leading-relaxed">
                                        {plan.description}
                                    </p>
                                </div>

                                <ul className="space-y-4 mb-10 flex-1">
                                    {plan.features.map((feature) => (
                                        <li key={feature} className="flex items-start gap-3">
                                            <div className="mt-1 w-5 h-5 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
                                                <Check size={12} className="text-blue-600" />
                                            </div>
                                            <span className="text-[13px] font-bold text-slate-600">{feature}</span>
                                        </li>
                                    ))}
                                </ul>

                                <button
                                    className={`w-full py-5 rounded-2xl font-black uppercase tracking-widest text-[11px] transition-all transform active:scale-95 ${plan.highlight
                                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-xl shadow-blue-600/30'
                                            : 'bg-white border-2 border-slate-200 text-slate-900 hover:border-blue-600 hover:text-blue-600'
                                        }`}
                                >
                                    {plan.buttonText}
                                </button>
                            </div>
                        ))}
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">
                            ¿Tienes un sello discográfico? <a href="#" className="text-blue-600 hover:underline">Contáctanos para planes enterprise</a>
                        </p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
