"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck, ArrowUpRight, Lock, AlertTriangle, X, Crown } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [userTier, setUserTier] = useState<string | null>(null);

    // Nombres en español como solicitó el usuario
    const [terminaSuscripcion, setTerminaSuscripcion] = useState<string | null>(null);
    const [comenzarSuscripcion, setComenzarSuscripcion] = useState<string | null>(null);

    const { addItem } = useCart();
    const router = useRouter();

    // Modal State
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setSession(session);

            if (session?.user) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('subscription_tier, termina_suscripcion, comenzar_suscripcion')
                        .eq('id', session.user.id)
                        .single();

                    if (data && !error) {
                        setUserTier(data.subscription_tier);
                        setTerminaSuscripcion(data.termina_suscripcion);
                        setComenzarSuscripcion(data.comenzar_suscripcion);
                    }
                } catch (e) {
                    console.error("Error fetching subscription details:", e);
                }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const plans = [
        {
            name: "Gratis",
            tier: "free",
            price: 0,
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
            price: billingCycle === 'monthly' ? 149 : 111,
            yearlyPrice: 1340,
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
            price: billingCycle === 'monthly' ? 349 : 261,
            yearlyPrice: 3140,
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

    // Helpers para mensajes personalizados
    const getDowngradeWarning = (current: string, target: string) => {
        if (current === 'premium' && target === 'pro') {
            return [
                "Perderás la Mayor Exposición del algoritmo.",
                "Perderás la capacidad de vender Licencias de Stems.",
                "Perderás las opciones de Venta Exclusiva."
            ];
        }
        if (target === 'free') {
            return [
                "Tu plan actual permanecerá activo hasta el final de tu ciclo.",
                "Conservarás todos tus beneficios y días restantes.",
                "Al finalizar la fecha, tu cuenta pasará a Gratis automáticamente.",
                "Ya no se te realizará ningún cargo futuro (ni mensual ni anual)."
            ];
        }
        return ["Perderás los beneficios de tu plan actual."];
    };

    const getUpgradeBenefits = (target: string) => {
        if (target === 'premium') {
            return [
                "¡Activación Inmediata!",
                "Licencias de Stems y Venta Exclusiva.",
                "Impulso algorítmico para tus beats.",
                "Comisión del 0% mantenida."
            ];
        }
        if (target === 'pro') {
            return [
                "¡Activación Inmediata!",
                "0% de Comisión en tus ventas.",
                "Subidas Ilimitadas.",
                "Archivos WAV de alta calidad."
            ];
        }
        return [];
    };

    const handleSelectPlan = (plan: any) => {
        if (!session) {
            router.push('/signup');
            return;
        }

        const currentTier = (userTier || 'free').toLowerCase();

        // Prevent re-selecting current plan
        if (currentTier === plan.tier) return;

        const tierOrder = ['free', 'pro', 'premium'];
        const currentIdx = tierOrder.indexOf(currentTier);
        const targetIdx = tierOrder.indexOf(plan.tier);

        const isDowngrade = targetIdx < currentIdx;

        if (isDowngrade) {
            // DOWNGRADE LOGIC: Schedule for end of cycle
            setSelectedPlan({ ...plan, type: 'downgrade', messages: getDowngradeWarning(currentTier, plan.tier) });
            setShowDowngradeModal(true);
        } else {
            // UPGRADE LOGIC: Immediate
            setSelectedPlan({
                ...plan,
                type: 'upgrade',
                messages: getUpgradeBenefits(plan.tier),
                disclaimer: "Importante: Tu nuevo plan comienza hoy. Los días restantes de tu suscripción anterior se perderán y no son reembolsables."
            });
            setShowDowngradeModal(true);
        }
    };

    const confirmAction = async () => {
        if (!selectedPlan || !session) return;

        if (selectedPlan.type === 'downgrade') {
            try {
                const updates: any = {
                    comenzar_suscripcion: selectedPlan.tier,
                    ultima_actualizacion: new Date().toISOString()
                };

                const { error } = await supabase
                    .from('profiles')
                    .update(updates)
                    .eq('id', session.user.id);

                if (error) throw error;

                setShowDowngradeModal(false);
                setComenzarSuscripcion(selectedPlan.tier);
                alert(`Cambio programado. Tu plan cambiará a ${selectedPlan.name} al terminar tu ciclo actual.`);

            } catch (err) {
                console.error(err);
                alert("Hubo un error al programar el cambio.");
            }
        } else {
            // Upgrade Logic: Send to Cart
            addItem({
                id: `plan-${selectedPlan.tier}-${billingCycle}`,
                type: 'plan',
                name: `Plan ${selectedPlan.name} (${billingCycle === 'monthly' ? 'Mensual' : 'Anual'})`,
                price: selectedPlan.price,
                subtitle: selectedPlan.description,
                metadata: { tier: selectedPlan.tier, cycle: billingCycle }
            });
            window.location.href = '/cart';
        }
    };

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white flex flex-col pt-24">
            <Navbar />

            <main className="flex-1 pb-20 relative">
                {/* Unified Modal (Upgrade/Downgrade) */}
                {showDowngradeModal && selectedPlan && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm animate-in fade-in duration-200">
                        <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative">
                            <button
                                onClick={() => setShowDowngradeModal(false)}
                                className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 transition-colors"
                            >
                                <X size={20} className="text-slate-400" />
                            </button>

                            <div className="text-center mb-6">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 ${selectedPlan.type === 'downgrade' ? 'bg-amber-100 text-amber-500' : 'bg-blue-100 text-blue-600'}`}>
                                    {selectedPlan.type === 'downgrade' ? <AlertTriangle size={32} /> : <Zap size={32} />}
                                </div>
                                <h2 className="text-2xl font-black uppercase tracking-tighter text-slate-900 mb-2">
                                    {selectedPlan.type === 'downgrade' ?
                                        (selectedPlan.tier === 'free' ? "¿Cancelar Suscripción?" : `¿Bajar a Plan ${selectedPlan.name}?`)
                                        : `¡Mejorar a Plan ${selectedPlan.name}!`}
                                </h2>
                                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest leading-relaxed">
                                    {selectedPlan.type === 'downgrade'
                                        ? "Revisa los detalles del cambio."
                                        : "Excelente decisión. Esto es lo que obtendrás:"}
                                </p>
                            </div>

                            <div className="bg-slate-50 rounded-2xl p-6 border border-slate-100 mb-6 space-y-4">
                                {selectedPlan.type === 'downgrade' && (
                                    <>
                                        <div className="flex justify-between items-center text-xs">
                                            <span className="font-bold text-slate-500">Vence / Cambio efectivo:</span>
                                            <span className="font-black text-slate-900 bg-white px-3 py-1 rounded-lg border border-slate-200">
                                                {terminaSuscripcion ? new Date(terminaSuscripcion).toLocaleDateString() : "Final del ciclo"}
                                            </span>
                                        </div>
                                        <div className="h-px bg-slate-200 w-full"></div>
                                    </>
                                )}

                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                        {selectedPlan.type === 'downgrade' ? "Lo que debes saber:" : "Beneficios:"}
                                    </p>
                                    <ul className="space-y-2">
                                        {selectedPlan.messages?.map((msg: string, i: number) => (
                                            <li key={i} className="flex items-start gap-2 text-[11px] font-bold text-slate-600">
                                                <span className={`${selectedPlan.type === 'downgrade' ? 'text-amber-500' : 'text-blue-600'} mt-0.5`}>
                                                    {selectedPlan.type === 'downgrade' ? '⚠️' : '✅'}
                                                </span>
                                                {msg}
                                            </li>
                                        ))}
                                    </ul>
                                </div>

                                {/* Upgrade Disclaimer */}
                                {selectedPlan.disclaimer && (
                                    <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 animate-in fade-in slide-in-from-bottom-2">
                                        <p className="text-[10px] text-blue-800 font-bold leading-relaxed flex gap-2 items-start">
                                            <span className="text-lg leading-none">ℹ️</span>
                                            <span>{selectedPlan.disclaimer}</span>
                                        </p>
                                    </div>
                                )}
                            </div>

                            <button
                                onClick={confirmAction}
                                className={`w-full py-4 rounded-xl text-white font-black text-xs uppercase tracking-[0.2em] transition-all shadow-xl mb-3 ${selectedPlan.type === 'downgrade' ? 'bg-slate-900 hover:bg-slate-800 shadow-slate-900/20' : 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/20'}`}
                            >
                                {selectedPlan.type === 'downgrade' ? "Confirmar Cambio" : "Ir a Pagar Diferencia"}
                            </button>
                            <button
                                onClick={() => setShowDowngradeModal(false)}
                                className="w-full py-3 rounded-xl text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 hover:bg-slate-50 transition-all"
                            >
                                Cancelar
                            </button>
                        </div>
                    </div>
                )}

                <div className="max-w-6xl mx-auto px-4 text-center mt-8">
                    {/* Header Section */}
                    <div className="mb-14">
                        <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase mb-4 text-slate-900 leading-none">
                            Elige tu <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">Plan</span>
                        </h1>
                        <p className="text-[12px] text-slate-400 font-black uppercase tracking-[0.4em] mb-12 max-w-lg mx-auto leading-relaxed">
                            Genera ingresos haciendo lo que más te gusta
                        </p>

                        {/* Founder Invitation */}
                        <div className="mb-14 inline-flex">
                            <div className="bg-gradient-to-r from-yellow-400/20 to-amber-500/10 border border-amber-200 text-amber-700 px-8 py-4 rounded-[2rem] flex items-center gap-4 animate-pulse shadow-xl shadow-amber-500/5">
                                <div className="p-2 bg-amber-400 rounded-xl text-white flex items-center gap-2">
                                    <Star size={16} fill="currentColor" />
                                    <Crown size={16} fill="currentColor" />
                                </div>
                                <span className="text-[11px] font-black uppercase tracking-widest text-left">
                                    Sé de los primeros 100 y obtén estatus <span className="underline decoration-2 underline-offset-4">Founder</span> para siempre
                                </span>
                            </div>
                        </div>

                        {/* Premium Toggle Container */}
                        <div className="flex flex-col items-center gap-6">
                            <div className="relative inline-flex items-center bg-slate-100/80 p-1.5 rounded-[2rem] border border-slate-200 shadow-inner backdrop-blur-sm">
                                <button
                                    onClick={() => setBillingCycle('monthly')}
                                    className={`relative z-10 px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'monthly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {billingCycle === 'monthly' && (
                                        <div className="absolute inset-0 bg-blue-600 rounded-[1.5rem] -z-10 shadow-lg shadow-blue-600/30 animate-in fade-in zoom-in-95 duration-300"></div>
                                    )}
                                    Mensual
                                </button>
                                <button
                                    onClick={() => setBillingCycle('yearly')}
                                    className={`relative z-10 px-10 py-3.5 rounded-[1.5rem] text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'yearly' ? 'text-white' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    {billingCycle === 'yearly' && (
                                        <div className="absolute inset-0 bg-gradient-to-r from-amber-400 to-orange-500 rounded-[1.5rem] -z-10 shadow-lg shadow-amber-500/30 animate-in fade-in zoom-in-95 duration-300"></div>
                                    )}
                                    Anual
                                </button>
                            </div>
                            <div className="flex items-center gap-2 px-4 py-2 bg-blue-50 rounded-full border border-blue-100">
                                <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping"></div>
                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em]">
                                    ¡25% OFF! (3 meses gratis al año) 🎁
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto px-4">
                        {plans.map((plan, idx) => {
                            const currentTier = (userTier || 'free').toLowerCase();
                            const isLoggedIn = !!session;
                            const isCurrentPlan = isLoggedIn && currentTier === plan.tier;
                            const isPremium = plan.tier === 'premium';
                            const isPro = plan.tier === 'pro';
                            const isScheduled = comenzarSuscripcion === plan.tier;

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
                                        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-amber-400 text-slate-900 px-5 py-1.5 rounded-full text-[8px] font-black uppercase tracking-widest shadow-xl shadow-amber-400/30">
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
                                        disabled={loading || isCurrentPlan || isScheduled}
                                        onClick={() => handleSelectPlan(plan)}
                                        className={`w-full py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all transform hover:-translate-y-1 mb-3 ${loading
                                            ? 'bg-slate-100 text-slate-400 cursor-wait border border-slate-200'
                                            : isCurrentPlan
                                                ? 'bg-slate-100 text-slate-400 cursor-not-allowed border border-slate-200'
                                                : isScheduled
                                                    ? 'bg-green-100 text-green-600 border border-green-200 cursor-default'
                                                    : (currentTier === 'premium' && plan.tier !== 'premium') || (currentTier === 'pro' && plan.tier === 'free')
                                                        ? 'bg-white border-2 border-slate-200 text-slate-400 hover:border-slate-900 hover:text-slate-900' /* Downgrade */
                                                        : isPremium
                                                            ? 'bg-blue-600 text-white hover:bg-slate-900 shadow-xl shadow-blue-600/20'
                                                            : isPro
                                                                ? 'bg-amber-400 text-slate-900 hover:bg-amber-500 shadow-xl shadow-amber-400/20'
                                                                : 'bg-slate-900 text-white hover:bg-slate-700'
                                            }`}
                                    >
                                        {loading
                                            ? "Cargando..."
                                            : isCurrentPlan
                                                ? "Tu Plan Actual"
                                                : isScheduled
                                                    ? "Programado para iniciar"
                                                    : !isLoggedIn
                                                        // NOT LOGGED IN
                                                        ? plan.tier === 'free' ? "Empezar Gratis"
                                                            : plan.tier === 'pro' ? "Empezar con Pro"
                                                                : "Empezar con Premium"

                                                        // LOGGED IN
                                                        : currentTier === 'free'
                                                            ? plan.tier === 'pro' ? "Mejorar a Pro"
                                                                : "Mejorar a Premium"

                                                            : currentTier === 'pro'
                                                                ? plan.tier === 'free' ? "Cambiar a Gratis"
                                                                    : "Mejorar a Premium"

                                                                // Current is Premium
                                                                : plan.tier === 'free' ? "Cambiar a Gratis"
                                                                    : "Cambiar a Pro"
                                        }
                                    </button>

                                    {/* Expiration Info Display */}
                                    {terminaSuscripcion && isCurrentPlan && (
                                        <div className="text-[9px] text-slate-400 font-bold uppercase tracking-widest mb-4 animate-in fade-in">
                                            Vence el: {new Date(terminaSuscripcion).toLocaleDateString()}
                                            {comenzarSuscripcion && (
                                                <span className="block mt-1 text-slate-500">
                                                    (Cambia a {plans.find(p => p.tier === comenzarSuscripcion)?.name} automáticamente)
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <Link
                                        href={`/pricing/${plan.tier}`}
                                        className="text-[9px] font-black uppercase tracking-widest text-slate-400 hover:text-blue-600 transition-colors py-2 flex items-center justify-center gap-1 group/link"
                                    >
                                        Más sobre el plan
                                        <ArrowUpRight size={10} className="group-hover/link:translate-x-0.5 group-hover/link:-translate-y-0.5 transition-transform" />
                                    </Link>
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-slate-900 text-sm font-black uppercase tracking-[0.3em] mb-4">Cancela cuando quieras</p>
                        <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-8">Sin contratos forzosos • Garantía de satisfacción • Soporte 24/7</p>

                        {/* Botón de Cancelar Suscripción (Solo Pro/Premium) */}
                        {session && (userTier === 'pro' || userTier === 'premium') && (
                            <button
                                onClick={() => handleSelectPlan(plans.find(p => p.tier === 'free'))}
                                className="text-[10px] font-bold uppercase tracking-widest text-red-400 hover:text-red-600 border-b border-transparent hover:border-red-600 transition-all pb-0.5 opacity-60 hover:opacity-100"
                            >
                                Cancelar Suscripción
                            </button>
                        )}
                    </div>
                </div>
            </main >

            <Footer />
        </div >
    );
}
