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
    metadata?: Record<string, any>;
}

export interface Coupon {
    id: string;
    codigo: string;
    porcentaje_descuento: number;
    productor_id?: string | null;
    aplica_a: string; // Using string to avoid strict overlap issues with CartItemType
    nivel_objetivo: string;
    id_cupon_stripe?: string | null;
    texto_descuento?: string | null;
}

/**
 * Helper para verificar si un item del carrito es elegible para un cupón específico.
 * Centraliza la lógica de negocio para Beats, Sound Kits, Servicios y Suscripciones.
 */
export function isItemEligibleForCoupon(item: CartItem, coupon: Coupon): boolean {
    // Estandarización de búsqueda de productor_id en metadatos
    // Helper para extraer ID de string u objeto
    const extractId = (val: any): string => {
        if (!val) return '';
        if (typeof val === 'string') return val.toLowerCase().trim();
        if (typeof val === 'object' && val.id) return String(val.id).toLowerCase().trim();
        return String(val).toLowerCase().trim();
    };

    const itemProducerId = extractId(
        item.metadata?.productor_id || 
        item.metadata?.producerId || 
        item.metadata?.producer_id || 
        item.metadata?.seller_id
    );

    const iType = String(item.type || '').toLowerCase().trim();
    const couponProducerId = extractId(coupon.productor_id);
    const cAppliesTo = String(coupon.aplica_a || '').toLowerCase().trim();
    const cTarget = String(coupon.nivel_objetivo || 'todos').toLowerCase().trim();

    if (!couponProducerId || couponProducerId === 'null') {
        // --- Cupón de administrador (Global o Suscripciones) ---
        if (cAppliesTo === 'suscripciones' && iType === 'plan') {
            const targetTier = String(item.metadata?.tier || '').toLowerCase().trim();
            if (cTarget === 'todos' && targetTier !== 'free') return true;
            if (cTarget === 'pro' && targetTier === 'pro') return true;
            if (cTarget === 'premium' && targetTier === 'premium') return true;
        } else if (cAppliesTo === 'todos') {
            return true;
        }
    } else {
        // --- Cupón de productor (Solo sus productos) ---
        const matchesProducer = itemProducerId === couponProducerId;
        
        if (matchesProducer && iType !== 'plan') {
            if (cAppliesTo === 'todos') return true;
            if ((cAppliesTo === 'beats' || cAppliesTo === 'beat') && (iType === 'beat' || iType === 'beats' || iType === 'license')) return true;
            if ((cAppliesTo === 'sound_kits' || cAppliesTo === 'sound_kit' || cAppliesTo === 'soundkit') && (iType === 'sound_kit' || iType === 'soundkit' || iType === 'sound_kits')) return true;
            if ((cAppliesTo === 'servicios' || cAppliesTo === 'servicio' || cAppliesTo === 'service') && (iType === 'service' || iType === 'servicio' || iType === 'servicios')) return true;
        }
    }
    return false;
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
    isCartOpen: boolean;
    setIsCartOpen: (isOpen: boolean) => void;
    appliedCoupons: Coupon[];
    addCoupon: (coupon: Coupon) => void;
    removeCoupon: (code: string) => void;
    discountAmount: number;
    bulkDiscountAmount: number;
    itemsWithDiscounts: CartItem[];
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
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [appliedCoupons, setAppliedCoupons] = useState<Coupon[]>([]);
    const [bulkDeals, setBulkDeals] = useState<any[]>([]);
    const { showToast } = useToast();

    // Helper to get storage keys
    const getCartKey = (id: string | null) => `tianguis_cart_${id || 'guest'}`;
    const getCouponsKey = (id: string | null) => `tianguis_coupons_${id || 'guest'}`;

    // Get current user and handle session changes
    useEffect(() => {
        const checkUser = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            const userId = session?.user?.id || null;
            setCurrentUserId(userId);
        };
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setCurrentUserId(session?.user?.id || null);
        });

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    // Load and Sync Cart when user changes
    useEffect(() => {
        const loadCart = async () => {
            const cartKey = getCartKey(currentUserId);
            const couponsKey = getCouponsKey(currentUserId);

            let initialItems: CartItem[] = [];
            let initialCoupons: Coupon[] = [];

            if (currentUserId) {
                // --- Usuario Logueado: Priorizar Supabase ---
                const guestCartKey = getCartKey(null);
                const guestCouponsKey = getCouponsKey(null);

                let guestItems: CartItem[] = [];
                let guestCoupons: Coupon[] = [];

                const guestCartData = localStorage.getItem(guestCartKey);
                const guestCouponsData = localStorage.getItem(guestCouponsKey);
                if (guestCartData) { try { guestItems = JSON.parse(guestCartData); } catch(e) {} }
                if (guestCouponsData) { try { guestCoupons = JSON.parse(guestCouponsData); } catch(e) {} }

                // Carga rápida desde localStorage mientras esperamos la BD
                const savedCart = localStorage.getItem(cartKey);
                const savedCoupons = localStorage.getItem(couponsKey);
                if (savedCart) { try { initialItems = JSON.parse(savedCart); } catch (e) {} }
                if (savedCoupons) { try { initialCoupons = JSON.parse(savedCoupons); } catch (e) {} }

                // Cargar desde BD (fuente de verdad para multi-dispositivo)
                const dbItems = await syncCartFromDB(currentUserId);

                if (dbItems.length > 0) {
                    // Fusionar: la BD tiene prioridad
                    const mergedMap = new Map<string, CartItem>();
                    dbItems.forEach(item => mergedMap.set(`${item.id}-${item.type}`, item));
                    // Añadir items locales que no estén en la BD
                    initialItems.forEach(item => {
                        const key = `${item.id}-${item.type}`;
                        if (!mergedMap.has(key)) mergedMap.set(key, item);
                    });
                    initialItems = Array.from(mergedMap.values());
                }

                // Fusionar items del guest y subirlos a la BD
                if (guestItems.length > 0) {
                    const mergedMap = new Map<string, CartItem>();
                    initialItems.forEach(item => mergedMap.set(`${item.id}-${item.type}`, item));
                    const newGuestItems: CartItem[] = [];
                    guestItems.forEach(item => {
                        const key = `${item.id}-${item.type}`;
                        if (!mergedMap.has(key)) {
                            mergedMap.set(key, item);
                            newGuestItems.push(item);
                        }
                    });
                    initialItems = Array.from(mergedMap.values());
                    // Subir items del guest a la BD
                    newGuestItems.forEach(item => syncItemAdd(currentUserId, item));
                    localStorage.removeItem(guestCartKey);
                    if (newGuestItems.length > 0) {
                        setTimeout(() => showToast("Tu carrito fue sincronizado.", "info"), 1000);
                    }
                }

                // Merge coupons guests
                if (guestCoupons.length > 0) {
                    const mergedIds = new Set(initialCoupons.map(c => c.id));
                    guestCoupons.forEach(coupon => {
                        if (!mergedIds.has(coupon.id)) initialCoupons.push(coupon);
                    });
                    localStorage.removeItem(guestCouponsKey);
                }
            } else {
                // --- Guest: Solo localStorage ---
                const savedCart = localStorage.getItem(cartKey);
                const savedCoupons = localStorage.getItem(couponsKey);
                if (savedCart) { try { initialItems = JSON.parse(savedCart); } catch (e) {} }
                if (savedCoupons) { try { initialCoupons = JSON.parse(savedCoupons); } catch (e) {} }
            }

            // Re-validación: Eliminar autocompras si el usuario acaba de loguearse
            if (currentUserId && initialItems.length > 0) {
                const validItems = initialItems.filter(item => {
                    const producerId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId;
                    return producerId !== currentUserId;
                });

                if (validItems.length !== initialItems.length) {
                    initialItems = validItems;
                    showToast("Se eliminaron tus propios productos del carrito.", 'info');
                }
            }

            setItems(initialItems);
            setAppliedCoupons(initialCoupons);
            fetchBulkDeals();
        };

        loadCart();
    }, [currentUserId]);

    // Fetch active bulk deals from DB
    const fetchBulkDeals = async () => {
        try {
            const { data, error } = await supabase
                .from('ofertas_volumen')
                .select('*')
                .eq('es_activa', true);
            
            if (data) setBulkDeals(data);
        } catch (err) {
            console.error("Error fetching bulk deals:", err);
        }
    };

    // Save to localStorage when items or coupons change (Debounced to avoid issues during sync)
    useEffect(() => {
        if (currentUserId !== undefined) {
            const cartKey = getCartKey(currentUserId);
            localStorage.setItem(cartKey, JSON.stringify(items));
        }
    }, [items, currentUserId]);

    useEffect(() => {
        if (currentUserId !== undefined) {
            const couponsKey = getCouponsKey(currentUserId);
            localStorage.setItem(couponsKey, JSON.stringify(appliedCoupons));
        }
    }, [appliedCoupons, currentUserId]);

    // ─── Sincronización con Base de Datos ───────────────────────────────────────

    /**
     * Carga el carrito del usuario desde Supabase y lo fusiona con el carrito local.
     * Prioridad: BD > localStorage (para garantizar que todos los dispositivos estén sincronizados).
     */
    const syncCartFromDB = async (userId: string): Promise<CartItem[]> => {
        try {
            const { data, error } = await supabase
                .from('cart_items')
                .select('*')
                .eq('user_id', userId);

            if (error || !data) return [];

            return data.map((row: any) => ({
                id: row.item_id,
                type: row.item_type as CartItemType,
                name: row.metadata?.name || '',
                price: row.price,
                image: row.metadata?.image,
                subtitle: row.metadata?.subtitle,
                metadata: row.metadata?.extra,
            }));
        } catch {
            return [];
        }
    };

    /** Escribe un item en la BD del usuario logueado. */
    const syncItemAdd = async (userId: string, item: CartItem) => {
        try {
            await supabase.from('cart_items').upsert({
                user_id: userId,
                item_id: item.id,
                item_type: item.type,
                price: item.price,
                metadata: {
                    name: item.name,
                    image: item.image,
                    subtitle: item.subtitle,
                    extra: item.metadata,
                },
            }, { onConflict: 'user_id,item_id,item_type', ignoreDuplicates: false });
        } catch (err) {
            console.error('Cart sync add error:', err);
        }
    };

    /** Elimina un item del carrito en la BD. */
    const syncItemRemove = async (userId: string, itemId: string) => {
        try {
            await supabase.from('cart_items')
                .delete()
                .eq('user_id', userId)
                .eq('item_id', itemId);
        } catch (err) {
            console.error('Cart sync remove error:', err);
        }
    };

    /** Vacía el carrito en la BD del usuario. */
    const syncClearCart = async (userId: string) => {
        try {
            await supabase.from('cart_items')
                .delete()
                .eq('user_id', userId);
        } catch (err) {
            console.error('Cart sync clear error:', err);
        }
    };

    // ─────────────────────────────────────────────────────────────────────────────

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

        // Sincronizar con BD si hay sesión activa
        if (currentUserId) {
            syncItemAdd(currentUserId, item);
        }

        // Tracking: Add to cart event
        const trackAddToCart = async () => {
            try {
                const producerId = item.metadata?.productor_id || item.metadata?.producer_id || item.metadata?.seller_id || item.metadata?.producerId;
                if (producerId) {
                    await supabase.from('analiticas_eventos').insert({
                        productor_id: producerId,
                        beat_id: (item.type === 'beat' || item.type === 'license') ? item.id.split('_')[0] : null,
                        tipo_evento: 'add_to_cart',
                        usuario_id: currentUserId,
                        metadatos: {
                            product_name: item.name,
                            product_type: item.type,
                            price: item.price
                        }
                    });
                }
            } catch (err) {
                // Silent — analytics are non-critical
            }
        };
        trackAddToCart();

        showToast("Agregado al carrito", 'success');
        return true;
    };

    const removeItem = (id: string) => {
        setItems(prev => prev.filter(item => item.id !== id));
        if (currentUserId) {
            syncItemRemove(currentUserId, id);
        }
    };

    const clearCart = () => {
        setItems([]);
        setAppliedCoupons([]);
        if (currentUserId) {
            syncClearCart(currentUserId);
        }
    };

    const isInCart = (id: string) => items.some(item => item.id === id);

    const addCoupon = (coupon: Coupon) => {
        setAppliedCoupons(prev => {
            // Don't add if already applied (check by ID)
            if (prev.some(c => c.id === coupon.id)) return prev;
            return [...prev, coupon];
        });
    };

    const removeCoupon = (id: string) => {
        setAppliedCoupons(prev => prev.filter(c => c.id !== id));
    };

    const total = items.reduce((acc, item) => acc + item.price, 0);
    const itemCount = items.length;

    // Calcular descuento reactivamente basándose en el MEJOR descuento para cada item
    const discountAmount = items.reduce((acc, item) => {
        if (appliedCoupons.length === 0) return acc;

        let bestDiscountPercent = 0;

        appliedCoupons.forEach(coupon => {
            if (isItemEligibleForCoupon(item, coupon)) {
                bestDiscountPercent = Math.max(bestDiscountPercent, coupon.porcentaje_descuento);
            }
        });

        if (bestDiscountPercent > 0) {
            return acc + (item.price * (bestDiscountPercent / 100));
        }

        return acc;
    }, 0);


    // Calcular items con descuentos aplicados (para Checkout)
    const itemsWithDiscounts = React.useMemo(() => {
        if (items.length < 2 || bulkDeals.length === 0) return items;

        const result = [...items];
        const producerGroups: Record<string, number[]> = {};

        // Identificar grupos de beats/licencias por productor
        items.forEach((item, index) => {
            if (item.type !== 'beat' && item.type !== 'license') return;
            const pid = item.metadata?.productor_id || item.metadata?.producerId || item.metadata?.producer_id || item.metadata?.seller_id;
            if (pid) {
                if (!producerGroups[pid]) producerGroups[pid] = [];
                producerGroups[pid].push(index);
            }
        });

        Object.entries(producerGroups).forEach(([pid, indices]) => {
            const deal = bulkDeals.find(d => d.productor_id === pid);
            if (!deal || !deal.es_activa) return;

            const compra = (deal as any).venta_minima ?? (deal as any).compra_qty ?? 2;
            const regala = (deal as any).beats_gratis ?? (deal as any).regala_qty ?? 1;
            const required = compra;
            if (indices.length >= required) {
                const bundleCount = Math.floor(indices.length / required);
                const freeCount = bundleCount * regala;

                // Ordenar indices por precio del item (más barato primero)
                const sortedIndices = [...indices].sort((a, b) => result[a].price - result[b].price);

                // Marcar los N más baratos como gratis
                for (let i = 0; i < freeCount && i < sortedIndices.length; i++) {
                    const idx = sortedIndices[i];
                    result[idx] = {
                        ...result[idx],
                        price: 0,
                        metadata: {
                            ...result[idx].metadata,
                            isBulkFree: true,
                            originalPrice: result[idx].price,
                            bulkDealId: deal.id
                        }
                    };
                }
            }
        });

        return result;
    }, [items, bulkDeals]);

    // Re-calcular bulkDiscountAmount basándose en itemsWithDiscounts para ser consistentes
    const bulkDiscountAmount = React.useMemo(() => {
        return itemsWithDiscounts.reduce((acc, item, idx) => {
            if (item.metadata?.isBulkFree) {
                return acc + (item.metadata.originalPrice || 0);
            }
            return acc;
        }, 0);
    }, [itemsWithDiscounts]);

    return (
        <CartContext.Provider value={{
            items,
            addItem,
            removeItem,
            clearCart,
            total,
            itemCount,
            isInCart,
            currentUserId,
            isCartOpen,
            setIsCartOpen,
            appliedCoupons,
            addCoupon,
            removeCoupon,
            discountAmount,
            bulkDiscountAmount,
            itemsWithDiscounts
        }}>
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
