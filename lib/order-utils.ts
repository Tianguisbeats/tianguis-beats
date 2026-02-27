/**
 * Genera un ID de pedido amigable basado en el contenido del carrito y la transacción.
 * Formato: [PREFIJO]-[DDMMAA]-[4-DIGITOS]
 * 
 * @param lineItems Array de items de Stripe (expandidos con price.product)
 * @param transactionId ID de Stripe (payment_intent o lookup session)
 * @returns string ID amigable
 */
export function generateFriendlyOrderId(lineItems: any[], transactionId: string): string {
    // 1. Lógica de Prefijos
    const types = new Set(lineItems.map(item => {
        const product = item.price?.product;
        // El tipo suele venir en metadata.type ('beat', 'soundkit', 'service', 'plan')
        return product?.metadata?.type || 'beat';
    }));

    let prefix = 'MX'; // MIXED por defecto si hay varios tipos
    if (types.size === 1) {
        const type = Array.from(types)[0];
        switch (type) {
            case 'beat':
                prefix = 'BT';
                break;
            case 'soundkit':
            case 'sound_kit':
                prefix = 'SK';
                break;
            case 'service':
                prefix = 'SP';
                break;
            case 'plan':
                prefix = 'SU';
                break;
            default:
                prefix = 'MX';
        }
    }

    // 2. Formato de Fecha: DDMMAA
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0'); // Enero es 0
    const aa = String(now.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${aa}`;

    // 3. Identificador Único: Últimos 4 caracteres del transactionId
    // Nos aseguramos de que tenga al menos 4 caracteres
    const safeTxId = transactionId || '0000';
    const uniquePart = safeTxId.slice(-4).toUpperCase();

    // 4. Estructura Final
    return `${prefix}-${dateStr}-${uniquePart}`;
}
