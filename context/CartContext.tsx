"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useToast } from './ToastContext';

export type CartItemType = 'beat' | 'license' | 'plan' | 'sound_kit' | 'service';

export interface CartItem {
    id: string;
    type: CartItemType;
    name: string;
    price: number;
    image?: string;
    subtitle?: string;
    metadata?: Record<string, unknown>;
}

interface CartContextType {
    items: CartItem[];
    addItem: (item: CartItem) => boolean;
    removeItem: (id: string) => void;
    clearCart: () => void;
    total: number;
    itemCount: number;
    isInCart: (id: string) => boolean;
    currentUserId?: string | null;
}

/**
 * Contexto del Carrito de Compras.
 * Maneja el estado global del carrito, persistencia en localStorage y validaciones de compra.
 */
const CartContext = createContext<CartContextType | undefined>(undefined);

/**
 * Proveedor del Carrito de Compras.
 * Envuelve la aplicación para proveer el estado del carrito a todos los componentes.
 */
export function CartProvider({ children }: { children: React.ReactNode }) {
    const [items, setItems] = useState<CartItem[]>([]);
    const [currentUserId, setCurrentUserId] = useState<string | null>(null);
    const { showToast } = useToast();

    // Load from localStorage (Cargar desde localStorage al montar el componente)
    useEffect(() => {
        const savedCart = localStorage.getItem('tianguis_cart');
        if (savedCart) {
            try {
                setItems(JSON.parse(savedCart));
            } catch (e) {
                console.error("Error al cargar el carrito desde localStorage", e);
            }
        }

        // Get current user (Verificar el usuario actual para evitar autocompras)
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            setCurrentUserId(session?.user?.id || null);
        };
        checkUser();
    }, []);

    // Save to localStorage (Guardar en localStorage cada vez que cambian los items)
    useEffect(() => {
        localStorage.setItem('tianguis_cart', JSON.stringify(items));
    }, [items]);

    const addItem = (item: CartItem): boolean => {
        // Validar duplicados para no agregar el mismo producto dos veces
        if (isInCart(item.id)) {
            showToast("Este artículo ya está en tu carrito.", 'warning');
            return false;
        }

        // Validar autocompra (Evitar que un productor compre sus propios beats o servicios)
        const producerId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId;

        if (currentUserId && producerId && currentUserId === producerId) {
            showToast("No puedes comprar tus propios productos.", 'error');
            return false;
        }

        // Validar única suscripción
        if (item.type === 'plan') {
            const hasPlan = items.some(i => i.type === 'plan');
            if (hasPlan) {
                showToast("Solo puedes agregar un plan de suscripción a la vez.", 'info');
                return false;
            }
        }

        setItems(prev => [...prev, item]);
        showToast("Agregado al carrito", 'success');
        return true;
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
        <CartContext.Provider value={{ items, addItem, removeItem, clearCart, total, itemCount, isInCart, currentUserId }}>
            {children}
        </CartContext.Provider>
    );
}

export function useCart() {
    const context = useContext(CartContext);
    if (context === undefined) {
        throw new Error('useCart debe ser usado dentro de un CartProvider');
    }
    return context;
}
