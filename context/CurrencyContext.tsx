"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

type Currency = 'MXN' | 'USD' | 'EUR';

interface CurrencyContextType {
    currency: Currency;
    setCurrency: (currency: Currency) => void;
    convertPrice: (priceMXN: number) => number;
    formatPrice: (priceMXN: number) => string;
    symbol: string;
}

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

// Tasas de cambio fijas para evitar latencia y variaciones bruscas (Base: MXN)
export const EXCHANGE_RATES = {
    MXN: 1,
    USD: 0.058, // 1 MXN = 0.058 USD (Aprox 17.2 MXN/USD)
    EUR: 0.053, // 1 MXN = 0.053 EUR (Aprox 18.8 MXN/EUR)
};

const SYMBOLS = {
    MXN: '$',
    USD: '$',
    EUR: '€'
};

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
    const [currency, setCurrencyState] = useState<Currency>('MXN');

    useEffect(() => {
        const saved = localStorage.getItem('user-currency') as Currency;
        if (saved && ['MXN', 'USD', 'EUR'].includes(saved)) {
            setCurrencyState(saved);
        }
    }, []);

    const setCurrency = (newCurrency: Currency) => {
        setCurrencyState(newCurrency);
        localStorage.setItem('user-currency', newCurrency);
    };

    const convertPrice = (priceMXN: number) => {
        return priceMXN * EXCHANGE_RATES[currency];
    };

    const formatPrice = (priceMXN: number) => {
        const converted = convertPrice(priceMXN);
        const symbol = SYMBOLS[currency];

        // Formatear con 2 decimales si no es MXN, o si tiene decimales significativos
        const formatted = new Intl.NumberFormat('es-MX', {
            minimumFractionDigits: currency === 'MXN' ? 0 : 2,
            maximumFractionDigits: 2,
        }).format(converted);

        return `${symbol}${formatted} ${currency}`;
    };

    return (
        <CurrencyContext.Provider value={{
            currency,
            setCurrency,
            convertPrice,
            formatPrice,
            symbol: SYMBOLS[currency]
        }}>
            {children}
        </CurrencyContext.Provider>
    );
}

export function useCurrency() {
    const context = useContext(CurrencyContext);
    if (!context) {
        throw new Error('useCurrency must be used within a CurrencyProvider');
    }
    return context;
}
