"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Trash2,
    ArrowRight,
    ShoppingBag,
    Tag,
    ShieldCheck,
    ChevronLeft,
    Zap,
    Music,
    Plus,
    Minus,
    Star,
    Loader2,
    Lock,
    CreditCard,
    Mail,
    Briefcase,
    Globe,
    Crown
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';

export default function CartPage() {
    const { items, removeItem, total, itemCount, clearCart } = useCart();
    const { formatPrice, currency, convertPrice } = useCurrency();
    const { showToast } = useToast();
    const router = useRouter();
    const [coupon, setCoupon] = useState('');
    const [discountApplied, setDiscountApplied] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [showCouponInput, setShowCouponInput] = useState(false);


    const handleApplyCoupon = async () => {
        if (!coupon) return;

        try {
            const { data, error } = await supabase
                .from('cupones')
                .select('*')
                .eq('codigo', coupon.toUpperCase())
                .eq('es_activo', true)
                .single();

            if (error || !data) {
                showToast("El cupón no es válido o está desactivado.", 'error');
                return;
            }

            // Validar expiración
            if (data.fecha_expiracion && new Date(data.fecha_expiracion) < new Date()) {
                showToast("Este cupón ha expirado.", 'error');
                return;
            }

            // Validar límite de usos
            if (data.usos_maximos && data.usos_actuales >= data.usos_maximos) {
                showToast("Este cupón ha agotado su límite de usos.", 'error');
                return;
            }

            // Validar nivel_objetivo
            if (data.nivel_objetivo && data.nivel_objetivo !== 'todos') {
                const { data: userData } = await supabase.auth.getUser();
                if (!userData.user) {
                    // Si no hay sesión, permitimos aplicar pero validaremos al nivel del item en el carrito
                } else {
                    const { data: profile } = await supabase.from('perfiles').select('nivel_suscripcion').eq('id', userData.user.id).single();
                    const userTier = (profile?.nivel_suscripcion || 'free').toLowerCase().trim();

                    if (data.nivel_objetivo === 'gratis' && userTier !== 'free') {
                        showToast("Cupones exclusivos para usuarios Free.", 'error');
                        return;
                    }
                    if (data.nivel_objetivo === 'pro' && userTier !== 'pro' && data.aplica_a !== 'suscripciones') {
                        showToast("Cupones exclusivos para nivel PRO.", 'error');
                        return;
                    }
                    if (data.nivel_objetivo === 'premium' && userTier !== 'premium' && data.aplica_a !== 'suscripciones') {
                        showToast("Cupones exclusivos para nivel PREMIUM.", 'error');
                        return;
                    }
                }
            }

            // Calcular descuento item por item basado en `aplica_a`
            let totalDiscount = 0;
            let appliedItems: string[] = [];
            const producerId = data.productor_id;

            items.forEach(item => {
                const itemProducerId = item.metadata?.productor_id || item.metadata?.producerId || item.metadata?.producer_id || item.metadata?.seller_id;
                let isItemEligible = false;

                const iType = item.type; // beat, plan, sound_kit, service
                const cAppliesTo = data.aplica_a; // todos, beats, sound_kits, servicios, suscripciones

                if (!producerId) {
                    // Es cupón de administrador, solo aplica a suscripciones
                    if (cAppliesTo === 'suscripciones' && iType === 'plan') {
                        const targetTier = (item.metadata?.tier as string || '').toLowerCase().trim();
                        const cTarget = (data.nivel_objetivo || 'todos').toLowerCase().trim();

                        if (cTarget === 'todos' && targetTier !== 'free') isItemEligible = true;
                        if (cTarget === 'pro' && targetTier === 'pro') isItemEligible = true;
                        if (cTarget === 'premium' && targetTier === 'premium') isItemEligible = true;
                        if (cTarget === 'pro_premium' && (targetTier === 'pro' || targetTier === 'premium')) isItemEligible = true;
                    }
                } else {
                    // Es cupón de productor, aplica a sus propios productos según `aplica_a`
                    // Normalizar tipos para comparación
                    if (itemProducerId === producerId && iType !== 'plan') {
                        if (cAppliesTo === 'todos') isItemEligible = true;
                        if ((cAppliesTo === 'beats' || cAppliesTo === 'beat') && iType === 'beat') isItemEligible = true;
                        if ((cAppliesTo === 'sound_kits' || cAppliesTo === 'sound_kit') && iType === 'sound_kit') isItemEligible = true;
                        if ((cAppliesTo === 'servicios' || cAppliesTo === 'servicio' || cAppliesTo === 'service') && iType === 'service') isItemEligible = true;
                    }
                }

                if (isItemEligible) {
                    totalDiscount += item.price * (data.porcentaje_descuento / 100);
                    appliedItems.push(item.id);
                }
            });

            if (appliedItems.length === 0) {
                let errorMessage = "";
                if (producerId) {
                    if (data.aplica_a === 'todos') {
                        errorMessage = "Este cupón es válido solo para productos de este productor que tienes en tu carrito.";
                    } else if (data.aplica_a === 'sound_kits' || data.aplica_a === 'sound_kit') {
                        errorMessage = "Este cupón es válido solo para Sound Kits de este productor.";
                    } else if (data.aplica_a === 'beats' || data.aplica_a === 'beat') {
                        errorMessage = "Este cupón es válido solo para Beats de este productor.";
                    } else if (data.aplica_a === 'servicios' || data.aplica_a === 'servicio' || data.aplica_a === 'service') {
                        errorMessage = "Este cupón es válido solo para Servicios de este productor.";
                    } else {
                        errorMessage = `Este cupón no aplica a los productos que tienes en tu carrito actualmente.`;
                    }
                } else {
                    errorMessage = "Este cupón de administrador solo es válido para nuevas suscripciones.";
                }
                showToast(errorMessage, 'error');
                return;
            }

            setDiscountApplied(true);
            (window as any).tempCouponDiscount = totalDiscount;
            (window as any).tempCouponCode = data.codigo;
            (window as any).tempCouponId = data.id;
            (window as any).tempCouponPercent = data.porcentaje_descuento;
            (window as any).tempCouponAppliedItems = appliedItems;

            showToast(`Cupón aplicado con éxito`, 'success');

        } catch (err) {
            console.error("Error applying coupon:", err);
            showToast("Error al validar cupón.", 'error');
        }
    };

    const handleCheckout = async (method: 'stripe' | 'paypal' = 'stripe') => {
        setCheckingOut(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login?redirect=/cart');
            return;
        }

        if (method === 'paypal') {
            showToast("PayPal estará disponible próximamente. Por ahora usa Tarjeta.", 'info');
            setCheckingOut(false);
            return;
        }

        try {
            const couponId = (window as any).tempCouponId;
            const appliedItems = (window as any).tempCouponAppliedItems || [];
            const couponPercent = (window as any).tempCouponPercent || 0;

            const response = await fetch('/api/checkout/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: items.map(item => {
                        let finalItemPrice = item.price;
                        // Si el item es elegible para el cupón, aplicamos el descuento a su precio final para Stripe
                        if (couponId && appliedItems.includes(item.id)) {
                            finalItemPrice = item.price * (1 - (couponPercent / 100));
                        }

                        return {
                            ...item,
                            price: convertPrice(finalItemPrice)
                        };
                    }),
                    customerEmail: user.email,
                    customerId: user.id,
                    couponId: couponId,
                    currency: currency.toLowerCase()
                }),
            });

            const data = await response.json();

            if (data.error) throw new Error(data.error);

            if (data.url) {
                window.location.href = data.url;
            } else {
                throw new Error("No se pudo generar la sesión de pago.");
            }
        } catch (err: any) {
            console.error("Error en el proceso de compra:", err);
            showToast(err.message || "Lo sentimos, hubo un problema al procesar tu pago.", 'error');
        } finally {
            setCheckingOut(false);
        }
    };

    // Calcular total final dinámico
    const discountAmount = (typeof window !== 'undefined' ? (window as any).tempCouponDiscount : 0) || 0;
    const finalTotal = total - discountAmount;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white transition-all duration-700">
            <Navbar />

            {/* Elementos Ambientales */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 dark:bg-blue-500/10 blur-[200px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/5 dark:bg-purple-500/10 blur-[200px] rounded-full animate-pulse-slow delay-1000" />
            </div>

            {/* pb-24 en móvil: espacio para MobileBottomNav + AudioPlayer */}
            <main className="relative z-10 pt-24 md:pt-32 pb-24 md:pb-16 px-4 sm:px-10 lg:px-16 max-w-[1600px] mx-auto">


                {/* Sección de Título */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-16">
                    <div className="space-y-4 max-w-4xl">
                        <div className="flex items-center gap-4 opacity-100">
                            <Link href="/beats" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-foreground/80 hover:text-foreground transition-all shrink-0">
                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Seguir Comprando
                            </Link>
                        </div>
                        {/* Título compacto en móvil */}
                        <h1 className="text-3xl md:text-[5rem] font-black uppercase tracking-[-0.06em] leading-[0.85] text-foreground mt-4">

                            Carrito <br />
                            <span className="text-blue-500">de Compras.</span>
                        </h1>
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0">
                        <div className="group relative px-8 py-3 bg-card/10 backdrop-blur-3xl border border-foreground/5 rounded-full transition-all hover:bg-card/20 hover:scale-105 flex items-center gap-4 min-w-[140px] shadow-[0_0_30px_rgba(59,130,246,0.2)] dark:shadow-[0_0_30px_rgba(59,130,246,0.1)]">
                            <ShoppingBag className="text-blue-500 w-5 h-5" />
                            <span className="text-xl font-black text-blue-500">{itemCount}</span>
                            <span className="text-[9px] font-black uppercase tracking-[0.2em] opacity-80 leading-tight">productos en<br />el carrito</span>
                        </div>
                    </div>
                </div>

                {itemCount > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 xl:gap-16">
                        {/* Grid apilado en móvil, de lado en lg */}


                        {/* Columna de Productos */}
                        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                            {items.map((item) => {
                                const isBeat = item.type === 'beat';
                                const isPlan = item.type === 'plan';
                                const isSoundKit = item.metadata?.isSoundKit || item.id.includes('kit');
                                const isService = item.id.includes('service');

                                return (
                                    <div key={item.id} className="group relative flex flex-col sm:flex-row items-center gap-8 p-6 md:p-8 bg-card/20 backdrop-blur-md border border-transparent hover:border-foreground/5 dark:hover:border-white/5 rounded-[3.5rem] transition-all duration-700 hover:shadow-[0_30px_60px_-15px_rgba(0,0,0,0.1)] dark:hover:shadow-black/40">

                                        {/* Portada del Artista/Beat */}
                                        <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 overflow-hidden shadow-2xl rounded-[2.5rem] transition-transform duration-700 group-hover:scale-95">
                                            {item.image && !isService ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${isPlan ? (item.metadata?.tier === 'premium' ? 'bg-blue-500/10' : 'bg-amber-500/10') : isService ? 'bg-purple-500/10' : 'bg-foreground/5'} text-foreground/20`}>
                                                    {isPlan ? (
                                                        item.metadata?.tier === 'premium' ?
                                                            <Crown size={36} className="text-blue-500" /> :
                                                            <Star size={36} className="text-amber-500" />
                                                    ) : isService ? <Briefcase size={36} className="text-purple-500" /> : <Music size={36} />}
                                                </div>
                                            )}
                                            {/* Máscara superpuesta */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>

                                        {/* Metadatos Dinámicos del Producto */}
                                        <div className="flex-1 flex flex-col gap-4 text-center sm:text-left">
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.2em] shadow-sm ${isBeat ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                    isPlan ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                        isSoundKit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                            'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                    }`}>
                                                    {isBeat ? 'BEAT' : isPlan ? 'SUSCRIPCIÓN' : isSoundKit ? 'SOUND KIT' : 'SERVICIO'}
                                                </span>

                                                {(isBeat && (item.metadata?.license || item.metadata?.licenseType)) ? (
                                                    <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm ${(item.metadata?.license === 'Básica' || item.metadata?.licenseType === 'Básica') ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                        (item.metadata?.license === 'MP3' || item.metadata?.licenseType === 'MP3') ? 'bg-sky-500/10 text-sky-600 dark:text-sky-400' :
                                                            (item.metadata?.license === 'Pro' || item.metadata?.licenseType === 'Pro') ? 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400' :
                                                                (item.metadata?.license === 'Premium' || item.metadata?.licenseType === 'Premium') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                                    (item.metadata?.license === 'Exclusiva' || item.metadata?.licenseType === 'Exclusiva' || item.metadata?.license === 'Sound Kit' || item.metadata?.licenseType === 'Sound Kit') ? 'bg-rose-500/10 text-rose-600 dark:text-rose-400' :
                                                                        'bg-red-200/20 text-red-400'
                                                        }`}>
                                                        {(item.metadata?.license as string) || (item.metadata?.licenseType as string)}
                                                    </span>
                                                ) : null}

                                                {isPlan && Boolean(item.metadata?.cycle) && (
                                                    <span className={`px-3 py-1 text-[8px] font-black uppercase tracking-[0.2em] rounded-full shadow-sm ${item.metadata?.cycle === 'yearly' ? 'bg-green-600/10 text-green-600' : 'bg-sky-500/10 text-sky-600'}`}>
                                                        {item.metadata?.cycle === 'yearly' ? 'FACTURACIÓN ANUAL' : 'FACTURACIÓN MENSUAL'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-1">
                                                <h3 className="text-2xl md:text-4xl font-black uppercase tracking-tighter text-foreground leading-[0.9] group-hover:translate-x-2 transition-transform duration-500">
                                                    {item.name.split('[')[0].trim()}
                                                </h3>
                                                <p className="text-muted text-[10px] font-bold uppercase tracking-[0.3em] opacity-60">
                                                    {item.subtitle}
                                                </p>
                                                {(isService || isSoundKit) && Boolean(item.metadata?.producerName) && (
                                                    <p className="text-blue-500 text-[9px] font-black uppercase tracking-[0.2em] mt-1">
                                                        {item.metadata?.producerName as string}
                                                    </p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Precios y Control del Producto */}
                                        <div className="flex flex-col items-center sm:items-end justify-between self-stretch py-2 min-w-[120px]">
                                            <span className="text-3xl font-black text-foreground">{formatPrice(item.price)}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="group/btn flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white text-[8px] font-black uppercase tracking-[0.2em] transition-all"
                                            >
                                                <Trash2 size={12} className="group-hover/btn:rotate-12 transition-transform" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}

                            <div className="flex justify-center pt-8">
                                <button
                                    onClick={clearCart}
                                    className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40 hover:opacity-100 hover:text-red-500 transition-all flex items-center gap-2"
                                >
                                    <Trash2 size={12} /> Vaciar Carrito
                                </button>
                            </div>
                        </div>

                        {/* Barra Lateral de Resumen */}
                        <div className="lg:col-span-5 xl:col-span-4">
                            <div className="sticky top-28 bg-blue-500 text-white backdrop-blur-3xl rounded-[2.5rem] p-8 md:p-10 border border-white/20 shadow-[0_20px_50px_-12px_rgba(59,130,246,0.5)] flex flex-col min-h-[500px] overflow-hidden relative">
                                {/* Fondo de efecto líquido */}
                                <div className="absolute inset-0 bg-gradient-to-br from-blue-400/20 to-transparent pointer-events-none" />
                                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 blur-[80px] rounded-full pointer-events-none" />

                                <div className="relative z-10">
                                    <h2 className="text-3xl font-black uppercase tracking-tighter mb-8 leading-none">Resumen <br /><span className="opacity-60">de compra.</span></h2>

                                    <div className="space-y-4 mb-8 pb-8 border-b border-white/20 flex-grow">
                                        <div className="flex justify-between items-center group">
                                            <span className="opacity-70 font-black uppercase tracking-[0.2em] text-[9px]">Subtotal</span>
                                            <span className="text-lg font-black">{formatPrice(total)}</span>
                                        </div>

                                        {discountApplied && typeof window !== 'undefined' && (
                                            <div className="flex justify-between items-center bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 font-black uppercase tracking-[0.3em] text-[10px] animate-in slide-in-from-right-4 duration-500 px-4 py-4 rounded-[1.5rem] shadow-[0_0_20px_rgba(16,185,129,0.1)] mt-4">
                                                <div className="flex gap-2 items-center">
                                                    <Tag size={12} className="text-emerald-400" />
                                                    <span className="text-white">CUPÓN {(window as any).tempCouponCode}</span>
                                                    <span className="text-emerald-400 bg-emerald-500/20 px-2 py-0.5 rounded-lg border border-emerald-500/20">
                                                        -{(window as any).tempCouponPercent}%
                                                    </span>
                                                </div>
                                                <span className="text-emerald-400 text-xs">-{formatPrice(discountAmount)}</span>
                                            </div>
                                        )}

                                        {/* Desplegable de Cupón */}
                                        <div className="pt-2">
                                            {!showCouponInput ? (
                                                <button
                                                    onClick={() => setShowCouponInput(true)}
                                                    className="text-[9px] font-black uppercase tracking-[0.3em] text-white/80 hover:text-white transition-all flex items-center gap-2"
                                                >
                                                    <Tag size={10} /> ¿TIENES UN CÓDIGO?
                                                </button>
                                            ) : (
                                                <div className="flex gap-2 animate-in slide-in-from-top-4 duration-500">
                                                    <input
                                                        type="text"
                                                        placeholder="INGRESA TU CÓDIGO"
                                                        className="flex-1 bg-white/10 border border-white/20 rounded-[1rem] py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:bg-white/20 transition-all text-white placeholder:text-white/40"
                                                        value={coupon}
                                                        onChange={(e) => setCoupon(e.target.value)}
                                                    />
                                                    <button
                                                        onClick={handleApplyCoupon}
                                                        className="px-4 bg-white text-blue-600 rounded-[1rem] font-black text-[10px] uppercase tracking-[0.2em] hover:bg-white/90 transition-all"
                                                    >
                                                        OK
                                                    </button>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="text-[9px] font-black uppercase tracking-[0.5em] text-white/70">Importe Total</span>
                                            <span className="text-[3.5rem] font-black leading-[0.8] tracking-[-0.08em]">{formatPrice(finalTotal)}</span>
                                        </div>

                                        {/* Línea Separadora */}
                                        <div className="w-full h-px bg-white/10" />

                                        {/* Interacción de Pago (Checkout) */}
                                        <div className="space-y-4">
                                            <span className="text-[9px] font-black uppercase tracking-[0.3em] block text-center text-white/60">MÉTODOS DE PAGO ENCRIPTADOS</span>

                                            <button
                                                onClick={() => handleCheckout('stripe')}
                                                disabled={checkingOut}
                                                className="w-full h-16 bg-white text-blue-600 rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-white/10 flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                            >
                                                <div className="flex items-center gap-3">
                                                    <CreditCard size={18} />
                                                    PAGAR CON TARJETA
                                                </div>
                                            </button>
                                        </div>

                                        {/* Insignias de Confianza */}
                                        <div className="grid grid-cols-2 gap-6 text-white/90">
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <ShieldCheck size={18} className="text-white" />
                                                <span className="text-[7px] font-black uppercase tracking-[0.2em] leading-tight drop-shadow-md">SEGURIDAD RSA <br /> ENCRIPTADA</span>
                                            </div>
                                            <div className="flex flex-col items-center gap-2 text-center">
                                                <Zap size={18} className="text-white" />
                                                <span className="text-[7px] font-black uppercase tracking-[0.2em] leading-tight drop-shadow-md">ENTREGA DIGITAL <br /> INSTANTÁNEA</span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                ) : (
                    /* Estado de Carrito Vacío */
                    <div className="py-60 flex flex-col items-center justify-center text-center max-w-4xl mx-auto space-y-16">
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent/20 blur-[120px] rounded-full scale-[2] animate-pulse" />
                            <div className="relative w-48 h-48 bg-card/10 backdrop-blur-3xl border border-foreground/5 rounded-[5rem] flex items-center justify-center shadow-premium-deep">
                                <ShoppingBag className="opacity-10" size={90} strokeWidth={1} />
                            </div>
                        </div>
                        <div className="space-y-8">
                            <h2 className="text-7xl md:text-[9rem] font-black uppercase tracking-[-0.06em] leading-[0.8] text-foreground">
                                Tu Carrito <br />
                                <span className="opacity-5">está vacío.</span>
                            </h2>
                            <p className="text-muted text-xl font-medium tracking-tight max-w-md mx-auto opacity-60">
                                Descubre los mejores beats y herramientas para llevar tu música al siguiente nivel.
                            </p>
                        </div>
                        <Link href="/beats" className="group h-24 px-16 bg-sky-500/10 text-sky-500 rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center gap-8 hover:bg-sky-500 hover:text-white transition-all shadow-premium hover:scale-105 active:scale-95 duration-500">
                            EXPLORAR TIANGUIS
                            <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform duration-500" />
                        </Link>
                    </div>
                )
                }

            </main >

            <Footer />
        </div >
    );
}
