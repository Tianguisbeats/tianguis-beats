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
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-24">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-6xl mx-auto px-4 text-center mt-12">
                    {/* Header Section */}
                    <div className="mb-12">
                        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase mb-2 text-slate-900 leading-none">
                            Elige tu <span className="text-blue-600">Plan</span>
                        </h1>
                        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-8">
                            Transforma tu pasión en un negocio
                        </p>

                        {/* Toggle */}
                        <div className="inline-flex items-center bg-slate-100 p-1 rounded-full border border-slate-200">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                            >
                                Anual <span className="ml-1 opacity-80">-25% OFF</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto px-4">
                        {plans.map((plan, idx) => {
                            const isCurrentPlan = userTier === plan.tier;
                            const isPremium = plan.tier === 'premium';
                            const isPro = plan.tier === 'pro';

                            return (
                                <div
                                    key={idx}
                                    className={`relative p-8 rounded-[2.5rem] border-2 transition-all duration-500 hover:scale-[1.02] flex flex-col ${isPremium
                                            ? 'border-blue-600 bg-blue-50/10 shadow-2xl shadow-blue-500/10'
                                            : isPro
                                                ? 'border-slate-300 bg-slate-50/50 shadow-2xl shadow-slate-900/5'
                                                : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30">
                                            Recomendado
                                        </div>
                                    )}

                                    <div className="mb-8 text-center">
                                        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-6 shadow-sm ${isPremium ? 'bg-blue-100/50 text-blue-600' : isPro ? 'bg-slate-200 text-slate-700' : 'bg-slate-50 text-slate-400'
                                            }`}>
                                            {plan.icon}
                                        </div>
                                        <h3 className="text-2xl font-black text-slate-900 uppercase tracking-tighter mb-1">{plan.name}</h3>
                                        <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest">{plan.description}</p>
                                    </div>

                                    <div className="mb-10 text-center flex items-end justify-center gap-1">
                                        <span className="text-4xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
                                        <div className="text-left mb-1">
                                            <span className="block text-[10px] font-black text-slate-400 uppercase leading-none">MXN</span>
                                            <span className="block text-[10px] font-bold text-slate-400 leading-none">/Mes</span>
                                        </div>
                                    </div>

                                    <ul className="space-y-4 mb-10 text-left flex-1">
                                        {plan.features.map((feature, fIdx) => (
                                            <li key={fIdx} className="flex items-center gap-3 text-xs text-slate-600 font-bold">
                                                <div className={`p-0.5 rounded-full ${isPremium ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                                                    <Check size={12} strokeWidth={4} />
                                                </div>
                                                <span className="tracking-tight">{feature}</span>
                                            </li>
                                        ))}
                                    </ul>

                                    <button
                                        disabled={isCurrentPlan}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 ${isCurrentPlan
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : isPremium
                                                    ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-xl shadow-blue-600/20'
                                                    : isPro
                                                        ? 'bg-white border-2 border-slate-900 text-slate-900 hover:bg-slate-900 hover:text-white shadow-xl shadow-slate-900/5'
                                                        : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                            }`}
                                    >
                                        {isCurrentPlan ? "Plan Actual" : plan.buttonText}
                                    </button>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-slate-900 text-sm font-black uppercase tracking-[0.3em] mb-4">Cancela cuando quieras</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest">Sin contratos forzosos • Garantía de satisfacción • Soporte 24/7</p>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
