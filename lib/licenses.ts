/**
 * TIANGUIS BEATS - Generador de Licencias Dinámicas
 * v1.0 - 2026-02-09
 */

export type LicenseType = 'basic' | 'premium' | 'unlimited' | 'exclusive' | 'soundkit';

interface LicenseData {
    producerName: string;
    buyerName: string;
    beatTitle: string;
    purchaseDate: string;
    amount: string;
}

export const generateLicenseText = (type: LicenseType, data: LicenseData): string => {
    const { producerName, buyerName, beatTitle, purchaseDate, amount } = data;
    const header = `CONTRATO DE LICENCIA DE USO MUSICAL - TIANGUIS BEATS\n` +
        `======================================================\n\n` +
        `FECHA: ${purchaseDate}\n` +
        `PRODUCTOR: ${producerName}\n` +
        `ARTISTA/COMPRADOR: ${buyerName}\n` +
        `OBRA/BEAT: "${beatTitle}"\n` +
        `MONTO PAGADO: ${amount} MXN\n\n`;

    const commonFooter = `\n\n------------------------------------------------------\n` +
        `Este documento sirve como comprobante legal de la licencia adquirida.\n` +
        `Para cualquier aclaración: contacto@tianguisbeats.com\n` +
        `Identificador de Transacción: TB-${Math.random().toString(36).substr(2, 9).toUpperCase()}\n`;

    switch (type) {
        case 'basic':
            return header +
                `1. LICENCIA BÁSICA (MP3)\n` +
                `- Tipo: No Exclusiva.\n` +
                `- Uso: El Productor otorga al Artista el derecho no exclusivo de usar la Obra para crear una (1) nueva canción.\n` +
                `- Límites de Distribución: Hasta 5,000 streams y 500 copias físicas/digitales.\n` +
                `- Videos: 1 Video Musical no monetizado.\n` +
                `- El Productor retiene el 100% de la propiedad de la Obra original.\n` +
                commonFooter;

        case 'premium':
            return header +
                `1. LICENCIA PREMIUM (WAV)\n` +
                `- Tipo: No Exclusiva.\n` +
                `- Uso: El Productor otorga al Artista el derecho no exclusivo de usar la Obra para crear canciones ilimitadas.\n` +
                `- Límites de Distribución: Hasta 50,000 streams y 5,000 copias.\n` +
                `- Videos: Videos ilimitados con monetización básica.\n` +
                `- Presentaciones en Vivo: Hasta $2,000 USD en ganancias.\n` +
                commonFooter;

        case 'unlimited':
            return header +
                `1. LICENCIA ILIMITADA (STEMS)\n` +
                `- Tipo: No Exclusiva.\n` +
                `- Uso: Distribución y Streams ILIMITADOS.\n` +
                `- Archivos: Incluye Trackouts/Stems (pistas separadas).\n` +
                `- Sincronización: Permitida para producciones independientes.\n` +
                `- Monetización Completa: Permitida en todas las plataformas.\n` +
                commonFooter;

        case 'exclusive':
            return header +
                `1. CONTRATO DE COMPRA EXCLUSIVA\n` +
                `- Tipo: Venta Total de Derechos.\n` +
                `- Exclusividad: El Productor garantiza que la Obra será retirada del catálogo y no se venderá a terceros.\n` +
                `- Uso: Ilimitado a perpetuidad en todos los medios existentes.\n` +
                `- Regalías: El Artista es dueño del master, el Productor retiene el 50% de las regalías de publicación (Writer's Share).\n` +
                commonFooter;

        case 'soundkit':
            return header +
                `1. LICENCIA ROYALTY - FREE(SOUND KIT) \n` +
                `- Uso: El comprador puede usar los sonidos para crear nuevas obras musicales sin pagar regalías adicionales.\n` +
                `- Restricción: Queda prohibida la redistribución o reventa de los sonidos individuales.\n` +
                commonFooter;

        default:
            return "Licencia no especificada.";
    }
};
