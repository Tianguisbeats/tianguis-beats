"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Beat } from '@/lib/types';

export type CartItemType = 'beat' | 'license' | 'plan';

export interface CartItem {
    id: string;
    type: CartItemType;
    name: string;
    price: number;
    image?: string;
    subtitle?: string;
    metadata?: any;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => void;
    removeItem: (id: string) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
    isInCart: (id: string) => boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);

    // Load from localStorage
    useEffect(() => {
        const savedCart = localStorage.getItem('tianguis_cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error loading cart from localStorage", e);
            }
        }
    }, []);

    // Save to localStorage
    useEffect(() => {
        localStorage.setItem('tianguis_cart', JSON.stringify(items));
    }, [items]);

    const addItem = (item: CartItem) => {
        if (!isInCart(item.id)) {
            setItems(prev => [...prev, item]);
        }
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
    };

    const clearCart = () => {
        setItems([]);
    };

    const isInCart = (id: string) => items.some(item => item.id === id);

    const total = items.reduce((acc, item) => acc + item.price, 0);
    const itemCount = items.length;

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, itemCount, isInCart }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart must be used within a CartProvider');
    }
    return context;
}
