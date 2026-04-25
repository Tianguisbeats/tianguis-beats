import Stripe from 'stripe';

/**
 * TIANGUIS BEATS — Configuración Centralizada de Stripe
 *
 * Variables de entorno necesarias (6 en total):
 *
 *   STRIPE_SECRET_KEY            (sk_live_... o sk_test_...)
 *   STRIPE_WEBHOOK_SECRET        (whsec_...)
 *   STRIPE_PRICE_PRO_MENSUAL     (price_...)
 *   STRIPE_PRICE_PRO_ANUAL       (price_...)
 *   STRIPE_PRICE_PREMIUM_MENSUAL (price_...)
 *   STRIPE_PRICE_PREMIUM_ANUAL   (price_...)
 *
 * Para alternar Test/Live SIN tocar código:
 *   En Vercel, configura cada variable con valor distinto por
 *   Environment (Production = Live, Preview/Development = Test).
 *
 * NOTA: las "STRIPE_PRODUCT_*" no son necesarias. La detección de
 * tier funciona solo con priceId, y el checkout siempre usa el
 * priceId fijo cuando el plan ya está pre-creado en Stripe.
 *
 * Fallbacks: solo para retrocompatibilidad si la env está vacía
 * en producción. Cuando Vercel tenga las 4 vars STRIPE_PRICE_*
 * configuradas (Production = Live, Preview = Test), elimina los
 * literales hardcoded de abajo y deja que `obtenerPrecioStripe`
 * lance error si falta una env.
 */

let _stripe: Stripe | null = null;

export function obtenerStripe(): Stripe {
    if (_stripe) return _stripe;
    const key = process.env.STRIPE_SECRET_KEY;
    if (!key) throw new Error('[Stripe] STRIPE_SECRET_KEY no está definida');
    _stripe = new Stripe(key);
    return _stripe;
}

export type StripePrecioClave = 'pro_mensual' | 'pro_anual' | 'premium_mensual' | 'premium_anual';

const STRIPE_PRECIO_ENV: Record<StripePrecioClave, string> = {
    pro_mensual: 'STRIPE_PRICE_PRO_MENSUAL',
    pro_anual: 'STRIPE_PRICE_PRO_ANUAL',
    premium_mensual: 'STRIPE_PRICE_PREMIUM_MENSUAL',
    premium_anual: 'STRIPE_PRICE_PREMIUM_ANUAL',
};

/** IDs de los 4 precios de suscripción (los únicos que el flujo necesita) */
export const STRIPE_PRECIOS: Record<StripePrecioClave, string | undefined> = {
    pro_mensual: process.env.STRIPE_PRICE_PRO_MENSUAL || 'price_1TAzIAH5NxxqqE4kYHQgnDil',
    pro_anual: process.env.STRIPE_PRICE_PRO_ANUAL || 'price_1TB0DFH5NxxqqE4kY51i7dkp',
    premium_mensual: process.env.STRIPE_PRICE_PREMIUM_MENSUAL || 'price_1TAzIDH5NxxqqE4k339iqiO5',
    premium_anual: process.env.STRIPE_PRICE_PREMIUM_ANUAL || 'price_1TB057H5NxxqqE4kNxZoU8uY',
};

/** Mapa precio → tier del sistema (única fuente de verdad para detección) */
export const MAPA_PRECIO_A_TIER: Record<string, 'pro' | 'premium'> = Object.fromEntries(
    [
        [STRIPE_PRECIOS.pro_mensual, 'pro'],
        [STRIPE_PRECIOS.pro_anual, 'pro'],
        [STRIPE_PRECIOS.premium_mensual, 'premium'],
        [STRIPE_PRECIOS.premium_anual, 'premium'],
    ].filter((entry): entry is [string, 'pro' | 'premium'] => Boolean(entry[0]))
);

/** Set con los priceIds anuales (para detección de ciclo) */
export const PRECIOS_ANUALES = new Set<string>([
    STRIPE_PRECIOS.pro_anual,
    STRIPE_PRECIOS.premium_anual,
].filter((id): id is string => Boolean(id)));

/** Devuelve el priceId Stripe correspondiente a un plan + ciclo */
export function obtenerPrecioStripe(tier: 'pro' | 'premium', ciclo: 'mensual' | 'anual'): string {
    const clave = `${tier}_${ciclo}` as StripePrecioClave;
    const priceId = STRIPE_PRECIOS[clave];
    if (!priceId) {
        throw new Error(`[Stripe] Falta configurar ${STRIPE_PRECIO_ENV[clave]}`);
    }
    return priceId;
}

/**
 * Detecta el tier de una suscripción a partir del priceId o (fallback)
 * el nombre del producto. El productId NO se usa: si el priceId del
 * suscripción coincide con uno de los 4 conocidos, sabemos el tier.
 */
export function detectarTierDesdeStripe(args: {
    priceId?: string | null;
    productName?: string | null;
}): 'pro' | 'premium' | null {
    const { priceId, productName } = args;

    if (priceId && MAPA_PRECIO_A_TIER[priceId]) return MAPA_PRECIO_A_TIER[priceId];

    const nombre = (productName || '').toLowerCase();
    if (nombre.includes('premium')) return 'premium';
    if (nombre.includes('pro')) return 'pro';
    return null;
}
