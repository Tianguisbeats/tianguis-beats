"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
    Trash2, ArrowRight, ShoppingBag, Tag, ShieldCheck,
    ChevronLeft, Zap, Music, Loader2, Lock, CreditCard,
    Briefcase, Crown, Package, X, Sparkles, Check, Star
} from 'lucide-react';
import { useCart, isItemEligibleForCoupon } from '@/context/CartContext';

import { useToast } from '@/context/ToastContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { getGlobalConfig, GlobalConfig } from '@/lib/config';
import { supabase } from '@/lib/supabase';
import { useCurrency } from '@/context/CurrencyContext';
import { getLicenseColor } from '@/lib/license-utils';
import { triggerSuccessConfetti } from '@/lib/confetti';

export default function CartPage() {
    const { items, removeItem, total, itemCount, clearCart, appliedCoupons, addCoupon, removeCoupon, discountAmount: contextDiscount, bulkDiscountAmount, itemsWithDiscounts } = useCart();
    const { formatPrice, currency, convertPrice } = useCurrency();
    const { showToast } = useToast();
    const router = useRouter();
    const [coupon, setCoupon] = useState('');
    const [checkingOut, setCheckingOut] = useState(false);
    const [showCouponInput, setShowCouponInput] = useState(false);
    const [removingId, setRemovingId] = useState<string | null>(null);
    const [legalAccepted, setLegalAccepted] = useState(false);
    const [checkoutError, setCheckoutError] = useState<string | null>(null);
    const [config, setConfig] = useState<GlobalConfig | null>(null);

    React.useEffect(() => {
        getGlobalConfig().then(setConfig);
    }, []);

    const handleApplyCoupon = async () => {
        const cleanCode = coupon.trim().toUpperCase();
        if (!cleanCode) return;

        // Verificar si ya está aplicado
        if (appliedCoupons.some(c => c.codigo === cleanCode)) {
            showToast("Este cupón ya ha sido aplicado.", 'info');
            return;
        }

        try {
            const { data: coupons, error } = await supabase
                .from('cupones')
                .select('*')
                .eq('codigo', cleanCode.toUpperCase().trim());

            if (error || !coupons || coupons.length === 0) {
                showToast(`No pudimos encontrar el cupón "${cleanCode}". Revisa que esté bien escrito.`, 'error');
                return;
            }

            // Filtrar y validar candidatos
            const now = new Date();
            const { data: userData } = await supabase.auth.getUser();
            let userTier = 'free';
            
            if (userData.user) {
                const { data: profile } = await supabase.from('perfiles').select('nivel_suscripcion').eq('id', userData.user.id).single();
                userTier = (profile?.nivel_suscripcion || 'free').toLowerCase().trim();
            }

            const validCandidates = coupons.filter(cp => {
                // 1. Activo
                if (!cp.es_activo) return false;
                // 2. Expiración
                if (cp.fecha_expiracion && new Date(cp.fecha_expiracion) < now) return false;
                // 3. Límite de usos
                if (cp.usos_maximos && cp.usos_actuales >= cp.usos_maximos) return false;
                // 4. Nivel de suscripción
                if (cp.nivel_objetivo && cp.nivel_objetivo !== 'todos') {
                    if (cp.nivel_objetivo === 'gratis' && userTier !== 'free') return false;
                    if (cp.nivel_objetivo === 'pro' && userTier !== 'pro' && cp.aplica_a !== 'suscripciones') return false;
                    if (cp.nivel_objetivo === 'premium' && userTier !== 'premium' && cp.aplica_a !== 'suscripciones') return false;
                }
                return true;
            });

            if (validCandidates.length === 0) {
                showToast(`El cupón "${cleanCode}" no está disponible o ha caducado.`, 'info');
                return;
            }

            // --- SELECCIÓN INTELIGENTE ---
            // Buscamos todos los cupones que apliquen a ALGO del carrito
            const matchingCoupons = validCandidates.filter(cp => 
                items.some(item => isItemEligibleForCoupon(item, cp))
            );

            if (matchingCoupons.length === 0) {
                // Si ninguno coincide con los productos, informamos según el primero
                const data = validCandidates[0];
                let msg = "Cupón válido, pero no aplica a los productos de tu carrito.";
                if (data.aplica_a === 'beats' || data.aplica_a === 'beat') msg = "Este cupón solo es válido para licencias de Beats.";
                if (data.aplica_a === 'sound_kits' || data.aplica_a === 'sound_kit') msg = "Este cupón solo aplica para Sound Kits.";
                if (data.aplica_a === 'servicios' || data.aplica_a === 'servicio') msg = "Este cupón es exclusivo para Servicios.";
                if (data.aplica_a === 'suscripciones') msg = "Este cupón solo aplica para planes de Suscripción.";
                showToast(msg, 'warning');
                return;
            }

            // Aplicar todos los que coincidan (blindaje multi-productor)
            matchingCoupons.forEach(cp => addCoupon(cp));
            triggerSuccessConfetti();
            
            showToast(`¡Excelente! Cupón "${cleanCode}" aplicado con éxito.`, 'success');
            
            setCoupon('');
        } catch (err) {
            showToast("Hubo un problema al validar el cupón o el cupón no es válido.", 'error');
        }
    };


    const handleCheckout = async (method: 'stripe' | 'paypal' = 'stripe') => {
        setCheckingOut(true);
        setCheckoutError(null);
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) { router.push('/login?redirect=/cart'); return; }
        if (config?.ventas_habilitadas === false) {
            showToast("Ventas pausadas temporalmente", "info");
            setCheckingOut(false);
            return;
        }
        if (method === 'paypal') { showToast("PayPal estará disponible próximamente.", 'info'); setCheckingOut(false); return; }

        try {
            // Recolectar IDs de cupones para metadata (opcional, Stripe solo admite uno nativo pero calculamos precio manual)
            const couponIds = appliedCoupons.map(c => c.id).join(',');

            const response = await fetch('/api/checkout/stripe', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    items: itemsWithDiscounts.map(item => {
                        let bestDiscountPercent = 0;
                        let bestCouponId: string | null = null;

                        appliedCoupons.forEach(cp => {
                            if (isItemEligibleForCoupon(item, cp)) {
                                if (cp.porcentaje_descuento > bestDiscountPercent) {
                                    bestDiscountPercent = cp.porcentaje_descuento;
                                    bestCouponId = cp.id;
                                }
                            }
                        });

                        const bestCoupon = appliedCoupons.find(cp => cp.id === bestCouponId);
                        const isStripeCoupon = Boolean(bestCoupon?.id_cupon_stripe);

                        // Si es un cupón de Stripe, enviamos el precio actual (que puede ser 0 por Bulk)
                        // Si NO es Stripe, aplicamos el descuento manual sobre el precio actual
                        const finalItemPrice = isStripeCoupon 
                            ? item.price 
                            : item.price * (1 - (bestDiscountPercent / 100));

                        return {
                            ...item,
                            price: convertPrice(finalItemPrice),
                            appliedCouponId: bestCouponId,
                            discountPercent: bestDiscountPercent
                        };
                    }),
                    customerEmail: user.email,
                    customerId: user.id,
                    couponIds,
                    promotionCode: appliedCoupons.find(c => c.id_cupon_stripe)?.id_cupon_stripe || null,
                    currency: currency.toLowerCase()
                }),
            });

            const data = await response.json();
            if (data.error) throw new Error(data.error);
            if (data.url) { window.location.href = data.url; }
            else { throw new Error("No se pudo generar la sesión de pago."); }
        } catch (err: any) {
            console.error("Checkout Error:", err);
            setCheckoutError(err.message || "Hubo un problema al procesar tu pago.");
            showToast(err.message || "Hubo un problema al procesar tu pago.", 'error');
        } finally {
            setCheckingOut(false);
        }
    };

    const handleRemove = (id: string) => {
        setRemovingId(id);
        setTimeout(() => { removeItem(id); setRemovingId(null); }, 300);
    };

    const discountAmount = contextDiscount;
    const finalTotal = total - discountAmount - bulkDiscountAmount;

    const getItemConfig = (item: typeof items[0]) => {
        const isSoundKit = item.metadata?.isSoundKit || item.id.includes('kit') || item.type === 'sound_kit';
        const isService = item.id.includes('service') || item.type === 'service';
        const isPlan = item.type === 'plan';
        const tier = item.metadata?.tier;

        if (isPlan) {
            if (tier?.toLowerCase() === 'premium') {
                return { label: 'Plan Premium', color: 'bg-blue-500/10 text-blue-500 border-blue-500/20', icon: <Crown size={32} className="text-blue-500" /> };
            }
            return { label: 'Plan Pro', color: 'bg-amber-500/10 text-amber-500 border-amber-500/20', icon: <Star size={32} className="text-amber-500" fill="currentColor" /> };
        }
        if (isSoundKit) return { label: 'Sound Kit', color: 'bg-orange-500/10 text-orange-500 border-orange-500/20', icon: <Package size={32} className="text-orange-500" /> };
        if (isService) return { label: 'Servicio', color: 'bg-purple-500/10 text-purple-500 border-purple-500/20', icon: <Briefcase size={32} className="text-purple-500" /> };
        return { label: 'Beat', color: 'bg-accent/10 text-accent border-accent/20', icon: <Music size={32} className="text-accent" /> };
    };

    return (
        <div className="min-h-screen bg-background text-foreground">
            <Navbar />

            {/* Ambient glow */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[60%] h-[60%] bg-accent/5 blur-[200px] rounded-full" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[60%] h-[60%] bg-blue-500/5 blur-[200px] rounded-full" />
            </div>

            <main className="relative z-10 pt-20 md:pt-28 pb-32 px-4 sm:px-8 lg:px-16 max-w-[1400px] mx-auto">

                {/* Header */}
                <div className="mb-8 md:mb-16 space-y-6">
                    <Link href="/beats" className="group inline-flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted hover:text-foreground transition-all">
                        <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" /> Seguir Comprando
                    </Link>
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent mb-3">Tianguis Beats</p>
                            <h1 className="text-3xl md:text-7xl font-black uppercase tracking-tighter leading-[0.85] text-foreground">
                                Carrito<br /><span className="text-accent">de Compras</span>
                            </h1>
                        </div>
                        {itemCount > 0 && (
                            <div className="flex items-center gap-4 px-6 py-4 bg-card border border-border rounded-[2rem] shadow-sm">
                                <div className="w-10 h-10 bg-accent/10 text-accent rounded-xl flex items-center justify-center">
                                    <ShoppingBag size={20} />
                                </div>
                                <div>
                                    <span className="text-2xl font-black text-foreground tracking-tighter">{itemCount}</span>
                                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">{itemCount === 1 ? 'producto' : 'productos'}</p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {itemCount > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 xl:gap-16">

                        {/* ── Product List ── */}
                        <div className="lg:col-span-7 xl:col-span-8 space-y-4">
                            {items.map((item) => {
                                const config = getItemConfig(item);
                                const licenseLabel = item.metadata?.license || item.metadata?.licenseType as string;
                                const isRemoving = removingId === item.id;

                                // Calcular elegibilidad para el mejor descuento disponible
                                const itemProducerId = item.metadata?.productor_id || item.metadata?.producerId || item.metadata?.producer_id || item.metadata?.seller_id;
                                const iType = String(item.type || '').toLowerCase().trim();
                                let bestItemDiscountPercent = 0;

                                appliedCoupons.forEach(cp => {
                                    if (isItemEligibleForCoupon(item, cp)) {
                                        bestItemDiscountPercent = Math.max(bestItemDiscountPercent, cp.porcentaje_descuento);
                                    }
                                });


                                const isItemEligible = bestItemDiscountPercent > 0;
                                const discountedPrice = isItemEligible ? item.price * (1 - (bestItemDiscountPercent / 100)) : item.price;

                                return (
                                    <div
                                        key={item.id}
                                        className={`group relative bg-card border border-border rounded-[2.5rem] overflow-hidden transition-all duration-500 hover:border-accent/30 hover:shadow-2xl hover:shadow-accent/5 ${isRemoving ? 'opacity-0 scale-95 -translate-x-4' : 'opacity-100'}`}
                                    >
                                        <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[60px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />

                                        <div className="flex flex-col sm:flex-row items-center gap-6 p-6 sm:p-8">
                                            {/* Cover */}
                                            <div className="relative w-24 h-24 sm:w-28 sm:h-28 shrink-0 rounded-[1.5rem] overflow-hidden shadow-lg">
                                                {item.image ? (
                                                    <img src={item.image} alt={item.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                                                ) : (
                                                    <div className={`w-full h-full flex items-center justify-center border ${config.color}`}>
                                                        {config.icon}
                                                    </div>
                                                )}
                                            </div>

                                            {/* Metadata */}
                                            <div className="flex-1 min-w-0 text-center sm:text-left space-y-3">
                                                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                    <span className={`px-3 py-1 border rounded-full text-[8px] font-black uppercase tracking-widest ${config.color}`}>
                                                        {config.label}
                                                    </span>
                                                    {licenseLabel && (
                                                        <span className={`px-3 py-1 border rounded-full text-[8px] font-black uppercase tracking-widest ${getLicenseColor(String(licenseLabel))}`}>
                                                            {String(licenseLabel)}
                                                        </span>
                                                    )}
                                                    {Boolean(item.metadata?.cycle) && (
                                                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest">
                                                            {item.metadata?.cycle === 'yearly' ? 'Anual' : 'Mensual'}
                                                        </span>
                                                    )}
                                                    {isItemEligible && (
                                                        <span className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 rounded-full text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                            <Sparkles size={10} /> CUPÓN APLICADO
                                                        </span>
                                                    )}
                                                </div>
                                                <h3 className="text-2xl sm:text-3xl font-black uppercase tracking-tighter text-foreground leading-none group-hover:text-accent transition-colors duration-500">
                                                    {item.name.split('[')[0].trim()}
                                                </h3>
                                                {item.subtitle && (
                                                    <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em] opacity-60">{item.subtitle}</p>
                                                )}
                                                {Boolean(item.metadata?.producerName) && (
                                                    <p className="text-[9px] font-black text-accent uppercase tracking-widest">
                                                        por {item.metadata?.producerName as string}
                                                    </p>
                                                )}
                                            </div>

                                            {/* Price + Remove */}
                                            <div className="flex sm:flex-col items-center sm:items-end gap-4 sm:gap-3 shrink-0 sm:self-stretch sm:justify-between sm:py-1">
                                                <div className="flex flex-col items-end">
                                                    {isItemEligible && (
                                                        <span className="text-[10px] font-black text-muted line-through opacity-50 tracking-tighter">
                                                            {formatPrice(item.price)}
                                                        </span>
                                                    )}
                                                    <span className={`text-3xl font-black tracking-tighter ${isItemEligible ? 'text-emerald-500' : 'text-foreground'}`}>
                                                        {formatPrice(discountedPrice)}
                                                    </span>
                                                </div>
                                                <button
                                                    onClick={() => handleRemove(item.id)}
                                                    className="group/del flex items-center gap-2 px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white hover:border-red-500 text-[8px] font-black uppercase tracking-widest transition-all active:scale-95"
                                                >
                                                    <Trash2 size={13} className="group-hover/del:rotate-12 transition-transform" />
                                                    Eliminar
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                );
                            })}

                            {/* Clear all */}
                            <div className="flex justify-end pt-4">
                                <button
                                    onClick={clearCart}
                                    className="flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.3em] text-muted/40 hover:text-red-500 hover:opacity-100 transition-all"
                                >
                                    <X size={12} /> Vaciar Carrito
                                </button>
                            </div>
                        </div>

                        {/* ── Order Summary Sidebar ── */}
                        <div className="lg:col-span-5 xl:col-span-4">
                            <div className="sticky top-28 space-y-4">
                                {/* Main summary card */}
                                <div className="relative bg-card border border-border rounded-[2.5rem] overflow-hidden">
                                    {/* Decorative glow */}
                                    <div className="absolute top-0 right-0 w-48 h-48 bg-accent/10 blur-[80px] rounded-full -mr-24 -mt-24 pointer-events-none" />

                                    <div className="relative z-10 p-8 space-y-6">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 bg-accent/10 border border-accent/20 text-accent rounded-xl flex items-center justify-center">
                                                <ShoppingBag size={16} />
                                            </div>
                                            <h2 className="font-black text-base uppercase tracking-widest text-foreground">Resumen de Pedido</h2>
                                        </div>

                                        {/* Line items */}
                                        <div className="space-y-3 pb-4 border-b border-border">
                                            {items.map(item => {
                                                // Calcular mejor descuento para este item específico
                                                const itemProducerId = item.metadata?.productor_id || item.metadata?.producerId || item.metadata?.producer_id || item.metadata?.seller_id;
                                                const iTypeForSummary = String(item.type || '').toLowerCase().trim();
                                                let bestItemDiscountPercent = 0;
                                                appliedCoupons.forEach(cp => {
                                                    if (isItemEligibleForCoupon(item, cp)) {
                                                        bestItemDiscountPercent = Math.max(bestItemDiscountPercent, cp.porcentaje_descuento);
                                                    }
                                                });

                                                const discountPrice = bestItemDiscountPercent > 0 ? item.price * (1 - (bestItemDiscountPercent / 100)) : item.price;

                                                return (
                                                    <div key={item.id} className="flex items-center justify-between gap-4">
                                                        <div className="min-w-0">
                                                            <span className="text-[10px] font-bold text-muted uppercase tracking-widest block truncate max-w-[150px]">
                                                                {item.name.split('[')[0].trim()}
                                                            </span>
                                                            {bestItemDiscountPercent > 0 && (
                                                                <span className="text-[8px] font-black text-emerald-500 uppercase tracking-widest">
                                                                    {appliedCoupons.find(cp => cp.porcentaje_descuento === bestItemDiscountPercent)?.texto_descuento || `CUPÓN APLICADO`}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="flex flex-col items-end shrink-0">
                                                            {bestItemDiscountPercent > 0 && (
                                                                <span className="text-[9px] font-bold text-muted line-through opacity-40">
                                                                    {formatPrice(item.price)}
                                                                </span>
                                                            )}
                                                            <span className={`font-black text-sm ${bestItemDiscountPercent > 0 ? 'text-emerald-500' : 'text-foreground'}`}>
                                                                {formatPrice(discountPrice)}
                                                            </span>
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Coupon section */}
                                        <div className="space-y-3">
                                            {appliedCoupons.length > 0 && (
                                                <div className="space-y-2">
                                                    {appliedCoupons.map((cp) => (
                                                        <div key={cp.id} className="flex items-center justify-between px-4 py-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl group relative overflow-hidden">
                                                            <div className="flex items-center gap-2">
                                                                <Check size={14} className="text-emerald-500 shrink-0" />
                                                                <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">
                                                                    {cp.codigo} ({cp.texto_descuento || `-${cp.porcentaje_descuento}%`})
                                                                </span>
                                                            </div>
                                                            <button
                                                                onClick={() => removeCoupon(cp.id)}
                                                                className="p-1 hover:bg-rose-500/20 text-muted hover:text-rose-500 rounded-md transition-all shrink-0"
                                                            >
                                                                <X size={12} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {!showCouponInput ? (
                                                <button
                                                    onClick={() => setShowCouponInput(true)}
                                                    className="flex items-center gap-2 text-[9px] font-black text-muted hover:text-accent uppercase tracking-widest transition-all"
                                                >
                                                    <Tag size={12} /> {appliedCoupons.length > 0 ? '¿Tienes otro cupón?' : '¿Tienes un cupón de descuento?'}
                                                </button>
                                            ) : (
                                                <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                                    <input
                                                        type="text"
                                                        placeholder="CÓDIGO"
                                                        value={coupon}
                                                        onChange={e => setCoupon(e.target.value)}
                                                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                                                        className="flex-1 bg-foreground/5 border border-border rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-[0.2em] outline-none focus:border-accent transition-all"
                                                    />
                                                    <div className="flex gap-1">
                                                        <button
                                                            onClick={handleApplyCoupon}
                                                            className="px-4 bg-accent text-white rounded-xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all"
                                                        >
                                                            OK
                                                        </button>
                                                        <button
                                                            onClick={() => setShowCouponInput(false)}
                                                            className="p-3 bg-foreground/5 text-muted hover:text-foreground rounded-xl transition-all"
                                                        >
                                                            <X size={14} />
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>

                                        {/* Detalle de Descuentos */}
                                        {(discountAmount > 0 || bulkDiscountAmount > 0) && (
                                            <div className="space-y-3 pb-6 border-b border-border/50">
                                                <div className="flex justify-between items-center">
                                                    <span className="text-[10px] font-bold text-muted uppercase tracking-widest">Subtotal</span>
                                                    <span className="text-xs font-black text-foreground">{formatPrice(total)}</span>
                                                </div>
                                                
                                                {discountAmount > 0 && (
                                                    <div className="flex justify-between items-center animate-in slide-in-from-right-2 duration-300">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-emerald-500/10 rounded-md">
                                                                <Tag size={10} className="text-emerald-500" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-emerald-500 uppercase tracking-widest">Descuento Cupón</span>
                                                        </div>
                                                        <span className="text-xs font-black text-emerald-500">-{formatPrice(discountAmount)}</span>
                                                    </div>
                                                )}

                                                {bulkDiscountAmount > 0 && (
                                                    <div className="flex justify-between items-center animate-in slide-in-from-right-2 duration-300">
                                                        <div className="flex items-center gap-2">
                                                            <div className="p-1 bg-blue-500/10 rounded-md">
                                                                <Sparkles size={10} className="text-blue-500" />
                                                            </div>
                                                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Ahorro por Volumen</span>
                                                        </div>
                                                        <span className="text-xs font-black text-blue-500">-{formatPrice(bulkDiscountAmount)}</span>
                                                    </div>
                                                )}
                                            </div>
                                        )}

                                        {/* Total */}
                                        <div className="space-y-4">
                                            <div className="flex items-end justify-between pt-2 border-t border-border">
                                                <div>
                                                    <p className="text-[9px] font-black text-muted uppercase tracking-[0.3em]">Total a Pagar</p>
                                                    {(discountAmount > 0 || bulkDiscountAmount > 0) && (
                                                        <p className="text-[9px] font-black text-emerald-500 uppercase tracking-widest mt-1">
                                                            Ahorras {formatPrice(discountAmount + bulkDiscountAmount)} en total
                                                        </p>
                                                    )}
                                                </div>
                                                <span className="text-4xl font-black text-foreground tracking-tighter">{formatPrice(finalTotal)}</span>
                                            </div>
                                        </div>


                                        {/* Legal Acceptance Checkbox */}
                                        <div className="space-y-3">
                                            {!legalAccepted ? (
                                                <div className="animate-in fade-in slide-in-from-bottom-2 duration-500">
                                                    <label
                                                        htmlFor="legal-accept"
                                                        className="flex items-start gap-3 p-4 rounded-2xl border border-dashed border-accent/30 bg-accent/5 cursor-pointer hover:border-accent/50 transition-all"
                                                    >
                                                        <div className="relative shrink-0 mt-0.5">
                                                            <input
                                                                id="legal-accept"
                                                                type="checkbox"
                                                                checked={legalAccepted}
                                                                onChange={e => setLegalAccepted(e.target.checked)}
                                                                className="sr-only"
                                                            />
                                                            <div className="w-5 h-5 rounded-md border-2 border-accent flex items-center justify-center bg-transparent">
                                                                {legalAccepted && <Check size={11} className="text-white" strokeWidth={3} />}
                                                            </div>
                                                        </div>
                                                        <p className="text-[10px] font-bold text-muted leading-relaxed">
                                                            Acepto los <Link href="/terms" target="_blank" className="text-accent underline font-black">Términos</Link> y el <Link href="/licencias" target="_blank" className="text-accent underline font-black">Acuerdo de Licencia</Link>. Entiendo que los productos digitales <strong className="text-foreground">no son reembolsables</strong>.
                                                        </p>
                                                    </label>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-between px-4 py-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl animate-in zoom-in-95 duration-300">
                                                    <div className="flex items-center gap-2">
                                                        <div className="w-4 h-4 bg-emerald-500 rounded-full flex items-center justify-center">
                                                            <Check size={10} className="text-white" strokeWidth={4} />
                                                        </div>
                                                        <span className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Términos Aceptados</span>
                                                    </div>
                                                    <button 
                                                        onClick={() => setLegalAccepted(false)}
                                                        className="text-[8px] font-black text-muted hover:text-foreground uppercase tracking-widest underline decoration-dotted"
                                                    >
                                                        Cambiar
                                                    </button>
                                                </div>
                                            )}
                                        </div>

                                        {/* Checkout Error Alert */}
                                        {checkoutError && (
                                            <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl flex items-start gap-3 animate-in fade-in slide-in-from-top-2 duration-300">
                                                <X className="text-red-500 shrink-0 mt-0.5" size={16} onClick={() => setCheckoutError(null)} />
                                                <div className="space-y-1">
                                                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest">Error de Pago</p>
                                                    <p className="text-[10px] font-medium text-muted leading-relaxed">
                                                        {checkoutError}
                                                    </p>
                                                </div>
                                            </div>
                                        )}

                                        {/* CTA Button */}
                                        <button
                                            onClick={() => {
                                                if (config?.ventas_habilitadas === false) {
                                                    showToast("Ventas pausadas temporalmente", "info");
                                                    return;
                                                }
                                                handleCheckout('stripe');
                                            }}
                                            disabled={checkingOut || !legalAccepted || config?.ventas_habilitadas === false}
                                            className={`w-full h-16 sm:h-20 rounded-[1.5rem] active:scale-[0.98] transition-all relative overflow-hidden flex items-center justify-center ${
                                                legalAccepted && config?.ventas_habilitadas !== false
                                                    ? 'shadow-xl shadow-[#635BFF]/30 hover:shadow-[#635BFF]/40 cursor-pointer'
                                                    : 'cursor-not-allowed border border-border/50'
                                            }`}
                                        >
                                            {!checkingOut ? (
                                                <div className="relative w-full h-full">
                                                    {config?.ventas_habilitadas === false ? (
                                                        <div className="absolute inset-0 bg-zinc-900 flex flex-col items-center justify-center gap-2">
                                                            <Lock size={24} className="text-zinc-500" />
                                                            <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">Ventas Pausadas</span>
                                                        </div>
                                                    ) : (
                                                        <img 
                                                            src="/images/stripe/stripe-custom-button.png" 
                                                            alt="Pagar con Stripe" 
                                                            className={`absolute inset-0 w-full h-full object-cover rounded-[1.5rem] transition-all duration-500 origin-center ${
                                                                legalAccepted 
                                                                    ? 'opacity-100 hover:scale-[1.03] filter-none' 
                                                                    : 'opacity-40 grayscale sepia-[0.3] brightness-75 hover:opacity-50'
                                                            }`}
                                                        />
                                                    )}
                                                    {/* Dark overlay to make it look disabled */}
                                                    {(!legalAccepted && config?.ventas_habilitadas !== false) && (
                                                        <div className="absolute inset-0 bg-background/20 rounded-[1.5rem]" />
                                                    )}
                                                </div>
                                            ) : (
                                                <div className="absolute inset-0 bg-background/80 flex items-center justify-center rounded-[1.5rem] backdrop-blur-sm z-20">
                                                    <Loader2 size={24} className="animate-spin text-accent" />
                                                </div>
                                            )}
                                        </button>

                                        {/* Trust badges */}
                                        <div className="grid grid-cols-2 gap-3">
                                            {[
                                                { icon: <Lock size={14} />, label: 'Pago Encriptado SSL' },
                                                { icon: <Zap size={14} />, label: 'Entrega Instantánea' },
                                                { icon: <ShieldCheck size={14} />, label: 'Compra Protegida' },
                                                { icon: <Sparkles size={14} />, label: 'Licencia Incluida' },
                                            ].map((badge, i) => (
                                                <div key={i} className="flex items-center gap-2 px-3 py-2.5 bg-foreground/[0.03] border border-border rounded-xl">
                                                    <span className="text-accent shrink-0">{badge.icon}</span>
                                                    <span className="text-[8px] font-black text-muted uppercase tracking-widest leading-tight">{badge.label}</span>
                                                </div>
                                            ))}
                                        </div>

                                        <p className="text-[8px] font-bold text-muted text-center uppercase tracking-widest opacity-40">
                                            Procesado de forma segura por Stripe
                                        </p>
                                    </div>
                                </div>

                                {/* Security banner */}
                                <div className="px-6 py-5 bg-card border border-border rounded-[2rem] flex items-center gap-4 shadow-sm">
                                    <div className="w-10 h-10 bg-emerald-500/10 text-emerald-500 rounded-2xl flex items-center justify-center shrink-0">
                                        <ShieldCheck size={20} />
                                    </div>
                                    <div className="space-y-0.5">
                                        <p className="text-[10px] font-black text-foreground uppercase tracking-widest">Compra Protegida</p>
                                        <p className="text-[9px] font-bold text-muted leading-relaxed">
                                            Tus datos están encriptados y procesados de forma segura por Stripe. Tu información técnica nunca toca nuestros servidores.
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty cart state */
                    <div className="py-48 flex flex-col items-center justify-center text-center max-w-2xl mx-auto space-y-12">
                        <div className="relative">
                            <div className="absolute inset-0 bg-accent/10 blur-[100px] rounded-full scale-[2] animate-pulse" />
                            <div className="relative w-40 h-40 bg-card border border-border rounded-[3.5rem] flex items-center justify-center shadow-2xl">
                                <ShoppingBag className="text-muted/20" size={72} strokeWidth={1} />
                            </div>
                        </div>
                        <div className="space-y-4">
                            <p className="text-[9px] font-black uppercase tracking-[0.4em] text-accent">Tianguis Beats</p>
                            <h2 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.8] text-foreground">
                                Carrito<br /><span className="opacity-10">Vacío</span>
                            </h2>
                            <p className="text-muted font-medium leading-relaxed max-w-sm mx-auto">
                                Descubre los mejores beats y herramientas para llevar tu música al siguiente nivel.
                            </p>
                        </div>
                        <Link
                            href="/beats"
                            className="group h-16 px-12 bg-accent text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.3em] flex items-center gap-4 hover:opacity-90 active:scale-95 transition-all shadow-xl shadow-accent/30"
                        >
                            Explorar Tianguis
                            <ArrowRight size={18} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
