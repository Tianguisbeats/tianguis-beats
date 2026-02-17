"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, Star, ShieldCheck, ArrowUpRight, Lock, AlertTriangle, X, Crown, Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function PricingPage() {
    const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
    const [loading, setLoading] = useState(true);
    const [session, setSession] = useState<any>(null);
    const [userTier, setUserTier] = useState<string | null>(null);

    const [terminaSuscripcion, setTerminaSuscripcion] = useState<string | null>(null);
    const [comenzarSuscripcion, setComenzarSuscripcion] = useState<string | null>(null);

    const { addItem } = useCart();
    const { showToast } = useToast();
    const router = useRouter();

    // Modal State
    const [showDowngradeModal, setShowDowngradeModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);

            if (currentSession?.user) {
                try {
                    const { data, error } = await supabase
                        .from('profiles')
                        .select('subscription_tier, termina_suscripcion, comenzar_suscripcion')
                        .eq('id', currentSession.user.id)
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
            tier: 'free',
            name: 'Gratis',
            description: 'Ideal para empezar a compartir tu música.',
            price: 0,
            features: [
                "5 Beats públicos",
                "Comisión del 15%",
                "Estadísticas básicas",
                "Perfil de productor"
            ]
        },
        {
            tier: 'pro',
            name: 'Pro',
            description: 'Para productores que se lo toman muy en serio.',
            price: billingCycle === 'monthly' ? 149 : 111,
            features: [
                "Beats Ilimitados",
                "0% COMISIÓN",
                "MP3 + WAV",
                "Servicios habilitados",
                "Soporte 24/7"
            ]
        },
        {
            tier: 'premium',
            name: 'Premium',
            description: 'Para productores que ofrecen experiencia y calidad.',
            price: billingCycle === 'monthly' ? 349 : 261,
            features: [
                "Stems (Pistas)",
                "Licencia exclusiva",
                "Sound Kits",
                "Smart Bio",
                "Venta de servicios",
                "Impulso Algorítmico"
            ]
        }
    ];

    const handleSelectPlan = (plan: any) => {
        if (!session) {
            router.push('/signup');
            return;
        }

        const currentTier = (userTier || 'free').toLowerCase();
        if (currentTier === plan.tier) return;

        const tierOrder = ['free', 'pro', 'premium'];
        const currentIdx = tierOrder.indexOf(currentTier);
        const targetIdx = tierOrder.indexOf(plan.tier);

        const isDowngrade = targetIdx < currentIdx;

        if (isDowngrade) {
            let downgradeMessages: string[] = [];

            if (currentTier === 'premium' && plan.tier === 'pro') {
                downgradeMessages = [
                    "Perderás el acceso a la descarga de Stems (Pistas).",
                    "Perderás la capacidad de vender Licencias Exclusivas.",
                    "Se desactivarán tus Sound Kits y tu Smart Bio Premium.",
                    "Tu cuenta ya no tendrá el Impulso Algorítmico."
                ];
            } else if (currentTier === 'premium' && plan.tier === 'free') {
                downgradeMessages = [
                    "Tu comisión por venta subirá del 0% al 15%.",
                    "Solo podrás tener 5 Beats públicos (los demás se ocultarán).",
                    "Perderás el acceso a Stems, Sound Kits y Smart Bio.",
                    "Ya no podrás descargar archivos WAV de tus producciones."
                ];
            } else if (currentTier === 'pro' && plan.tier === 'free') {
                downgradeMessages = [
                    "Tu comisión por venta subirá del 0% al 15%.",
                    "Solo podrás tener 5 Beats públicos.",
                    "Perderás el soporte 24/7 y la descarga de WAV.",
                    "Se desactivarán tus servicios de mezcla y masterización."
                ];
            }

            setSelectedPlan({
                ...plan,
                type: 'downgrade',
                messages: [
                    "Tu plan actual permanecerá activo hasta el final de tu ciclo.",
                    ...downgradeMessages,
                    `Al finalizar tu periodo (${new Date(terminaSuscripcion || '').toLocaleDateString()}), pasarás a ${plan.name} automáticamente.`
                ]
            });
            setShowDowngradeModal(true);
        } else {
            setSelectedPlan({
                ...plan,
                type: 'upgrade',
                messages: ["¡Activación Inmediata!", "Acceso total a nuevas funciones."],
                disclaimer: "Importante: Tu nuevo plan comienza hoy."
            });
            setShowDowngradeModal(true);
        }
    };

    const handleCancelChange = async () => {
        if (!session) return;
        setLoading(true);
        try {
            const { error } = await supabase
                .from('profiles')
                .update({ comenzar_suscripcion: null })
                .eq('id', session.user.id);

            if (error) throw error;
            setComenzarSuscripcion(null);
            showToast("Cambio cancelado. Mantendrás tu plan actual.", 'success');
        } catch (err) {
            console.error(err);
            showToast("Error al cancelar el cambio.", 'error');
        } finally {
            setLoading(false);
        }
    };

    const confirmAction = async () => {
        if (!selectedPlan || !session) return;

        if (selectedPlan.type === 'downgrade') {
            try {
                const { error } = await supabase
                    .from('profiles')
                    .update({ comenzar_suscripcion: selectedPlan.tier })
                    .eq('id', session.user.id);

                if (error) throw error;
                setShowDowngradeModal(false);
                setComenzarSuscripcion(selectedPlan.tier);
                showToast("Cambio programado exitosamente.", 'success');
            } catch (err) {
                console.error(err);
                showToast("Error al programar el cambio.", 'error');
            }
        } else {
            addItem({
                id: `plan-${selectedPlan.tier}-${billingCycle}`,
                type: 'plan',
                name: `Plan ${selectedPlan.name}`,
                price: selectedPlan.price,
                subtitle: selectedPlan.description,
                metadata: { tier: selectedPlan.tier, cycle: billingCycle }
            });
            showToast(`Plan ${selectedPlan.name} agregado al carrito`, 'success');
            router.push('/cart');
        }
    };

    return (
        <div className="min-h-screen bg-background transition-colors duration-300">
            <Navbar />

            {/* Modal */}
            {showDowngradeModal && selectedPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-card rounded-[2rem] p-8 max-w-md w-full shadow-2xl relative border border-border">
                        <button onClick={() => setShowDowngradeModal(false)} className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted/10 transition-colors">
                            <X size={20} className="text-muted" />
                        </button>
                        <div className="text-center mb-6">
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-foreground mb-4">
                                {selectedPlan.type === 'downgrade' ? 'Confirmar Cambio' : 'Mejorar Plan'}
                            </h2>

                            {selectedPlan.type === 'downgrade' && terminaSuscripcion && (
                                <div className="mb-6 p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-amber-500">
                                        Periodo Actual
                                    </p>
                                    <p className="text-sm font-bold text-foreground">
                                        Tienes hasta el {new Date(terminaSuscripcion).toLocaleDateString()}
                                    </p>
                                </div>
                            )}

                            <div className="mb-6 text-left">
                                <p className="text-[10px] font-black uppercase tracking-widest text-muted mb-3">
                                    {selectedPlan.type === 'downgrade' ? 'Lo que debes saber:' : 'Beneficios inmediatos:'}
                                </p>
                                <ul className="space-y-2">
                                    {selectedPlan.messages?.map((msg: string, i: number) => (
                                        <li key={i} className="flex gap-2 text-sm text-foreground/80 font-medium">
                                            <Check size={16} className="text-accent shrink-0 mt-0.5" /> {msg}
                                        </li>
                                    ))}
                                </ul>
                            </div>

                            <button onClick={confirmAction} className="w-full py-4 bg-accent text-white rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-accent/20 hover:scale-[1.02] transition-all">
                                {selectedPlan.type === 'downgrade' ? 'Programar Cambio' : 'Ir al Carrito'}
                            </button>

                            {selectedPlan.type === 'downgrade' && (
                                <button
                                    onClick={() => setShowDowngradeModal(false)}
                                    className="w-full mt-4 py-4 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-2xl font-black uppercase tracking-widest text-[10px] hover:bg-emerald-500 hover:text-white transition-all shadow-lg shadow-emerald-500/10 active:scale-[0.98]"
                                >
                                    Arrepentirse y Mantener Plan Actual
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* Hero Section */}
            <section className="relative pt-32 pb-20 overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
                    <div className="absolute -top-1/4 -left-1/4 w-1/2 h-1/2 bg-accent/10 rounded-full blur-[120px]"></div>
                    <div className="absolute -bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-purple-500/10 rounded-full blur-[120px]"></div>
                </div>

                <div className="max-w-7xl mx-auto px-4 relative z-10 text-center">
                    <div className="inline-flex items-center gap-2 px-6 py-2 rounded-full bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 border border-amber-500/40 shadow-[0_0_30px_rgba(245,158,11,0.2)] animate-pulse">
                        <Crown size={14} className="fill-amber-500" /> Únete ahora: Las primeras 100 personas obtendrán el distintivo exclusivo de Founder
                    </div>
                    <h1 className="text-5xl md:text-8xl font-black text-foreground tracking-tighter mb-6 font-heading leading-tight uppercase drop-shadow-[0_8px_30px_rgba(0,0,0,0.5)]">
                        Elige tu <span className="text-accent">plan</span>
                    </h1>
                    <p className="max-w-2xl mx-auto text-lg text-muted font-medium mb-12">
                        Tu música no tiene límites. Desbloquea el poder total del Tianguis y conviértete en la próxima leyenda de la industria.
                    </p>

                    {/* Cycle Toggle */}
                    <div className="flex flex-col items-center gap-4">
                        <div className="inline-flex p-1.5 bg-card border border-border rounded-full items-center gap-2 relative">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'monthly' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-foreground'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`px-8 py-2.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'bg-accent text-white shadow-lg' : 'text-muted hover:text-foreground'}`}
                            >
                                Anual
                            </button>
                            {/* 25% OFF Badge */}
                            <div className="absolute -top-4 -right-4 bg-blue-600 text-white text-[8px] font-black px-2 py-1 rounded-lg rotate-12 shadow-lg">
                                25% OFF + 3 MESES GRATIS
                            </div>
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest transition-all ${billingCycle === 'yearly' ? 'text-accent' : 'text-muted'}`}>
                            {billingCycle === 'yearly' ? 'Ahorras un 25% anual y obtienes 3 meses gratis' : 'Cambia a anual para ahorrar'}
                        </p>
                    </div>
                </div>
            </section>

            {/* Pricing Grid */}
            <section className="pb-32 relative z-10">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch">
                        {plans.map((plan) => {
                            const currentTier = (userTier || 'free').toLowerCase();
                            const isCurrentPlan = currentTier === plan.tier;
                            const isScheduled = comenzarSuscripcion === plan.tier;

                            const tierOrder = ['free', 'pro', 'premium'];
                            const currentIdx = tierOrder.indexOf(currentTier);
                            const targetIdx = tierOrder.indexOf(plan.tier);
                            const isUpgrade = targetIdx > currentIdx;
                            const isDowngrade = targetIdx < currentIdx;

                            const isPremium = plan.tier === 'premium';
                            const isPro = plan.tier === 'pro';
                            const isFree = plan.tier === 'free';

                            // Plan specific colors
                            const planColorClass = isPremium ? 'text-blue-500' : isPro ? 'text-amber-500' : 'text-slate-400';
                            const planBgSoftClass = isPremium ? 'bg-blue-500/10' : isPro ? 'bg-amber-500/10' : 'bg-slate-500/10';
                            const planBorderClass = isFree ? 'border-slate-300 dark:border-slate-700' : isPro ? 'border-amber-400/50' : 'border-blue-500/50';

                            return (
                                <div key={plan.tier} className={`group relative bg-card/60 backdrop-blur-xl rounded-[3rem] p-8 md:p-10 border transition-all duration-500 hover:-translate-y-2 flex flex-col ${isPro ? 'border-amber-500 shadow-[0_40px_80px_-20px_rgba(245,158,11,0.2)] scale-105 z-20' : `border-border/80 shadow-premium hover:border-accent/40`}`}>
                                    {isPro && (
                                        <div className="absolute -top-5 left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest shadow-xl">
                                            Más Popular
                                        </div>
                                    )}
                                    <div className="mb-8">
                                        <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-6 ${planBgSoftClass} ${planColorClass}`}>
                                            {isPremium ? <Crown size={28} fill="currentColor" /> : isPro ? <Star size={28} fill="currentColor" /> : <Zap size={28} />}
                                        </div>
                                        <h3 className="text-2xl font-black text-foreground mb-2 font-heading tracking-tighter">{plan.name}</h3>
                                        <p className="text-muted text-sm font-medium">{plan.description}</p>
                                    </div>
                                    <div className="mb-8">
                                        <div className="flex items-baseline gap-1">
                                            <span className="text-5xl font-black text-foreground tracking-tighter">${plan.price}</span>
                                            <span className="text-muted font-black uppercase text-[10px] tracking-widest">MXN/Mes</span>
                                        </div>
                                    </div>
                                    <ul className="space-y-4 mb-10 flex-1">
                                        {plan.features.map((feature, i) => (
                                            <li key={i} className="flex items-center gap-3 text-sm font-medium text-foreground">
                                                <Check size={isPro ? 18 : 16} className={planColorClass} strokeWidth={isPro ? 3 : 2} /> {feature}
                                            </li>
                                        ))}
                                    </ul>
                                    {isScheduled ? (
                                        <button
                                            onClick={handleCancelChange}
                                            className="w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-amber-500/10 text-amber-500 border border-amber-500/20 hover:bg-amber-500 hover:text-white transition-all shadow-lg"
                                        >
                                            Cancelar Cambio Programado
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleSelectPlan(plan)}
                                            disabled={isCurrentPlan}
                                            className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all ${isCurrentPlan
                                                ? 'bg-muted/10 text-muted cursor-default'
                                                : isPro ? 'bg-amber-500 text-white hover:bg-foreground hover:shadow-xl' : 'bg-foreground text-background hover:bg-accent hover:text-white'
                                                }`}
                                        >
                                            {isCurrentPlan ? 'Tu Plan Actual' : isUpgrade ? `Mejorar a ${plan.name}` : isDowngrade ? `Cambiar a ${plan.name}` : `Suscribirse ${plan.name}`}
                                        </button>
                                    )}

                                    <Link href={`/pricing/${plan.tier}`} className={`mt-4 text-center text-[10px] font-black uppercase tracking-widest text-muted hover:${planColorClass} transition-colors`}>
                                        Saber más sobre el plan
                                    </Link>

                                    {/* Expiration Info */}
                                    {isCurrentPlan && terminaSuscripcion && (
                                        <p className="mt-4 text-center text-[9px] font-black uppercase tracking-widest text-muted">
                                            Vence el: {new Date(terminaSuscripcion).toLocaleDateString()}
                                        </p>
                                    )}
                                </div>
                            );
                        })}
                    </div>

                    <div className="mt-20 text-center">
                        <p className="text-foreground text-sm font-black uppercase tracking-[0.3em] mb-4">Cancela cuando quieras</p>

                        {/* Cancel Button - Subtle and below cancel text */}
                        {session && (userTier === 'pro' || userTier === 'premium') && (
                            <button
                                onClick={() => handleSelectPlan(plans.find(p => p.tier === 'free'))}
                                className="block mx-auto mb-6 text-[9px] font-bold uppercase tracking-widest text-muted hover:text-red-400 transition-all opacity-40 hover:opacity-100"
                            >
                                Cancelar Suscripción
                            </button>
                        )}

                        <p className="text-muted text-[10px] font-bold uppercase tracking-widest mb-8">Sin contratos forzosos • Garantía de satisfacción • Soporte 24/7</p>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
