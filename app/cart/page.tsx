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
    Mail
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { supabase } from '@/lib/supabase';

export default function CartPage() {
    const { items, removeItem, total, itemCount, clearCart } = useCart();
    const router = useRouter();
    const [coupon, setCoupon] = useState('');
    const [discountApplied, setDiscountApplied] = useState(false);
    const [checkingOut, setCheckingOut] = useState(false);
    const [showCouponInput, setShowCouponInput] = useState(false);

    const formatPrice = (price: number) => {
        return new Intl.NumberFormat("es-MX", {
            style: "currency",
            currency: "MXN",
            maximumFractionDigits: 0,
        }).format(price);
    };

    const handleApplyCoupon = () => {
        if (coupon.toUpperCase() === 'TIANGUIS20') {
            setDiscountApplied(true);
            alert("¡Cupón aplicado con éxito! 20% de descuento incluido.");
        } else {
            alert("El código ingresado no es válido.");
        }
    };

    const handleCheckout = async () => {
        setCheckingOut(true);
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            router.push('/login?redirect=/cart');
            return;
        }

        try {
            for (const item of items) {
                if (item.type === 'beat') {
                    const { error } = await supabase.from('sales').insert({
                        buyer_id: user.id,
                        seller_id: item.metadata?.producer_id || '99999999-9999-9999-9999-999999999999',
                        beat_id: item.id,
                        amount: discountApplied ? item.price * 0.8 : item.price,
                        license_type: item.metadata?.licenseType || 'basic'
                    });
                    if (error) console.error("Error registrando venta de beat:", error);
                }
                else if (item.type === 'license' && item.metadata?.isSoundKit) {
                    const { error } = await supabase.from('sales').insert({
                        buyer_id: user.id,
                        seller_id: item.metadata?.producer_id || '99999999-9999-9999-9999-999999999999',
                        amount: discountApplied ? item.price * 0.8 : item.price,
                        license_type: 'SOUNDKIT'
                    });
                    if (error) console.error("Error registrando venta de sound kit:", error);
                }
            }

            localStorage.setItem('last_purchase', JSON.stringify(items.map(i => ({
                ...i,
                price: discountApplied ? i.price * 0.8 : i.price,
                licenseType: i.metadata?.licenseType || 'basic'
            }))));

            clearCart();
            router.push('/checkout/success');
        } catch (err) {
            console.error("Error en el proceso de compra:", err);
            alert("Lo sentimos, hubo un problema al procesar tu solicitud.");
        } finally {
            setCheckingOut(false);
        }
    };

    const finalTotal = discountApplied ? total * 0.8 : total;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white transition-all duration-700">
            <Navbar />

            {/* Elite Ambient Elements */}
            <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
                <div className="absolute top-[-20%] right-[-10%] w-[70%] h-[70%] bg-blue-600/5 dark:bg-blue-500/10 blur-[200px] rounded-full animate-pulse-slow" />
                <div className="absolute bottom-[-20%] left-[-10%] w-[70%] h-[70%] bg-purple-600/5 dark:bg-purple-500/10 blur-[200px] rounded-full animate-pulse-slow delay-1000" />
            </div>

            <main className="relative z-10 pt-32 pb-40 px-6 sm:px-10 lg:px-16 max-w-[1600px] mx-auto">

                {/* Elite Title Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-12 mb-24">
                    <div className="space-y-6 max-w-4xl">
                        <div className="flex items-center gap-4 opacity-40">
                            <Link href="/beats" className="group flex items-center gap-2 text-[9px] font-black uppercase tracking-[0.4em] hover:text-accent transition-all shrink-0">
                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Catálogo
                            </Link>
                            <span className="w-px h-3 bg-foreground/20" />
                            <span className="text-[9px] font-black uppercase tracking-[0.4em] text-accent">Tu Carrito</span>
                        </div>
                        <h1 className="text-7xl md:text-[11rem] font-black uppercase tracking-[-0.06em] leading-[0.8] text-foreground">
                            Carrito <br />
                            <span className="opacity-5 dark:opacity-10">de Compras.</span>
                        </h1>
                    </div>

                    <div className="flex flex-col items-end gap-4 shrink-0">
                        <div className="group relative px-12 py-8 bg-card/10 backdrop-blur-3xl border border-foreground/5 rounded-[3rem] transition-all hover:bg-card/20 hover:scale-105">
                            <div className="absolute -top-3 -right-3 w-10 h-10 bg-accent text-white rounded-2xl flex items-center justify-center font-black text-xs shadow-xl shadow-accent/20">
                                {itemCount}
                            </div>
                            <div className="flex flex-col items-end">
                                <span className="text-4xl font-black">{formatPrice(total)}</span>
                                <span className="text-[9px] font-black uppercase tracking-[0.3em] opacity-40">Subtotal de tu orden</span>
                            </div>
                        </div>
                        <button
                            onClick={clearCart}
                            className="text-[9px] font-black uppercase tracking-[0.3em] opacity-20 hover:opacity-100 hover:text-red-500 transition-all flex items-center gap-2 mr-6 uppercase"
                        >
                            <Trash2 size={12} /> Vaciar Todo
                        </button>
                    </div>
                </div>

                {itemCount > 0 ? (
                    <div className="grid lg:grid-cols-12 gap-16 xl:gap-24">

                        {/* Elite Products Column */}
                        <div className="lg:col-span-7 xl:col-span-8 space-y-8">
                            {items.map((item) => {
                                const isBeat = item.type === 'beat';
                                const isPlan = item.type === 'plan';
                                const isSoundKit = item.metadata?.isSoundKit || item.id.includes('kit');
                                const isService = item.id.includes('service');

                                return (
                                    <div key={item.id} className="group relative flex flex-col sm:flex-row items-center gap-10 p-8 md:p-10 bg-card/20 backdrop-blur-md border border-transparent hover:border-foreground/5 dark:hover:border-white/5 rounded-[4rem] transition-all duration-700 hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.1)] dark:hover:shadow-black/40">

                                        {/* Artist/Beat Cover */}
                                        <div className="relative w-36 h-36 md:w-44 md:h-44 shrink-0 overflow-hidden shadow-2xl rounded-[3rem] transition-transform duration-700 group-hover:scale-95">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${isPlan ? 'bg-accent' : 'bg-foreground/5'} text-foreground/20`}>
                                                    {isPlan ? <Star size={48} className="text-white" fill="currentColor" /> : <Music size={48} />}
                                                </div>
                                            )}
                                            {/* Mask Overlay */}
                                            <div className="absolute inset-0 bg-gradient-to-tr from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>

                                        {/* Dynamic Product Metadata */}
                                        <div className="flex-1 flex flex-col gap-6 text-center sm:text-left">
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-[0.2em] shadow-sm ${isBeat ? 'bg-blue-500/10 text-blue-600 dark:text-blue-400' :
                                                        isPlan ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' :
                                                            isSoundKit ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                                'bg-purple-500/10 text-purple-600 dark:text-purple-400'
                                                    }`}>
                                                    {isBeat ? 'BEAT' : isPlan ? 'SUSCRIPCIÓN' : isSoundKit ? 'SOUND KIT' : 'SERVICIO'}
                                                </span>

                                                {isBeat && item.metadata?.license && (
                                                    <span className="px-4 py-1.5 bg-foreground/5 dark:bg-white/5 text-foreground/60 dark:text-white/40 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                                                        {item.metadata.license}
                                                    </span>
                                                )}

                                                {isPlan && item.metadata?.cycle && (
                                                    <span className="px-4 py-1.5 bg-foreground/5 dark:bg-white/5 text-foreground/40 text-[9px] font-black uppercase tracking-[0.2em] rounded-full">
                                                        {item.metadata.cycle === 'yearly' ? 'FACTURACIÓN ANUAL' : 'FACTURACIÓN MENSUAL'}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="space-y-2">
                                                <h3 className="text-3xl md:text-5xl font-black uppercase tracking-tighter text-foreground leading-[0.9] group-hover:translate-x-2 transition-transform duration-500">
                                                    {item.name.split('[')[0].trim()}
                                                </h3>
                                                <p className="text-muted text-[11px] font-bold uppercase tracking-[0.3em] opacity-60">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Product Pricing & Control */}
                                        <div className="flex flex-col items-center sm:items-end justify-between self-stretch py-4 min-w-[140px]">
                                            <span className="text-4xl font-black text-foreground">{formatPrice(item.price)}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="group/btn flex items-center gap-3 px-6 py-3 rounded-2xl bg-foreground/5 hover:bg-red-500/10 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.2em] transition-all"
                                            >
                                                <Trash2 size={14} className="group-hover/btn:rotate-12 transition-transform" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Elite Summary Sidebar */}
                        <div className="lg:col-span-5 xl:col-span-4">
                            <div className="sticky top-32 bg-foreground dark:bg-card/40 backdrop-blur-3xl rounded-[4rem] p-12 md:p-16 text-background dark:text-white border border-foreground/5 shadow-premium-deep flex flex-col min-h-[700px]">
                                <h2 className="text-5xl font-black uppercase tracking-tighter mb-16 leading-none">Resumen <br /><span className="opacity-20">de compra.</span></h2>

                                <div className="space-y-8 mb-16 pb-16 border-b border-background/10 dark:border-white/5 flex-grow">
                                    <div className="flex justify-between items-center group">
                                        <span className="opacity-40 font-black uppercase tracking-[0.3em] text-[10px]">Subtotal Acumulado</span>
                                        <span className="text-2xl font-black">{formatPrice(total)}</span>
                                    </div>

                                    {discountApplied && (
                                        <div className="flex justify-between items-center text-emerald-400 font-black uppercase tracking-[0.3em] text-[10px] animate-in slide-in-from-right-4 duration-500 text-sm">
                                            <span>Bonificación Cupón</span>
                                            <span>-{formatPrice(total * 0.2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center opacity-40 font-black uppercase tracking-[0.3em] text-[10px]">
                                        <span>Protección Digital Tianguis</span>
                                        <span className="text-xs">SIN COSTO</span>
                                    </div>

                                    {/* Elite Coupon Toggle */}
                                    <div className="pt-6">
                                        {!showCouponInput ? (
                                            <button
                                                onClick={() => setShowCouponInput(true)}
                                                className="text-[10px] font-black uppercase tracking-[0.3em] text-accent hover:opacity-100 transition-all flex items-center gap-3"
                                            >
                                                <Tag size={12} /> ¿TIENES UN CÓDIGO?
                                            </button>
                                        ) : (
                                            <div className="flex gap-3 animate-in slide-in-from-top-4 duration-500">
                                                <input
                                                    type="text"
                                                    placeholder="INGRESA TU CÓDIGO"
                                                    className="flex-1 bg-background/10 dark:bg-white/5 border border-background/20 dark:border-white/10 rounded-[1.5rem] py-5 px-8 text-[11px] font-black uppercase tracking-[0.2em] outline-none focus:border-accent transition-all text-background dark:text-white placeholder:opacity-30"
                                                    value={coupon}
                                                    onChange={(e) => setCoupon(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="px-8 bg-background dark:bg-white text-foreground dark:text-black rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.2em] hover:bg-accent hover:text-white transition-all"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-16">
                                    <div className="flex flex-col items-end gap-2">
                                        <span className="text-[11px] font-black uppercase tracking-[0.5em] text-accent">Importe Total</span>
                                        <span className="text-[5.5rem] font-black leading-[0.8] tracking-[-0.08em]">{formatPrice(finalTotal)}</span>
                                    </div>

                                    {/* Checkout Interaction */}
                                    <div className="space-y-5">
                                        <span className="text-[10px] font-black opacity-30 uppercase tracking-[0.3em] block ml-4">MÉTODOS DE PAGO ENCRIPTADOS</span>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut}
                                            className="w-full h-20 bg-background dark:bg-white text-foreground dark:text-black rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-2xl flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-3">
                                                <CreditCard size={18} />
                                                PAGAR CON TARJETA
                                            </div>
                                            <span className="text-[7px] opacity-40 invisible dark:visible">DÉBITO • CRÉDITO • APPLE / GOOGLE PAY</span>
                                        </button>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut}
                                            className="w-full h-20 bg-[#0070ba] text-white rounded-[2.5rem] font-black uppercase text-[12px] tracking-[0.3em] hover:scale-105 active:scale-95 transition-all shadow-xl shadow-blue-600/20 flex items-center justify-center gap-3 disabled:opacity-50"
                                        >
                                            <span className="italic font-serif lowercase tracking-tighter text-3xl font-black">Pay<span className="text-white/80 font-medium">Pal</span></span>
                                        </button>
                                    </div>

                                    {/* Elite Trust Badges */}
                                    <div className="grid grid-cols-2 gap-6 opacity-30">
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <ShieldCheck size={22} />
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-tight">SEGURIDAD RSA <br /> ENCRIPTADA</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-3 text-center">
                                            <Zap size={22} />
                                            <span className="text-[8px] font-black uppercase tracking-[0.2em] leading-tight">ENTREGA DIGITAL <br /> INSTANTÁNEA</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Elite Empty State */
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
                        <Link href="/beats" className="group h-24 px-16 bg-foreground text-background dark:bg-white dark:text-black rounded-full font-black uppercase text-[11px] tracking-[0.4em] flex items-center gap-8 hover:bg-accent hover:text-white transition-all shadow-premium hover:scale-105 active:scale-95 duration-500">
                            EXPLORAR TIANGUIS
                            <ArrowRight size={24} className="group-hover:translate-x-3 transition-transform duration-500" />
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
