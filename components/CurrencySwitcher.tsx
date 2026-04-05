"use client";

import React, { useState, useRef, useEffect } from 'react';
import { useCurrency } from '@/context/CurrencyContext';
import { ChevronDown } from 'lucide-react';

const CURRENCIES = [
    { code: 'MXN', flag: '🇲🇽', label: 'Peso Mexicano' },
    { code: 'USD', flag: '🇺🇸', label: 'Dólar (USD)' },
    { code: 'EUR', flag: '🇪🇺', label: 'Euro (EUR)' }
] as const;

export default function CurrencySwitcher() {
    const { currency, setCurrency } = useCurrency();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const current = CURRENCIES.find(c => c.code === currency) || CURRENCIES[0];

    return (
        <div className="relative" ref={dropdownRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-1 px-2 py-2 rounded-lg transition-all group hover:scale-110 active:scale-95"
                title="Seleccionar Moneda"
            >
                <span className="text-base group-hover:scale-110 transition-transform">{current.flag}</span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-600 dark:text-slate-300 group-hover:text-foreground transition-colors">
                    {current.code}
                </span>
                <ChevronDown size={12} className={`text-slate-400 transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && (
                <div className="absolute right-0 top-full mt-2 w-48 bg-card border border-border rounded-2xl shadow-2xl z-[100] overflow-hidden animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-2">
                        {CURRENCIES.map((c) => (
                            <button
                                key={c.code}
                                onClick={() => {
                                    setCurrency(c.code);
                                    setIsOpen(false);
                                }}
                                // eslint-disable-next-line
                                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-blue-500/10 dark:hover:bg-blue-500/20 cursor-pointer transition-all active:scale-[0.98] ${currency === c.code ? 'bg-blue-500/5' : ''
                                    }`}
                            >
                                <span className="text-xl">{c.flag}</span>
                                <div className="flex flex-col">
                                    <span className={`text-[11px] font-black uppercase tracking-widest ${currency === c.code ? 'text-accent' : 'text-foreground'
                                        }`}>
                                        {c.code}
                                    </span>
                                    <span className="text-[9px] font-bold text-muted uppercase tracking-tight">
                                        {c.label}
                                    </span>
                                </div>
                                {currency === c.code && (
                                    <div className="ml-auto w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(var(--accent-rgb),0.5)]" />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
