/**
 * Genera un ID de pedido amigable basado en el contenido del carrito y la transacción.
 * Formato: [PREFIJO]-[DDMMAA]-[4-DIGITOS]
 * 
 * @param lineItems Array de items de Stripe (expandidos con price.product)
 * @param transactionId ID de Stripe (payment_intent o lookup session)
 * @param sessionMetadata Metadatos opcionales de la sesión de Stripe
 * @returns string ID amigable
 */
export function generateFriendlyOrderId(lineItems: any[], transactionId: string, sessionMetadata: any = {}): string {
    // 0. Preparar datos base para el ID
    const now = new Date();
    const dd = String(now.getDate()).padStart(2, '0');
    const mm = String(now.getMonth() + 1).padStart(2, '0');
    const yy = String(now.getFullYear()).slice(-2);
    const dateStr = `${dd}${mm}${yy}`;
    const safeTxId = transactionId || '0000';
    const uniquePart = safeTxId.slice(-4).toUpperCase();

    // 1. Lógica de Prefijos
    const types = new Set(lineItems.map((item, index) => {
        const product = item.price?.product;
        const description = (item.description || '').toLowerCase();
        const productName = (typeof product === 'object' && product?.name || '').toLowerCase();
        
        // 1. Intentar por Metadata del Producto
        let type = 'unknown';
        if (typeof product === 'object' && product?.metadata?.type) {
            type = String(product.metadata.type).toLowerCase().trim();
        }

        // 2. Intentar por Metadata de la Sesión
        if (type === 'unknown' && sessionMetadata?.type) {
            type = String(sessionMetadata.type).toLowerCase().trim();
        }
        
        // 3. Fallback por Nombre y Descripción
        if (type === 'unknown' || type === 'beat') {
            const searchString = `${productName} ${description}`;
            if (searchString.includes('sound kit') || searchString.includes('soundkit')) type = 'sound_kit';
            else if (searchString.includes('suscripción') || searchString.includes('plan') || searchString.includes('subscription')) type = 'plan';
            else if (searchString.includes('servicio') || searchString.includes('service')) type = 'service';
            else if (searchString.includes('licencia') || searchString.includes('beat')) type = 'beat';
        }

        // 4. Normalización final
        let finalType = type;
        if (finalType === 'beats' || finalType === 'beat') finalType = 'beat';
        if (['soundkit', 'kit', 'sound-kit', 'sound_kit', 'sound kit'].includes(finalType)) finalType = 'sound_kit';
        if (['servicio', 'service'].includes(finalType)) finalType = 'service';
        if (['plan', 'subscription', 'suscripcion'].includes(finalType)) finalType = 'plan';
        
        return finalType;
    }));

    // Si hay tipos conocidos, ignoramos los 'unknown' para decidir el prefijo
    const filteredTypes = Array.from(types).filter(t => t !== 'unknown');
    const finalTypes = filteredTypes.length > 0 ? new Set(filteredTypes) : types;

    let prefix = 'MX'; 
    
    // PRIORIDAD 0: Si la sesión de Stripe nos dice explícitamente el tipo global y NO es mixto
    const sessionType = String(sessionMetadata?.type || '').toLowerCase().trim();
    if (sessionType && sessionType !== 'mixed' && sessionType !== 'unknown') {
        switch (sessionType) {
            case 'beat':
            case 'beats':
                return `BT-${dateStr}-${uniquePart}`;
            case 'sound_kit':
            case 'soundkit':
            case 'kit':
                return `SK-${dateStr}-${uniquePart}`;
            case 'plan':
            case 'subscription':
            case 'suscripcion':
                return `SU-${dateStr}-${uniquePart}`;
            case 'service':
            case 'servicio':
                return `SP-${dateStr}-${uniquePart}`;
        }
    }

    // PRIORIDAD 1: Si todos los productos identificados son del mismo tipo
    if (finalTypes.size === 1) {
        const type = Array.from(finalTypes)[0];
        switch (type) {
            case 'beat':
                prefix = 'BT';
                break;
            case 'sound_kit':
                prefix = 'SK';
                break;
            case 'service':
                prefix = 'SP';
                break;
            case 'plan':
            case 'subscription':
                prefix = 'SU';
                break;
            default:
                prefix = 'MX';
        }
    }

    // 4. Estructura Final
    return `${prefix}-${dateStr}-${uniquePart}`;
}
