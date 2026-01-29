"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck, ArrowUpRight, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [userTier, setUserTier] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('subscription_tier').eq('id', session.user.id).single();
                if (data) setUserTier(data.subscription_tier);
            }
        };
        fetchUser();
    }, []);

    const plans = [
        {
            name: "Gratis",
            tier: "free",
            price: "0",
            description: "Para empezar.",
            features: [
                "5 Beats públicos",
                "Solo MP3",
                "15% comisión",
                "Estadísticas básicas"
            ],
            icon: <Zap className="text-slate-400" size={24} />,
            buttonText: "Empezar Gratis",
            color: "slate",
            popular: false
        },
        {
            name: "PRO",
            tier: "pro",
            price: billingCycle === 'monthly' ? "149" : "111", // 1340 / 12 approx
            yearlyPrice: "1,340",
            description: "Para productores serios.",
            features: [
                "Subidas ilimitadas",
                "MP3 y WAV",
                "0% comisión",
                "Soporte prioritario"
            ],
            icon: <Star className="text-slate-500" size={24} />,
            buttonText: "Mejorar a PRO",
            color: "gray",
            popular: true
        },
        {
            name: "PREMIUM",
            tier: "premium",
            price: billingCycle === 'monthly' ? "349" : "261", // 3140 / 12 approx
            yearlyPrice: "3,140",
            description: "Máxima potencia.",
            features: [
                "Todo lo de PRO +",
                "Stems (.ZIP)",
                "Ventas Exclusivas",
                "Boost Semanal",
                "Mapa de Calor"
            ],
            icon: <ShieldCheck className="text-blue-600" size={24} />,
            buttonText: "Ser Premium",
            color: "blue",
            popular: false
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-6xl mx-auto px-4 text-center mt-12">
                    {/* Header Section */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-4 text-slate-900">
                            Elige tu <span className="text-blue-600">Plan</span>
                        </h1>
                        <p className="text-base text-slate-500 font-medium max-w-xl mx-auto mb-8">
                            Transforma tu pasión en un negocio. Elige las herramientas que necesitas para crecer tu carrera.
                        </p>

                        {/* Toggle */}
                        <div className="inline-flex items-center bg-slate-100 p-1.5 rounded-full">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Anual <span className="ml-1 opacity-80">-25%</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 items-center max-w-5xl mx-auto">
                        {plans.map((plan, idx) => {
                            const isCurrentPlan = userTier === plan.tier;
                            return (
                                <div
                                    key={idx}
                                    className={`relative p-8 rounded-3xl border transition-all ${plan.color === 'blue' ? 'border-blue-200 bg-blue-50/10 shadow-xl shadow-blue-900/5 ring-1 ring-blue-100 scale-105 z-10' :
                                            'border-slate-200 bg-white hover:border-slate-300'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-slate-900 text-white px-4 py-1 rounded-full text-[9px] font-black uppercase tracking-widest">
                                            Más Popular
                                        </div>
                                    )}

                                    <div className="mb-6 text-center">
                                        <div className="mx-auto w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-slate-50">
                                            {plan.icon}
                                        </div>
                                        <h3 className="text-xl font-black text-slate-900 uppercase tracking-tighter mb-2">{plan.name}</h3>
                                        <p className="text-slate-400 text-xs font-medium">{plan.description}</p>
                                    </div>

                                    <div className="mb-8 text-center flex items-center justify-center gap-1">
                                        <span className="text-3xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
                                        <div className="text-left">
                                            <span className="block text-[8px] font-black text-slate-400 uppercase">MXN</span>
                                            <span className="block text-[8px] font-bold text-slate-400">/Mes</span>
                                        </div>
                                        {billingCycle === 'yearly' && plan.tier !== 'free' && (
                                            <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-700 text-[9px] font-bold rounded-md">
                                                ${plan.yearlyPrice} año
                                            </span>
                                        )}
                                    </div>

                                    <ul className="space-y-4 mb-8 text-left">
                                        {plan.features.map((feature, fIdx) => (
                                            <li key={fIdx} className="flex items-start gap-3 text-xs text-slate-600 font-bold">
                                                <Check size={14} className={`shrink-0 ${plan.color === 'blue' ? 'text-blue-600' : 'text-slate-400'}`} />
                                                <span>{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        disabled={isCurrentPlan}
                                        className={`w-full py-3 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all ${isCurrentPlan ? 'bg-slate-100 text-slate-400 cursor-not-allowed' :
                                                plan.color === 'blue' ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-600/20' :
                                                    'bg-slate-900 text-white hover:bg-slate-800'
                                            }`}
                                    >
                                        {isCurrentPlan ? "Tu plan actual" : plan.buttonText}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-16 text-center">
                        <p className="text-slate-400 text-xs font-medium">Cancela cuando quieras • Sin contratos forzosos • Garantía de satisfacción</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
