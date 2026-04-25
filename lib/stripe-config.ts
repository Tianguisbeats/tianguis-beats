import Stripe from 'stripe';

/**
 * TIANGUIS BEATS — Configuración Centralizada de Stripe
 *
 * Centraliza:
 *   - Cliente Stripe singleton
 *   - IDs de productos y precios (vía variables de entorno)
 *   - Helpers para detectar tier desde IDs
 *
 * Variables de entorno requeridas:
 *   STRIPE_SECRET_KEY
 *   STRIPE_PRODUCT_PRO         (prod_...)
 *   STRIPE_PRODUCT_PREMIUM     (prod_...)
 *   STRIPE_PRICE_PRO_MENSUAL   (price_...)
 *   STRIPE_PRICE_PRO_ANUAL     (price_...)
 *   STRIPE_PRICE_PREMIUM_MENSUAL
 *   STRIPE_PRICE_PREMIUM_ANUAL
 *
 * Para retrocompatibilidad mientras se migra el .env, los IDs
 * caen a los valores históricos en producción si la env está vacía.
 */

let _stripe: Stripe | null = null;

export function obtenerStripe(): Stripe {
    if (_stripe) return _stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('[Stripe] STRIPE_SECRET_KEY no está definida');
    _stripe = new Stripe(key);
    return _stripe;
}

// IDs de Productos Stripe
export const STRIPE_PRODUCTOS = {
    pro: process.env.STRIPE_PRODUCT_PRO || 'prod_U9hq8ifcXWz0O3',
    premium: process.env.STRIPE_PRODUCT_PREMIUM || 'prod_U9g82c9yHCvLQO',
} as const;

// IDs de Productos Stripe legacy (para detección de tier en webhooks históricos)
export const STRIPE_PRODUCTOS_LEGACY = {
    pro_legacy: process.env.STRIPE_PRODUCT_PRO_LEGACY || 'prod_U9HySOfUW9sLu0',
    premium_legacy: process.env.STRIPE_PRODUCT_PREMIUM_LEGACY || 'prod_U9UPhLb7ISBYhq',
} as const;

// IDs de Precios Stripe
export const STRIPE_PRECIOS = {
    pro_mensual: process.env.STRIPE_PRICE_PRO_MENSUAL || 'price_1TAzIAH5NxxqqE4kYHQgnDil',
    pro_anual: process.env.STRIPE_PRICE_PRO_ANUAL || 'price_1TB0DFH5NxxqqE4kY51i7dkp',
    premium_mensual: process.env.STRIPE_PRICE_PREMIUM_MENSUAL || 'price_1TAzIDH5NxxqqE4k339iqiO5',
    premium_anual: process.env.STRIPE_PRICE_PREMIUM_ANUAL || 'price_1TB057H5NxxqqE4kNxZoU8uY',
} as const;

/**
 * Mapa producto Stripe → tier del sistema.
 */
export const MAPA_PRODUCTO_A_TIER: Record<string, 'pro' | 'premium'> = {
    [STRIPE_PRODUCTOS.pro]: 'pro',
    [STRIPE_PRODUCTOS.premium]: 'premium',
    [STRIPE_PRODUCTOS_LEGACY.pro_legacy]: 'pro',
    [STRIPE_PRODUCTOS_LEGACY.premium_legacy]: 'premium',
};

/**
 * Mapa precio Stripe → tier del sistema.
 */
export const MAPA_PRECIO_A_TIER: Record<string, 'pro' | 'premium'> = {
    [STRIPE_PRECIOS.pro_mensual]: 'pro',
    [STRIPE_PRECIOS.pro_anual]: 'pro',
    [STRIPE_PRECIOS.premium_mensual]: 'premium',
    [STRIPE_PRECIOS.premium_anual]: 'premium',
};

/**
 * IDs de precios anuales (para detección de ciclo).
 */
export const PRECIOS_ANUALES = new Set<string>([
    STRIPE_PRECIOS.pro_anual,
    STRIPE_PRECIOS.premium_anual,
]);

/**
 * Devuelve el priceId Stripe correspondiente a un plan + ciclo.
 */
export function obtenerPrecioStripe(tier: 'pro' | 'premium', ciclo: 'mensual' | 'anual'): string {
    const clave = `${tier}_${ciclo}` as keyof typeof STRIPE_PRECIOS;
    return STRIPE_PRECIOS[clave];
}

/**
 * Detecta el tier de un suscripción inspeccionando productos y precios.
 */
export function detectarTierDesdeStripe(args: {
    productId?: string | null;
    priceId?: string | null;
    productName?: string | null;
}): 'pro' | 'premium' | null {
    const { productId, priceId, productName } = args;

    if (productId && MAPA_PRODUCTO_A_TIER[productId]) return MAPA_PRODUCTO_A_TIER[productId];
    if (priceId && MAPA_PRECIO_A_TIER[priceId]) return MAPA_PRECIO_A_TIER[priceId];

    const nombre = (productName || '').toLowerCase();
    if (nombre.includes('premium')) return 'premium';
    if (nombre.includes('pro')) return 'pro';
    return null;
}
