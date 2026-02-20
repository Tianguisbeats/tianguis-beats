"use client";

import React from 'react';
import { useCurrency } from '@/context/CurrencyContext';

const CURRENCIES = [
    { code: 'MXN', flag: '🇲🇽' },
    { code: 'USD', flag: '🇺🇸' },
    { code: 'EUR', flag: '🇪🇺' }
] as const;

export default function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();

    const handleToggle = () => {
        const currentIndex = CURRENCIES.findIndex(c => c.code === currency);
        const nextIndex = (currentIndex + 1) % CURRENCIES.length;
        setCurrency(CURRENCIES[nextIndex].code);
    };

    const current = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    return (
        <button
            onClick={handleToggle}
            className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-white/5 hover:bg-slate-200 dark:hover:bg-white/10 rounded-xl transition-all border border-transparent hover:border-border group min-h-[48px]"
            title="Cambiar Moneda"
        >
            <span className="text-base group-hover:scale-110 transition-transform">{current.flag}</span>
            <span className="text-[10px] font-black uppercase tracking-wider text-muted group-hover:text-foreground transition-colors">
                {current.code}
            </span>
        </button>
    );
}
