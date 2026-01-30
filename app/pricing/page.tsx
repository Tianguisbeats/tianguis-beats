"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck, ArrowUpRight, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [userTier, setUserTier] = useState<string | null>(null);
    const [subscriptionEndDate, setSubscriptionEndDate] = useState<string | null>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                const { data } = await supabase.from('profiles').select('subscription_tier, subscription_end_date').eq('id', session.user.id).single();
                if (data) {
                    setUserTier(data.subscription_tier);
                    setSubscriptionEndDate(data.subscription_end_date);
                }
            }
        };
        fetchUser();
    }, []);

    const plans = [
        {
            name: "Gratis",
            tier: "free",
            price: "0",
            description: "Para empezar tu legado.",
            features: [
                "5 Beats públicos",
                "Solo licencia MP3",
                "15% comisión por venta",
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
            price: billingCycle === 'monthly' ? "149" : "111",
            yearlyPrice: "1,340",
            description: "Para productores serios.",
            features: [
                "Subidas ilimitadas",
                "MP3 y WAV (Alta Calidad)",
                "0% comisión",
                "Soporte prioritario 24/7"
            ],
            icon: <Star className="text-slate-500" size={24} />,
            buttonText: "Mejorar a PRO",
            color: "gray",
            popular: true,
            label: "Más Popular"
        },
        {
            name: "PREMIUM",
            tier: "premium",
            price: billingCycle === 'monthly' ? "349" : "261",
            yearlyPrice: "3,140",
            description: "Máxima potencia comercial.",
            features: [
                "Todo lo que incluye el plan Pro",
                "Licencia de Stems (Pistas)",
                "Mayor exposición del algoritmo",
                "Venta Exclusiva Habilitada",
                "Soporte prioritario 24/7"
            ],
            icon: <ShieldCheck className="text-blue-600" size={24} />,
            buttonText: "Ser Premium",
            color: "blue",
            popular: true
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col pt-24">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-6xl mx-auto px-4 text-center mt-8">
                    {/* Header Section */}
                    <div className="mb-10">
                        <h1 className="text-5xl md:text-6xl font-black tracking-tighter uppercase mb-2 text-slate-900 leading-none">
                            Elige tu <span className="text-blue-600">Plan</span>
                        </h1>
                        <p className="text-[11px] text-slate-400 font-bold uppercase tracking-[0.3em] mb-10">
                            Transforma tu pasión en un negocio rentable
                        </p>

                        {/* Founder Invitation Relocated */}
                        <div className="mb-12 inline-flex">
                            <div className="bg-yellow-400/10 border-2 border-yellow-400 text-yellow-700 px-6 py-3 rounded-2xl flex items-center gap-3 animate-pulse">
                                <Star size={16} fill="currentColor" />
                                <span className="text-[10px] font-black uppercase tracking-widest">
                                    Sé de los primeros 100 y obtén estatus <span className="underline">Founder</span> para siempre
                                </span>
                            </div>
                        </div>

                        {/* Toggle Container */}
                        <div className="flex flex-col items-center gap-4">
                            <div className="inline-flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-slate-900 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Mensual
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`px-10 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/20' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    Anual
                                </button>
                            </div>
                            <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest animate-bounce">
                                ¡25% OFF! (Recibe 3 meses gratis al año) 🎁
                            </p>
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
                                            ? 'border-amber-400 bg-amber-50/30 shadow-2xl shadow-amber-400/10'
                                            : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    {plan.popular && (
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-600 text-white px-5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl shadow-blue-600/30">
                                            {plan.label}
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
                                        onClick={() => {
                                            if (userTier === 'premium' && plan.tier !== 'premium') {
                                                alert(`Has solicitado bajar al plan ${plan.name}. Tus beneficios Premium se mantendrán hasta el final del periodo.`);
                                            } else if (userTier === 'pro' && plan.tier === 'free') {
                                                alert(`Has solicitado bajar al plan Gratis. Tus beneficios Pro se mantendrán hasta el final del periodo.`);
                                            } else {
                                                // Logic for upgrade would go here
                                            }
                                        }}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 mb-3 ${isCurrentPlan
                                            ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                            : (userTier === 'premium' && plan.tier !== 'premium') || (userTier === 'pro' && plan.tier === 'free')
                                                ? 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900' /* Downgrade Style */
                                                : isPremium
                                                    ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-xl shadow-blue-600/20'
                                                    : 'bg-slate-900 text-white hover:bg-blue-600 shadow-xl shadow-slate-900/10'
                                            }`}
                                    >
                                        {isCurrentPlan
                                            ? "Tu Plan Actual"
                                            : (userTier === 'premium' && plan.tier === 'pro') ? "Bajar a Pro"
                                                : (userTier === 'premium' && plan.tier === 'free') ? "Bajar a Gratis"
                                                    : (userTier === 'pro' && plan.tier === 'free') ? "Bajar a Gratis"
                                                        : plan.buttonText}
                                    </button>

                                    {/* Subscription End Date Message for Downgrades or Current Plan */}
                                    {subscriptionEndDate && (isCurrentPlan || (userTier === 'premium' && plan.tier !== 'premium') || (userTier === 'pro' && plan.tier === 'free')) && userTier !== 'free' && (
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4">
                                            Vence el: {new Date(subscriptionEndDate).toLocaleDateString()}
                                        </div>
                                    )}

                                    <button className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors py-2 flex items-center justify-center gap-1 group/link">
                                        Más sobre el plan
                                        <ArrowUpRight size={10} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
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
            </main >

            <Footer />
        </div >
    );
}
