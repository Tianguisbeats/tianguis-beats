"use client";

import React, { useState } from 'react';
import Link from 'next/link';
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
    Star
} from 'lucide-react';
import { useCart } from '@/context/CartContext';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';

export default function CartPage() {
    const { items, removeItem, total, itemCount, clearCart } = useCart();
    const [coupon, setCoupon] = useState('');
    const [discountApplied, setDiscountApplied] = useState(false);

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

    const finalTotal = discountApplied ? total * 0.8 : total;

    return (
        <div className="min-h-screen bg-white text-slate-900 font-sans selection:bg-blue-600 selection:text-white">
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
                                <span className="text-blue-600">de Compras.</span>
                            </h1>
                        </div>
                        <div className="flex items-center gap-4 bg-slate-50 px-8 py-5 rounded-[2rem] border border-slate-100">
                            <ShoppingBag className="text-blue-600" size={24} />
                            <span className="text-2xl font-black">{itemCount} {itemCount === 1 ? 'Producto' : 'Productos'}</span>
                        </div>
                    </div>

                    {itemCount > 0 ? (
                        <div className="grid lg:grid-cols-3 gap-16">

                            {/* Items List */}
                            <div className="lg:col-span-2 space-y-8">
                                {items.map((item) => (
                                    <div key={item.id} className="group relative bg-white border border-slate-100 p-8 rounded-[3rem] hover:shadow-2xl hover:shadow-slate-200 transition-all flex flex-col sm:flex-row items-center gap-10">

                                        {/* Item Image */}
                                        <div className="w-32 h-32 bg-slate-50 rounded-[2.5rem] overflow-hidden shrink-0 shadow-sm flex items-center justify-center">
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
                                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 text-[8px] font-black uppercase tracking-widest rounded-lg mb-3">
                                                {item.type === 'beat' ? 'BEAT EXCLUSIVO' : 'PLAN DE SUSCRIPCIÓN'}
                                            </div>
                                            <h3 className="text-2xl font-black uppercase tracking-tight mb-1 group-hover:text-blue-600 transition-colors">{item.name}</h3>
                                            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">{item.subtitle}</p>
                                        </div>

                                        {/* Price & Action */}
                                        <div className="flex flex-col items-center sm:items-end gap-4 min-w-[150px]">
                                            <span className="text-2xl font-black text-slate-900">{formatPrice(item.price)}</span>
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
                                    className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-slate-900 transition-colors pl-8"
                                >
                                    Vaciar Carrito
                                </button>
                            </div>

                            {/* Order Summary */}
                            <div className="relative">
                                <div className="sticky top-32 bg-slate-900 rounded-[4rem] p-12 text-white shadow-2xl shadow-blue-900/40">
                                    <h2 className="text-3xl font-black uppercase tracking-tight mb-10">Resumen</h2>

                                    <div className="space-y-6 mb-10 pb-10 border-b border-white/10">
                                        <div className="flex justify-between items-center text-white/60 font-bold uppercase tracking-widest text-[10px]">
                                            <span>Subtotal</span>
                                            <span className="text-white text-sm">{formatPrice(total)}</span>
                                        </div>
                                        {discountApplied && (
                                            <div className="flex justify-between items-center text-green-400 font-bold uppercase tracking-widest text-[10px]">
                                                <span>Descuento (20%)</span>
                                                <span>-{formatPrice(total * 0.2)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between items-center text-blue-400 font-bold uppercase tracking-widest text-[10px]">
                                            <span>Protección al Comprador</span>
                                            <span className="text-white text-sm">Gratis</span>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-end mb-12">
                                        <span className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Total Final</span>
                                        <span className="text-4xl font-black leading-none">{formatPrice(finalTotal)}</span>
                                    </div>

                                    {/* Coupon */}
                                    <div className="flex gap-2 mb-10">
                                        <div className="flex-1 relative">
                                            <Tag size={16} className="absolute inset-y-0 left-5 my-auto text-white/30" />
                                            <input
                                                type="text"
                                                placeholder="Código"
                                                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-xs font-bold uppercase tracking-widest outline-none focus:border-blue-500 transition-colors"
                                                value={coupon}
                                                onChange={(e) => setCoupon(e.target.value)}
                                            />
                                        </div>
                                        <button
                                            onClick={handleApplyCoupon}
                                            className="px-6 bg-white text-slate-900 rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all"
                                        >
                                            Aplicar
                                        </button>
                                    </div>

                                    <button className="w-full bg-blue-600 text-white py-6 rounded-[2rem] font-black uppercase text-[12px] tracking-[0.2em] hover:bg-white hover:text-blue-600 transition-all shadow-xl shadow-blue-500/20 mb-8 flex items-center justify-center gap-3">
                                        Finalizar Compra
                                        <ArrowRight size={18} />
                                    </button>

                                    <div className="flex items-center justify-center gap-3 text-[9px] font-black uppercase tracking-widest text-white/30">
                                        <ShieldCheck size={14} />
                                        Pago Seguro y Encriptado
                                    </div>
                                </div>
                            </div>

                        </div>
                    ) : (
                        /* Empty Cart */
                        <div className="py-40 bg-slate-50 rounded-[5rem] border-2 border-dashed border-slate-100 flex flex-col items-center justify-center text-center px-6">
                            <div className="w-24 h-24 bg-white rounded-[2.5rem] flex items-center justify-center mb-10 shadow-sm">
                                <ShoppingBag className="text-slate-200" size={48} />
                            </div>
                            <h2 className="text-4xl font-black uppercase tracking-tight mb-4">Tu carrito está vacío</h2>
                            <p className="text-slate-400 font-medium text-lg mb-12 max-w-sm">Parece que aún no has seleccionado el sonido de tu próximo hit.</p>
                            <Link href="/beats" className="bg-slate-900 text-white px-12 py-5 rounded-full font-black uppercase text-[11px] tracking-[0.2em] hover:bg-blue-600 transition-all shadow-xl shadow-slate-900/20 flex items-center gap-4">
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
