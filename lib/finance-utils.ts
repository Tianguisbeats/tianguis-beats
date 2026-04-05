/**
 * Utilidades financieras para Tianguis Beats
 * Basado en las tasas oficiales de Stripe México (3.6% + $3 MXN + 16% IVA sobre comisión)
 */

export const STRIPE_MEXICO_RATE = 0.036;
export const STRIPE_MEXICO_FIXED = 3;
export const IVA_RATE = 0.16;

export interface EarningDetails {
    originalPrice: number;
    stripeCommission: number;
    ivaOnCommission: number;
    tianguisCommission: number;
    totalDeduction: number;
    netAmount: number;
}

/**
 * Calcula el desglose de ganancias para un precio dado
 * @param price Precio original en MXN
 * @param sellerPlan Plan del vendedor ('free', 'pro', 'premium')
 * @param buyerPlan Plan del comprador (opcional)
 */
export const calculateEarnings = (price: number, sellerPlan: string = 'free', buyerPlan: string = 'free'): EarningDetails => {
    if (isNaN(price) || price <= 0) {
        return {
            originalPrice: 0,
            stripeCommission: 0,
            ivaOnCommission: 0,
            tianguisCommission: 0,
            totalDeduction: 0,
            netAmount: 0
        };
    }

    const stripeCommission = (price * STRIPE_MEXICO_RATE) + STRIPE_MEXICO_FIXED;
    const ivaOnCommission = stripeCommission * IVA_RATE;

    // Lógica: 15% de comisión si el VENDEDOR es Free/Gratis.
    // 0% si el Vendedor es Pro o Premium (incentivo de suscripción).
    const sPlan = (sellerPlan || 'free').toLowerCase().trim();
    const isSellerPaid = ['pro', 'premium', 'tianguis pro', 'tianguis premium'].includes(sPlan);
    
    const tianguisRate = isSellerPaid ? 0 : 0.15;
    const tianguisCommission = price * tianguisRate;

    // El Productor recibe: Precio - (Fees Stripe) - (Comisión Tianguis)
    const totalDeduction = stripeCommission + ivaOnCommission + tianguisCommission;
    const netAmount = price - totalDeduction;

    return {
        originalPrice: price,
        stripeCommission: Number(stripeCommission.toFixed(2)),
        ivaOnCommission: Number(ivaOnCommission.toFixed(2)),
        tianguisCommission: Number(tianguisCommission.toFixed(2)),
        totalDeduction: Number(totalDeduction.toFixed(2)),
        netAmount: Number(netAmount.toFixed(2))
    };
};
