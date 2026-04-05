"use client";

import React, { useState, useEffect } from 'react';
import { DollarSign, AlertCircle, CheckCircle2, Info, TrendingUp, MinusCircle } from 'lucide-react';
import { calculateEarnings, EarningDetails } from '@/lib/finance-utils';

export default function EarningsCalculator() {
    const [price, setPrice] = useState<number>(300);
    const [plan, setPlan] = useState<'free' | 'pro'>('free');
    const [details, setDetails] = useState<EarningDetails>(calculateEarnings(300, 'free'));

    useEffect(() => {
        setDetails(calculateEarnings(price, plan));
    }, [price, plan]);

    const formatCurrency = (val: number) => {
        return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(val);
    };

    return (
        <div className="bg-card border border-border shadow-xl rounded-[2.5rem] p-8 max-w-xl mx-auto overflow-hidden relative group transition-all hover:border-accent/30">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent/5 blur-[50px] -mr-16 -mt-16" />

            <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-12 rounded-2xl bg-accent/10 flex items-center justify-center text-accent">
                    <TrendingUp size={24} />
                </div>
                <div>
                    <h3 className="text-xl font-black uppercase tracking-tight text-foreground">Calculadora de Ganancias</h3>
                    <p className="text-[10px] font-bold text-muted uppercase tracking-[0.2em]">Transparencia de Pagos Tianguis Beats</p>
                </div>
            </div>

            <div className="space-y-6">
                {/* Plan Selection */}
                <div className="flex p-1 bg-accent/5 rounded-2xl border border-border">
                    <button
                        onClick={() => setPlan('free')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${plan === 'free' ? 'bg-white text-accent shadow-sm' : 'text-muted'}`}
                    >
                        Plan Free
                    </button>
                    <button
                        onClick={() => setPlan('pro')}
                        className={`flex-1 py-3 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${plan === 'pro' ? 'bg-white text-accent shadow-sm' : 'text-muted'}`}
                    >
                        Pro / Premium
                    </button>
                </div>

                {/* Input Section */}
                <div>
                    <label className="block text-[10px] font-black uppercase tracking-widest text-muted mb-3 ml-1">Precio de tu Beat (MXN)</label>
                    <div className="relative">
                        <div className="absolute left-5 top-1/2 -translate-y-1/2 text-muted font-black text-xl">$</div>
                        <input
                            type="text"
                            value={price === 0 ? '' : price}
                            onChange={(e) => {
                                const val = e.target.value.replace(/[^0-9]/g, '');
                                setPrice(val === '' ? 0 : parseInt(val));
                            }}
                            placeholder="0.00"
                            className="w-full bg-accent/5 border-2 border-border rounded-2xl py-5 pl-12 pr-6 text-2xl font-black text-foreground focus:outline-none focus:border-accent transition-all placeholder:text-muted/20"
                        />
                    </div>
                </div>

                {/* Breakdown Section */}
                <div className="bg-muted/5 border border-border rounded-3xl p-6 space-y-4">
                    <div className="flex justify-between items-center group/item">
                        <div className="flex items-center gap-2">
                            <MinusCircle size={14} className="text-rose-500/60" />
                            <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Stripe (3.6% + $3) + 16% IVA</span>
                        </div>
                        <span className="font-black text-rose-500/80">-{formatCurrency(details.stripeCommission + details.ivaOnCommission)}</span>
                    </div>

                    {plan === 'free' ? (
                        <div className="flex justify-between items-center group/item">
                            <div className="flex items-center gap-2">
                                <AlertCircle size={14} className="text-rose-500/60" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Comisión Tianguis (15%)</span>
                            </div>
                            <span className="font-black text-rose-500/80">-{formatCurrency(details.tianguisCommission)}</span>
                        </div>
                    ) : (
                        <div className="flex justify-between items-center group/item">
                            <div className="flex items-center gap-2">
                                <CheckCircle2 size={14} className="text-emerald-500/60" />
                                <span className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">Comisión Tianguis (0%)</span>
                            </div>
                            <span className="font-black text-emerald-500/80">$0.00</span>
                        </div>
                    )}

                    <div className="h-px bg-border my-2" />

                    <div className="flex justify-between items-center pt-2">
                        <div className="flex items-center gap-2">
                            <CheckCircle2 size={18} className="text-emerald-500" />
                            <span className="text-sm font-black uppercase tracking-tighter text-foreground">Tu Ingreso Neto</span>
                        </div>
                        <span className="text-2xl font-black text-emerald-500 tracking-tighter">
                            {formatCurrency(details.netAmount)}
                        </span>
                    </div>
                </div>

                {/* Info Note */}
                <div className="flex gap-3 bg-blue-500/5 border border-blue-500/20 rounded-2xl p-4">
                    <Info size={16} className="text-blue-500 shrink-0 mt-0.5" />
                    <p className="text-[9px] font-bold text-blue-500/80 uppercase tracking-widest leading-relaxed">
                        {plan === 'free'
                            ? "En el plan Free, se aplica una comisión del 15%. ¡Mejora tu plan para recibir el 100% de tus ventas!"
                            : "¡Felicidades! En tu plan actual recibes el 100% de tus ventas (menos comisiones de Stripe)."}
                    </p>
                </div>
            </div>
        </div>
    );
}
