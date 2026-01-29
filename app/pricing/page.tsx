"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck, Crown, Info, ArrowUpRight, Lock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { SubscriptionTier } from '@/lib/types';

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
            description: "Empieza tu camino en la industria.",
            features: [
                "Hasta 5 Beats públicos",
                "Solo archivos MP3",
                "15% comisión por venta",
                "Estadísticas básicas",
                "Licencia Estándar"
            ],
            icon: <Zap className="text-slate-400" size={32} />,
            buttonText: "Empezar Gratis",
            color: "slate",
            popular: false,
            badge: null
        },
        {
            name: "PRO",
            tier: "pro",
            price: billingCycle === 'monthly' ? "149" : "111", // 1340 / 12 approx 111.6
            yearlyPrice: "1,340",
            description: "Para productores serios en crecimiento.",
            features: [
                "Subidas ilimitadas",
                "Archivos MP3 y WAV",
                "0% comisión (Tú ganas todo)",
                "Posición estándar en catálogo",
                "Soporte prioritario"
            ],
            icon: <Star className="text-slate-500" size={32} />,
            buttonText: "Elegir PRO",
            color: "gray",
            popular: true,
            badge: "Económico"
        },
        {
            name: "PREMIUM",
            tier: "premium",
            price: billingCycle === 'monthly' ? "349" : "261", // 3140 / 12 approx 261.6
            yearlyPrice: "3,140",
            description: "La máxima potencia para tu carrera.",
            features: [
                "Archivos MP3, WAV y Stems",
                "Ventas Exclusivas ilimitadas",
                "Algoritmo Boost: Top Explorar",
                "Estadísticas: Mapa de Calor",
                "Insignia de Founder"
            ],
            icon: <ShieldCheck className="text-blue-600" size={32} />,
            buttonText: "Elegir PREMIUM",
            color: "blue",
            popular: false,
            badge: "Full-time Producer"
        }
    ];

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans flex flex-col pt-20">
            <Navbar />

            <main className="flex-1 pb-20">
                <div className="max-w-7xl mx-auto px-4 text-center mt-16">
                    {/* Header Section */}
                    <div className="mb-16">
                        <div className="inline-flex items-center gap-3 bg-blue-50 border border-blue-100 p-2 rounded-2xl mb-8">
                            <span className="bg-blue-600 text-white px-3 py-1 rounded-xl text-[10px] font-black uppercase tracking-widest">Ahorra 25%</span>
                            <span className="text-blue-600 text-[10px] font-bold uppercase tracking-widest pr-2">¡3 Meses Gratis en planes anuales!</span>
                        </div>

                        <h1 className="text-5xl md:text-8xl font-black tracking-tighter uppercase mb-6 leading-none">
                            Toma el <span className="text-blue-600 italic">Control</span>
                        </h1>
                        <p className="text-lg text-slate-500 font-medium max-w-2xl mx-auto mb-12">
                            Transforma tu pasión en un negocio rentable con los planes diseñados para productores profesionales.
                        </p>

                        {/* Toggle */}
                        <div className="flex items-center justify-center gap-4 bg-slate-900 w-fit mx-auto p-2 rounded-[2.5rem] shadow-2xl">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-white text-slate-900 shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-10 py-5 rounded-[2rem] text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-2 ${billingCycle === 'yearly' ? 'bg-blue-600 text-white shadow-xl scale-105' : 'text-slate-400 hover:text-white'}`}
                            >
                                Anual <span className="opacity-60">-25% OFF</span>
                            </button>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan, idx) => {
                            const isCurrentPlan = userTier === plan.tier;
                            return (
                                <div
                                    key={idx}
                                    className={`relative p-10 rounded-[4rem] border-4 transition-all duration-700 group flex flex-col ${plan.color === 'blue' ? 'border-blue-600 bg-white shadow-[0_40px_100px_-20px_rgba(37,99,235,0.15)] ring-8 ring-blue-50' :
                                            plan.color === 'gray' ? 'border-slate-300 hover:border-slate-800 hover:bg-slate-50' : 'border-slate-100 bg-white'
                                        }`}
                                >
                                    {plan.badge && (
                                        <div className={`absolute -top-5 left-1/2 -translate-x-1/2 px-6 py-2 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] shadow-xl whitespace-nowrap ${plan.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'
                                            }`}>
                                            {plan.badge}
                                        </div>
                                    )}

                                    <div className="mb-12 text-left">
                                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-8 transition-transform group-hover:scale-110 group-hover:rotate-3 ${plan.color === 'blue' ? 'bg-blue-50 text-blue-600' :
                                                plan.color === 'gray' ? 'bg-slate-100 text-slate-600' : 'bg-slate-50 text-slate-400'
                                            }`}>
                                            {plan.icon}
                                        </div>
                                        <h3 className="text-4xl font-black text-slate-900 uppercase tracking-tighter leading-none mb-4">{plan.name}</h3>
                                        <p className="text-slate-400 text-sm font-medium leading-relaxed">{plan.description}</p>
                                    </div>

                                    <div className="mb-12 text-left">
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-6xl font-black text-slate-900 tracking-tighter">${plan.price}</span>
                                            <div className="flex flex-col">
                                                <span className="text-slate-400 font-black uppercase text-[10px] tracking-widest">MXN</span>
                                                <span className="text-slate-400 font-bold text-[10px] tracking-widest">/ Mes</span>
                                            </div>
                                        </div>
                                        {billingCycle === 'yearly' && plan.tier !== 'free' && (
                                            <div className="mt-3 flex items-center gap-2">
                                                <p className="text-blue-600 text-[10px] font-black uppercase tracking-widest bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-100">
                                                    ${plan.yearlyPrice} al año
                                                </p>
                                                <span className="text-slate-400 text-[9px] font-bold uppercase underline decoration-blue-200">Total</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="flex-1">
                                        <div className="h-px bg-slate-100 w-full mb-8" />
                                        <ul className="space-y-6 mb-12 text-left">
                                            {plan.features.map((feature, fIdx) => (
                                                <li key={fIdx} className="flex items-start gap-4 text-sm text-slate-600 font-bold group/item">
                                                    <div className={`mt-0.5 p-1 rounded-full flex-shrink-0 transition-colors ${plan.color === 'blue' ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-400 group-hover/item:bg-slate-900 group-hover/item:text-white'}`}>
                                                        <Check size={10} strokeWidth={4} />
                                                    </div>
                                                    <span>{feature}</span>
                                                </li>
                                            ))}
                                            {/* Extra feature for PRO that is lack in Free */}
                                            {plan.tier === 'pro' && (
                                                <li className="flex items-start gap-4 text-xs text-slate-300 font-black uppercase tracking-widest italic pt-2">
                                                    <Lock size={12} className="mt-0.5" /> No incluye ventas exclusivas
                                                </li>
                                            )}
                                        </ul>
                                    </div>

                                    <div className="mt-auto">
                                        <button
                                            disabled={isCurrentPlan}
                                            className={`w-full py-6 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.25em] transition-all flex items-center justify-center gap-2 transform group-hover:-translate-y-1 active:scale-95 shadow-2xl ${isCurrentPlan ? 'bg-slate-100 text-slate-400 border-2 border-slate-200 cursor-not-allowed' :
                                                    plan.color === 'blue' ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-blue-600/30' :
                                                        plan.color === 'gray' ? 'bg-slate-900 text-white hover:bg-blue-600 shadow-slate-900/30' : 'bg-slate-100 text-slate-900 hover:bg-slate-200'
                                                }`}
                                        >
                                            {isCurrentPlan ? "Tu plan actual" : plan.buttonText}
                                            {!isCurrentPlan && <ArrowUpRight size={16} />}
                                        </button>

                                        <button className="mt-6 text-[9px] font-black uppercase tracking-[0.3em] text-slate-400 hover:text-blue-600 transition-colors w-full flex items-center justify-center gap-2">
                                            Ver más sobre la licencia <ArrowUpRight size={10} />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* Marketing Footer */}
                    <div className="mt-32 grid md:grid-cols-2 gap-12 text-left">
                        <div className="bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100">
                            <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center mb-6 shadow-sm">
                                <ShieldCheck className="text-blue-600" size={28} />
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter mb-4">¿Por qué el Plan Premium?</h4>
                            <p className="text-slate-500 font-medium leading-relaxed">
                                Un productor profesional no solo vende licencias de uso; busca el gran golpe. Con el Plan Premium puedes vender **Licencias Exclusivas** de miles de pesos. Con una sola venta exclusiva al año, recuperas toda tu inversión.
                            </p>
                        </div>
                        <div className="bg-slate-900 p-12 rounded-[3.5rem] text-white">
                            <div className="w-14 h-14 bg-white/10 rounded-2xl flex items-center justify-center mb-6">
                                <ArrowUpRight className="text-blue-500" size={28} />
                            </div>
                            <h4 className="text-2xl font-black uppercase tracking-tighter mb-4 text-white">Domina el Algoritmo</h4>
                            <p className="text-slate-400 font-medium leading-relaxed">
                                Los usuarios Premium reciben un "Boost" semanal en el Explorar. Tus beats aparecerán en las posiciones más altas, aumentando tus Plays y probabilidades de venta hasta en un 300%.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
