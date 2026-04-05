"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useCart } from '@/context/CartContext';
import { X, ShoppingBag, Trash2, ArrowRight, CreditCard, Music, Package, Briefcase, ChevronRight, Shield, Zap, Tag, Check, FileText, Star, Crown, Lock } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useCurrency } from '@/context/CurrencyContext';
import { getLicenseColor } from '@/lib/license-utils';
import { getGlobalConfig, GlobalConfig } from '@/lib/config';
import { useToast } from '@/context/ToastContext';

export default function CartSidebar() {
    const { items, removeItem, total, itemCount, isCartOpen, setIsCartOpen } = useCart();
    const { formatPrice } = useCurrency();
    const { showToast } = useToast();
    const sidebarRef = useRef<HTMLDivElement>(null);
    const [config, setConfig] = useState<GlobalConfig | null>(null);

    useEffect(() => {
        if (isCartOpen) {
            getGlobalConfig().then(setConfig);
        }
    }, [isCartOpen]);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (sidebarRef.current && !sidebarRef.current.contains(event.target as Node) && isCartOpen) {
                setIsCartOpen(false);
            }
        };

        if (isCartOpen) {
            document.addEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
            document.body.style.overflow = 'unset';
        };
    }, [isCartOpen, setIsCartOpen]);

    const getItemConfig = (item: any) => {
        const type = item.type;
        const tier = item.metadata?.tier;

        switch (type) {
            case 'beat': return { icon: <Music size={14} />, color: 'text-accent bg-accent/10 border-accent/20', label: 'Beat' };
            case 'sound_kit': return { icon: <Package size={14} />, color: 'text-orange-500 bg-orange-500/10 border-orange-500/20', label: 'Sound Kit' };
            case 'plan': 
                if (tier?.toLowerCase() === 'premium') {
                    return { icon: <Crown size={14} fill="currentColor" />, color: 'text-blue-500 bg-blue-500/10 border-blue-500/20', label: 'Plan Premium' };
                }
                return { icon: <Star size={14} fill="currentColor" />, color: 'text-amber-500 bg-amber-500/10 border-amber-500/20', label: 'Plan Pro' };
            case 'service': return { icon: <Briefcase size={14} />, color: 'text-purple-500 bg-purple-500/10 border-purple-500/20', label: 'Servicio' };
            default: return { icon: <ShoppingBag size={14} />, color: 'text-muted bg-muted/10 border-muted/20', label: 'Producto' };
        }
    };

    return (
        <>
            {/* Overlay */}
            <div
                onClick={() => setIsCartOpen(false)}
                className={`fixed inset-0 bg-black/70 backdrop-blur-sm z-[150] transition-all duration-500 ${isCartOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            />

            {/* Sidebar Panel: bottom-sheet on mobile, side-panel on desktop */}
            <div
                ref={sidebarRef}
                className={`fixed z-[160] flex flex-col transition-all duration-700 ease-[cubic-bezier(0.32,0.72,0,1)]
                    bg-background/97 backdrop-blur-2xl border-border shadow-2xl
                    bottom-0 left-0 right-0 max-h-[92dvh] rounded-t-[2.5rem]
                    md:top-0 md:bottom-0 md:left-auto md:right-0 md:w-[400px] md:h-full md:max-h-full md:rounded-l-[2.5rem] md:rounded-t-none md:border-l
                    ${isCartOpen ? 'translate-y-0 md:translate-x-0' : 'translate-y-full md:translate-y-0 md:translate-x-full'}
                `}
            >
                {/* Glass background overlay/glow */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-accent/5 blur-[120px] rounded-full pointer-events-none" />

                {/* Drag handle pill — mobile only */}
                <div className="relative z-10 flex justify-center pt-3 pb-1 md:hidden">
                    <div className="w-10 h-1 rounded-full bg-border" />
                </div>

                {/* ── HEADER ── */}
                <div className="relative z-10 px-5 md:px-8 py-4 md:py-7 border-b border-border flex items-center justify-between">
                    <div className="flex items-center gap-3 md:gap-4">
                        <div className="relative">
                            <div className="w-9 h-9 md:w-11 md:h-11 bg-accent text-white rounded-2xl flex items-center justify-center shadow-lg shadow-accent/30">
                                <ShoppingBag size={18} />
                            </div>
                            {itemCount > 0 && (
                                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-foreground text-background text-[9px] font-black rounded-full flex items-center justify-center">
                                    {itemCount}
                                </span>
                            )}
                        </div>
                        <div>
                            <h2 className="font-black text-sm md:text-base uppercase tracking-widest text-foreground">Mi Carrito</h2>
                            <p className="text-[9px] font-bold text-muted uppercase tracking-[0.3em]">
                                {itemCount === 0 ? 'Vacío' : `${itemCount} ${itemCount === 1 ? 'artículo' : 'artículos'}`}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsCartOpen(false)}
                        className="w-9 h-9 md:w-10 md:h-10 rounded-2xl flex items-center justify-center text-muted hover:bg-foreground/5 hover:text-foreground transition-all border border-border group"
                    >
                        <X size={16} className="group-hover:rotate-90 transition-transform duration-300" />
                    </button>
                </div>

                {/* ── CONTENT ── */}
                <div className="relative z-10 flex-1 overflow-y-auto py-6 px-6 space-y-3 scrollbar-hide">
                    {items.length === 0 ? (
                        <div className="h-full flex flex-col items-center justify-center text-center gap-8 py-20">
                            <div className="relative">
                                <div className="absolute inset-0 bg-accent/10 blur-[60px] rounded-full scale-150 animate-pulse" />
                                <div className="relative w-28 h-28 bg-card border border-border rounded-[2.5rem] flex items-center justify-center">
                                    <ShoppingBag size={48} className="text-muted/30" strokeWidth={1.5} />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <h3 className="font-black text-2xl uppercase tracking-tighter text-foreground">Carrito Vacío</h3>
                                <p className="text-[10px] font-bold text-muted uppercase tracking-widest max-w-[200px] mx-auto leading-relaxed">
                                    Agrega beats y herramientas para empezar
                                </p>
                            </div>
                            <button
                                onClick={() => setIsCartOpen(false)}
                                className="group px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:opacity-90 transition-all shadow-xl shadow-accent/20 active:scale-95 flex items-center gap-3"
                            >
                                Explorar Tianguis <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                            </button>
                        </div>
                    ) : (
                        items.map((item) => {
                            const config = getItemConfig(item);
                            const licenseLabel = item.metadata?.license_type || item.metadata?.licencia || item.metadata?.license || item.metadata?.licenseType;
                            return (
                                <div key={item.id} className="group bg-card border border-border rounded-[1.75rem] p-4 hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 transition-all duration-300">
                                    <div className="flex items-center gap-4">
                                        {/* Thumbnail */}
                                        <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0 bg-foreground/5">
                                            {item.image ? (
                                                <Image src={item.image} alt={item.name} fill className="object-cover" sizes="64px" />
                                            ) : (
                                                <div className={`w-full h-full flex items-center justify-center ${config.color}`}>
                                                    {config.icon}
                                                </div>
                                            )}
                                        </div>

                                        {/* Info */}
                                        <div className="flex-1 min-w-0 space-y-1.5">
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <span className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${config.color}`}>
                                                    {config.label}
                                                </span>
                                                {Boolean(licenseLabel) && (
                                                    <span className={`px-2 py-0.5 border rounded-md text-[8px] font-black uppercase tracking-widest ${getLicenseColor(String(licenseLabel))}`}>
                                                        {String(licenseLabel)}
                                                    </span>
                                                )}
                                            </div>
                                            <h4 className="font-black text-sm uppercase tracking-tight text-foreground truncate leading-none">{item.name.split('[')[0].trim()}</h4>
                                            {item.subtitle && (
                                                <p className="text-[9px] font-bold text-muted uppercase tracking-widest truncate opacity-60">{item.subtitle}</p>
                                            )}
                                        </div>

                                        {/* Price + Delete */}
                                        <div className="flex flex-col items-end gap-2 shrink-0">
                                            <span className="font-black text-base text-foreground tracking-tight">{formatPrice(item.price)}</span>
                                            <button
                                                onClick={() => removeItem(item.id)}
                                                className="w-8 h-8 rounded-xl flex items-center justify-center bg-red-500/10 border border-red-500/20 text-red-500 hover:bg-red-500 hover:text-white transition-all active:scale-90"
                                                title="Eliminar"
                                            >
                                                <Trash2 size={13} />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>

                {/* ── FOOTER ── */}
                {items.length > 0 && (
                    <div className="relative z-10 px-5 md:px-6 pb-6 pt-4 border-t border-border space-y-4" style={{ paddingBottom: 'max(1.5rem, env(safe-area-inset-bottom))' }}>
                        {/* Security badges */}
                        <div className="flex items-center justify-center gap-4 py-2">
                            <div className="flex items-center gap-1.5 text-muted">
                                <Shield size={12} className="text-accent" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Pago Seguro</span>
                            </div>
                            <div className="w-px h-3 bg-border" />
                            <div className="flex items-center gap-1.5 text-muted">
                                <Zap size={12} className="text-accent" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Entrega Inmediata</span>
                            </div>
                            <div className="w-px h-3 bg-border" />
                            <div className="flex items-center gap-1.5 text-muted">
                                <Tag size={12} className="text-accent" />
                                <span className="text-[8px] font-black uppercase tracking-widest">Cupones</span>
                            </div>
                        </div>

                        {/* Total row */}
                        <div className="flex items-center justify-between px-1">
                            <span className="text-[10px] font-black text-muted uppercase tracking-[0.3em]">Total Estimado</span>
                            <span className="text-2xl font-black text-foreground tracking-tighter">{formatPrice(total)}</span>
                        </div>

                        {/* CTA */}
                        <Link
                            href={config?.ventas_habilitadas === false ? "#" : "/cart"}
                            onClick={(e) => {
                                if (config?.ventas_habilitadas === false) {
                                    e.preventDefault();
                                    showToast("Ventas pausadas temporalmente", "info");
                                    return;
                                }
                                setIsCartOpen(false);
                            }}
                            className={`group w-full h-14 md:h-16 rounded-[1.5rem] font-black text-[11px] uppercase tracking-[0.3em] active:scale-[0.97] transition-all shadow-xl flex items-center justify-center gap-4 relative overflow-hidden ${
                                config?.ventas_habilitadas === false 
                                ? 'bg-zinc-800 text-zinc-500 cursor-not-allowed shadow-none' 
                                : 'bg-accent text-white shadow-accent/30'
                            }`}
                        >
                            <div className="absolute inset-0 bg-gradient-to-r from-accent via-accent to-accent/80 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <span className="relative flex items-center gap-3">
                                {config?.ventas_habilitadas === false ? <Lock size={18} /> : <CreditCard size={18} />}
                                {config?.ventas_habilitadas === false ? 'Ventas Pausadas' : 'Ir al Carrito'}
                                {config?.ventas_habilitadas !== false && <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />}
                            </span>
                        </Link>

                        <p className="text-[8px] font-bold text-muted text-center uppercase tracking-widest opacity-50">
                            Transacción segura procesada por Stripe
                        </p>
                    </div>
                )}
            </div>
        </>
    );
}
