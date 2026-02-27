"use client";

import React, { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Check, Zap, ShieldCheck, X, Crown, Star, Sparkles, ArrowRight, Lock, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import { useCurrency } from '@/context/CurrencyContext';
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
    const { formatPrice, currency } = useCurrency();
    const { showToast } = useToast();
    const router = useRouter();

    const [showModal, setShowModal] = useState(false);
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    useEffect(() => {
        const fetchUser = async () => {
            const { data: { session: currentSession } } = await supabase.auth.getSession();
            setSession(currentSession);
            if (currentSession?.user) {
                try {
                    const { data, error } = await supabase
                        .from('perfiles')
                        .select('nivel_suscripcion, fecha_termino_suscripcion, fecha_inicio_suscripcion')
                        .eq('id', currentSession.user.id)
                        .single();
                    if (data && !error) {
                        setUserTier(data.nivel_suscripcion);
                        setTerminaSuscripcion(data.fecha_termino_suscripcion);
                        setComenzarSuscripcion(data.fecha_inicio_suscripcion);
                    }
                } catch (e) { console.error(e); }
            }
            setLoading(false);
        };
        fetchUser();
    }, []);

    const plans = [
        {
            tier: 'free',
            name: 'Free',
            tagline: 'Para empezar tu camino.',
            price: { monthly: 0, yearly: 0 },
            icon: <Zap size={28} />,
            color: 'slate',
            features: [
                { text: '5 Beats públicos', included: true },
                { text: 'Comisión del 15%', included: true },
                { text: 'Estadísticas básicas', included: true },
                { text: 'Perfil de productor', included: true },
                { text: 'MP3 + WAV', included: false },
                { text: 'Beats ilimitados', included: false },
                { text: 'Stems & Sound Kits', included: false },
            ]
        },
        {
            tier: 'pro',
            name: 'Pro',
            tagline: 'Para productores serios.',
            price: { monthly: 149, yearly: 111 },
            icon: <Star size={28} fill="currentColor" />,
            color: 'amber',
            highlight: true,
            badge: 'Más Popular',
            features: [
                { text: 'Beats ilimitados', included: true },
                { text: '0% de comisión', included: true },
                { text: 'MP3 + WAV', included: true },
                { text: 'Soporte 24/7', included: true },
                { text: 'Estadísticas avanzadas', included: true },
                { text: 'Anillo ámbar de Pro', included: true },
                { text: 'Stems & Sound Kits', included: false },
            ]
        },
        {
            tier: 'premium',
            name: 'Premium',
            tagline: 'La experiencia completa.',
            price: { monthly: 349, yearly: 261 },
            icon: <Crown size={28} fill="currentColor" />,
            color: 'blue',
            founderBadge: true,
            features: [
                { text: 'Todo lo de Pro', included: true },
                { text: 'Stems (Pistas)', included: true },
                { text: 'Licencia Exclusiva', included: true },
                { text: 'Sound Kits', included: true },
                { text: 'Venta de Servicios', included: true },
                { text: 'Impulso Algorítmico', included: true },
                { text: 'Anillo azul Premium', included: true },
            ]
        }
    ];

    const getButtonConfig = (plan: any) => {
        const currentTier = (userTier || 'free').toLowerCase();
        const tierOrder = ['free', 'pro', 'premium'];
        const currentIdx = tierOrder.indexOf(currentTier);
        const targetIdx = tierOrder.indexOf(plan.tier);
        const isCurrentPlan = currentTier === plan.tier;
        const isUpgrade = targetIdx > currentIdx;
        const isDowngrade = targetIdx < currentIdx;

        if (!session) {
            if (plan.tier === 'free') return { label: 'Empieza Gratis', style: 'secondary' };
            return { label: `Unirse a ${plan.name}`, style: plan.tier };
        }

        if (isCurrentPlan) {
            return {
                label: billingCycle === 'yearly' ? `Extender ${plan.name} (Anual)` : `Extender ${plan.name}`,
                style: plan.tier
            };
        }
        if (isUpgrade) return { label: `Mejorar a ${plan.name}`, style: plan.tier };
        if (isDowngrade) return { label: `Cambiar a ${plan.name}`, style: 'downgrade' };

        return { label: `Elegir ${plan.name}`, style: plan.tier };
    };

    const handleSelectPlan = (plan: any) => {
        if (!session) {
            router.push('/signup');
            return;
        }
        const currentTier = (userTier || 'free').toLowerCase();
        const tierOrder = ['free', 'pro', 'premium'];
        const currentIdx = tierOrder.indexOf(currentTier);
        const targetIdx = tierOrder.indexOf(plan.tier);
        const isDowngrade = targetIdx < currentIdx;
        const isUpgrade = targetIdx > currentIdx;
        const isSameTier = currentTier === plan.tier;

        if (isDowngrade) {
            let msgs: string[] = [];
            if (currentTier === 'premium' && plan.tier === 'pro') {
                msgs = ['Perderás Stems, Licencias Exclusivas, Sound Kits.', 'Ya no tendrás Impulso Algorítmico en el catálogo.'];
            } else if (plan.tier === 'free') {
                msgs = ['Tu comisión subirá del 0% al 15%.', 'Solo podrás tener 5 Beats públicos.', 'Perderás el acceso a WAV, Stems y más.'];
            }
            setSelectedPlan({
                ...plan, type: 'downgrade',
                messages: ['Tu plan actual permanece activo hasta el final del ciclo.', ...msgs, terminaSuscripcion ? `Pasarás a ${plan.name} el ${new Date(terminaSuscripcion).toLocaleDateString('es-MX', { day: 'numeric', month: 'long' })}.` : '']
            });
        } else if (isUpgrade && currentTier !== 'free') {
            setSelectedPlan({
                ...plan, type: 'upgrade',
                messages: [
                    `¡Tu plan ${plan.name} se activa INMEDIATAMENTE!`,
                    'Tus días restantes del plan anterior se convierten en días de crédito.',
                    'No pierdes ni un centavo de lo que ya pagaste.'
                ]
            });
        } else {
            setSelectedPlan({
                ...plan, type: isSameTier ? 'extend' : 'new',
                messages: isSameTier
                    ? ['Tu tiempo actual se mantiene intacto.', 'El nuevo periodo se suma a tu fecha de vencimiento actual.']
                    : ['¡Activación Inmediata!', `Acceso total a todas las funciones de ${plan.name}.`]
            });
        }
        setShowModal(true);
    };

    const handleCancelSubscription = () => {
        const freePlan = plans.find(p => p.tier === 'free');
        handleSelectPlan(freePlan);
    };

    const confirmAction = async () => {
        if (!selectedPlan || !session) return;

        if (selectedPlan.type === 'downgrade' && selectedPlan.tier === 'free') {
            try {
                const { error } = await supabase.from('perfiles').update({ fecha_inicio_suscripcion: selectedPlan.tier }).eq('id', session.user.id);
                if (error) throw error;
                setShowModal(false);
                setComenzarSuscripcion(selectedPlan.tier);
                showToast('Cambio programado. Tu plan actual sigue activo.', 'success');
            } catch (err) {
                showToast('Error al procesar la solicitud.', 'error');
            }
        } else {
            const isYearly = billingCycle === 'yearly';
            const totalPrice = isYearly ? (selectedPlan.price.yearly * 12) : selectedPlan.price.monthly;
            const wasAdded = addItem({
                id: `plan-${selectedPlan.tier}-${billingCycle}`,
                type: 'plan',
                name: `Plan ${selectedPlan.name} ${isYearly ? '[Anual]' : '[Mensual]'}`,
                price: totalPrice,
                subtitle: selectedPlan.tagline,
                metadata: { tier: selectedPlan.tier, cycle: billingCycle }
            });
            if (wasAdded) router.push('/cart');
        }
    };

    const btnStyles: Record<string, string> = {
        pro: 'bg-gradient-to-r from-amber-500 to-amber-400 text-white hover:from-amber-400 hover:to-amber-300 shadow-lg shadow-amber-500/30',
        premium: 'bg-gradient-to-r from-[#00f2ff] to-[#0ea5e9] text-slate-900 hover:from-[#00e0ff] hover:to-[#0ea5e9] shadow-lg shadow-[#00f2ff]/30',
        free: 'bg-slate-900 text-white dark:bg-white dark:text-slate-900 hover:opacity-90',
        secondary: 'bg-slate-100 text-slate-900 dark:bg-white/10 dark:text-white hover:bg-slate-200 dark:hover:bg-white/20',
        downgrade: 'bg-slate-100 text-slate-500 dark:bg-white/5 dark:text-slate-400 hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-500/10 dark:hover:text-red-400 border border-slate-200 dark:border-white/10',
    };

    return (
        <div className="min-h-screen bg-background transition-colors duration-300 font-sans">
            <Navbar />

            {/* ─────────────── MODAL ─────────────── */}
            {showModal && selectedPlan && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-md animate-in fade-in duration-200">
                    <div className={`relative w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl border overflow-hidden ${selectedPlan.tier === 'premium' ? 'bg-slate-900 border-[#00f2ff]/20' : selectedPlan.tier === 'pro' ? 'bg-slate-900 border-amber-500/20' : 'bg-card border-border'}`}>

                        <div className={`absolute top-0 left-0 w-full h-1 ${selectedPlan.tier === 'premium' ? 'bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent' : selectedPlan.tier === 'pro' ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent' : 'bg-gradient-to-r from-transparent via-slate-400 to-transparent'}`} />

                        <button onClick={() => setShowModal(false)} className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-slate-400 hover:text-white hover:bg-rose-500/20 transition-all">
                            <X size={18} />
                        </button>

                        <div className="mb-6">
                            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest mb-4 ${selectedPlan.tier === 'premium' ? 'bg-[#00f2ff]/10 text-[#00f2ff] border border-[#00f2ff]/20' : selectedPlan.tier === 'pro' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-slate-400/10 text-slate-400 border border-slate-400/20'}`}>
                                {selectedPlan.icon} Plan {selectedPlan.name}
                            </div>
                            <h2 className="text-2xl font-black uppercase tracking-tighter text-white mb-2">
                                {selectedPlan.type === 'downgrade' ? 'Cambio de Plan' : selectedPlan.type === 'extend' ? 'Extender Suscripción' : selectedPlan.type === 'upgrade' ? '¡Mejora Inmediata!' : 'Confirmar Plan'}
                            </h2>
                            {selectedPlan.type === 'downgrade' && terminaSuscripcion && (
                                <div className="mb-4 p-3 bg-amber-500/10 border border-amber-500/20 rounded-2xl">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-amber-400 mb-1">Tu periodo actual vence</p>
                                    <p className="text-sm font-bold text-white">{new Date(terminaSuscripcion).toLocaleDateString('es-MX', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
                                </div>
                            )}
                        </div>

                        <ul className="space-y-3 mb-8">
                            {selectedPlan.messages?.map((msg: string, i: number) => msg && (
                                <li key={i} className="flex items-start gap-3 text-sm text-slate-300 font-medium">
                                    <div className={`shrink-0 mt-0.5 w-5 h-5 rounded-full flex items-center justify-center ${selectedPlan.type === 'downgrade' ? 'bg-amber-500/15 text-amber-400' : 'bg-emerald-500/15 text-emerald-400'}`}>
                                        <Check size={12} strokeWidth={3} />
                                    </div>
                                    {msg}
                                </li>
                            ))}
                        </ul>

                        <button onClick={confirmAction} className={`w-full py-4 rounded-2xl font-black uppercase tracking-widest text-[11px] hover:scale-[1.02] active:scale-95 transition-all ${btnStyles[selectedPlan.tier] || btnStyles.free}`}>
                            {selectedPlan.type === 'downgrade' ? 'Programar Cambio' : 'Ir al Carrito →'}
                        </button>
                        <button onClick={() => setShowModal(false)} className="w-full mt-3 py-3 rounded-2xl font-black text-[10px] uppercase tracking-widest text-slate-500 hover:text-slate-300 transition-all">
                            Cancelar
                        </button>
                    </div>
                </div>
            )}

            {/* ─────────────── HERO ─────────────── */}
            <section className="relative pt-36 pb-16 overflow-hidden">
                {/* Ambient blobs */}
                <div className="absolute inset-0 pointer-events-none overflow-hidden">
                    <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-gradient-to-b from-accent/10 to-transparent rounded-full blur-[100px]" />
                    <div className="absolute top-20 left-0 w-[400px] h-[400px] bg-amber-500/5 rounded-full blur-[150px]" />
                    <div className="absolute top-20 right-0 w-[400px] h-[400px] bg-[#00f2ff]/5 rounded-full blur-[150px]" />
                </div>

                <div className="relative z-10 max-w-4xl mx-auto px-4 text-center">
                    {/* Founder Badge */}
                    <div className="inline-flex items-center gap-2.5 px-5 py-2 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-500 text-[10px] font-black uppercase tracking-[0.2em] mb-8 shadow-[0_0_40px_rgba(245,158,11,0.15)] animate-pulse">
                        <Crown size={14} fill="currentColor" />
                        Las primeras 100 personas obtienen la insignia exclusiva de Founder
                        <Crown size={14} fill="currentColor" />
                    </div>

                    <h1 className="text-6xl md:text-9xl font-black uppercase tracking-[-0.05em] leading-[0.85] mb-6 text-foreground">
                        Elige tu<br /><span className="text-accent">plan.</span>
                    </h1>

                    <p className="text-muted text-base font-medium mb-12 max-w-xl mx-auto">
                        Sin contratos forzosos. Cancela cuando quieras.
                    </p>

                    {/* Billing Toggle */}
                    <div className="inline-flex flex-col items-center gap-3">
                        <div className="relative flex items-center p-1.5 bg-card border border-border rounded-2xl shadow-inner">
                            <button
                                onClick={() => setBillingCycle('monthly')}
                                className={`relative px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'monthly' ? 'bg-foreground text-background shadow-lg' : 'text-muted hover:text-foreground'}`}
                            >
                                Mensual
                            </button>
                            <button
                                onClick={() => setBillingCycle('yearly')}
                                className={`relative px-8 py-3 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${billingCycle === 'yearly' ? 'bg-foreground text-background shadow-lg' : 'text-muted hover:text-foreground'}`}
                            >
                                Anual
                            </button>
                            {/* Badge */}
                            <div className="absolute -top-5 -right-3 bg-emerald-500 text-white text-[8px] font-black px-3 py-1 rounded-full shadow-lg whitespace-nowrap rotate-3 shadow-emerald-500/30">
                                25% OFF · 3 MESES GRATIS
                            </div>
                        </div>
                        <p className={`text-[10px] font-bold uppercase tracking-widest transition-all duration-300 ${billingCycle === 'yearly' ? 'text-emerald-500' : 'text-muted opacity-60'}`}>
                            {billingCycle === 'yearly' ? '✨ Ahorras 3 meses completos al año' : 'Cambia a anual y ahorra 25%'}
                        </p>
                    </div>
                </div>
            </section>

            {/* ─────────────── PRICING GRID ─────────────── */}
            <section className="pb-24 relative z-10">
                <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 items-end">
                        {plans.map((plan) => {
                            const currentTier = (userTier || 'free').toLowerCase();
                            const isCurrentPlan = currentTier === plan.tier;
                            const isPro = plan.tier === 'pro';
                            const isPremium = plan.tier === 'premium';
                            const isFree = plan.tier === 'free';
                            const isScheduled = comenzarSuscripcion === plan.tier;
                            const btnCfg = getButtonConfig(plan);
                            const price = billingCycle === 'yearly' ? plan.price.yearly : plan.price.monthly;

                            return (
                                <div
                                    key={plan.tier}
                                    className={`relative flex flex-col rounded-[3rem] border transition-all duration-500 overflow-hidden ${isPro
                                        ? 'md:-translate-y-6 bg-gradient-to-b from-amber-950/60 to-slate-900 border-amber-500/40 shadow-[0_40px_100px_-20px_rgba(245,158,11,0.3)] ring-1 ring-amber-500/20'
                                        : isPremium
                                            ? 'bg-gradient-to-b from-[#001a2e] to-slate-900 border-[#00f2ff]/30 shadow-[0_40px_100px_-20px_rgba(0,242,255,0.2)] ring-1 ring-[#00f2ff]/10'
                                            : 'bg-card border-border hover:border-border/80'
                                        }`}
                                >
                                    {/* Top accent line */}
                                    {!isFree && (
                                        <div className={`absolute top-0 left-0 right-0 h-px ${isPro ? 'bg-gradient-to-r from-transparent via-amber-500 to-transparent' : 'bg-gradient-to-r from-transparent via-[#00f2ff] to-transparent'}`} />
                                    )}

                                    {/* Most Popular badge */}
                                    {isPro && (
                                        <div className="absolute -top-px left-1/2 -translate-x-1/2 bg-amber-500 text-white px-6 py-1.5 rounded-b-2xl font-black text-[9px] uppercase tracking-widest shadow-xl z-10">
                                            ★ Más Popular
                                        </div>
                                    )}

                                    {/* Current plan indicator */}
                                    {isCurrentPlan && session && (
                                        <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${isPro ? 'bg-amber-500/20 text-amber-400' : isPremium ? 'bg-[#00f2ff]/20 text-[#00f2ff]' : 'bg-white/10 text-slate-400'}`}>
                                            Tu plan actual
                                        </div>
                                    )}

                                    <div className={`p-8 md:p-10 flex flex-col flex-1 ${isPro ? 'pt-14' : 'pt-10'}`}>

                                        {/* Icon + Plan Name */}
                                        <div className="mb-8">
                                            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${isFree ? 'bg-slate-200/10 text-slate-400' : isPro ? 'bg-amber-500/15 text-amber-400' : 'bg-[#00f2ff]/10 text-[#00f2ff]'}`}>
                                                {plan.icon}
                                            </div>
                                            <h3 className={`text-2xl font-black uppercase tracking-tighter mb-1 ${isFree ? 'text-slate-400' : isPro ? 'text-amber-400' : 'text-[#00f2ff]'}`}>
                                                {plan.name}
                                            </h3>
                                            <p className="text-muted text-[11px] font-bold uppercase tracking-widest opacity-70">{plan.tagline}</p>
                                        </div>

                                        {/* Price */}
                                        <div className="mb-8">
                                            <div className="flex items-baseline gap-2">
                                                <span className={`text-5xl font-black tracking-tighter ${isFree ? 'text-foreground' : isPro ? 'text-amber-300' : 'text-[#00f2ff]'}`}>
                                                    {isFree ? 'Gratis' : `$${price}`}
                                                </span>
                                                {!isFree && (
                                                    <div className="flex flex-col">
                                                        <span className="text-[10px] font-black text-muted uppercase tracking-widest">{currency}</span>
                                                        <span className="text-[9px] font-bold text-muted/60 uppercase tracking-widest">/ mes</span>
                                                    </div>
                                                )}
                                            </div>
                                            {!isFree && billingCycle === 'yearly' && (
                                                <p className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest mt-2 flex items-center gap-1">
                                                    <Sparkles size={10} fill="currentColor" /> ${price * 12} al año · Ahorras ${(plan.price.monthly - price) * 12}
                                                </p>
                                            )}
                                        </div>

                                        {/* Founder note */}
                                        {isPremium && (
                                            <div className="mb-6 px-4 py-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center gap-3">
                                                <Crown size={16} className="text-amber-400 shrink-0" fill="currentColor" />
                                                <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 leading-tight">
                                                    Primeras 100 personas reciben insignia Founder
                                                </p>
                                            </div>
                                        )}

                                        {/* Features */}
                                        <ul className="space-y-3.5 mb-10 flex-1">
                                            {plan.features.map((f, i) => (
                                                <li key={i} className={`flex items-center gap-3 text-[12px] font-bold ${f.included ? (isFree ? 'text-foreground/80' : isPro ? 'text-amber-100' : 'text-white/90') : 'text-muted/40 line-through'}`}>
                                                    <div className={`shrink-0 w-5 h-5 rounded-full flex items-center justify-center ${f.included ? (isFree ? 'bg-slate-400/15 text-slate-400' : isPro ? 'bg-amber-500/20 text-amber-400' : 'bg-[#00f2ff]/15 text-[#00f2ff]') : 'bg-white/5 text-muted/20'}`}>
                                                        <Check size={11} strokeWidth={3} />
                                                    </div>
                                                    {f.text}
                                                </li>
                                            ))}
                                        </ul>

                                        {/* CTA Button */}
                                        {isScheduled ? (
                                            <button className="w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest bg-amber-500/10 text-amber-400 border border-amber-500/20 cursor-default">
                                                <Clock size={14} className="inline mr-2" />
                                                Cambio Programado
                                            </button>
                                        ) : (
                                            <button
                                                onClick={() => handleSelectPlan(plan)}
                                                className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all hover:scale-[1.02] active:scale-95 ${btnStyles[btnCfg.style] || btnStyles.secondary}`}
                                            >
                                                {btnCfg.label}
                                                {!isFree && <ArrowRight size={14} className="inline ml-2" />}
                                            </button>
                                        )}

                                        {/* Vencimiento */}
                                        {isCurrentPlan && terminaSuscripcion && !isFree && (
                                            <p className="mt-3 text-center text-[9px] font-bold uppercase tracking-widest text-muted/50">
                                                Vence el {new Date(terminaSuscripcion).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' })}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    {/* ── Trust Bar ── */}
                    <div className="mt-16 flex flex-col items-center gap-6">
                        <div className="flex flex-wrap items-center justify-center gap-8 text-[10px] font-black uppercase tracking-widest text-muted/60">
                            <span className="flex items-center gap-2"><Lock size={12} /> Sin contratos forzosos</span>
                            <span className="w-px h-4 bg-border hidden sm:block" />
                            <span className="flex items-center gap-2"><ShieldCheck size={12} /> Garantía de satisfacción</span>
                            <span className="w-px h-4 bg-border hidden sm:block" />
                            <span className="flex items-center gap-2"><Zap size={12} fill="currentColor" /> Soporte 24/7</span>
                        </div>

                        {/* Cancel Subscription – only for active subscribers */}
                        {session && (userTier === 'pro' || userTier === 'premium') && (
                            <button
                                onClick={handleCancelSubscription}
                                className="text-[9px] font-bold uppercase tracking-widest text-muted/30 hover:text-red-400 transition-all opacity-60 hover:opacity-100 mt-2"
                            >
                                Cancelar suscripción
                            </button>
                        )}
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    );
}
