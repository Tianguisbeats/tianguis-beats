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
            // Registrar cada venta en la base de datos
            for (const item of items) {
                // Si es un beat
                if (item.type === 'beat') {
                    const { error } = await supabase.from('sales').insert({
                        buyer_id: user.id,
                        seller_id: item.metadata?.producer_id || '99999999-9999-9999-9999-999999999999', // Fallback si no hay metadata
                        beat_id: item.id,
                        amount: discountApplied ? item.price * 0.8 : item.price,
                        license_type: item.metadata?.licenseType || 'basic'
                    });
                    if (error) console.error("Error registrando venta de beat:", error);
                }
                // Si es un sound kit
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

            // Guardar en localStorage para la página de éxito (simulación)
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
        <div className="min-h-screen bg-background text-foreground font-sans selection:bg-accent selection:text-white transition-colors duration-300">
            <Navbar />

            <main className="pt-32 pb-40">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-16">
                        <div>
                            <Link href="/beats" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-blue-600 transition-colors mb-6 group">
                                <ChevronLeft size={14} className="group-hover:-translate-x-1 transition-transform" />
                                Continuar Comprando
                            </Link>
                            <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter leading-[0.9]">
                                Tu Carrito <br />
                                <span className="text-accent">de Compras.</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 bg-card/40 backdrop-blur-md px-8 py-5 rounded-[2rem] border border-white/5 shadow-premium">
                            <ShoppingBag className="text-accent" size={24} />
                            <span className="text-2xl font-black">{itemCount} {itemCount === 1 ? 'Producto' : 'Productos'}</span>
                        </div>
                    </div>

                    {itemCount > 0 ? (
                        <div className="grid lg:grid-cols-3 gap-16">

                            {/* Items List */}
                            <div className="lg:col-span-2 space-y-8">
                                {items.map((item) => (
                                    <div key={item.id} className="group relative bg-card border border-border p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-accent/5 transition-all flex flex-col sm:flex-row items-center gap-10">

                                        {/* Item Image */}
                                        <div className="w-32 h-32 bg-accent-soft rounded-[2.5rem] overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
                                            {item.image ? (
                                                <img src={item.image} alt={item.name} className="w-full h-full object-cover" />
                                            ) : item.type === 'plan' ? (
                                                <div className={`w-full h-full flex flex-col items-center justify-center ${item.id.includes('premium') ? 'bg-blue-600 text-white' : 'bg-slate-900 text-white'}`}>
                                                    {item.id.includes('premium') ? <ShieldCheck size={48} /> : <Star size={48} />}
                                                    <span className="text-[10px] font-black uppercase mt-2 tracking-widest">{item.id.includes('yearly') ? 'Anual' : 'Mensual'}</span>
                                                </div>
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-slate-200">
                                                    <Music size={40} />
                                                </div>
                                            )}
                                        </div>

                                        {/* Item Info */}
                                        <div className="flex-1 text-center sm:text-left">
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-accent/10 text-accent text-[8px] font-black uppercase tracking-widest rounded-lg mb-2">
                                                {item.type === 'beat' ? 'BEAT EXCLUSIVO' : 'PLAN DE SUSCRIPCIÓN'}
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight mb-1 group-hover:text-accent transition-colors">{item.name}</h3>
                                            <div className="flex flex-col gap-1">
                                                <p className="text-muted text-[10px] font-bold uppercase tracking-widest">{item.subtitle}</p>
                                                <span className="text-slate-500 text-[9px] font-black uppercase tracking-[0.1em]">
                                                    Licencia: {item.metadata?.licenseType || 'Standard'}
                                                </span>
                                            </div>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex flex-col items-center sm:items-end gap-4 min-w-[150px]">
                                            <span className="text-2xl font-black text-foreground">{formatPrice(item.price)}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-red-400 hover:text-red-600 transition-colors group/del"
                                            >
                                                <Trash2 size={14} className="group-hover/del:scale-110 transition-transform" />
                                                Eliminar
                                            </button>
                                        </div>
                                    </div>
                                ))}

                                <button
                                    onClick={clearCart}
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-muted hover:text-foreground transition-colors pl-8"
                                >
                                    Vaciar Carrito
                                </button>
                            </div>

                            {/* Order Summary */}
                            <div className="relative">
                                <div className="sticky top-32 bg-slate-900/90 backdrop-blur-3xl rounded-[3rem] md:rounded-[4rem] p-8 md:p-12 text-white border border-white/5 shadow-2xl shadow-black/50">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-8">Resumen</h2>

                                    <div className="space-y-4 mb-8 pb-8 border-b border-white/5">
                                        <div className="flex justify-between items-center text-white/40 font-black uppercase tracking-widest text-[9px]">
                                            <span>Subtotal</span>
                                            <span className="text-white text-sm">{formatPrice(total)}</span>
                                        </div>
                                        {discountApplied && (
                                            <div className="flex justify-between items-center text-green-400 font-black uppercase tracking-widest text-[9px]">
                                                <span>Descuento Aplicado</span>
                                                <span>-{formatPrice(total * 0.2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-accent font-black uppercase tracking-widest text-[9px]">
                                            <span>Protección Comprador</span>
                                            <span className="text-white text-sm">Gratis</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mb-10">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-accent">Total Final</span>
                                        <span className="text-4xl font-black leading-none">{formatPrice(finalTotal)}</span>
                                    </div>

                                    {/* Coupon Minimalist */}
                                    <div className="mb-10">
                                        {!showCouponInput ? (
                                            <button
                                                onClick={() => setShowCouponInput(true)}
                                                className="text-[9px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2"
                                            >
                                                <Tag size={12} /> ¿Tienes un código de descuento?
                                            </button>
                                        ) : (
                                            <div className="flex gap-2 animate-in slide-in-from-top-2 duration-300">
                                                <input
                                                    type="text"
                                                    placeholder="CÓDIGO"
                                                    className="flex-1 bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-[10px] font-black uppercase tracking-widest outline-none focus:border-accent transition-colors"
                                                    value={coupon}
                                                    onChange={(e) => setCoupon(e.target.value)}
                                                />
                                                <button
                                                    onClick={handleApplyCoupon}
                                                    className="px-5 bg-white text-black rounded-xl font-black text-[9px] uppercase tracking-widest hover:bg-accent hover:text-white transition-all"
                                                >
                                                    Aplicar
                                                </button>
                                            </div>
                                        )}
                                    </div>

                                    {/* Payment Methods */}
                                    <div className="space-y-3 mb-10">
                                        <label className="text-[9px] font-black text-white/30 uppercase tracking-widest ml-1">Métodos de Pago</label>

                                        {/* Stripe Button Stylized */}
                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut}
                                            className="w-full h-[54px] bg-indigo-600 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-indigo-500 transition-all shadow-xl shadow-indigo-600/20 flex flex-col items-center justify-center gap-1 disabled:opacity-50"
                                        >
                                            <div className="flex items-center gap-2">
                                                <CreditCard size={14} />
                                                <span>Pagar con Stripe</span>
                                            </div>
                                            <div className="flex items-center gap-2 opacity-50 text-[7px]">
                                                <span>VISA</span> • <span>MASTERCARD</span> • <span>APPLE PAY</span>
                                            </div>
                                        </button>

                                        {/* PayPal Button Institutional but Adapted */}
                                        <button
                                            onClick={handleCheckout}
                                            disabled={checkingOut}
                                            className="w-full h-[54px] bg-[#0070ba] text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] hover:bg-[#0070ba]/90 transition-all shadow-xl shadow-blue-600/10 flex items-center justify-center gap-2 disabled:opacity-50"
                                        >
                                            <span className="italic font-serif lowercase tracking-tighter text-lg">Pay<span className="text-white/80">Pal</span></span>
                                        </button>
                                    </div>

                                    <div className="flex flex-col gap-3">
                                        <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/40">
                                            <Lock size={12} className="text-green-400" />
                                            🔒 Pago seguro encriptado
                                        </div>
                                        <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/40">
                                            <Mail size={12} className="text-blue-400" />
                                            Entrega digital instantánea vía email
                                        </div>
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* Empty Cart */
                        <div className="py-40 bg-card rounded-[5rem] border-2 border-dashed border-border flex flex-col items-center justify-center text-center px-6 shadow-soft">
                            <div className="w-24 h-24 bg-background rounded-[2.5rem] flex items-center justify-center mb-10 shadow-sm">
                                <ShoppingBag className="text-muted/30" size={48} />
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Tu carrito está vacío</h2>
                            <p className="text-muted font-medium text-lg mb-12 max-w-sm">Parece que aún no has seleccionado el sonido de tu próximo hit.</p>
                            <Link href="/beats" className="bg-accent text-white px-12 py-5 rounded-full font-black uppercase text-[11px] tracking-[0.2em] hover:bg-accent/90 transition-all shadow-xl shadow-accent/10 flex items-center gap-4">
                                Explorar Catálogo
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    )}

                </div>
            </main>

            <Footer />
        </div>
    );
}
