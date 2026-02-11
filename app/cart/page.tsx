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
            alert("¡Cupón aplicado! 20% de descuento incluido.");
        } else {
            alert("Código no válido.");
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
            console.error("Error en checkout:", err);
            alert("Hubo un problema procesando tu compra.");
        } finally {
            setCheckingOut(false);
        }
    };

    const finalTotal = discountApplied ? total * 0.8 : total;

    return (
        <div className="min-h-screen bg-background text-foreground selection:bg-accent selection:text-white transition-colors duration-500">
            <Navbar />

            {/* Ambient Background Lights */}
            <div className="fixed inset-0 pointer-events-none opacity-50 dark:opacity-20 overflow-hidden z-0">
                <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-blue-500/10 blur-[150px] rounded-full" />
                <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] bg-purple-500/10 blur-[150px] rounded-full" />
            </div>

            <main className="relative z-10 pt-32 pb-40 px-4 sm:px-6 lg:px-8 max-w-[1400px] mx-auto">
                {/* Header Section */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-20">
                    <div className="space-y-4">
                        <div className="flex items-center gap-3">
                            <Link href="/beats" className="group flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-muted hover:text-accent transition-all">
                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Volver al Tianguis
                            </Link>
                            <span className="w-1.5 h-1.5 bg-border rounded-full" />
                            <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Checkout</span>
                        </div>
                        <h1 className="text-6xl md:text-8xl font-black uppercase tracking-tighter leading-[0.85] text-foreground">
                            Checkout <br />
                            <span className="text-muted/20 dark:text-white/5">Details.</span>
                        </h1>
                    </div>
                    <div className="flex flex-col items-end gap-3">
                        <div className="flex items-center gap-6 px-10 py-6 bg-card/40 backdrop-blur-xl border border-border shadow-premium rounded-[2.5rem]">
                            <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                                <ShoppingBag size={24} />
                            </div>
                            <div className="flex flex-col">
                                <span className="text-3xl font-black text-foreground">{itemCount}</span>
                                <span className="text-[9px] font-black uppercase tracking-widest text-muted">Artículos en orden</span>
                            </div>
                        </div>
                        <button
                            onClick={clearCart}
                            className="text-[9px] font-black uppercase tracking-widest text-muted hover:text-red-500 transition-colors flex items-center gap-2 mr-4"
                        >
                            <Trash2 size={12} /> Vaciar Carrito
                        </button>
                    </div>
                </div>

                {itemCount > 0 ? (
                    <div className="grid lg:grid-cols-12 gap-12 xl:gap-20">
                        {/* Items Column */}
                        <div className="lg:col-span-7 xl:col-span-8 space-y-6">
                            {items.map((item) => {
                                const isBeat = item.type === 'beat';
                                const isPlan = item.type === 'plan';
                                const isSoundKit = item.metadata?.isSoundKit || item.id.includes('kit');
                                const isService = item.id.includes('service');

                                return (
                                    <div key={item.id} className="group relative bg-card/60 backdrop-blur-sm border border-border hover:border-accent/30 p-6 md:p-8 rounded-[3rem] transition-all duration-500 hover:shadow-2xl hover:shadow-accent/5 flex flex-col sm:flex-row items-center gap-8">
                                        {/* Image Box */}
                                        <div className="relative w-28 h-28 md:w-36 md:h-36 shrink-0 rounded-[2rem] overflow-hidden shadow-lg group-hover:scale-105 transition-transform duration-500">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${isPlan ? 'bg-indigo-600' : 'bg-slate-800'} text-white`}>
                                                    {isPlan ? <Star size={40} fill="currentColor" /> : <Music size={40} />}
                                                </div>
                                            )}
                                        </div>

                                        {/* Content Box */}
                                        <div className="flex-1 flex flex-col gap-4 text-center sm:text-left">
                                            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                                                {/* Meta Tags */}
                                                <span className={`px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-[0.15em] ${isBeat ? 'bg-blue-500/10 text-blue-500' :
                                                        isPlan ? 'bg-amber-500/10 text-amber-500' :
                                                            isSoundKit ? 'bg-emerald-500/10 text-emerald-500' :
                                                                'bg-purple-500/10 text-purple-500'
                                                    }`}>
                                                    {isBeat ? 'BEAT' : isPlan ? 'SUBSCRIPCIÓN' : isSoundKit ? 'SOUND KIT' : 'SERVICIO'}
                                                </span>

                                                {isBeat && item.metadata?.license && (
                                                    <span className="px-3 py-1 bg-slate-100 dark:bg-white/5 text-muted dark:text-white/60 text-[8px] font-black uppercase tracking-[0.15em] rounded-full">
                                                        Licencia {item.metadata.license}
                                                    </span>
                                                )}

                                                {isPlan && item.metadata?.cycle && (
                                                    <span className="px-3 py-1 bg-amber-500/10 text-amber-600 text-[8px] font-black uppercase tracking-[0.15em] rounded-full">
                                                        {item.metadata.cycle === 'yearly' ? 'Anual' : 'Mensual'}
                                                    </span>
                                                )}
                                            </div>

                                            <div>
                                                <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tighter text-foreground group-hover:text-accent transition-colors leading-tight">
                                                    {item.name.split('[')[0].trim()}
                                                </h3>
                                                <p className="text-muted text-[11px] font-bold uppercase tracking-[0.2em] mt-1">
                                                    {item.subtitle}
                                                </p>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex flex-col items-center sm:items-end justify-between self-stretch py-2 min-w-[120px]">
                                            <span className="text-3xl font-black text-foreground">{formatPrice(item.price)}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="flex items-center gap-2 p-2 text-[9px] font-black uppercase tracking-widest text-muted/40 hover:text-red-500 transition-all group/del"
                                            >
                                                <Trash2 size={14} className="group-hover/del:scale-110 transition-transform" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        {/* Summary Column */}
                        <div className="lg:col-span-5 xl:col-span-4 relative">
                            <div className="sticky top-32 bg-slate-900/95 dark:bg-slate-900/90 backdrop-blur-3xl rounded-[3.5rem] p-10 md:p-14 text-white border border-white/5 shadow-[0_50px_100px_-20px_rgba(0,0,0,0.5)] flex flex-col min-h-[600px]">
                                <h2 className="text-4xl font-black uppercase tracking-tight mb-12">Resumen.</h2>

                                <div className="space-y-6 mb-12 pb-12 border-b border-white/5 flex-grow">
                                    <div className="flex justify-between items-center group">
                                        <span className="text-white/40 font-black uppercase tracking-[0.2em] text-[10px] group-hover:text-white/60 transition-colors text-xs">Subtotal</span>
                                        <span className="text-white text-lg font-black">{formatPrice(total)}</span>
                                    </div>

                                    {discountApplied && (
                                        <div className="flex justify-between items-center text-emerald-400 font-black uppercase tracking-[0.2em] text-[10px]">
                                            <span>Descuento (20%)</span>
                                            <span className="text-lg font-black">-{formatPrice(total * 0.2)}</span>
                                        </div>
                                    )}

                                    <div className="flex justify-between items-center text-accent font-black uppercase tracking-[0.2em] text-[10px]">
                                        <span>Protección al Comprador</span>
                                        <span className="text-white/60 text-xs">GRATIS</span>
                                    </div>

                                    {/* Discount Code Toggle */}
                                    <div className="pt-4">
                                        {!showCouponInput ? (
                                            <button
                                                onClick={() => setShowCouponInput(true)}
                                                className="text-[10px] font-black uppercase tracking-[0.2em] text-accent hover:text-white transition-all flex items-center gap-2"
                                            >
                                                <Tag size={12} /> ¿Tienes un código?
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="text"
                                                    placeholder="CÓDIGO"
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-2xl py-4 px-6 text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent transition-all"
                                                    value={coupon}
                                                    onChange={(e) => setCoupon(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="px-6 bg-white text-black rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                                                >
                                                    OK
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-12">
                                    <div className="flex justify-between items-end">
                                        <span className="text-[11px] font-black uppercase tracking-[0.4em] text-accent">Total Final</span>
                                        <span className="text-6xl font-black leading-none tracking-tighter">{formatPrice(finalTotal)}</span>
                                    </div>

                                    {/* Checkout Buttons */}
                                    <div className="space-y-4">
                                        <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] ml-2">Finalizar con:</label>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut}
                                            className="w-full h-16 bg-white text-black rounded-[2rem] font-black uppercase text-[11px] tracking-[0.25em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-white/5 flex flex-col items-center justify-center gap-0.5 disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <div className="flex gap-0.5">
                                                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                                                    <span className="w-1.5 h-1.5 bg-black rounded-full" />
                                                </div>
                                                STRIPE CHECKOUT
                                            </div>
                                            <span className="text-[6px] opacity-40">CARDS • APPLE PAY • GOOGLE PAY</span>
                                        </button>

                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut}
                                            className="w-full h-16 bg-[#0070ba] text-white rounded-[2rem] font-black uppercase text-[11px] tracking-[0.25em] hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="italic font-serif lowercase tracking-tighter text-2xl font-black">Pay<span className="text-white/80 font-medium">Pal</span></span>
                                        </button>
                                    </div>

                                    {/* Trust Footnote */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl text-center">
                                            <ShieldCheck size={18} className="text-green-400" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-tight">Pago Seguro Encriptado</span>
                                        </div>
                                        <div className="flex flex-col items-center gap-2 p-4 bg-white/5 rounded-2xl text-center">
                                            <Zap size={18} className="text-blue-400" />
                                            <span className="text-[8px] font-black uppercase tracking-widest text-white/40 leading-tight">Entrega Instantánea Digital</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    /* Empty State - Super Premium */
                    <div className="py-40 flex flex-col items-center justify-center text-center max-w-2xl mx-auto">
                        <div className="relative mb-16">
                            <div className="absolute inset-0 bg-accent/20 blur-[80px] rounded-full scale-150 animate-pulse" />
                            <div className="relative w-32 h-32 bg-card border border-border rounded-[3rem] flex items-center justify-center shadow-2xl">
                                <ShoppingBag className="text-muted/20" size={60} />
                            </div>
                        </div>
                        <h2 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 text-foreground">El carrito está <span className="text-muted/20 italic">vacío.</span></h2>
                        <p className="text-muted text-lg font-medium mb-12 max-w-sm">No dejes que tu próximo hit se escape. Explora el catálogo y encuentra los mejores beats.</p>
                        <Link href="/beats" className="group h-20 px-12 bg-foreground text-background rounded-full font-black uppercase text-xs tracking-[0.3em] flex items-center gap-6 hover:bg-accent hover:text-white transition-all shadow-2xl hover:scale-105 active:scale-95">
                            Explorar Tianguis
                            <ArrowRight size={20} className="group-hover:translate-x-2 transition-transform" />
                        </Link>
                    </div>
                )}
            </main>

            <Footer />
        </div>
    );
}
